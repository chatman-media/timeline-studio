/**
 * Сервис синхронизации по аудио
 * Анализирует аудиодорожки для автоматического выравнивания клипов
 */

import type { MediaFile } from "@/features/media/types/media"
import type { TimelineClip } from "@/features/timeline/types/timeline"

import { createLogger } from "@/lib/tauri-logger"
import type { SyncResult } from "../types/multicam"

const logger = createLogger({ module: "AudioSync" })

export interface AudioAnalysisResult {
  clipId: string
  hasAudio: boolean
  sampleRate: number
  channels: number
  duration: number
  audioStreamIndex: number
}

export interface AudioCorrelationResult {
  offset: number // Смещение в секундах
  confidence: number // 0-1, уверенность в корреляции
  correlationPeak: number // Значение пика корреляции
}

export interface AudioSyncProgress {
  current: number
  total: number
  phase: "loading" | "analyzing" | "correlating" | "complete"
  message: string
}

/**
 * Проверяет, есть ли у медиафайла аудиодорожка
 */
export function hasAudioTrack(mediaFile: MediaFile): boolean {
  if (!mediaFile.probeData?.streams) return false

  return mediaFile.probeData.streams.some((stream) => stream.codec_type === "audio")
}

/**
 * Получает информацию об аудиодорожке
 */
export function getAudioInfo(mediaFile: MediaFile): AudioAnalysisResult | null {
  if (!mediaFile.probeData?.streams) return null

  const audioStream = mediaFile.probeData.streams.find((stream) => stream.codec_type === "audio")

  if (!audioStream) return null

  return {
    clipId: mediaFile.id,
    hasAudio: true,
    sampleRate: audioStream.sample_rate || 48000,
    channels: audioStream.channels || 2,
    duration:
      Number.parseFloat(String(audioStream.duration || "0")) ||
      Number.parseFloat(String(mediaFile.probeData.format.duration || "0")) ||
      0,
    audioStreamIndex: audioStream.index || 0,
  }
}

/**
 * Вычисляет корреляцию между двумя аудиосигналами
 * Упрощенная версия для демонстрации - в реальности нужно использовать FFT
 */
export function correlateAudioSignals(
  signal1: Float32Array,
  signal2: Float32Array,
  sampleRate: number,
  maxOffsetSeconds = 10,
): AudioCorrelationResult {
  // Обработка пустых сигналов
  if (signal1.length === 0 || signal2.length === 0) {
    return {
      offset: 0,
      confidence: 0,
      correlationPeak: 0,
    }
  }

  const maxOffsetSamples = Math.floor(maxOffsetSeconds * sampleRate)
  let bestOffset = 0
  let bestCorrelation = -1

  // Ищем лучшее совпадение в пределах maxOffsetSeconds
  const step = Math.max(1, Math.floor(maxOffsetSamples / 100))
  for (let offset = -maxOffsetSamples; offset <= maxOffsetSamples; offset += step) {
    const correlation = calculateCorrelation(signal1, signal2, offset)

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    }
  }

  // Уточняем результат в окрестности найденного пика
  const fineSearchRange = Math.min(100, Math.floor(signal1.length / 10))
  for (let offset = bestOffset - fineSearchRange; offset <= bestOffset + fineSearchRange; offset++) {
    const correlation = calculateCorrelation(signal1, signal2, offset)

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    }
  }

  return {
    offset: bestOffset / sampleRate,
    confidence: Math.max(0, Math.min(1, bestCorrelation)),
    correlationPeak: bestCorrelation,
  }
}

/**
 * Вычисляет корреляцию для конкретного смещения
 */
function calculateCorrelation(signal1: Float32Array, signal2: Float32Array, offset: number): number {
  // Обработка пустых сигналов
  if (signal1.length === 0 || signal2.length === 0) return 0

  const length = Math.min(signal1.length, signal2.length)
  const overlapLength = length - Math.abs(offset)

  if (overlapLength <= 0) return 0

  let sum = 0
  let sum1Sq = 0
  let sum2Sq = 0

  const start1 = offset > 0 ? 0 : -offset
  const start2 = offset > 0 ? offset : 0

  for (let i = 0; i < overlapLength; i++) {
    const val1 = signal1[start1 + i] || 0
    const val2 = signal2[start2 + i] || 0

    sum += val1 * val2
    sum1Sq += val1 * val1
    sum2Sq += val2 * val2
  }

  const denominator = Math.sqrt(sum1Sq * sum2Sq)
  return denominator > 0 ? sum / denominator : 0
}

