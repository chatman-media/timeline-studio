/**
 * Тесты для хука useClips
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TimelineProviders } from "@/test/test-utils"

import { useClips } from "../use-clips"

describe("useClips", () => {
  describe("Hook Initialization", () => {
    it("should be defined and exportable", () => {
      expect(useClips).toBeDefined()
      expect(typeof useClips).toBe("function")
    })

    it("should return object with all required properties and methods", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      // Проверяем наличие основных свойств
      expect(result.current).toHaveProperty("clips")
      expect(result.current).toHaveProperty("selectedClips")
      expect(result.current).toHaveProperty("clipsByTrack")

      // Проверяем наличие методов
      expect(result.current).toHaveProperty("findClip")
      expect(result.current).toHaveProperty("getClipsByTrack")
      expect(result.current).toHaveProperty("isClipSelected")
      expect(result.current).toHaveProperty("getClipAtTime")
      expect(result.current).toHaveProperty("getClipStats")
      expect(result.current).toHaveProperty("canPlaceClip")
      expect(result.current).toHaveProperty("getClipConflicts")
    })
  })

  describe("Default State", () => {
    it("should return empty arrays and objects by default", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.clips).toEqual([])
      expect(result.current.selectedClips).toEqual([])
      expect(result.current.clipsByTrack).toEqual({})
    })

    it("should return default statistics", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const stats = result.current.getClipStats()
      expect(stats).toEqual({
        totalClips: 0,
        totalDuration: 0,
        selectedCount: 0,
        clipsByType: {
          video: 0,
          audio: 0,
          image: 0,
          ambient: 0,
          music: 0,
          sfx: 0,
          subtitle: 0,
          title: 0,
          voiceover: 0,
        },
      })
    })
  })

  describe("Clip Search and Selection", () => {
    it("should return null for non-existent clip", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clip = result.current.findClip("non-existent-clip")
      expect(clip).toBeNull()
    })

    it("should return false for non-existent clip selection", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const isSelected = result.current.isClipSelected("non-existent-clip")
      expect(isSelected).toBe(false)
    })

    it("should return empty array for non-existent track", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clips = result.current.getClipsByTrack("non-existent-track")
      expect(clips).toEqual([])
    })
  })

  describe("Time-based Operations", () => {
    it("should return null for clip search in non-existent track", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const clip = result.current.getClipAtTime("non-existent-track", 10)
      expect(clip).toBeNull()
    })

    it("should return false for clip placement check", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const canPlace = result.current.canPlaceClip("track-1", 0, 10)
      expect(canPlace).toBe(false)
    })

    it("should return empty conflicts array", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      const conflicts = result.current.getClipConflicts("track-1", 0, 10)
      expect(conflicts).toEqual([])
    })
  })

  describe("Error Handling", () => {
    it("should not throw errors when calling methods with invalid parameters", () => {
      const { result } = renderHook(() => useClips(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.findClip("")
        result.current.getClipsByTrack("")
        result.current.isClipSelected("")
        result.current.getClipAtTime("", -1)
        result.current.getClipStats()
        result.current.canPlaceClip("", -1, -1)
        result.current.getClipConflicts("", -1, -1)
      }).not.toThrow()
    })
  })
})
