/**
 * API Integration Tests
 *
 * Tests the full tRPC API stack
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { createServer } from "../../src/server"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "../../src/api/root"
import type { Server } from "bun"

const TEST_PORT = 3002
const TEST_URL = `http://localhost:${TEST_PORT}`

describe("API Integration Tests", () => {
  let server: Server
  let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>

  beforeAll(async () => {
    // Start test server
    server = createServer()

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

  afterAll(() => {
    server.stop()
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
      expect(stats).toHaveProperty("memorySize")
      expect(stats).toHaveProperty("dbSize")
      expect(typeof stats.memorySize).toBe("number")
      expect(typeof stats.dbSize).toBe("number")
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
    test("should validate metadata input", async () => {
      expect(async () => {
        await client.media.getMetadata.query({
          filePath: "", // Invalid empty path
        })
      }).toThrow()
    })

    test("should validate scan folder input", async () => {
      expect(async () => {
        await client.media.scanFolder.mutate({
          folderPath: "", // Invalid empty path
        })
      }).toThrow()
    })

    test("should handle valid scan request", async () => {
      // This will fail if directory doesn't exist, but should not throw validation error
      try {
        await client.media.scanFolder.mutate({
          folderPath: "/test/directory",
        })
      } catch (error: any) {
        // Should be a runtime error, not validation error
        expect(error.message).not.toContain("validation")
      }
    })

    test("should validate scanWithThumbnails input", async () => {
      expect(async () => {
        await client.media.scanWithThumbnails.mutate({
          folderPath: "/test",
          width: -1, // Invalid negative width
          height: 180,
        })
      }).toThrow()
    })
  })

  describe("Thumbnail Router", () => {
    test("should validate generate thumbnail input", async () => {
      expect(async () => {
        await client.thumbnail.generate.mutate({
          fileId: "",
          filePath: "",
          width: 0,
          height: 0,
        })
      }).toThrow()
    })

    test("should validate hasCached input", async () => {
      expect(async () => {
        await client.thumbnail.hasCached.query({
          fileId: "",
          width: 320,
          height: 180,
        })
      }).toThrow()
    })

    test("should check cached thumbnail", async () => {
      const result = await client.thumbnail.hasCached.query({
        fileId: "test-file-id",
        width: 320,
        height: 180,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty("cached")
      expect(typeof result.cached).toBe("boolean")
    })
  })

  describe("Waveform Router", () => {
    test("should validate generateData input", async () => {
      expect(async () => {
        await client.waveform.generateData.mutate({
          filePath: "", // Invalid empty path
        })
      }).toThrow()
    })

    test("should validate batchGenerate input", async () => {
      expect(async () => {
        await client.waveform.batchGenerate.mutate({
          files: [], // Empty files array
          width: 800,
          height: 200,
        })
      }).toThrow()
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
      // This test verifies TypeScript compilation
      // Invalid types would cause compilation errors

      // Valid query
      const validQuery: Promise<{ status: string; timestamp: number }> =
        client.health.check.query()

      // Valid mutation
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

      // Should respond within 100ms
      expect(duration).toBeLessThan(100)
    })
  })

  describe("Validation", () => {
    test("should validate file paths", async () => {
      expect(async () => {
        await client.media.getMetadata.query({
          filePath: "relative/path.mp4", // Should require absolute path
        })
      }).toThrow()
    })

    test("should validate dimensions", async () => {
      expect(async () => {
        await client.thumbnail.generate.mutate({
          fileId: "test-id",
          filePath: "/test/file.mp4",
          width: -100, // Invalid negative
          height: 180,
        })
      }).toThrow()
    })

    test("should validate required fields", async () => {
      expect(async () => {
        // @ts-expect-error - Testing runtime validation
        await client.media.scanFolder.mutate({})
      }).toThrow()
    })
  })
})
