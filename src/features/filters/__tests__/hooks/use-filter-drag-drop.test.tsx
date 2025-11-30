/**
 * Tests for useFilterDragDrop hook
 *
 * Tests drag and drop functionality for filters including:
 * - Drag start events
 * - Drag end events
 * - Drop events on clips
 * - Filter data validation
 * - Integration with timeline
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useFilterDragDrop } from "../../hooks/use-filter-drag-drop"
import type { VideoFilter } from "../../types/filters"

// Mock the timeline integration hook
const mockApplyFilterToClip = vi.fn()

vi.mock("../../hooks/use-filter-timeline-integration", () => ({
  useFilterTimelineIntegration: () => ({
    applyFilterToClip: mockApplyFilterToClip,
    removeFilterFromClip: vi.fn(),
    updateFilterParams: vi.fn(),
    getClipFilters: vi.fn(() => []),
  }),
}))

describe("useFilterDragDrop", () => {
  const mockFilter: VideoFilter = {
    id: "test-filter",
    name: "Test Filter",
    category: "color-correction",
    complexity: "basic",
    tags: ["test"],
    description: {
      ru: "Тестовый фильтр",
      en: "Test filter",
    },
    labels: {
      ru: "Тест",
      en: "Test",
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
    },
  }

  // Helper to create mock drag event
  const createMockDragEvent = (_type: string, dataTransferData?: Record<string, string>): React.DragEvent => {
    const dataTransfer = {
      effectAllowed: "none" as DataTransfer["effectAllowed"],
      dropEffect: "none" as DataTransfer["dropEffect"],
      files: [] as any,
      items: [] as any,
      types: dataTransferData ? Object.keys(dataTransferData) : [],
      clearData: vi.fn(),
      getData: vi.fn((format: string) => dataTransferData?.[format] || ""),
      setData: vi.fn(),
      setDragImage: vi.fn(),
    }

    return {
      dataTransfer,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      currentTarget: document.createElement("div"),
      target: document.createElement("div"),
    } as unknown as React.DragEvent
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyFilterToClip.mockReturnValue({
      id: "applied-filter-1",
      filterId: "test-filter",
      params: {},
    })
  })

  describe("onFilterDragStart", () => {
    it("should set drag data with filter information", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragstart")

      act(() => {
        result.current.onFilterDragStart(mockFilter, dragEvent)
      })

      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("application/filter", JSON.stringify(mockFilter))
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("text/plain", mockFilter.name)
    })

    it("should set effectAllowed to copy", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragstart")

      act(() => {
        result.current.onFilterDragStart(mockFilter, dragEvent)
      })

      expect(dragEvent.dataTransfer.effectAllowed).toBe("copy")
    })

    it("should log drag start information", () => {
      const consoleSpy = vi.spyOn(console, "info")
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragstart")

      act(() => {
        result.current.onFilterDragStart(mockFilter, dragEvent)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Filter Drag Drop] Drag start",
        expect.objectContaining({
          filterId: mockFilter.id,
          filterName: mockFilter.name,
        }),
      )

      consoleSpy.mockRestore()
    })
  })

  describe("onFilterDragEnd", () => {
    it("should log drag end information", () => {
      const consoleSpy = vi.spyOn(console, "info")
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragend")

      act(() => {
        result.current.onFilterDragEnd(dragEvent)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Filter Drag Drop] Drag end",
        expect.objectContaining({
          dropEffect: dragEvent.dataTransfer.dropEffect,
        }),
      )

      consoleSpy.mockRestore()
    })

    it("should not throw error when called", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragend")

      expect(() => {
        act(() => {
          result.current.onFilterDragEnd(dragEvent)
        })
      }).not.toThrow()
    })
  })

  describe("isFilterDrag", () => {
    it("should return true when drag contains filter data", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragover", {
        "application/filter": JSON.stringify(mockFilter),
      })

      expect(result.current.isFilterDrag(dragEvent)).toBe(true)
    })

    it("should return false when drag does not contain filter data", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragover", {
        "text/plain": "some text",
      })

      expect(result.current.isFilterDrag(dragEvent)).toBe(false)
    })

    it("should return false for empty drag event", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragover")

      expect(result.current.isFilterDrag(dragEvent)).toBe(false)
    })
  })

  describe("onClipDrop", () => {
    it("should apply filter to clip when valid filter is dropped", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(mockFilter),
      })

      act(() => {
        result.current.onClipDrop("clip-123", dragEvent)
      })

      expect(dragEvent.preventDefault).toHaveBeenCalled()
      expect(dragEvent.stopPropagation).toHaveBeenCalled()
      expect(mockApplyFilterToClip).toHaveBeenCalledWith("clip-123", mockFilter)
    })

    it("should not apply filter when drag is not a filter drag", () => {
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("drop", {
        "text/plain": "some text",
      })

      act(() => {
        result.current.onClipDrop("clip-123", dragEvent)
      })

      expect(dragEvent.preventDefault).toHaveBeenCalled()
      expect(dragEvent.stopPropagation).toHaveBeenCalled()
      expect(mockApplyFilterToClip).not.toHaveBeenCalled()
    })

    it("should warn when filter data is missing", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn")
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("drop", {
        "application/filter": "", // Empty filter data
      })

      act(() => {
        result.current.onClipDrop("clip-123", dragEvent)
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith("[Filter Drag Drop] No filter data in drop event")
      expect(mockApplyFilterToClip).not.toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it("should handle invalid JSON filter data gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error")
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("drop", {
        "application/filter": "invalid-json-{",
      })

      act(() => {
        result.current.onClipDrop("clip-123", dragEvent)
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Filter Drag Drop] Failed to parse filter data", expect.any(Error))
      expect(mockApplyFilterToClip).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it("should log success when filter is applied", () => {
      const consoleInfoSpy = vi.spyOn(console, "info")
      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(mockFilter),
      })

      mockApplyFilterToClip.mockReturnValue({
        id: "applied-filter-456",
        filterId: mockFilter.id,
        params: mockFilter.params,
      })

      act(() => {
        result.current.onClipDrop("clip-123", dragEvent)
      })

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[Filter Drag Drop] Filter applied via drag & drop",
        expect.objectContaining({
          clipId: "clip-123",
          filterId: mockFilter.id,
          filterName: mockFilter.name,
          appliedFilterId: "applied-filter-456",
        }),
      )

      consoleInfoSpy.mockRestore()
    })
  })

  describe("Integration scenarios", () => {
    it("should handle complete drag and drop flow", () => {
      const { result } = renderHook(() => useFilterDragDrop())

      // Start drag
      const dragStartEvent = createMockDragEvent("dragstart")
      act(() => {
        result.current.onFilterDragStart(mockFilter, dragStartEvent)
      })

      expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalled()

      // Drop on clip
      const dropEvent = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(mockFilter),
      })
      act(() => {
        result.current.onClipDrop("clip-123", dropEvent)
      })

      expect(mockApplyFilterToClip).toHaveBeenCalledWith("clip-123", mockFilter)

      // End drag
      const dragEndEvent = createMockDragEvent("dragend")
      act(() => {
        result.current.onFilterDragEnd(dragEndEvent)
      })
    })

    it("should handle multiple filters being dragged", () => {
      const { result } = renderHook(() => useFilterDragDrop())

      const filter1: VideoFilter = { ...mockFilter, id: "filter-1", name: "Filter 1" }
      const filter2: VideoFilter = { ...mockFilter, id: "filter-2", name: "Filter 2" }

      // Drag first filter
      const dragEvent1 = createMockDragEvent("dragstart")
      act(() => {
        result.current.onFilterDragStart(filter1, dragEvent1)
      })

      // Drop first filter
      const dropEvent1 = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(filter1),
      })
      act(() => {
        result.current.onClipDrop("clip-1", dropEvent1)
      })

      // Drag second filter
      const dragEvent2 = createMockDragEvent("dragstart")
      act(() => {
        result.current.onFilterDragStart(filter2, dragEvent2)
      })

      // Drop second filter
      const dropEvent2 = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(filter2),
      })
      act(() => {
        result.current.onClipDrop("clip-2", dropEvent2)
      })

      expect(mockApplyFilterToClip).toHaveBeenCalledTimes(2)
      expect(mockApplyFilterToClip).toHaveBeenNthCalledWith(1, "clip-1", filter1)
      expect(mockApplyFilterToClip).toHaveBeenNthCalledWith(2, "clip-2", filter2)
    })

    it("should handle dropping same filter on multiple clips", () => {
      const { result } = renderHook(() => useFilterDragDrop())

      const dragEvent = createMockDragEvent("dragstart")
      act(() => {
        result.current.onFilterDragStart(mockFilter, dragEvent)
      })

      const dropEvent1 = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(mockFilter),
      })
      act(() => {
        result.current.onClipDrop("clip-1", dropEvent1)
      })

      const dropEvent2 = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(mockFilter),
      })
      act(() => {
        result.current.onClipDrop("clip-2", dropEvent2)
      })

      expect(mockApplyFilterToClip).toHaveBeenCalledTimes(2)
      expect(mockApplyFilterToClip).toHaveBeenNthCalledWith(1, "clip-1", mockFilter)
      expect(mockApplyFilterToClip).toHaveBeenNthCalledWith(2, "clip-2", mockFilter)
    })
  })

  describe("Edge cases", () => {
    it("should handle filter with complex params", () => {
      const complexFilter: VideoFilter = {
        ...mockFilter,
        params: {
          brightness: 0.5,
          contrast: 1.2,
          saturation: 0.9,
          gamma: 1.1,
          temperature: 10,
          tint: -5,
          hue: 15,
          vibrance: 0.3,
          shadows: -0.2,
          highlights: 0.2,
        },
      }

      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragstart")
      act(() => {
        result.current.onFilterDragStart(complexFilter, dragEvent)
      })

      const dropEvent = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(complexFilter),
      })
      act(() => {
        result.current.onClipDrop("clip-123", dropEvent)
      })

      expect(mockApplyFilterToClip).toHaveBeenCalledWith("clip-123", complexFilter)
    })

    it("should handle filter with minimal data", () => {
      const minimalFilter: VideoFilter = {
        id: "minimal",
        name: "Minimal",
        category: "basic",
        complexity: "basic",
        params: {},
      }

      const { result } = renderHook(() => useFilterDragDrop())
      const dragEvent = createMockDragEvent("dragstart")
      act(() => {
        result.current.onFilterDragStart(minimalFilter, dragEvent)
      })

      const dropEvent = createMockDragEvent("drop", {
        "application/filter": JSON.stringify(minimalFilter),
      })
      act(() => {
        result.current.onClipDrop("clip-123", dropEvent)
      })

      expect(mockApplyFilterToClip).toHaveBeenCalledWith("clip-123", minimalFilter)
    })
  })
})
