/**
 * Media Management Tauri Commands
 *
 * @deprecated Используйте container.getMedia() из @/core/container вместо этих функций.
 * Этот файл сохранён для обратной совместимости, но все новые сервисы должны использовать
 * IMediaService через DI контейнер.
 *
 * @example
 * // Старый способ (deprecated):
 * import { getMediaMetadata } from "./tauri/media-commands"
 * const metadata = await getMediaMetadata(filePath)
 *
 * // Новый способ:
 * import { getMedia } from "@/core/container"
 * const metadata = await getMedia().getMetadata(filePath)
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaCommands")

/**
 * Get media file metadata
 */
export async function getMediaMetadata(filePath: string): Promise<any> {
  logger.debugSync("Getting media metadata", { filePath })
  try {
    const result = await invoke("get_media_metadata", { filePath })
    logger.debugSync("Media metadata retrieved", { filePath })
    return result
  } catch (error) {
    logger.errorSync("Failed to get media metadata", { filePath, error })
    throw error
  }
}

/**
 * Get list of media files in directory
 */
export async function getMediaFiles(directory: string): Promise<string[]> {
  logger.debugSync("Getting media files", { directory })
  try {
    const result = await invoke<string[]>("get_media_files", { directory })
    logger.debugSync("Media files retrieved", { count: result.length })
    return result
  } catch (error) {
    logger.errorSync("Failed to get media files", { directory, error })
    throw error
  }
}

/**
 * Process media file (generate thumbnail, extract metadata)
 */
export async function processMediaFile(
  filePath: string,
  generateThumbnail: boolean,
  extractAudio: boolean,
): Promise<any> {
  logger.infoSync("Processing media file", { filePath, generateThumbnail, extractAudio })
  try {
    const result = await invoke("process_media_file_simple", {
      filePath,
      generateThumbnail,
      extractAudio,
    })
    logger.infoSync("Media file processed", { filePath })
    return result
  } catch (error) {
    logger.errorSync("Failed to process media file", { filePath, error })
    throw error
  }
}

/**
 * Cancel media processing
 */
export async function cancelMediaProcessing(filePath: string): Promise<void> {
  logger.infoSync("Cancelling media processing", { filePath })
  try {
    await invoke("cancel_media_processing", { filePath })
    logger.infoSync("Media processing cancelled", { filePath })
  } catch (error) {
    logger.errorSync("Failed to cancel media processing", { filePath, error })
    throw error
  }
}

/**
 * Save preview data for media file
 */
export async function savePreviewData(path: string): Promise<void> {
  logger.debugSync("Saving preview data", { path })
  try {
    await invoke("save_preview_data", { path })
    logger.debugSync("Preview data saved", { path })
  } catch (error) {
    logger.errorSync("Failed to save preview data", { path, error })
    throw error
  }
}

/**
 * Load preview data for media file
 */
export async function loadPreviewData(path: string): Promise<any> {
  logger.debugSync("Loading preview data", { path })
  try {
    const result = await invoke("load_preview_data", { path })
    logger.debugSync("Preview data loaded", { path })
    return result
  } catch (error) {
    logger.errorSync("Failed to load preview data", { path, error })
    throw error
  }
}

/**
 * Clear preview data cache
 */
export async function clearMediaPreviewData(): Promise<void> {
  logger.infoSync("Clearing media preview data")
  try {
    await invoke("clear_media_preview_data")
    logger.infoSync("Media preview data cleared")
  } catch (error) {
    logger.errorSync("Failed to clear media preview data", { error })
    throw error
  }
}

/**
 * Save timeline frames
 */
export async function saveTimelineFrames(frames: any[]): Promise<void> {
  logger.infoSync("Saving timeline frames", { count: frames.length })
  try {
    await invoke("save_timeline_frames", { frames })
    logger.infoSync("Timeline frames saved", { count: frames.length })
  } catch (error) {
    logger.errorSync("Failed to save timeline frames", { error })
    throw error
  }
}

/**
 * Eject device
 */
export async function ejectDevice(deviceId: string): Promise<void> {
  logger.infoSync("Ejecting device", { deviceId })
  try {
    await invoke("eject_device", { deviceId })
    logger.infoSync("Device ejected", { deviceId })
  } catch (error) {
    logger.errorSync("Failed to eject device", { deviceId, error })
    throw error
  }
}

/**
 * Scan folder for media files
 */
export async function scanMediaFolder(folderPath: string): Promise<any[]> {
  logger.infoSync("Scanning folder", { folderPath })
  try {
    const result = await invoke<any[]>("scan_media_folder", { folderPath })
    logger.infoSync("Folder scanned successfully", { folderPath, filesCount: result.length })
    return result
  } catch (error) {
    logger.errorSync("Failed to scan folder", { folderPath, error })
    throw error
  }
}

