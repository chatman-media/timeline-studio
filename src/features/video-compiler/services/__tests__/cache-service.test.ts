import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearAllCache, clearPreviewCache, configureCacheSettings, getCacheSize, getCacheStats } from "../cache-service"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Mock Tauri Logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockInvoke = vi.mocked(await import("@tauri-apps/api/core")).invoke

describe("Cache Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getCacheStats", () => {
    it("should return cache statistics successfully", async () => {
      const mockStats = {
        total_entries: 239,
        preview_hits: 130,
        preview_misses: 20,
        metadata_hits: 80,
        metadata_misses: 9,
        memory_usage: {
          preview_bytes: 45200000,
          metadata_bytes: 10000000,
          render_bytes: 65300000,
          total_bytes: 120500000,
          totalSize: 120500000,
          fileCount: 239,
          oldestEntry: "2024-01-01T00:00:00Z",
          newestEntry: "2024-01-02T00:00:00Z",
        },
        cache_size_mb: 120.5,
        total_size_mb: 165.7,
        preview_cache: {
          entries: 150,
          size_mb: 45.2,
        },
        cache_efficiency: 0.89,
      }

      mockInvoke.mockResolvedValue(mockStats)

      const result = await getCacheStats()

      expect(mockInvoke).toHaveBeenCalledWith("get_cache_stats")
      expect(result).toEqual(mockStats)
    })

    it("should handle and re-throw errors", async () => {
      const error = new Error("Failed to get cache stats from backend")
      mockInvoke.mockRejectedValue(error)

      await expect(getCacheStats()).rejects.toThrow("Failed to get cache stats from backend")
    })

    it("should handle Tauri communication errors", async () => {
      const tauriError = new Error("Tauri command not found")
      mockInvoke.mockRejectedValue(tauriError)

      await expect(getCacheStats()).rejects.toThrow("Tauri command not found")
    })
  })

  describe("clearPreviewCache", () => {
    it("should clear preview cache successfully", async () => {
      mockInvoke.mockResolvedValue(undefined)

      await clearPreviewCache()

      expect(mockInvoke).toHaveBeenCalledWith("clear_preview_cache")
    })

    it("should handle clear preview cache errors", async () => {
      const error = new Error("Failed to clear preview cache")
      mockInvoke.mockRejectedValue(error)

      await expect(clearPreviewCache()).rejects.toThrow("Failed to clear preview cache")
    })

    it("should handle permission errors", async () => {
      const permissionError = new Error("Permission denied")
      mockInvoke.mockRejectedValue(permissionError)

      await expect(clearPreviewCache()).rejects.toThrow("Permission denied")
    })
  })

  describe("clearAllCache", () => {
    it("should clear all cache successfully", async () => {
      mockInvoke.mockResolvedValue(undefined)

      await clearAllCache()

      expect(mockInvoke).toHaveBeenCalledWith("clear_all_cache")
    })

    it("should handle clear all cache errors", async () => {
      const error = new Error("Failed to clear all cache")
      mockInvoke.mockRejectedValue(error)

      await expect(clearAllCache()).rejects.toThrow("Failed to clear all cache")
    })

    it("should handle filesystem errors", async () => {
      const fsError = new Error("Disk full")
      mockInvoke.mockRejectedValue(fsError)

      await expect(clearAllCache()).rejects.toThrow("Disk full")
    })
  })

  describe("getCacheSize", () => {
    it("should return cache size in megabytes", async () => {
      const sizeInMB = 256.7
      mockInvoke.mockResolvedValue(sizeInMB)

      const result = await getCacheSize()

      expect(mockInvoke).toHaveBeenCalledWith("get_cache_size")
      expect(result).toBe(sizeInMB)
    })

    it("should return 0 on error and log error", async () => {
      const error = new Error("Cache size calculation failed")
      mockInvoke.mockRejectedValue(error)

      const result = await getCacheSize()

      expect(result).toBe(0)
    })

    it("should handle very large cache sizes", async () => {
      const largeSize = 10240.5 // 10GB
      mockInvoke.mockResolvedValue(largeSize)

      const result = await getCacheSize()

      expect(result).toBe(largeSize)
    })

    it("should handle zero cache size", async () => {
      mockInvoke.mockResolvedValue(0)

      const result = await getCacheSize()

      expect(result).toBe(0)
    })
  })

  describe("configureCacheSettings", () => {
    it("should configure cache with all settings", async () => {
      const settings = {
        max_memory_mb: 1024,
        max_entries: 10000,
        auto_cleanup: true,
      }

      mockInvoke.mockResolvedValue(undefined)

      await configureCacheSettings(settings)

      expect(mockInvoke).toHaveBeenCalledWith("configure_cache", settings)
    })

    it("should configure cache with partial settings", async () => {
      const settings = {
        max_memory_mb: 512,
      }

      mockInvoke.mockResolvedValue(undefined)

      await configureCacheSettings(settings)

      expect(mockInvoke).toHaveBeenCalledWith("configure_cache", settings)
    })

    it("should configure cache with auto cleanup only", async () => {
      const settings = {
        auto_cleanup: false,
      }

      mockInvoke.mockResolvedValue(undefined)

      await configureCacheSettings(settings)

      expect(mockInvoke).toHaveBeenCalledWith("configure_cache", settings)
    })

    it("should handle configuration errors", async () => {
      const settings = {
        max_memory_mb: 2048,
        max_entries: 50000,
        auto_cleanup: true,
      }

      const error = new Error("Invalid cache configuration")
      mockInvoke.mockRejectedValue(error)

      await expect(configureCacheSettings(settings)).rejects.toThrow("Invalid cache configuration")
    })

    it("should handle invalid memory settings", async () => {
      const settings = {
        max_memory_mb: -100, // Invalid negative value
      }

      const error = new Error("Memory size must be positive")
      mockInvoke.mockRejectedValue(error)

      await expect(configureCacheSettings(settings)).rejects.toThrow("Memory size must be positive")
    })

    it("should handle invalid entry count settings", async () => {
      const settings = {
        max_entries: 0, // Invalid zero value
      }

      const error = new Error("Max entries must be greater than zero")
      mockInvoke.mockRejectedValue(error)

      await expect(configureCacheSettings(settings)).rejects.toThrow("Max entries must be greater than zero")
    })
  })

  describe("Error Handling Patterns", () => {
    it("should handle network-like errors from Tauri", async () => {
      const networkError = new Error("Connection to backend failed")
      mockInvoke.mockRejectedValue(networkError)

      await expect(getCacheStats()).rejects.toThrow("Connection to backend failed")
      await expect(clearPreviewCache()).rejects.toThrow("Connection to backend failed")
      await expect(clearAllCache()).rejects.toThrow("Connection to backend failed")
      await expect(configureCacheSettings({})).rejects.toThrow("Connection to backend failed")

      // getCacheSize should return 0 instead of throwing
      const size = await getCacheSize()
      expect(size).toBe(0)
    })

    it("should handle timeout errors", async () => {
      const timeoutError = new Error("Operation timed out")
      mockInvoke.mockRejectedValue(timeoutError)

      await expect(getCacheStats()).rejects.toThrow("Operation timed out")
    })

    it("should handle serialization errors", async () => {
      const serializationError = new Error("Failed to serialize response")
      mockInvoke.mockRejectedValue(serializationError)

      await expect(getCacheStats()).rejects.toThrow("Failed to serialize response")
    })
  })

  describe("Performance Considerations", () => {
    it("should handle large cache statistics efficiently", async () => {
      const largeStats = {
        total_entries: 999999,
        preview_hits: 850000,
        preview_misses: 149999,
        metadata_hits: 420000,
        metadata_misses: 80000,
        memory_usage: {
          preview_bytes: 50000 * 1024 * 1024,
          metadata_bytes: 75000 * 1024 * 1024,
          render_bytes: 0,
          total_bytes: 125000 * 1024 * 1024,
        },
        cache_size_mb: 125000.0,
      }

      mockInvoke.mockResolvedValue(largeStats)

      const result = await getCacheStats()

      expect(result).toEqual(largeStats)
      expect(result.total_entries).toBe(999999)
      expect(result.cache_size_mb).toBe(125000.0)
    })

    it("should handle rapid consecutive calls", async () => {
      mockInvoke.mockResolvedValue(42.5)

      const promises = Array.from({ length: 10 }, () => getCacheSize())
      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      expect(results.every((size) => size === 42.5)).toBe(true)
      expect(mockInvoke).toHaveBeenCalledTimes(10)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty cache statistics", async () => {
      const emptyStats = {
        total_entries: 0,
        preview_hits: 0,
        preview_misses: 0,
        metadata_hits: 0,
        metadata_misses: 0,
        memory_usage: {
          preview_bytes: 0,
          metadata_bytes: 0,
          render_bytes: 0,
          total_bytes: 0,
          totalSize: 0,
          fileCount: 0,
          oldestEntry: "",
          newestEntry: "",
        },
        cache_size_mb: 0.0,
        total_size_mb: 0.0,
        preview_cache: {
          entries: 0,
          size_mb: 0.0,
        },
        cache_efficiency: 0.0,
      }

      mockInvoke.mockResolvedValue(emptyStats)

      const result = await getCacheStats()

      expect(result).toEqual(emptyStats)
    })

    it("should handle configuration with empty settings object", async () => {
      mockInvoke.mockResolvedValue(undefined)

      await configureCacheSettings({})

      expect(mockInvoke).toHaveBeenCalledWith("configure_cache", {})
    })

    it("should handle null/undefined responses gracefully", async () => {
      mockInvoke.mockResolvedValue(null)

      const size = await getCacheSize()

      // Function returns whatever the backend returns, including null
      expect(size).toBe(null)
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle full cache lifecycle operations", async () => {
      // Get initial stats
      const initialStats = {
        total_entries: 300,
        preview_hits: 80,
        preview_misses: 20,
        metadata_hits: 180,
        metadata_misses: 20,
        memory_usage: {
          preview_bytes: 50000000,
          metadata_bytes: 20000000,
          render_bytes: 130000000,
          total_bytes: 200000000,
          totalSize: 200000000,
          fileCount: 300,
          oldestEntry: "2024-01-01T00:00:00Z",
          newestEntry: "2024-01-02T00:00:00Z",
        },
        cache_size_mb: 200.0,
        total_size_mb: 200.0,
        preview_cache: {
          entries: 100,
          size_mb: 50.0,
        },
        cache_efficiency: 0.85,
      }
      mockInvoke.mockResolvedValueOnce(initialStats)

      let stats = await getCacheStats()
      expect(stats.total_size_mb).toBe(200.0)

      // Configure cache
      mockInvoke.mockResolvedValueOnce(undefined)
      await configureCacheSettings({ max_memory_mb: 1024, auto_cleanup: true })

      // Clear preview cache
      mockInvoke.mockResolvedValueOnce(undefined)
      await clearPreviewCache()

      // Get updated stats
      const updatedStats = {
        ...initialStats,
        total_entries: 200,
        preview_cache: { entries: 0, size_mb: 0.0 },
        memory_usage: {
          ...initialStats.memory_usage,
          preview_bytes: 0,
          total_bytes: 150000000,
          totalSize: 150000000,
          fileCount: 200,
        },
        cache_size_mb: 150.0,
        total_size_mb: 150.0,
      }
      mockInvoke.mockResolvedValueOnce(updatedStats)

      stats = await getCacheStats()
      expect(stats.preview_cache.entries).toBe(0)
      expect(stats.total_size_mb).toBe(150.0)
    })

    it("should handle cache overflow scenario", async () => {
      // Simulate cache getting full
      const fullCacheStats = {
        total_entries: 15000,
        preview_hits: 9500,
        preview_misses: 500,
        metadata_hits: 4400,
        metadata_misses: 600,
        memory_usage: {
          preview_bytes: 800000000,
          metadata_bytes: 200000000,
          render_bytes: 500000000,
          total_bytes: 1500000000,
          totalSize: 1500000000,
          fileCount: 15000,
          oldestEntry: "2024-01-01T00:00:00Z",
          newestEntry: "2024-01-02T00:00:00Z",
        },
        cache_size_mb: 1500.0,
        total_size_mb: 1500.0,
        preview_cache: {
          entries: 10000,
          size_mb: 800.0,
        },
        cache_efficiency: 0.68, // Lower efficiency due to overflow
      }

      mockInvoke.mockResolvedValue(fullCacheStats)

      const stats = await getCacheStats()
      expect(stats.total_size_mb).toBeGreaterThan(1000)
      expect(stats.cache_efficiency).toBeLessThan(0.8)
    })
  })
})
