/**
 * Media Preview Service
 *
 * Domain service for media preview and thumbnail operations.
 * Handles all backend calls related to previews, thumbnails, and timeline frames.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaPreviewService")

export interface MediaPreviewData {
  file_id: string
  file_path: string
  browser_thumbnail?: {
    path: string
    base64_data: string
    timestamp: number
    width: number
    height: number
  }
  last_updated: string
  timeline_previews: Array<any>
  recognition_frames: Array<any>
  recognition_results?: any // Optional recognition results in RecognitionResults format
}

export interface ThumbnailData {
  path: string
  base64_data: string
  timestamp: number
  width: number
  height: number
}

export interface TimelineFrame {
  timestamp: number
  base64_data: string
  is_keyframe: boolean
}

/**
 * Media Preview Service
 *
 * Handles preview data, thumbnail generation, and timeline frames
 * through Tauri backend commands.
 */
export class MediaPreviewService {
  /**
   * Get preview data for a media file
   *
   * @param fileId - ID of the media file
   * @returns Promise resolving to preview data or null
   */
  async getPreviewData(fileId: string): Promise<MediaPreviewData | null> {
    try {
      logger.debugSync("Getting preview data", { fileId })
      const data = await invoke<MediaPreviewData | null>("get_media_preview_data", { fileId })
      return data
    } catch (error) {
      logger.errorSync("Failed to get preview data", { fileId, error })
      throw error
    }
  }

  /**
   * Generate thumbnail for a media file
   *
   * @param fileId - ID of the media file
   * @param filePath - Path to the media file
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   * @param timestamp - Time position for thumbnail (default: 0)
   * @returns Promise resolving to thumbnail data
   */
  async generateThumbnail(
    fileId: string,
    filePath: string,
    width: number,
    height: number,
    timestamp = 0,
  ): Promise<ThumbnailData> {
    try {
      logger.debugSync("Generating thumbnail", { fileId, width, height, timestamp })
      const thumbnail = await invoke<ThumbnailData>("generate_media_thumbnail", {
        fileId,
        filePath,
        width,
        height,
        timestamp,
      })
      logger.debugSync("Thumbnail generated successfully", { fileId })
      return thumbnail
    } catch (error) {
      logger.errorSync("Failed to generate thumbnail", { fileId, error })
      throw error
    }
  }

  /**
   * Clear preview data for a media file
   *
   * @param fileId - ID of the media file
   * @returns Promise resolving when data is cleared
   */
  async clearPreviewData(fileId: string): Promise<void> {
    try {
      logger.debugSync("Clearing preview data", { fileId })
      await invoke("clear_media_preview_data", { fileId })
      logger.debugSync("Preview data cleared successfully", { fileId })
    } catch (error) {
      logger.errorSync("Failed to clear preview data", { fileId, error })
      throw error
    }
  }

  /**
   * Get list of files that have previews
   *
   * @returns Promise resolving to array of file IDs
   */
  async getFilesWithPreviews(): Promise<string[]> {
    try {
      const files = await invoke<string[]>("get_files_with_previews")
      return files
    } catch (error) {
      logger.errorSync("Failed to get files with previews", { error })
      throw error
    }
  }

  /**
   * Save preview data to disk
   *
   * @param path - Path where to save preview data
   * @returns Promise resolving when data is saved
   */
  async savePreviewData(path: string): Promise<void> {
    try {
      logger.debugSync("Saving preview data", { path })
      await invoke("save_preview_data", { path })
      logger.debugSync("Preview data saved successfully", { path })
    } catch (error) {
      logger.errorSync("Failed to save preview data", { path, error })
      throw error
    }
  }

  /**
   * Load preview data from disk
   *
   * @param path - Path to preview data file
   * @returns Promise resolving when data is loaded
   */
  async loadPreviewData(path: string): Promise<void> {
    try {
      logger.debugSync("Loading preview data", { path })
      await invoke("load_preview_data", { path })
      logger.debugSync("Preview data loaded successfully", { path })
    } catch (error) {
      logger.errorSync("Failed to load preview data", { path, error })
      throw error
    }
  }

  /**
   * Restore preview cache from disk
   * Scans cache directory and loads existing thumbnail information
   *
   * @returns Promise resolving to number of restored thumbnails
   */
  async restorePreviewCache(): Promise<number> {
    try {
      logger.debugSync("Restoring preview cache")
      const count = await invoke<number>("restore_preview_cache")
      logger.debugSync(`Preview cache restored: ${count} thumbnails`)
      return count
    } catch (error) {
      logger.errorSync("Failed to restore preview cache", { error })
      // Not critical, return 0 instead of throwing
      return 0
    }
  }

  /**
   * Check if cached thumbnail exists on disk
   *
   * @param fileId - ID of the media file
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   * @returns Promise resolving to true if thumbnail exists
   */
  async hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
    try {
      return await invoke<boolean>("has_cached_thumbnail", { fileId, width, height })
    } catch {
      return false
    }
  }

  /**
   * Get path to cached thumbnail
   *
   * @param fileId - ID of the media file
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   * @returns Promise resolving to thumbnail path or empty string
   */
  async getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
    try {
      return await invoke<string>("get_cached_thumbnail_path", { fileId, width, height })
    } catch {
      return ""
    }
  }

  /**
   * Save timeline frames for a media file
   *
   * @param fileId - ID of the media file
   * @param frames - Array of timeline frames
   * @returns Promise resolving when frames are saved
   */
  async saveTimelineFrames(fileId: string, frames: TimelineFrame[]): Promise<void> {
    try {
      logger.debugSync("Saving timeline frames", { fileId, count: frames.length })
      await invoke("save_timeline_frames", { fileId, frames })
      logger.debugSync("Timeline frames saved successfully", { fileId })
    } catch (error) {
      logger.errorSync("Failed to save timeline frames", { fileId, error })
      throw error
    }
  }

  /**
   * Get timeline frames for a media file
   *
   * @param fileId - ID of the media file
   * @returns Promise resolving to array of timeline frames
   */
  async getTimelineFrames(fileId: string): Promise<TimelineFrame[]> {
    try {
      logger.debugSync("Getting timeline frames", { fileId })
      const frames = await invoke<TimelineFrame[]>("get_timeline_frames", { fileId })
      return frames
    } catch (error) {
      logger.errorSync("Failed to get timeline frames", { fileId, error })
      throw error
    }
  }
}

/**
 * Singleton instance of MediaPreviewService
 */
export const mediaPreviewService = new MediaPreviewService()
