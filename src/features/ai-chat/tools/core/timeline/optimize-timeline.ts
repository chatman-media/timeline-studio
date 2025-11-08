/**
 * AI инструмент для оптимизации Timeline с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для оптимизации timeline
export interface TimelineOptimizationInput {
  optimizationTargets?: ("performance" | "memory" | "storage" | "quality")[]
  aggressiveness?: "conservative" | "balanced" | "aggressive"
  preserveQuality?: boolean
}

export interface OptimizationAction {
  id: string
  type: string
  target: string
  description: string
  impact: "low" | "medium" | "high"
  estimatedSavings: {
    performance?: number // процент улучшения
    memory?: number // MB
    storage?: number // MB
  }
  risks: string[]
}

export interface TrackOptimization {
  trackId: string
  trackName: string
  actions: OptimizationAction[]
  potentialSavings: {
    clipReduction: number
    effectsOptimization: number
    qualityAdjustments: number
  }
}

export interface TimelineOptimizationResult {
  optimizationTargets: string[]
  aggressiveness: string
  analysisResults: {
    totalTracks: number
    totalClips: number
    totalEffects: number
    currentPerformanceScore: number
    projectedPerformanceScore: number
  }
  trackOptimizations: TrackOptimization[]
  globalOptimizations: OptimizationAction[]
  summary: {
    totalActions: number
    estimatedPerformanceGain: number
    estimatedMemorySavings: number
    estimatedStorageSavings: number
    riskLevel: "low" | "medium" | "high"
  }
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для оптимизации Timeline с унифицированной обработкой ошибок
 */
