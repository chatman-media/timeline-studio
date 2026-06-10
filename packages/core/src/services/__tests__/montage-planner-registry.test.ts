import { afterEach, describe, expect, it, vi } from "vitest"
import {
  clearMontagePlannerBindings,
  getMontagePlannerBindings,
  setMontagePlannerBindings,
  type MontagePlannerBindings,
} from "../montage-planner-registry"

function createBindings(): MontagePlannerBindings {
  return {
    applyPlanToTimeline: vi.fn(() => "applied"),
    ContentAnalyzer: vi.fn(),
    createMarkersFromPlan: vi.fn(),
    DOMAIN_EVENTS: { AI_SERVICES: { CONTENT_ANALYSIS_STARTED: "content-analysis-started" } },
    eventBus: { publish: vi.fn(), subscribe: vi.fn() },
    MomentDetector: vi.fn(),
    montagePlannerMachine: { id: "montage-planner" },
    PlanGenerator: vi.fn(),
    RhythmCalculator: vi.fn(),
    unifiedOrchestrator: { startAnalysis: vi.fn() },
  }
}

describe("montage-planner-registry", () => {
  afterEach(() => {
    clearMontagePlannerBindings()
  })

  it("throws before montage planner bindings are registered", () => {
    expect(() => getMontagePlannerBindings().applyPlanToTimeline()).toThrow(
      'Montage planner binding "applyPlanToTimeline" is not registered',
    )
  })

  it("stores registered montage planner bindings", () => {
    const bindings = createBindings()
    setMontagePlannerBindings(bindings)

    expect(getMontagePlannerBindings().applyPlanToTimeline()).toBe("applied")
  })
})
