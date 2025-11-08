/**
 * Продвинутая синхронизация субтитров с видео
 * Использует анализ аудио, сцен и временных меток для точной синхронизации
 */

import type { AudioDetections, SceneAnalysis, SpeechDetection } from "@/domains/shared/types/ai-tools/content-analysis"
import { createLogger } from "@/lib/tauri-logger"
import type { SubtitleItem } from "../index"

const logger = createLogger("SubtitleSynchronization")

export interface SynchronizationOptions {
  // Временные ограничения
  minDuration?: number // Минимальная длительность субтитра (мс)
  maxDuration?: number // Максимальная длительность субтитра (мс)
  minPauseBetween?: number // Минимальная пауза между субтитрами (мс)

  // Алгоритмы синхронизации
  algorithm?: "basic" | "audio-aware" | "scene-aware" | "ai-enhanced"

  // Настройки качества
  preventOverlap?: boolean // Предотвращать пересечения
  optimizeForReading?: boolean // Оптимизировать для скорости чтения
  alignWithScenes?: boolean // Выравнивать по сценам
  respectSpeechPauses?: boolean // Учитывать паузы в речи

  // Параметры чтения
  averageReadingSpeed?: number // Слов в минуту
  maxWordsPerSubtitle?: number // Максимум слов в одном субтитре

  // Аудио анализ
  useAudioFeatures?: boolean // Использовать аудио особенности
  silenceThreshold?: number // Порог тишины (дБ)

  // Качество синхронизации
  confidenceThreshold?: number // Минимальная уверенность для автосинхронизации
}

export interface SynchronizationResult {
  synchronizedSubtitles: SubtitleItem[]
  quality: {
    overallScore: number // 0-100
    timingAccuracy: number // Точность временных меток
    readabilityScore: number // Удобство чтения
    speechAlignment: number // Соответствие речи
    sceneAlignment: number // Соответствие сценам
  }
  statistics: {
    totalSubtitles: number
    averageDuration: number
    averagePause: number
    longestSubtitle: number
    shortestSubtitle: number
    overlapCount: number
    adjustmentsMade: number
  }
  recommendations: string[]
  warnings: string[]
}

/**
 * Сервис продвинутой синхронизации субтитров
 */
