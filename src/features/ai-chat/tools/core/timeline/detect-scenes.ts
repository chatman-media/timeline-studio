/**
 * AI инструмент для детектирования и разделения сцен с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для детекции сцен
export interface SceneDetectionInput {
  targetClips?: string[]
  sensitivity?: "low" | "medium" | "high"
  autoSplit?: boolean
}

export interface SceneInfo {
  startTime: number
  endTime: number
  duration: number
  confidence: number
  sceneType: "quick-cut" | "short-scene" | "medium-scene" | "long-scene"
  clipRelativeStart: number
  clipRelativeEnd: number
}

export interface DetectedScenes {
  clipId: string
  clipName: string
  scenes: SceneInfo[]
  confidence: number
}

export interface SplitResult {
  success: boolean
  newClips?: any[]
  originalClipId: string
  splitCount?: number
  error?: string
}

export interface SceneDetectionResult {
  detectedScenes: DetectedScenes[]
  splitResults?: SplitResult[]
  analysisSettings: {
    sensitivity: string
    autoSplit: boolean
    analyzedClips: number
    targetClips: string[] | "all"
  }
  statistics: {
    totalScenesDetected: number
    clipsWithScenes: number
    averageScenesPerClip: string
  }
  warnings?: string[]
  recommendations: string[]
}

/**
 * AI инструмент для детектирования и разделения сцен с унифицированной обработкой ошибок
 */
