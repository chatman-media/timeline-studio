/**
 * Сервис синхронизации по таймкоду
 * Извлекает и сравнивает таймкоды из метаданных видеофайлов
 */

import type { MediaFile } from "@/core/types/media"
import type { TimelineClip } from "@/features/timeline/types"

import { createLogger } from "@/lib/tauri-logger"
import type { SyncResult } from "../types/multicam"

const logger = createLogger({ module: "TimecodeSync" })

export interface TimecodeInfo {
  timecode: string
  frameRate: number
  dropFrame: boolean
  totalFrames: number
}

/**
 * Парсит таймкод в формате HH:MM:SS:FF или HH:MM:SS;FF (drop frame)
 */
export function parseTimecode(timecode: string, frameRate: number): TimecodeInfo | null {
  // Проверяем формат таймкода
  const match = /^(\d{2}):(\d{2}):(\d{2})[:;](\d{2})$/.exec(timecode)
  if (!match) return null

  const [, hours, minutes, seconds, frames] = match
  const dropFrame = timecode.includes(";")

  // Вычисляем общее количество кадров
  let totalFrames = 0
  totalFrames += Number.parseInt(hours, 10) * 3600 * frameRate
  totalFrames += Number.parseInt(minutes, 10) * 60 * frameRate
  totalFrames += Number.parseInt(seconds, 10) * frameRate
  totalFrames += Number.parseInt(frames, 10)

  // Корректировка для drop frame (NTSC)
  if (dropFrame && (frameRate === 29.97 || frameRate === 59.94)) {
    const totalMinutes = Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10)
    const droppedFrames = totalMinutes * 2 - Math.floor(totalMinutes / 10) * 2
    totalFrames -= droppedFrames
  }

  return {
    timecode,
    frameRate,
    dropFrame,
    totalFrames,
  }
}

/**
 * Конвертирует таймкод в секунды
 */
export function timecodeToSeconds(timecodeInfo: TimecodeInfo): number {
  return timecodeInfo.totalFrames / timecodeInfo.frameRate
}

/**
 * Извлекает таймкод из медиафайла
 */
export function extractTimecode(mediaFile: MediaFile): string | null {
  if (!mediaFile.probeData) return null

  // Проверяем таймкод в потоках
  for (const stream of mediaFile.probeData.streams) {
    if (stream.timecode) {
      return stream.timecode
    }
  }

  // Проверяем таймкод в тегах формата
  if (mediaFile.probeData.format.tags?.timecode) {
    return String(mediaFile.probeData.format.tags.timecode)
  }

  // Проверяем альтернативные теги
  const tags = mediaFile.probeData.format.tags
  if (tags) {
    // GoPro и некоторые камеры используют другие теги
    const alternativeTags = [
      "com.apple.quicktime.timecode.start",
      "quicktime:timecode",
      "creation_time",
      "MediaCreateDate",
    ]

    for (const tag of alternativeTags) {
      if (tags[tag]) {
        const value = String(tags[tag])
        // Проверяем, похоже ли на таймкод
        if (/^\d{2}:\d{2}:\d{2}[:;]\d{2}$/.test(value)) {
          return value
        }
      }
    }
  }

  return null
}

/**
 * Извлекает время создания файла из метаданных
 */
export function extractCreationTime(mediaFile: MediaFile): Date | null {
  if (!mediaFile.probeData?.format.tags) return null

  const tags = mediaFile.probeData.format.tags
  const creationTags = ["creation_time", "date", "DateTimeOriginal", "CreateDate", "MediaCreateDate"]

  for (const tag of creationTags) {
    if (tags[tag]) {
      const date = new Date(String(tags[tag]))
      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }
  }

  return null
}

/**
 * Получает частоту кадров для медиафайла
 */
