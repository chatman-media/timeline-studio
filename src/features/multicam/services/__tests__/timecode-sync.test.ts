/**
 * Тесты для сервиса синхронизации по таймкоду
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"
import type { TimelineClip } from "@/features/timeline/types/timeline"

import {
  extractCreationTime,
  extractTimecode,
  formatTimecode,
  getFrameRate,
  parseTimecode,
  supportsTimecodeSync,
  syncByTimecode,
  timecodeToSeconds,
} from "../timecode-sync"

// Мокаем логгер
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("timecode-sync", () => {
  const createMockMediaFile = (overrides?: Partial<MediaFile>): MediaFile => ({
    id: "media-1",
    name: "test.mp4",
    path: "/path/to/test.mp4",
    type: MediaType.Video,
    size: 1000000,
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 120,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: undefined,
    probeData: undefined,
    thumbnailPath: undefined,
    createdAt: new Date(),
    ...overrides,
  })

  const createMockClip = (id: string, mediaId: string): TimelineClip => ({
    id,
    name: `Clip ${id}`,
    trackId: "track-1",
    mediaId,
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
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("parseTimecode", () => {
    it("should parse non-drop-frame timecode", () => {
      const result = parseTimecode("01:23:45:12", 30)

      // Calculate: (1 hour * 3600 + 23 min * 60 + 45 sec) * 30 fps + 12 frames
      // = (3600 + 1380 + 45) * 30 + 12 = 5025 * 30 + 12 = 150750 + 12 = 150762
      expect(result).toEqual({
        timecode: "01:23:45:12",
        frameRate: 30,
        dropFrame: false,
        totalFrames: 150762,
      })
    })

    it("should parse drop-frame timecode", () => {
      const result = parseTimecode("00:01:00;00", 29.97)

      expect(result).not.toBeNull()
      expect(result?.dropFrame).toBe(true)
    })

    it("should return null for invalid timecode format", () => {
      expect(parseTimecode("invalid", 30)).toBeNull()
      expect(parseTimecode("1:2:3:4", 30)).toBeNull()
      expect(parseTimecode("01:23:45", 30)).toBeNull()
    })

    it("should handle zero timecode", () => {
      const result = parseTimecode("00:00:00:00", 30)

      expect(result).toEqual({
        timecode: "00:00:00:00",
        frameRate: 30,
        dropFrame: false,
        totalFrames: 0,
      })
    })

    it("should calculate total frames correctly", () => {
      const result = parseTimecode("00:00:01:00", 30)

      expect(result?.totalFrames).toBe(30) // 1 second at 30fps
    })
  })

  describe("timecodeToSeconds", () => {
    it("should convert timecode info to seconds", () => {
      const timecodeInfo = {
        timecode: "00:00:01:00",
        frameRate: 30,
        dropFrame: false,
        totalFrames: 30,
      }

      expect(timecodeToSeconds(timecodeInfo)).toBe(1)
    })

    it("should handle fractional seconds", () => {
      const timecodeInfo = {
        timecode: "00:00:00:15",
        frameRate: 30,
        dropFrame: false,
        totalFrames: 15,
      }

      expect(timecodeToSeconds(timecodeInfo)).toBe(0.5)
    })
  })

  describe("extractTimecode", () => {
    it("should extract timecode from stream", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              timecode: "01:00:00:00",
            },
          ],
          format: {},
        },
      })

      expect(extractTimecode(media)).toBe("01:00:00:00")
    })

    it("should extract timecode from format tags", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {
            tags: {
              timecode: "02:00:00:00",
            },
          },
        },
      })

      expect(extractTimecode(media)).toBe("02:00:00:00")
    })

    it("should return null if no probe data", () => {
      const media = createMockMediaFile({ probeData: undefined })

      expect(extractTimecode(media)).toBeNull()
    })

    it("should return null if no timecode found", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {},
        },
      })

      expect(extractTimecode(media)).toBeNull()
    })
  })

  describe("extractCreationTime", () => {
    it("should extract creation_time tag", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: "2024-01-15T10:30:00Z",
            },
          },
        },
      })

      const result = extractCreationTime(media)
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toBe("2024-01-15T10:30:00.000Z")
    })

    it("should return null if no creation time found", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {},
        },
      })

      expect(extractCreationTime(media)).toBeNull()
    })

    it("should return null for invalid date", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: "invalid-date",
            },
          },
        },
      })

      expect(extractCreationTime(media)).toBeNull()
    })
  })

  describe("getFrameRate", () => {
    it("should extract frame rate from video stream", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              r_frame_rate: "30/1",
            },
          ],
          format: {},
        },
      })

      expect(getFrameRate(media)).toBe(30)
    })

    it("should handle fractional frame rates", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              r_frame_rate: "30000/1001",
            },
          ],
          format: {},
        },
      })

      expect(getFrameRate(media)).toBeCloseTo(29.97, 2)
    })

    it("should return default 30 if no probe data", () => {
      const media = createMockMediaFile({ probeData: undefined })

      expect(getFrameRate(media)).toBe(30)
    })

    it("should return default 30 if no video stream", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "audio",
            },
          ],
          format: {},
        },
      })

      expect(getFrameRate(media)).toBe(30)
    })
  })

  describe("syncByTimecode", () => {
    it("should sync clips by timecode", () => {
      const baseClip = createMockClip("clip-1", "media-1")
      const otherClip = createMockClip("clip-2", "media-2")

      const baseMedia = createMockMediaFile({
        id: "media-1",
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              timecode: "01:00:00:00",
              r_frame_rate: "30/1",
            },
          ],
          format: {},
        },
      })

      const otherMedia = createMockMediaFile({
        id: "media-2",
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              timecode: "01:00:05:00",
              r_frame_rate: "30/1",
            },
          ],
          format: {},
        },
      })

      const results = syncByTimecode(baseClip, [baseClip, otherClip], [baseMedia, otherMedia])

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        clipId: "clip-2",
        offset: -5, // Base is 5 seconds behind
        confidence: 1.0,
        method: "timecode",
      })
    })

    it("should fallback to creation time if no timecode", () => {
      const baseClip = createMockClip("clip-1", "media-1")
      const otherClip = createMockClip("clip-2", "media-2")

      const baseDate = new Date("2024-01-15T10:00:00Z")
      const otherDate = new Date("2024-01-15T10:00:03Z")

      const baseMedia = createMockMediaFile({
        id: "media-1",
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: baseDate.toISOString(),
            },
          },
        },
      })

      const otherMedia = createMockMediaFile({
        id: "media-2",
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: otherDate.toISOString(),
            },
          },
        },
      })

      const results = syncByTimecode(baseClip, [baseClip, otherClip], [baseMedia, otherMedia])

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        clipId: "clip-2",
        offset: -3, // 3 seconds difference
        confidence: 0.7,
        method: "creation_time",
      })
    })

    it("should return zero offset if no sync method available", () => {
      const baseClip = createMockClip("clip-1", "media-1")
      const otherClip = createMockClip("clip-2", "media-2")

      const baseMedia = createMockMediaFile({
        id: "media-1",
        probeData: {
          streams: [],
          format: {},
        },
      })

      const otherMedia = createMockMediaFile({
        id: "media-2",
        probeData: {
          streams: [],
          format: {},
        },
      })

      const results = syncByTimecode(baseClip, [baseClip, otherClip], [baseMedia, otherMedia])

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        clipId: "clip-2",
        offset: 0,
        confidence: 0,
        method: "none",
      })
    })

    it("should skip base clip in results", () => {
      const baseClip = createMockClip("clip-1", "media-1")
      const baseMedia = createMockMediaFile({
        id: "media-1",
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              timecode: "01:00:00:00",
            },
          ],
          format: {},
        },
      })

      const results = syncByTimecode(baseClip, [baseClip], [baseMedia])

      expect(results).toHaveLength(0)
    })

    it("should return empty array if base media not found", () => {
      const baseClip = createMockClip("clip-1", "media-1")
      const otherClip = createMockClip("clip-2", "media-2")

      const results = syncByTimecode(baseClip, [baseClip, otherClip], [])

      expect(results).toHaveLength(0)
    })
  })

  describe("supportsTimecodeSync", () => {
    it("should return true if timecode exists", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              timecode: "01:00:00:00",
            },
          ],
          format: {},
        },
      })

      expect(supportsTimecodeSync(media)).toBe(true)
    })

    it("should return true if creation time exists", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {
            tags: {
              creation_time: "2024-01-15T10:00:00Z",
            },
          },
        },
      })

      expect(supportsTimecodeSync(media)).toBe(true)
    })

    it("should return false if neither timecode nor creation time exist", () => {
      const media = createMockMediaFile({
        probeData: {
          streams: [],
          format: {},
        },
      })

      expect(supportsTimecodeSync(media)).toBe(false)
    })
  })

  describe("formatTimecode", () => {
    it("should format seconds to timecode", () => {
      expect(formatTimecode(0, 30)).toBe("00:00:00:00")
      expect(formatTimecode(1, 30)).toBe("00:00:01:00")
      expect(formatTimecode(60, 30)).toBe("00:01:00:00")
      expect(formatTimecode(3600, 30)).toBe("01:00:00:00")
    })

    it("should handle fractional seconds", () => {
      expect(formatTimecode(1.5, 30)).toBe("00:00:01:15")
    })

    it("should pad numbers with zeros", () => {
      const result = formatTimecode(3661.5, 30)
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/)
    })
  })
})
