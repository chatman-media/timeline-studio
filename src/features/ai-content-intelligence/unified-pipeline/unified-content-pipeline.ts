/**
 * Unified Content Pipeline - Координатор всех AI движков
 *
 * Объединяет Scene Analysis, Content Classification, Script Generation
 * и Multi-Platform Adaptation в единый pipeline.
 */

// Используем shared типы
import type { MediaFile as MediaInput } from "@/domains/ai-services"

import {
  ContentClassificationEngine,
  type ExtendedContentClassification,
} from "../engines/content-classification/content-classification-engine"
import { type AdvancedSceneAnalysis, SceneAnalysisEngine } from "@/domains/ai-services/services/scene-analysis/scene-analysis-engine"
import { UnifiedContentAnalysis } from "../shared/types/content-analysis"

// Pipeline конфигурация
export interface PipelineConfig {
  // Scene Analysis
  sceneAnalysis: {
    enabled: boolean
    sensitivity: number
    minSceneDuration: number
    classifyTypes: boolean
    enableObjectDetection: boolean
    enablePersonTracking: boolean
  }

  // Content Classification
  contentClassification: {
    enabled: boolean
    includeSubcategories: boolean
    analyzeMood: boolean
    includeTargeting: boolean
    analyzePlatforms: boolean
    includeMarketing: boolean
    analyzeAccessibility: boolean
  }

  // Script Generation
  scriptGeneration: {
    enabled: boolean
    style: "documentary" | "narrative" | "instructional" | "promotional" | "news" | "interview"
    includeShotList: boolean
    narrativeStructure: "chronological" | "flashback" | "parallel" | "circular" | "episodic"
    tone: "professional" | "casual" | "dramatic" | "humorous" | "inspiring" | "educational"
  }

  // Platform Adaptation
  platformAdaptation: {
    enabled: boolean
    targetPlatforms: string[]
    languages: string[]
    includeSeO: boolean
    generateVariants: number
  }

  // General settings
  general: {
    analysisDepth: "quick" | "normal" | "deep"
    parallel: boolean
    maxConcurrent: number
    cacheResults: boolean
    timeout: number
  }
}

// Pipeline статус и прогресс
export interface PipelineProgress {
  id: string
  status: "idle" | "running" | "completed" | "error" | "cancelled"
  currentStage: string
  completedStages: string[]
  totalStages: number
  progress: number // 0-100
  startTime: Date
  endTime?: Date
  error?: string
  results?: UnifiedContentAnalysis[]
}

// Pipeline события
export type PipelineEvent =
  | { type: "started"; pipelineId: string }
  | { type: "stage_completed"; pipelineId: string; stage: string; progress: number }
  | { type: "completed"; pipelineId: string; results: UnifiedContentAnalysis[] }
  | { type: "error"; pipelineId: string; error: string }
  | { type: "cancelled"; pipelineId: string }

// Результат обработки
export interface PipelineResult {
  id: string
  mediaFile: MediaInput
  sceneAnalysis?: AdvancedSceneAnalysis[]
  contentClassification?: ExtendedContentClassification
  generatedScript?: any
  platformVariants?: any[]
  processingTime: number
  warnings: string[]
  recommendations: string[]
}

/**
 * Unified Content Pipeline - главный координатор
 * Использует shared AI services
 */
export class UnifiedContentPipeline {
  private sharedAIService: any = null
  private sceneEngine: SceneAnalysisEngine | null = null
  private classificationEngine: ContentClassificationEngine | null = null
  private pipelines = new Map<string, PipelineProgress>()
  private eventListeners: ((event: PipelineEvent) => void)[] = []

