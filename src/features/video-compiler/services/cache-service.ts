/**
 * Сервис для работы с кэшем компилятора
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type { VideoCompilerCacheStats } from "../types/cache"

const logger = createLogger({ module: "CacheService" })

/**
 * Получение статистики кэша
 */
export async function getCacheStats(): Promise<VideoCompilerCacheStats> {
  try {
    return await invoke<VideoCompilerCacheStats>("get_cache_stats")
  } catch (error) {
    logger.error("Failed to get cache stats:", error)
    throw error
  }
}

/**
 * Очистка кэша превью
 */
export async function clearPreviewCache(): Promise<void> {
  try {
    await invoke("clear_preview_cache")
  } catch (error) {
    logger.error("Failed to clear preview cache:", error)
    throw error
  }
}

/**
 * Очистка всего кэша
 */
export async function clearAllCache(): Promise<void> {
  try {
    await invoke("clear_all_cache")
  } catch (error) {
    logger.error("Failed to clear all cache:", error)
    throw error
  }
}

/**
 * Получение размера кэша в мегабайтах
 */
export async function getCacheSize(): Promise<number> {
  try {
    return await invoke<number>("get_cache_size")
  } catch (error) {
    logger.error("Failed to get cache size:", error)
    return 0
  }
}

/**
 * Настройка параметров кэша
 */
export async function configureCacheSettings(settings: {
  max_memory_mb?: number
  max_entries?: number
  auto_cleanup?: boolean
}): Promise<void> {
  try {
    await invoke("configure_cache", settings)
  } catch (error) {
    logger.error("Failed to configure cache:", error)
    throw error
  }
}
