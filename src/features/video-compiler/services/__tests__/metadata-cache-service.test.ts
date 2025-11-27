import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaMetadata } from "@/domains/shared/types"
import type { CacheMemoryUsage } from "../../types/cache"

// Mock logger
const mockLogger = {
  info: vi.fn(),
  infoSync: vi.fn(),
  error: vi.fn(),
  errorSync: vi.fn(),
  warn: vi.fn(),
  warnSync: vi.fn(),
  debug: vi.fn(),
  debugSync: vi.fn(),
  trace: vi.fn(),
  traceSync: vi.fn(),
}

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => mockLogger),
}))

// Mock Tauri compiler commands
const mockGetCachedMetadata = vi.fn()
const mockCacheMediaMetadata = vi.fn()
const mockGetCacheMemoryUsage = vi.fn()

vi.mock("@/domains/video-editing/tauri/compiler-commands", () => ({
  getCachedMetadata: mockGetCachedMetadata,
  cacheMediaMetadata: mockCacheMediaMetadata,
  getCacheMemoryUsage: mockGetCacheMemoryUsage,
}))

// Import after mocking
const {
  cacheMediaMetadata,
  cacheMultipleMetadata,
  checkCachedFiles,
  getCachedMetadata,
  getCacheMemoryUsage,
  invalidateFileCache,
} = await import("@/domains/video-editing/services/compiler/metadata-cache-service")

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
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.error.mockClear()
    mockLogger.errorSync.mockClear()
    mockLogger.info.mockClear()
    mockLogger.infoSync.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.warnSync.mockClear()
    mockLogger.debug.mockClear()
    mockLogger.debugSync.mockClear()
    mockLogger.trace.mockClear()
    mockLogger.traceSync.mockClear()
    mockGetCachedMetadata.mockClear()
    mockCacheMediaMetadata.mockClear()
    mockGetCacheMemoryUsage.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("getCachedMetadata", () => {
    it("should return cached metadata when available", async () => {
      mockGetCachedMetadata.mockResolvedValueOnce(mockMetadata)

      const result = await getCachedMetadata("/path/to/test-video.mp4")

      expect(result).toEqual(mockMetadata)
      expect(mockGetCachedMetadata).toHaveBeenCalledWith("/path/to/test-video.mp4")
    })

    it("should return null when metadata is not cached", async () => {
      mockGetCachedMetadata.mockResolvedValueOnce(null)

      const result = await getCachedMetadata("/path/to/unknown-video.mp4")

      expect(result).toBeNull()
      expect(mockGetCachedMetadata).toHaveBeenCalledWith("/path/to/unknown-video.mp4")
    })

    it("should handle errors gracefully and return null", async () => {
      const error = new Error("Failed to get metadata")
      mockGetCachedMetadata.mockRejectedValueOnce(error)

      const result = await getCachedMetadata("/path/to/test-video.mp4")

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to get cached metadata:", { error })
    })
  })

  describe("cacheMediaMetadata", () => {
    it("should cache metadata successfully", async () => {
      mockCacheMediaMetadata.mockResolvedValueOnce(undefined)

      await cacheMediaMetadata("/path/to/test-video.mp4", mockMetadata)

      expect(mockCacheMediaMetadata).toHaveBeenCalledWith({
        filePath: "/path/to/test-video.mp4",
        metadata: mockMetadata,
      })
    })

    it("should throw error when caching fails", async () => {
      const error = new Error("Failed to cache metadata")
      mockCacheMediaMetadata.mockRejectedValueOnce(error)

      await expect(cacheMediaMetadata("/path/to/test-video.mp4", mockMetadata)).rejects.toThrow(error)

      expect(mockLogger.error).toHaveBeenCalledWith("Failed to cache metadata:", { error })
    })
  })

  describe("getCacheMemoryUsage", () => {
    it("should return cache memory usage", async () => {
      mockGetCacheMemoryUsage.mockResolvedValueOnce(mockCacheMemoryUsage)

      const result = await getCacheMemoryUsage()

      expect(result).toEqual(mockCacheMemoryUsage)
      expect(mockGetCacheMemoryUsage).toHaveBeenCalledWith()
    })

    it("should throw error when getting cache memory usage fails", async () => {
      const error = new Error("Failed to get cache memory usage")
      mockGetCacheMemoryUsage.mockRejectedValueOnce(error)

      await expect(getCacheMemoryUsage()).rejects.toThrow(error)

      expect(mockLogger.error).toHaveBeenCalledWith("Failed to get cache memory usage:", { error })
    })
  })

  describe("cacheMultipleMetadata", () => {
    it("should cache multiple files in batches", async () => {
      const files = Array.from({ length: 25 }, (_, i) => ({
        path: `/path/to/video-${i}.mp4`,
        metadata: { ...mockMetadata, fileName: `video-${i}.mp4` },
      }))

      mockCacheMediaMetadata.mockResolvedValue(undefined)

      await cacheMultipleMetadata(files)

      // Should be called 25 times (once for each file)
      expect(mockCacheMediaMetadata).toHaveBeenCalledTimes(25)

      // Check that files are cached with correct parameters
      files.forEach((file, index) => {
        expect(mockCacheMediaMetadata).toHaveBeenNthCalledWith(index + 1, {
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

      mockCacheMediaMetadata.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve(undefined), 10))
      })

      const startTime = Date.now()
      await cacheMultipleMetadata(files)
      const endTime = Date.now()

      // Should process in parallel batches, so total time should be less than sequential
      expect(endTime - startTime).toBeLessThan(15 * 10)
      expect(mockCacheMediaMetadata).toHaveBeenCalledTimes(15)
    })

    it("should handle errors in batch processing", async () => {
      const files = [
        { path: "/path/to/video-1.mp4", metadata: mockMetadata },
        { path: "/path/to/video-2.mp4", metadata: mockMetadata },
      ]

      mockCacheMediaMetadata.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Failed to cache"))

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

      mockGetCachedMetadata
        .mockResolvedValueOnce(mockMetadata) // cached-1
        .mockResolvedValueOnce(null) // not-cached-1
        .mockResolvedValueOnce(mockMetadata) // cached-2
        .mockResolvedValueOnce(null) // not-cached-2

      const result = await checkCachedFiles(filePaths)

      expect(result.cached).toEqual(["/path/to/cached-1.mp4", "/path/to/cached-2.mp4"])
      expect(result.notCached).toEqual(["/path/to/not-cached-1.mp4", "/path/to/not-cached-2.mp4"])
      expect(mockGetCachedMetadata).toHaveBeenCalledTimes(4)
    })

    it("should handle empty file list", async () => {
      const result = await checkCachedFiles([])

      expect(result.cached).toEqual([])
      expect(result.notCached).toEqual([])
      expect(mockGetCachedMetadata).not.toHaveBeenCalled()
    })

    it("should handle all files being cached", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      mockGetCachedMetadata.mockResolvedValue(mockMetadata)

      const result = await checkCachedFiles(filePaths)

      expect(result.cached).toEqual(filePaths)
      expect(result.notCached).toEqual([])
    })

    it("should handle all files being not cached", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      mockGetCachedMetadata.mockResolvedValue(null)

      const result = await checkCachedFiles(filePaths)

      expect(result.cached).toEqual([])
      expect(result.notCached).toEqual(filePaths)
    })

    it("should handle errors during checking", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      mockGetCachedMetadata.mockRejectedValueOnce(new Error("Check failed")).mockResolvedValueOnce(mockMetadata)

      const result = await checkCachedFiles(filePaths)

      // First file will be treated as not cached due to error
      expect(result.cached).toEqual(["/path/to/video-2.mp4"])
      expect(result.notCached).toEqual(["/path/to/video-1.mp4"])
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe("invalidateFileCache", () => {
    it("should log cache invalidation request", async () => {
      const filePath = "/path/to/video.mp4"

      await invalidateFileCache(filePath)

      expect(mockLogger.info).toHaveBeenCalledWith(`Cache invalidation requested for: ${filePath}`)
    })

    it("should handle multiple invalidation requests", async () => {
      const filePaths = ["/path/to/video-1.mp4", "/path/to/video-2.mp4"]

      await Promise.all(filePaths.map(invalidateFileCache))

      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      filePaths.forEach((path) => {
        expect(mockLogger.info).toHaveBeenCalledWith(`Cache invalidation requested for: ${path}`)
      })
    })
  })
})
