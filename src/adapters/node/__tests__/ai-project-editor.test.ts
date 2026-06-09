import { describe, expect, it, vi } from "vitest"
import { createBotProjectSchemaFromRenderJob, runAIProjectEdit, validateAIProjectEditResult } from "@/core"
import { createNodeServices, NodeAIProjectEditor, type NodeAIProjectEditorFetch } from "../index"
import {
  AI_PROJECT_EDITOR_INVALID_RESPONSE_FIXTURE,
  AI_PROJECT_EDITOR_VALID_FIXTURES,
} from "./fixtures/ai-project-editor-fixtures"

describe("NodeAIProjectEditor", () => {
  it("calls an OpenAI-compatible chat endpoint and returns a valid edit result", async () => {
    const project = createProject()
    const nextProject = {
      ...project,
      metadata: {
        ...project.metadata,
        modified_at: "2026-06-09T10:00:00.000Z",
      },
    }
    const fetch = createFetch({
      choices: [
        {
          message: {
            content: JSON.stringify({
              nextProject,
              summary: "Trimmed the intro and kept the rest of the timeline.",
              changedAreas: ["tracks.0.clips.0"],
              commands: [
                {
                  type: "trim_clip",
                  targetId: "clip-0",
                  params: { source_start: 1.5 },
                  rationale: "User asked to make the intro shorter.",
                },
              ],
              diagnostics: [{ level: "info", message: "Edit applied.", code: "edit_applied" }],
              metadata: {
                changedClipCount: 1,
                apiKey: "provider-secret",
                nested: {
                  accessToken: "nested-secret",
                  safe: "kept",
                },
              },
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    })
    const editor = new NodeAIProjectEditor({
      apiKey: "test-key",
      apiUrl: "https://llm.example/v1/",
      provider: "test-provider",
      model: "editor-model",
      fetch,
    })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      userInstruction: "trim the intro",
      targetPlatform: "telegram",
      revisionHistory: [
        {
          id: "revision-0",
          index: 0,
          instruction: "first cut",
          summary: "Initial preview",
          createdAt: "2026-06-09T09:00:00.000Z",
        },
      ],
      metadata: {
        sessionId: "edit:telegram:chat-1:user-1",
        currentArtifact: { path: "/tmp/preview.mp4" },
      },
    })

    expect(result).toMatchObject({
      ok: true,
      attempts: 1,
      result: {
        summary: "Trimmed the intro and kept the rest of the timeline.",
        changedAreas: ["tracks.0.clips.0"],
        commands: [expect.objectContaining({ type: "trim_clip", targetId: "clip-0" })],
        diagnostics: [expect.objectContaining({ level: "info", code: "edit_applied" })],
        metadata: expect.objectContaining({
          provider: "test-provider",
          model: "editor-model",
          promptId: "ai-project-editor/v1",
          changedClipCount: 1,
          apiKey: "[redacted]",
          nested: {
            accessToken: "[redacted]",
            safe: "kept",
          },
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      },
    })
    expect(JSON.stringify(result)).not.toContain("provider-secret")
    expect(JSON.stringify(result)).not.toContain("nested-secret")
    expect(fetch).toHaveBeenCalledWith(
      "https://llm.example/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    )
    const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body))
    expect(body).toMatchObject({
      model: "editor-model",
      response_format: { type: "json_object" },
    })
    expect(body.messages[1].content).toContain("trim the intro")
    expect(body.messages[1].content).toContain("revision-0")
    expect(body.messages[1].content).toContain("currentArtifact")
  })

  it("returns an actionable no-op result when API key config is missing", async () => {
    const project = createProject()
    const fetch = createFetch({})
    const editor = new NodeAIProjectEditor({ fetch, now: () => "2026-06-09T11:00:00.000Z" })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      userInstruction: "add captions",
    })

    expect(result).toMatchObject({
      ok: true,
      result: {
        nextProject: project,
        summary: "No AI edit was applied; the current project was preserved.",
        commands: [expect.objectContaining({ type: "custom" })],
        diagnostics: [expect.objectContaining({ level: "error", code: "missing_api_key" })],
        metadata: expect.objectContaining({ noop: true, generatedAt: "2026-06-09T11:00:00.000Z" }),
      },
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("returns an actionable no-op result when provider HTTP fails", async () => {
    const project = createProject()
    const fetch = vi.fn(async () => new Response("bad gateway", { status: 502, statusText: "Bad Gateway" }))
    const editor = new NodeAIProjectEditor({ apiKey: "test-key", fetch })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      userInstruction: "make it shorter",
    })

    expect(result).toMatchObject({
      ok: true,
      result: {
        nextProject: project,
        diagnostics: [
          expect.objectContaining({
            level: "error",
            code: "provider_http_error",
            message: expect.stringContaining("HTTP 502"),
          }),
        ],
      },
    })
  })

  it("keeps the current project when provider output is invalid", async () => {
    const project = createProject()
    const fetch = createFetch({
      choices: [
        {
          message: {
            content: JSON.stringify({
              nextProject: { tracks: [] },
              summary: "",
              commands: [],
              diagnostics: [],
            }),
          },
        },
      ],
    })
    const editor = new NodeAIProjectEditor({ apiKey: "test-key", fetch })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      userInstruction: "add title",
    })

    expect(result).toMatchObject({
      ok: true,
      result: {
        nextProject: project,
        diagnostics: [expect.objectContaining({ level: "error", code: "provider_invalid_output" })],
      },
    })
  })

  it("keeps the current project when provider returns invalid JSON", async () => {
    const project = createProject()
    const fetch = createFetch({
      choices: [
        {
          message: {
            content: "not json",
          },
        },
      ],
    })
    const editor = new NodeAIProjectEditor({ apiKey: "test-key", fetch })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      userInstruction: "add title",
    })

    expect(result).toMatchObject({
      ok: true,
      result: {
        nextProject: project,
        diagnostics: [expect.objectContaining({ level: "error", code: "provider_invalid_json" })],
      },
    })
  })

  it.each(AI_PROJECT_EDITOR_VALID_FIXTURES)("accepts valid fixture provider output for $id", async (fixture) => {
    const project = createProject()
    const fixtureResult = fixture.createResult(project)
    const fetch = createFetch({
      choices: [
        {
          message: {
            content: JSON.stringify(fixtureResult),
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 200 },
    })
    const editor = new NodeAIProjectEditor({
      apiKey: "test-key",
      provider: "fixture-provider",
      model: "fixture-model",
      fetch,
    })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      userInstruction: fixture.instruction,
      ...(fixture.targetPlatform ? { targetPlatform: fixture.targetPlatform } : {}),
    })

    expect(result).toMatchObject({
      ok: true,
      attempts: 1,
      result: {
        summary: fixtureResult.summary,
        changedAreas: fixtureResult.changedAreas,
        commands: fixtureResult.commands.map((command) => expect.objectContaining({ type: command.type })),
        diagnostics: fixtureResult.diagnostics.map((diagnostic) =>
          expect.objectContaining({ level: diagnostic.level, code: diagnostic.code }),
        ),
        metadata: expect.objectContaining({
          provider: "fixture-provider",
          model: "fixture-model",
          promptId: "ai-project-editor/v1",
          fixtureId: fixture.id,
        }),
      },
    })
    if (!result.ok) throw new Error("Expected fixture provider output to validate")
    expect(
      validateAIProjectEditResult(
        { currentProject: project, sourceMedia: [], userInstruction: fixture.instruction },
        result.result,
      ),
    ).toEqual([])
  })

  it("keeps the current project for invalid fixture provider output", async () => {
    const project = createProject()
    const fetch = createFetch({
      choices: [
        {
          message: {
            content: JSON.stringify(AI_PROJECT_EDITOR_INVALID_RESPONSE_FIXTURE.response),
          },
        },
      ],
    })
    const editor = new NodeAIProjectEditor({ apiKey: "test-key", fetch })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      userInstruction: AI_PROJECT_EDITOR_INVALID_RESPONSE_FIXTURE.instruction,
    })

    expect(result).toMatchObject({
      ok: true,
      result: {
        nextProject: project,
        diagnostics: [
          expect.objectContaining({
            level: "error",
            code: "provider_invalid_output",
            message: expect.stringContaining("version must be a non-empty string"),
          }),
        ],
        metadata: expect.objectContaining({
          noop: true,
        }),
      },
    })
  })

  it("creates the adapter through node service factories", () => {
    const services = createNodeServices({
      autoConnect: false,
      aiProjectEditor: {
        apiKey: "test-key",
        fetch: createFetch({}),
      },
    })

    expect(services.aiProjectEditor).toBeInstanceOf(NodeAIProjectEditor)
  })
})

function createFetch(payload: unknown): NodeAIProjectEditorFetch {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  ) as NodeAIProjectEditorFetch
}

function createProject() {
  const project = createBotProjectSchemaFromRenderJob({
    source: "bot",
    media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    output: { format: "mp4", destination: "telegram" },
  })
  if (!project) throw new Error("Expected project")
  return project
}
