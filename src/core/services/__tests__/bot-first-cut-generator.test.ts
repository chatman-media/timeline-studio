import { describe, expect, it, vi } from "vitest"
import type { IBotFirstCutPlanner } from "@/core"
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
