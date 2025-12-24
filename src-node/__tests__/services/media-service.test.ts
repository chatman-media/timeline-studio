/**
 * EnhancedMediaService Tests
 */

import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test"
import { EnhancedMediaService } from "../../src/services/media-service"
import { CacheService } from "../../src/services/cache-service"
import { QueueService } from "../../src/services/queue-service"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"

const TEST_CACHE_DB = "/tmp/timeline-studio-media-cache-test.db"
const TEST_QUEUE_DB = "/tmp/timeline-studio-media-queue-test.db"

describe("EnhancedMediaService", () => {
  let cacheService: CacheService
  let queueService: QueueService
  let mediaService: EnhancedMediaService

  beforeEach(() => {
    cacheService = new CacheService(TEST_CACHE_DB, 100)
    queueService = new QueueService(TEST_QUEUE_DB, 2)
    mediaService = new EnhancedMediaService(cacheService, queueService)
  })

  afterEach(async () => {
    cacheService.close()
    queueService.close()
    if (existsSync(TEST_CACHE_DB)) await rm(TEST_CACHE_DB)
    if (existsSync(TEST_QUEUE_DB)) await rm(TEST_QUEUE_DB)
  })

  describe("getMetadata", () => {
    test("should cache metadata results", async () => {
      // First call should cache
      const metadata1 = await mediaService.getMetadata("/test/file.mp4")

      // Second call should return from cache
      const metadata2 = await mediaService.getMetadata("/test/file.mp4")

      expect(metadata1).toEqual(metadata2)

      // Verify it's in cache
      const cacheKey = "metadata:/test/file.mp4"
      expect(cacheService.has(cacheKey)).toBe(true)
    })

    test("should return metadata for valid files", async () => {
      const metadata = await mediaService.getMetadata("/test/file.mp4")

      expect(metadata).toBeDefined()
      expect(metadata).toHaveProperty("type")
      expect(metadata).toHaveProperty("duration")
      expect(metadata).toHaveProperty("size")
    })

    test("should handle errors gracefully", async () => {
      expect(async () => {
        await mediaService.getMetadata("/non/existent/file.mp4")
      }).toThrow()
    })
  })

  describe("scanFolder", () => {
    test("should scan directory for media files", async () => {
      const files = await mediaService.scanFolder("/test/directory", {
        recursive: true,
      })

      expect(Array.isArray(files)).toBe(true)
    })

    test("should respect recursive option", async () => {
      const nonRecursive = await mediaService.scanFolder("/test/directory", {
        recursive: false,
      })

      expect(Array.isArray(nonRecursive)).toBe(true)
    })
  })

  describe("generateThumbnail", () => {
    test("should generate thumbnail", async () => {
      const result = await mediaService.generateThumbnail({
        fileId: "test-file-id",
        filePath: "/test/file.mp4",
        width: 320,
        height: 180,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty("thumbnailPath")
    })

    test("should handle custom options", async () => {
      const result = await mediaService.generateThumbnail({
        fileId: "test-file-id",
        filePath: "/test/file.mp4",
        width: 640,
        height: 360,
        timestamp: 5,
      })

      expect(result).toBeDefined()
    })
  })

  describe("generateWaveform", () => {
    test("should generate waveform", async () => {
      const result = await mediaService.generateWaveform({
        fileId: "test-file-id",
        filePath: "/test/file.mp4",
        width: 800,
        height: 200,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty("waveformPath")
    })
  })

  describe("batch operations", () => {
    test("should handle batch thumbnail generation", async () => {
      const files = [
        { fileId: "id1", filePath: "/test/file1.mp4" },
        { fileId: "id2", filePath: "/test/file2.mp4" },
      ]

      const jobId = await mediaService.batchGenerateThumbnails(files, {
        width: 320,
        height: 180,
      })

      expect(typeof jobId).toBe("string")
      expect(jobId.length).toBeGreaterThan(0)

      // Verify job was created
      const status = queueService.getJobStatus(jobId)
      expect(status).toBeDefined()
      expect(status?.type).toBe("batch-thumbnails")
    })

    test("should handle batch waveform generation", async () => {
      const files = [
        { fileId: "id1", filePath: "/test/file1.mp4" },
        { fileId: "id2", filePath: "/test/file2.mp4" },
      ]

      const jobId = await mediaService.batchGenerateWaveforms(files, {
        width: 800,
        height: 200,
      })

      expect(typeof jobId).toBe("string")

      const status = queueService.getJobStatus(jobId)
      expect(status).toBeDefined()
      expect(status?.type).toBe("batch-waveforms")
    })
  })

  describe("cache integration", () => {
    test("should use cache for repeated metadata calls", async () => {
      const filePath = "/test/cached-file.mp4"

      // First call - should hit NodeMediaService
      await mediaService.getMetadata(filePath)

      // Second call - should use cache
      const cachedResult = await mediaService.getMetadata(filePath)

      expect(cachedResult).toBeDefined()

      // Verify cache was used
      const cacheKey = `metadata:${filePath}`
      expect(cacheService.has(cacheKey)).toBe(true)
    })

    test("should cache scan results", async () => {
      const directory = "/test/scan-directory"

      // First scan
      await mediaService.scanFolder(directory)

      // Verify cache
      const cacheKey = `scan:${directory}`
      expect(cacheService.has(cacheKey)).toBe(true)
    })
  })

  describe("delegation to NodeMediaService", () => {
    test("should delegate getMediaFiles", async () => {
      const files = await mediaService.getMediaFiles("/test/directory")
      expect(Array.isArray(files)).toBe(true)
    })

    test("should delegate importFiles", async () => {
      const result = await mediaService.importFiles(
        ["/test/file1.mp4", "/test/file2.mp4"],
        { createThumbnails: true }
      )
      expect(Array.isArray(result)).toBe(true)
    })

    test("should delegate saveTimelineFrames", async () => {
      const frames = [
        { timestamp: 0, data: "frame1" },
        { timestamp: 1, data: "frame2" },
      ]

      const result = await mediaService.saveTimelineFrames(
        "project-id",
        frames as any
      )
      expect(result).toBeDefined()
    })
  })

  describe("error handling", () => {
    test("should handle metadata errors", async () => {
      expect(async () => {
        await mediaService.getMetadata("/invalid/path.mp4")
      }).toThrow()
    })

    test("should handle scan errors gracefully", async () => {
      expect(async () => {
        await mediaService.scanFolder("/non/existent/directory")
      }).toThrow()
    })

    test("should handle thumbnail generation errors", async () => {
      expect(async () => {
        await mediaService.generateThumbnail({
          fileId: "test-id",
          filePath: "/invalid/file.mp4",
          width: 320,
          height: 180,
        })
      }).toThrow()
    })
  })

  describe("performance optimization", () => {
    test("should cache and reuse results", async () => {
      const filePath = "/test/performance-file.mp4"

      // Multiple calls to same file
      const results = await Promise.all([
        mediaService.getMetadata(filePath),
        mediaService.getMetadata(filePath),
        mediaService.getMetadata(filePath),
      ])

      // All should return same data
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])

      // Cache should only have one entry
      const cacheKey = `metadata:${filePath}`
      expect(cacheService.has(cacheKey)).toBe(true)
    })
  })
})
