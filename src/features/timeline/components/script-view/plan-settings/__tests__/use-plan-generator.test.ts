/**
 * usePlanGenerator hook tests
 */

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { ScriptFragment } from "@/features/timeline/types/script"

import { usePlanGenerator } from "../use-plan-generator"

const mockFragments: ScriptFragment[] = [
  {
    id: "frag-1",
    fileId: "file-1",
    startTime: 0,
    endTime: 10,
    duration: 10,
    qualityScore: 85,
    tags: [],
    emotions: [],
    objects: [],
  },
  {
    id: "frag-2",
    fileId: "file-1",
    startTime: 10,
    endTime: 25,
    duration: 15,
    qualityScore: 92,
    tags: [],
    emotions: [],
    objects: [],
  },
  {
    id: "frag-3",
    fileId: "file-1",
    startTime: 25,
    endTime: 40,
    duration: 15,
    qualityScore: 78,
    tags: [],
    emotions: [],
    objects: [],
  },
]

describe("usePlanGenerator", () => {
  it("should start with no error and not generating", () => {
    const { result } = renderHook(() => usePlanGenerator())

    expect(result.current.isGenerating).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should generate a plan from fragments", async () => {
    const { result } = renderHook(() => usePlanGenerator())

    let plan
    await act(async () => {
      plan = await result.current.generatePlan({
        style: "dynamic-action",
        targetDuration: 30,
        fragments: mockFragments,
      })
    })

    expect(plan).toBeDefined()
    expect(plan?.style).toBe("dynamic-action")
    expect(plan?.targetDuration).toBe(30)
    expect(plan?.scenes.length).toBeGreaterThan(0)
  })

  it("should prioritize high quality fragments", async () => {
    const { result } = renderHook(() => usePlanGenerator())

    let plan
    await act(async () => {
      plan = await result.current.generatePlan({
        style: "cinematic-drama",
        targetDuration: 20,
        fragments: mockFragments,
        prioritizeQuality: true,
      })
    })

    // Should include fragment with quality 92 first
    const firstScene = plan?.scenes[0]
    const firstFragment = mockFragments.find(f => f.id === firstScene?.fragmentId)
    expect(firstFragment?.qualityScore).toBe(92)
  })

  it("should set appropriate transitions for style", async () => {
    const { result } = renderHook(() => usePlanGenerator())

    let plan
    await act(async () => {
      plan = await result.current.generatePlan({
        style: "dynamic-action",
        targetDuration: 50,
        fragments: mockFragments,
      })
    })

    // Dynamic action should use CUT transitions
    const transitions = plan?.scenes.slice(1).map(s => s.transition) || []
    expect(transitions.every(t => t === "CUT")).toBe(true)
  })

  it("should calculate plan stats correctly", async () => {
    const { result } = renderHook(() => usePlanGenerator())

    let plan
    await act(async () => {
      plan = await result.current.generatePlan({
        style: "music-video",
        targetDuration: 30,
        fragments: mockFragments,
      })
    })

    expect(plan?.stats.totalScenes).toBe(plan?.scenes.length)
    expect(plan?.stats.totalTransitions).toBe((plan?.scenes.length || 0) - 1)
    expect(plan?.stats.qualityScore).toBeGreaterThan(0)
  })

  it("should respect target duration", async () => {
    const { result } = renderHook(() => usePlanGenerator())

    let plan
    await act(async () => {
      plan = await result.current.generatePlan({
        style: "social-media",
        targetDuration: 15,
        fragments: mockFragments,
      })
    })

    // Total duration should be close to target
    expect(plan?.stats.totalDuration).toBeLessThanOrEqual(20) // With some tolerance
  })

  it("should set pace level based on style", async () => {
    const { result } = renderHook(() => usePlanGenerator())

    let fastPlan
    await act(async () => {
      fastPlan = await result.current.generatePlan({
        style: "dynamic-action",
        targetDuration: 30,
        fragments: mockFragments,
      })
    })

    let slowPlan
    await act(async () => {
      slowPlan = await result.current.generatePlan({
        style: "cinematic-drama",
        targetDuration: 30,
        fragments: mockFragments,
      })
    })

    expect(fastPlan?.settings.paceLevel).toBeGreaterThan(slowPlan?.settings.paceLevel || 0)
  })
})
