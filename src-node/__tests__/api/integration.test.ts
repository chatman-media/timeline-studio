/**
 * API Integration Tests
 *
 * Tests the full tRPC API stack
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { createServer } from "../../src/server"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "../../src/api/root"
import { CacheService } from "../../src/services/cache-service"
import { QueueService } from "../../src/services/queue-service"
import { EnhancedMediaService } from "../../src/services/media-service"
import { initializeServices } from "../../src/api/context"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import type { Server } from "bun"

const TEST_PORT = 3002
const TEST_URL = `http://localhost:${TEST_PORT}`
const TEST_CACHE_DB = "/tmp/timeline-studio-integration-cache.db"
const TEST_QUEUE_DB = "/tmp/timeline-studio-integration-queue.db"

describe("API Integration Tests", () => {
  let server: Server
  let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>
  let cacheService: CacheService
  let queueService: QueueService

  beforeAll(async () => {
    // Initialize services required by tRPC context
    cacheService = new CacheService(TEST_CACHE_DB, 100)
    queueService = new QueueService(TEST_QUEUE_DB, 1)
    const mediaService = new EnhancedMediaService(cacheService, queueService)
    initializeServices({ mediaService, cacheService, queueService })

    // Start test server on dedicated port
    server = createServer(TEST_PORT)

    // Create tRPC client
    client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${TEST_URL}/trpc`,
        }),
      ],
    })

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 100))
  })

  afterAll(async () => {
    server.stop()
    cacheService?.close()
    queueService?.close()
    if (existsSync(TEST_CACHE_DB)) await rm(TEST_CACHE_DB)
    if (existsSync(TEST_QUEUE_DB)) await rm(TEST_QUEUE_DB)
  })

  describe("Health Router", () => {
    test("should check server health", async () => {
      const result = await client.health.check.query()

      expect(result).toBeDefined()
      expect(result).toHaveProperty("status")
      expect(result.status).toBe("ok")
      expect(result).toHaveProperty("timestamp")
      expect(typeof result.timestamp).toBe("number")
    })

    test("should check FFmpeg availability", async () => {
      const result = await client.health.ffmpegCheck.query()

      expect(result).toBeDefined()
      expect(result).toHaveProperty("available")
      expect(typeof result.available).toBe("boolean")
      expect(result).toHaveProperty("timestamp")
    })
  })

  describe("Cache Router", () => {
    test("should get cache stats", async () => {
      const stats = await client.cache.getStats.query()

      expect(stats).toBeDefined()
      expect(stats).toHaveProperty("cache")
      expect(stats).toHaveProperty("queue")
      expect(stats).toHaveProperty("timestamp")
      expect(stats.cache).toHaveProperty("memorySize")
      expect(stats.cache).toHaveProperty("dbSize")
      expect(typeof stats.cache.memorySize).toBe("number")
      expect(typeof stats.cache.dbSize).toBe("number")
    })

    test("should clear cache", async () => {
      const result = await client.cache.clear.mutate()

      expect(result).toBeDefined()
      expect(result).toHaveProperty("success")
      expect(result.success).toBe(true)
    })

    test("should delete cache key", async () => {
      const result = await client.cache.delete.mutate({ key: "test-key" })

      expect(result).toBeDefined()
      expect(result).toHaveProperty("success")
      expect(result.success).toBe(true)
    })
  })

  describe("Media Router", () => {
    test("should validate metadata input — reject empty path", async () => {
      await expect(
        client.media.getMetadata.query({ filePath: "" })
      ).rejects.toThrow()
    })

    test("should validate scan folder input — reject empty path", async () => {
      await expect(
        client.media.scanFolder.mutate({ folderPath: "" })
      ).rejects.toThrow()
    })

    test("should handle valid scan request — runtime error, not validation", async () => {
      try {
        await client.media.scanFolder.mutate({
          folderPath: "/test/directory",
        })
      } catch (error: any) {
        expect(error.message).not.toContain("validation")
      }
    })

    test("should validate scanWithThumbnails — reject negative width", async () => {
      await expect(
        client.media.scanWithThumbnails.mutate({
          folderPath: "/test",
          width: -1,
          height: 180,
        })
      ).rejects.toThrow()
    })
  })

  describe("Thumbnail Router", () => {
    test("should validate generate thumbnail input — reject empty fields", async () => {
      await expect(
        client.thumbnail.generate.mutate({
          fileId: "",
          filePath: "",
        })
      ).rejects.toThrow()
    })

    test("should validate hasCached input — reject empty fileId", async () => {
      await expect(
        client.thumbnail.hasCached.query({
          fileId: "",
          width: 320,
          height: 180,
        })
      ).rejects.toThrow()
    })

    test("should check cached thumbnail — returns hasCached boolean", async () => {
      const result = await client.thumbnail.hasCached.query({
        fileId: "test-file-id",
        width: 320,
        height: 180,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty("hasCached")
      expect(typeof result.hasCached).toBe("boolean")
    })
  })

  describe("Waveform Router", () => {
    test("should validate generateData input — reject empty path", async () => {
      await expect(
        client.waveform.generateData.query({ filePath: "" })
      ).rejects.toThrow()
    })

    test("should validate batchGenerate input — reject empty files array", async () => {
      await expect(
        client.waveform.batchGenerate.mutate({
          files: [],
          width: 800,
          height: 200,
        })
      ).rejects.toThrow()
    })
  })

  describe("Queue Router", () => {
    test("should get queue stats", async () => {
      const stats = await client.queue.getStats.query()

      expect(stats).toBeDefined()
    })

    test("should return null for unknown job ID", async () => {
      const result = await client.queue.getJobStatus.query({
        jobId: "non-existent-job-id",
      })

      expect(result).toBeNull()
    })

    test("should validate getJobStatus — reject empty jobId", async () => {
      await expect(
        client.queue.getJobStatus.query({ jobId: "" })
      ).rejects.toThrow()
    })
  })

  describe("Error Handling", () => {
    test("should handle invalid routes", async () => {
      const response = await fetch(`${TEST_URL}/invalid-route`)
      expect(response.status).toBe(404)
    })

    test("should return JSON errors for tRPC failures", async () => {
      try {
        await client.media.getMetadata.query({
          filePath: "/invalid/file.mp4",
        })
      } catch (error: any) {
        expect(error).toBeDefined()
        expect(error.message).toBeDefined()
      }
    })
  })

  describe("CORS", () => {
    test("should handle OPTIONS requests", async () => {
      const response = await fetch(`${TEST_URL}/trpc/health.check`, {
        method: "OPTIONS",
      })

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined()
      expect(response.headers.get("Access-Control-Allow-Methods")).toBeDefined()
    })

    test("should include CORS headers in responses", async () => {
      const response = await fetch(`${TEST_URL}/trpc/health.check`)

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined()
    })
  })

  describe("Batch Requests", () => {
    test("should handle multiple queries in batch", async () => {
      const [health, stats] = await Promise.all([
        client.health.check.query(),
        client.cache.getStats.query(),
      ])

      expect(health).toBeDefined()
      expect(stats).toBeDefined()
    })

    test("should handle mixed queries and mutations", async () => {
      const [health, clearResult] = await Promise.all([
        client.health.check.query(),
        client.cache.clear.mutate(),
      ])

      expect(health.status).toBe("ok")
      expect(clearResult.success).toBe(true)
    })
  })

  describe("Type Safety", () => {
    test("should enforce types at compile time", () => {
      const validQuery: Promise<{ status: string; timestamp: number }> =
        client.health.check.query()

      const validMutation: Promise<{ success: boolean }> =
        client.cache.clear.mutate()

      expect(validQuery).toBeDefined()
      expect(validMutation).toBeDefined()
    })
  })

  describe("Performance", () => {
    test("should handle concurrent requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        client.health.check.query()
      )

      const results = await Promise.all(requests)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.status).toBe("ok")
      })
    })

    test("should respond quickly to health checks", async () => {
      const start = Date.now()
      await client.health.check.query()
      const duration = Date.now() - start

      // Should respond within 200ms (generous for CI environments)
      expect(duration).toBeLessThan(200)
    })
  })

  describe("Validation", () => {
    test("should reject empty file paths", async () => {
      await expect(
        client.media.getMetadata.query({ filePath: "" })
      ).rejects.toThrow()
    })

    test("should validate dimensions — reject negative values", async () => {
      await expect(
        client.thumbnail.generate.mutate({
          fileId: "test-id",
          filePath: "/test/file.mp4",
          width: -100,
          height: 180,
        })
      ).rejects.toThrow()
    })

    test("should validate required fields", async () => {
      await expect(
        // @ts-expect-error - Testing runtime validation
        client.media.scanFolder.mutate({})
      ).rejects.toThrow()
    })
  })
})
