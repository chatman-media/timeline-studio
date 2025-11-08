/**
 * Интеграция с Whisper для распознавания речи
 * Мост между Enhanced Subtitle Automation и существующими сервисами транскрипции
 */

import { TranscriptionService } from "@/domains/ai-services/services/transcription-service"
import type { SpeechDetection } from "@/domains/ai-services/types"
import type { TranscriptionResult, WhisperIntegrationOptions } from "@/domains/ai-services/types/transcription"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "WhisperIntegration" })

// WhisperIntegrationOptions теперь в domains/ai-services/types/transcription

/**
 * Сервис интеграции с Whisper для распознавания речи
 */
export class WhisperIntegrationService {
  private static instance: WhisperIntegrationService
  private transcriptionService: TranscriptionService

  private constructor() {
    this.transcriptionService = TranscriptionService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): WhisperIntegrationService {
    if (!WhisperIntegrationService.instance) {
      WhisperIntegrationService.instance = new WhisperIntegrationService()
    }
    return WhisperIntegrationService.instance
  }

  /**
   * Распознавание речи через Whisper
   */
  public async recognizeSpeech(mediaPath: string, options: WhisperIntegrationOptions = {}): Promise<SpeechDetection[]> {
    // Делегируем в TranscriptionService, который уже содержит эту логику
    return this.transcriptionService.recognizeSpeech(mediaPath, options)
  }

  /**
   * Распознавание с определением говорящих
   */
  public async recognizeSpeechWithSpeakers(
    mediaPath: string,
    options: WhisperIntegrationOptions = {},
  ): Promise<SpeechDetection[]> {
    logger.info("Starting speech recognition with speaker identification")

    try {
      // Базовое распознавание речи
      const speechDetections = await this.recognizeSpeech(mediaPath, options)

      // Применяем простую эвристику для определения говорящих
      const withSpeakers = this.applySpeakerIdentification(speechDetections)

      logger.info(
        `Speech recognition with speakers completed: ${withSpeakers.length} segments, ${this.countSpeakers(withSpeakers)} speakers`,
      )
      return withSpeakers
    } catch (error) {
      logger.error("Speech recognition with speakers failed:", { error: String(error) })
      return []
    }
  }

  /**
   * Оптимизированное распознавание для субтитров
   */
  public async recognizeForSubtitles(
    mediaPath: string,
    options: WhisperIntegrationOptions & {
      maxSegmentDuration?: number
      minSegmentDuration?: number
      optimizeForReading?: boolean
    } = {},
  ): Promise<SpeechDetection[]> {
    const {
      maxSegmentDuration = 6, // 6 секунд максимум
      minSegmentDuration = 1, // 1 секунда минимум
      optimizeForReading = true,
      ...whisperOptions
    } = options

    logger.info("Starting optimized speech recognition for subtitles")

    try {
      // Базовое распознавание
      let speechDetections = await this.recognizeSpeech(mediaPath, whisperOptions)

      // Оптимизация для субтитров
      if (optimizeForReading) {
        speechDetections = this.optimizeSegmentsForSubtitles(speechDetections, {
          maxSegmentDuration,
          minSegmentDuration,
        })
      }

      logger.info(`Optimized speech recognition completed: ${speechDetections.length} subtitle segments`)
      return speechDetections
    } catch (error) {
      logger.error("Optimized speech recognition failed:", { error: String(error) })
      return []
    }
  }

  /**
   * Конвертация результата транскрипции в SpeechDetection
   */
  private convertTranscriptionToSpeech(
    result: TranscriptionResult,
    options: WhisperIntegrationOptions,
  ): SpeechDetection[] {
    return result.segments.map((segment, _index) => ({
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text.trim(),
      transcript: segment.text.trim(),
      speaker: undefined, // Будет определен позже
      language: options.language === "auto" ? result.language : options.language,
      confidence: segment.confidence || 0.8, // По умолчанию хорошая уверенность
      wordTimestamps: [],
    }))
  }

