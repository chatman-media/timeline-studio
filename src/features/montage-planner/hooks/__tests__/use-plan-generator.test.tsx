/**
 * Tests for usePlanGenerator hook
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Fragment, MontagePlan, PlannedClip, Sequence } from "../../types"
import { ClipRole, PacingType, SequencePurpose, SequenceType, SuggestionType, TargetPlatform } from "../../types"

// Helper function to create a valid MontagePlan
function createMontagePlan(
  overrides: Partial<MontagePlan> & { sequences: Sequence[]; totalDuration: number },
): MontagePlan {
  return {
    id: overrides.id || "plan-1",
    name: overrides.name || "Test Plan",
    metadata: overrides.metadata || {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    },
    sequences: overrides.sequences,
    totalDuration: overrides.totalDuration,
    style: overrides.style || {
      id: "test-style",
      name: "Test Style",
      description: "Test style description",
      cutting: {
        averageShotLength: 3,
        variability: 50,
        rhythmComplexity: 60,
      },
      transitions: {
        preferredTypes: ["cut", "fade"],
        frequency: 50,
        complexity: 30,
      },
      emotionalArc: {
        startEnergy: 50,
        peakPosition: 0.5,
        peakEnergy: 80,
        endEnergy: 60,
        variability: 40,
      },
    },
    pacing: overrides.pacing || {
      type: PacingType.Steady,
      averageCutDuration: 3,
      cutDurationRange: [1, 5],
      rhythmComplexity: 50,
    },
    qualityScore: overrides.qualityScore ?? 85,
    engagementScore: overrides.engagementScore ?? 88,
    coherenceScore: overrides.coherenceScore ?? 82,
    transitions: overrides.transitions,
    musicSync: overrides.musicSync,
  }
}

// Mock useMontagePlanner hook
const mockGeneratePlan = vi.fn()
const mockOptimizePlan = vi.fn()
const mockEditFragment = vi.fn()
const mockReorderFragments = vi.fn()

const mockContext = {
  fragments: [] as Fragment[],
  currentPlan: null as MontagePlan | null,
  targetDuration: null as number | null,
  generationOptions: {},
  selectedStyle: "dynamic",
  instructions: "",
  planHistory: [] as MontagePlan[],
}

vi.mock("../use-montage-planner", () => ({
  useMontagePlanner: () => ({
    context: mockContext,
    currentPlan: mockContext.currentPlan,
    isGenerating: false,
    isOptimizing: false,
    generatePlan: mockGeneratePlan,
    optimizePlan: mockOptimizePlan,
    editFragment: mockEditFragment,
    reorderFragments: mockReorderFragments,
  }),
}))

describe("usePlanGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext.currentPlan = null
    mockContext.fragments = []
    mockContext.targetDuration = null
  })

  describe("Initial state", () => {
    it("should provide null plan initially", async () => {
      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.currentPlan).toBeNull()
    })

    it("should expose generation state", async () => {
      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(typeof result.current.isGenerating).toBe("boolean")
      expect(typeof result.current.isOptimizing).toBe("boolean")
    })

    it("should provide action functions", async () => {
      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.generatePlan).toBe(mockGeneratePlan)
      expect(result.current.optimizePlan).toBe(mockOptimizePlan)
      expect(result.current.editFragment).toBe(mockEditFragment)
      expect(result.current.reorderFragments).toBe(mockReorderFragments)
    })
  })

  describe("getSequence", () => {
    it("should get sequence by ID", async () => {
      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Intro,
          duration: 10,
          clips: [],
          transitions: [],
          energyLevel: 50,
          purpose: SequencePurpose.Hook,
          emotionalArc: {
            startEnergy: 40,
            peakEnergy: 60,
            endEnergy: 50,
            peakPosition: 0.5,
            variability: 30,
          },
        },
        {
          id: "seq-2",
          type: SequenceType.Main,
          duration: 60,
          clips: [],
          transitions: [],
          energyLevel: 80,
          purpose: SequencePurpose.Development,
          emotionalArc: {
            startEnergy: 60,
            peakEnergy: 90,
            endEnergy: 70,
            peakPosition: 0.7,
            variability: 50,
          },
        },
      ]

      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 70,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      const sequence = result.current.getSequence("seq-1")

      expect(sequence).toEqual(sequences[0])
      expect(sequence?.id).toBe("seq-1")
      expect(sequence?.type).toBe(SequenceType.Intro)
    })

    it("should return undefined for non-existent sequence", async () => {
      mockContext.currentPlan = createMontagePlan({
        sequences: [],
        totalDuration: 0,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      const sequence = result.current.getSequence("non-existent")

      expect(sequence).toBeUndefined()
    })
  })

  describe("getPlannedClip", () => {
    it("should get clip by fragment ID", async () => {
      const clip: PlannedClip = {
        fragmentId: "fragment-1",
        sequenceOrder: 0,
        role: ClipRole.Hero,
        importance: 90,
        suggestions: [],
      }

      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Main,
          duration: 5,
          clips: [clip],
          transitions: [],
          energyLevel: 70,
          purpose: SequencePurpose.Development,
          emotionalArc: {
            startEnergy: 60,
            peakEnergy: 80,
            endEnergy: 70,
            peakPosition: 0.5,
            variability: 40,
          },
        },
      ]

      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 5,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      const foundClip = result.current.getPlannedClip("fragment-1")

      expect(foundClip).toEqual(clip)
      expect(foundClip?.fragmentId).toBe("fragment-1")
    })

    it("should return undefined for non-existent clip", async () => {
      mockContext.currentPlan = createMontagePlan({
        sequences: [],
        totalDuration: 0,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      const clip = result.current.getPlannedClip("non-existent")

      expect(clip).toBeUndefined()
    })

    it("should search across multiple sequences", async () => {
      const clip1: PlannedClip = {
        fragmentId: "fragment-1",
        sequenceOrder: 0,
        role: ClipRole.Hero,
        importance: 85,
        suggestions: [],
      }

      const clip2: PlannedClip = {
        fragmentId: "fragment-2",
        sequenceOrder: 1,
        role: ClipRole.Supporting,
        importance: 75,
        suggestions: [],
      }

      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Intro,
          duration: 5,
          clips: [clip1],
          transitions: [],
          energyLevel: 50,
          purpose: SequencePurpose.Hook,
          emotionalArc: {
            startEnergy: 40,
            peakEnergy: 60,
            endEnergy: 50,
            peakPosition: 0.5,
            variability: 30,
          },
        },
        {
          id: "seq-2",
          type: SequenceType.Main,
          duration: 5,
          clips: [clip2],
          transitions: [],
          energyLevel: 80,
          purpose: SequencePurpose.Development,
          emotionalArc: {
            startEnergy: 60,
            peakEnergy: 90,
            endEnergy: 70,
            peakPosition: 0.7,
            variability: 50,
          },
        },
      ]

      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 10,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      const foundClip = result.current.getPlannedClip("fragment-2")

      expect(foundClip).toEqual(clip2)
    })
  })

  describe("Plan statistics", () => {
    it("should calculate plan stats", async () => {
      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Intro,
          duration: 10,
          clips: [{}, {}] as PlannedClip[],
          transitions: [],
          energyLevel: 50,
          purpose: SequencePurpose.Hook,
          emotionalArc: {
            startEnergy: 40,
            peakEnergy: 60,
            endEnergy: 50,
            peakPosition: 0.5,
            variability: 30,
          },
        },
        {
          id: "seq-2",
          type: SequenceType.Main,
          duration: 60,
          clips: [{}, {}, {}] as PlannedClip[],
          transitions: [],
          energyLevel: 80,
          purpose: SequencePurpose.Development,
          emotionalArc: {
            startEnergy: 60,
            peakEnergy: 90,
            endEnergy: 70,
            peakPosition: 0.7,
            variability: 50,
          },
        },
        {
          id: "seq-3",
          type: SequenceType.Outro,
          duration: 10,
          clips: [{}] as PlannedClip[],
          transitions: [],
          energyLevel: 40,
          purpose: SequencePurpose.CallToAction,
          emotionalArc: {
            startEnergy: 50,
            peakEnergy: 55,
            endEnergy: 30,
            peakPosition: 0.3,
            variability: 20,
          },
        },
      ]

      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 80,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.planStats).toMatchObject({
        sequenceCount: 3,
        totalClips: 6,
        averageSequenceDuration: (10 + 60 + 10) / 3,
        totalDuration: 80,
        qualityScore: 85,
        engagementScore: 88,
        coherenceScore: 82,
      })

      expect(result.current.planStats?.energyProfile).toHaveLength(3)
      expect(result.current.planStats?.energyProfile[0]).toMatchObject({
        sequenceId: "seq-1",
        type: SequenceType.Intro,
        energy: 50,
      })
    })

    it("should return null when no plan", async () => {
      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.planStats).toBeNull()
    })
  })

  describe("Sequence breakdown", () => {
    it("should provide sequence breakdown", async () => {
      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Intro,
          duration: 10,
          clips: [{}, {}] as PlannedClip[],
          transitions: [{}] as any[],
          energyLevel: 50,
          purpose: SequencePurpose.Hook,
          emotionalArc: {
            startEnergy: 40,
            peakEnergy: 60,
            endEnergy: 50,
            peakPosition: 0.5,
            variability: 30,
          },
        },
      ]

      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 10,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.sequenceBreakdown).toHaveLength(1)
      expect(result.current.sequenceBreakdown[0]).toEqual({
        id: "seq-1",
        type: SequenceType.Intro,
        duration: 10,
        clipCount: 2,
        energyLevel: 50,
        purpose: SequencePurpose.Hook,
        transitionCount: 1,
      })
    })

    it("should return empty array when no plan", async () => {
      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.sequenceBreakdown).toEqual([])
    })
  })

  describe("Fragment usage analysis", () => {
    it("should analyze fragment usage", async () => {
      const fragments: Fragment[] = [
        { id: "f1" } as Fragment,
        { id: "f2" } as Fragment,
        { id: "f3" } as Fragment,
        { id: "f4" } as Fragment,
      ]

      const clips: PlannedClip[] = [
        { fragmentId: "f1" } as PlannedClip,
        { fragmentId: "f2" } as PlannedClip,
        { fragmentId: "f2" } as PlannedClip, // f2 used twice
        { fragmentId: "f3" } as PlannedClip,
      ]

      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Main,
          duration: 20,
          clips,
          transitions: [],
          energyLevel: 70,
          purpose: SequencePurpose.Development,
          emotionalArc: {
            startEnergy: 60,
            peakEnergy: 80,
            endEnergy: 70,
            peakPosition: 0.5,
            variability: 40,
          },
        },
      ]

      mockContext.fragments = fragments
      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 20,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.fragmentUsage.totalFragments).toBe(4)
      expect(result.current.fragmentUsage.usedFragments).toBe(3) // f1, f2, f3
      expect(result.current.fragmentUsage.unusedFragments).toHaveLength(1)
      expect(result.current.fragmentUsage.unusedFragments[0].id).toBe("f4")
      expect(result.current.fragmentUsage.multiUseFragments).toHaveLength(1)
      expect(result.current.fragmentUsage.multiUseFragments[0]).toEqual(["f2", 2])
    })
  })

  describe("Emotional arc", () => {
    it("should provide emotional arc data", async () => {
      const sequences: Sequence[] = [
        {
          id: "seq-1",
          type: SequenceType.Intro,
          duration: 10,
          clips: [],
          transitions: [],
          energyLevel: 50,
          purpose: SequencePurpose.Hook,
          emotionalArc: {
            startEnergy: 40,
            peakEnergy: 60,
            endEnergy: 50,
            peakPosition: 0.5,
            variability: 30,
          },
        },
        {
          id: "seq-2",
          type: SequenceType.Climax,
          duration: 20,
          clips: [],
          transitions: [],
          energyLevel: 95,
          purpose: SequencePurpose.Climax,
          emotionalArc: {
            startEnergy: 70,
            peakEnergy: 100,
            endEnergy: 80,
            peakPosition: 0.7,
            variability: 60,
          },
        },
      ]

      mockContext.currentPlan = createMontagePlan({
        sequences,
        totalDuration: 30,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.emotionalArc).toHaveLength(2)
      expect(result.current.emotionalArc[0]).toEqual({
        sequenceId: "seq-1",
        startEnergy: 40,
        peakEnergy: 60,
        endEnergy: 50,
        peakPosition: 0.5,
      })
      expect(result.current.emotionalArc[1]).toEqual({
        sequenceId: "seq-2",
        startEnergy: 70,
        peakEnergy: 100,
        endEnergy: 80,
        peakPosition: 0.7,
      })
    })

    it("should return empty array when no plan", async () => {
      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.emotionalArc).toEqual([])
    })
  })

  describe("Improvement suggestions", () => {
    it("should suggest improving quality when score is low", async () => {
      mockContext.currentPlan = createMontagePlan({
        sequences: [],
        totalDuration: 60,
        qualityScore: 65,
        engagementScore: 80,
        coherenceScore: 75,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.improvementSuggestions).toContain(
        "Consider replacing low-quality fragments with better alternatives",
      )
    })

    it("should suggest improving engagement when score is low", async () => {
      mockContext.currentPlan = createMontagePlan({
        sequences: [],
        totalDuration: 60,
        qualityScore: 85,
        engagementScore: 55,
        coherenceScore: 75,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.improvementSuggestions).toContain("Add more dynamic transitions or high-action moments")
    })

    it("should suggest trimming when plan is too long", async () => {
      mockContext.currentPlan = createMontagePlan({
        sequences: [],
        totalDuration: 140,
        qualityScore: 85,
        engagementScore: 80,
        coherenceScore: 75,
      })
      mockContext.targetDuration = 120 // Difference > 10

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.improvementSuggestions).toContain("Plan is too long - consider trimming some clips")
    })

    it("should suggest adding content when plan is too short", async () => {
      mockContext.currentPlan = createMontagePlan({
        sequences: [],
        totalDuration: 100,
        qualityScore: 85,
        engagementScore: 80,
        coherenceScore: 75,
      })
      mockContext.targetDuration = 120 // Difference > 10

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.improvementSuggestions).toContain(
        "Plan is too short - add more content or extend key moments",
      )
    })

    it("should suggest using more fragments when many are unused", async () => {
      mockContext.fragments = Array.from({ length: 10 }, (_, i) => ({ id: `f${i}` }) as Fragment)
      mockContext.currentPlan = createMontagePlan({
        sequences: [
          {
            id: "seq-1",
            type: SequenceType.Main,
            duration: 20,
            clips: [{ fragmentId: "f1" }, { fragmentId: "f2" }] as PlannedClip[], // Only 2 used out of 10
            transitions: [],
            energyLevel: 70,
            purpose: SequencePurpose.Development,
            emotionalArc: {
              startEnergy: 60,
              peakEnergy: 80,
              endEnergy: 70,
              peakPosition: 0.5,
              variability: 40,
            },
          },
        ],
        totalDuration: 20,
      })

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.improvementSuggestions).toContain(
        "Many fragments are unused - consider incorporating more variety",
      )
    })

    it("should return empty suggestions when plan is optimal", async () => {
      mockContext.fragments = Array.from({ length: 5 }, (_, i) => ({ id: `f${i}` }) as Fragment)
      mockContext.currentPlan = createMontagePlan({
        sequences: [
          {
            id: "seq-1",
            type: SequenceType.Main,
            duration: 120,
            clips: Array.from({ length: 4 }, (_, i) => ({ fragmentId: `f${i}` }) as PlannedClip),
            transitions: [],
            energyLevel: 70,
            purpose: SequencePurpose.Development,
            emotionalArc: {
              startEnergy: 60,
              peakEnergy: 80,
              endEnergy: 70,
              peakPosition: 0.5,
              variability: 40,
            },
          },
        ],
        totalDuration: 120,
      })
      mockContext.targetDuration = 120

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.improvementSuggestions).toEqual([])
    })
  })

  describe("Context exposure", () => {
    it("should expose generation options", async () => {
      mockContext.generationOptions = { maxClips: 20 }

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.generationOptions).toEqual({ maxClips: 20 })
    })

    it("should expose selected style", async () => {
      mockContext.selectedStyle = "cinematic"

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.selectedStyle).toBe("cinematic")
    })

    it("should expose target duration", async () => {
      mockContext.targetDuration = 180

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.targetDuration).toBe(180)
    })

    it("should expose instructions", async () => {
      mockContext.instructions = "Create a dynamic highlight reel"

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.instructions).toBe("Create a dynamic highlight reel")
    })

    it("should expose plan history", async () => {
      mockContext.planHistory = [{}, {}] as MontagePlan[]

      const { usePlanGenerator } = await import("../use-plan-generator")
      const { result } = renderHook(() => usePlanGenerator())

      expect(result.current.planHistory).toHaveLength(2)
    })
  })
})
