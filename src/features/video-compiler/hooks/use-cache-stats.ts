import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useState } from "react"

import { logError, logInfo } from "@/lib/tauri-logger"

import type { VideoCompilerCacheStats } from "../types/cache"

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
  logInfo("[useCacheStats] Инициализация useCacheStats хука")

  const [stats, setStats] = useState<CacheStatsWithRatios | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Получить статистику кэша
  const refreshStats = useCallback(async () => {
    logInfo("[useCacheStats] Запрос статистики кеша")

    try {
      setIsLoading(true)
      setError(null)
      // Теперь бэкенд возвращает CacheStatsWithRatios с уже вычисленными значениями
      const cacheStats = await invoke<CacheStatsWithRatios>("get_cache_stats")
      setStats(cacheStats)
      logInfo("[useCacheStats] Статистика кеша получена успешно", {
        totalEntries: cacheStats.total_entries,
        cacheHits: cacheStats.cache_hits,
        cacheMisses: cacheStats.cache_misses,
        hitRatio: cacheStats.hit_ratio,
      })
    } catch (err) {
      logError("[useCacheStats] Ошибка получения статистики кеша", err)
      setError(err instanceof Error ? err.message : "Не удалось получить статистику кэша")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Очистить кэш превью
  const clearPreviewCache = useCallback(async (): Promise<boolean> => {
    logInfo("[useCacheStats] Очистка кеша превью")

    try {
      await invoke("clear_preview_cache")
      logInfo("[useCacheStats] Кеш превью очищен успешно")
      await refreshStats() // Обновляем статистику после очистки
      return true
    } catch (err) {
      logError("[useCacheStats] Ошибка очистки кеша превью", err)
      setError(err instanceof Error ? err.message : "Не удалось очистить кэш превью")
      return false
    }
  }, [refreshStats])

  // Очистить весь кэш
  const clearAllCache = useCallback(async (): Promise<boolean> => {
    logInfo("[useCacheStats] Очистка всего кеша")

    try {
      await invoke("clear_all_cache")
      logInfo("[useCacheStats] Весь кеш очищен успешно")
      await refreshStats() // Обновляем статистику после очистки
      return true
    } catch (err) {
      logError("[useCacheStats] Ошибка очистки всего кеша", err)
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
  return `${(ratio * 100).toFixed(1)}%`
}

export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
