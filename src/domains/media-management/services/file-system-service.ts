/**
 * File System Service
 *
 * Domain service for file system operations.
 * Handles all backend calls related to file management.
 *
 * ✅ ОБНОВЛЕНО (2025-11-28): Использует IPlatformService через container
 */

import { getPlatform as getPlatformService } from "@/core/container"
import type { FileStats } from "@/core/ports"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("FileSystemService")

// Re-export FileStats for backwards compatibility
export type { FileStats } from "@/core/ports"

/**
 * File System Service
 *
 * Handles file system operations through platform service.
 */
export class FileSystemService {
  /**
   * Check if a file exists
   *
   * @param path - Path to the file
   * @returns Promise resolving to true if file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      logger.debugSync("Checking file existence", { path })
      const result = await getPlatformService().exists(path)
      return result
    } catch (error) {
      logger.errorSync("Failed to check file existence", { path, error })
      return false
    }
  }

  /**
   * Get file statistics (size, last modified time)
   *
   * @param path - Path to the file
   * @returns Promise resolving to file stats or null
   */
  async getFileStats(path: string): Promise<FileStats | null> {
    try {
      logger.debugSync("Getting file stats", { path })
      const stats = await getPlatformService().getFileStats(path)
      return stats
    } catch (error) {
      logger.errorSync("Failed to get file stats", { path, error })
      return null
    }
  }

  /**
   * Get operating system platform
   *
   * @returns Promise resolving to platform string
   */
  async getPlatform(): Promise<string> {
    try {
      const platform = await getPlatformService().getPlatform()
      logger.debugSync("Got platform", { platform })
      return platform
    } catch (error) {
      logger.errorSync("Failed to get platform", { error })
      return "unknown"
    }
  }

  /**
   * Search for files by name in a directory
   *
   * @param directory - Directory to search in
   * @param filename - Filename to search for
   * @param maxDepth - Maximum search depth (default: 3)
   * @returns Promise resolving to array of found file paths
   */
  async searchFilesByName(directory: string, filename: string, maxDepth = 3): Promise<string[]> {
    try {
      logger.debugSync("Searching for files", { directory, filename, maxDepth })
      const result = await getPlatformService().searchFilesByName(directory, filename, maxDepth)
      logger.debugSync("Found files", { count: result.length })
      return result
    } catch (error) {
      logger.errorSync("Failed to search for files", { directory, filename, error })
      return []
    }
  }

  /**
   * Get absolute path for a file
   *
   * @param path - Relative or absolute path
   * @returns Promise resolving to absolute path or null
   */
  async getAbsolutePath(path: string): Promise<string | null> {
    try {
      logger.debugSync("Getting absolute path", { path })
      const result = await getPlatformService().getAbsolutePath(path)
      return result
    } catch (error) {
      logger.errorSync("Failed to get absolute path", { path, error })
      return null
    }
  }
}

/**
 * Singleton instance of FileSystemService
 */
export const fileSystemService = new FileSystemService()
