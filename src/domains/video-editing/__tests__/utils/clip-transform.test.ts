/**
 * Tests for Clip Transform Utilities
 *
 * Тесты для конвертации между Rust Clip и TypeScript TimelineClip
 */

import { describe, expect, it } from "vitest"
import type { Clip, ClipData } from "@/types/generated/tauri-bindings"
import type { TimelineClip } from "../../types"
import {
  convertClipDataToTimelineClip,
  convertClipsToTimelineClips,
  convertClipToTimelineClip,
  updateTimelineClipFromBackend,
} from "../../utils/clip-transform"

describe("Clip Transform Utilities", () => {
  const mockRustClip: Clip = {
    id: "clip-1",
    name: "test-clip.mp4",
    media_id: "media-1",
    timeline_in: 0,
    timeline_out: 10,
    source_in: 5,
    source_out: 15,
    playback_rate: 1.5,
    enabled: true,
    effects: [],
    transitions: [],
    keyframes: [],
  }

  const mockClipData: ClipData = {
    id: "clip-2",
    name: "clip-data.mp4",
    media_id: "media-2",
    timeline_in: 2,
    timeline_out: 8,
    source_in: 0,
    source_out: 6,
  }

  describe("convertClipToTimelineClip", () => {
    it("should convert Rust Clip to TimelineClip", () => {
      const result = convertClipToTimelineClip(mockRustClip, "track-1")

      expect(result.id).toBe("clip-1")
      expect(result.name).toBe("test-clip.mp4")
      expect(result.mediaId).toBe("media-1")
      expect(result.trackId).toBe("track-1")
      expect(result.startTime).toBe(0)
      expect(result.duration).toBe(10)
      expect(result.sourceIn).toBe(5)
      expect(result.sourceOut).toBe(15)
      expect(result.playbackRate).toBe(1.5)
      expect(result.speed).toBe(1.5)
    })

    it("should set media timing fields correctly", () => {
      const result = convertClipToTimelineClip(mockRustClip, "track-1")

      expect(result.mediaStartTime).toBe(5)
      expect(result.mediaEndTime).toBe(15)
      expect(result.offset).toBe(0)
    })

    it("should convert enabled flag to isLocked", () => {
      const enabledClip = { ...mockRustClip, enabled: true }
      const disabledClip = { ...mockRustClip, enabled: false }

      expect(convertClipToTimelineClip(enabledClip, "track-1").isLocked).toBe(false)
      expect(convertClipToTimelineClip(disabledClip, "track-1").isLocked).toBe(true)
    })

    it("should set default playback state", () => {
      const result = convertClipToTimelineClip(mockRustClip, "track-1")

      expect(result.isReversed).toBe(false)
      expect(result.isSelected).toBe(false)
      expect(result.isMuted).toBe(false)
    })

    it("should set default audio/visual properties", () => {
      const result = convertClipToTimelineClip(mockRustClip, "track-1")

      expect(result.volume).toBe(1.0)
      expect(result.opacity).toBe(1.0)
      expect(result.position).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      })
    })

    it("should initialize empty effects, filters, and transitions", () => {
      const result = convertClipToTimelineClip(mockRustClip, "track-1")

      expect(result.effects).toEqual([])
      expect(result.filters).toEqual([])
      expect(result.transitions).toEqual([])
    })

    it("should set timestamps", () => {
      const before = new Date()
      const result = convertClipToTimelineClip(mockRustClip, "track-1")
      const after = new Date()

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it("should calculate duration correctly", () => {
      const clip: Clip = {
        ...mockRustClip,
        timeline_in: 5,
        timeline_out: 15,
      }

      const result = convertClipToTimelineClip(clip, "track-1")
      expect(result.duration).toBe(10)
    })
  })

  describe("convertClipDataToTimelineClip", () => {
    it("should convert ClipData to TimelineClip", () => {
      const result = convertClipDataToTimelineClip(mockClipData, "track-2")

      expect(result.id).toBe("clip-2")
      expect(result.name).toBe("clip-data.mp4")
      expect(result.mediaId).toBe("media-2")
      expect(result.trackId).toBe("track-2")
      expect(result.startTime).toBe(2)
      expect(result.duration).toBe(6)
      expect(result.sourceIn).toBe(0)
      expect(result.sourceOut).toBe(6)
    })

    it("should use default playback rate", () => {
      const result = convertClipDataToTimelineClip(mockClipData, "track-2")

      expect(result.playbackRate).toBe(1.0)
      expect(result.speed).toBe(1.0)
    })

    it("should use default state flags", () => {
      const result = convertClipDataToTimelineClip(mockClipData, "track-2")

      expect(result.isSelected).toBe(false)
      expect(result.isLocked).toBe(false)
      expect(result.isMuted).toBe(false)
      expect(result.isReversed).toBe(false)
    })

    it("should set media timing from source times", () => {
      const result = convertClipDataToTimelineClip(mockClipData, "track-2")

      expect(result.mediaStartTime).toBe(0)
      expect(result.mediaEndTime).toBe(6)
    })

    it("should calculate duration correctly", () => {
      const clipData: ClipData = {
        ...mockClipData,
        timeline_in: 10,
        timeline_out: 25,
      }

      const result = convertClipDataToTimelineClip(clipData, "track-2")
      expect(result.duration).toBe(15)
    })
  })

  describe("convertClipsToTimelineClips", () => {
    it("should convert multiple clips", () => {
      const clips: Clip[] = [
        { ...mockRustClip, id: "clip-1", timeline_in: 5, timeline_out: 10 },
        { ...mockRustClip, id: "clip-2", timeline_in: 0, timeline_out: 5 },
        { ...mockRustClip, id: "clip-3", timeline_in: 10, timeline_out: 15 },
      ]

      const result = convertClipsToTimelineClips(clips, "track-1")

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe("clip-2")
      expect(result[1].id).toBe("clip-1")
      expect(result[2].id).toBe("clip-3")
    })

    it("should sort clips by startTime", () => {
      const clips: Clip[] = [
        { ...mockRustClip, id: "clip-1", timeline_in: 15, timeline_out: 20 },
        { ...mockRustClip, id: "clip-2", timeline_in: 0, timeline_out: 5 },
        { ...mockRustClip, id: "clip-3", timeline_in: 10, timeline_out: 15 },
      ]

      const result = convertClipsToTimelineClips(clips, "track-1")

      expect(result[0].startTime).toBe(0)
      expect(result[1].startTime).toBe(10)
      expect(result[2].startTime).toBe(15)
    })

    it("should handle empty array", () => {
      const result = convertClipsToTimelineClips([], "track-1")

      expect(result).toEqual([])
    })

    it("should handle single clip", () => {
      const result = convertClipsToTimelineClips([mockRustClip], "track-1")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("clip-1")
    })

    it("should preserve all clip properties", () => {
      const clips: Clip[] = [
        { ...mockRustClip, id: "clip-1", playback_rate: 0.5 },
        { ...mockRustClip, id: "clip-2", playback_rate: 2.0 },
      ]

      const result = convertClipsToTimelineClips(clips, "track-1")

      expect(result[0].playbackRate).toBe(0.5)
      expect(result[1].playbackRate).toBe(2.0)
    })
  })

  describe("updateTimelineClipFromBackend", () => {
    const existingClip: TimelineClip = {
      id: "clip-1",
      name: "old-name.mp4",
      mediaId: "media-1",
      trackId: "track-1",
      startTime: 0,
      duration: 5,
      sourceIn: 0,
      sourceOut: 5,
      mediaStartTime: 0,
      mediaEndTime: 5,
      offset: 0,
      playbackRate: 1.0,
      speed: 1.0,
      isReversed: false,
      isSelected: true, // Should be preserved
      isLocked: false,
      isMuted: true, // Should be preserved
      volume: 0.8, // Should be preserved
      opacity: 0.5, // Should be preserved
      position: {
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        rotation: 45,
        scaleX: 1.5,
        scaleY: 2.0,
      },
      effects: [{ id: "effect-1", effectId: "blur", name: "Blur", enabled: true, order: 0 }], // Should be preserved
      filters: [],
      transitions: [],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    }

    const updatedRustClip: Clip = {
      id: "clip-1",
      name: "new-name.mp4",
      media_id: "media-1",
      timeline_in: 5,
      timeline_out: 20,
      source_in: 2,
      source_out: 17,
      playback_rate: 2.0,
      enabled: false,
      effects: [],
      transitions: [],
      keyframes: [],
    }

    it("should update backend-controlled fields", () => {
      const result = updateTimelineClipFromBackend(existingClip, updatedRustClip)

      expect(result.name).toBe("new-name.mp4")
      expect(result.startTime).toBe(5)
      expect(result.duration).toBe(15)
      expect(result.sourceIn).toBe(2)
      expect(result.sourceOut).toBe(17)
      expect(result.playbackRate).toBe(2.0)
      expect(result.speed).toBe(2.0)
      expect(result.isLocked).toBe(true)
    })

    it("should preserve frontend-only fields", () => {
      const result = updateTimelineClipFromBackend(existingClip, updatedRustClip)

      expect(result.isSelected).toBe(true)
      expect(result.isMuted).toBe(true)
      expect(result.volume).toBe(0.8)
      expect(result.opacity).toBe(0.5)
      expect(result.position).toEqual(existingClip.position)
      expect(result.effects).toEqual(existingClip.effects)
    })

    it("should update media timing", () => {
      const result = updateTimelineClipFromBackend(existingClip, updatedRustClip)

      expect(result.mediaStartTime).toBe(2)
      expect(result.mediaEndTime).toBe(17)
    })

    it("should update timestamp", () => {
      const before = new Date()
      const result = updateTimelineClipFromBackend(existingClip, updatedRustClip)
      const after = new Date()

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it("should preserve createdAt timestamp", () => {
      const result = updateTimelineClipFromBackend(existingClip, updatedRustClip)

      expect(result.createdAt).toEqual(existingClip.createdAt)
    })

    it("should convert enabled flag correctly", () => {
      const enabledClip = { ...updatedRustClip, enabled: true }
      const disabledClip = { ...updatedRustClip, enabled: false }

      expect(updateTimelineClipFromBackend(existingClip, enabledClip).isLocked).toBe(false)
      expect(updateTimelineClipFromBackend(existingClip, disabledClip).isLocked).toBe(true)
    })

    it("should handle zero duration edge case", () => {
      const zeroClip: Clip = {
        ...updatedRustClip,
        timeline_in: 5,
        timeline_out: 5,
      }

      const result = updateTimelineClipFromBackend(existingClip, zeroClip)
      expect(result.duration).toBe(0)
    })
  })

  describe("Edge Cases", () => {
    it("should handle negative timeline positions", () => {
      const clip: Clip = {
        ...mockRustClip,
        timeline_in: -5,
        timeline_out: 5,
      }

      const result = convertClipToTimelineClip(clip, "track-1")
      expect(result.startTime).toBe(-5)
      expect(result.duration).toBe(10)
    })

    it("should handle very large playback rates", () => {
      const clip: Clip = {
        ...mockRustClip,
        playback_rate: 100.0,
      }

      const result = convertClipToTimelineClip(clip, "track-1")
      expect(result.playbackRate).toBe(100.0)
      expect(result.speed).toBe(100.0)
    })

    it("should handle very small playback rates", () => {
      const clip: Clip = {
        ...mockRustClip,
        playback_rate: 0.01,
      }

      const result = convertClipToTimelineClip(clip, "track-1")
      expect(result.playbackRate).toBe(0.01)
      expect(result.speed).toBe(0.01)
    })

    it("should handle long clip names", () => {
      const longName = "a".repeat(1000)
      const clip: Clip = {
        ...mockRustClip,
        name: longName,
      }

      const result = convertClipToTimelineClip(clip, "track-1")
      expect(result.name).toBe(longName)
      expect(result.name.length).toBe(1000)
    })

    it("should handle Unicode characters in names", () => {
      const unicodeName = "测试视频.mp4 🎬 фильм.mkv"
      const clip: Clip = {
        ...mockRustClip,
        name: unicodeName,
      }

      const result = convertClipToTimelineClip(clip, "track-1")
      expect(result.name).toBe(unicodeName)
    })
  })
})
