/**
 * Tests for PreviewCache
 * Тесты для LRU кеша preview фреймов
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { PreviewCache } from "../../services/preview-cache"
import type { Effect } from "../../types"

// Mock createLogger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock ImageBitmap
const createMockImageBitmap = (width: number, height: number): ImageBitmap =>
  ({
    width,
    height,
    close: vi.fn(),
  }) as unknown as ImageBitmap

describe("PreviewCache", () => {
  let cache: PreviewCache

  beforeEach(() => {
    cache = new PreviewCache(10) // 10MB cache size
  })

  describe("initialization", () => {
    it("should initialize with default size", () => {
      const defaultCache = new PreviewCache()
      const stats = defaultCache.getStats()

      expect(stats.maxSizeMB).toBe(100)
      expect(stats.entries).toBe(0)
      expect(stats.sizeMB).toBe(0)
    })

    it("should initialize with custom size", () => {
      const stats = cache.getStats()

      expect(stats.maxSizeMB).toBe(10)
      expect(stats.entries).toBe(0)
    })
  })

  describe("cache key generation", () => {
    it("should generate consistent cache keys", () => {
      const effects: Effect[] = [
        {
          id: "effect1",
          type: "blur",
          enabled: true,
          parameters: { radius: 5 },
          intensity: 1.0,
        },
      ]

      const key1 = cache.getCacheKey(1.5, effects)
      const key2 = cache.getCacheKey(1.5, effects)

      expect(key1).toBe(key2)
    })

    it("should generate different keys for different timestamps", () => {
      const effects: Effect[] = []

      const key1 = cache.getCacheKey(1.0, effects)
      const key2 = cache.getCacheKey(2.0, effects)

      expect(key1).not.toBe(key2)
    })

    it("should generate different keys for different effects", () => {
      const effects1: Effect[] = [
        {
          id: "effect1",
          type: "blur",
          enabled: true,
          parameters: { radius: 5 },
          intensity: 1.0,
        },
      ]

      const effects2: Effect[] = [
        {
          id: "effect2",
          type: "sharpen",
          enabled: true,
          parameters: { amount: 1.5 },
          intensity: 0.8,
        },
      ]

      const key1 = cache.getCacheKey(1.0, effects1)
      const key2 = cache.getCacheKey(1.0, effects2)

      expect(key1).not.toBe(key2)
    })

    it("should ignore disabled effects in key generation", () => {
      const effects1: Effect[] = [
        {
          id: "effect1",
          type: "blur",
          enabled: true,
          parameters: { radius: 5 },
          intensity: 1.0,
        },
        {
          id: "effect2",
          type: "sharpen",
          enabled: false,
          parameters: { amount: 1.5 },
          intensity: 0.8,
        },
      ]

      const effects2: Effect[] = [
        {
          id: "effect1",
          type: "blur",
          enabled: true,
          parameters: { radius: 5 },
          intensity: 1.0,
        },
      ]

      const key1 = cache.getCacheKey(1.0, effects1)
      const key2 = cache.getCacheKey(1.0, effects2)

      expect(key1).toBe(key2)
    })
  })

  describe("getOrCompute", () => {
    it("should compute and cache new frame", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const compute = vi.fn().mockResolvedValue(mockBitmap)
      const effects: Effect[] = []

      const result = await cache.getOrCompute(1.0, effects, compute)

      expect(compute).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockBitmap)

      const stats = cache.getStats()
      expect(stats.entries).toBe(1)
    })

    it("should return cached frame without computing", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const compute = vi.fn().mockResolvedValue(mockBitmap)
      const effects: Effect[] = []

      // First call - compute
      await cache.getOrCompute(1.0, effects, compute)

      // Second call - cached
      const result = await cache.getOrCompute(1.0, effects, compute)

      expect(compute).toHaveBeenCalledTimes(1) // Only called once
      expect(result).toBe(mockBitmap)
    })

    it("should move accessed entry to end (LRU)", async () => {
      const mockBitmap1 = createMockImageBitmap(1920, 1080)
      const mockBitmap2 = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap1))
      await cache.getOrCompute(2.0, effects, () => Promise.resolve(mockBitmap2))

      // Access first entry again
      const result = await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap1))

      expect(result).toBe(mockBitmap1)
      expect(cache.getStats().entries).toBe(2)
    })

    it("should evict oldest entry when cache is full", async () => {
      // Create cache with very small size (1 frame)
      const smallCache = new PreviewCache(0.01) // 0.01MB

      const mockBitmap1 = createMockImageBitmap(1920, 1080)
      const mockBitmap2 = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      await smallCache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap1))
      await smallCache.getOrCompute(2.0, effects, () => Promise.resolve(mockBitmap2))

      const stats = smallCache.getStats()
      // Should only have 1 entry due to size limit
      expect(stats.entries).toBeLessThanOrEqual(2)
    })

    it("should calculate correct entry size", async () => {
      const width = 1920
      const height = 1080
      const mockBitmap = createMockImageBitmap(width, height)
      const effects: Effect[] = []

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      const stats = cache.getStats()
      const expectedSizeMB = (width * height * 4) / (1024 * 1024)

      expect(stats.sizeMB).toBeCloseTo(expectedSizeMB, 2)
    })
  })

  describe("prefetch", () => {
    it("should prefetch frames around center timestamp", async () => {
      const effects: Effect[] = []
      let computeCount = 0
      const compute = vi.fn().mockImplementation((timestamp: number) => {
        computeCount++
        return Promise.resolve(createMockImageBitmap(1920, 1080))
      })

      await cache.prefetch(5.0, 2.0, 30, effects, compute)

      // Should prefetch frames from 3.0 to 7.0 at 30fps (~60 frames)
      expect(compute.mock.calls.length).toBeGreaterThan(0)
    })

    it("should not prefetch already cached frames", async () => {
      const effects: Effect[] = []
      const mockBitmap = createMockImageBitmap(1920, 1080)

      // Cache a frame
      await cache.getOrCompute(5.0, effects, () => Promise.resolve(mockBitmap))

      const compute = vi.fn().mockResolvedValue(mockBitmap)
      await cache.prefetch(5.0, 0.5, 30, effects, compute)

      // Should not compute the already cached frame at 5.0
      const calls = compute.mock.calls
      const hasCenterTime = calls.some((call) => Math.abs(call[0] - 5.0) < 0.001)
      expect(hasCenterTime).toBe(false)
    })

    it("should handle prefetch errors gracefully", async () => {
      const effects: Effect[] = []
      const compute = vi.fn().mockRejectedValue(new Error("Prefetch failed"))

      // Should not throw
      await expect(cache.prefetch(5.0, 1.0, 30, effects, compute)).resolves.toBeUndefined()
    })

    it("should respect cache size limit during prefetch", async () => {
      const smallCache = new PreviewCache(0.1) // Small cache
      const effects: Effect[] = []
      const compute = vi.fn().mockResolvedValue(createMockImageBitmap(1920, 1080))

      await smallCache.prefetch(5.0, 2.0, 30, effects, compute)

      const stats = smallCache.getStats()
      expect(stats.sizeMB).toBeLessThanOrEqual(0.1)
    })
  })

  describe("invalidate", () => {
    it("should clear entire cache when no effects specified", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))
      await cache.getOrCompute(2.0, effects, () => Promise.resolve(mockBitmap))

      expect(cache.getStats().entries).toBe(2)

      cache.invalidate()

      const stats = cache.getStats()
      expect(stats.entries).toBe(0)
      expect(stats.sizeMB).toBe(0)
    })

    it("should clear only entries with matching effects", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects1: Effect[] = [
        {
          id: "effect1",
          type: "blur",
          enabled: true,
          parameters: { radius: 5 },
          intensity: 1.0,
        },
      ]
      const effects2: Effect[] = [
        {
          id: "effect2",
          type: "sharpen",
          enabled: true,
          parameters: { amount: 1.5 },
          intensity: 0.8,
        },
      ]

      await cache.getOrCompute(1.0, effects1, () => Promise.resolve(mockBitmap))
      await cache.getOrCompute(2.0, effects2, () => Promise.resolve(mockBitmap))

      expect(cache.getStats().entries).toBe(2)

      cache.invalidate(effects1)

      // Should have 1 entry left (effects2)
      expect(cache.getStats().entries).toBe(1)
    })

    it("should update size correctly after invalidation", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      const statsBefore = cache.getStats()
      expect(statsBefore.sizeMB).toBeGreaterThan(0)

      cache.invalidate()

      const statsAfter = cache.getStats()
      expect(statsAfter.sizeMB).toBe(0)
    })
  })

  describe("getStats", () => {
    it("should return accurate statistics", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      const stats1 = cache.getStats()
      expect(stats1.entries).toBe(0)
      expect(stats1.sizeBytes).toBe(0)
      expect(stats1.sizeMB).toBe(0)
      expect(stats1.maxSizeMB).toBe(10)
      expect(stats1.fillPercentage).toBe(0)

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      const stats2 = cache.getStats()
      expect(stats2.entries).toBe(1)
      expect(stats2.sizeBytes).toBeGreaterThan(0)
      expect(stats2.sizeMB).toBeGreaterThan(0)
      expect(stats2.fillPercentage).toBeGreaterThan(0)
    })

    it("should calculate fill percentage correctly", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      const stats = cache.getStats()
      const expectedPercentage = (stats.sizeMB / stats.maxSizeMB) * 100

      expect(stats.fillPercentage).toBeCloseTo(expectedPercentage, 2)
    })
  })

  describe("dispose", () => {
    it("should clear all cache entries", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))
      await cache.getOrCompute(2.0, effects, () => Promise.resolve(mockBitmap))

      expect(cache.getStats().entries).toBe(2)

      cache.dispose()

      const stats = cache.getStats()
      expect(stats.entries).toBe(0)
      expect(stats.sizeMB).toBe(0)
    })

    it("should be safe to call multiple times", () => {
      expect(() => {
        cache.dispose()
        cache.dispose()
      }).not.toThrow()
    })
  })

  describe("edge cases", () => {
    it("should handle empty effects array", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      const result = await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      expect(result).toBe(mockBitmap)
      expect(cache.getStats().entries).toBe(1)
    })

    it("should handle zero timestamp", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      const result = await cache.getOrCompute(0, effects, () => Promise.resolve(mockBitmap))

      expect(result).toBe(mockBitmap)
    })

    it("should handle negative timestamp", async () => {
      const mockBitmap = createMockImageBitmap(1920, 1080)
      const effects: Effect[] = []

      const result = await cache.getOrCompute(-1.0, effects, () => Promise.resolve(mockBitmap))

      expect(result).toBe(mockBitmap)
    })

    it("should handle very small bitmaps", async () => {
      const mockBitmap = createMockImageBitmap(1, 1)
      const effects: Effect[] = []

      const result = await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      expect(result).toBe(mockBitmap)
      const stats = cache.getStats()
      expect(stats.sizeMB).toBeGreaterThan(0)
    })

    it("should handle very large bitmaps", async () => {
      const mockBitmap = createMockImageBitmap(3840, 2160) // 4K
      const effects: Effect[] = []

      const result = await cache.getOrCompute(1.0, effects, () => Promise.resolve(mockBitmap))

      expect(result).toBe(mockBitmap)
    })

    it("should handle compute function throwing error", async () => {
      const effects: Effect[] = []
      const compute = vi.fn().mockRejectedValue(new Error("Compute failed"))

      await expect(cache.getOrCompute(1.0, effects, compute)).rejects.toThrow("Compute failed")
    })
  })
})
