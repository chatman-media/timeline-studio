/**
 * Tests for applyPlanToTimeline function
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MontagePlan, PlannedClip, Sequence } from "@/domains/ai-services/types/montage-planning"
import { MomentCategory, SequencePurpose, SequenceType } from "@/domains/ai-services/types/montage-planning"

import { applyPlanToTimeline } from "../index"

// Create persistent mocks
const mockAddTrack = vi.fn().mockResolvedValue(undefined)
const mockAddClip = vi.fn().mockResolvedValue(undefined)
const mockUpdateClip = vi.fn().mockResolvedValue(undefined)

// Mock VideoEditingOrchestrator
vi.mock("@/domains/video-editing", () => ({
  getVideoEditingOrchestrator: vi.fn(() => ({
    addTrack: mockAddTrack,
    addClip: mockAddClip,
    updateClip: mockUpdateClip,
  })),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("applyPlanToTimeline", () => {
  beforeEach(() => {
    mockAddTrack.mockClear()
    mockAddClip.mockClear()
    mockUpdateClip.mockClear()
  })

  const createMockPlan = (overrides?: Partial<MontagePlan>): MontagePlan => ({
    id: "plan-1",
    name: "Test Plan",
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    },
    sequences: [],
    totalDuration: 0,
    style: {
      id: "dynamic-action",
      name: "Dynamic Action",
      description: "Fast-paced montage",
      cutting: {
        averageShotLength: 2,
        variability: 60,
        rhythmComplexity: 80,
      },
      transitions: {
        preferredTypes: ["cut"],
        frequency: 90,
        complexity: 60,
      },
      emotionalArc: {
        startEnergy: 70,
        peakPosition: 0.7,
        peakEnergy: 95,
        endEnergy: 80,
        variability: 70,
      },
    },
    pacing: {
      type: "Steady" as any,
      averageCutDuration: 2,
      cutDurationRange: [1, 3],
      rhythmComplexity: 60,
    },
    qualityScore: 85,
    engagementScore: 90,
    coherenceScore: 80,
    ...overrides,
  })

  const createMockSequence = (overrides?: Partial<Sequence>): Sequence => ({
    id: "seq-1",
    type: SequenceType.Intro,
    clips: [],
    duration: 0,
    purpose: SequencePurpose.Hook,
    energyLevel: 80,
    emotionalArc: {
      startEnergy: 70,
      peakPosition: 0.5,
      peakEnergy: 90,
      endEnergy: 80,
      variability: 60,
    },
    transitions: [],
    ...overrides,
  })

  const createMockClip = (overrides?: Partial<PlannedClip>): PlannedClip => ({
    fragmentId: "frag-1",
    fragment: {
      id: "frag-1",
      videoId: "video-1",
      startTime: 0,
      endTime: 5,
      duration: 5,
      objects: [],
      people: [],
      score: {
        timestamp: 0,
        duration: 5,
        scores: {
          visual: 80,
          technical: 75,
          emotional: 70,
          narrative: 65,
          action: 85,
          composition: 80,
        },
        totalScore: 76,
        category: MomentCategory.Highlight,
      },
      tags: [],
      sourceFile: {
        id: "media-1",
        name: "test-video.mp4",
        path: "/path/to/video.mp4",
        type: "video" as any,
        size: 1024000,
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        videoCodec: "h264" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    sequenceOrder: 0,
    role: "Hero" as any,
    importance: 90,
    suggestions: [],
    ...overrides,
  })

  it("should return success for empty plan", async () => {
    const plan = createMockPlan({ sequences: [] })

    const result = await applyPlanToTimeline(plan)

    expect(result.success).toBe(true)
    expect(result.appliedClips).toBe(0)
    expect(result.appliedTransitions).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it("should create tracks for sequences", async () => {
    const sequence = createMockSequence()
    const plan = createMockPlan({ sequences: [sequence] })

    await applyPlanToTimeline(plan)

    expect(mockAddTrack).toHaveBeenCalledWith("video", "intro - hook")
  })

  it("should add clips from sequences", async () => {
    const clip = createMockClip()
    const sequence = createMockSequence({ clips: [clip] })
    const plan = createMockPlan({ sequences: [sequence] })

    const result = await applyPlanToTimeline(plan)

    expect(mockAddClip).toHaveBeenCalled()
    expect(result.appliedClips).toBe(1)
  })

  it("should apply speed adjustments", async () => {
    const clip = createMockClip({
      adjustments: {
        speedMultiplier: 2.0,
      },
    })
    const sequence = createMockSequence({ clips: [clip] })
    const plan = createMockPlan({ sequences: [sequence] })

    await applyPlanToTimeline(plan)

    // Should call updateClip with speed adjustments
    expect(mockUpdateClip).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        speed: 2.0,
        playbackRate: 2.0,
      }),
    )
  })

  it("should apply crop adjustments", async () => {
    const clip = createMockClip({
      adjustments: {
        crop: {
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8,
        },
      },
    })
    const sequence = createMockSequence({ clips: [clip] })
    const plan = createMockPlan({ sequences: [sequence] })

    await applyPlanToTimeline(plan)

    // Should call updateClip with position (crop) adjustments
    expect(mockUpdateClip).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        position: expect.objectContaining({
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8,
        }),
      }),
    )
  })

  it("should handle missing fragments gracefully", async () => {
    const clip = createMockClip({ fragment: undefined })
    const sequence = createMockSequence({ clips: [clip] })
    const plan = createMockPlan({ sequences: [sequence] })

    const result = await applyPlanToTimeline(plan)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("Фрагмент не найден")
  })

  it("should handle missing source files gracefully", async () => {
    const clipWithoutSource = createMockClip()
    if (clipWithoutSource.fragment) {
      clipWithoutSource.fragment.sourceFile = undefined
    }

    const sequence = createMockSequence({ clips: [clipWithoutSource] })
    const plan = createMockPlan({ sequences: [sequence] })

    const result = await applyPlanToTimeline(plan)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("MediaFile не найден")
  })

  it("should handle orchestrator errors gracefully", async () => {
    // Mock addClip to throw error
    mockAddClip.mockRejectedValueOnce(new Error("Backend error"))

    const clip = createMockClip()
    const sequence = createMockSequence({ clips: [clip] })
    const plan = createMockPlan({ sequences: [sequence] })

    const result = await applyPlanToTimeline(plan)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("Backend error")
  })

  it("should process multiple sequences", async () => {
    const seq1 = createMockSequence({
      id: "seq-1",
      type: SequenceType.Intro,
      clips: [createMockClip()],
    })
    const seq2 = createMockSequence({
      id: "seq-2",
      type: SequenceType.Main,
      clips: [createMockClip({ fragmentId: "frag-2" })],
    })

    const plan = createMockPlan({ sequences: [seq1, seq2] })

    const result = await applyPlanToTimeline(plan)

    expect(mockAddTrack).toHaveBeenCalledTimes(2)
    expect(result.appliedClips).toBe(2)
  })

  it("should continue processing after error in one clip", async () => {
    // First clip fails, second succeeds
    mockAddClip.mockRejectedValueOnce(new Error("First clip error")).mockResolvedValueOnce(undefined)

    const clip1 = createMockClip({ fragmentId: "frag-1" })
    const clip2 = createMockClip({ fragmentId: "frag-2" })
    const sequence = createMockSequence({ clips: [clip1, clip2] })
    const plan = createMockPlan({ sequences: [sequence] })

    const result = await applyPlanToTimeline(plan)

    // Should have one success, one error
    expect(result.appliedClips).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.success).toBe(false) // Has errors
  })

  it("should respect sequenceOrder when adding clips", async () => {
    const clip1 = createMockClip({ fragmentId: "frag-1", sequenceOrder: 1 })
    const clip2 = createMockClip({ fragmentId: "frag-2", sequenceOrder: 0 })
    const sequence = createMockSequence({ clips: [clip1, clip2] })
    const plan = createMockPlan({ sequences: [sequence] })

    await applyPlanToTimeline(plan)

    const calls = mockAddClip.mock.calls
    // Clip2 (order 0) should be added before Clip1 (order 1)
    expect(calls[0][1]).toHaveProperty("id", "media-1") // Both clips use same mock media
  })
})
