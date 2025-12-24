/**
 * CacheService Tests
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { CacheService } from "../../src/services/cache-service"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import path from "node:path"

const TEST_DB_PATH = "/tmp/timeline-studio-cache-test.db"

describe("CacheService", () => {
  let cacheService: CacheService

  beforeEach(() => {
    // Create fresh cache service for each test
    cacheService = new CacheService(TEST_DB_PATH, 10)
  })

  afterEach(async () => {
    // Cleanup
    cacheService.close()
    if (existsSync(TEST_DB_PATH)) {
      await rm(TEST_DB_PATH)
    }
  })

  describe("get/set", () => {
    test("should store and retrieve values", () => {
      cacheService.set("key1", { data: "test value" })
      const result = cacheService.get<{ data: string }>("key1")

      expect(result).toEqual({ data: "test value" })
    })

    test("should return undefined for non-existent keys", () => {
      const result = cacheService.get("non-existent")
      expect(result).toBeUndefined()
    })

    test("should handle different value types", () => {
      cacheService.set("string", "test")
      cacheService.set("number", 42)
      cacheService.set("boolean", true)
      cacheService.set("array", [1, 2, 3])
      cacheService.set("object", { nested: { value: "test" } })

      expect(cacheService.get("string")).toBe("test")
      expect(cacheService.get("number")).toBe(42)
      expect(cacheService.get("boolean")).toBe(true)
      expect(cacheService.get("array")).toEqual([1, 2, 3])
      expect(cacheService.get("object")).toEqual({ nested: { value: "test" } })
    })
  })

  describe("has", () => {
    test("should return true for existing keys", () => {
      cacheService.set("key1", "value")
      expect(cacheService.has("key1")).toBe(true)
    })

    test("should return false for non-existent keys", () => {
      expect(cacheService.has("non-existent")).toBe(false)
    })
  })

  describe("delete", () => {
    test("should remove key from cache", () => {
      cacheService.set("key1", "value")
      expect(cacheService.has("key1")).toBe(true)

      cacheService.delete("key1")
      expect(cacheService.has("key1")).toBe(false)
      expect(cacheService.get("key1")).toBeUndefined()
    })

    test("should handle deleting non-existent keys", () => {
      expect(() => cacheService.delete("non-existent")).not.toThrow()
    })
  })

  describe("clear", () => {
    test("should remove all entries", () => {
      cacheService.set("key1", "value1")
      cacheService.set("key2", "value2")
      cacheService.set("key3", "value3")

      const statsBefore = cacheService.getStats()
      expect(statsBefore.memorySize).toBeGreaterThan(0)

      cacheService.clear()

      const statsAfter = cacheService.getStats()
      expect(statsAfter.memorySize).toBe(0)
      expect(statsAfter.dbSize).toBe(0)
    })
  })

  describe("TTL (Time To Live)", () => {
    test("should expire entries after TTL", async () => {
      // Set with 100ms TTL
      cacheService.set("key1", "value", 100)

      // Should be available immediately
      expect(cacheService.get("key1")).toBe("value")

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should be expired
      expect(cacheService.get("key1")).toBeUndefined()
    })

    test("should use default TTL if not specified", () => {
      cacheService.set("key1", "value")
      expect(cacheService.get("key1")).toBe("value")
    })
  })

  describe("two-tier caching", () => {
    test("should check memory first, then SQLite", () => {
      // Set value
      cacheService.set("key1", "value")

      // Should be in memory
      expect(cacheService.get("key1")).toBe("value")

      // Create new cache service with same DB
      cacheService.close()
      const newCacheService = new CacheService(TEST_DB_PATH, 10)

      // Should retrieve from SQLite
      expect(newCacheService.get("key1")).toBe("value")

      newCacheService.close()
    })

    test("should persist to SQLite", () => {
      cacheService.set("key1", { data: "persisted" })
      cacheService.close()

      // Create new cache service
      const newCacheService = new CacheService(TEST_DB_PATH, 10)
      const result = newCacheService.get<{ data: string }>("key1")

      expect(result).toEqual({ data: "persisted" })
      newCacheService.close()
    })
  })

  describe("LRU eviction", () => {
    test("should evict least recently used entries when max size reached", () => {
      const smallCache = new CacheService(TEST_DB_PATH, 3)

      // Fill cache
      smallCache.set("key1", "value1")
      smallCache.set("key2", "value2")
      smallCache.set("key3", "value3")

      // All should be present
      expect(smallCache.has("key1")).toBe(true)
      expect(smallCache.has("key2")).toBe(true)
      expect(smallCache.has("key3")).toBe(true)

      // Add one more, should evict oldest
      smallCache.set("key4", "value4")

      // key1 should be evicted from memory (but may still be in SQLite)
      const stats = smallCache.getStats()
      expect(stats.memorySize).toBeLessThanOrEqual(3)

      smallCache.close()
    })
  })

  describe("getStats", () => {
    test("should return cache statistics", () => {
      cacheService.set("key1", "value1")
      cacheService.set("key2", "value2")

      const stats = cacheService.getStats()

      expect(stats).toHaveProperty("memorySize")
      expect(stats).toHaveProperty("dbSize")
      expect(typeof stats.memorySize).toBe("number")
      expect(typeof stats.dbSize).toBe("number")
      expect(stats.memorySize).toBeGreaterThan(0)
    })

    test("should show empty stats for empty cache", () => {
      const stats = cacheService.getStats()

      expect(stats.memorySize).toBe(0)
      expect(stats.dbSize).toBe(0)
    })
  })

  describe("error handling", () => {
    test("should handle serialization errors gracefully", () => {
      // Create circular reference
      const circular: any = { a: 1 }
      circular.self = circular

      expect(() => cacheService.set("circular", circular)).toThrow()
    })

    test("should handle database errors gracefully", () => {
      cacheService.close()

      // Trying to use closed cache should throw
      expect(() => cacheService.set("key", "value")).toThrow()
    })
  })
})
