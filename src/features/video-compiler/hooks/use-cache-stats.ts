import { useCallback, useEffect, useState } from "react"

import { videoCompilerCacheService } from "@/domains/video-editing/services/video-compiler-cache-service"
import { createLogger } from "@/lib/tauri-logger"

import type { VideoCompilerCacheStats } from "../types/cache"

const logger = createLogger("UseCacheStats")

export interface CacheStatsWithRatios extends VideoCompilerCacheStats {
  hit_ratio: number
  preview_hit_ratio: number
}

interface UseCacheStatsReturn {
  stats: CacheStatsWithRatios | null
  isLoading: boolean
  error: string | null
  refreshStats: () => Promise<void>
  clearPreviewCache: () => Promise<boolean>
  clearAllCache: () => Promise<boolean>
}

export function useCacheStats(): UseCacheStatsReturn {
  void logger.info("Инициализация useCacheStats хука")

  const [stats, setStats] = useState<CacheStatsWithRatios | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Получить статистику кэша
  const refreshStats = useCallback(async () => {
    void logger.info("Запрос статистики кеша")

    try {
      setIsLoading(true)
      setError(null)
      // Теперь бэкенд возвращает CacheStatsWithRatios с уже вычисленными значениями
      const cacheStats = await videoCompilerCacheService.getCacheStats()
      setStats(cacheStats as CacheStatsWithRatios)
      void logger.info("Статистика кеша получена успешно", {
        totalEntries: cacheStats.total_entries,
        cacheHits: cacheStats.cache_hits,
        cacheMisses: cacheStats.cache_misses,
        hitRatio: cacheStats.hit_ratio,
      })
    } catch (err) {
      void logger.error("Ошибка получения статистики кеша", { error: err })
      setError(err instanceof Error ? err.message : "Не удалось получить статистику кэша")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Очистить кэш превью
  const clearPreviewCache = useCallback(async (): Promise<boolean> => {
    void logger.info("Очистка кеша превью")

    try {
      await videoCompilerCacheService.clearPreviewCache()
      void logger.info("Кеш превью очищен успешно")
      await refreshStats() // Обновляем статистику после очистки
      return true
    } catch (err) {
      void logger.error("Ошибка очистки кеша превью", { error: err })
      setError(err instanceof Error ? err.message : "Не удалось очистить кэш превью")
      return false
    }
  }, [refreshStats])

  // Очистить весь кэш
  const clearAllCache = useCallback(async (): Promise<boolean> => {
    void logger.info("Очистка всего кеша")

    try {
      await videoCompilerCacheService.clearAllCache()
      void logger.info("Весь кеш очищен успешно")
      await refreshStats() // Обновляем статистику после очистки
      return true
    } catch (err) {
      void logger.error("Ошибка очистки всего кеша", { error: err })
      setError(err instanceof Error ? err.message : "Не удалось очистить весь кэш")
      return false
    }
  }, [refreshStats])

  // Загружаем статистику при монтировании
  useEffect(() => {
    void refreshStats()
  }, [refreshStats])

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    clearPreviewCache,
    clearAllCache,
  }
}

// Вспомогательные функции для форматирования

export function formatCacheRatio(ratio: number): string {
  if (Number.isNaN(ratio)) {
    return "0.0%"
  }
  return `${(ratio * 100).toFixed(1)}%`
}

export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
