import { describe, expect, it, vi } from "vitest"
import type { IScriptPlanner } from "@timeline-studio/core"
import {
  createDeterministicScriptDraft,
  DefaultScriptGenerator,
  normalizeScriptDraft,
  validateScriptDraftShape,
} from "../script-generator"

const IDEA_SHORT = "Show how our product saves time."
const IDEA_MULTI =
  "Our product saves time. It is easy to use. You will love it."

describe("validateScriptDraftShape", () => {
  it("accepts a valid draft", () => {
    expect(
      validateScriptDraftShape({
        scenes: [{ index: 0, shot: "close-up of product", voiceover: "Save time every day." }],
      }),
    ).toEqual([])
  })

  it("rejects non-object", () => {
    expect(validateScriptDraftShape(null)).toContain("script must be an object")
  })

  it("rejects empty scenes array", () => {
    expect(validateScriptDraftShape({ scenes: [] })).toContain("script.scenes must be a non-empty array")
  })

  it("rejects scene with missing shot", () => {
    const errors = validateScriptDraftShape({ scenes: [{ index: 0, shot: "", voiceover: "hello" }] })
    expect(errors.some((e) => e.includes("shot"))).toBe(true)
  })

  it("rejects scene with missing voiceover", () => {
    const errors = validateScriptDraftShape({ scenes: [{ index: 0, shot: "wide shot", voiceover: "  " }] })
    expect(errors.some((e) => e.includes("voiceover"))).toBe(true)
  })
})

describe("createDeterministicScriptDraft", () => {
  it("produces a draft with at least one scene", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_SHORT }, 3)
    expect(draft.scenes.length).toBeGreaterThanOrEqual(1)
  })

  it("respects the scene count upper bound", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_MULTI }, 3)
    expect(draft.scenes.length).toBeLessThanOrEqual(3)
  })

  it("sets a hook from the first sentence", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_MULTI }, 3)
    expect(draft.hook).toBeTruthy()
  })

  it("sets a title from the idea", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_SHORT }, 1)
    expect(draft.title).toBeTruthy()
  })

  it("distributes duration across scenes when provided", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_MULTI, targetDurationSeconds: 30 }, 3)
    const withDuration = draft.scenes.filter((s) => s.durationSeconds !== undefined)
    expect(withDuration.length).toBeGreaterThan(0)
  })

  it("carries targetPlatform and language through", () => {
    const draft = createDeterministicScriptDraft(
      { idea: IDEA_SHORT, targetPlatform: "tiktok", language: "ru" },
      2,
    )
    expect(draft.targetPlatform).toBe("tiktok")
    expect(draft.language).toBe("ru")
  })

  it("clamps scene count to 1 minimum", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_SHORT }, 0)
    expect(draft.scenes.length).toBeGreaterThanOrEqual(1)
  })

  it("clamps scene count to 12 maximum", () => {
    const draft = createDeterministicScriptDraft({ idea: IDEA_MULTI }, 100)
    expect(draft.scenes.length).toBeLessThanOrEqual(12)
  })
})

describe("normalizeScriptDraft", () => {
  const request = { idea: IDEA_SHORT, targetPlatform: "instagram", language: "en" }

  it("re-sequences scene indices from 0", () => {
    const draft = {
      scenes: [
        { index: 5, shot: "wide", voiceover: "hello" },
        { index: 9, shot: "close", voiceover: "world" },
      ],
    }
    const normalized = normalizeScriptDraft(draft, request)
    expect(normalized.scenes[0].index).toBe(0)
    expect(normalized.scenes[1].index).toBe(1)
  })

  it("inherits platform/language from request when draft omits them", () => {
    const draft = { scenes: [{ index: 0, shot: "shot", voiceover: "voice" }] }
    const normalized = normalizeScriptDraft(draft, request)
    expect(normalized.targetPlatform).toBe("instagram")
    expect(normalized.language).toBe("en")
  })

  it("trims whitespace from shot and voiceover", () => {
    const draft = { scenes: [{ index: 0, shot: "  wide  ", voiceover: "  hi  " }] }
    const normalized = normalizeScriptDraft(draft, request)
    expect(normalized.scenes[0].shot).toBe("wide")
    expect(normalized.scenes[0].voiceover).toBe("hi")
  })
})

describe("DefaultScriptGenerator", () => {
  it("calls planner and returns result when valid", async () => {
    const plannerDraft = {
      title: "Product Promo",
      hook: "Save time now.",
      scenes: [
        { index: 0, shot: "product on desk", voiceover: "Meet our product." },
        { index: 1, shot: "happy user", voiceover: "You will love it." },
      ],
    }
    const planner: IScriptPlanner = {
      generateScriptPlan: vi.fn(async () => ({
        script: plannerDraft,
        provider: "llm-script" as const,
        summary: "LLM storyboard",
      })),
    }
    const generator = new DefaultScriptGenerator({ planner })

    const result = await generator.generateScript({ idea: IDEA_SHORT })

    expect(result.provider).toBe("llm-script")
    expect(result.script.scenes.length).toBe(2)
    expect(planner.generateScriptPlan).toHaveBeenCalledOnce()
  })

  it("falls back to deterministic when planner returns invalid draft", async () => {
    const planner: IScriptPlanner = {
      generateScriptPlan: vi.fn(async () => ({
        script: { scenes: [] } as never,
        provider: "llm-script" as const,
      })),
    }
    const generator = new DefaultScriptGenerator({ planner })

    const result = await generator.generateScript({ idea: IDEA_SHORT })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.diagnostics.some((d) => d.includes("validation"))).toBe(true)
  })

  it("falls back to deterministic when planner throws", async () => {
    const planner: IScriptPlanner = {
      generateScriptPlan: vi.fn(async () => {
        throw new Error("LLM unreachable")
      }),
    }
    const generator = new DefaultScriptGenerator({ planner })

    const result = await generator.generateScript({ idea: IDEA_SHORT })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.diagnostics.some((d) => d.includes("LLM unreachable"))).toBe(true)
  })

  it("throws when fallbackToDeterministic is false and planner fails", async () => {
    const planner: IScriptPlanner = {
      generateScriptPlan: vi.fn(async () => {
        throw new Error("network error")
      }),
    }
    const generator = new DefaultScriptGenerator({ planner, fallbackToDeterministic: false })

    await expect(generator.generateScript({ idea: IDEA_SHORT })).rejects.toThrow("network error")
  })

  it("uses deterministic path without planner", async () => {
    const generator = new DefaultScriptGenerator()

    const result = await generator.generateScript({ idea: IDEA_MULTI, sceneCount: 2 })

    expect(result.provider).toBe("deterministic-fallback")
    expect(result.script.scenes.length).toBeGreaterThanOrEqual(1)
    expect(result.script.scenes.length).toBeLessThanOrEqual(2)
  })

  it("throws when idea is empty", async () => {
    const generator = new DefaultScriptGenerator()

    await expect(generator.generateScript({ idea: "  " })).rejects.toThrow("idea")
  })

  it("uses defaultSceneCount from options", async () => {
    const generator = new DefaultScriptGenerator({ defaultSceneCount: 1 })

    const result = await generator.generateScript({ idea: IDEA_MULTI })

    expect(result.script.scenes.length).toBe(1)
  })
})
