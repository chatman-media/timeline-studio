import { describe, expect, it, vi } from "vitest"
import type { AIProjectEditorResult, IAIProjectEditor } from "@/core"
import {
  createBotProjectSchemaFromRenderJob,
  runAIProjectEdit,
  validateAIProjectEditRequest,
  validateAIProjectEditResult,
} from "../index"

describe("AI project editor contract", () => {
  it("validates project edit requests before invoking an editor", async () => {
    const editor: IAIProjectEditor = {
      editProject: vi.fn(async () => validResult(createProject())),
    }

    const result = await runAIProjectEdit(editor, {
      currentProject: {} as never,
      sourceMedia: [{ type: "file", value: "" }],
      userInstruction: " ",
    })

    expect(result).toMatchObject({
      ok: false,
      attempts: 0,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: "invalid_project" }),
        expect.objectContaining({ code: "missing_instruction" }),
        expect.objectContaining({ code: "invalid_media" }),
      ]),
    })
    expect(editor.editProject).not.toHaveBeenCalled()
  })

  it("returns a validated edit result for a valid editor output", async () => {
    const project = createProject()
    const editor: IAIProjectEditor = {
      editProject: vi.fn(async () => validResult(project)),
    }

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      userInstruction: "trim the intro",
      targetPlatform: "telegram",
    })

    expect(result).toMatchObject({
      ok: true,
      attempts: 1,
      warnings: [],
      result: {
        summary: "Trimmed intro",
        changedAreas: ["clips"],
      },
    })
    expect(editor.editProject).toHaveBeenCalledOnce()
  })

  it("supports repair attempts for invalid AI output", async () => {
    const project = createProject()
    const brokenResult: AIProjectEditorResult = {
      nextProject: project,
      summary: "",
      changedAreas: [],
      commands: [],
      diagnostics: [],
    }
    const editor: IAIProjectEditor = {
      editProject: vi.fn(async () => brokenResult),
      repairProjectEdit: vi.fn(async () => validResult(project)),
    }

    const result = await runAIProjectEdit(
      editor,
      {
        currentProject: project,
        sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
        userInstruction: "trim the intro",
      },
      { maxRepairAttempts: 1 },
    )

    expect(result).toMatchObject({
      ok: true,
      attempts: 2,
      result: {
        summary: "Trimmed intro",
      },
    })
    expect(editor.repairProjectEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "missing_summary" }),
          expect.objectContaining({ code: "missing_commands" }),
        ]),
        attempt: 1,
      }),
    )
  })

  it("validates request and result shapes directly", () => {
    const project = createProject()

    expect(
      validateAIProjectEditRequest({
        currentProject: project,
        sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
        userInstruction: "add captions",
      }),
    ).toEqual([])

    expect(
      validateAIProjectEditResult(
        { currentProject: project, sourceMedia: [], userInstruction: "x" },
        validResult(project),
      ),
    ).toEqual([])
  })
})

function createProject() {
  const project = createBotProjectSchemaFromRenderJob({
    source: "bot",
    media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    output: { format: "mp4", destination: "telegram" },
  })
  if (!project) throw new Error("Expected project")
  return project
}

function validResult(project: ReturnType<typeof createProject>): AIProjectEditorResult {
  return {
    nextProject: {
      ...project,
      metadata: {
        ...project.metadata,
        modified_at: "2026-06-09T02:00:00.000Z",
      },
    },
    summary: "Trimmed intro",
    changedAreas: ["clips"],
    commands: [
      {
        type: "trim_clip",
        targetId: "clip-1",
        params: { start: 1 },
      },
    ],
    diagnostics: [{ level: "info", message: "ok" }],
  }
}
