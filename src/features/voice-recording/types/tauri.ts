/**
 * Типы для взаимодействия с Tauri командами voice recording
 */

import { invoke } from "@tauri-apps/api/core"

/**
 * Поддерживаемые форматы аудио
 */
export type AudioFormat = "webm" | "mp3" | "wav" | "ogg" | "m4a"

/**
 * Информация о формате аудио
 */
export interface AudioFormatInfo {
  format: AudioFormat
  name: string
  description: string
  supported: boolean
}

/**
 * Параметры для сохранения аудио записи
 */
export interface SaveAudioParams {
  audioData: string // Base64 encoded audio data
  fileName: string
  format: AudioFormat
  useSubdirectory?: boolean
}

/**
 * Результат сохранения аудио
 */
export interface SaveAudioResult {
  filePath: string
  fileName: string
  fileSize: number
  format: AudioFormat
}

/**
 * Сохранить голосовую запись
 */
export async function saveVoiceRecording(params: SaveAudioParams): Promise<SaveAudioResult> {
  return await invoke<SaveAudioResult>("save_voice_recording", { params })
}

/**
 * Получить список поддерживаемых форматов аудио
 */
export async function getSupportedAudioFormats(): Promise<AudioFormatInfo[]> {
  return await invoke<AudioFormatInfo[]>("get_supported_audio_formats")
}

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
