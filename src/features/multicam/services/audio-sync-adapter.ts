/**
 * Адаптер для синхронизации двух аудиофайлов
 * Использует Tauri команду correlate_audio_files для cross-correlation анализа
 */

import { container } from "@timeline-studio/core/container"
import { createLogger } from "@/lib/tauri-logger"
import type { AudioCorrelationResult } from "./audio-sync"

const logger = createLogger({ module: "AudioSyncAdapter" })

/**
 * Синхронизирует два аудиофайла по их путям
 * Использует cross-correlation алгоритм через Tauri backend
 */
export async function syncByAudio(
  basePath: string,
  targetPath: string,
  options?: {
    onProgress?: (progress: number) => void
    signal?: AbortSignal
    maxOffsetSeconds?: number
  },
): Promise<AudioCorrelationResult> {
  logger.info(`[syncByAudio] Syncing ${targetPath} to ${basePath}`)

  // Проверяем отмену перед началом
  if (options?.signal?.aborted) {
    throw new Error("Синхронизация отменена")
  }

  // Начинаем анализ - прогресс будет обновляться поэтапно
  options?.onProgress?.(0.1)

  try {
    // Вызываем Tauri команду для cross-correlation
    const result = await container.getAI().correlateAudioFiles(basePath, targetPath, options?.maxOffsetSeconds ?? 30)

    // Проверяем отмену после получения результата
    if (options?.signal?.aborted) {
      throw new Error("Синхронизация отменена")
    }

    options?.onProgress?.(1.0)

    logger.info(`[syncByAudio] Result: offset=${result.offsetSeconds}s, confidence=${result.confidence}`)

    // Преобразуем результат в формат AudioCorrelationResult
    return {
      offset: result.offsetSeconds,
      confidence: result.confidence,
      correlationPeak: result.correlationPeak,
    }
  } catch (error) {
    // Проверяем, не была ли ошибка связана с отменой
    if (options?.signal?.aborted) {
      throw new Error("Синхронизация отменена")
    }

    logger.error(`[syncByAudio] Failed to correlate audio: ${error}`)
    throw error
  }
}
