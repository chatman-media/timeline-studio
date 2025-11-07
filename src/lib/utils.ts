import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { FfprobeData } from "@/features/media/types/ffprobe"
import type { MediaFile } from "@/features/media/types/media"
import { createLogger } from "./tauri-logger"

const logger = createLogger("Utils")

/**
 * Объединяет классы CSS с помощью clsx и tailwind-merge
 *
 * @param inputs - Массив классов CSS для объединения
 * @returns Строка с объединенными классами CSS
 *
 * @example
 * ```tsx
 * <div className={cn("text-red-500", isActive && "bg-blue-500")}>
 *   Текст с красным цветом и, возможно, синим фоном
 * </div>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует разрешение видео в стандартное обозначение (FHD, UHD, 4K и т.д.)
 *
 * @param width - Ширина видео в пикселях
 * @param height - Высота видео в пикселях
 * @returns Строка с обозначением разрешения (FHD, UHD, 4K и т.д.)
 *
 * @example
 * ```ts
 * formatResolution(1920, 1080) // "FHD"
 * formatResolution(3840, 2160) // "UHD"
 * ```
 */
export function formatResolution(width: number, height: number): string {
  const pixels = width * height
  if (height > width) {
    ;[width, height] = [height, width]
  }
  // console.log(`[formatResolution] width: ${width}, height: ${height}, pixels: ${pixels}`)

  // 1920×1080 (FHD)
  if (width === 1920 && height === 1080) return "FHD"
  // 2048×1080 (DCI 2K)
  if (width === 2048 && height === 1080) return "DCI 2K"
  // 2560×1440 (QHD)
  if (width === 2560 && height === 1440) return "QHD"
  // 3200×1800 (QHD+)
  if (width === 3200 && height === 1800) return "QHD+"
  // 3840×2160 (4K UHD)
  if (width === 3840 && height === 2160) return "UHD"
  // 4096×2160 (DCI 4K)
  if (width === 4096 && height === 2160) return "DCI 4K"
  // 5120×2880 = 14,745,600 pixels
  if (width === 5120 && height === 2880) return "5K"
  // 6144×3240 = 19,906,560 pixels
  if (width === 6144 && height === 3240) return "6K"
  // 7680×4320 = 33,177,600 pixels
  if (width === 7680 && height === 4320) return "8K UHD"
  // 7680×3264 = 25,280,000 pixels
  if (pixels >= 24576000) return "8K UHD" // 7680x3264
  if (pixels >= 19906560) return "6K" // 6144x3240
  // 5120×2880 = 14,745,600 pixels
  if (pixels >= 14745600) return "5K"
  if (pixels >= 8294400) return "UHD" // 3840x2160
  if (pixels >= 6048000) return "QHD+" // 3240x1800
  if (pixels >= 4147200) return "QHD" // 2560x1440
  if (pixels >= 2073600) return "FHD" // 1920x1080
  if (pixels >= 921600) return "HD" // 1280x720
  return "SD"
}

/**
 * Форматирует битрейт видео в Mbps
 *
 * @param bitrate - Битрейт видео в битах в секунду
 * @returns Строка с битрейтом в Mbps
 *
 * @example
 * ```ts
 * formatBitrate(5000000) // "5.0 Mbps"
 * formatBitrate(undefined) // "N/A"
 * ```
 */
export function formatBitrate(bitrate: number | undefined): string {
  if (!bitrate) return "N/A"
  return `${(bitrate / 1_000_000).toFixed(1)} Mbps`
}

/**
 * Генерирует уникальный идентификатор для нового видео
 *
 * @param videos - Массив существующих видео
 * @returns Строка с уникальным идентификатором для нового видео в формате "V{n}"
 *
 * @example
 * ```ts
 * // Если в массиве есть видео с id "V1", "V2", "V3"
 * generateVideoId(videos) // "V4"
 * ```
 */
