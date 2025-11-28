import { open } from "@tauri-apps/plugin-dialog"

import { getMedia } from "@/core/container"
import { formatDurationSeconds as formatDurationSecondsUtil } from "@/lib/duration-formatter"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaApi")

/**
 * Типы метаданных медиафайлов для браузера
 * Отличается от VideoMetadata из media-analysis - здесь все поля опциональные
 */
export interface BrowserVideoMetadata {
  duration?: number
  width?: number
  height?: number
  fps?: number
  codec?: string
  bitrate?: number
  size?: number
  creation_time?: string
}

export interface AudioMetadata {
  duration?: number
  codec?: string
  bitrate?: number
  sample_rate?: number
  channels?: number
  size?: number
  creation_time?: string
}

export interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  size?: number
  creation_time?: string
}

export type MediaMetadata =
  | ({
      type: "Video"
    } & BrowserVideoMetadata)
  | {
      type: "Audio"
      duration?: number
      codec?: string
      bitrate?: number
      sample_rate?: number
      channels?: number
      size?: number
      creation_time?: string
    }
  | {
      type: "Image"
      width?: number
      height?: number
      format?: string
      size?: number
      creation_time?: string
    }
  | { type: "Unknown" }

/**
 * Получение метаданных медиафайла
 * @param filePath Путь к файлу
 * @returns Метаданные файла
 */
export async function getMediaMetadata(filePath: string): Promise<any> {
  try {
    return await getMedia().getMetadata(filePath)
  } catch (error) {
    logger.errorSync("Failed to get media metadata", { filePath, error })
    throw error
  }
}

/**
 * Получение списка медиафайлов в директории
 * @param directory Путь к директории
 * @returns Список путей к медиафайлам
 */
export async function getMediaFiles(directory: string): Promise<string[]> {
  try {
    return await getMedia().getMediaFiles(directory)
  } catch (error) {
    logger.errorSync("Failed to get media files", { directory, error })
    throw error
  }
}

/**
 * Открытие диалога выбора файлов
 * @returns Массив путей к выбранным файлам или null, если отменено
 */
export async function selectMediaFile(): Promise<string[] | null> {
  try {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Media",
          extensions: [
            "mp4",
            "avi",
            "mkv",
            "mov",
            "webm",
            "mp3",
            "wav",
            "ogg",
            "flac",
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
          ],
        },
      ],
    })

    if (selected === null) {
      return null
    }

    // Если выбран один файл, open возвращает строку, иначе массив строк
    return Array.isArray(selected) ? selected : [selected]
  } catch (error) {
    logger.errorSync("Failed to select media files", { error })
    throw error
  }
}

/**
 * Открытие диалога выбора аудиофайлов
 * @returns Массив путей к выбранным аудиофайлам или null, если отменено
 */
export async function selectAudioFile(): Promise<string[] | null> {
  try {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Audio",
          extensions: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"],
        },
      ],
    })

    if (selected === null) {
      return null
    }

    // Если выбран один файл, open возвращает строку, иначе массив строк
    return Array.isArray(selected) ? selected : [selected]
  } catch (error) {
    logger.errorSync("Failed to select audio files", { error })
    throw error
  }
}

/**
 * Открытие диалога выбора директории
 * @returns Путь к выбранной директории или null, если отменено
 */
export async function selectMediaDirectory(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    })

    if (selected === null) {
      return null
    }

    return selected
  } catch (error) {
    logger.errorSync("Failed to select directory", { error })
    throw error
  }
}

/**
 * Форматирование размера файла в читаемый вид
 * @param bytes Размер в байтах
 * @returns Отформатированный размер
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return "Неизвестно"

  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Форматирование длительности в читаемый вид
 * @param seconds Длительность в секундах
 * @returns Отформатированная длительность
 * @deprecated Используйте formatDurationSeconds из @/lib/duration-formatter
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined) return "Неизвестно"
  return formatDurationSecondsUtil(seconds)
}

/**
 * Восстановить кэш превью с диска
 * Сканирует директорию кэша и загружает информацию о существующих thumbnail файлах
 * Вызывается при старте приложения для быстрой загрузки существующих превью
 * @returns Количество восстановленных thumbnails
 */
export async function restorePreviewCache(): Promise<number> {
  try {
    const restoredCount = await getMedia().restorePreviewCache()
    logger.debugSync(`Preview cache restored: ${restoredCount} thumbnails`)
    return restoredCount
  } catch (error) {
    logger.errorSync("Failed to restore preview cache", { error })
    // Не критичная ошибка - возвращаем 0
    return 0
  }
}

/**
 * Проверить есть ли кэшированный thumbnail на диске
 * @param fileId ID файла
 * @param width Ширина thumbnail
 * @param height Высота thumbnail
 * @returns true если кэш существует
 */
export async function hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
  try {
    return await getMedia().hasCachedThumbnail(fileId, width, height)
  } catch {
    return false
  }
}

/**
 * Получить путь к кэшированному thumbnail
 * @param fileId ID файла
 * @param width Ширина thumbnail
 * @param height Высота thumbnail
 * @returns Путь к файлу thumbnail
 */
export async function getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
  try {
    return await getMedia().getCachedThumbnailPath(fileId, width, height)
  } catch {
    return ""
  }
}

