import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"

import { formatDurationSeconds as formatDurationSecondsUtil } from "@/lib/duration-formatter"
import { createLogger } from "@/lib/tauri-logger"
import { getMediaFiles as getMediaFilesTauri, getMediaMetadata as getMediaMetadataTauri } from "../tauri/media-commands"

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
    return await getMediaMetadataTauri(filePath)
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
    return await getMediaFilesTauri(directory)
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
    const restoredCount = await invoke<number>("restore_preview_cache")
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
    return await invoke<boolean>("has_cached_thumbnail", { fileId, width, height })
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
    return await invoke<string>("get_cached_thumbnail_path", { fileId, width, height })
  } catch {
    return ""
  }
}