  private defaultConfig: PipelineConfig = {
    sceneAnalysis: {
      enabled: true,
      sensitivity: 0.5,
      minSceneDuration: 2.0,
      classifyTypes: true,
      enableObjectDetection: false,
      enablePersonTracking: false,
    },
    contentClassification: {
      enabled: true,
      includeSubcategories: true,
      analyzeMood: true,
      includeTargeting: true,
      analyzePlatforms: true,
      includeMarketing: true,
      analyzeAccessibility: true,
    },
    scriptGeneration: {
      enabled: false,
      style: "documentary",
      includeShotList: false,
      narrativeStructure: "chronological",
      tone: "professional",
    },
    platformAdaptation: {
      enabled: false,
      targetPlatforms: [],
      languages: [],
      includeSeO: true,
      generateVariants: 1,
    },
    general: {
      analysisDepth: "normal",
      parallel: true,
      maxConcurrent: 3,
      cacheResults: true,
      timeout: 300000, // 5 минут
    },
  }

  /**
   * Инициализация всех сервисов через DI
   */
  private async initializeServices() {
    if (!this.sharedAIService) {
      try {
        // Получаем AI service из DI контейнера
        const { getAIContainer } = await import("@/domains/ai-core")
        const aiContainer = getAIContainer()
        this.sharedAIService = await aiContainer.resolve("UnifiedAIService")

        // Получаем движки через фабрику
        const { getEngineFactory } = await import("../factories/engine-factory")
        const engineFactory = getEngineFactory()

        const engines = await engineFactory.createAllEngines()
        this.sceneEngine = engines.sceneEngine as SceneAnalysisEngine
        this.classificationEngine = engines.classificationEngine as unknown as ContentClassificationEngine
      } catch (error) {
        console.error("Ошибка инициализации сервисов:", error)
        // Fallback к прямому созданию
        this.sceneEngine = new SceneAnalysisEngine()
        this.classificationEngine = new ContentClassificationEngine()
      }
    }
  }

  /**
   * Запуск pipeline для анализа контента
   */
  async processContent(mediaFiles: MediaInput[], config: Partial<PipelineConfig> = {}): Promise<string> {
    // Инициализируем сервисы через DI
    await this.initializeServices()

    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const fullConfig = this.mergeConfig(config)

    // Определяем этапы pipeline
    const stages = this.buildStages(fullConfig)

    // Создаем прогресс pipeline
    const progress: PipelineProgress = {
      id: pipelineId,
      status: "running",
      currentStage: stages[0],
      completedStages: [],
      totalStages: stages.length,
      progress: 0,
      startTime: new Date(),
    }

    this.pipelines.set(pipelineId, progress)
    this.emitEvent({ type: "started", pipelineId })

    // Запускаем обработку асинхронно
    this.processContentAsync(pipelineId, mediaFiles, fullConfig, stages).catch((error: unknown) => {
      this.updatePipelineError(pipelineId, error instanceof Error ? error.message : String(error))
    })

    return pipelineId
  }

