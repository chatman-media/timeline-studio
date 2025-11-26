/**
 * File System Service
 *
 * Domain service for file system operations.
 * Handles all backend calls related to file management.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("FileSystemService")

export interface FileStats {
  size: number
  lastModified: number
}

/**
 * File System Service
 *
 * Handles file system operations through Tauri backend commands.
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
      const result = await invoke<boolean>("file_exists", { path })
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
      const stats = await invoke<FileStats>("get_file_stats", { path })
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
      const platform = await invoke<string>("get_platform")
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
      const result = await invoke<string[]>("search_files_by_name", {
        directory,
        filename,
        maxDepth,
      })
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
      const result = await invoke<string>("get_absolute_path", { path })
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
