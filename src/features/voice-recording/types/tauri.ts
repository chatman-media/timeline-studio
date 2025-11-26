/**
 * Типы для взаимодействия с Tauri командами voice recording
 * Re-exports from ai-services domain for backward compatibility
 */

import type { AudioFormat as AudioFormatType } from "@/domains/ai-services/tauri/audio-commands"

// Re-export types and functions from domain
export type {
  AudioFormat,
  AudioFormatInfo,
  SaveAudioParams,
  SaveAudioResult,
} from "@/domains/ai-services/tauri/audio-commands"
export { getSupportedAudioFormats, saveVoiceRecording } from "@/domains/ai-services/tauri/audio-commands"

// Local type alias for use in this file
type AudioFormat = AudioFormatType

/**
 * Конвертировать Blob в Base64
 * Использует современный API ArrayBuffer вместо FileReader для лучшей производительности
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
    return btoa(binary)
  } catch (error) {
    throw new Error(`Failed to convert blob to base64: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Форматировать имя файла для сохранения
 */
export function formatFileName(prefix = "voice_recording"): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/:/g, "-").replace(/\..+/, "")
  return `${prefix}_${timestamp}`
}

/**
 * Получить MIME тип для формата
 */
export function getMimeTypeForFormat(format: AudioFormat): string {
  const mimeTypes: Record<AudioFormat, string> = {
    webm: "audio/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
  }
  return mimeTypes[format] || "audio/webm"
}

/**
 * Проверить поддержку формата в MediaRecorder
 */
export function isFormatSupportedByMediaRecorder(format: AudioFormat): boolean {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return false
  }

  const mimeType = getMimeTypeForFormat(format)

  // Для WebM пробуем разные кодеки
  if (format === "webm") {
    return (
      MediaRecorder.isTypeSupported(`${mimeType};codecs=opus`) ||
      MediaRecorder.isTypeSupported(`${mimeType};codecs=vorbis`) ||
      MediaRecorder.isTypeSupported(mimeType)
    )
  }

  return MediaRecorder.isTypeSupported(mimeType)
}

/**
 * Получить опции для MediaRecorder в зависимости от формата
 */
export function getMediaRecorderOptions(format: AudioFormat): MediaRecorderOptions {
  const mimeType = getMimeTypeForFormat(format)

  // Для WebM пробуем разные кодеки
  if (format === "webm") {
    if (MediaRecorder.isTypeSupported(`${mimeType};codecs=opus`)) {
      return { mimeType: `${mimeType};codecs=opus` }
    }
    if (MediaRecorder.isTypeSupported(`${mimeType};codecs=vorbis`)) {
      return { mimeType: `${mimeType};codecs=vorbis` }
    }
  }

  return { mimeType }
}
