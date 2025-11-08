/**
 * AI инструмент для предложения улучшений Timeline с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для предложения улучшений
export interface ImprovementsInput {
  analysisCategories?: ("performance" | "quality" | "storytelling" | "technical" | "accessibility")[]
  improvementPriority?: "critical-only" | "high-priority" | "all-suggestions"
}

export interface Improvement {
  id: string
  category: string
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  impact: string
  effort: "low" | "medium" | "high"
  actionSteps?: string[]
}

export interface CategoryAnalysis {
  category: string
  score: number
  improvements: Improvement[]
  criticalIssuesCount: number
}

export interface ImprovementsResult {
  overallScore: number
  categoriesAnalyzed: CategoryAnalysis[]
  topPriorityImprovements: Improvement[]
  summary: {
    totalImprovements: number
    criticalIssues: number
    highPriorityItems: number
    estimatedImpact: string
  }
  warnings?: string[]
}

/**
 * AI инструмент для предложения улучшений с унифицированной обработкой ошибок
 */
export class ImprovementsSuggestionTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ImprovementsSuggestionTool", logger)
  }

  /**
   * Анализирует Timeline и предлагает улучшения
   */
  public async suggestTimelineImprovements(
    input: ImprovementsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ImprovementsResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validCategories = ["performance", "quality", "storytelling", "technical", "accessibility"]
      if (data.analysisCategories?.some((cat: string) => !validCategories.includes(cat))) {
        errors.push("Неподдерживаемые категории анализа")
      }

      const validPriorities = ["critical-only", "high-priority", "all-suggestions"]
      if (data.improvementPriority && !validPriorities.includes(data.improvementPriority)) {
        errors.push(`Неподдерживаемый приоритет: ${data.improvementPriority}`)
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
        message: "Ошибка валидации параметров анализа улучшений",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const analysisCategories = input.analysisCategories || ["performance", "quality", "storytelling", "technical"]
    const improvementPriority = input.improvementPriority || "high-priority"

    // Выполняем анализ с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем анализ для предложений улучшений", {
          categoriesCount: analysisCategories.length,
          priority: improvementPriority,
          categories: analysisCategories.join(", "),
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для анализа. Откройте или создайте проект в timeline")
        }

        // Получаем все треки и клипы для анализа
        const allTracks = [...currentProject.globalTracks]
        currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

        const allClips = allTracks.reduce((clips: any[], track) => {
          return clips.concat(track.clips)
        }, [])

        // Проводим анализ по категориям и генерируем улучшения (упрощенная версия)
        const categoriesAnalyzed: CategoryAnalysis[] = []
        const allImprovements: Improvement[] = []

        for (const category of analysisCategories) {
          const improvements = this.generateImprovementsForCategory(category, currentProject, allTracks, allClips)
          const score = this.calculateCategoryScore(category, currentProject, allTracks, allClips)
          const criticalIssues = improvements.filter((imp) => imp.priority === "critical").length

          categoriesAnalyzed.push({
            category,
            score,
            improvements,
            criticalIssuesCount: criticalIssues,
          })

          allImprovements.push(...improvements)
        }

        // Фильтруем по приоритету
        const filteredImprovements = this.filterImprovementsByPriority(allImprovements, improvementPriority)
        const topPriorityImprovements = filteredImprovements
          .filter((imp) => imp.priority === "critical" || imp.priority === "high")
          .slice(0, 10)

        const totalCritical = allImprovements.filter((imp) => imp.priority === "critical").length
        const totalHigh = allImprovements.filter((imp) => imp.priority === "high").length
        const overallScore = categoriesAnalyzed.reduce((sum, cat) => sum + cat.score, 0) / categoriesAnalyzed.length

        const warnings: string[] = []
        if (totalCritical > 0) {
          warnings.push(`Обнаружено ${totalCritical} критических проблем, требующих немедленного внимания`)
        }

        const result: ImprovementsResult = {
          overallScore: Math.round(overallScore * 10) / 10,
          categoriesAnalyzed,
          topPriorityImprovements,
          summary: {
            totalImprovements: filteredImprovements.length,
            criticalIssues: totalCritical,
            highPriorityItems: totalHigh,
            estimatedImpact: totalCritical > 0 ? "Высокий" : totalHigh > 5 ? "Средний" : "Низкий",
          },
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Анализ улучшений завершен", {
          overallScore: result.overallScore,
          totalImprovements: result.summary.totalImprovements,
          criticalIssues: totalCritical,
          categoriesCount: categoriesAnalyzed.length,
        })

        return result
      },
      {
        timeout: options.timeout || 60000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          categoriesCount: analysisCategories.length,
          priority: improvementPriority,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Генерирует улучшения для конкретной категории (упрощенная версия)
   */
  private generateImprovementsForCategory(
    category: string,
    project: TimelineProject,
    tracks: any[],
    clips: any[],
  ): Improvement[] {
    const improvements: Improvement[] = []

    switch (category) {
      case "performance":
        if (clips.length > 100) {
          improvements.push({
            id: "perf-1",
            category: "performance",
            priority: "high",
            title: "Оптимизировать количество клипов",
            description: `Проект содержит ${clips.length} клипов, что может замедлить работу`,
            impact: "Улучшение производительности на 30-40%",
            effort: "medium",
            actionSteps: ["Объединить похожие клипы", "Удалить неиспользуемые клипы"],
          })
        }
        break

      case "quality":
        const clipsWithoutEffects = clips.filter((clip: any) => !clip.effects || clip.effects.length === 0)
        if (clipsWithoutEffects.length > clips.length * 0.8) {
          improvements.push({
            id: "quality-1",
            category: "quality",
            priority: "medium",
            title: "Добавить эффекты для улучшения качества",
            description: `${clipsWithoutEffects.length} клипов не имеют эффектов`,
            impact: "Повышение визуального качества",
            effort: "low",
          })
        }
        break

      case "storytelling":
        if (project.sections.length < 3) {
          improvements.push({
            id: "story-1",
            category: "storytelling",
            priority: "medium",
            title: "Улучшить структуру повествования",
            description: "Недостаточно секций для хорошей структуры истории",
            impact: "Более понятная и увлекательная история",
            effort: "medium",
            actionSteps: ["Создать секции: введение, основная часть, заключение"],
          })
        }
        break

      case "technical":
        const audioTracks = tracks.filter((track) => track.type === "audio")
        if (audioTracks.length === 0) {
          improvements.push({
            id: "tech-1",
            category: "technical",
            priority: "critical",
            title: "Добавить аудио треки",
            description: "Проект не содержит аудио треков",
            impact: "Полнота мультимедийного контента",
            effort: "low",
          })
        }
        break
    }

    return improvements
  }

  /**
   * Вычисляет оценку для категории (упрощенная версия)
   */
  private calculateCategoryScore(category: string, project: TimelineProject, tracks: any[], clips: any[]): number {
    switch (category) {
      case "performance":
        return clips.length > 100 ? 6.5 : 8.5
      case "quality":
        const effectsRatio = clips.filter((c: any) => c.effects?.length > 0).length / clips.length
        return effectsRatio > 0.5 ? 8.0 : 6.0
      case "storytelling":
        return project.sections.length >= 3 ? 8.5 : 6.0
      case "technical":
        const hasAudio = tracks.some((t) => t.type === "audio")
        return hasAudio ? 8.0 : 4.0
      default:
        return 7.0
    }
  }

  /**
   * Фильтрует улучшения по приоритету
   */
  private filterImprovementsByPriority(improvements: Improvement[], priority: string): Improvement[] {
    switch (priority) {
      case "critical-only":
        return improvements.filter((imp) => imp.priority === "critical")
      case "high-priority":
        return improvements.filter((imp) => imp.priority === "critical" || imp.priority === "high")
      case "all-suggestions":
        return improvements
      default:
        return improvements.filter((imp) => imp.priority === "critical" || imp.priority === "high")
    }
  }
}

// Экспортируем готовый экземпляр для использования
export const improvementsSuggestionTool = new ImprovementsSuggestionTool()

// Функция-обертка для обратной совместимости
export async function suggestTimelineImprovements(params: any): Promise<AIToolResult<ImprovementsResult>> {
  const input: ImprovementsInput = {
    analysisCategories: params.analysisCategories,
    improvementPriority: params.improvementPriority,
  }

  return improvementsSuggestionTool.suggestTimelineImprovements(input)
}
