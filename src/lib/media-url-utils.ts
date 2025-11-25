/**
 * Утилиты для создания media URL
 *
 * Унифицированная система генерации URL для медиафайлов в Tauri
 */

import { convertFileSrc } from "@tauri-apps/api/core"
import type { MediaFile } from "@/features/media/types/media"
import { createLogger } from "./tauri-logger"
import { isTauriEnvironment } from "./tauri-utils"

const logger = createLogger("MediaUrlUtils")

/**
 * Кодеки, не поддерживаемые браузером/WebView и требующие прокси
 */
const UNSUPPORTED_BROWSER_CODECS = ["hevc", "h265", "hev1"]

/**
 * Проверяет, является ли видеофайл H.265/HEVC
 * Эти файлы не воспроизводятся в WebView/Safari и требуют прокси
 */
export function isUnsupportedBrowserCodec(file: MediaFile): boolean {
  // Проверяем videoCodec если есть
  if (file.videoCodec) {
    const codec = file.videoCodec.toLowerCase()
    return UNSUPPORTED_BROWSER_CODECS.some((c) => codec.includes(c))
  }

  // Проверяем probeData streams
  if (file.probeData?.streams) {
    const videoStream = file.probeData.streams.find((s) => s.codec_type === "video")
    if (videoStream?.codec_name) {
      const codec = videoStream.codec_name.toLowerCase()
      return UNSUPPORTED_BROWSER_CODECS.some((c) => codec.includes(c))
    }
  }

  return false
}

/**
 * Проверяет, есть ли готовый прокси для файла
 */
export function hasProxy(file: MediaFile): boolean {
  return !!file.proxy?.path
}

/**
 * Получает путь для воспроизведения видео
 * Использует прокси если файл H.265 и прокси доступен
 */
export function getPlaybackPath(file: MediaFile): string {
  // Если кодек не поддерживается браузером и есть прокси - используем его
  if (isUnsupportedBrowserCodec(file) && hasProxy(file)) {
    logger.debugSync("Using proxy path for unsupported codec", {
      original: file.path,
      proxy: file.proxy!.path,
      codec: file.videoCodec || file.probeData?.streams?.find((s) => s.codec_type === "video")?.codec_name,
    })
    return file.proxy!.path
  }

  return file.path
}

/**
 * Проверяет, требуется ли генерация прокси для файла
 */
export function needsProxyGeneration(file: MediaFile): boolean {
  return isUnsupportedBrowserCodec(file) && !hasProxy(file)
}

/**
 * Типы медиафайлов для URL генерации
 */
export type MediaType = "video" | "audio" | "image"

/**
 * Опции для создания media URL
 */
export interface MediaUrlOptions {
  /** Тип медиафайла */
  type: MediaType
  /** Использовать ли blob URL (не рекомендуется для видео) */
  useBlob?: boolean
  /** Fallback URL если основной метод не работает */
  fallbackUrl?: string
}

/**
 * Создаёт безопасный asset URL для медиафайла через Tauri API
 *
 * Использует convertFileSrc для создания asset:// URL, который:
 * - Не требует загрузки файла в память
 * - Поддерживает streaming
 * - Правильно обрабатывает кириллицу
 * - Работает со всеми типами медиа
 *
 * @param filePath - Путь к медиафайлу
 * @param options - Опции генерации URL
 * @returns Asset URL для использования в HTML элементах
 *
 * @example
 * ```ts
 * // Для видео (рекомендуется)
 * const videoUrl = createMediaUrl('/path/to/video.mp4', { type: 'video' })
 *
 * // Для аудио
 * const audioUrl = createMediaUrl('/path/to/audio.mp3', { type: 'audio' })
 *
 * // Для изображения
 * const imageUrl = createMediaUrl('/path/to/image.jpg', { type: 'image' })
 * ```
 */
export function createMediaUrl(filePath: string, options: MediaUrlOptions): string {
  const { type, fallbackUrl } = options

  // Проверяем Tauri окружение
  if (!isTauriEnvironment()) {
    logger.warnSync("Not in Tauri environment", { filePath, type })

    // В development режиме возвращаем путь как есть
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      logger.debugSync("Dev mode - using original path", { filePath })
      return filePath
    }

    return fallbackUrl || filePath
  }

  // Если путь уже является URL, возвращаем как есть
  if (
    filePath.startsWith("asset://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("http://") ||
    filePath.startsWith("data:")
  ) {
    logger.debugSync("Path is already a URL", { filePath })
    return filePath
  }

  // Декодируем путь, если он уже закодирован
  let cleanPath = filePath
  try {
    cleanPath = decodeURIComponent(filePath)
  } catch {
    logger.debugSync("Failed to decode path, using original", { filePath })
  }

  logger.debugSync("Creating media URL", {
    original: filePath,
    cleaned: cleanPath,
    type,
    isTauri: true,
  })

  // Используем convertFileSrc для создания asset URL
  try {
    const assetUrl = convertFileSrc(cleanPath)
    logger.debugSync("convertFileSrc success", { assetUrl, type })

    // Проверяем, что получили валидный URL
    if (assetUrl && (assetUrl.startsWith("asset://") || assetUrl.startsWith("http://asset.localhost"))) {
      return assetUrl
    }

    // Если получили что-то странное, но не undefined
    if (assetUrl) {
      logger.warnSync("Unexpected URL format from convertFileSrc", { assetUrl })
      return assetUrl
    }
  } catch (error) {
    logger.errorSync("Error with convertFileSrc", {
      error: String(error),
      message: error instanceof Error ? error.message : String(error),
      filePath: cleanPath,
    })
  }

  // Fallback - создаем asset URL вручную для Tauri 2.0
  const escapedPath = cleanPath
    .split("/")
    .map((segment) => encodeURIComponent(segment).replace(/'/g, "%27"))
    .join("/")

  const manualAssetUrl = `asset://localhost/${escapedPath}`
  logger.debugSync("Using manual asset URL", { manualAssetUrl, originalPath: filePath })

  return manualAssetUrl
}

/**
 * Создаёт URL для видеофайла
 * Использует asset:// protocol для эффективного streaming
 *
 * @param filePath - Путь к видеофайлу
 * @returns Asset URL для использования в <video> элементах
 */
export function createVideoUrl(filePath: string): string {
  return createMediaUrl(filePath, { type: "video" })
}

/**
 * Создаёт URL для аудиофайла
 * Использует asset:// protocol
 *
 * @param filePath - Путь к аудиофайлу
 * @returns Asset URL для использования в <audio> элементах
 */
export function createAudioUrl(filePath: string): string {
  return createMediaUrl(filePath, { type: "audio" })
}

/**
 * Создаёт URL для изображения
 * Использует asset:// protocol
 *
 * @param filePath - Путь к изображению
 * @returns Asset URL для использования в <img> элементах
 */
export function createImageUrl(filePath: string): string {
  return createMediaUrl(filePath, { type: "image" })
}

/**
 * Создаёт URL для thumbnail изображения
 * Алиас для createImageUrl с более понятным именем
 *
 * @param filePath - Путь к thumbnail
 * @returns Asset URL для использования в <img> элементах
 */
export function createThumbnailUrl(filePath: string): string {
  return createImageUrl(filePath)
}

/**
 * DEPRECATED: Используйте createMediaUrl вместо этого
 * @deprecated
 */
export function createBlobUrl(filePath: string, _mimeType: string): never {
  throw new Error(
    "createBlobUrl is deprecated. Use createMediaUrl with asset:// protocol instead. " +
      "Blob URLs require loading entire file into memory and don't support streaming. " +
      `Path: ${filePath}`,
  )
}
