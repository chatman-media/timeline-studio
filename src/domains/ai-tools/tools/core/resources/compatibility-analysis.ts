/**
 * AI инструмент для анализа совместимости ресурсов с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { CompatibilityParams, ResourceToolResult } from "./types"
import {
  checkResourceCompatibility,
  getResourceDetails,
  getResourcesProvider,
  hasResourcesAccess,
} from "./utils/helpers"

// Типы для анализа совместимости ресурсов
export interface CompatibilityAnalysisInput {
  operation: "analyze_resource_compatibility"
  resourceIds: string[]
  checkAgainst?: "project-settings" | "other-resources" | "timeline-structure" | "all"
  includeRecommendations?: boolean
  reason: string
}

export interface CompatibilityAnalysisResult {
  operation: string
  success: boolean
  analysis: {
    checkAgainst: string
    results: Array<{
      resourceId: string
      resourceType: string
      compatible: boolean
      issues: string[]
    }>
    overallCompatibility: "excellent" | "good" | "needs-attention"
    projectSettings: any
    summary: {
      total: number
      compatible: number
      incompatible: number
    }
  }
  suggestions: string[]
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для анализа совместимости ресурсов с унифицированной обработкой ошибок
 */
export class CompatibilityAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("CompatibilityAnalysisTool", logger)
  }

  /**
   * Выполняет анализ совместимости ресурсов
   */
  public async processCompatibilityAnalysis(
    input: CompatibilityAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<CompatibilityAnalysisResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          if (data.operation !== "analyze_resource_compatibility") {
            errors.push(`Неподдерживаемая операция: ${data.operation}`)
          }

          if (!data.resourceIds || data.resourceIds.length === 0) {
            errors.push("Требуется указать resourceIds для анализа совместимости")
          }

          if (!data.reason) {
            errors.push("Требуется указать причину анализа совместимости")
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

        const result = await this.analyzeCompatibility(input)

        return result
      },
      options,
    )
  }

  private async analyzeCompatibility(params: CompatibilityAnalysisInput): Promise<CompatibilityAnalysisResult> {
    const { resourceIds, checkAgainst = "all", includeRecommendations = true } = params

    const resourcesProvider = getResourcesProvider()
    const compatibilityResults: any[] = []
    const recommendations: string[] = []

    // Получаем информацию о проекте (в реальной реализации из ProjectSettings)
    const projectSettings = {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      sampleRate: 48000,
      aspectRatio: "16:9",
    }

    // Анализируем каждый ресурс
    for (const resourceId of resourceIds) {
      const resourceDetails = getResourceDetails(resourceId)

      if (!resourceDetails) {
        compatibilityResults.push({
          resourceId,
          compatible: false,
          issues: ["Ресурс не найден в пуле"],
          resourceType: "unknown",
        })
        continue
      }

      const issues: string[] = []
      let compatible = true

      // Проверяем совместимость в зависимости от типа ресурса
      if (resourceDetails.type === "media" || resourceDetails.type === "music") {
        if (resourceDetails.file) {
          const compatibilityCheck = checkResourceCompatibility(resourceDetails, projectSettings)
          issues.push(...compatibilityCheck.issues)
          compatible = compatibilityCheck.compatible
        }
      }

      // Проверка совместимости между ресурсами
      if (checkAgainst === "other-resources" || checkAgainst === "all") {
        // Проверяем совместимость с другими ресурсами того же типа
        const sameTypeResources = resourcesProvider.resources.filter(
          (r) => r.type === resourceDetails.type && r.resourceId !== resourceId,
        )

        if (sameTypeResources.length > 0) {
          // Здесь можно добавить специфичные проверки для каждого типа
          if (resourceDetails.type === "transition" && sameTypeResources.length > 5) {
            issues.push("Слишком много различных переходов может создать визуальный хаос")
          }

          if (resourceDetails.type === "filter" && sameTypeResources.length > 3) {
            issues.push("Множественные фильтры могут конфликтовать между собой")
          }
        }
      }

      compatibilityResults.push({
        resourceId,
        resourceType: resourceDetails.type,
        compatible,
        issues,
      })
    }

    // Генерируем рекомендации
    if (includeRecommendations) {
      const hasResolutionIssues = compatibilityResults.some((r) =>
        r.issues.some((i: string) => i.includes("разрешения")),
      )
      const hasFpsIssues = compatibilityResults.some((r) => r.issues.some((i: string) => i.includes("частота кадров")))
      const hasAudioIssues = compatibilityResults.some((r) => r.issues.some((i: string) => i.includes("дискретизации")))

      if (hasResolutionIssues) {
        recommendations.push("Конвертировать все видео в единое разрешение проекта")
        recommendations.push("Использовать масштабирование с сохранением соотношения сторон")
      }

      if (hasFpsIssues) {
        recommendations.push("Синхронизировать частоту кадров всех видеофайлов")
        recommendations.push("Использовать интерполяцию кадров для плавности")
      }

      if (hasAudioIssues) {
        recommendations.push("Конвертировать аудио в единую частоту дискретизации")
        recommendations.push("Проверить синхронизацию аудио и видео после конвертации")
      }

      // Общие рекомендации
      const incompatibleCount = compatibilityResults.filter((r) => !r.compatible).length
      if (incompatibleCount > 0) {
        recommendations.push("Создать прокси-файлы для несовместимых ресурсов")
        recommendations.push("Использовать предварительный рендеринг для проблемных участков")
      }
    }

    const overallCompatibility = compatibilityResults.every((r) => r.compatible)
      ? "excellent"
      : compatibilityResults.filter((r) => r.compatible).length > compatibilityResults.length / 2
        ? "good"
        : "needs-attention"

    return {
      operation: "analyze_resource_compatibility",
      success: true,
      analysis: {
        checkAgainst,
        results: compatibilityResults,
        overallCompatibility,
        projectSettings,
        summary: {
          total: compatibilityResults.length,
          compatible: compatibilityResults.filter((r) => r.compatible).length,
          incompatible: compatibilityResults.filter((r) => !r.compatible).length,
        },
      },
      suggestions: recommendations,
      message: `Анализ совместимости ${resourceIds.length} ресурсов завершен`,
      recommendations:
        recommendations.length > 0
          ? ["Применить рекомендации", "Конвертировать несовместимые ресурсы"]
          : ["Ресурсы готовы к использованию"],
    }
  }
}