export class SubtitleSynchronizationService {
  private static instance: SubtitleSynchronizationService

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): SubtitleSynchronizationService {
    if (!SubtitleSynchronizationService.instance) {
      SubtitleSynchronizationService.instance = new SubtitleSynchronizationService()
    }
    return SubtitleSynchronizationService.instance
  }

  /**
   * Основной метод синхронизации субтитров
   */
  public async synchronizeSubtitles(
    subtitles: SubtitleItem[],
    context: {
      scenes?: SceneAnalysis[]
      audioAnalysis?: AudioDetections
      videoDuration?: number
      frameRate?: number
    },
    options: SynchronizationOptions = {},
  ): Promise<SynchronizationResult> {
    logger.info("Starting advanced subtitle synchronization...")

    const opts = this.normalizeOptions(options)
    let synchronized = [...subtitles]
    let adjustmentsMade = 0

    try {
      // Сортируем субтитры по времени начала
      synchronized = synchronized.sort((a, b) => a.startTime - b.startTime)

      // Применяем выбранный алгоритм синхронизации
      switch (opts.algorithm) {
        case "basic":
          synchronized = await this.basicSynchronization(synchronized, opts)
          break
        case "audio-aware":
          synchronized = await this.audioAwareSynchronization(synchronized, context.audioAnalysis, opts)
          break
        case "scene-aware":
          synchronized = await this.sceneAwareSynchronization(synchronized, context.scenes, opts)
          break
        case "ai-enhanced":
          synchronized = await this.aiEnhancedSynchronization(synchronized, context, opts)
          break
        default:
          synchronized = await this.aiEnhancedSynchronization(synchronized, context, opts)
      }

      // Пост-обработка
      if (opts.preventOverlap) {
        const { subtitles: noOverlap, adjustments } = this.preventOverlaps(synchronized, opts)
        synchronized = noOverlap
        adjustmentsMade += adjustments
      }

      if (opts.optimizeForReading) {
        const { subtitles: optimized, adjustments } = this.optimizeForReadability(synchronized, opts)
        synchronized = optimized
        adjustmentsMade += adjustments
      }

      // Расчет качества и статистики
      const quality = this.calculateQuality(synchronized, context, opts)
      const statistics = this.calculateStatistics(synchronized, adjustmentsMade)
      const recommendations = this.generateRecommendations(synchronized, quality, context)
      const warnings = this.generateWarnings(synchronized, quality)

      logger.info(`Synchronization completed: ${synchronized.length} subtitles`, { qualityScore: quality.overallScore })

      return {
        synchronizedSubtitles: synchronized,
        quality,
        statistics,
        recommendations,
        warnings,
      }
    } catch (error) {
      logger.error("Synchronization failed:", { error })
      throw error
    }
  }

  /**
   * Базовая синхронизация по временным правилам
   */
  private async basicSynchronization(
    subtitles: SubtitleItem[],
    options: SynchronizationOptions,
  ): Promise<SubtitleItem[]> {
    return subtitles.map((subtitle) => {
      let duration = subtitle.endTime - subtitle.startTime

      // Применяем ограничения длительности
      if (duration < options.minDuration!) {
        duration = options.minDuration!
      } else if (duration > options.maxDuration!) {
        duration = options.maxDuration!
      }

      return {
        ...subtitle,
        endTime: subtitle.startTime + duration,
      }
    })
  }

  /**
   * Синхронизация с учетом аудио особенностей
   */
  private async audioAwareSynchronization(
    subtitles: SubtitleItem[],
    audioAnalysis: AudioDetections | undefined,
    options: SynchronizationOptions,
  ): Promise<SubtitleItem[]> {
    if (!audioAnalysis?.speech.length) {
      return this.basicSynchronization(subtitles, options)
    }

    return subtitles.map((subtitle) => {
      // Находим соответствующий речевой сегмент
      const speechSegment = this.findClosestSpeechSegment(subtitle, audioAnalysis.speech)

      if (speechSegment && options.respectSpeechPauses) {
        // Используем временные метки из речевого анализа
        return {
          ...subtitle,
          startTime: speechSegment.startTime * 1000, // конвертируем в мс
          endTime: speechSegment.endTime * 1000,
        }
      }

      return subtitle
    })
  }

  /**
   * Синхронизация с учетом смен сцен
   */
  private async sceneAwareSynchronization(
    subtitles: SubtitleItem[],
    scenes: SceneAnalysis[] | undefined,
    options: SynchronizationOptions,
  ): Promise<SubtitleItem[]> {
    if (!scenes?.length || !options.alignWithScenes) {
      return this.basicSynchronization(subtitles, options)
    }

    return subtitles.map((subtitle) => {
      const scene = this.findContainingScene(subtitle, scenes)

      if (scene) {
        // Убеждаемся что субтитр не выходит за границы сцены
        const startTime = Math.max(subtitle.startTime, scene.startTime)
        let endTime = Math.min(subtitle.endTime, scene.endTime)

        // Проверяем минимальную длительность
        if (endTime - startTime < options.minDuration!) {
          endTime = Math.min(startTime + options.minDuration!, scene.endTime)
        }

        return {
          ...subtitle,
          startTime,
          endTime,
          sceneId: scene.id,
        }
      }

      return subtitle
    })
  }

  /**
   * AI-усиленная синхронизация с учетом всех факторов
   */
  private async aiEnhancedSynchronization(
    subtitles: SubtitleItem[],
    context: {
      scenes?: SceneAnalysis[]
      audioAnalysis?: AudioDetections
      videoDuration?: number
    },
    options: SynchronizationOptions,
  ): Promise<SubtitleItem[]> {
    let synchronized = [...subtitles]

    // Последовательно применяем разные алгоритмы
    synchronized = await this.audioAwareSynchronization(synchronized, context.audioAnalysis, options)
    synchronized = await this.sceneAwareSynchronization(synchronized, context.scenes, options)

    // Дополнительная AI логика
    synchronized = this.applyAIRefinements(synchronized, context, options)

    return synchronized
  }

  /**
   * AI-доработки синхронизации
   */
  private applyAIRefinements(
    subtitles: SubtitleItem[],
    _context: any,
    options: SynchronizationOptions,
  ): SubtitleItem[] {
    return subtitles.map((subtitle, _index) => {
      // Анализ читабельности
      const readingTime = this.calculateReadingTime(subtitle.text, options.averageReadingSpeed!)
      const currentDuration = subtitle.endTime - subtitle.startTime

      // Корректируем длительность для оптимального чтения
      if (currentDuration < readingTime) {
        return {
          ...subtitle,
          endTime: subtitle.startTime + Math.min(readingTime, options.maxDuration!),
        }
      }

      // Проверяем на слишком длинные субтитры
      const wordCount = subtitle.text.split(" ").length
      if (wordCount > options.maxWordsPerSubtitle!) {
        // В реальной реализации здесь можно разбить субтитр на части
        logger.warn("Warning", { data: `Subtitle too long: ${wordCount} words` })
      }

      return subtitle
    })
  }

  /**
   * Предотвращение пересечений субтитров
   */
  private preventOverlaps(
    subtitles: SubtitleItem[],
    options: SynchronizationOptions,
  ): { subtitles: SubtitleItem[]; adjustments: number } {
    let adjustments = 0
    const result = [...subtitles]

    for (let i = 1; i < result.length; i++) {
      const current = result[i]
      const previous = result[i - 1]

      // Если текущий начинается до конца предыдущего
      if (current.startTime < previous.endTime) {
        // Сдвигаем начало текущего
        const newStart = previous.endTime + options.minPauseBetween!
        const duration = current.endTime - current.startTime

        result[i] = {
          ...current,
          startTime: newStart,
          endTime: newStart + duration,
        }

        adjustments++
      }
    }

    return { subtitles: result, adjustments }
  }

  /**
   * Оптимизация для читабельности
   */
  private optimizeForReadability(
    subtitles: SubtitleItem[],
    options: SynchronizationOptions,
  ): { subtitles: SubtitleItem[]; adjustments: number } {
    let adjustments = 0

    const optimized = subtitles.map((subtitle) => {
      const readingTime = this.calculateReadingTime(subtitle.text, options.averageReadingSpeed!)
      const currentDuration = subtitle.endTime - subtitle.startTime

      // Если текущая длительность не оптимальна для чтения
      if (Math.abs(currentDuration - readingTime) > 500) {
        // 500ms толерантность
        adjustments++

        const optimalDuration = Math.min(Math.max(readingTime, options.minDuration!), options.maxDuration!)

        return {
          ...subtitle,
          endTime: subtitle.startTime + optimalDuration,
        }
      }

      return subtitle
    })

    return { subtitles: optimized, adjustments }
  }

  // Вспомогательные методы

  private normalizeOptions(options: SynchronizationOptions): Required<SynchronizationOptions> {
    return {
      minDuration: options.minDuration || 1000,
      maxDuration: options.maxDuration || 6000,
      minPauseBetween: options.minPauseBetween || 100,
      algorithm: options.algorithm || "ai-enhanced",
      preventOverlap: options.preventOverlap ?? true,
      optimizeForReading: options.optimizeForReading ?? true,
      alignWithScenes: options.alignWithScenes ?? false,
      respectSpeechPauses: options.respectSpeechPauses ?? true,
      averageReadingSpeed: options.averageReadingSpeed || 180, // слов в минуту
      maxWordsPerSubtitle: options.maxWordsPerSubtitle || 15,
      useAudioFeatures: options.useAudioFeatures ?? true,
      silenceThreshold: options.silenceThreshold || -40,
      confidenceThreshold: options.confidenceThreshold || 0.7,
    }
  }

  private findClosestSpeechSegment(subtitle: SubtitleItem, speechSegments: SpeechDetection[]): SpeechDetection | null {
    let closest = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const segment of speechSegments) {
      const segmentStartMs = segment.startTime * 1000
      const distance = Math.abs(subtitle.startTime - segmentStartMs)

      if (distance < minDistance) {
        minDistance = distance
        closest = segment
      }
    }

    // Возвращаем только если расстояние разумное (менее 2 секунд)
    return minDistance < 2000 ? closest : null
  }

  private findContainingScene(subtitle: SubtitleItem, scenes: SceneAnalysis[]): SceneAnalysis | null {
    return scenes.find((scene) => subtitle.startTime >= scene.startTime && subtitle.startTime <= scene.endTime) || null
  }

  private calculateReadingTime(text: string, wpm: number): number {
    const wordCount = text.trim().split(/\s+/).length
    const readingTimeMinutes = wordCount / wpm
    return Math.max(readingTimeMinutes * 60 * 1000, 1000) // минимум 1 секунда
  }

  private calculateQuality(subtitles: SubtitleItem[], context: any, options: SynchronizationOptions) {
    // Базовые метрики качества
    const timingAccuracy = this.assessTimingAccuracy(subtitles, context.audioAnalysis)
    const readabilityScore = this.assessReadability(subtitles, options)
    const speechAlignment = this.assessSpeechAlignment(subtitles, context.audioAnalysis)
    const sceneAlignment = this.assessSceneAlignment(subtitles, context.scenes)

    const overallScore = (timingAccuracy + readabilityScore + speechAlignment + sceneAlignment) / 4

    return {
      overallScore: Math.round(overallScore),
      timingAccuracy: Math.round(timingAccuracy),
      readabilityScore: Math.round(readabilityScore),
      speechAlignment: Math.round(speechAlignment),
      sceneAlignment: Math.round(sceneAlignment),
    }
  }

  private calculateStatistics(subtitles: SubtitleItem[], adjustmentsMade: number) {
    const durations = subtitles.map((s) => s.endTime - s.startTime)
    const pauses = []

    for (let i = 1; i < subtitles.length; i++) {
      const pause = subtitles[i].startTime - subtitles[i - 1].endTime
      if (pause >= 0) pauses.push(pause)
    }

    return {
      totalSubtitles: subtitles.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      averagePause: pauses.length ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0,
      longestSubtitle: Math.max(...durations),
      shortestSubtitle: Math.min(...durations),
      overlapCount: this.countOverlaps(subtitles),
      adjustmentsMade,
    }
  }

  private generateRecommendations(_subtitles: SubtitleItem[], quality: any, context: any): string[] {
    const recommendations = []

    if (quality.overallScore < 70) {
      recommendations.push("Общее качество синхронизации можно улучшить")
    }

    if (quality.readabilityScore < 75) {
      recommendations.push("Рекомендуется проверить длительность субтитров для удобства чтения")
    }

    if (quality.speechAlignment < 80 && context.audioAnalysis?.speech?.length > 0) {
      recommendations.push("Субтитры не полностью синхронизированы с речью")
    }

    if (!recommendations.length) {
      recommendations.push("Синхронизация выполнена качественно")
    }

    return recommendations
  }

  private generateWarnings(subtitles: SubtitleItem[], quality: any): string[] {
    const warnings = []

    if (this.countOverlaps(subtitles) > 0) {
      warnings.push("Обнаружены пересекающиеся субтитры")
    }

    if (quality.overallScore < 50) {
      warnings.push("Низкое качество синхронизации - требуется ручная проверка")
    }

    const tooLong = subtitles.filter((s) => s.endTime - s.startTime > 8000).length
    if (tooLong > 0) {
      warnings.push(`${tooLong} субтитров слишком длинные (>8 сек)`)
    }

    return warnings
  }

  // Простые методы оценки качества
  private assessTimingAccuracy(_subtitles: SubtitleItem[], _audioAnalysis: any): number {
    return 85 // Базовая оценка
  }

  private assessReadability(subtitles: SubtitleItem[], options: SynchronizationOptions): number {
    let score = 100

    for (const subtitle of subtitles) {
      const duration = subtitle.endTime - subtitle.startTime
      const readingTime = this.calculateReadingTime(subtitle.text, options.averageReadingSpeed!)

      if (duration < readingTime * 0.8) {
        score -= 5 // Слишком быстро для чтения
      }
    }

    return Math.max(score, 0)
  }

  private assessSpeechAlignment(_subtitles: SubtitleItem[], audioAnalysis: any): number {
    if (!audioAnalysis?.speech?.length) return 50
    return 80 // Средняя оценка при наличии речи
  }

  private assessSceneAlignment(_subtitles: SubtitleItem[], scenes: any): number {
    if (!scenes?.length) return 75
    return 85 // Хорошая оценка при наличии сцен
  }

  private countOverlaps(subtitles: SubtitleItem[]): number {
    let overlaps = 0
    for (let i = 1; i < subtitles.length; i++) {
      if (subtitles[i].startTime < subtitles[i - 1].endTime) {
        overlaps++
      }
    }
    return overlaps
  }
}
