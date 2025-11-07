import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  type CacheStatsWithRatios,
  formatCacheRatio,
  formatCacheSize,
  useCacheStats,
} from "../../hooks/use-cache-stats"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("useCacheStats", () => {
  let mockInvoke: any

  const mockCacheStats: CacheStatsWithRatios = {
    total_entries: 235,
    preview_hits: 120,
    preview_misses: 30,
    metadata_hits: 60,
    metadata_misses: 15,
    memory_usage: {
      preview_bytes: 512 * 1024 * 1024, // 512MB
      metadata_bytes: 64 * 1024 * 1024, // 64MB
      render_bytes: 448 * 1024 * 1024, // 448MB
      total_bytes: 1024 * 1024 * 1024,
      totalSize: 0,
      fileCount: 0,
      oldestEntry: "",
      newestEntry: "",
    },
    cache_size_mb: 1024,
    hit_ratio: 0.8, // (120+60)/(120+30+60+15) = 180/225
    preview_hit_ratio: 0.8,
    total_size_mb: 0,
    preview_cache: {
      entries: 0,
      size_mb: 0,
    },
    cache_efficiency: 0,
    cache_hits: 180,
    cache_misses: 45,
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    mockInvoke = vi.mocked(invoke)
  })

  it("should initialize with null stats", () => {
    const { result } = renderHook(() => useCacheStats())

    expect(result.current.stats).toBeNull()
    expect(result.current.isLoading).toBe(true) // Loading starts immediately
    expect(result.current.error).toBeNull()
  })

  it("should load cache stats on mount with calculated ratios", async () => {
    mockInvoke.mockResolvedValueOnce(mockCacheStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    // Проверяем, что статистика загружена и ratios вычислены
    expect(result.current.stats?.total_entries).toBe(235)
    expect(result.current.stats?.preview_hits).toBe(120)
    expect(result.current.stats?.hit_ratio).toBeCloseTo(0.8, 2) // (120+60)/(120+30+60+15)
    expect(result.current.stats?.preview_hit_ratio).toBeCloseTo(0.8, 2) // 120/(120+30)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should handle error when loading stats", async () => {
    const errorMessage = "Failed to get cache stats"
    mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
    })

    expect(result.current.stats).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it("should refresh stats", async () => {
    mockInvoke.mockResolvedValueOnce(mockCacheStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    // Обновляем с новыми данными
    const updatedStats: CacheStatsWithRatios = {
      ...mockCacheStats,
      total_entries: 285,
      preview_hits: 160,
      cache_size_mb: 1536,
      hit_ratio: 0.83, // Пересчитанное значение
      preview_hit_ratio: 0.84, // Пересчитанное значение
    }

    mockInvoke.mockResolvedValueOnce(updatedStats)

    await act(async () => {
      await result.current.refreshStats()
    })

    expect(result.current.stats?.total_entries).toBe(285)
    expect(result.current.stats?.preview_hits).toBe(160)
  })

  it("should clear preview cache", async () => {
    mockInvoke.mockResolvedValueOnce(mockCacheStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    mockInvoke.mockResolvedValueOnce(undefined) // clear_preview_cache

    // Обновленные статы после очистки превью
    const updatedStats: CacheStatsWithRatios = {
      ...mockCacheStats,
      preview_hits: 0,
      preview_misses: 0,
      memory_usage: {
        ...mockCacheStats.memory_usage,
        preview_bytes: 0,
        total_bytes: mockCacheStats.memory_usage.metadata_bytes + mockCacheStats.memory_usage.render_bytes,
      },
      cache_size_mb: 512,
      hit_ratio: 0.8, // metadata всё еще есть: 60/(60+15)
      preview_hit_ratio: 0, // превью очищено
    }

    mockInvoke.mockResolvedValueOnce(updatedStats) // refreshStats

    const success = await act(async () => {
      return await result.current.clearPreviewCache()
    })

    expect(success).toBe(true)
    expect(mockInvoke).toHaveBeenCalledWith("clear_preview_cache")

    // Проверяем, что статистика обновилась
    expect(result.current.stats?.preview_hits).toBe(0)
    expect(result.current.stats?.cache_size_mb).toBe(512)
  })

  it("should clear all cache", async () => {
    mockInvoke.mockResolvedValueOnce(mockCacheStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    mockInvoke.mockResolvedValueOnce(undefined) // clear_all_cache

    // Пустая статистика после полной очистки
    const emptyStats: CacheStatsWithRatios = {
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
      cache_size_mb: 0,
      hit_ratio: 0,
      preview_hit_ratio: 0,
      total_size_mb: 0,
      preview_cache: {
        entries: 0,
        size_mb: 0,
      },
      cache_efficiency: 0,
      cache_hits: 180,
      cache_misses: 45,
    }

    mockInvoke.mockResolvedValueOnce(emptyStats) // refreshStats

    const success = await act(async () => {
      return await result.current.clearAllCache()
    })

    expect(success).toBe(true)
    expect(mockInvoke).toHaveBeenCalledWith("clear_all_cache")

    // Проверяем, что кеш очищен
    expect(result.current.stats?.total_entries).toBe(0)
    expect(result.current.stats?.cache_size_mb).toBe(0)
  })

  it("should handle clear preview cache error", async () => {
    mockInvoke.mockResolvedValueOnce(mockCacheStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    const errorMessage = "Failed to clear preview cache"
    mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

    const success = await act(async () => {
      return await result.current.clearPreviewCache()
    })

    expect(success).toBe(false)
    expect(result.current.error).toBe(errorMessage)
  })

  it("should handle clear all cache error", async () => {
    mockInvoke.mockResolvedValueOnce(mockCacheStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    const errorMessage = "Failed to clear all cache"
    mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

    const success = await act(async () => {
      return await result.current.clearAllCache()
    })

    expect(success).toBe(false)
    expect(result.current.error).toBe(errorMessage)
  })

  it("should calculate hit ratios correctly", async () => {
    const statsWithNoHits: CacheStatsWithRatios = {
      total_entries: 100,
      preview_hits: 0,
      preview_misses: 50,
      metadata_hits: 0,
      metadata_misses: 50,
      memory_usage: {
        preview_bytes: 100 * 1024 * 1024,
        metadata_bytes: 50 * 1024 * 1024,
        render_bytes: 0,
        total_bytes: 150 * 1024 * 1024,
        totalSize: 0,
        fileCount: 0,
        oldestEntry: "",
        newestEntry: "",
      },
      cache_size_mb: 150,
      hit_ratio: 0,
      preview_hit_ratio: 0,
      total_size_mb: 0,
      preview_cache: {
        entries: 0,
        size_mb: 0,
      },
      cache_efficiency: 0,
      cache_hits: 180,
      cache_misses: 45,
    }

    mockInvoke.mockResolvedValueOnce(statsWithNoHits)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    expect(result.current.stats?.hit_ratio).toBe(0)
    expect(result.current.stats?.preview_hit_ratio).toBe(0)
  })

  it("should handle empty cache stats", async () => {
    const emptyStats: CacheStatsWithRatios = {
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
      cache_size_mb: 0,
      hit_ratio: 0,
      preview_hit_ratio: 0,
      total_size_mb: 0,
      preview_cache: {
        entries: 0,
        size_mb: 0,
      },
      cache_efficiency: 0,
      cache_hits: 180,
      cache_misses: 45,
    }

    mockInvoke.mockResolvedValueOnce(emptyStats)

    const { result } = renderHook(() => useCacheStats())

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull()
    })

    expect(result.current.stats?.hit_ratio).toBe(0)
    expect(result.current.stats?.preview_hit_ratio).toBe(0)
  })

  it("should handle loading state properly", async () => {
    let resolveStats: (value: any) => void
    const statsPromise = new Promise((resolve) => {
      resolveStats = resolve
    })
    mockInvoke.mockReturnValueOnce(statsPromise)

    const { result } = renderHook(() => useCacheStats())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveStats!(mockCacheStats)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).not.toBeNull()
  })
})

describe("formatCacheRatio", () => {
  it("should format cache ratio as percentage", () => {
    expect(formatCacheRatio(0.75)).toBe("75.0%")
    expect(formatCacheRatio(0.333)).toBe("33.3%")
    expect(formatCacheRatio(1)).toBe("100.0%")
    expect(formatCacheRatio(0)).toBe("0.0%")
  })
})

describe("formatCacheSize", () => {
  it("should format bytes", () => {
    expect(formatCacheSize(512)).toBe("512 B")
  })

  it("should format kilobytes", () => {
    expect(formatCacheSize(1024)).toBe("1.0 KB")
    expect(formatCacheSize(2048)).toBe("2.0 KB")
    expect(formatCacheSize(1536)).toBe("1.5 KB")
  })

  it("should format megabytes", () => {
    expect(formatCacheSize(1024 * 1024)).toBe("1.0 MB")
    expect(formatCacheSize(1.5 * 1024 * 1024)).toBe("1.5 MB")
  })

  it("should format gigabytes", () => {
    expect(formatCacheSize(1024 * 1024 * 1024)).toBe("1.00 GB")
    expect(formatCacheSize(2.5 * 1024 * 1024 * 1024)).toBe("2.50 GB")
  })
})
