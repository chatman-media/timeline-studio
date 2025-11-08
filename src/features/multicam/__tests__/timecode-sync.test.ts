/**
 * Тесты для синхронизации по таймкоду
 */

import { describe, expect, it } from "vitest"

import { type MediaFile, MediaType } from "@/features/media/types/media"
import type { TimelineClip } from "@/features/timeline/types/timeline"

import {
  extractCreationTime,
  extractTimecode,
  formatTimecode,
  getFrameRate,
  parseTimecode,
  syncByTimecode,
  timecodeToSeconds,
} from "../services/timecode-sync"

describe("timecode-sync", () => {
  describe("parseTimecode", () => {
    it("should parse standard timecode", () => {
      const result = parseTimecode("01:23:45:12", 30)
      expect(result).toEqual({
        timecode: "01:23:45:12",
        frameRate: 30,
        dropFrame: false,
        totalFrames: 150762, // (1*3600 + 23*60 + 45) * 30 + 12
      })
    })

    it("should parse drop frame timecode", () => {
      const result = parseTimecode("01:23:45;12", 29.97)
      expect(result).toBeDefined()
      expect(result?.dropFrame).toBe(true)
    })

    it("should return null for invalid timecode", () => {
      expect(parseTimecode("invalid", 30)).toBeNull()
      expect(parseTimecode("1:2:3:4", 30)).toBeNull()
    })
  })

  describe("timecodeToSeconds", () => {
    it("should convert timecode to seconds", () => {
      const timecodeInfo = {
        timecode: "00:00:30:00",
        frameRate: 30,
        dropFrame: false,
        totalFrames: 900,
      }
      expect(timecodeToSeconds(timecodeInfo)).toBe(30)
    })
  })

  describe("extractTimecode", () => {
    it("should extract timecode from stream", () => {
      const mediaFile: MediaFile = {
        id: "1",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              timecode: "10:15:30:00",
            },
          ],
          format: {
            tags: {},
          },
        },
      }

      expect(extractTimecode(mediaFile)).toBe("10:15:30:00")
    })

    it("should extract timecode from format tags", () => {
      const mediaFile: MediaFile = {
        id: "1",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [],
          format: {
            tags: {
              timecode: "12:34:56:00",
            },
          },
        },
      }

      expect(extractTimecode(mediaFile)).toBe("12:34:56:00")
    })

    it("should return null if no timecode found", () => {
      const mediaFile: MediaFile = {
        id: "1",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [],
          format: {
            tags: {},
          },
        },
      }

      expect(extractTimecode(mediaFile)).toBeNull()
    })
  })

  describe("extractCreationTime", () => {
    it("should extract creation time from tags", () => {
      const mediaFile: MediaFile = {
        id: "1",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: "2024-01-01T12:00:00Z",
            },
          },
        },
      }

      const result = extractCreationTime(mediaFile)
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toBe("2024-01-01T12:00:00.000Z")
    })
  })

  describe("getFrameRate", () => {
    it("should extract frame rate from video stream", () => {
      const mediaFile: MediaFile = {
        id: "1",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              r_frame_rate: "30000/1001", // 29.97 fps
            },
          ],
          format: {},
        },
      }

      expect(getFrameRate(mediaFile)).toBeCloseTo(29.97, 2)
    })

    it("should return default frame rate if not found", () => {
      const mediaFile: MediaFile = {
        id: "1",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
      }

      expect(getFrameRate(mediaFile)).toBe(30)
    })
  })

  describe("syncByTimecode", () => {
    it("should sync clips by timecode", () => {
      const baseClip: TimelineClip = {
        id: "clip1",
        trackId: "track1",
        mediaId: "media1",
        name: "Clip 1",
        startTime: 0,
        duration: 10,
        mediaStartTime: 0,
        mediaEndTime: 10,
        offset: 0,
        speed: 1,
        volume: 1,
        opacity: 1,
        isReversed: false,
        isSelected: false,
        isLocked: false,
        effects: [],
        filters: [],
        transitions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const clips: TimelineClip[] = [
        baseClip,
        {
          id: "clip2",
          trackId: "track2",
          mediaId: "media2",
          name: "Clip 2",
          startTime: 0,
          duration: 10,
          mediaStartTime: 0,
          mediaEndTime: 10,
          offset: 0,
          speed: 1,
          volume: 1,
          opacity: 1,
          isReversed: false,
          isSelected: false,
          isLocked: false,
          effects: [],
          filters: [],
          transitions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mediaFiles: MediaFile[] = [
        {
          id: "media1",
          name: "camera1.mp4",
          path: "/camera1.mp4",
          type: MediaType.Video,
          probeData: {
            streams: [{ index: 0, timecode: "10:00:00:00" }],
            format: {},
          },
        },
        {
          id: "media2",
          name: "camera2.mp4",
          path: "/camera2.mp4",
          type: MediaType.Video,
          probeData: {
            streams: [{ index: 0, timecode: "10:00:05:00" }],
            format: {},
          },
        },
      ]

      const results = syncByTimecode(baseClip, clips, mediaFiles)

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        clipId: "clip2",
        offset: -5, // 5 seconds behind
        confidence: 1.0,
        method: "timecode",
      })
    })
  })

  describe("formatTimecode", () => {
    it("should format seconds to timecode", () => {
      expect(formatTimecode(3661.5, 30)).toBe("01:01:01:15")
      expect(formatTimecode(0, 30)).toBe("00:00:00:00")
      expect(formatTimecode(59.967, 29.97)).toBe("00:00:59:29")
    })
  })
})