/**
 * Извлекает аудиосэмплы из медиафайла (заглушка)
 * В реальной реализации нужно использовать Web Audio API или ffmpeg
 */
async function extractAudioSamples(
  _mediaFile: MediaFile,
  duration = 30,
  onProgress?: (progress: number) => void,
): Promise<Float32Array> {
  // Заглушка - возвращаем случайный сигнал для демонстрации
  const sampleRate = 48000
  const samples = new Float32Array(duration * sampleRate)

  // Имитируем прогресс
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    onProgress?.(i / 10)
  }

  // Генерируем тестовый сигнал
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5
  }

  return samples
}

/**
 * Синхронизирует клипы по аудио
 */
export async function syncByAudio(
  baseClip: TimelineClip,
  clips: TimelineClip[],
  mediaFiles: MediaFile[],
  onProgress?: (progress: AudioSyncProgress) => void,
): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  // Получаем медиафайл для базового клипа
  const baseMedia = mediaFiles.find((m) => m.id === baseClip.mediaId)
  if (!baseMedia || !hasAudioTrack(baseMedia)) {
    logger.warn("[syncByAudio] Base clip has no audio")
    return results
  }

  onProgress?.({
    current: 0,
    total: clips.length,
    phase: "loading",
    message: "Загрузка базового аудио...",
  })

  // Извлекаем аудио из базового клипа
  const baseAudio = await extractAudioSamples(baseMedia, 30, (p) => {
    onProgress?.({
      current: p * 0.5,
      total: clips.length,
      phase: "loading",
      message: `Загрузка базового аудио: ${Math.round(p * 100)}%`,
    })
  })

  // Анализируем остальные клипы
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i]
    if (clip.id === baseClip.id) continue

    const media = mediaFiles.find((m) => m.id === clip.mediaId)
    if (!media || !hasAudioTrack(media)) {
      results.push({
        clipId: clip.id,
        offset: 0,
        confidence: 0,
        method: "none",
      })
      continue
    }

    onProgress?.({
      current: i + 1,
      total: clips.length,
      phase: "analyzing",
      message: `Анализ камеры ${i + 1}...`,
    })

    // Извлекаем аудио из текущего клипа
    const clipAudio = await extractAudioSamples(media, 30)

    onProgress?.({
      current: i + 1,
      total: clips.length,
      phase: "correlating",
      message: `Корреляция камеры ${i + 1}...`,
    })

    // Вычисляем корреляцию
    const correlation = correlateAudioSignals(
      baseAudio,
      clipAudio,
      48000, // Sample rate
      10, // Max offset seconds
    )

    results.push({
      clipId: clip.id,
      offset: correlation.offset,
      confidence: correlation.confidence,
      method: "audio" as const,
    })

    logger.info(`[syncByAudio] Clip ${clip.id} offset: ${correlation.offset}s, confidence: ${correlation.confidence}`)
  }

  onProgress?.({
    current: clips.length,
    total: clips.length,
    phase: "complete",
    message: "Синхронизация завершена",
  })

  return results
}

/**
 * Анализирует качество аудиосинхронизации
 */
export function analyzeAudioSyncQuality(results: SyncResult[]): {
  averageConfidence: number
  successRate: number
  recommendation: "good" | "fair" | "poor"
} {
  const audioResults = results.filter((r) => r.method === "audio")
  if (audioResults.length === 0) {
    return {
      averageConfidence: 0,
      successRate: 0,
      recommendation: "poor",
    }
  }

  const averageConfidence = audioResults.reduce((sum, r) => sum + r.confidence, 0) / audioResults.length
  const successRate = audioResults.filter((r) => r.confidence > 0.7).length / audioResults.length

  let recommendation: "good" | "fair" | "poor"
  if (averageConfidence > 0.8 && successRate > 0.8) {
    recommendation = "good"
  } else if (averageConfidence > 0.6 || successRate > 0.6) {
    recommendation = "fair"
  } else {
    recommendation = "poor"
  }

  return {
    averageConfidence,
    successRate,
    recommendation,
  }
}

/**
 * Форматирует результат синхронизации для отображения
 */
export function formatSyncResult(result: SyncResult): string {
  if (result.method === "none" || result.confidence === 0) {
    return "Синхронизация не удалась"
  }

  const offsetStr = result.offset > 0 ? `+${result.offset.toFixed(3)}` : result.offset.toFixed(3)
  const confidencePercent = Math.round(result.confidence * 100)

  return `${offsetStr}s (${confidencePercent}% уверенность)`
}