export function generateVideoId(videos: MediaFile[]): string {
  // Сортируем видео по дате создания
  const sortedVideos = [...videos].sort((a, b) => {
    const timeA = new Date(a.startTime ?? 0).getTime()
    const timeB = new Date(b.startTime ?? 0).getTime()
    return timeA - timeB
  })

  // Находим максимальный существующий номер
  const maxNumber = sortedVideos.reduce((max, video) => {
    const match = /V(\d+)/.exec(video.id)
    if (match) {
      const num = Number.parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)

  return `V${maxNumber + 1}`
}

/**
 * Проверяет, доступно ли видео в указанное время
 *
 * @param video - Объект видео
 * @param currentTime - Текущее время в секундах
 * @param tolerance - Допустимое отклонение в секундах (по умолчанию 0.3)
 * @returns true, если видео доступно в указанное время, иначе false
 *
 * @example
 * ```ts
 * // Видео с началом в 10 секунд и длительностью 5 секунд
 * isVideoAvailable(video, 12) // true
 * isVideoAvailable(video, 20) // false
 * ```
 */
export function isVideoAvailable(video: MediaFile, currentTime: number, tolerance = 0.3): boolean {
  const startTime = video.startTime ?? 0
  const endTime = startTime + (video.duration ?? 0)
  return currentTime >= startTime - tolerance && currentTime <= endTime + tolerance
}

/**
 * Извлекает дату и время из имени файла в формате "YYYYMMDD_HHMMSS"
 *
 * @param fileName - Имя файла
 * @returns Объект Date, если удалось извлечь дату и время, иначе null
 *
 * @example
 * ```ts
 * parseFileNameDateTime("IMG_20240910_170942.jpg") // Date object for 2024-09-10 17:09:42
 * parseFileNameDateTime("image.jpg") // null
 * ```
 */
export function parseFileNameDateTime(fileName: string): Date | null {
  const match = /\d{8}_\d{6}/.exec(fileName)
  if (!match) return null

  const dateTimeStr = match[0] // "20240910_170942"
  const year = dateTimeStr.slice(0, 4)
  const month = dateTimeStr.slice(4, 6)
  const day = dateTimeStr.slice(6, 8)
  const hour = dateTimeStr.slice(9, 11)
  const minute = dateTimeStr.slice(11, 13)
  const second = dateTimeStr.slice(13, 15)

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
}

/**
 * Форматирует размер файла в человекочитаемый формат
 *
 * @param bytes - Размер файла в байтах
 * @returns Строка с размером файла в человекочитаемом формате (B, KB, MB, GB, TB)
 *
 * @example
 * ```ts
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Определяет время создания медиафайла из данных ffprobe
 *
 * @param probeData - Данные ffprobe о медиафайле
 * @returns Время создания медиафайла в секундах (UNIX timestamp)
 *
 * @description
 * Функция пытается определить время создания медиафайла в следующем порядке:
 * 1. Из метаданных (creation_time)
 * 2. Из имени файла (если оно содержит дату и время в формате "YYYYMMDD_HHMMSS")
 * 3. Из start_time в данных ffprobe
 * 4. Если все вышеперечисленные методы не сработали, возвращает текущее время
 */
export function getMediaCreationTime(probeData: FfprobeData): number {
  // 1. Try to get from probeData metadata
  if (probeData.format.tags?.creation_time) {
    const time = new Date(probeData.format.tags.creation_time).getTime() / 1000
    // console.log(
    //   `[getMediaCreationTime] Время из метаданных: ${new Date(time * 1000).toISOString()}`,
    // )
    return time
  }

  // 2. Try to parse from filename (e.g. "20240910_170942")
  const parsedDate = probeData.format.filename ? parseFileNameDateTime(probeData.format.filename) : null
  if (parsedDate) {
    const time = parsedDate.getTime() / 1000
    // console.log(
    //   `[getMediaCreationTime] Время из имени файла: ${new Date(time * 1000).toISOString()}`,
    // )
    return time
  }

  // 3. Try to get from probeData start_time
  const startTime = probeData.format.start_time
  if (startTime) {
    logger.debugSync("Using start_time", {
      time: new Date(startTime * 1000).toISOString(),
      filename: probeData.format.filename,
    })
    return startTime
  }

  // 4. If all else fails, return current time
  logger.warnSync("Could not determine file creation time, using current time", {
    filename: probeData.format.filename,
  })
  return Math.floor(Date.now() / 1000)
}

/**
 * Генерирует уникальный идентификатор
 *
 * @param prefix - Префикс для идентификатора (необязательно)
 * @returns Строка с уникальным идентификатором
 *
 * @example
 * ```ts
 * generateId() // "abc123def456"
 * generateId("clip") // "clip_abc123def456"
 * ```
 */
export function generateId(prefix?: string): string {
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return prefix ? `${prefix}_${id}` : id
}