  /**
   * Асинхронная обработка контента
   */
  private async processContentAsync(
    pipelineId: string,
    mediaFiles: MediaInput[],
    config: PipelineConfig,
    stages: string[],
  ): Promise<void> {
    const results: PipelineResult[] = []

    try {
      // Обработка файлов параллельно или последовательно
      if (config.general.parallel) {
        const semaphore = new Array(config.general.maxConcurrent).fill(null)
        let fileIndex = 0

        const processNext = async (): Promise<void> => {
          if (fileIndex >= mediaFiles.length) return

          const currentFile = mediaFiles[fileIndex++]
          try {
            const result = await this.processSingleFile(pipelineId, currentFile, config, stages)
            results.push(result)
          } catch (error) {
            console.error(`Ошибка обработки файла ${currentFile.filename}:`, error)
          }

          // Продолжаем обработку следующего файла
          if (fileIndex < mediaFiles.length) {
            await processNext()
          }
        }

        // Запускаем параллельную обработку
        await Promise.all(semaphore.map(() => processNext()))
      } else {
        // Последовательная обработка
        for (const mediaFile of mediaFiles) {
          try {
            const result = await this.processSingleFile(pipelineId, mediaFile, config, stages)
            results.push(result)
          } catch (error) {
            console.error(`Ошибка обработки файла ${mediaFile.filename}:`, error)
          }
        }
      }

      // Завершаем pipeline
      this.updatePipelineCompleted(pipelineId, results)
    } catch (error) {
      this.updatePipelineError(pipelineId, error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Обработка одного файла через все этапы
   */
  private async processSingleFile(
    pipelineId: string,
    mediaFile: MediaInput,
    config: PipelineConfig,
    stages: string[],
  ): Promise<PipelineResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const recommendations: string[] = []

    let sceneAnalysis: AdvancedSceneAnalysis[] | undefined
    let contentClassification: ExtendedContentClassification | undefined
    let generatedScript: Record<string, unknown> | undefined
    let platformVariants: any[] | undefined

    // Этап 1: Scene Analysis
    if (config.sceneAnalysis.enabled && stages.includes("scene_analysis")) {
      try {
        this.updatePipelineStage(pipelineId, "scene_analysis")

        sceneAnalysis = await this.sceneEngine?.analyzeScenes(mediaFile, {
          sensitivity: config.sceneAnalysis.sensitivity,
          minSceneDuration: config.sceneAnalysis.minSceneDuration,
          classifyTypes: config.sceneAnalysis.classifyTypes,
          enableObjectDetection: config.sceneAnalysis.enableObjectDetection,
          enablePersonTracking: config.sceneAnalysis.enablePersonTracking,
        })

        if (sceneAnalysis?.length === 0) {
          warnings.push("Не удалось детектировать сцены в видео")
        }
      } catch (error) {
        warnings.push(`Ошибка анализа сцен: ${String(error)}`)
      }
    }

    // Этап 2: Content Classification
    if (config.contentClassification.enabled && stages.includes("content_classification")) {
      try {
        this.updatePipelineStage(pipelineId, "content_classification")
        if (sceneAnalysis) {
          contentClassification = await this.classificationEngine?.classifyContent(mediaFile, sceneAnalysis, {
            includeSubcategories: config.contentClassification.includeSubcategories,
            analyzeMood: config.contentClassification.analyzeMood,
            includeTargeting: config.contentClassification.includeTargeting,
            analyzePlatforms: config.contentClassification.analyzePlatforms,
            includeMarketing: config.contentClassification.includeMarketing,
            analyzeAccessibility: config.contentClassification.analyzeAccessibility,
          })
        }
      } catch (error) {
        warnings.push(`Ошибка классификации контента: ${String(error)}`)
      }
    }

    // Этап 3: Script Generation
    if (config.scriptGeneration.enabled && stages.includes("script_generation")) {
      try {
        this.updatePipelineStage(pipelineId, "script_generation")

        generatedScript = await this.generateScript(
          mediaFile,
          sceneAnalysis,
          contentClassification,
          config.scriptGeneration,
        )
      } catch (error) {
        warnings.push(`Ошибка генерации сценария: ${String(error)}`)
      }
    }

    // Этап 4: Platform Adaptation
    if (config.platformAdaptation.enabled && stages.includes("platform_adaptation")) {
      try {
        this.updatePipelineStage(pipelineId, "platform_adaptation")

        platformVariants = await this.adaptToPlatforms(
          mediaFile,
          sceneAnalysis,
          contentClassification,
          generatedScript,
          config.platformAdaptation,
        )
      } catch (error) {
        warnings.push(`Ошибка адаптации под платформы: ${String(error)}`)
      }
    }

    // Генерируем рекомендации
    if (contentClassification) {
      recommendations.push(...this.generateRecommendations(contentClassification, sceneAnalysis))
    }

    return {
      id: `result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      mediaFile,
      sceneAnalysis,
      contentClassification,
      generatedScript,
      platformVariants,
      processingTime: Date.now() - startTime,
      warnings,
      recommendations,
    }
  }

  /**
   * Генерация сценария
   */
  private async generateScript(
    mediaFile: MediaInput,
    scenes: AdvancedSceneAnalysis[] | undefined,
    classification: ExtendedContentClassification | undefined,
    config: PipelineConfig["scriptGeneration"],
  ): Promise<any> {
    const prompt = `Создай ${config.style} сценарий для видео:

Файл: ${mediaFile.filename}
${scenes ? `Количество сцен: ${scenes.length}` : ""}
${classification ? `Жанр: ${classification.genre}, Стиль: ${classification.style}` : ""}

Настройки сценария:
- Стиль: ${config.style}
- Структура: ${config.narrativeStructure} 
- Тон: ${config.tone}
- Включить shot list: ${config.includeShotList}

Создай подробный сценарий в JSON формате с полями:
- title: название
- scenes: массив сцен с диалогами и описаниями
- shotList: список кадров (если включено)
- metadata: метаданные`

    const response = await this.sharedAIService.sendRequest("claude-4-sonnet", [{ role: "user", content: prompt }], {
      temperature: 0.4,
    })

    try {
      return JSON.parse(response.content)
    } catch (error) {
      console.warn("Ошибка парсинга сценария:", error)
      return null
    }
  }

  /**
   * Адаптация под платформы
   */
  private async adaptToPlatforms(
    mediaFile: MediaInput,
    _scenes: AdvancedSceneAnalysis[] | undefined,
    classification: ExtendedContentClassification | undefined,
    _script: any,
    config: PipelineConfig["platformAdaptation"],
  ): Promise<any[]> {
    const variants: any[] = []

    for (const platform of config.targetPlatforms) {
      const adaptationPrompt = `Адаптируй контент под платформу ${platform}:

Видео: ${mediaFile.filename}
${classification ? `Классификация: ${JSON.stringify(classification)}` : ""}

Создай оптимизированную версию для ${platform} учитывая:
- Алгоритмы платформы
- Предпочтения аудитории
- Технические требования
- SEO оптимизацию (если включено: ${config.includeSeO})

Количество вариантов: ${config.generateVariants}
Языки: ${config.languages.join(", ") || "оригинальный"}

Формат ответа JSON с адаптацией.`

      try {
        const response = await this.sharedAIService.sendRequest(
          "claude-4-sonnet",
          [{ role: "user", content: adaptationPrompt }],
          { temperature: 0.3 },
        )

        const adaptation = JSON.parse(response.content)
        variants.push({ platform, ...adaptation })
      } catch (error) {
        console.warn(`Ошибка адаптации для ${platform}:`, error)
      }
    }

    return variants
  }

  /**
   * Генерация рекомендаций
   */
  private generateRecommendations(
    classification: ExtendedContentClassification,
    scenes?: AdvancedSceneAnalysis[],
  ): string[] {
    const recommendations: string[] = []

    // Рекомендации на основе качества
    if (classification.technicalQuality === "poor") {
      recommendations.push("Рекомендуется улучшить техническое качество видео")
    }

    // Рекомендации на основе платформ
    const bestPlatforms = Object.entries(classification.platformSuitability)
      .filter(([_, score]) => score.score > 0.7)
      .map(([platform, _]) => platform)

    if (bestPlatforms.length > 0) {
      recommendations.push(`Лучшие платформы для публикации: ${bestPlatforms.join(", ")}`)
    }

    // Рекомендации на основе доступности
    if (classification.accessibilityScore.overallScore < 6) {
      recommendations.push("Рекомендуется улучшить доступность контента")
    }

    // Рекомендации на основе анализа сцен
    if (scenes) {
      const lowQualityScenes = scenes.filter((s) => s.qualityScore < 5)
      if (lowQualityScenes.length > 0) {
        recommendations.push(`Обратите внимание на качество ${lowQualityScenes.length} сцен`)
      }
    }

    return recommendations
  }

  /**
   * Объединение конфигурации
   */
  private mergeConfig(config: Partial<PipelineConfig>): PipelineConfig {
    return {
      sceneAnalysis: { ...this.defaultConfig.sceneAnalysis, ...config.sceneAnalysis },
      contentClassification: { ...this.defaultConfig.contentClassification, ...config.contentClassification },
      scriptGeneration: { ...this.defaultConfig.scriptGeneration, ...config.scriptGeneration },
      platformAdaptation: { ...this.defaultConfig.platformAdaptation, ...config.platformAdaptation },
      general: { ...this.defaultConfig.general, ...config.general },
    }
  }

  /**
   * Построение этапов pipeline
   */
  private buildStages(config: PipelineConfig): string[] {
    const stages: string[] = []

    if (config.sceneAnalysis.enabled) stages.push("scene_analysis")
    if (config.contentClassification.enabled) stages.push("content_classification")
    if (config.scriptGeneration.enabled) stages.push("script_generation")
    if (config.platformAdaptation.enabled) stages.push("platform_adaptation")

    return stages
  }

  /**
   * Обновление статуса pipeline
   */
  private updatePipelineStage(pipelineId: string, stage: string): void {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) return

    pipeline.currentStage = stage
    pipeline.completedStages.push(stage)
    pipeline.progress = (pipeline.completedStages.length / pipeline.totalStages) * 100

    this.emitEvent({
      type: "stage_completed",
      pipelineId,
      stage,
      progress: pipeline.progress,
    })
  }

  private updatePipelineCompleted(pipelineId: string, results: PipelineResult[]): void {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) return

    pipeline.status = "completed"
    pipeline.progress = 100
    pipeline.endTime = new Date()

    // Конвертируем результаты в формат UnifiedContentAnalysis
    const analysisResults: UnifiedContentAnalysis[] = results.map((result) => ({
      id: result.id,
      mediaFile: result.mediaFile,
      scenes: result.sceneAnalysis || [],
      classification: result.contentClassification || {
        genre: "unknown",
        style: "unknown",
        emotion: "neutral",
        audience: "general",
        technicalQuality: "fair",
        contentRating: "G",
        confidence: {},
      },
      script: result.generatedScript,
      platformVariants: result.platformVariants,
      qualityMetrics: {
        technical: {
          videoQuality: 5,
          audioQuality: 5,
          stabilization: 5,
          colorCorrection: 5,
          lighting: 5,
          overallScore: 5,
        },
        narrative: { structure: 5, pacing: 5, clarity: 5, engagement: 5, overallScore: 5 },
        engagement: {
          hookStrength: 5,
          retentionPotential: 5,
          emotionalImpact: 5,
          callToActionEffectiveness: 5,
          overallScore: 5,
        },
        accessibility: {
          subtitleQuality: 5,
          audioClarity: 5,
          visualClarity: 5,
          languageSimplicity: 5,
          overallScore: 5,
        },
      },
      insights: {
        strengths: [],
        weaknesses: [],
        recommendations: result.recommendations.map((r) => ({
          category: "technical" as const,
          priority: "medium" as const,
          title: r,
          description: r,
          actionSteps: [],
          estimatedImpact: "medium",
        })),
        marketingAngles: [],
        targetDemographics: [],
      },
      // video: undefined,
      // audio: undefined,
      // transcript: undefined,
      summary: "",
      tags: [],
      sentiment: {
        positive: 5,
        neutral: 5,
        negative: 5,
      },
    }))

    this.emitEvent({
      type: "completed",
      pipelineId,
      results: analysisResults,
    })
  }

  private updatePipelineError(pipelineId: string, error: string): void {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) return

    pipeline.status = "error"
    pipeline.error = error
    pipeline.endTime = new Date()

    this.emitEvent({ type: "error", pipelineId, error })
  }

  /**
   * Публичные методы управления
   */

  getPipelineStatus(pipelineId: string): PipelineProgress | undefined {
    return this.pipelines.get(pipelineId)
  }

  cancelPipeline(pipelineId: string): boolean {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline || pipeline.status !== "running") return false

    pipeline.status = "cancelled"
    pipeline.endTime = new Date()

    this.emitEvent({ type: "cancelled", pipelineId })
    return true
  }

  addEventListener(listener: (event: PipelineEvent) => void): void {
    this.eventListeners.push(listener)
  }

  removeEventListener(listener: (event: PipelineEvent) => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  private emitEvent(event: PipelineEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error("Ошибка в обработчике события pipeline:", error)
      }
    })
  }

  clearCompleted(): void {
    for (const [id, pipeline] of this.pipelines.entries()) {
      if (pipeline.status === "completed" || pipeline.status === "error" || pipeline.status === "cancelled") {
        this.pipelines.delete(id)
      }
    }
  }

  getActiveCount(): number {
    return Array.from(this.pipelines.values()).filter((p) => p.status === "running").length
  }
}

export default UnifiedContentPipeline
