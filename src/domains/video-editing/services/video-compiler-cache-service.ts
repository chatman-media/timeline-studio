/**
 * Video Compiler Cache Service
 *
 * Domain service for video compiler cache operations.
 * Handles all backend calls related to cache management.
 */

import { createLogger } from "@/lib/tauri-logger"
import {
  clearAllCache as clearAllCacheTauri,
  clearPreviewCache as clearPreviewCacheTauri,
  getCacheStats as getCacheStatsTauri,
} from "../tauri/compiler-commands"

const logger = createLogger("VideoCompilerCacheService")

export interface VideoCompilerCacheStats {
  total_entries: number
  cache_hits: number
  cache_misses: number
  hit_ratio: number
  preview_hit_ratio: number
  total_size: number
  preview_size: number
}

/**
 * Video Compiler Cache Service
 *
 * Handles cache statistics and management operations
 * through Tauri backend commands.
 */
export class VideoCompilerCacheService {
  /**
   * Get cache statistics
   *
   * @returns Promise resolving to cache statistics
   */
  async getCacheStats(): Promise<VideoCompilerCacheStats> {
    try {
      logger.debugSync("Getting cache stats")
      const stats = await getCacheStatsTauri()
      logger.debugSync("Cache stats retrieved successfully", {
        totalEntries: stats.total_entries,
        hitRatio: stats.hit_ratio,
      })
      return stats
    } catch (error) {
      logger.errorSync("Failed to get cache stats", { error })
      throw error
    }
  }

  /**
   * Clear preview cache
   *
   * @returns Promise resolving when cache is cleared
   */
  async clearPreviewCache(): Promise<void> {
    try {
      logger.infoSync("Clearing preview cache")
      await clearPreviewCacheTauri()
      logger.infoSync("Preview cache cleared successfully")
    } catch (error) {
      logger.errorSync("Failed to clear preview cache", { error })
      throw error
    }
  }

  /**
   * Clear all cache
   *
   * @returns Promise resolving when all cache is cleared
   */
  async clearAllCache(): Promise<void> {
    try {
      logger.infoSync("Clearing all cache")
      await clearAllCacheTauri()
      logger.infoSync("All cache cleared successfully")
    } catch (error) {
      logger.errorSync("Failed to clear all cache", { error })
      throw error
    }
  }
}

/**
 * Singleton instance of VideoCompilerCacheService
 */
export const videoCompilerCacheService = new VideoCompilerCacheService()
