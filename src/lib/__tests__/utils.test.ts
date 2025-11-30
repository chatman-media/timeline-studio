/**
 * Tests for lib/utils.ts
 *
 * Комплексные тесты для утилитарных функций
 */

import { describe, expect, it } from "vitest"
import {
  cn,
  formatResolution,
  formatBitrate,
  generateVideoId,
  isVideoAvailable,
  parseFileNameDateTime,
  formatFileSize,
  generateId,
} from "../utils"
import type { MediaFile } from "@/features/media/types/media"

describe("lib/utils", () => {
  describe("cn - CSS class merger", () => {
    it("should merge class names", () => {
      const result = cn("text-red-500", "bg-blue-500")
      expect(result).toContain("text-red-500")
      expect(result).toContain("bg-blue-500")
    })

    it("should handle conditional classes", () => {
      const result = cn("base-class", false && "conditional-class", "another-class")
      expect(result).toContain("base-class")
      expect(result).toContain("another-class")
      expect(result).not.toContain("conditional-class")
    })

    it("should merge tailwind conflicting classes", () => {
      const result = cn("px-2", "px-4")
      // tailwind-merge should keep only px-4
      expect(result).toBe("px-4")
    })

    it("should handle empty input", () => {
      const result = cn()
      expect(result).toBe("")
    })

    it("should handle undefined and null", () => {
      const result = cn("text-base", undefined, null, "text-lg")
      expect(result).toContain("text-lg")
      expect(result).not.toContain("undefined")
      expect(result).not.toContain("null")
    })
  })

  describe("formatResolution", () => {
    it("should format FHD resolution", () => {
      expect(formatResolution(1920, 1080)).toBe("FHD")
      expect(formatResolution(1080, 1920)).toBe("FHD") // Portrait mode
    })

    it("should format UHD resolution", () => {
      expect(formatResolution(3840, 2160)).toBe("UHD")
    })

    it("should format QHD resolution", () => {
      expect(formatResolution(2560, 1440)).toBe("QHD")
    })

    it("should format DCI 2K resolution", () => {
      expect(formatResolution(2048, 1080)).toBe("DCI 2K")
    })

    it("should format DCI 4K resolution", () => {
      expect(formatResolution(4096, 2160)).toBe("DCI 4K")
    })

    it("should format 5K resolution", () => {
      expect(formatResolution(5120, 2880)).toBe("5K")
    })

    it("should format 6K resolution", () => {
      expect(formatResolution(6144, 3240)).toBe("6K")
    })

    it("should format 8K UHD resolution", () => {
      expect(formatResolution(7680, 4320)).toBe("8K UHD")
    })

    it("should format HD resolution", () => {
      expect(formatResolution(1280, 720)).toBe("HD")
    })

    it("should format SD for low resolutions", () => {
      expect(formatResolution(640, 480)).toBe("SD")
      expect(formatResolution(320, 240)).toBe("SD")
    })

    it("should handle portrait orientations", () => {
      expect(formatResolution(1080, 1920)).toBe("FHD")
      expect(formatResolution(2160, 3840)).toBe("UHD")
    })

    it("should handle custom resolutions by pixel count", () => {
      // Custom FHD-ish resolution
      expect(formatResolution(2000, 1100)).toBe("FHD")
      // Custom UHD-ish resolution
      expect(formatResolution(3900, 2200)).toBe("UHD")
    })
  })

  describe("formatBitrate", () => {
    it("should format bitrate in Mbps", () => {
      expect(formatBitrate(5000000)).toBe("5.0 Mbps")
      expect(formatBitrate(10500000)).toBe("10.5 Mbps")
    })

    it("should format small bitrates", () => {
      expect(formatBitrate(500000)).toBe("0.5 Mbps")
      expect(formatBitrate(100000)).toBe("0.1 Mbps")
    })

    it("should handle undefined bitrate", () => {
      expect(formatBitrate(undefined)).toBe("N/A")
    })

    it("should handle zero bitrate", () => {
      expect(formatBitrate(0)).toBe("N/A")
    })

    it("should format large bitrates", () => {
      expect(formatBitrate(100000000)).toBe("100.0 Mbps")
    })
  })

  describe("generateVideoId", () => {
    it("should generate unique video ID", () => {
      const videos: MediaFile[] = [
        {
          id: "V1",
          name: "test.mp4",
          path: "/test.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
          size: 1000,
          lastCheckedAt: Date.now(),
        },
      ]

      const id = generateVideoId(videos)
      expect(id).toBe("V2") // Should generate next ID
    })

    it("should generate unique ID when list is empty", () => {
      const id = generateVideoId([])
      expect(id).toBe("V1") // First video
    })

    it("should avoid ID collisions", () => {
      const videos: MediaFile[] = [
        {
          id: "V1",
          name: "test1.mp4",
          path: "/test1.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
          size: 1000,
          lastCheckedAt: Date.now(),
        },
        {
          id: "V2",
          name: "test2.mp4",
          path: "/test2.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false,
          size: 1000,
          lastCheckedAt: Date.now(),
        },
      ]

      const id = generateVideoId(videos)
      expect(id).toBe("V3") // Should generate next available ID
    })
  })

  describe("isVideoAvailable", () => {
    it("should return true for available video", () => {
      const video: MediaFile = {
        id: "V1",
        name: "test.mp4",
        path: "/test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000,
        duration: 100,
        startTime: 0,
        lastCheckedAt: Date.now(),
      }

      expect(isVideoAvailable(video, 0)).toBe(true)
      expect(isVideoAvailable(video, 50)).toBe(true)
      expect(isVideoAvailable(video, 99)).toBe(true)
    })

    it("should return false for time beyond duration", () => {
      const video: MediaFile = {
        id: "V1",
        name: "test.mp4",
        path: "/test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000,
        duration: 100,
        startTime: 0,
        lastCheckedAt: Date.now(),
      }

      expect(isVideoAvailable(video, 100.5)).toBe(false)
      expect(isVideoAvailable(video, 200)).toBe(false)
    })

    it("should handle tolerance parameter", () => {
      const video: MediaFile = {
        id: "V1",
        name: "test.mp4",
        path: "/test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000,
        duration: 100,
        startTime: 0,
        lastCheckedAt: Date.now(),
      }

      // With default tolerance 0.3
      expect(isVideoAvailable(video, 100.2)).toBe(true)
      expect(isVideoAvailable(video, 100.4)).toBe(false)

      // With custom tolerance 0.5
      expect(isVideoAvailable(video, 100.4, 0.5)).toBe(true)
      expect(isVideoAvailable(video, 100.6, 0.5)).toBe(false)
    })

    it("should handle undefined duration", () => {
      const video: MediaFile = {
        id: "V1",
        name: "test.mp4",
        path: "/test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 1000,
        lastCheckedAt: Date.now(),
      }

      // Without duration and startTime, endTime = 0 + 0 = 0
      // currentTime=0 is within tolerance (0 >= -0.3 && 0 <= 0.3)
      expect(isVideoAvailable(video, 0)).toBe(true)
      expect(isVideoAvailable(video, 100)).toBe(false)
    })
  })

  describe("parseFileNameDateTime", () => {
    it("should parse standard timestamp format", () => {
      const date = parseFileNameDateTime("video_20240115_143000.mp4")
      expect(date).toBeInstanceOf(Date)
      expect(date?.getFullYear()).toBe(2024)
      expect(date?.getMonth()).toBe(0) // January (0-indexed)
      expect(date?.getDate()).toBe(15)
      expect(date?.getHours()).toBe(14)
      expect(date?.getMinutes()).toBe(30)
      expect(date?.getSeconds()).toBe(0)
    })

    it("should parse IMG format", () => {
      const date = parseFileNameDateTime("IMG_20240910_170942.jpg")
      expect(date).toBeInstanceOf(Date)
      expect(date?.getFullYear()).toBe(2024)
      expect(date?.getMonth()).toBe(8) // September (0-indexed)
      expect(date?.getDate()).toBe(10)
      expect(date?.getHours()).toBe(17)
      expect(date?.getMinutes()).toBe(9)
      expect(date?.getSeconds()).toBe(42)
    })

    it("should return null for invalid format", () => {
      expect(parseFileNameDateTime("invalid-filename.mp4")).toBeNull()
      expect(parseFileNameDateTime("video.mp4")).toBeNull()
      expect(parseFileNameDateTime("")).toBeNull()
      expect(parseFileNameDateTime("2024-01-15-143000.mp4")).toBeNull() // Wrong format
    })

    it("should parse without extension", () => {
      const date = parseFileNameDateTime("20240115_143000")
      expect(date).toBeInstanceOf(Date)
      expect(date?.getFullYear()).toBe(2024)
    })
  })

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500.0 B")
      expect(formatFileSize(1023)).toBe("1023.0 B")
    })

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB")
      expect(formatFileSize(10240)).toBe("10.0 KB")
      expect(formatFileSize(102400)).toBe("100.0 KB")
    })

    it("should format megabytes", () => {
      expect(formatFileSize(1048576)).toBe("1.0 MB")
      expect(formatFileSize(10485760)).toBe("10.0 MB")
      expect(formatFileSize(104857600)).toBe("100.0 MB")
    })

    it("should format gigabytes", () => {
      expect(formatFileSize(1073741824)).toBe("1.0 GB")
      expect(formatFileSize(10737418240)).toBe("10.0 GB")
    })

    it("should format terabytes", () => {
      expect(formatFileSize(1099511627776)).toBe("1.0 TB")
    })

    it("should handle zero bytes", () => {
      expect(formatFileSize(0)).toBe("0.0 B")
    })

    it("should handle fractional values", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB") // 1.5 KB
      expect(formatFileSize(1572864)).toBe("1.5 MB") // 1.5 MB
    })
  })

  describe("generateId", () => {
    it("should generate ID without prefix", () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
      expect(id.length).toBeGreaterThan(0)
    })

    it("should generate ID with prefix", () => {
      const id = generateId("clip")
      expect(id).toMatch(/^clip_[a-z0-9]+$/)
    })

    it("should generate ID with different prefixes", () => {
      const id1 = generateId("track")
      const id2 = generateId("section")

      expect(id1).toMatch(/^track_[a-z0-9]+$/)
      expect(id2).toMatch(/^section_[a-z0-9]+$/)
    })

    it("should generate unique IDs", () => {
      const ids = Array.from({ length: 100 }, () => generateId("test"))
      const uniqueIds = new Set(ids)

      // All IDs should be unique
      expect(uniqueIds.size).toBe(100)
    })

    it("should handle empty prefix", () => {
      const id = generateId("")
      // Empty string is falsy, so it behaves like no prefix
      expect(id).toMatch(/^[a-z0-9]+$/)
    })
  })
})
