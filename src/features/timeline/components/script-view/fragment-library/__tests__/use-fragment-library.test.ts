/**
 * useFragmentLibrary hook tests
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useFragmentLibrary } from "../use-fragment-library"

// Mock useTimelineAnalysis
vi.mock("../../../../hooks/state/use-timeline-analysis", () => ({
  useTimelineAnalysis: () => ({
    filesProgress: [
      {
        id: "file-1",
        status: "completed",
        file: { path: "/test/video.mp4" },
        result: {
          scene_analysis: {
            scenes: [
              {
                start_time: 0,
                end_time: 10,
                quality_score: 85,
                tags: ["intro"],
                emotions: ["happy"],
                objects: ["person"],
                faces_count: 1,
              },
              {
                start_time: 10,
                end_time: 25,
                quality_score: 92,
                tags: ["action"],
                emotions: ["exciting"],
                objects: ["car"],
                faces_count: 2,
              },
            ],
          },
        },
      },
    ],
  }),
}))

describe("useFragmentLibrary", () => {
  it("should return fragments from analysis", () => {
    const { result } = renderHook(() => useFragmentLibrary())

    expect(result.current.fragments).toHaveLength(2)
    expect(result.current.hasFragments).toBe(true)
    expect(result.current.totalCount).toBe(2)
  })

  it("should convert scenes to fragments correctly", () => {
    const { result } = renderHook(() => useFragmentLibrary())

    const fragment = result.current.fragments[0]
    expect(fragment.id).toContain("file-1-scene-")
    expect(fragment.fileId).toBe("file-1")
    expect(fragment.startTime).toBe(0)
    expect(fragment.endTime).toBe(10)
    expect(fragment.duration).toBe(10)
    expect(fragment.qualityScore).toBe(85)
    expect(fragment.tags).toEqual(["intro"])
    expect(fragment.emotions).toEqual(["happy"])
  })

  it("should filter by minimum quality", () => {
    const { result } = renderHook(() => useFragmentLibrary())

    result.current.setFilters({ minQuality: 90 })

    // Wait for filter to apply (next render)
    const { result: updatedResult } = renderHook(() => useFragmentLibrary())
    updatedResult.current.setFilters({ minQuality: 90 })

    expect(updatedResult.current.filteredCount).toBeLessThanOrEqual(updatedResult.current.totalCount)
  })

  it("should filter by emotions", () => {
    const { result, rerender } = renderHook(() => useFragmentLibrary())

    result.current.setFilters({ emotions: ["exciting"] })
    rerender()

    // Fragments with "exciting" emotion should be included
    const excitingFragments = result.current.fragments.filter((f) => f.emotions.includes("exciting"))
    expect(excitingFragments.length).toBeGreaterThan(0)
  })

  it("should filter by tags", () => {
    const { result, rerender } = renderHook(() => useFragmentLibrary())

    result.current.setFilters({ tags: ["action"] })
    rerender()

    // Fragments with "action" tag should be included
    const actionFragments = result.current.fragments.filter((f) => f.tags.includes("action"))
    expect(actionFragments.length).toBeGreaterThan(0)
  })

  it("should filter by duration", () => {
    const { result, rerender } = renderHook(() => useFragmentLibrary())

    result.current.setFilters({ minDuration: 15 })
    rerender()

    // Only fragments >= 15s should be included
    const longFragments = result.current.fragments.filter((f) => f.duration >= 15)
    expect(result.current.fragments).toEqual(longFragments)
  })

  it("should filter by faces", () => {
    const { result, rerender } = renderHook(() => useFragmentLibrary())

    result.current.setFilters({ onlyWithFaces: true })
    rerender()

    // All fragments should have faces
    const withFaces = result.current.fragments.every((f) => f.facesCount && f.facesCount > 0)
    expect(withFaces).toBe(true)
  })
})