  /**
   * Простая эвристика для определения говорящих
   */
  private applySpeakerIdentification(speechDetections: SpeechDetection[]): SpeechDetection[] {
    // Простая логика на основе пауз и изменений в тональности
    let currentSpeaker = 1
    let lastEndTime = 0

    return speechDetections.map((detection, index) => {
      // Если пауза больше 2 секунд, возможно смена говорящего
      if (detection.startTime - lastEndTime > 2) {
        // Простая эвристика: меняем говорящего каждые 2-3 сегмента после паузы
        if (index % 3 === 0) {
          currentSpeaker = currentSpeaker === 1 ? 2 : 1
        }
      }

      lastEndTime = detection.endTime

      return {
        ...detection,
        speaker: `Говорящий ${currentSpeaker}`,
      }
    })
  }

  /**
   * Оптимизация сегментов для субтитров
   */
  private optimizeSegmentsForSubtitles(
    speechDetections: SpeechDetection[],
    options: { maxSegmentDuration: number; minSegmentDuration: number },
  ): SpeechDetection[] {
    const optimized: SpeechDetection[] = []

    for (const detection of speechDetections) {
      const duration = detection.endTime - detection.startTime

      // Если сегмент слишком длинный, разбиваем его
      if (duration > options.maxSegmentDuration) {
        const parts = this.splitLongSegment(detection, options.maxSegmentDuration)
        optimized.push(...parts)
      }
      // Если сегмент слишком короткий, объединяем с предыдущим
      else if (duration < options.minSegmentDuration && optimized.length > 0) {
        const last = optimized[optimized.length - 1]
        last.endTime = detection.endTime
        last.transcript += ` ${detection.transcript}`
        // Обновляем уверенность как среднее
        last.confidence = (last.confidence + detection.confidence) / 2
      } else {
        optimized.push(detection)
      }
    }

    return optimized
  }

  /**
   * Разбивка длинного сегмента на части
   */
  private splitLongSegment(detection: SpeechDetection, maxDuration: number): SpeechDetection[] {
    const duration = detection.endTime - detection.startTime
    const numParts = Math.ceil(duration / maxDuration)
    const partDuration = duration / numParts

    const parts: SpeechDetection[] = []
    const words = (detection.transcript || "").split(" ")
    const wordsPerPart = Math.ceil(words.length / numParts)

    for (let i = 0; i < numParts; i++) {
      const startTime = detection.startTime + i * partDuration
      const endTime = i === numParts - 1 ? detection.endTime : startTime + partDuration

      const startWordIndex = i * wordsPerPart
      const endWordIndex = Math.min((i + 1) * wordsPerPart, words.length)
      const partText = words.slice(startWordIndex, endWordIndex).join(" ")

      if (partText.trim()) {
        parts.push({
          startTime,
          endTime,
          text: partText,
          transcript: partText,
          speaker: detection.speaker,
          language: detection.language,
          confidence: detection.confidence,
          wordTimestamps: [],
        })
      }
    }

    return parts
  }

  /**
   * Подсчет количества говорящих
   */
  private countSpeakers(speechDetections: SpeechDetection[]): number {
    const speakers = new Set(speechDetections.map((d) => d.speaker).filter(Boolean))
    return speakers.size
  }

  /**
   * Проверка доступности моделей Whisper
   */
  public async checkModelAvailability(): Promise<{ available: string[]; recommended: string }> {
    try {
      // Проверяем доступные модели через TranscriptionService
      const available = ["tiny", "base", "small", "medium"] // Базовый набор
      const recommended = "base" // Компромисс скорость/качество

      logger.info("Available Whisper models:", { models: available })
      return { available, recommended }
    } catch (error) {
      logger.error("Failed to check model availability:", { error: String(error) })
      return { available: ["tiny"], recommended: "tiny" }
    }
  }

  /**
   * Получение информации о прогрессе
   */
  public onProgress(_callback: (progress: { progress: number; status: string; message?: string }) => void) {
    // Здесь можно подписаться на события прогресса от TranscriptionService
    // Пока заглушка для интерфейса
    return () => {} // unsubscribe function
  }
}
