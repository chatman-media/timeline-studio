/**
 * AI инструмент для применения автоматических улучшений к Timeline с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для применения улучшений
export interface EnhancementsInput {
  enhancementTypes?: ("transitions" | "color-correction" | "audio-balance" | "stabilization")[]
  targetElements?: "all" | "selected" | "section" | "track"
}

export interface EnhancementResult {
  applied: boolean
  modificationsCount: number
  recommendations: string[]
  warnings?: string[]
}

export interface TrackEnhancementResult {
  trackId: string
  trackName: string
  enhancementsApplied: string[]
  modificationsCount: number
}

export interface EnhancementsApplicationResult {
  appliedEnhancements: string[]
  totalModifications: number
  trackResults: TrackEnhancementResult[]
  enhancementDetails: {
    totalTracks: number
    processedElements: number
    videoTracksProcessed: number
    audioTracksProcessed: number
  }
  overallRecommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для применения улучшений Timeline с унифицированной обработкой ошибок
 */
export class EnhancementApplicationTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("EnhancementApplicationTool", logger)
  }

  /**
   * Применяет автоматические улучшения к Timeline
   */
  public async applyTimelineEnhancements(
    input: EnhancementsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<EnhancementsApplicationResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validEnhancements = ["transitions", "color-correction", "audio-balance", "stabilization"]
      if (data.enhancementTypes?.some((type: string) => !validEnhancements.includes(type))) {
        errors.push("Неподдерживаемые типы улучшений")
      }

      const validTargets = ["all", "selected", "section", "track"]
      if (data.targetElements && !validTargets.includes(data.targetElements)) {
        errors.push(`Неподдерживаемый тип целевых элементов: ${data.targetElements}`)
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации параметров применения улучшений",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const enhancementTypes = input.enhancementTypes || ["transitions", "color-correction", "audio-balance"]
    const targetElements = input.targetElements || "all"

    // Выполняем применение улучшений с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем применение автоматических улучшений", {
          enhancementTypes: enhancementTypes.join(", "),
          targetElements,
          enhancementsCount: enhancementTypes.length,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для применения улучшений. Откройте или создайте проект в timeline")
        }

        // Получаем все треки для анализа
        const allTracks = [...currentProject.globalTracks]
        currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

        this.logger?.info("Анализируем структуру проекта для улучшений", {
          totalTracks: allTracks.length,
          videoTracks: allTracks.filter((t) => t.type === "video").length,
          audioTracks: allTracks.filter((t) => t.type === "audio").length,
        })

        const appliedEnhancements: string[] = []
        const trackResults: TrackEnhancementResult[] = []
        const warnings: string[] = []
        let totalModifications = 0

        // Применяем улучшения по типам
        for (const enhancementType of enhancementTypes) {
          this.logger?.info(`Применяем улучшение: ${enhancementType}`)

          const enhancementResult = await this.applyEnhancementType(
            enhancementType,
            allTracks,
            targetElements,
            currentProject,
          )

          if (enhancementResult.applied) {
            appliedEnhancements.push(enhancementType)
            totalModifications += enhancementResult.modificationsCount

            if (enhancementResult.warnings && enhancementResult.warnings.length > 0) {
              warnings.push(...enhancementResult.warnings)
            }

            // Записываем результаты по трекам
            const affectedTracks = this.getAffectedTracks(allTracks, enhancementType, targetElements)
            affectedTracks.forEach((track) => {
              const existingResult = trackResults.find((r) => r.trackId === track.id)
              if (existingResult) {
                existingResult.enhancementsApplied.push(enhancementType)
                existingResult.modificationsCount += enhancementResult.modificationsCount
              } else {
                trackResults.push({
                  trackId: track.id,
                  trackName: track.name || track.id,
                  enhancementsApplied: [enhancementType],
                  modificationsCount: enhancementResult.modificationsCount,
                })
              }
            })
          }
        }

        // Генерируем общие рекомендации
        const overallRecommendations = this.generateEnhancementRecommendations(
          appliedEnhancements,
          currentProject,
          allTracks,
        )

        const result: EnhancementsApplicationResult = {
          appliedEnhancements,
          totalModifications,
          trackResults,
          enhancementDetails: {
            totalTracks: allTracks.length,
            processedElements: this.getProcessedElementsCount(allTracks, targetElements),
            videoTracksProcessed: allTracks.filter(
              (t) => t.type === "video" && this.shouldProcessTrack(t, targetElements),
            ).length,
            audioTracksProcessed: allTracks.filter(
              (t) => t.type === "audio" && this.shouldProcessTrack(t, targetElements),
            ).length,
          },
          overallRecommendations,
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Применение улучшений завершено", {
          appliedCount: appliedEnhancements.length,
          totalModifications,
          warningsCount: warnings.length,
          tracksProcessed: trackResults.length,
        })

        return result
      },
      {
        timeout: options.timeout || 120000, // 2 минуты для применения улучшений
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          enhancementTypes: enhancementTypes.join(","),
          targetElements,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Применяет конкретный тип улучшения
   */
  private async applyEnhancementType(
    enhancementType: string,
    allTracks: any[],
    targetElements: string,
    _project: TimelineProject,
  ): Promise<EnhancementResult> {
    switch (enhancementType) {
      case "transitions":
        return await this.applyTransitionEnhancements(allTracks, targetElements)

      case "color-correction":
        return await this.applyColorCorrectionEnhancements(allTracks, targetElements)

      case "audio-balance":
        return await this.applyAudioBalanceEnhancements(allTracks, targetElements)

      case "stabilization":
        return await this.applyStabilizationEnhancements(allTracks, targetElements)

      default:
        return {
          applied: false,
          modificationsCount: 0,
          recommendations: [`Неизвестный тип улучшения: ${enhancementType}`],
          warnings: [`Пропущен неподдерживаемый тип улучшения: ${enhancementType}`],
        }
    }
  }

  /**
   * Применяет улучшения переходов
   */
  private async applyTransitionEnhancements(allTracks: any[], targetElements: string): Promise<EnhancementResult> {
    const recommendations: string[] = []
    const warnings: string[] = []
    let modificationsCount = 0

    const videoTracks = allTracks.filter((track) => track.type === "video")

    if (videoTracks.length === 0) {
      return {
        applied: false,
        modificationsCount: 0,
        recommendations: [],
        warnings: ["Нет видео треков для применения переходов"],
      }
    }

    // Добавляем базовые переходы между клипами
    for (const track of videoTracks) {
      if (this.shouldProcessTrack(track, targetElements)) {
        const transitionResult = this.addBasicTransitionsToTrack(track)
        modificationsCount += transitionResult.addedTransitions

        if (transitionResult.addedTransitions > 0) {
          recommendations.push(
            `Добавлено ${transitionResult.addedTransitions} переходов на трек "${track.name || track.id}"`,
          )
        }
      }
    }

    return {
      applied: modificationsCount > 0,
      modificationsCount,
      recommendations,
      warnings,
    }
  }

  /**
   * Применяет улучшения цветокоррекции
   */
  private async applyColorCorrectionEnhancements(allTracks: any[], targetElements: string): Promise<EnhancementResult> {
    const recommendations: string[] = []
    const warnings: string[] = []
    let modificationsCount = 0

    const videoTracks = allTracks.filter((track) => track.type === "video")

    if (videoTracks.length === 0) {
      return {
        applied: false,
        modificationsCount: 0,
        recommendations: [],
        warnings: ["Нет видео треков для цветокоррекции"],
      }
    }

    // Применяем базовую цветокоррекцию
    for (const track of videoTracks) {
      if (this.shouldProcessTrack(track, targetElements)) {
        for (const clip of track.clips) {
          if (clip.mediaFile?.type === "video") {
            const colorResult = this.applyBasicColorCorrection(clip)
            if (colorResult.applied) {
              modificationsCount++
            }
          }
        }
      }
    }

    if (modificationsCount > 0) {
      recommendations.push(`Применена базовая цветокоррекция к ${modificationsCount} клипам`)
      recommendations.push("Проверьте результаты и настройте параметры при необходимости")
    }

    return {
      applied: modificationsCount > 0,
      modificationsCount,
      recommendations,
      warnings,
    }
  }

  /**
   * Применяет улучшения аудио баланса
   */
  private async applyAudioBalanceEnhancements(allTracks: any[], targetElements: string): Promise<EnhancementResult> {
    const recommendations: string[] = []
    const warnings: string[] = []
    let modificationsCount = 0

    const audioTracks = allTracks.filter((track) => track.type === "audio")

    if (audioTracks.length === 0) {
      return {
        applied: false,
        modificationsCount: 0,
        recommendations: [],
        warnings: ["Нет аудио треков для балансировки"],
      }
    }

    // Применяем нормализацию аудио
    for (const track of audioTracks) {
      if (this.shouldProcessTrack(track, targetElements)) {
        const audioResult = this.applyAudioNormalization(track)
        modificationsCount += audioResult.normalizedClips

        if (audioResult.normalizedClips > 0) {
          recommendations.push(
            `Нормализовано ${audioResult.normalizedClips} аудио клипов на треке "${track.name || track.id}"`,
          )
        }
      }
    }

    return {
      applied: modificationsCount > 0,
      modificationsCount,
      recommendations,
      warnings,
    }
  }

  /**
   * Применяет улучшения стабилизации
   */
  private async applyStabilizationEnhancements(allTracks: any[], targetElements: string): Promise<EnhancementResult> {
    const recommendations: string[] = []
    const warnings: string[] = []
    let modificationsCount = 0

    const videoTracks = allTracks.filter((track) => track.type === "video")

    if (videoTracks.length === 0) {
      return {
        applied: false,
        modificationsCount: 0,
        recommendations: [],
        warnings: ["Нет видео треков для стабилизации"],
      }
    }

    // Применяем базовую стабилизацию
    for (const track of videoTracks) {
      if (this.shouldProcessTrack(track, targetElements)) {
        for (const clip of track.clips) {
          if (clip.mediaFile?.type === "video") {
            const stabilizationResult = this.applyBasicStabilization(clip)
            if (stabilizationResult.applied) {
              modificationsCount++
            }
          }
        }
      }
    }

    if (modificationsCount > 0) {
      recommendations.push(`Применена стабилизация к ${modificationsCount} видео клипам`)
      recommendations.push("Стабилизация может изменить кадрирование видео")
    }

    return {
      applied: modificationsCount > 0,
      modificationsCount,
      recommendations,
      warnings,
    }
  }

  // Вспомогательные методы

  /**
   * Проверяет, должен ли трек быть обработан
   */
  private shouldProcessTrack(track: any, targetElements: string): boolean {
    switch (targetElements) {
      case "all":
        return true
      case "selected":
        return track.selected === true
      case "section":
        return track.sectionId !== undefined
      case "track":
        return true
      default:
        return true
    }
  }

  /**
   * Добавляет базовые переходы к треку
   */
  private addBasicTransitionsToTrack(track: any): { addedTransitions: number } {
    let addedTransitions = 0

    for (let i = 1; i < track.clips.length; i++) {
      const currentClip = track.clips[i]

      // Проверяем, нет ли уже перехода
      if (!currentClip.transitions || currentClip.transitions.length === 0) {
        // Добавляем простой переход
        currentClip.transitions = currentClip.transitions || []
        currentClip.transitions.push({
          id: `transition_${currentClip.id}_${Date.now()}`,
          type: "fade",
          duration: 0.5,
          startTime: currentClip.startTime - 0.25,
          endTime: currentClip.startTime + 0.25,
        })
        addedTransitions++
      }
    }

    return { addedTransitions }
  }

  /**
   * Применяет базовую цветокоррекцию к клипу
   */
  private applyBasicColorCorrection(clip: any): { applied: boolean } {
    // Добавляем базовые эффекты цветокоррекции
    if (!clip.effects) {
      clip.effects = []
    }

    // Проверяем, нет ли уже цветокоррекции
    const hasColorCorrection = clip.effects.some(
      (effect: any) => effect.type === "color-correction" || effect.type === "color-balance",
    )

    if (!hasColorCorrection) {
      clip.effects.push({
        id: `color_correction_${clip.id}_${Date.now()}`,
        type: "color-correction",
        parameters: {
          brightness: 0,
          contrast: 0.1,
          saturation: 0.05,
          temperature: 0,
        },
        enabled: true,
      })
      return { applied: true }
    }

    return { applied: false }
  }

  /**
   * Применяет нормализацию аудио к треку
   */
  private applyAudioNormalization(track: any): { normalizedClips: number } {
    let normalizedClips = 0

    for (const clip of track.clips) {
      if (clip.mediaFile?.type === "audio") {
        // Добавляем нормализацию аудио
        if (!clip.effects) {
          clip.effects = []
        }

        const hasNormalization = clip.effects.some(
          (effect: any) => effect.type === "audio-normalize" || effect.type === "volume",
        )

        if (!hasNormalization) {
          clip.effects.push({
            id: `audio_normalize_${clip.id}_${Date.now()}`,
            type: "audio-normalize",
            parameters: {
              targetLevel: -23, // LUFS стандарт
              limitPeak: -3,
            },
            enabled: true,
          })
          normalizedClips++
        }
      }
    }

    return { normalizedClips }
  }

  /**
   * Применяет базовую стабилизацию к клипу
   */
  private applyBasicStabilization(clip: any): { applied: boolean } {
    // Добавляем базовую стабилизацию
    if (!clip.effects) {
      clip.effects = []
    }

    const hasStabilization = clip.effects.some(
      (effect: any) => effect.type === "stabilization" || effect.type === "image-stabilizer",
    )

    if (!hasStabilization) {
      clip.effects.push({
        id: `stabilization_${clip.id}_${Date.now()}`,
        type: "stabilization",
        parameters: {
          strength: 0.5,
          smoothing: 0.3,
          cropMode: "auto",
        },
        enabled: true,
      })
      return { applied: true }
    }

    return { applied: false }
  }

  /**
   * Возвращает затронутые треки для типа улучшения
   */
  private getAffectedTracks(allTracks: any[], enhancementType: string, targetElements: string): any[] {
    const filteredTracks = allTracks.filter((track) => this.shouldProcessTrack(track, targetElements))

    switch (enhancementType) {
      case "transitions":
      case "color-correction":
      case "stabilization":
        return filteredTracks.filter((track) => track.type === "video")
      case "audio-balance":
        return filteredTracks.filter((track) => track.type === "audio")
      default:
        return filteredTracks
    }
  }

  /**
   * Подсчитывает количество обработанных элементов
   */
  private getProcessedElementsCount(allTracks: any[], targetElements: string): number {
    switch (targetElements) {
      case "all":
        return allTracks.reduce((sum, track) => sum + (track.clips?.length || 0), 0)
      case "selected":
        return allTracks
          .filter((track) => track.selected === true)
          .reduce((sum, track) => sum + (track.clips?.length || 0), 0)
      case "section":
        return allTracks
          .filter((track) => track.sectionId !== undefined)
          .reduce((sum, track) => sum + (track.clips?.length || 0), 0)
      case "track":
        return allTracks.reduce((sum, track) => sum + (track.clips?.length || 0), 0)
      default:
        return 0
    }
  }

  /**
   * Генерирует общие рекомендации по улучшениям
   */
  private generateEnhancementRecommendations(
    appliedEnhancements: string[],
    _project: TimelineProject,
    allTracks: any[],
  ): string[] {
    const recommendations: string[] = []

    // Рекомендации на основе примененных улучшений
    if (appliedEnhancements.includes("transitions")) {
      recommendations.push("Переходы добавлены - просмотрите результат и настройте длительность при необходимости")
    }

    if (appliedEnhancements.includes("color-correction")) {
      recommendations.push("Цветокоррекция применена - проверьте настройки для каждого клипа")
    }

    if (appliedEnhancements.includes("audio-balance")) {
      recommendations.push("Аудио нормализация применена - проверьте уровни громкости")
    }

    if (appliedEnhancements.includes("stabilization")) {
      recommendations.push("Стабилизация применена - проверьте кадрирование видео")
    }

    // Общие рекомендации
    const videoTracks = allTracks.filter((track) => track.type === "video")
    const audioTracks = allTracks.filter((track) => track.type === "audio")

    if (videoTracks.length > 0 && audioTracks.length === 0) {
      recommendations.push("Рассмотрите добавление аудио треков для полноценного проекта")
    }

    if (appliedEnhancements.length > 0) {
      recommendations.push("Сохраните проект после применения улучшений")
      recommendations.push("Создайте резервную копию проекта перед экспортом")
    }

    if (appliedEnhancements.length === 0) {
      recommendations.push("Проект уже оптимизирован или требует ручной настройки")
    }

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const enhancementApplicationTool = new EnhancementApplicationTool()

// Функция-обертка для обратной совместимости
export async function applyAutomaticEnhancements(params: any): Promise<AIToolResult<EnhancementsApplicationResult>> {
  const input: EnhancementsInput = {
    enhancementTypes: params.enhancementTypes,
    targetElements: params.targetElements,
  }

  return enhancementApplicationTool.applyTimelineEnhancements(input)
}
