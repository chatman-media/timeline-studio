/**
 * Tests for useFilterTimelineIntegration hook
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useFilterTimelineIntegration } from "../../hooks/use-filter-timeline-integration"
import type { VideoFilter } from "../../types/filters"

describe("useFilterTimelineIntegration", () => {
  const mockFilter: VideoFilter = {
    id: "test-filter-1",
    name: "Test Filter",
    category: "color-correction",
    complexity: "basic",
    tags: ["test"],
    description: { en: "Test filter" },
    labels: { en: "Test" },
    params: {
      brightness: 0.1,
      contrast: 1.2,
      saturation: 0.9,
    },
  }

  describe("createAppliedFilter", () => {
    it("should create an AppliedFilter from VideoFilter", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      const appliedFilter = result.current.createAppliedFilter(mockFilter)

      expect(appliedFilter).toBeDefined()
      expect(appliedFilter.filterId).toBe(mockFilter.id)
      expect(appliedFilter.customParams).toEqual(mockFilter.params)
      expect(appliedFilter.isEnabled).toBe(true)
      expect(appliedFilter.order).toBe(0)
    })

    it("should use custom params when provided", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      const customParams = { brightness: 0.5, contrast: 1.5 }
      const appliedFilter = result.current.createAppliedFilter(mockFilter, customParams)

      expect(appliedFilter.customParams).toEqual(customParams)
    })

    it("should generate unique IDs", async () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      const filter1 = result.current.createAppliedFilter(mockFilter)
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1))
      const filter2 = result.current.createAppliedFilter(mockFilter)

      expect(filter1.id).not.toBe(filter2.id)
    })
  })

  describe("applyFilterToClip", () => {
    it("should create and return AppliedFilter", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      const clipId = "clip-1"
      const appliedFilter = result.current.applyFilterToClip(clipId, mockFilter)

      expect(appliedFilter).toBeDefined()
      expect(appliedFilter.filterId).toBe(mockFilter.id)
    })

    it("should use custom params when provided", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      const customParams = { brightness: 0.3 }
      const appliedFilter = result.current.applyFilterToClip("clip-1", mockFilter, customParams)

      expect(appliedFilter.customParams).toEqual(customParams)
    })
  })

  describe("removeFilterFromClip", () => {
    it("should not throw error", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      expect(() => {
        result.current.removeFilterFromClip("clip-1", "filter-1")
      }).not.toThrow()
    })
  })

  describe("updateFilterParams", () => {
    it("should not throw error", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      expect(() => {
        result.current.updateFilterParams("clip-1", "filter-1", { brightness: 0.5 })
      }).not.toThrow()
    })
  })

  describe("getClipFilters", () => {
    it("should return empty array initially", () => {
      const { result } = renderHook(() => useFilterTimelineIntegration())

      const filters = result.current.getClipFilters("clip-1")

      expect(filters).toEqual([])
    })
  })
})
