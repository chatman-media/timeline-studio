/**
 * MediaPreviewService Tests
 *
 * Тесты для MediaPreviewService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaPreviewService } from "../media-preview-service"

// Mock media service
const mockMediaService = {
  getPreviewData: vi.fn(),
  generateThumbnail: vi.fn(),
  clearPreviewData: vi.fn(),
  getFilesWithPreviews: vi.fn(),
  savePreviewData: vi.fn(),
  loadPreviewData: vi.fn(),
  restorePreviewCache: vi.fn(),
  hasCachedThumbnail: vi.fn(),
  getCachedThumbnailPath: vi.fn(),
  saveTimelineFrames: vi.fn(),
  getTimelineFrames: vi.fn(),
}

vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

describe("MediaPreviewService", () => {
  let service: MediaPreviewService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MediaPreviewService()
  })

  describe("getPreviewData", () => {
    it("should return preview data when available", async () => {
      const mockPreviewData = {
        fileId: "file-1",
        thumbnails: [],
        timelineFrames: [],
      }
      mockMediaService.getPreviewData.mockResolvedValue(mockPreviewData)

      const result = await service.getPreviewData("file-1")

      expect(result).toEqual(mockPreviewData)
      expect(mockMediaService.getPreviewData).toHaveBeenCalledWith("file-1")
    })

    it("should throw error when preview data fetch fails", async () => {
      mockMediaService.getPreviewData.mockRejectedValue(new Error("Preview not found"))

      await expect(service.getPreviewData("file-1")).rejects.toThrow("Preview not found")
    })
  })

  describe("generateThumbnail", () => {
    it("should generate thumbnail successfully", async () => {
      const thumbnailPath = "/cache/thumbnails/file-1_320x180.jpg"
      mockMediaService.generateThumbnail.mockResolvedValue(thumbnailPath)

      const result = await service.generateThumbnail("file-1", "/test/video.mp4", 320, 180, 5.0)

      expect(result).toEqual({
        path: thumbnailPath,
        base64_data: undefined,
        timestamp: 5.0,
        width: 320,
        height: 180,
      })
      expect(mockMediaService.generateThumbnail).toHaveBeenCalledWith("file-1", "/test/video.mp4", {
        width: 320,
        height: 180,
        timestamp: 5.0,
      })
    })

    it("should use default timestamp of 0", async () => {
      mockMediaService.generateThumbnail.mockResolvedValue("/cache/thumbnail.jpg")

      await service.generateThumbnail("file-1", "/test/video.mp4", 320, 180)

      expect(mockMediaService.generateThumbnail).toHaveBeenCalledWith("file-1", "/test/video.mp4", {
        width: 320,
        height: 180,
        timestamp: 0,
      })
    })

    it("should throw error when thumbnail generation fails", async () => {
      mockMediaService.generateThumbnail.mockRejectedValue(new Error("FFmpeg error"))

      await expect(service.generateThumbnail("file-1", "/test/video.mp4", 320, 180)).rejects.toThrow(
        "FFmpeg error",
      )
    })
  })

  describe("clearPreviewData", () => {
    it("should clear preview data successfully", async () => {
      mockMediaService.clearPreviewData.mockResolvedValue(undefined)

      await service.clearPreviewData("file-1")

      expect(mockMediaService.clearPreviewData).toHaveBeenCalledWith("file-1")
    })

    it("should throw error when clear fails", async () => {
      mockMediaService.clearPreviewData.mockRejectedValue(new Error("Clear failed"))

      await expect(service.clearPreviewData("file-1")).rejects.toThrow("Clear failed")
    })
  })

  describe("getFilesWithPreviews", () => {
    it("should return list of files with previews", async () => {
      const mockFiles = ["file-1", "file-2", "file-3"]
      mockMediaService.getFilesWithPreviews.mockResolvedValue(mockFiles)

      const result = await service.getFilesWithPreviews()

      expect(result).toEqual(mockFiles)
    })

    it("should throw error when fetch fails", async () => {
      mockMediaService.getFilesWithPreviews.mockRejectedValue(new Error("Fetch failed"))

      await expect(service.getFilesWithPreviews()).rejects.toThrow("Fetch failed")
    })
  })

  describe("savePreviewData", () => {
    it("should save preview data successfully", async () => {
      mockMediaService.savePreviewData.mockResolvedValue(undefined)

      await service.savePreviewData("/test/preview.json")

      expect(mockMediaService.savePreviewData).toHaveBeenCalledWith("/test/preview.json")
    })

    it("should throw error when save fails", async () => {
      mockMediaService.savePreviewData.mockRejectedValue(new Error("Save failed"))

      await expect(service.savePreviewData("/test/preview.json")).rejects.toThrow("Save failed")
    })
  })

  describe("loadPreviewData", () => {
    it("should load preview data successfully", async () => {
      mockMediaService.loadPreviewData.mockResolvedValue(undefined)

      await service.loadPreviewData("/test/preview.json")

      expect(mockMediaService.loadPreviewData).toHaveBeenCalledWith("/test/preview.json")
    })

    it("should throw error when load fails", async () => {
      mockMediaService.loadPreviewData.mockRejectedValue(new Error("Load failed"))

      await expect(service.loadPreviewData("/test/preview.json")).rejects.toThrow("Load failed")
    })
  })

  describe("restorePreviewCache", () => {
    it("should restore preview cache and return count", async () => {
      mockMediaService.restorePreviewCache.mockResolvedValue(42)

      const result = await service.restorePreviewCache()

      expect(result).toBe(42)
    })

    it("should return 0 on error instead of throwing", async () => {
      mockMediaService.restorePreviewCache.mockRejectedValue(new Error("Restore failed"))

      const result = await service.restorePreviewCache()

      expect(result).toBe(0)
    })
  })

  describe("hasCachedThumbnail", () => {
    it("should return true when thumbnail exists", async () => {
      mockMediaService.hasCachedThumbnail.mockResolvedValue(true)

      const result = await service.hasCachedThumbnail("file-1", 320, 180)

      expect(result).toBe(true)
      expect(mockMediaService.hasCachedThumbnail).toHaveBeenCalledWith("file-1", 320, 180)
    })

    it("should return false when thumbnail does not exist", async () => {
      mockMediaService.hasCachedThumbnail.mockResolvedValue(false)

      const result = await service.hasCachedThumbnail("file-1", 320, 180)

      expect(result).toBe(false)
    })

    it("should return false on error", async () => {
      mockMediaService.hasCachedThumbnail.mockRejectedValue(new Error("Check failed"))

      const result = await service.hasCachedThumbnail("file-1", 320, 180)

      expect(result).toBe(false)
    })
  })

  describe("getCachedThumbnailPath", () => {
    it("should return thumbnail path when exists", async () => {
      const mockPath = "/cache/thumbnails/file-1_320x180.jpg"
      mockMediaService.getCachedThumbnailPath.mockResolvedValue(mockPath)

      const result = await service.getCachedThumbnailPath("file-1", 320, 180)

      expect(result).toBe(mockPath)
    })

    it("should return empty string on error", async () => {
      mockMediaService.getCachedThumbnailPath.mockRejectedValue(new Error("Path error"))

      const result = await service.getCachedThumbnailPath("file-1", 320, 180)

      expect(result).toBe("")
    })
  })

  describe("saveTimelineFrames", () => {
    it("should save timeline frames successfully", async () => {
      const frames = [
        { timestamp: 0, path: "/frame1.jpg", width: 160, height: 90 },
        { timestamp: 1, path: "/frame2.jpg", width: 160, height: 90 },
      ]
      mockMediaService.saveTimelineFrames.mockResolvedValue(undefined)

      await service.saveTimelineFrames("file-1", frames)

      expect(mockMediaService.saveTimelineFrames).toHaveBeenCalledWith(
        "file-1",
        frames.map((f) => JSON.stringify(f)),
      )
    })

    it("should throw error when save fails", async () => {
      const frames = [{ timestamp: 0, path: "/frame1.jpg", width: 160, height: 90 }]
      mockMediaService.saveTimelineFrames.mockRejectedValue(new Error("Save failed"))

      await expect(service.saveTimelineFrames("file-1", frames)).rejects.toThrow("Save failed")
    })
  })

  describe("getTimelineFrames", () => {
    it("should get timeline frames and parse them", async () => {
      const frames = [
        { timestamp: 0, path: "/frame1.jpg", width: 160, height: 90 },
        { timestamp: 1, path: "/frame2.jpg", width: 160, height: 90 },
      ]
      mockMediaService.getTimelineFrames.mockResolvedValue(frames.map((f) => JSON.stringify(f)))

      const result = await service.getTimelineFrames("file-1")

      expect(result).toEqual(frames)
    })

    it("should handle already parsed frames", async () => {
      const frames = [{ timestamp: 0, path: "/frame1.jpg", width: 160, height: 90 }]
      mockMediaService.getTimelineFrames.mockResolvedValue(frames)

      const result = await service.getTimelineFrames("file-1")

      expect(result).toEqual(frames)
    })

    it("should throw error when get fails", async () => {
      mockMediaService.getTimelineFrames.mockRejectedValue(new Error("Get failed"))

      await expect(service.getTimelineFrames("file-1")).rejects.toThrow("Get failed")
    })
  })
})
