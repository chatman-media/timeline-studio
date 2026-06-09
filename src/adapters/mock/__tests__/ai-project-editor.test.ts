import { describe, expect, it } from "vitest"
import { createBotProjectSchemaFromRenderJob, runAIProjectEdit } from "@/core"
import { MockAIProjectEditor } from "../ai-project-editor"

describe("MockAIProjectEditor", () => {
  it("applies deterministic metadata edits without mutating the input project", async () => {
    const project = createProject()
    const editor = new MockAIProjectEditor({
      now: () => "2026-06-09T02:00:00.000Z",
    })

    const result = await runAIProjectEdit(editor, {
      currentProject: project,
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      userInstruction: "make the ending faster",
      targetPlatform: "telegram",
      revisionHistory: [
        {
          id: "revision-0",
          index: 0,
          summary: "First cut",
          createdAt: "2026-06-09T01:00:00.000Z",
        },
      ],
    })

    expect(result).toMatchObject({
      ok: true,
      result: {
        summary: "Applied instruction: make the ending faster",
        commands: [
          {
            type: "custom",
            params: {
              instruction: "make the ending faster",
            },
          },
        ],
      },
    })
    if (!result.ok) throw new Error("Expected valid edit result")
    expect(project.metadata.modified_at).not.toBe("2026-06-09T02:00:00.000Z")
    expect(result.result.nextProject.settings.custom.aiProjectEditor).toEqual({
      lastInstruction: "make the ending faster",
      targetPlatform: "telegram",
      sourceMediaCount: 1,
      revisionCount: 1,
      updatedAt: "2026-06-09T02:00:00.000Z",
    })
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
