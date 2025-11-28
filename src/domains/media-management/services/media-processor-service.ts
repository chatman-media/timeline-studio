/**
 * Media Processor Service
 *
 * Domain service for media file processing operations.
 * This service encapsulates all backend calls for media processing,
 * keeping features layer independent from backend implementation.
 */

import { getMedia } from "@/core/container"
import type { MediaFile } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaProcessorService")

/**
 * Media Processor Service
 *
 * Handles media file scanning, processing, and thumbnail generation
 * through Tauri backend commands.
 */
export class MediaProcessorService {
  /**
   * Scan a folder for media files
   *
   * @param folderPath - Path to the folder to scan
   * @returns Promise resolving to array of media files
   */
  async scanFolder(folderPath: string): Promise<MediaFile[]> {
    try {
      const files = await getMedia().scanFolder(folderPath)
      return files as unknown as MediaFile[]
    } catch (error) {
      logger.errorSync("Failed to scan folder", { folderPath, error })
      throw error
    }
  }

  /**
   * Scan a folder for media files and generate thumbnails
   *
   * @param folderPath - Path to the folder to scan
   * @param width - Thumbnail width (default: 320)
   * @param height - Thumbnail height (default: 180)
   * @returns Promise resolving to array of media files with thumbnails
   */
  async scanFolderWithThumbnails(folderPath: string, width = 320, height = 180): Promise<MediaFile[]> {
    try {
      const files = await getMedia().scanFolderWithThumbnails(folderPath, width, height)
      return files as unknown as MediaFile[]
    } catch (error) {
      logger.errorSync("Failed to scan folder with thumbnails", { folderPath, width, height, error })
      throw error
    }
  }

  /**
   * Process specific media files
   *
   * @param filePaths - Array of file paths to process
   * @returns Promise resolving to array of processed media files
   */
  async processFiles(filePaths: string[]): Promise<MediaFile[]> {
    try {
      logger.infoSync("Processing media files", { filesCount: filePaths.length })
      const files = await getMedia().processFiles(filePaths)
      logger.infoSync("Files processed successfully", { filesCount: files.length })
      return files as unknown as MediaFile[]
    } catch (error) {
      logger.errorSync("Failed to process files", { filesCount: filePaths.length, error })
      throw error
    }
  }

  /**
   * Process specific media files with thumbnail generation
   *
   * @param filePaths - Array of file paths to process
   * @param width - Thumbnail width (default: 320)
   * @param height - Thumbnail height (default: 180)
   * @returns Promise resolving to array of processed media files with thumbnails
   */
  async processFilesWithThumbnails(filePaths: string[], width = 320, height = 180): Promise<MediaFile[]> {
    try {
      logger.infoSync("Processing files with thumbnails", { filesCount: filePaths.length, width, height })
      const files = await getMedia().processFilesWithThumbnails(filePaths, width, height)
      logger.infoSync("Files processed with thumbnails successfully", { filesCount: files.length })
      return files as unknown as MediaFile[]
    } catch (error) {
      logger.errorSync("Failed to process files with thumbnails", {
        filesCount: filePaths.length,
        width,
        height,
        error,
      })
      throw error
    }
  }

  /**
   * Cancel ongoing media processing operation
   *
   * @returns Promise resolving when cancellation is complete
   */
  async cancelProcessing(): Promise<void> {
    try {
      await getMedia().cancelProcessing("")
    } catch (error) {
      logger.errorSync("Failed to cancel processing", { error })
      throw error
    }
  }

  /**
   * Process a single media file with simplified processing
   * (for quick file checks without full metadata extraction)
   *
   * @param filePath - Path to the media file
   * @param generateThumbnail - Whether to generate thumbnail (default: false)
   * @returns Promise resolving to processed media file information
   */
  async processFileSimple(filePath: string, generateThumbnail = false): Promise<any> {
    try {
      logger.infoSync("Processing file (simple mode)", { filePath, generateThumbnail })
      const result = await getMedia().processFile(filePath, { generateThumbnail, extractAudio: false })
      logger.infoSync("File processed successfully (simple mode)", { filePath })
      return result
    } catch (error) {
      logger.errorSync("Failed to process file (simple mode)", { filePath, error })
      throw error
    }
  }
}

/**
 * Singleton instance of MediaProcessorService
 */
export const mediaProcessorService = new MediaProcessorService()
