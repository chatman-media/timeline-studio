/**
 * Утилиты для модуля camera-capture
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "CameraCaptureUtils" })

/**
 * Безопасно останавливает все треки MediaStream
 * @param stream - MediaStream для остановки
 * @param logPrefix - Префикс для логирования
 */
export function cleanupMediaStream(stream: MediaStream | null, logPrefix = "MediaStream cleanup"): void {
  if (!stream) return

  logger.info(`${logPrefix}: Остановка треков`, { trackCount: stream.getTracks().length })

  stream.getTracks().forEach((track, index) => {
    if (track.readyState !== "ended") {
      try {
        track.stop()
        logger.debug(`${logPrefix}: Остановлен трек`, { index: index + 1, kind: track.kind })
      } catch (error) {
        logger.warn(`${logPrefix}: Ошибка при остановке трека`, { index: index + 1, error })
      }
    } else {
      logger.debug(`${logPrefix}: Трек уже остановлен`, { index: index + 1, kind: track.kind })
    }
  })
}

/**
 * Безопасно очищает srcObject видео элемента
 * @param videoElement - HTMLVideoElement для очистки
 * @param logPrefix - Префикс для логирования
 */
export function cleanupVideoElement(videoElement: HTMLVideoElement | null, logPrefix = "Video element cleanup"): void {
  if (!videoElement) return

  try {
    if (videoElement.srcObject) {
      logger.debug(`${logPrefix}: Очистка srcObject`)
      videoElement.srcObject = null
    }

    if (!videoElement.paused) {
      videoElement.pause()
    }

    videoElement.currentTime = 0
  } catch (error) {
    logger.warn(`${logPrefix}: Ошибка при очистке видео элемента`, { error })
  }
}

/**
 * Форматирует время записи в MM:SS формат
 * @param timeInMs - Время в миллисекундах
 * @returns Отформатированная строка времени
 */
export function formatRecordingTime(timeInMs: number): string {
  const totalSeconds = Math.floor(timeInMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

/**
 * Проверяет поддержку MediaDevices API
 * @returns true если API поддерживается
 */
export function isMediaDevicesSupported(): boolean {
  return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function" && window.MediaRecorder)
}

/**
 * Проверяет поддержку Screen Capture API
 * @returns true если API поддерживается
 */
export function isScreenCaptureSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
}

/**
 * Проверяет поддержку MIME типа для MediaRecorder
 * @param mimeType - MIME тип для проверки
 * @returns true если тип поддерживается
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  if (typeof MediaRecorder === "undefined") return false
  return MediaRecorder.isTypeSupported(mimeType)
}

/**
 * Получает лучший поддерживаемый MIME тип из списка
 * @param mimeTypes - Массив MIME типов в порядке предпочтения
 * @returns Лучший поддерживаемый MIME тип или undefined
 */
export function getBestSupportedMimeType(mimeTypes: string[]): string | undefined {
  return mimeTypes.find((mimeType) => isMimeTypeSupported(mimeType))
}

/**
 * Создаёт уникальное имя файла для записи
 * @param prefix - Префикс имени файла
 * @param extension - Расширение файла
 * @returns Уникальное имя файла
 */
export function generateRecordingFileName(prefix = "recording", extension = "webm"): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Конвертирует Blob в Uint8Array
 * @param blob - Blob для конвертации
 * @returns Promise с Uint8Array
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

/**
 * Извлекает разрешение из строки формата "1920x1080"
 * @param resolutionString - Строка разрешения
 * @returns Объект с шириной и высотой или null
 */
export function parseResolution(resolutionString: string): { width: number; height: number } | null {
  const match = /(\d+)x(\d+)/.exec(resolutionString)
  if (!match || match.length < 3) return null

  return {
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  }
}

/**
 * Получает настройки трека MediaStream
 * @param stream - MediaStream
 * @param trackKind - Тип трека ("video" или "audio")
 * @returns Настройки трека или null
 */
export function getTrackSettings(stream: MediaStream | null, trackKind: "video" | "audio"): MediaTrackSettings | null {
  if (!stream) return null

  const tracks = trackKind === "video" ? stream.getVideoTracks() : stream.getAudioTracks()
  if (tracks.length === 0) return null

  return tracks[0].getSettings()
}

/**
 * Вычисляет соотношение сторон из разрешения
 * @param width - Ширина
 * @param height - Высота
 * @returns Соотношение сторон как строка (например "16:9")
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

/**
 * Проверяет, является ли ошибка ошибкой доступа к медиа
 * @param error - Ошибка для проверки
 * @returns Информация об ошибке или null
 */
export function parseMediaError(error: unknown): { type: string; message: string } | null {
  if (!(error instanceof Error)) return null

  const errorMessages: Record<string, string> = {
    NotAllowedError: "Доступ к устройству запрещён пользователем",
    NotFoundError: "Устройство не найдено",
    NotReadableError: "Устройство используется другим приложением",
    OverconstrainedError: "Устройство не поддерживает запрошенные настройки",
    SecurityError: "Доступ заблокирован по соображениям безопасности",
    AbortError: "Операция была прервана",
  }

  const message = errorMessages[error.name] || error.message || "Неизвестная ошибка"

  return {
    type: error.name,
    message,
  }
}

/**
 * Создаёт debounced версию функции
 * @param func - Функция для debounce
 * @param delay - Задержка в мс
 * @returns Debounced функция
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
