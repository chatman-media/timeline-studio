/**
 * Общие типы для работы с медиа файлами
 * Перенесено из src/shared/types/media.ts
 */

/**
 * Метаданные медиа файла из кэша
 */
export interface MediaMetadata {
  /** Путь к файлу */
  file_path: string
  /** Размер файла в байтах */
  file_size: number
  /** Время модификации файла (ISO строка) */
  modified_time: string
  /** Длительность в секундах */
  duration: number
  /** Разрешение видео [width, height] */
  resolution?: [number, number]
  /** FPS */
  fps?: number
  /** Битрейт в bps */
  bitrate?: number
  /** Кодек видео */
  video_codec?: string
  /** Кодек аудио */
  audio_codec?: string
  /** Время кэширования (ISO строка) */
  cached_at: string
}

/**
 * Расширенные метаданные для MediaFile
 */
export interface ExtendedMediaFile {
  /** Ширина видео */
  width?: number
  /** Высота видео */
  height?: number
  /** FPS */
  fps?: number
  /** Битрейт */
  bitrate?: number
  /** Видео кодек */
  videoCodec?: string
  /** Аудио кодек */
  audioCodec?: string
}

/**
 * Преобразование MediaMetadata в поля для MediaFile
 */
export function metadataToMediaFileFields(metadata: MediaMetadata): ExtendedMediaFile {
  return {
    width: metadata.resolution?.[0],
    height: metadata.resolution?.[1],
    fps: metadata.fps,
    bitrate: metadata.bitrate,
    videoCodec: metadata.video_codec,
    audioCodec: metadata.audio_codec,
  }
}