// Создаем singleton экземпляр
const compatibilityAnalysisTool = new CompatibilityAnalysisTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeCompatibilityAnalysisTool(
  operation: CompatibilityAnalysisInput["operation"],
  params: Omit<CompatibilityAnalysisInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<CompatibilityAnalysisResult>> {
  return compatibilityAnalysisTool.processCompatibilityAnalysis({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function analyzeResourceCompatibility(params: CompatibilityParams): Promise<ResourceToolResult> {
  const result = await compatibilityAnalysisTool.processCompatibilityAnalysis({
    operation: "analyze_resource_compatibility",
    resourceIds: params.resourceIds,
    checkAgainst: params.checkAgainst,
    includeRecommendations: params.includeRecommendations,
    reason: "Анализ совместимости ресурсов",
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
    message: result.error?.message || "Ошибка анализа совместимости",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const analyzeResourceCompatibilityTool: any = {
  name: "analyze_resource_compatibility",
  description: "Анализирует совместимость ресурсов между собой и с текущим проектом",
  input_schema: {
    type: "object",
    properties: {
      resourceIds: {
        type: "array",
        items: { type: "string" },
        description: "Список идентификаторов ресурсов для проверки совместимости",
      },
      checkAgainst: {
        type: "string",
        enum: ["project-settings", "other-resources", "timeline-structure", "all"],
        description: "С чем проверять совместимость",
      },
      includeRecommendations: {
        type: "boolean",
        description: "Включить рекомендации по устранению проблем совместимости",
        default: true,
      },
    },
    required: ["resourceIds"],
  },
}