/**
 * Scan folder for media files with thumbnails
 */
export async function scanMediaFolderWithThumbnails(folderPath: string, width: number, height: number): Promise<any[]> {
  logger.infoSync("Scanning folder with thumbnails", { folderPath, width, height })
  try {
    const result = await invoke<any[]>("scan_media_folder_with_thumbnails", {
      folderPath,
      width,
      height,
    })
    logger.infoSync("Folder scanned with thumbnails successfully", {
      folderPath,
      filesCount: result.length,
    })
    return result
  } catch (error) {
    logger.errorSync("Failed to scan folder with thumbnails", { folderPath, width, height, error })
    throw error
  }
}

/**
 * Get media preview data
 */
export async function getMediaPreviewData(fileId: string): Promise<any | null> {
  logger.debugSync("Getting media preview data", { fileId })
  try {
    const result = await invoke("get_media_preview_data", { fileId })
    logger.debugSync("Media preview data retrieved", { fileId })
    return result
  } catch (error) {
    logger.errorSync("Failed to get media preview data", { fileId, error })
    throw error
  }
}

/**
 * Generate media thumbnail
 */
export async function generateMediaThumbnail(
  fileId: string,
  filePath: string,
  width: number,
  height: number,
  timestamp: number,
): Promise<any> {
  logger.debugSync("Generating media thumbnail", { fileId, width, height, timestamp })
  try {
    const result = await invoke("generate_media_thumbnail", {
      fileId,
      filePath,
      width,
      height,
      timestamp,
    })
    logger.debugSync("Media thumbnail generated", { fileId })
    return result
  } catch (error) {
    logger.errorSync("Failed to generate media thumbnail", { fileId, error })
    throw error
  }
}

/**
 * Clear media preview data for specific file
 */
export async function clearMediaPreviewDataForFile(fileId: string): Promise<void> {
  logger.debugSync("Clearing media preview data for file", { fileId })
  try {
    await invoke("clear_media_preview_data", { fileId })
    logger.debugSync("Media preview data cleared for file", { fileId })
  } catch (error) {
    logger.errorSync("Failed to clear media preview data for file", { fileId, error })
    throw error
  }
}

/**
 * Get files with previews
 */
export async function getFilesWithPreviews(): Promise<string[]> {
  logger.debugSync("Getting files with previews")
  try {
    const result = await invoke<string[]>("get_files_with_previews")
    logger.debugSync("Files with previews retrieved", { count: result.length })
    return result
  } catch (error) {
    logger.errorSync("Failed to get files with previews", { error })
    throw error
  }
}

/**
 * Restore preview cache
 */
export async function restorePreviewCache(): Promise<number> {
  logger.debugSync("Restoring preview cache")
  try {
    const result = await invoke<number>("restore_preview_cache")
    logger.debugSync("Preview cache restored", { count: result })
    return result
  } catch (error) {
    logger.errorSync("Failed to restore preview cache", { error })
    throw error
  }
}

/**
 * Check if cached thumbnail exists
 */
export async function hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
  logger.debugSync("Checking if cached thumbnail exists", { fileId, width, height })
  try {
    const result = await invoke<boolean>("has_cached_thumbnail", { fileId, width, height })
    return result
  } catch (error) {
    logger.errorSync("Failed to check cached thumbnail", { fileId, width, height, error })
    throw error
  }
}

/**
 * Get cached thumbnail path
 */
export async function getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
  logger.debugSync("Getting cached thumbnail path", { fileId, width, height })
  try {
    const result = await invoke<string>("get_cached_thumbnail_path", { fileId, width, height })
    return result
  } catch (error) {
    logger.errorSync("Failed to get cached thumbnail path", { fileId, width, height, error })
    throw error
  }
}

/**
 * Save timeline frames for specific file
 */
export async function saveTimelineFramesForFile(fileId: string, frames: any[]): Promise<void> {
  logger.debugSync("Saving timeline frames for file", { fileId, count: frames.length })
  try {
    await invoke("save_timeline_frames", { fileId, frames })
    logger.debugSync("Timeline frames saved for file", { fileId, count: frames.length })
  } catch (error) {
    logger.errorSync("Failed to save timeline frames for file", { fileId, error })
    throw error
  }
}

/**
 * Get timeline frames for specific file
 */
export async function getTimelineFrames(fileId: string): Promise<any[]> {
  logger.debugSync("Getting timeline frames for file", { fileId })
  try {
    const result = await invoke<any[]>("get_timeline_frames", { fileId })
    logger.debugSync("Timeline frames retrieved for file", { fileId, count: result.length })
    return result
  } catch (error) {
    logger.errorSync("Failed to get timeline frames for file", { fileId, error })
    throw error
  }
}
