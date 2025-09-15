/**
 * AI инструмент для предложения дополнительных ресурсов с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { ResourceToolResult, SuggestResourcesParams } from "./types"
import {
  getMoodEffects,
  getProjectTypeResources,
  getResourcesProvider,
  getResourcesStats,
  hasResourcesAccess,
} from "./utils/helpers"

// Типы для предложения ресурсов
export interface SuggestResourcesInput {
  operation: "suggest_complementary_resources"
  baseContent?: Array<{
    resourceId: string
    resourceType: string
  }>
  projectType:
    | "wedding"
    | "travel"
    | "corporate"
    | "social"
    | "documentary"
    | "education"
    | "music-video"
    | "commercial"
  mood: "energetic" | "calm" | "dramatic" | "romantic" | "professional" | "playful" | "serious" | "uplifting"
  targetDuration?: number
  includeAutoAdd?: boolean
  reason: string
}

export interface SuggestResourcesResult {
  operation: string
  success: boolean
  suggestions: string[]
  analysis: {
    baseContent: any[]
    projectType: string
    mood: string
    targetDuration?: number
    compatibility: string
    currentStats: {
      hasMusic: boolean
      hasTransitions: boolean
      hasEffects: boolean
      hasFilters: boolean
      totalResources: number
    }
    recommendations: any[]
  }
  addedResources: string[]
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для предложения дополнительных ресурсов с унифицированной обработкой ошибок
 */
export class SuggestResourcesTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("SuggestResourcesTool", logger)
  }

  /**
   * Выполняет предложение дополнительных ресурсов
   */
  public async processSuggestResources(
    input: SuggestResourcesInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<SuggestResourcesResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          if (data.operation !== "suggest_complementary_resources") {
            errors.push(`Неподдерживаемая операция: ${data.operation}`)
          }

          if (!data.projectType) {
            errors.push("Требуется указать projectType")
          }

          if (!data.mood) {
            errors.push("Требуется указать mood")
          }

          if (!data.reason) {
            errors.push("Требуется указать причину предложения ресурсов")
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

        const result = await this.suggestComplementaryResources(input)

        return result
      },
      options,
    )
  }

  private async suggestComplementaryResources(params: SuggestResourcesInput): Promise<SuggestResourcesResult> {
    const { baseContent = [], projectType, mood, targetDuration, includeAutoAdd = false } = params

    const resourcesProvider = getResourcesProvider()
    const stats = getResourcesStats()

    const suggestions: string[] = []
    const recommendedResources: any[] = []
    const recommendations: string[] = []

    // Анализируем существующие ресурсы
    const hasMusic = resourcesProvider.musicResources.length > 0
    const hasTransitions = resourcesProvider.transitionResources.length > 0
    const hasEffects = resourcesProvider.effectResources.length > 0
    const hasFilters = resourcesProvider.filterResources.length > 0

    // Получаем рекомендации на основе настроения и типа проекта
    const moodEffects = getMoodEffects(mood)
    const projectTypeResources = getProjectTypeResources(projectType)

    // Предложения на основе отсутствующих ресурсов
    if (!hasMusic) {
      suggestions.push(`Добавить фоновую музыку в стиле ${mood} для ${projectType} проекта`)
      recommendedResources.push({ type: "music", style: mood, purpose: projectType })
      recommendations.push("Музыка создает эмоциональную связь с аудиторией")
    }

    if (!hasTransitions) {
      suggestions.push(`Использовать переходы, подходящие для ${projectType} проекта`)
      recommendedResources.push({ type: "transition", style: projectType })
      recommendations.push("Плавные переходы улучшают восприятие контента")
    }

    if (!hasFilters && moodEffects.length > 0) {
      suggestions.push(`Добавить цветовые фильтры для настроения ${mood}`)
      recommendedResources.push({ type: "filter", effects: moodEffects })
      recommendations.push("Цветокоррекция помогает передать нужное настроение")
    }

    if (!hasEffects && projectTypeResources.length > 0) {
      suggestions.push(`Включить эффекты, характерные для ${projectType}`)
      recommendedResources.push({ type: "effect", effects: projectTypeResources })
      recommendations.push("Эффекты делают проект более профессиональным")
    }

    // Анализ длительности и предложения
    if (targetDuration) {
      const currentDuration = stats.totalDuration
      if (currentDuration < targetDuration * 0.8) {
        suggestions.push("Добавить больше контента для достижения целевой длительности")
        recommendations.push("Рассмотрите добавление b-roll материала")
      } else if (currentDuration > targetDuration * 1.2) {
        suggestions.push("Рассмотреть сокращение контента или ускорение темпа")
        recommendations.push("Более динамичный монтаж удержит внимание зрителя")
      }
    }

    // Специфичные предложения для baseContent
    if (baseContent.length > 0) {
      const videoCount = baseContent.filter((c: any) => c.resourceType === "media").length
      const audioCount = baseContent.filter((c: any) => c.resourceType === "music").length

      if (videoCount > 5 && !hasTransitions) {
        suggestions.push("Добавить переходы между многочисленными видеоклипами")
        recommendations.push("Переходы особенно важны для проектов с множеством клипов")
      }

      if (audioCount === 0 && videoCount > 0) {
        suggestions.push("Добавить музыкальное сопровождение к видеоряду")
        recommendations.push("Звуковое сопровождение значительно улучшит проект")
      }
    }

    // Автоматическое добавление рекомендуемых ресурсов
    const addedResources: string[] = []
    if (includeAutoAdd && recommendedResources.length > 0) {
      // В реальной реализации здесь будет поиск и добавление конкретных ресурсов
      // Пока просто имитируем добавление
      for (const recommendation of recommendedResources.slice(0, 3)) {
        const resourceId = `auto_${recommendation.type}_${Date.now()}`
        addedResources.push(resourceId)
      }
    }

    // Общие рекомендации
    if (suggestions.length === 0) {
      recommendations.push("Ваш проект уже содержит хороший набор ресурсов")
      recommendations.push("Рассмотрите тонкую настройку существующих элементов")
    }

    return {
      operation: "suggest_complementary_resources",
      success: true,
      suggestions,
      analysis: {
        baseContent,
        projectType,
        mood,
        targetDuration,
        compatibility: "high",
        currentStats: {
          hasMusic,
          hasTransitions,
          hasEffects,
          hasFilters,
          totalResources: stats.totalMedia + stats.totalEffects + stats.totalFilters,
        },
        recommendations: recommendedResources,
      },
      addedResources,
      message: `Найдено ${suggestions.length} предложений для улучшения проекта`,
      recommendations,
    }
  }
}