export function getFrameRate(mediaFile: MediaFile): number {
  if (!mediaFile.probeData) return 30 // По умолчанию

  // Ищем видеопоток
  const videoStream = mediaFile.probeData.streams.find((stream) => stream.codec_type === "video")

  if (videoStream?.r_frame_rate) {
    // Парсим frame rate в формате "30/1" или "30000/1001"
    const [num, den] = videoStream.r_frame_rate.split("/").map(Number)
    if (num && den) {
      return num / den
    }
  }

  return 30 // По умолчанию
}

/**
 * Синхронизирует клипы по таймкоду
 */
export function syncByTimecode(baseClip: TimelineClip, clips: TimelineClip[], mediaFiles: MediaFile[]): SyncResult[] {
  const results: SyncResult[] = []

  // Получаем медиафайл для базового клипа
  const baseMedia = mediaFiles.find((m) => m.id === baseClip.mediaId)
  if (!baseMedia) {
    logger.warn("[syncByTimecode] Base media not found")
    return results
  }

  // Извлекаем таймкод базового клипа
  const baseTimecode = extractTimecode(baseMedia)
  const baseFrameRate = getFrameRate(baseMedia)
  let baseTimecodeInfo: TimecodeInfo | null = null
  let baseCreationTime: Date | null = null

  if (baseTimecode) {
    baseTimecodeInfo = parseTimecode(baseTimecode, baseFrameRate)
    logger.info("[syncByTimecode] Base timecode:", { timecodeInfo: baseTimecodeInfo })
  } else {
    // Fallback на время создания
    baseCreationTime = extractCreationTime(baseMedia)
    logger.info("[syncByTimecode] Using creation time:", { creationTime: baseCreationTime })
  }

  // Синхронизируем остальные клипы
  for (const clip of clips) {
    if (clip.id === baseClip.id) continue

    const media = mediaFiles.find((m) => m.id === clip.mediaId)
    if (!media) {
      results.push({
        clipId: clip.id,
        offset: 0,
        confidence: 0,
        method: "none",
      })
      continue
    }

    // Пытаемся синхронизировать по таймкоду
    const timecode = extractTimecode(media)
    if (timecode && baseTimecodeInfo) {
      const frameRate = getFrameRate(media)
      const timecodeInfo = parseTimecode(timecode, frameRate)

      if (timecodeInfo) {
        // Вычисляем разницу в секундах
        const baseSeconds = timecodeToSeconds(baseTimecodeInfo)
        const clipSeconds = timecodeToSeconds(timecodeInfo)
        const offset = baseSeconds - clipSeconds

        results.push({
          clipId: clip.id,
          offset,
          confidence: 1.0, // Высокая уверенность для таймкода
          method: "timecode",
        })

        logger.info(`[syncByTimecode] Clip ${clip.id} offset: ${offset}s`)
        continue
      }
    }

    // Fallback на время создания
    const creationTime = extractCreationTime(media)
    if (creationTime && baseCreationTime) {
      // Разница в миллисекундах
      const offset = (baseCreationTime.getTime() - creationTime.getTime()) / 1000

      results.push({
        clipId: clip.id,
        offset,
        confidence: 0.7, // Средняя уверенность для времени создания
        method: "creation_time",
      })

      logger.info(`[syncByTimecode] Clip ${clip.id} creation time offset: ${offset}s`)
      continue
    }

    // Не удалось синхронизировать
    results.push({
      clipId: clip.id,
      offset: 0,
      confidence: 0,
      method: "none",
    })
  }

  return results
}

/**
 * Проверяет, поддерживает ли медиафайл синхронизацию по таймкоду
 */
export function supportsTimecodeSync(mediaFile: MediaFile): boolean {
  return extractTimecode(mediaFile) !== null || extractCreationTime(mediaFile) !== null
}

/**
 * Форматирует таймкод для отображения
 */
export function formatTimecode(seconds: number, frameRate = 30): string {
  const totalFrames = Math.round(seconds * frameRate)
  const frames = Math.round(totalFrames % frameRate)
  const totalSeconds = Math.floor(totalFrames / frameRate)
  const secs = totalSeconds % 60
  const mins = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`
}
