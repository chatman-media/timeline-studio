/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для хука useTimelineSelection
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TimelineProviders } from "@/test/test-utils"

import { useTimelineSelection } from "../use-timeline-selection"

describe("useTimelineSelection", () => {
  describe("Hook Initialization", () => {
    it("should be defined and exportable", () => {
      expect(useTimelineSelection).toBeDefined()
      expect(typeof useTimelineSelection).toBe("function")
    })

    it("should return object with all required properties and methods", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      // Current selection
      expect(result.current).toHaveProperty("selectedClips")
      expect(result.current).toHaveProperty("selectedTracks")
      expect(result.current).toHaveProperty("selectedSections")

      // Selection state
      expect(result.current).toHaveProperty("hasSelection")
      expect(result.current).toHaveProperty("selectionCount")
      expect(result.current).toHaveProperty("selectionBounds")

      // Selection actions
      expect(result.current).toHaveProperty("selectClip")
      expect(result.current).toHaveProperty("selectTrack")
      expect(result.current).toHaveProperty("selectSection")
      expect(result.current).toHaveProperty("selectMultiple")
      expect(result.current).toHaveProperty("selectAll")
      expect(result.current).toHaveProperty("selectNone")
      expect(result.current).toHaveProperty("invertSelection")

      // Area selection
      expect(result.current).toHaveProperty("selectInTimeRange")
      expect(result.current).toHaveProperty("selectByType")

      // Operations on selected
      expect(result.current).toHaveProperty("deleteSelected")
      expect(result.current).toHaveProperty("duplicateSelected")
      expect(result.current).toHaveProperty("groupSelected")
      expect(result.current).toHaveProperty("ungroupSelected")

      // Properties of selected
      expect(result.current).toHaveProperty("setSelectedVolume")
      expect(result.current).toHaveProperty("setSelectedSpeed")
      expect(result.current).toHaveProperty("setSelectedOpacity")
      expect(result.current).toHaveProperty("muteSelected")
      expect(result.current).toHaveProperty("unmuteSelected")
      expect(result.current).toHaveProperty("lockSelected")
      expect(result.current).toHaveProperty("unlockSelected")

      // Clipboard operations
      expect(result.current).toHaveProperty("copySelected")
      expect(result.current).toHaveProperty("cutSelected")
      expect(result.current).toHaveProperty("pasteAtTime")

      // Utilities
      expect(result.current).toHaveProperty("isClipSelected")
      expect(result.current).toHaveProperty("isTrackSelected")
      expect(result.current).toHaveProperty("isSectionSelected")
      expect(result.current).toHaveProperty("getSelectionStats")
    })
  })

  describe("Default State", () => {
    it("should return empty arrays and false states by default", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.selectedClips).toEqual([])
      expect(result.current.selectedTracks).toEqual([])
      expect(result.current.selectedSections).toEqual([])
      expect(result.current.hasSelection).toBe(false)
    })

    it("should return default selection count", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.selectionCount).toEqual({
        clips: 0,
        tracks: 0,
        sections: 0,
        total: 0,
      })
    })

    it("should return null selection bounds", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.selectionBounds).toBeNull()
    })
  })

  describe("Selection State Checks", () => {
    it("should return false for non-selected items", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.isClipSelected("non-existent-clip")).toBe(false)
      expect(result.current.isTrackSelected("non-existent-track")).toBe(false)
      expect(result.current.isSectionSelected("non-existent-section")).toBe(false)
    })

    it("should return default selection statistics", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      const stats = result.current.getSelectionStats()
      expect(stats).toEqual({
        totalDuration: 0,
        averageVolume: 0,
        trackTypes: [],
        mediaTypes: [],
      })
    })
  })

  describe("Selection Actions", () => {
    it("should call selection methods without errors", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.selectClip("clip-1")
        result.current.selectTrack("track-1")
        result.current.selectSection("section-1")
        result.current.selectMultiple({ clipIds: ["clip-1"], trackIds: ["track-1"] })
        result.current.selectAll()
        result.current.selectNone()
        result.current.invertSelection()
      }).not.toThrow()
    })

    it("should call area selection methods without errors", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.selectInTimeRange(0, 10)
        result.current.selectByType("video")
      }).not.toThrow()
    })
  })

  describe("Operations on Selected Items", () => {
    it("should call operation methods without errors", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.deleteSelected()
        result.current.duplicateSelected()
        result.current.groupSelected()
        result.current.ungroupSelected()
      }).not.toThrow()
    })

    it("should call property modification methods without errors", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.setSelectedVolume(0.5)
        result.current.setSelectedSpeed(1.5)
        result.current.setSelectedOpacity(0.8)
        result.current.muteSelected()
        result.current.unmuteSelected()
        result.current.lockSelected()
        result.current.unlockSelected()
      }).not.toThrow()
    })
  })

  describe("Clipboard Operations", () => {
    it("should call clipboard methods without errors", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.copySelected()
        result.current.cutSelected()
        result.current.pasteAtTime(10, "track-1")
      }).not.toThrow()
    })
  })

  describe("Error Handling", () => {
    it("should not throw errors with invalid parameters", () => {
      const { result } = renderHook(() => useTimelineSelection(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.selectClip("")
        result.current.selectTrack("")
        result.current.selectSection("")
        result.current.selectInTimeRange(-1, -1)
        result.current.selectByType("")
        result.current.setSelectedVolume(-1)
        result.current.setSelectedSpeed(-1)
        result.current.setSelectedOpacity(-1)
        result.current.pasteAtTime(-1, "")
      }).not.toThrow()
    })
  })
})