// Создаем singleton экземпляр
const suggestResourcesTool = new SuggestResourcesTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeSuggestResourcesTool(
  operation: SuggestResourcesInput["operation"],
  params: Omit<SuggestResourcesInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<SuggestResourcesResult>> {
  return suggestResourcesTool.processSuggestResources({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function suggestComplementaryResources(params: SuggestResourcesParams): Promise<ResourceToolResult> {
  const result = await suggestResourcesTool.processSuggestResources({
    operation: "suggest_complementary_resources",
    baseContent: params.baseContent,
    projectType: params.projectType,
    mood: params.mood,
    targetDuration: params.targetDuration,
    includeAutoAdd: params.includeAutoAdd,
    reason: "Предложение дополнительных ресурсов",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        suggestions: result.data.suggestions,
        analysis: result.data.analysis,
        addedResources: result.data.addedResources,
      },
      nextActions:
        result.data.addedResources.length > 0
          ? ["Проверить автоматически добавленные ресурсы", "Настроить параметры добавленных ресурсов"]
          : ["Просмотреть рекомендации", "Добавить рекомендуемые ресурсы вручную"],
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка предложения ресурсов",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const suggestComplementaryResourcesTool: any = {
  name: "suggest_complementary_resources",
  description: "Анализирует текущие ресурсы и предлагает дополнительные для улучшения проекта",
  input_schema: {
    type: "object",
    properties: {
      baseContent: {
        type: "array",
        items: {
          type: "object",
          properties: {
            resourceId: { type: "string" },
            resourceType: { type: "string" },
          },
        },
        description: "Основной контент для анализа",
      },
      projectType: {
        type: "string",
        enum: ["wedding", "travel", "corporate", "social", "documentary", "education", "music-video", "commercial"],
        description: "Тип проекта для контекстных предложений",
      },
      mood: {
        type: "string",
        enum: ["energetic", "calm", "dramatic", "romantic", "professional", "playful", "serious", "uplifting"],
        description: "Желаемое настроение проекта",
      },
      targetDuration: {
        type: "number",
        description: "Целевая длительность проекта в секундах",
      },
      includeAutoAdd: {
        type: "boolean",
        description: "Автоматически добавить наиболее подходящие ресурсы",
        default: false,
      },
    },
    required: ["projectType", "mood"],
  },
}
