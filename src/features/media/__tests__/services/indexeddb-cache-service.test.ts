import {
  type CacheStatistics,
  IndexedDBCacheService,
} from "@timeline-studio/domains/media-management/services/indexeddb-cache-service"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock idb-keyval
vi.mock("idb-keyval", () => {
  const mockGet = vi.fn()
  const mockSet = vi.fn()
  const mockDel = vi.fn()
  const mockEntries = vi.fn()
  const mockClear = vi.fn()
  const mockCreateStore = vi.fn()

  return {
    get: mockGet,
    set: mockSet,
    del: mockDel,
    entries: mockEntries,
    clear: mockClear,
    createStore: mockCreateStore,
  }
})

const mockGet = vi.mocked((await import("idb-keyval")).get)
const mockSet = vi.mocked((await import("idb-keyval")).set)
const mockDel = vi.mocked((await import("idb-keyval")).del)
const mockEntries = vi.mocked((await import("idb-keyval")).entries)
const mockClear = vi.mocked((await import("idb-keyval")).clear)
const mockCreateStore = vi.mocked((await import("idb-keyval")).createStore)

describe("IndexedDBCacheService", () => {
  let service: IndexedDBCacheService

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    ;(IndexedDBCacheService as any).instance = null

    // Mock store creation - return a mock store object
    mockCreateStore.mockReturnValue({} as any)

    service = IndexedDBCacheService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = IndexedDBCacheService.getInstance()
      const instance2 = IndexedDBCacheService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should create separate stores for different data types", () => {
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-preview-cache", "preview-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-frame-cache", "frame-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-recognition-cache", "recognition-store")
      expect(mockCreateStore).toHaveBeenCalledWith("timeline-studio-subtitle-cache", "subtitle-store")
      expect(mockCreateStore).toHaveBeenCalledTimes(4)
    })
  })

  describe("Preview Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache preview successfully", async () => {
      const fileId = "test-file-123"
      const thumbnail = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAA..."

      await service.cachePreview(fileId, thumbnail)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          thumbnail,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached preview", async () => {
      const fileId = "test-file-123"
      const thumbnail = "data:image/jpeg;base64,cached-thumbnail"
      const mockCached = {
        fileId,
        thumbnail,
        timestamp: Date.now(),
        size: 1000,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(thumbnail)
      expect(mockGet).toHaveBeenCalledWith(fileId, expect.any(Object))
    })

    it("should return null for non-existent preview", async () => {
      const fileId = "non-existent-file"
      mockGet.mockResolvedValue(null)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(null)
    })

    it("should remove expired preview and return null", async () => {
      const fileId = "expired-file"
      const expiredCached = {
        fileId,
        thumbnail: "expired-thumbnail",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        size: 1000,
      }

      mockGet.mockResolvedValue(expiredCached)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBe(null)
      expect(mockDel).toHaveBeenCalledWith(fileId, expect.any(Object))
    })
  })

  describe("Timeline Frames Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache timeline frames successfully", async () => {
      const fileId = "video-123"
      const frames = [
        {
          timestamp: 0,
          frameData: "frame1-data",
          isKeyframe: true,
        },
        {
          timestamp: 1000,
          frameData: "frame2-data",
          isKeyframe: false,
        },
      ]

      await service.cacheTimelineFrames(fileId, frames)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached timeline frames", async () => {
      const fileId = "video-123"
      const frames = [
        {
          timestamp: 0,
          frameData: "frame1-data",
          isKeyframe: true,
        },
      ]
      const mockCached = {
        fileId,
        frames,
        timestamp: Date.now(),
        size: 2000,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedTimelineFrames(fileId)

      expect(result).toEqual(frames)
      expect(mockGet).toHaveBeenCalledWith(fileId, expect.any(Object))
    })

    it("should handle expired timeline frames", async () => {
      const fileId = "expired-video"
      const expiredCached = {
        fileId,
        frames: [],
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        size: 1000,
      }

      mockGet.mockResolvedValue(expiredCached)

      const result = await service.getCachedTimelineFrames(fileId)

      expect(result).toBe(null)
      expect(mockDel).toHaveBeenCalledWith(fileId, expect.any(Object))
    })
  })

  describe("Recognition Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache recognition frames successfully", async () => {
      const fileId = "recognition-123"
      const frames = [
        {
          timestamp: 0,
          frameData: new Uint8Array([1, 2, 3]),
          resolution: [1920, 1080] as [number, number],
          isKeyframe: true,
          sceneChangeScore: 0.8,
        },
      ]

      await service.cacheRecognitionFrames(fileId, frames)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached recognition frames", async () => {
      const fileId = "recognition-123"
      const frames = [
        {
          timestamp: 0,
          frameData: new Uint8Array([1, 2, 3]),
          resolution: [1920, 1080] as [number, number],
          isKeyframe: true,
        },
      ]
      const mockCached = {
        fileId,
        frames,
        timestamp: Date.now(),
        size: 1500,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedRecognitionFrames(fileId)

      expect(result).toEqual(frames)
    })
  })

  describe("Subtitle Cache", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should cache subtitle frames successfully", async () => {
      const fileId = "subtitle-123"
      const frames = [
        {
          subtitleId: "sub-1",
          subtitleText: "Hello, world!",
          timestamp: 0,
          frameData: new Uint8Array([1, 2, 3]),
          startTime: 0,
          endTime: 1000,
        },
      ]

      await service.cacheSubtitleFrames(fileId, frames)

      expect(mockSet).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          fileId,
          frames,
          timestamp: expect.any(Number),
          size: expect.any(Number),
        }),
        expect.any(Object),
      )
    })

    it("should retrieve cached subtitle frames", async () => {
      const fileId = "subtitle-123"
      const frames = [
        {
          subtitleId: "sub-1",
          subtitleText: "Cached subtitle",
          timestamp: 0,
          frameData: new Uint8Array([1, 2, 3]),
          startTime: 0,
          endTime: 1000,
        },
      ]
      const mockCached = {
        fileId,
        frames,
        timestamp: Date.now(),
        size: 800,
      }

      mockGet.mockResolvedValue(mockCached)

      const result = await service.getCachedSubtitleFrames(fileId)

      expect(result).toEqual(frames)
    })
  })

  describe("Cache Statistics", () => {
    it("should calculate cache statistics correctly", async () => {
      const mockPreviewEntries = [
        ["file1", { fileId: "file1", thumbnail: "data1", timestamp: Date.now(), size: 1000 }],
        ["file2", { fileId: "file2", thumbnail: "data2", timestamp: Date.now(), size: 1500 }],
      ] as any
      const mockFrameEntries = [["video1", { fileId: "video1", frames: [], timestamp: Date.now(), size: 2000 }]] as any
      const mockRecognitionEntries = [
        ["recog1", { fileId: "recog1", frames: [], timestamp: Date.now(), size: 3000 }],
      ] as any
      const mockSubtitleEntries = [["sub1", { fileId: "sub1", frames: [], timestamp: Date.now(), size: 500 }]] as any

      mockEntries
        .mockResolvedValueOnce(mockPreviewEntries)
        .mockResolvedValueOnce(mockFrameEntries)
        .mockResolvedValueOnce(mockRecognitionEntries)
        .mockResolvedValueOnce(mockSubtitleEntries)

      const stats = await service.getCacheStatistics()

      expect(stats).toEqual({
        previewCache: { count: 2, size: 2500 },
        frameCache: { count: 1, size: 2000 },
        recognitionCache: { count: 1, size: 3000 },
        subtitleCache: { count: 1, size: 500 },
        totalSize: 8000,
      })
    })

    it("should handle empty cache statistics", async () => {
      mockEntries.mockResolvedValue([])

      const stats = await service.getCacheStatistics()

      expect(stats).toEqual({
        previewCache: { count: 0, size: 0 },
        frameCache: { count: 0, size: 0 },
        recognitionCache: { count: 0, size: 0 },
        subtitleCache: { count: 0, size: 0 },
        totalSize: 0,
      })
    })
  })

  describe("Cache Cleanup", () => {
    beforeEach(() => {
      mockClear.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should clear individual cache types", async () => {
      await service.clearPreviewCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))

      await service.clearFrameCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))

      await service.clearRecognitionCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))

      await service.clearSubtitleCache()
      expect(mockClear).toHaveBeenCalledWith(expect.any(Object))
    })

    it("should clear all cache types", async () => {
      await service.clearAllCache()

      expect(mockClear).toHaveBeenCalledTimes(4)
    })

    it("should cleanup expired cache entries", async () => {
      const now = Date.now()
      const expiredTime = now - 31 * 24 * 60 * 60 * 1000 // 31 days ago
      const validTime = now - 1 * 24 * 60 * 60 * 1000 // 1 day ago

      const mockExpiredEntries = [
        ["expired1", { fileId: "expired1", thumbnail: "data", timestamp: expiredTime, size: 1000 }],
        ["valid1", { fileId: "valid1", thumbnail: "data", timestamp: validTime, size: 1000 }],
      ] as any

      mockEntries.mockResolvedValue(mockExpiredEntries)

      await service.cleanupExpiredCache()

      expect(mockDel).toHaveBeenCalledWith("expired1", expect.any(Object))
      expect(mockDel).not.toHaveBeenCalledWith("valid1", expect.any(Object))
    })
  })

  describe("Size Estimation", () => {
    it("should estimate string size correctly", () => {
      // Access private method through type assertion
      const estimateStringSize = (service as any).estimateStringSize.bind(service)

      // Mock Blob constructor
      global.Blob = class MockBlob {
        size: number
        constructor(content: any[]) {
          this.size = content[0].length
        }
      } as any

      const size = estimateStringSize("hello")
      expect(size).toBe(5)
    })

    it("should estimate object size correctly", () => {
      const estimateObjectSize = (service as any).estimateObjectSize.bind(service)

      global.Blob = class MockBlob {
        size: number
        constructor(content: any[]) {
          this.size = content[0].length
        }
      } as any

      const obj = { name: "test", value: 123 }
      const size = estimateObjectSize(obj)

      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe("number")
    })
  })

  describe("Cache Size Management", () => {
    it("should trigger cleanup when cache size exceeds limit", async () => {
      // Mock large cache size
      const largeCacheStats: CacheStatistics = {
        previewCache: { count: 100, size: 200 * 1024 * 1024 }, // 200MB
        frameCache: { count: 50, size: 200 * 1024 * 1024 }, // 200MB
        recognitionCache: { count: 30, size: 150 * 1024 * 1024 }, // 150MB
        subtitleCache: { count: 20, size: 50 * 1024 * 1024 }, // 50MB
        totalSize: 600 * 1024 * 1024, // 600MB (exceeds 500MB limit)
      }

      // Mock statistics call
      vi.spyOn(service, "getCacheStatistics").mockResolvedValue(largeCacheStats)

      // Mock entries for cleanup
      const oldEntries = [
        ["old1", { fileId: "old1", timestamp: Date.now() - 10000, size: 100 * 1024 * 1024 }],
        ["old2", { fileId: "old2", timestamp: Date.now() - 20000, size: 100 * 1024 * 1024 }],
      ] as any
      mockEntries.mockResolvedValue(oldEntries)

      // This should trigger cleanup internally
      await service.cachePreview("new-file", "small-thumbnail")

      expect(mockDel).toHaveBeenCalled()
    })

    it("should remove oldest entries first during cleanup", async () => {
      const removeOldestEntries = (service as any).removeOldestEntries.bind(service)

      const oldTime = Date.now() - 20000
      const newTime = Date.now() - 10000

      // Mock entries for preview store (first call)
      const previewEntries = [["old", { fileId: "old", timestamp: oldTime, size: 1000 }]] as any

      // Mock entries for frame store (second call)
      const frameEntries = [["new", { fileId: "new", timestamp: newTime, size: 1000 }]] as any

      // Mock the entries call for each store in order
      mockEntries
        .mockResolvedValueOnce(previewEntries) // preview store
        .mockResolvedValueOnce(frameEntries) // frame store
        .mockResolvedValueOnce([] as any) // recognition store
        .mockResolvedValueOnce([] as any) // subtitle store

      await removeOldestEntries(1500) // Need to free 1500 bytes

      // Should delete oldest entry first (from preview store), then newest (from frame store)
      expect(mockDel).toHaveBeenCalledWith("old", expect.any(Object))
      expect(mockDel).toHaveBeenCalledWith("new", expect.any(Object))
      expect(mockDel).toHaveBeenCalledTimes(2) // Both entries deleted to free 2000 bytes (>= 1500)
    })
  })

  describe("Error Handling", () => {
    it("should handle IndexedDB errors gracefully", async () => {
      const error = new Error("IndexedDB error")
      mockGet.mockRejectedValue(error)

      await expect(service.getCachedPreview("test")).rejects.toThrow("IndexedDB error")
    })

    it("should handle set operation errors", async () => {
      const error = new Error("Storage quota exceeded")
      mockSet.mockRejectedValue(error)

      await expect(service.cachePreview("test", "data")).rejects.toThrow("Storage quota exceeded")
    })

    it("should handle cleanup errors gracefully", async () => {
      mockEntries.mockRejectedValue(new Error("Entries error"))

      // Should not throw
      await expect(service.getCacheStatistics()).rejects.toThrow("Entries error")
    })

    it("should handle deletion errors", async () => {
      mockDel.mockRejectedValue(new Error("Deletion failed"))

      await expect(service.deletePreview("test")).rejects.toThrow("Deletion failed")
    })

    it("should handle clear operation errors", async () => {
      mockClear.mockRejectedValue(new Error("Clear failed"))

      await expect(service.clearPreviewCache()).rejects.toThrow("Clear failed")
    })
  })

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockDel.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should handle empty string as fileId", async () => {
      await service.cachePreview("", "data")

      expect(mockSet).toHaveBeenCalledWith(
        "",
        expect.objectContaining({
          fileId: "",
        }),
        expect.any(Object),
      )
    })

    it("should handle very large thumbnails", async () => {
      const largeThumbnail = `data:image/jpeg;base64,${"A".repeat(10000000)}` // 10MB

      await service.cachePreview("large-file", largeThumbnail)

      expect(mockSet).toHaveBeenCalled()
    })

    it("should handle empty frames array", async () => {
      await service.cacheTimelineFrames("video-1", [])

      expect(mockSet).toHaveBeenCalledWith(
        "video-1",
        expect.objectContaining({
          frames: [],
        }),
        expect.any(Object),
      )
    })

    it("should handle very large frame arrays", async () => {
      const largeFrameArray = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: i * 1000,
        frameData: `frame-${i}`,
        isKeyframe: i % 10 === 0,
      }))

      await service.cacheTimelineFrames("video-large", largeFrameArray)

      expect(mockSet).toHaveBeenCalled()
    })

    it("should handle special characters in fileId", async () => {
      const specialFileId = "file://@#$%^&*()_+-=[]{}|;:',.<>?~`"

      await service.cachePreview(specialFileId, "data")

      expect(mockSet).toHaveBeenCalledWith(
        specialFileId,
        expect.objectContaining({
          fileId: specialFileId,
        }),
        expect.any(Object),
      )
    })

    it("should handle unicode characters in fileId", async () => {
      const unicodeFileId = "файл-видео-测试-🎬"

      await service.cachePreview(unicodeFileId, "data")

      expect(mockSet).toHaveBeenCalledWith(
        unicodeFileId,
        expect.objectContaining({
          fileId: unicodeFileId,
        }),
        expect.any(Object),
      )
    })

    it("should handle concurrent cache operations", async () => {
      const promises = Array.from({ length: 100 }, (_, i) => service.cachePreview(`file-${i}`, `data-${i}`))

      await Promise.all(promises)

      expect(mockSet).toHaveBeenCalledTimes(100)
    })

    it("should handle timestamp exactly at TTL boundary", async () => {
      const fileId = "boundary-file"
      // Немного меньше TTL, чтобы учесть время выполнения теста
      const almostTTL = Date.now() - 30 * 24 * 60 * 60 * 1000 + 100 // 30 days minus 100ms
      const cachedAtBoundary = {
        fileId,
        thumbnail: "data",
        timestamp: almostTTL,
        size: 1000,
      }

      mockGet.mockResolvedValue(cachedAtBoundary)

      const result = await service.getCachedPreview(fileId)

      // Should still be valid (not expired) just before TTL
      expect(result).toBe("data")
      expect(mockDel).not.toHaveBeenCalled()
    })

    it("should handle timestamp just over TTL boundary", async () => {
      const fileId = "expired-boundary-file"
      const justExpired = Date.now() - 30 * 24 * 60 * 60 * 1000 - 1 // Just over 30 days
      const cachedJustExpired = {
        fileId,
        thumbnail: "data",
        timestamp: justExpired,
        size: 1000,
      }

      mockGet.mockResolvedValue(cachedJustExpired)

      const result = await service.getCachedPreview(fileId)

      expect(result).toBeNull()
      expect(mockDel).toHaveBeenCalledWith(fileId, expect.any(Object))
    })

    it("should handle cache statistics with zero-size entries", async () => {
      const zeroSizeEntries = [
        ["file1", { fileId: "file1", thumbnail: "", timestamp: Date.now(), size: 0 }],
        ["file2", { fileId: "file2", thumbnail: "", timestamp: Date.now(), size: 0 }],
      ] as any

      mockEntries.mockResolvedValue(zeroSizeEntries)

      const stats = await service.getCacheStatistics()

      expect(stats.previewCache.count).toBe(2)
      expect(stats.previewCache.size).toBe(0)
    })

    it("should handle deletion of non-existent preview", async () => {
      mockDel.mockResolvedValue(undefined)

      await service.deletePreview("non-existent-file")

      expect(mockDel).toHaveBeenCalledWith("non-existent-file", expect.any(Object))
    })

    it("should handle mixed expired and valid entries in cleanup", async () => {
      const now = Date.now()
      const mixedEntries = [
        ["expired1", { fileId: "expired1", timestamp: now - 31 * 24 * 60 * 60 * 1000, size: 1000 }],
        ["valid1", { fileId: "valid1", timestamp: now - 1 * 24 * 60 * 60 * 1000, size: 1000 }],
        ["expired2", { fileId: "expired2", timestamp: now - 40 * 24 * 60 * 60 * 1000, size: 1000 }],
        ["valid2", { fileId: "valid2", timestamp: now - 5 * 24 * 60 * 60 * 1000, size: 1000 }],
      ] as any

      mockEntries.mockResolvedValue(mixedEntries)

      await service.cleanupExpiredCache()

      expect(mockDel).toHaveBeenCalledWith("expired1", expect.any(Object))
      expect(mockDel).toHaveBeenCalledWith("expired2", expect.any(Object))
      expect(mockDel).not.toHaveBeenCalledWith("valid1", expect.any(Object))
      expect(mockDel).not.toHaveBeenCalledWith("valid2", expect.any(Object))
      expect(mockDel).toHaveBeenCalledTimes(8) // 2 expired entries x 4 stores
    })
  })

  describe("Recognition and Subtitle Cache Integration", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(null)
      mockSet.mockResolvedValue(undefined)
      mockEntries.mockResolvedValue([])
    })

    it("should handle recognition frames with binary data", async () => {
      const binaryFrame = {
        timestamp: 1000,
        frameData: new Uint8Array([255, 128, 64, 32, 16, 8, 4, 2, 1]),
        resolution: [1920, 1080] as [number, number],
        isKeyframe: true,
        sceneChangeScore: 0.95,
      }

      await service.cacheRecognitionFrames("video-binary", [binaryFrame])

      expect(mockSet).toHaveBeenCalledWith(
        "video-binary",
        expect.objectContaining({
          frames: [binaryFrame],
        }),
        expect.any(Object),
      )
    })

    it("should handle subtitle frames with multi-line text", async () => {
      const multiLineSubtitle = {
        subtitleId: "sub-multiline",
        subtitleText: "Line 1\nLine 2\nLine 3\nLine 4",
        timestamp: 5000,
        frameData: new Uint8Array([1, 2, 3]),
        startTime: 5000,
        endTime: 8000,
      }

      await service.cacheSubtitleFrames("video-subtitle", [multiLineSubtitle])

      expect(mockSet).toHaveBeenCalled()
    })

    it("should handle subtitle frames with special characters", async () => {
      const specialCharSubtitle = {
        subtitleId: "sub-special",
        subtitleText: "Hello 世界 🎬 <>&\"'",
        timestamp: 2000,
        frameData: new Uint8Array([]),
        startTime: 2000,
        endTime: 4000,
      }

      await service.cacheSubtitleFrames("video-special", [specialCharSubtitle])

      expect(mockSet).toHaveBeenCalled()
    })
  })

  describe("Memory Management", () => {
    it("should not trigger cleanup when under size limit", async () => {
      const smallCacheStats = {
        previewCache: { count: 10, size: 10 * 1024 * 1024 }, // 10MB
        frameCache: { count: 5, size: 20 * 1024 * 1024 }, // 20MB
        recognitionCache: { count: 3, size: 15 * 1024 * 1024 }, // 15MB
        subtitleCache: { count: 2, size: 5 * 1024 * 1024 }, // 5MB
        totalSize: 50 * 1024 * 1024, // 50MB (well under 500MB limit)
      }

      vi.spyOn(service, "getCacheStatistics").mockResolvedValue(smallCacheStats)
      mockEntries.mockResolvedValue([])

      await service.cachePreview("new-file", "small-data")

      // Cleanup should not have been triggered (no calls to entries for cleanup)
      expect(mockDel).not.toHaveBeenCalled()
    })

    it("should handle zero-byte cleanup request", async () => {
      const removeOldestEntries = (service as any).removeOldestEntries.bind(service)

      mockEntries.mockResolvedValue([])

      await removeOldestEntries(0)

      expect(mockDel).not.toHaveBeenCalled()
    })

    it("should handle negative cleanup request", async () => {
      const removeOldestEntries = (service as any).removeOldestEntries.bind(service)

      mockEntries.mockResolvedValue([])

      await removeOldestEntries(-1000)

      expect(mockDel).not.toHaveBeenCalled()
    })
  })
})
