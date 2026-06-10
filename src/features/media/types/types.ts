import type { MediaFile, MediaTimeRange, MediaTrack } from "@/core/types"

/**
 * Интерфейс для видеопотока
 */
export interface VideoStream {
  codec_type: string
  rotation?: string
  width?: number
  height?: number
}

/**
 * Интерфейс для размеров видео
 */
export interface Dimensions {
  width: number
  height: number
  style: string
}

/**
 * Интерфейс для группировки файлов по дате
 */
export interface DateGroup {
  date: string
  files: MediaFile[]
}

/**
 * Интерфейс для сектора на таймлайне
 */
export interface Sector {
  id: string
  name: string
  tracks: MediaTrack[]
  timeRanges: MediaTimeRange[]
  zoomLevel?: number
  scrollPosition?: number
  startTime: number
  endTime: number
  isLocked: boolean
  combinedDuration: number
}

// Экспорт Track как алиаса для MediaTrack (для обратной совместимости)
export type Track = MediaTrack

export type { MediaTimeRange as TimeRange }
