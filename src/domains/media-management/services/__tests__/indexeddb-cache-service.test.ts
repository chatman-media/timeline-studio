/**
 * IndexedDB Cache Service Tests
 *
 * Comprehensive тесты для IndexedDBCacheService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CachedFrames, CachedPreview, CachedRecognition, CachedSubtitles } from "../indexeddb-cache-service"
import { IndexedDBCacheService } from "../indexeddb-cache-service"

// Mock idb-keyval
vi.mock("idb-keyval")

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

// Import and setup mocks after vi.mock declarations
import * as idbModule from "idb-keyval"

const mockGet = vi.mocked(idbModule.get)
const mockSet = vi.mocked(idbModule.set)
const mockDel = vi.mocked(idbModule.del)
const mockEntries = vi.mocked(idbModule.entries)
const mockClear = vi.mocked(idbModule.clear)
const mockCreateStore = vi.mocked(idbModule.createStore)

// Setup default return values for mocks
mockCreateStore.mockImplementation((dbName: string, storeName: string) => ({
  dbName,
  storeName,
}))

// Default mockEntries should return an empty array
mockEntries.mockResolvedValue([])

describe("IndexedDBCacheService", () => {
  let service: IndexedDBCacheService

  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем singleton для чистого состояния
    ;(IndexedDBCacheService as any).instance = null
    service = IndexedDBCacheService.getInstance()
  })

  describe("singleton pattern", () => {
    it("should return same instance", () => {
      const instance1 = IndexedDBCacheService.getInstance()
      const instance2 = IndexedDBCacheService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should create separate stores for different cache types", () => {
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-preview-cache", "preview-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-frame-cache", "frame-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-recognition-cache", "recognition-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-subtitle-cache", "subtitle-store")
    })
  })

  describe("preview caching", () => {
    it("should cache preview", async () => {
      const fileId = "file-123"
      const thumbnail = "data:image/png;base64,..."

      await service.cachePreview(fileId, thumbnail)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          thumbnail,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.anything(),
      )
    })

    it("should get cached preview", async () => {
      const fileId = "file-123"
      const cachedPreview: CachedPreview = {
        fileId,
        thumbnail: "data:image/png;base64,...",
        timestamp: Date.now(),
        size: 1000,
      }

      mockGet.mockResolvedValue(cachedPreview)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(cachedPreview.thumbnail)
      expect(mockGet).toHaveBeenCalledWith(fileId, expect.anything())
    })

    it("should return null for non-existent preview", async () => {
      mockGet.mockResolvedValue(null)

      const result = await service.getCachedPreview("non-existent")

      expect(result).toBeNull()
    })

    it("should return null for expired preview", async () => {
      const fileId = "file-123"
      const expiredPreview: CachedPreview = {
        fileId,
        thumbnail: "data:image/png;base64,...",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        size: 1000,
      }

      mockGet.mockResolvedValue(expiredPreview)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBeNull()
      expect(mockDel).toHaveBeenCalledWith(fileId, expect.anything())
    })

    it("should delete preview", async () => {
      const fileId = "file-123"

      await service.deletePreview(fileId)

      expect(mockDel).toHaveBeenCalledWith(fileId, expect.anything())
    })
  })

  describe("timeline frames caching", () => {
    it("should cache timeline frames", async () => {
      const fileId = "file-123"
      const frames = [
        { timestamp: 0, data: "frame1" },
        { timestamp: 1, data: "frame2" },
      ]

      await service.cacheTimelineFrames(fileId, frames as any)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.anything(),
      )
    })

    it("should get cached timeline frames", async () => {
      const fileId = "file-123"
      const frames = [{ timestamp: 0, data: "frame1" }]
      const cachedFrames: CachedFrames = {
        fileId,
        frames: frames as any,
        timestamp: Date.now(),
        size: 1000,
      }

      mockGet.mockResolvedValue(cachedFrames)

      const result = await service.getCachedTimelineFrames(fileId)

      expect(result).toEqual(frames)
    })

    it("should return null for expired frames", async () => {
      const fileId = "file-123"
      const expiredFrames: CachedFrames = {
        fileId,
        frames: [],
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        size: 1000,
      }

      mockGet.mockResolvedValue(expiredFrames)

      const result = await service.getCachedTimelineFrames(fileId)

      expect(result).toBeNull()
      expect(mockDel).toHaveBeenCalled()
    })
  })

  describe("recognition frames caching", () => {
    it("should cache recognition frames", async () => {
      const fileId = "file-123"
      const frames = [
        { timestamp: 0, objects: [] },
        { timestamp: 1, objects: [] },
      ]

      await service.cacheRecognitionFrames(fileId, frames as any)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
        }),
        expect.anything(),
      )
    })

    it("should get cached recognition frames", async () => {
      const fileId = "file-123"
      const frames = [{ timestamp: 0, objects: [] }]
      const cachedRecognition: CachedRecognition = {
        fileId,
        frames: frames as any,
        timestamp: Date.now(),
        size: 1000,
      }

      mockGet.mockResolvedValue(cachedRecognition)

      const result = await service.getCachedRecognitionFrames(fileId)

      expect(result).toEqual(frames)
    })
  })

  describe("subtitle frames caching", () => {
    it("should cache subtitle frames", async () => {
      const fileId = "file-123"
      const frames = [
        { timestamp: 0, text: "Hello" },
        { timestamp: 1, text: "World" },
      ]

      await service.cacheSubtitleFrames(fileId, frames as any)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
        }),
        expect.anything(),
      )
    })

    it("should get cached subtitle frames", async () => {
      const fileId = "file-123"
      const frames = [{ timestamp: 0, text: "Hello" }]
      const cachedSubtitles: CachedSubtitles = {
        fileId,
        frames: frames as any,
        timestamp: Date.now(),
        size: 1000,
      }

      mockGet.mockResolvedValue(cachedSubtitles)

      const result = await service.getCachedSubtitleFrames(fileId)

      expect(result).toEqual(frames)
    })
  })

  describe("cache statistics", () => {
    it("should calculate cache statistics", async () => {
      const previewEntries: Array<[string, CachedPreview]> = [
        [
          "file1",
          {
            fileId: "file1",
            thumbnail: "thumb1",
            timestamp: Date.now(),
            size: 1000,
          },
        ],
        [
          "file2",
          {
            fileId: "file2",
            thumbnail: "thumb2",
            timestamp: Date.now(),
            size: 2000,
          },
        ],
      ]

      const frameEntries: Array<[string, CachedFrames]> = [
        [
          "file1",
          {
            fileId: "file1",
            frames: [],
            timestamp: Date.now(),
            size: 5000,
          },
        ],
      ]

      mockEntries
        .mockResolvedValueOnce(previewEntries) // preview cache
        .mockResolvedValueOnce(frameEntries) // frame cache
        .mockResolvedValueOnce([]) // recognition cache
        .mockResolvedValueOnce([]) // subtitle cache

      const stats = await service.getCacheStatistics()

      expect(stats.previewCache.count).toBe(2)
      expect(stats.previewCache.size).toBe(3000)
      expect(stats.frameCache.count).toBe(1)
      expect(stats.frameCache.size).toBe(5000)
      expect(stats.totalSize).toBe(8000)
    })
  })

  describe("cache cleanup", () => {
    it("should clear expired cache entries", async () => {
      const now = Date.now()
      const expiredTimestamp = now - 31 * 24 * 60 * 60 * 1000
      const validTimestamp = now - 1 * 24 * 60 * 60 * 1000

      const previewEntries: Array<[string, CachedPreview]> = [
        [
          "expired",
          {
            fileId: "expired",
            thumbnail: "old",
            timestamp: expiredTimestamp,
            size: 1000,
          },
        ],
        [
          "valid",
          {
            fileId: "valid",
            thumbnail: "new",
            timestamp: validTimestamp,
            size: 1000,
          },
        ],
      ]

      mockEntries.mockResolvedValue(previewEntries)

      await service.cleanupExpiredCache()

      expect(mockDel).toHaveBeenCalledWith("expired", expect.anything())
      expect(mockDel).not.toHaveBeenCalledWith("valid", expect.anything())
    })

    it("should clear all preview cache", async () => {
      await service.clearPreviewCache()

      expect(mockClear).toHaveBeenCalled()
    })

    it("should clear all frame cache", async () => {
      await service.clearFrameCache()

      expect(mockClear).toHaveBeenCalled()
    })

    it("should clear all recognition cache", async () => {
      await service.clearRecognitionCache()

      expect(mockClear).toHaveBeenCalled()
    })

    it("should clear all subtitle cache", async () => {
      await service.clearSubtitleCache()

      expect(mockClear).toHaveBeenCalled()
    })

    it("should clear all caches", async () => {
      await service.clearAllCache()

      // Should be called 4 times (preview, frame, recognition, subtitle)
      expect(mockClear).toHaveBeenCalledTimes(4)
    })
  })

  describe("cache size management", () => {
    it("should remove oldest entries when cache exceeds limit", async () => {
      const now = Date.now()

      // Create entries that exceed MAX_CACHE_SIZE (500MB)
      const hugeEntries: Array<[string, CachedPreview]> = [
        [
          "old",
          {
            fileId: "old",
            thumbnail: "old",
            timestamp: now - 10000,
            size: 300 * 1024 * 1024, // 300MB
          },
        ],
        [
          "new",
          {
            fileId: "new",
            thumbnail: "new",
            timestamp: now,
            size: 250 * 1024 * 1024, // 250MB
          },
        ],
      ]

      mockEntries
        .mockResolvedValueOnce(hugeEntries) // для getCacheStatistics
        .mockResolvedValueOnce([]) // frame cache
        .mockResolvedValueOnce([]) // recognition cache
        .mockResolvedValueOnce([]) // subtitle cache
        .mockResolvedValueOnce(hugeEntries) // для removeOldestEntries preview
        .mockResolvedValueOnce([]) // для removeOldestEntries frame
        .mockResolvedValueOnce([]) // для removeOldestEntries recognition
        .mockResolvedValueOnce([]) // для removeOldestEntries subtitle

      // Cache a new preview that triggers cleanup
      await service.cachePreview("trigger", "data")

      // Oldest entry should be deleted
      expect(mockDel).toHaveBeenCalledWith("old", expect.anything())
    })
  })

  describe("size estimation", () => {
    it("should estimate string size correctly", async () => {
      const smallString = "small"
      const largeString = "x".repeat(10000)

      await service.cachePreview("small", smallString)
      await service.cachePreview("large", largeString)

      const calls = mockSet.mock.calls
      const smallCall = calls.find((call) => call[0] === "small")
      const largeCall = calls.find((call) => call[0] === "large")

      expect(smallCall![1].size).toBeLessThan(largeCall![1].size)
    })

    it("should estimate object size correctly", async () => {
      const smallFrames = [{ timestamp: 0 }]
      const largeFrames = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: i,
        data: "x".repeat(1000),
      }))

      await service.cacheTimelineFrames("small", smallFrames as any)
      await service.cacheTimelineFrames("large", largeFrames as any)

      const calls = mockSet.mock.calls
      const smallCall = calls.find((call) => call[0] === "small")
      const largeCall = calls.find((call) => call[0] === "large")

      expect(smallCall![1].size).toBeLessThan(largeCall![1].size)
    })
  })
})
