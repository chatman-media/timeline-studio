/**
 * Сервис для работы с кэшем компилятора
 */

import type { VideoCompilerCacheStats } from "@timeline-studio/domains/video-editing/types/video-compiler"
import { createLogger } from "@/lib/tauri-logger"
import {
  clearAllCache as clearAllCacheTauri,
  clearPreviewCache as clearPreviewCacheTauri,
  configureCache,
  getCacheSize as getCacheSizeTauri,
  getCacheStats as getCacheStatsTauri,
} from "../../tauri/compiler-commands"

const logger = createLogger("CacheService")

/**
 * Получение статистики кэша
 */
export async function getCacheStats(): Promise<VideoCompilerCacheStats> {
  try {
    return await getCacheStatsTauri()
  } catch (error) {
    void logger.error("Failed to get cache stats:", { error })
    throw error
  }
}

/**
 * Очистка кэша превью
 */
export async function clearPreviewCache(): Promise<void> {
  try {
    await clearPreviewCacheTauri()
  } catch (error) {
    void logger.error("Failed to clear preview cache:", { error })
    throw error
  }
}

/**
 * Очистка всего кэша
 */
export async function clearAllCache(): Promise<void> {
  try {
    await clearAllCacheTauri()
  } catch (error) {
    void logger.error("Failed to clear all cache:", { error })
    throw error
  }
}

/**
 * Получение размера кэша в мегабайтах
 */
export async function getCacheSize(): Promise<number> {
  try {
    return await getCacheSizeTauri()
  } catch (error) {
    void logger.error("Failed to get cache size:", { error })
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
    await configureCache(settings)
  } catch (error) {
    void logger.error("Failed to configure cache:", { error })
    throw error
  }
}
