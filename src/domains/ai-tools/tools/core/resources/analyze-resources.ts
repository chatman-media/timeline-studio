/**
 * AI инструмент для анализа доступных ресурсов с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { AnalyzeResourcesParams, ResourceToolResult } from "./types"
import { getResourcesProvider, getResourcesStats, hasResourcesAccess } from "./utils/helpers"

// Типы для анализа ресурсов
export interface AnalyzeResourcesInput {
  operation: "analyze_available_resources"
  resourceType: "all" | "media" | "music" | "effect" | "filter" | "transition" | "template" | "styleTemplate"
  includeStats?: boolean
  filter?: {
    addedAfter?: string
    addedBy?: string
  }
  reason: string
}

export interface AnalyzeResourcesResult {
  operation: string
  success: boolean
  analysis: {
    resourceType: string
    totalCount: number
    categoryBreakdown: Record<string, any>
    items: any[]
    stats?: {
      totalSize: number
      totalDuration: number
      resourceBreakdown: Record<string, any>
    }
  }
  suggestions: string[]
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для анализа ресурсов с унифицированной обработкой ошибок
 */
export class AnalyzeResourcesTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("AnalyzeResourcesTool", logger)
  }

  /**
   * Выполняет анализ доступных ресурсов
   */
  public async processAnalyzeResources(
    input: AnalyzeResourcesInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<AnalyzeResourcesResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          if (data.operation !== "analyze_available_resources") {
            errors.push(`Неподдерживаемая операция: ${data.operation}`)
          }

          if (!data.resourceType) {
            errors.push("Требуется указать resourceType для анализа ресурсов")
          }

          if (!data.reason) {
            errors.push("Требуется указать причину анализа ресурсов")
          }

          return { isValid: errors.length === 0, errors }
        })

        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "))
        }

        // Проверка доступа к ресурсам
        if (!hasResourcesAccess()) {
          throw new Error("Доступ к ресурсам не сконфигурирован")
        }

        const result = await this.analyzeResources(input)

        return result
      },
      options,
    )
  }

  private async analyzeResources(params: AnalyzeResourcesInput): Promise<AnalyzeResourcesResult> {
    const { resourceType, includeStats = true, filter } = params

    const resourcesProvider = getResourcesProvider()
    const stats = getResourcesStats()

    const analysis: any = {
      resourceType,
      totalCount: 0,
      categoryBreakdown: {},
      items: [],
    }

    // Анализируем конкретный тип ресурсов
    switch (resourceType) {
      case "media":
        analysis.totalCount = resourcesProvider.mediaResources.length
        analysis.items = resourcesProvider.mediaResources.map((r) => ({
          id: r.id,
          name: r.file.name,
          duration: r.file.duration,
          size: r.file.size,
          type: r.file.isVideo ? "video" : r.file.isAudio ? "audio" : r.file.isImage ? "image" : "unknown",
        }))
        break
      case "effect":
        analysis.totalCount = resourcesProvider.effectResources.length
        analysis.items = resourcesProvider.effectResources.map((r) => ({
          id: r.id,
          name: r.effect.name,
          category: r.effect.category,
        }))
        break
      case "filter":
        analysis.totalCount = resourcesProvider.filterResources.length
        analysis.items = resourcesProvider.filterResources.map((r) => ({
          id: r.id,
          name: r.filter.name,
          category: r.filter.category,
        }))
        break
      case "music":
        analysis.totalCount = resourcesProvider.musicResources.length
        analysis.items = resourcesProvider.musicResources.map((r) => ({
          id: r.id,
          name: r.file.name,
          duration: r.file.duration,
          size: r.file.size,
        }))
        break
      case "all":
        analysis.totalCount = stats.totalMedia + stats.totalEffects + stats.totalFilters
        analysis.categoryBreakdown = {
          media: stats.totalMedia,
          effects: stats.totalEffects,
          filters: stats.totalFilters,
          music: resourcesProvider.musicResources.length,
          transitions: resourcesProvider.transitionResources.length,
          templates: resourcesProvider.templateResources.length,
        }
        break
      default:
        analysis.totalCount = 0
        analysis.items = []
        break
    }

    if (includeStats) {
      analysis.stats = {
        totalSize: stats.totalSize,
        totalDuration: stats.totalDuration,
        resourceBreakdown: analysis.categoryBreakdown,
      }
    }

    // Генерируем предложения на основе анализа
    const suggestions: string[] = []
    if (stats.totalMedia < 5) {
      suggestions.push("Рекомендуется добавить больше медиафайлов для разнообразия")
    }
    if (stats.totalEffects < 3) {
      suggestions.push("Добавьте визуальные эффекты для улучшения качества")
    }
    if (resourcesProvider.musicResources.length === 0) {
      suggestions.push("Добавьте музыкальные треки для звукового сопровождения")
    }

    return {
      operation: "analyze_available_resources",
      success: true,
      analysis,
      suggestions,
      message: `Анализ ресурсов типа ${resourceType} выполнен`,
      recommendations: ["Просмотреть детали анализа", "Добавить рекомендуемые ресурсы"],
    }
  }
}

// Создаем singleton экземпляр
const analyzeResourcesTool = new AnalyzeResourcesTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeAnalyzeResourcesTool(
  operation: AnalyzeResourcesInput["operation"],
  params: Omit<AnalyzeResourcesInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<AnalyzeResourcesResult>> {
  return analyzeResourcesTool.processAnalyzeResources({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function analyzeAvailableResources(params: AnalyzeResourcesParams): Promise<ResourceToolResult> {
  const result = await analyzeResourcesTool.processAnalyzeResources({
    operation: "analyze_available_resources",
    resourceType: params.resourceType,
    includeStats: params.includeStats,
    filter: params.filter,
    reason: "Анализ доступных ресурсов",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        analysis: result.data.analysis,
        suggestions: result.data.suggestions,
      },
      nextActions: result.data.recommendations,
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка анализа ресурсов",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const analyzeAvailableResourcesTool: any = {
  name: "analyze_available_resources",
  description: "Анализирует все доступные ресурсы в Resources Provider и возвращает подробную статистику",
  input_schema: {
    type: "object",
    properties: {
      resourceType: {
        type: "string",
        enum: ["all", "media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
        description: "Тип ресурсов для анализа",
      },
      includeStats: {
        type: "boolean",
        description: "Включить статистику использования",
        default: true,
      },
      filter: {
        type: "object",
        properties: {
          addedAfter: { type: "string", description: "ISO дата, после которой были добавлены ресурсы" },
          addedBy: { type: "string", description: "Фильтр по источнику добавления" },
        },
        description: "Дополнительные фильтры для анализа",
      },
    },
    required: ["resourceType"],
  },
}