export class TimelineOptimizationTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("TimelineOptimizationTool", logger)
  }

  /**
   * Анализирует и оптимизирует Timeline проект
   */
  public async optimizeTimelinePerformance(
    input: TimelineOptimizationInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<TimelineOptimizationResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validTargets = ["performance", "memory", "storage", "quality"]
      if (data.optimizationTargets?.some((target: string) => !validTargets.includes(target))) {
        errors.push("Неподдерживаемые цели оптимизации")
      }

      const validAggressiveness = ["conservative", "balanced", "aggressive"]
      if (data.aggressiveness && !validAggressiveness.includes(data.aggressiveness)) {
        errors.push(`Неподдерживаемый уровень агрессивности: ${data.aggressiveness}`)
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
        message: "Ошибка валидации параметров оптимизации timeline",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const optimizationTargets = input.optimizationTargets || ["performance", "memory"]
    const aggressiveness = input.aggressiveness || "balanced"
    const preserveQuality = input.preserveQuality !== false

    // Выполняем оптимизацию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем анализ для оптимизации Timeline", {
          targets: optimizationTargets.join(", "),
          aggressiveness,
          preserveQuality,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для оптимизации. Откройте или создайте проект в timeline")
        }

        // Анализ текущего состояния проекта
        const projectStats = timelineAccess.getProjectStats()
        const allTracks = [...currentProject.globalTracks]
        currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

        const allClips = allTracks.reduce((clips: any[], track) => {
          return clips.concat(track.clips || [])
        }, [])

        const allEffects = allClips.reduce((effects: any[], clip) => {
          return effects.concat(clip.effects || [])
        }, [])

        this.logger?.info("Анализируем структуру проекта для оптимизации", {
          tracksCount: allTracks.length,
          clipsCount: allClips.length,
          effectsCount: allEffects.length,
        })

        // Вычисляем текущий счет производительности
        const currentPerformanceScore = this.calculatePerformanceScore(currentProject, allTracks, allClips)

        // Анализируем оптимизации для каждого трека
        const trackOptimizations: TrackOptimization[] = []
        const globalOptimizations: OptimizationAction[] = []
        const warnings: string[] = []

        for (const track of allTracks) {
          this.logger?.info(`Анализируем оптимизации для трека: ${track.name}`)

          const trackOpt = await this.analyzeTrackOptimizations(
            track,
            optimizationTargets,
            aggressiveness,
            preserveQuality,
          )

          if (trackOpt.actions.length > 0) {
            trackOptimizations.push(trackOpt)
          }
        }

        // Анализируем глобальные оптимизации
        globalOptimizations.push(
          ...this.analyzeGlobalOptimizations(currentProject, allTracks, allClips, optimizationTargets, aggressiveness),
        )

        // Вычисляем прогнозируемые улучшения
        const projectedPerformanceScore = this.calculateProjectedPerformanceScore(
          currentPerformanceScore,
          trackOptimizations,
          globalOptimizations,
        )

        const summary = this.calculateOptimizationSummary(trackOptimizations, globalOptimizations)

        // Генерируем рекомендации
        const recommendations = this.generateOptimizationRecommendations(
          currentProject,
          trackOptimizations,
          globalOptimizations,
          aggressiveness,
        )

        // Проверяем риски
        if (aggressiveness === "aggressive" && !preserveQuality) {
          warnings.push("Агрессивная оптимизация без сохранения качества может привести к потере данных")
        }

        if (summary.totalActions > 50) {
          warnings.push("Большое количество оптимизаций - рекомендуется применять поэтапно")
        }

        const result: TimelineOptimizationResult = {
          optimizationTargets,
          aggressiveness,
          analysisResults: {
            totalTracks: allTracks.length,
            totalClips: allClips.length,
            totalEffects: allEffects.length,
            currentPerformanceScore,
            projectedPerformanceScore,
          },
          trackOptimizations,
          globalOptimizations,
          summary,
          recommendations,
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Анализ оптимизации завершен", {
          totalActions: summary.totalActions,
          performanceGain: summary.estimatedPerformanceGain,
          riskLevel: summary.riskLevel,
        })

        return result
      },
      {
        timeout: options.timeout || 90000, // 1.5 минуты для анализа оптимизации
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          targets: optimizationTargets.join(","),
          aggressiveness,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Анализирует оптимизации для конкретного трека
   */
  private async analyzeTrackOptimizations(
    track: any,
    targets: string[],
    aggressiveness: string,
    preserveQuality: boolean,
  ): Promise<TrackOptimization> {
    const actions: OptimizationAction[] = []
    const clips = track.clips || []

    // Оптимизация количества клипов
    if (targets.includes("performance") && clips.length > 20) {
      actions.push({
        id: `clip_merge_${track.id}`,
        type: "clip_merging",
        target: "performance",
        description: `Объединить ${Math.floor(clips.length / 4)} последовательных клипов`,
        impact: "medium",
        estimatedSavings: { performance: 15 },
        risks: aggressiveness === "aggressive" ? ["Потеря гибкости редактирования"] : [],
      })
    }

    // Оптимизация эффектов
    const clipsWithManyEffects = clips.filter((clip: any) => clip.effects?.length > 3)
    if (targets.includes("performance") && clipsWithManyEffects.length > 0) {
      actions.push({
        id: `effects_optimize_${track.id}`,
        type: "effects_optimization",
        target: "performance",
        description: `Оптимизировать эффекты на ${clipsWithManyEffects.length} клипах`,
        impact: "high",
        estimatedSavings: { performance: 25, memory: 50 },
        risks: preserveQuality ? [] : ["Возможное снижение качества эффектов"],
      })
    }

    // Оптимизация памяти
    if (targets.includes("memory")) {
      const largeClips = clips.filter((clip: any) => clip.duration > 300) // Больше 5 минут
      if (largeClips.length > 0) {
        actions.push({
          id: `memory_optimize_${track.id}`,
          type: "memory_optimization",
          target: "memory",
          description: `Оптимизировать загрузку ${largeClips.length} длинных клипов`,
          impact: "medium",
          estimatedSavings: { memory: 100 * largeClips.length },
          risks: ["Возможные задержки при воспроизведении"],
        })
      }
    }

    const potentialSavings = {
      clipReduction: clips.length > 20 ? Math.floor(clips.length * 0.2) : 0,
      effectsOptimization: clipsWithManyEffects.length,
      qualityAdjustments: preserveQuality ? 0 : clips.length * 0.1,
    }

    return {
      trackId: track.id,
      trackName: track.name || track.id,
      actions,
      potentialSavings,
    }
  }

  /**
   * Анализирует глобальные оптимизации проекта
   */
  private analyzeGlobalOptimizations(
    _project: TimelineProject,
    allTracks: any[],
    allClips: any[],
    targets: string[],
    aggressiveness: string,
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = []

    // Оптимизация структуры проекта
    if (targets.includes("performance") && allTracks.length > 15) {
      actions.push({
        id: "global_track_optimization",
        type: "track_consolidation",
        target: "performance",
        description: `Консолидировать ${allTracks.length - 10} избыточных треков`,
        impact: "high",
        estimatedSavings: { performance: 30, memory: 200 },
        risks: aggressiveness === "conservative" ? ["Изменение структуры проекта"] : [],
      })
    }

    // Оптимизация хранилища
    if (targets.includes("storage")) {
      const duplicateClips = this.findDuplicateClips(allClips)
      if (duplicateClips.length > 0) {
        actions.push({
          id: "global_storage_optimization",
          type: "duplicate_removal",
          target: "storage",
          description: `Удалить ${duplicateClips.length} дублирующихся клипов`,
          impact: "medium",
          estimatedSavings: { storage: duplicateClips.length * 50 },
          risks: ["Проверьте, что дубликаты действительно не нужны"],
        })
      }
    }

    // Оптимизация качества
    if (targets.includes("quality") && aggressiveness !== "conservative") {
      const lowQualityClips = allClips.filter((clip: any) => !clip.effects || clip.effects.length === 0)

      if (lowQualityClips.length > allClips.length * 0.5) {
        actions.push({
          id: "global_quality_optimization",
          type: "quality_enhancement",
          target: "quality",
          description: `Применить автоматические улучшения к ${lowQualityClips.length} клипам`,
          impact: "high",
          estimatedSavings: { performance: -10 }, // Негативное влияние на производительность
          risks: ["Увеличение времени рендеринга"],
        })
      }
    }

    return actions
  }

  /**
   * Находит дублирующиеся клипы
   */
  private findDuplicateClips(allClips: any[]): any[] {
    const duplicates: any[] = []
    const seen = new Map<string, any>()

    for (const clip of allClips) {
      const key = `${clip.mediaFile?.path || clip.name}_${clip.duration}`

      if (seen.has(key)) {
        duplicates.push(clip)
      } else {
        seen.set(key, clip)
      }
    }

    return duplicates
  }

  /**
   * Вычисляет текущий счет производительности
   */
  private calculatePerformanceScore(project: TimelineProject, allTracks: any[], allClips: any[]): number {
    let score = 100

    // Штрафы за сложность
    if (allTracks.length > 10) score -= (allTracks.length - 10) * 2
    if (allClips.length > 50) score -= (allClips.length - 50) * 0.5

    const totalEffects = allClips.reduce((sum: number, clip: any) => sum + (clip.effects?.length || 0), 0)
    if (totalEffects > 100) score -= (totalEffects - 100) * 0.3

    if (project.duration > 3600) score -= 10 // Длинные проекты

    return Math.max(0, Math.round(score))
  }

  /**
   * Вычисляет прогнозируемый счет производительности
   */
  private calculateProjectedPerformanceScore(
    currentScore: number,
    trackOptimizations: TrackOptimization[],
    globalOptimizations: OptimizationAction[],
  ): number {
    let improvement = 0

    // Улучшения от оптимизации треков
    trackOptimizations.forEach((trackOpt) => {
      trackOpt.actions.forEach((action) => {
        if (action.estimatedSavings.performance) {
          improvement += action.estimatedSavings.performance
        }
      })
    })

    // Улучшения от глобальных оптимизаций
    globalOptimizations.forEach((action) => {
      if (action.estimatedSavings.performance) {
        improvement += action.estimatedSavings.performance
      }
    })

    return Math.min(100, Math.round(currentScore + improvement * 0.6)) // Консервативная оценка
  }

  /**
   * Вычисляет сводку по оптимизации
   */
  private calculateOptimizationSummary(
    trackOptimizations: TrackOptimization[],
    globalOptimizations: OptimizationAction[],
  ): TimelineOptimizationResult["summary"] {
    let totalActions = globalOptimizations.length
    let estimatedPerformanceGain = 0
    let estimatedMemorySavings = 0
    let estimatedStorageSavings = 0
    let maxRiskLevel: "low" | "medium" | "high" = "low"

    trackOptimizations.forEach((trackOpt) => {
      totalActions += trackOpt.actions.length

      trackOpt.actions.forEach((action) => {
        estimatedPerformanceGain += action.estimatedSavings.performance || 0
        estimatedMemorySavings += action.estimatedSavings.memory || 0
        estimatedStorageSavings += action.estimatedSavings.storage || 0

        if (action.risks.length > 0) {
          if (action.impact === "high") maxRiskLevel = "high"
          else if (action.impact === "medium" && maxRiskLevel !== "high") maxRiskLevel = "medium"
        }
      })
    })

    globalOptimizations.forEach((action) => {
      estimatedPerformanceGain += action.estimatedSavings.performance || 0
      estimatedMemorySavings += action.estimatedSavings.memory || 0
      estimatedStorageSavings += action.estimatedSavings.storage || 0
    })

    return {
      totalActions,
      estimatedPerformanceGain: Math.round(estimatedPerformanceGain * 0.7), // Консервативная оценка
      estimatedMemorySavings: Math.round(estimatedMemorySavings),
      estimatedStorageSavings: Math.round(estimatedStorageSavings),
      riskLevel: maxRiskLevel,
    }
  }

  /**
   * Генерирует рекомендации по оптимизации
   */
  private generateOptimizationRecommendations(
    _project: TimelineProject,
    trackOptimizations: TrackOptimization[],
    globalOptimizations: OptimizationAction[],
    aggressiveness: string,
  ): string[] {
    const recommendations: string[] = []

    // Общие рекомендации
    if (trackOptimizations.length === 0 && globalOptimizations.length === 0) {
      recommendations.push("Проект уже оптимизирован или не нуждается в оптимизации")
      return recommendations
    }

    recommendations.push("Создайте резервную копию проекта перед применением оптимизаций")

    // Рекомендации по последовательности
    if (globalOptimizations.length > 0) {
      recommendations.push("Начните с глобальных оптимизаций проекта")
    }

    if (trackOptimizations.length > 5) {
      recommendations.push("Применяйте оптимизации треков поэтапно, по 2-3 трека за раз")
    }

    // Специфические рекомендации по агрессивности
    if (aggressiveness === "aggressive") {
      recommendations.push("При агрессивной оптимизации тщательно проверяйте результат после каждого этапа")
      recommendations.push("Рассмотрите снижение агрессивности если возникают проблемы")
    } else if (aggressiveness === "conservative") {
      recommendations.push("Консервативная оптимизация безопасна но может дать меньший эффект")
      recommendations.push("После успешного применения рассмотрите более агрессивные методы")
    }

    // Рекомендации по производительности
    const performanceActions = [...globalOptimizations, ...trackOptimizations.flatMap((t) => t.actions)].filter(
      (action) => action.target === "performance",
    )

    if (performanceActions.length > 0) {
      recommendations.push("Перезапустите редактор после применения оптимизаций производительности")
    }

    recommendations.push("Протестируйте проект после оптимизации перед продолжением работы")

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const timelineOptimizationTool = new TimelineOptimizationTool()

// Функция-обертка для обратной совместимости
export async function optimizeTimelinePerformance(params: any): Promise<AIToolResult<TimelineOptimizationResult>> {
  const input: TimelineOptimizationInput = {
    optimizationTargets: params.optimizationTargets,
    aggressiveness: params.aggressiveness,
    preserveQuality: params.preserveQuality,
  }

  return timelineOptimizationTool.optimizeTimelinePerformance(input)
}