// ============================================================================
// Media Processing
// ============================================================================

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
    const result = await getMedia().processFile(filePath, { generateThumbnail, extractAudio })
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
    await getMedia().cancelProcessing(filePath)
    logger.infoSync("Media processing cancelled", { filePath })
  } catch (error) {
    logger.errorSync("Failed to cancel media processing", { filePath, error })
    throw error
  }
}

// ============================================================================
// Preview Data
// ============================================================================

/**
 * Save preview data for media file
 */
export async function savePreviewData(path: string): Promise<void> {
  logger.debugSync("Saving preview data", { path })
  try {
    await getMedia().savePreviewData(path)
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
    const result = await getMedia().loadPreviewData(path)
    logger.debugSync("Preview data loaded", { path })
    return result
  } catch (error) {
    logger.errorSync("Failed to load preview data", { path, error })
    throw error
  }
}

/**
 * Get media preview data by file ID
 */
export async function getMediaPreviewData(fileId: string): Promise<any | null> {
  logger.debugSync("Getting media preview data", { fileId })
  try {
    const result = await getMedia().getPreviewData(fileId)
    logger.debugSync("Media preview data retrieved", { fileId })
    return result
  } catch (error) {
    logger.errorSync("Failed to get media preview data", { fileId, error })
    throw error
  }
}

/**
 * Clear preview data cache
 */
export async function clearMediaPreviewData(): Promise<void> {
  logger.infoSync("Clearing media preview data")
  try {
    await getMedia().clearPreviewData()
    logger.infoSync("Media preview data cleared")
  } catch (error) {
    logger.errorSync("Failed to clear media preview data", { error })
    throw error
  }
}

/**
 * Clear media preview data for specific file
 */
export async function clearMediaPreviewDataForFile(fileId: string): Promise<void> {
  logger.debugSync("Clearing media preview data for file", { fileId })
  try {
    await getMedia().clearPreviewData(fileId)
    logger.debugSync("Media preview data cleared for file", { fileId })
  } catch (error) {
    logger.errorSync("Failed to clear media preview data for file", { fileId, error })
    throw error
  }
}

// ============================================================================
// Timeline Frames
// ============================================================================

/**
 * Save timeline frames for specific file
 */
export async function saveTimelineFrames(fileId: string, frames: string[]): Promise<void> {
  logger.debugSync("Saving timeline frames for file", { fileId, count: frames.length })
  try {
    await getMedia().saveTimelineFrames(fileId, frames)
    logger.debugSync("Timeline frames saved for file", { fileId, count: frames.length })
  } catch (error) {
    logger.errorSync("Failed to save timeline frames for file", { fileId, error })
    throw error
  }
}

/**
 * Save timeline frames (alias for saveTimelineFrames)
 */
export async function saveTimelineFramesForFile(fileId: string, frames: string[]): Promise<void> {
  return saveTimelineFrames(fileId, frames)
}

/**
 * Get timeline frames for specific file
 */
export async function getTimelineFrames(fileId: string): Promise<string[]> {
  logger.debugSync("Getting timeline frames for file", { fileId })
  try {
    const result = await getMedia().getTimelineFrames(fileId)
    logger.debugSync("Timeline frames retrieved for file", { fileId, count: result.length })
    return result
  } catch (error) {
    logger.errorSync("Failed to get timeline frames for file", { fileId, error })
    throw error
  }
}

// ============================================================================
// Folder Scanning
// ============================================================================

/**
 * Scan folder for media files
 */
export async function scanMediaFolder(folderPath: string): Promise<any[]> {
  logger.infoSync("Scanning folder", { folderPath })
  try {
    const result = await getMedia().scanFolder(folderPath)
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
export async function scanMediaFolderWithThumbnails(
  folderPath: string,
  width: number,
  height: number,
): Promise<any[]> {
  logger.infoSync("Scanning folder with thumbnails", { folderPath, width, height })
  try {
    const result = await getMedia().scanFolderWithThumbnails(folderPath, width, height)
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

// ============================================================================
// Thumbnails
// ============================================================================

/**
 * Generate media thumbnail
 */
export async function generateMediaThumbnail(
  fileId: string,
  filePath: string,
  width: number,
  height: number,
  timestamp: number,
): Promise<string> {
  logger.debugSync("Generating media thumbnail", { fileId, width, height, timestamp })
  try {
    const result = await getMedia().generateThumbnail(fileId, filePath, { width, height, timestamp })
    logger.debugSync("Media thumbnail generated", { fileId })
    return result
  } catch (error) {
    logger.errorSync("Failed to generate media thumbnail", { fileId, error })
    throw error
  }
}

// ============================================================================
// Cache & Files
// ============================================================================

/**
 * Get files with previews
 */
export async function getFilesWithPreviews(): Promise<string[]> {
  logger.debugSync("Getting files with previews")
  try {
    const result = await getMedia().getFilesWithPreviews()
    logger.debugSync("Files with previews retrieved", { count: result.length })
    return result
  } catch (error) {
    logger.errorSync("Failed to get files with previews", { error })
    throw error
  }
}

/**
 * Eject device
 */
export async function ejectDevice(deviceId: string): Promise<void> {
  logger.infoSync("Ejecting device", { deviceId })
  try {
    await getMedia().ejectDevice(deviceId)
    logger.infoSync("Device ejected", { deviceId })
  } catch (error) {
    logger.errorSync("Failed to eject device", { deviceId, error })
    throw error
  }
}