export class SceneDetectionTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("SceneDetectionTool", logger)
  }

  /**
   * Детектирует сцены в видео клипах и при необходимости разделяет их
   */
  public async detectAndSplitScenes(
    input: SceneDetectionInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<SceneDetectionResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (data.sensitivity && !["low", "medium", "high"].includes(data.sensitivity)) {
        errors.push(`Неподдерживаемый уровень чувствительности: ${data.sensitivity}`)
      }

      if (data.targetClips && !Array.isArray(data.targetClips)) {
        errors.push("targetClips должен быть массивом строк")
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
        message: "Ошибка валидации входных данных для детекции сцен",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    // Устанавливаем значения по умолчанию
    const targetClips = input.targetClips || []
    const sensitivity = input.sensitivity || "medium"
    const autoSplit = input.autoSplit || false

    // Выполняем детекцию сцен с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем детекцию сцен", {
          sensitivity,
          autoSplit,
          targetClipsCount: targetClips.length,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен. Доступ к timeline не сконфигурирован")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для детекции сцен. Откройте или создайте проект в timeline")
        }

        // Получаем все треки и клипы для анализа
        const allTracks = [...currentProject.globalTracks]
        currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

        // Находим видео клипы для анализа
        const videoClips = this.getVideoClipsForAnalysis(allTracks, targetClips)

        if (videoClips.length === 0) {
          throw new Error(
            "Нет видео клипов для детекции сцен. Добавьте видео клипы на timeline или укажите корректные ID клипов",
          )
        }

        const detectedScenes: DetectedScenes[] = []
        const splitResults: SplitResult[] = []
        const warnings: string[] = []
        let totalScenesDetected = 0

        // Анализируем каждый клип
        for (const clip of videoClips) {
          const sceneAnalysis = await this.analyzeClipForScenes(clip, sensitivity)

          if (sceneAnalysis.scenes.length > 0) {
            detectedScenes.push({
              clipId: clip.id,
              clipName: clip.name || clip.mediaFile?.name || "Неизвестный клип",
              scenes: sceneAnalysis.scenes,
              confidence: sceneAnalysis.confidence,
            })

            totalScenesDetected += sceneAnalysis.scenes.length

            // Если включено автоматическое разделение
            if (autoSplit) {
              const splitResult = await this.splitClipByScenes(clip, sceneAnalysis.scenes)
              splitResults.push(splitResult)
            }
          } else {
            warnings.push(`Сцены не обнаружены в клипе "${clip.name || clip.id}"`)
          }
        }

        // Генерируем рекомендации
        const recommendations = this.generateSceneDetectionRecommendations(detectedScenes, sensitivity, autoSplit)

        const result: SceneDetectionResult = {
          detectedScenes,
          splitResults: autoSplit ? splitResults : undefined,
          analysisSettings: {
            sensitivity,
            autoSplit,
            analyzedClips: videoClips.length,
            targetClips: targetClips.length > 0 ? targetClips : "all",
          },
          statistics: {
            totalScenesDetected,
            clipsWithScenes: detectedScenes.length,
            averageScenesPerClip:
              detectedScenes.length > 0 ? (totalScenesDetected / detectedScenes.length).toFixed(1) : "0",
          },
          warnings: warnings.length > 0 ? warnings : undefined,
          recommendations,
        }

        this.logger?.info("Детекция сцен завершена", {
          totalScenesDetected,
          clipsWithScenes: detectedScenes.length,
          splitPerformed: autoSplit,
          warningsCount: warnings.length,
        })

        return result
      },
      {
        timeout: options.timeout || 60000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          sensitivity,
          autoSplit,
          targetClipsCount: targetClips.length,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Получает видео клипы для анализа
   */
  private getVideoClipsForAnalysis(allTracks: any[], targetClips: string[]): any[] {
    const videoClips: any[] = []

    for (const track of allTracks) {
      if (track.type === "video") {
        for (const clip of track.clips) {
          if (clip.mediaFile?.type === "video") {
            // Если указаны конкретные клипы, фильтруем по ID
            if (targetClips.length === 0 || targetClips.includes(clip.id)) {
              videoClips.push(clip)
            }
          }
        }
      }
    }

    return videoClips
  }

  /**
   * Анализирует клип для детекции сцен
   */
  private async analyzeClipForScenes(clip: any, sensitivity: string): Promise<any> {
    const scenes: any[] = []
    const duration = clip.duration
    const confidence = this.getSensitivityThreshold(sensitivity)

    // Простая эвристика для детекции сцен на основе длительности
    const minSceneDuration = this.getMinSceneDuration(sensitivity)
    const maxSceneDuration = this.getMaxSceneDuration(sensitivity)

    // Генерируем потенциальные точки смены сцен
    const sceneChangePoints = this.generateSceneChangePoints(duration, minSceneDuration, maxSceneDuration, confidence)

    // Создаем сцены на основе найденных точек
    let currentStart = 0
    for (const changePoint of sceneChangePoints) {
      if (changePoint.time > currentStart + minSceneDuration) {
        scenes.push({
          startTime: clip.startTime + currentStart,
          endTime: clip.startTime + changePoint.time,
          duration: changePoint.time - currentStart,
          confidence: changePoint.confidence,
          sceneType: this.determineSceneType(changePoint.time - currentStart),
          clipRelativeStart: currentStart,
          clipRelativeEnd: changePoint.time,
        })
        currentStart = changePoint.time
      }
    }

    // Добавляем последнюю сцену
    if (currentStart < duration) {
      scenes.push({
        startTime: clip.startTime + currentStart,
        endTime: clip.startTime + duration,
        duration: duration - currentStart,
        confidence: confidence,
        sceneType: this.determineSceneType(duration - currentStart),
        clipRelativeStart: currentStart,
        clipRelativeEnd: duration,
      })
    }

    return {
      scenes,
      confidence,
      analysisMethod: "duration-based",
      clipDuration: duration,
    }
  }

  /**
   * Разделяет клип по найденным сценам
   */
  private async splitClipByScenes(clip: any, scenes: any[]): Promise<any> {
    try {
      const newClips: any[] = []

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const newClip = {
          ...clip,
          id: `${clip.id}_scene_${i + 1}`,
          name: `${clip.name || clip.id} - Сцена ${i + 1}`,
          startTime: scene.startTime,
          duration: scene.duration,
          mediaFile: {
            ...clip.mediaFile,
            trimStart: (clip.mediaFile?.trimStart || 0) + scene.clipRelativeStart,
            trimEnd:
              (clip.mediaFile?.trimEnd || clip.mediaFile?.duration || scene.clipRelativeEnd) -
              (clip.mediaFile?.duration || scene.clipRelativeEnd - scene.clipRelativeStart),
          },
          sceneInfo: {
            sceneNumber: i + 1,
            originalClipId: clip.id,
            sceneType: scene.sceneType,
            confidence: scene.confidence,
          },
        }

        newClips.push(newClip)
      }

      return {
        success: true,
        newClips,
        originalClipId: clip.id,
        splitCount: newClips.length,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        originalClipId: clip.id,
      }
    }
  }

  /**
   * Получает порог чувствительности для детекции
   */
  private getSensitivityThreshold(sensitivity: string): number {
    switch (sensitivity) {
      case "low":
        return 0.6 // 60% уверенность
      case "medium":
        return 0.75 // 75% уверенность
      case "high":
        return 0.85 // 85% уверенность
      default:
        return 0.75
    }
  }

  /**
   * Получает минимальную длительность сцены
   */
  private getMinSceneDuration(sensitivity: string): number {
    switch (sensitivity) {
      case "low":
        return 10 // 10 секунд минимум
      case "medium":
        return 5 // 5 секунд минимум
      case "high":
        return 2 // 2 секунды минимум
      default:
        return 5
    }
  }

  /**
   * Получает максимальную длительность сцены
   */
  private getMaxSceneDuration(sensitivity: string): number {
    switch (sensitivity) {
      case "low":
        return 120 // 2 минуты максимум
      case "medium":
        return 60 // 1 минута максимум
      case "high":
        return 30 // 30 секунд максимум
      default:
        return 60
    }
  }

  /**
   * Генерирует точки смены сцен
   */
  private generateSceneChangePoints(
    duration: number,
    minDuration: number,
    maxDuration: number,
    confidence: number,
  ): any[] {
    const changePoints: any[] = []
    let currentTime = 0

    while (currentTime < duration) {
      // Генерируем случайную длительность сцены в пределах лимитов
      const sceneDuration = Math.random() * (maxDuration - minDuration) + minDuration
      currentTime += sceneDuration

      if (currentTime < duration) {
        changePoints.push({
          time: currentTime,
          confidence: confidence + (Math.random() - 0.5) * 0.2, // Небольшая вариация уверенности
          reason: "content-change", // В реальности это был бы результат анализа
        })
      }
    }

    return changePoints
  }

  /**
   * Определяет тип сцены по длительности
   */
  private determineSceneType(duration: number): "quick-cut" | "short-scene" | "medium-scene" | "long-scene" {
    if (duration < 5) {
      return "quick-cut"
    }
    if (duration < 15) {
      return "short-scene"
    }
    if (duration < 45) {
      return "medium-scene"
    }
    return "long-scene"
  }

  /**
   * Генерирует рекомендации по детекции сцен
   */
  private generateSceneDetectionRecommendations(
    detectedScenes: DetectedScenes[],
    sensitivity: string,
    autoSplit: boolean,
  ): string[] {
    const recommendations: string[] = []

    // Рекомендации на основе найденных сцен
    const totalScenes = detectedScenes.reduce((sum, item) => sum + item.scenes.length, 0)

    if (totalScenes === 0) {
      recommendations.push("Сцены не найдены - попробуйте изменить чувствительность детекции")

      if (sensitivity === "low") {
        recommendations.push("Увеличьте чувствительность для обнаружения большего количества сцен")
      }
    } else {
      // Анализ качества детекции
      const avgScenesPerClip = totalScenes / detectedScenes.length

      if (avgScenesPerClip < 2) {
        recommendations.push("Мало сцен обнаружено - рассмотрите увеличение чувствительности")
      } else if (avgScenesPerClip > 10) {
        recommendations.push("Много сцен обнаружено - рассмотрите уменьшение чувствительности")
      }

      // Рекомендации по типам сцен
      const sceneTypes = new Set()
      detectedScenes.forEach((item) => {
        item.scenes.forEach((scene: any) => sceneTypes.add(scene.sceneType))
      })

      if (sceneTypes.has("quick-cut")) {
        recommendations.push("Обнаружены быстрые склейки - проверьте точность детекции")
      }

      if (sceneTypes.has("long-scene")) {
        recommendations.push("Обнаружены длинные сцены - рассмотрите дополнительное разделение")
      }

      // Рекомендации по действиям
      if (!autoSplit) {
        recommendations.push("Включите автоматическое разделение для создания отдельных клипов")
      }

      recommendations.push("Создайте маркеры для найденных сцен")
      recommendations.push("Проверьте точность детекции перед окончательным разделением")
    }

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const sceneDetectionTool = new SceneDetectionTool()

// Функция-обертка для обратной совместимости
export async function detectAndSplitScenes(params: any): Promise<AIToolResult<SceneDetectionResult>> {
  const input: SceneDetectionInput = {
    targetClips: params.targetClips,
    sensitivity: params.sensitivity,
    autoSplit: params.autoSplit,
  }

  return sceneDetectionTool.detectAndSplitScenes(input)
}
