/**
 * useScriptPlan hook tests
 */

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { ScriptFragment } from "@/features/timeline/types/script"

import { useScriptPlan } from "../use-script-plan"

const mockFragment: ScriptFragment = {
  id: "frag-1",
  fileId: "file-1",
  startTime: 0,
  endTime: 10,
  duration: 10,
  qualityScore: 85,
  tags: [],
  emotions: [],
  objects: [],
}

describe("useScriptPlan", () => {
  it("should start with no plan", () => {
    const { result } = renderHook(() => useScriptPlan())
    expect(result.current.plan).toBeNull()
  })

  it("should create a new plan", () => {
    const { result } = renderHook(() => useScriptPlan())

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    expect(result.current.plan).not.toBeNull()
    expect(result.current.plan?.name).toBe("Test Plan")
    expect(result.current.plan?.style).toBe("dynamic-action")
    expect(result.current.plan?.targetDuration).toBe(120)
    expect(result.current.plan?.scenes).toEqual([])
  })

  it("should add scene to plan", () => {
    const { result } = renderHook(() => useScriptPlan())

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    act(() => {
      result.current.addScene(mockFragment)
    })

    expect(result.current.plan?.scenes).toHaveLength(1)
    expect(result.current.plan?.scenes[0].fragmentId).toBe("frag-1")
    expect(result.current.plan?.scenes[0].duration).toBe(10)
    expect(result.current.plan?.stats.totalScenes).toBe(1)
    expect(result.current.plan?.stats.totalDuration).toBe(10)
  })

  it("should remove scene from plan", () => {
    const { result } = renderHook(() => useScriptPlan())

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    act(() => {
      result.current.addScene(mockFragment)
    })

    const sceneId = result.current.plan!.scenes[0].id

    act(() => {
      result.current.removeScene(sceneId)
    })

    expect(result.current.plan?.scenes).toHaveLength(0)
    expect(result.current.plan?.stats.totalScenes).toBe(0)
    expect(result.current.plan?.stats.totalDuration).toBe(0)
  })

  it("should update scene order", () => {
    const { result } = renderHook(() => useScriptPlan())

    const fragment2 = { ...mockFragment, id: "frag-2" }

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    act(() => {
      result.current.addScene(mockFragment)
      result.current.addScene(fragment2)
    })

    const scene1Id = result.current.plan!.scenes[0].id
    const scene2Id = result.current.plan!.scenes[1].id

    // Reverse order
    act(() => {
      result.current.reorderScenes([scene2Id, scene1Id])
    })

    expect(result.current.plan?.scenes[0].id).toBe(scene2Id)
    expect(result.current.plan?.scenes[1].id).toBe(scene1Id)
    expect(result.current.plan?.scenes[0].order).toBe(0)
    expect(result.current.plan?.scenes[1].order).toBe(1)
  })

  it("should update plan settings", () => {
    const { result } = renderHook(() => useScriptPlan())

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    act(() => {
      result.current.updateSettings({ syncWithMusic: true, paceLevel: 80 })
    })

    expect(result.current.plan?.settings.syncWithMusic).toBe(true)
    expect(result.current.plan?.settings.paceLevel).toBe(80)
  })

  it("should clear plan", () => {
    const { result } = renderHook(() => useScriptPlan())

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    act(() => {
      result.current.clearPlan()
    })

    expect(result.current.plan).toBeNull()
  })

  it("should update total duration when adding scenes", () => {
    const { result } = renderHook(() => useScriptPlan())

    const fragment2 = { ...mockFragment, id: "frag-2", duration: 15 }

    act(() => {
      result.current.createPlan("Test Plan", "dynamic-action", 120)
    })

    act(() => {
      result.current.addScene(mockFragment) // 10s
      result.current.addScene(fragment2) // 15s
    })

    expect(result.current.plan?.stats.totalDuration).toBe(25)
  })
})
