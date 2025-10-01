import { invoke } from "@tauri-apps/api/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaMetadata } from "@/domains/shared/types"
import type { CacheMemoryUsage } from "../../types/cache"
import {
  cacheMediaMetadata,
  cacheMultipleMetadata,
  checkCachedFiles,
  getCachedMetadata,
  getCacheMemoryUsage,
  invalidateFileCache,
} from "../metadata-cache-service"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockMetadata: MediaMetadata = {
  file_path: "/path/to/test-video.mp4",
  file_size: 1024 * 1024 * 100, // 100MB
  modified_time: "2024-01-02T00:00:00Z",
  duration: 120.5,
  resolution: [1920, 1080],
  fps: 30,
  bitrate: 5000000,
  video_codec: "h264",
  audio_codec: "aac",
  cached_at: "2024-01-01T00:00:00Z",
}

const mockCacheMemoryUsage: CacheMemoryUsage = {
  totalSize: 1024 * 1024 * 500, // 500MB
  fileCount: 50,
  oldestEntry: new Date("2024-01-01").toISOString(),
  newestEntry: new Date("2024-01-10").toISOString(),
  preview_bytes: 0,
  metadata_bytes: 0,
  render_bytes: 0,
  total_bytes: 0,
}

describe("metadata-cache-service", () => {
  let consoleErrorSpy: any
  let consoleLogSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
    vi.resetAllMocks()
  })

  describe("getCachedMetadata", () => {
    it("should return cached metadata when available", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(mockMetadata)

      const result = await getCachedMetadata("/path/to/test-video.mp4")

      expect(result).toEqual(mockMetadata)
      expect(invoke).toHaveBeenCalledWith("get_cached_metadata", {
        filePath: "/path/to/test-video.mp4",
      })
    })

    it("should return null when metadata is not cached", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(null)

      const result = await getCachedMetadata("/path/to/unknown-video.mp4")

      expect(result).toBeNull()
      expect(invoke).toHaveBeenCalledWith("get_cached_metadata", {
        filePath: "/path/to/unknown-video.mp4",
      })
    })

    it("should handle errors gracefully and return null", async () => {
      const error = new Error("Failed to get metadata")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      const result = await getCachedMetadata("/path/to/test-video.mp4")

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to get cached metadata:", error)
    })
  })

  describe("cacheMediaMetadata", () => {
    it("should cache metadata successfully", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined)

      await cacheMediaMetadata("/path/to/test-video.mp4", mockMetadata)

      expect(invoke).toHaveBeenCalledWith("cache_media_metadata", {
        filePath: "/path/to/test-video.mp4",
        metadata: mockMetadata,
      })
    })

    it("should throw error when caching fails", async () => {
      const error = new Error("Failed to cache metadata")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      await expect(cacheMediaMetadata("/path/to/test-video.mp4", mockMetadata)).rejects.toThrow(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to cache metadata:", error)
    })
  })

  describe("getCacheMemoryUsage", () => {
    it("should return cache memory usage", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(mockCacheMemoryUsage)

      const result = await getCacheMemoryUsage()

      expect(result).toEqual(mockCacheMemoryUsage)
      expect(invoke).toHaveBeenCalledWith("get_cache_memory_usage")
    })

    it("should throw error when getting cache memory usage fails", async () => {
      const error = new Error("Failed to get cache memory usage")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      await expect(getCacheMemoryUsage()).rejects.toThrow(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to get cache memory usage:", error)
    })
  })

  describe("cacheMultipleMetadata", () => {
    it("should cache multiple files in batches", async () => {
      const files = Array.from({ length: 25 }, (_, i) => ({
        path: `/path/to/video-${i}.mp4`,
        metadata: { ...mockMetadata, fileName: `video-${i}.mp4` },
      }))

      vi.mocked(invoke).mockResolvedValue(undefined)

      await cacheMultipleMetadata(files)

      // Should be called 25 times (once for each file)
      expect(invoke).toHaveBeenCalledTimes(25)

      // Check that files are cached with correct parameters
      files.forEach((file, index) => {
        expect(invoke).toHaveBeenNthCalledWith(index + 1, "cache_media_metadata", {
          filePath: file.path,
          metadata: file.metadata,
        })
      })
    })

    it("should handle batch processing correctly", async () => {
      const files = Array.from({ length: 15 }, (_, i) => ({
        path: `/path/to/video-${i}.mp4`,
        metadata: { ...mockMetadata, fileName: `video-${i}.mp4` },
      }))

      vi.mocked(invoke).mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve(undefined), 10))
      })

      const startTime = Date.now()
      await cacheMultipleMetadata(files)
      const endTime = Date.now()

      // Should process in parallel batches, so total time should be less than sequential
      expect(endTime - startTime).toBeLessThan(15 * 10)
      expect(invoke).toHaveBeenCalledTimes(15)
    })

    it("should handle errors in batch processing", async () => {
      const files = [
        { path: "/path/to/video-1.mp4", metadata: mockMetadata },
        { path: "/path/to/video-2.mp4", metadata: mockMetadata },
      ]

      vi.mocked(invoke).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Failed to cache"))

      await expect(cacheMultipleMetadata(files)).rejects.toThrow("Failed to cache")
    })
  })

  describe("checkCachedFiles", () => {
    it("should correctly identify cached and non-cached files", async () => {
      const filePaths = [
        "/path/to/cached-1.mp4",
        "/path/to/not-cached-1.mp4",
        "/path/to/cached-2.mp4",
        "/path/to/not-cached-2.mp4",
      ]

      vi.mocked(invoke)
        .mockResolvedValueOnce(mockMetadata) // cached-1
        .mockResolvedValueOnce(null) // not-cached-1
        .mockResolvedValueOnce(mockMetadata) // cached-2
        .mockResolvedValueOnce(null) // not-cached-2

      const result = await checkCachedFiles(filePaths)

      expect(result.cached).toEqual(["/path/to/cached-1.mp4", "/path/to/cached-2.mp4"])
      expect(result.notCached).toEqual(["/path/to/not-cached-1.mp4", "/path/to/not-cached-2.mp4"])
      expect(invoke).toHaveBeenCalledTimes(4)
    })

    it("should handle empty file list", async () => {
      const result = await checkCachedFiles([])

      expect(result.cached).toEqual([])
      expect(result.notCached).toEqual([])
      expect(invoke).not.toHaveBeenCalled()
    })

    it("should handle all files being cached", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      vi.mocked(invoke).mockResolvedValue(mockMetadata)

      const result = await checkCachedFiles(filePaths)

      expect(result.cached).toEqual(filePaths)
      expect(result.notCached).toEqual([])
    })

    it("should handle all files being not cached", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      vi.mocked(invoke).mockResolvedValue(null)

      const result = await checkCachedFiles(filePaths)

      expect(result.cached).toEqual([])
      expect(result.notCached).toEqual(filePaths)
    })

    it("should handle errors during checking", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      vi.mocked(invoke).mockRejectedValueOnce(new Error("Check failed")).mockResolvedValueOnce(mockMetadata)

      const result = await checkCachedFiles(filePaths)

      // First file will be treated as not cached due to error
      expect(result.cached).toEqual(["/path/to/video-2.mp4"])
      expect(result.notCached).toEqual(["/path/to/video-1.mp4"])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe("invalidateFileCache", () => {
    it("should log cache invalidation request", async () => {
      const filePath = "/path/to/video.mp4"

      await invalidateFileCache(filePath)

      expect(consoleLogSpy).toHaveBeenCalledWith(`Cache invalidation requested for: ${filePath}`)
    })

    it("should handle multiple invalidation requests", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      await Promise.all(filePaths.map(invalidateFileCache))

      expect(consoleLogSpy).toHaveBeenCalledTimes(2)
      filePaths.forEach((path) => {
        expect(consoleLogSpy).toHaveBeenCalledWith(`Cache invalidation requested for: ${path}`)
      })
    })
  })
})
