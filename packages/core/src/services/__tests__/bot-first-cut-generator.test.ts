import { describe, expect, it, vi } from "vitest"
import type { IBotFirstCutPlanner, IScriptGenerator } from "@timeline-studio/core"
import { createBotProjectSchemaFromRenderJob, DefaultBotFirstCutGenerator } from "../index"
import {
  FIRST_CUT_PLANNER_INVALID_FIXTURES,
  FIRST_CUT_PLANNER_VALID_FIXTURES,
} from "./fixtures/first-cut-planner-fixtures"

describe("DefaultBotFirstCutGenerator", () => {
  it("uses a valid planner result and creates revision zero", async () => {
    const project = createProject()
    const planner: IBotFirstCutPlanner = {
      generatePlan: vi.fn(async () => ({
        projectSchema: project,
        provider: "montage-plan" as const,
        summary: "Planner first cut",
      })),
    }
    const generator = new DefaultBotFirstCutGenerator({
      planner,
      now: () => "2026-06-09T03:00:00.000Z",
    })

    const result = await generator.generateFirstCut({
      sessionId: "edit:telegram:chat-1:user-1",
      sourceMessageId: "message-1",
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      goal: "make a promo",
      publishDestination: "telegram",
    })

    expect(result).toMatchObject({
      provider: "montage-plan",
      summary: "Planner first cut",
      revision: {
        id: "edit:telegram:chat-1:user-1:revision:0",
        index: 0,
        instruction: "make a promo",
        sourceMessageId: "message-1",
        createdAt: "2026-06-09T03:00:00.000Z",
      },
    })
    expect(planner.generatePlan).toHaveBeenCalledOnce()
  })

  it("falls back to deterministic assembly when planner output is invalid", async () => {
    const planner: IBotFirstCutPlanner = {
      generatePlan: vi.fn(async () => ({
        projectSchema: {} as never,
        provider: "llm-plan" as const,
        summary: "Invalid LLM output",
      })),
    }
    const generator = new DefaultBotFirstCutGenerator({
      planner,
      now: () => "2026-06-09T03:00:00.000Z",
    })

    const result = await generator.generateFirstCut({
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      goal: "make a promo",
      targetDurationSeconds: 12,
      publishDestination: "telegram",
    })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.projectSchema.timeline.duration).toBe(12)
    expect(result.projectSchema.tracks[0]?.clips).toHaveLength(1)
    expect(result.diagnostics).toEqual([
      expect.stringContaining("Planner llm-plan output failed ProjectSchema validation"),
    ])
  })

  it.each(FIRST_CUT_PLANNER_VALID_FIXTURES)("accepts valid planner fixture output for $id", async (fixture) => {
    const planner: IBotFirstCutPlanner = {
      generatePlan: vi.fn(async () => ({
        projectSchema: fixture.projectSchema,
        provider: fixture.provider,
        summary: `${fixture.provider} fixture first cut`,
        diagnostics: fixture.diagnostics,
        metadata: { fixtureId: fixture.id },
      })),
    }
    const generator = new DefaultBotFirstCutGenerator({
      planner,
      now: () => "2026-06-09T03:10:00.000Z",
    })

    const result = await generator.generateFirstCut({
      sessionId: "edit:telegram:chat-1:user-1",
      sourceMessageId: "message-fixture",
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      goal: "make a fixture promo",
      publishDestination: "telegram",
    })

    expect(result).toMatchObject({
      provider: fixture.provider,
      projectSchema: fixture.projectSchema,
      summary: `${fixture.provider} fixture first cut`,
      diagnostics: fixture.diagnostics ?? [],
      metadata: { fixtureId: fixture.id },
      revision: {
        id: "edit:telegram:chat-1:user-1:revision:0",
        index: 0,
        projectSchema: fixture.projectSchema,
        createdAt: "2026-06-09T03:10:00.000Z",
      },
    })
  })

  it.each(FIRST_CUT_PLANNER_INVALID_FIXTURES)("falls back for invalid planner fixture output $id", async (fixture) => {
    const planner: IBotFirstCutPlanner = {
      generatePlan: vi.fn(async () => ({
        projectSchema: fixture.projectSchema as never,
        provider: fixture.provider,
        summary: `${fixture.provider} invalid fixture`,
        metadata: { fixtureId: fixture.id },
      })),
    }
    const generator = new DefaultBotFirstCutGenerator({
      planner,
      now: () => "2026-06-09T03:11:00.000Z",
    })

    const result = await generator.generateFirstCut({
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
      goal: "make a fixture promo",
      targetDurationSeconds: 12,
      publishDestination: "telegram",
    })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.projectSchema.timeline.duration).toBe(12)
    expect(result.diagnostics).toEqual([
      expect.stringContaining(`Planner ${fixture.provider} output failed ProjectSchema validation`),
    ])
    expect(result.diagnostics[0]).toContain(fixture.expectedDiagnostic)
  })

  it("includes planner error diagnostics when falling back", async () => {
    const planner: IBotFirstCutPlanner = {
      generatePlan: vi.fn(async () => {
        throw new Error("planner unavailable")
      }),
    }
    const generator = new DefaultBotFirstCutGenerator({
      planner,
    })

    const result = await generator.generateFirstCut({
      sourceMedia: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.diagnostics).toEqual(["Planner failed; using deterministic fallback: planner unavailable"])
  })

  it("can fail instead of falling back when configured", async () => {
    const planner: IBotFirstCutPlanner = {
      generatePlan: vi.fn(async () => {
        throw new Error("planner unavailable")
      }),
    }
    const generator = new DefaultBotFirstCutGenerator({
      planner,
      fallbackToDeterministic: false,
    })

    await expect(
      generator.generateFirstCut({
        sourceMedia: [{ type: "file", value: "/tmp/input.mp4" }],
      }),
    ).rejects.toThrow("planner unavailable")
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

describe("DefaultBotFirstCutGenerator — script generator integration", () => {
  const MEDIA = [{ type: "file" as const, value: "/tmp/input.mp4", name: "input.mp4" }]

  it("calls scriptGenerator with goal when request has no script", async () => {
    const scriptGenerator: IScriptGenerator = {
      generateScript: vi.fn(async () => ({
        script: {
          title: "Promo",
          hook: "Watch this!",
          scenes: [{ index: 0, shot: "product close-up", voiceover: "Meet our product." }],
        },
        provider: "llm-script" as const,
        summary: "LLM storyboard",
        diagnostics: [],
      })),
    }
    const generator = new DefaultBotFirstCutGenerator({ scriptGenerator })

    const result = await generator.generateFirstCut({ sourceMedia: MEDIA, goal: "create a promo" })

    expect(scriptGenerator.generateScript).toHaveBeenCalledOnce()
    expect(result.provider).toBe("deterministic-fallback")
  })

  it("skips scriptGenerator when request already has script", async () => {
    const scriptGenerator: IScriptGenerator = {
      generateScript: vi.fn(async () => {
        throw new Error("should not be called")
      }),
    }
    const generator = new DefaultBotFirstCutGenerator({ scriptGenerator })

    const existingScript = {
      scenes: [{ index: 0, shot: "existing", voiceover: "already there" }],
    }

    await generator.generateFirstCut({ sourceMedia: MEDIA, goal: "ignored", script: existingScript })

    expect(scriptGenerator.generateScript).not.toHaveBeenCalled()
  })

  it("skips scriptGenerator when goal is absent", async () => {
    const scriptGenerator: IScriptGenerator = {
      generateScript: vi.fn(),
    }
    const generator = new DefaultBotFirstCutGenerator({ scriptGenerator })

    await generator.generateFirstCut({ sourceMedia: MEDIA })

    expect(scriptGenerator.generateScript).not.toHaveBeenCalled()
  })

  it("carries on without script when scriptGenerator fails", async () => {
    const scriptGenerator: IScriptGenerator = {
      generateScript: vi.fn(async () => {
        throw new Error("LLM error")
      }),
    }
    const generator = new DefaultBotFirstCutGenerator({ scriptGenerator })

    const result = await generator.generateFirstCut({ sourceMedia: MEDIA, goal: "some idea" })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.diagnostics.some((d) => d.includes("storyboard"))).toBe(true)
  })

  it("stores script in project params when script is present", async () => {
    const scriptGenerator: IScriptGenerator = {
      generateScript: vi.fn(async () => ({
        script: {
          title: "My Reel",
          hook: "Check this out",
          scenes: [{ index: 0, shot: "wide shot", voiceover: "Here we go." }],
        },
        provider: "deterministic-fallback" as const,
        summary: "",
        diagnostics: [],
      })),
    }
    const generator = new DefaultBotFirstCutGenerator({ scriptGenerator })

    const result = await generator.generateFirstCut({ sourceMedia: MEDIA, goal: "My Reel idea" })

    const params = (result.projectSchema as { settings?: { custom?: { bot?: { params?: Record<string, unknown> } } } })
      ?.settings?.custom?.bot?.params
    expect(params?.script).toBeDefined()
    expect(params?.hook).toBe("Check this out")
  })
})
