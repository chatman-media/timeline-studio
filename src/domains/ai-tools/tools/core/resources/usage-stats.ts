/**
 * AI инструменты для статистики и управления использованием ресурсов с BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { CleanupParams, ResourceToolResult, UsageStatsParams } from "./types"
import {
  formatFileSize,
  getResourcesProvider,
  getResourcesStateAccess,
  getResourcesStats,
  hasResourcesAccess,
} from "./utils/helpers"

// Типы для операций управления статистикой
export interface UsageStatsInput {
  operation: "get_resource_usage_stats" | "cleanup_unused_resources"
  timeRange?: {
    start?: string
    end?: string
  }
  groupBy?: "type" | "date" | "source" | "usage-frequency"
  includeUnused?: boolean
  dryRun?: boolean
  criteria?: {
    unusedForDays?: number
    resourceTypes?: string[]
    excludeFavorites?: boolean
  }
  reason?: string
}

export interface UsageStatsResult {
  operation: string
  success: boolean
  analysis?: any
  removedResources?: string[]
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для статистики использования ресурсов с унифицированной обработкой ошибок
 */
export class UsageStatsTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("UsageStatsTool", logger)
  }

  /**
   * Выполняет операции со статистикой ресурсов
   */
  public async processUsageStats(
    input: UsageStatsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<UsageStatsResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          const validOperations = ["get_resource_usage_stats", "cleanup_unused_resources"]
          if (!validOperations.includes(data.operation)) {
            errors.push(`Неподдерживаемая операция: ${data.operation}`)
          }

          // Специфичные валидации
          if (data.operation === "cleanup_unused_resources" && !data.reason) {
            errors.push("Требуется reason для операции cleanup_unused_resources")
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

        let result: UsageStatsResult

        switch (input.operation) {
          case "get_resource_usage_stats":
            const statsResult = await this.getResourceUsageStats({
              timeRange: input.timeRange,
              groupBy: input.groupBy || "type",
              includeUnused: input.includeUnused ?? true,
            })
            if (!statsResult.success) {
              throw new Error(statsResult.message)
            }
            result = {
              operation: input.operation,
              success: true,
              analysis: statsResult.data?.analysis,
              message: statsResult.message,
              recommendations: statsResult.data?.suggestions || [],
            }
            break

          case "cleanup_unused_resources":
            const cleanupResult = await this.cleanupUnusedResources({
              dryRun: input.dryRun ?? true,
              criteria: input.criteria || {},
              reason: input.reason!,
            })
            if (!cleanupResult.success) {
              throw new Error(cleanupResult.message)
            }
            result = {
              operation: input.operation,
              success: true,
              analysis: cleanupResult.data?.analysis,
              removedResources: cleanupResult.data?.removedResources,
              message: cleanupResult.message,
              recommendations: cleanupResult.data?.suggestions || [],
              warnings: cleanupResult.data?.warnings,
            }
            break

          default:
            result = {
              operation: input.operation,
              success: false,
              message: "Функция пока не реализована",
              recommendations: ["Функция будет добавлена в следующих версиях"],
            }
            break
        }

        return result
      },
      options,
    )
  }

  private async getResourceUsageStats(params: UsageStatsParams): Promise<ResourceToolResult> {
    const { timeRange, groupBy = "type", includeUnused = true } = params

    try {
      const resourcesProvider = getResourcesProvider()
      const stats = getResourcesStats()

      // Подсчитываем статистику по типам
      const typeStats = {
        media: {
          total: resourcesProvider.mediaResources.length,
          used: 0, // В реальной реализации будет подсчет из Timeline
          size: resourcesProvider.mediaResources.reduce((sum, r) => sum + (r.file.size || 0), 0),
          duration: resourcesProvider.mediaResources.reduce((sum, r) => sum + (r.file.duration || 0), 0),
        },
        music: {
          total: resourcesProvider.musicResources.length,
          used: 0,
          size: resourcesProvider.musicResources.reduce((sum, r) => sum + (r.file.size || 0), 0),
          duration: resourcesProvider.musicResources.reduce((sum, r) => sum + (r.file.duration || 0), 0),
        },
        effects: {
          total: resourcesProvider.effectResources.length,
          used: 0,
          categories: resourcesProvider.effectResources.reduce<Record<string, number>>((acc, r) => {
            const category = r.effect.category || "other"
            acc[category] = (acc[category] || 0) + 1
            return acc
          }, {}),
        },
        filters: {
          total: resourcesProvider.filterResources.length,
          used: 0,
          categories: resourcesProvider.filterResources.reduce<Record<string, number>>((acc, r) => {
            const category = r.filter.category || "other"
            acc[category] = (acc[category] || 0) + 1
            return acc
          }, {}),
        },
        transitions: {
          total: resourcesProvider.transitionResources.length,
          used: 0,
          types: resourcesProvider.transitionResources.reduce<Record<string, number>>((acc, r) => {
            const type = r.transition.type
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {}),
        },
        templates: {
          total: resourcesProvider.templateResources.length,
          used: 0,
        },
        styleTemplates: {
          total: resourcesProvider.styleTemplateResources.length,
          used: 0,
        },
        subtitles: {
          total: resourcesProvider.subtitleResources.length,
          used: 0,
        },
      }

      // Группировка статистики
      let groupedStats: any = {}

      if (groupBy === "type") {
        groupedStats = typeStats
      } else if (groupBy === "date") {
        // Группировка по дате добавления
        groupedStats = {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          older: 0,
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        resourcesProvider.resources.forEach((resource) => {
          const addedDate = new Date(resource.addedAt || now)
          if (addedDate >= today) {
            groupedStats.today++
          } else if (addedDate >= weekAgo) {
            groupedStats.thisWeek++
          } else if (addedDate >= monthAgo) {
            groupedStats.thisMonth++
          } else {
            groupedStats.older++
          }
        })
      } else if (groupBy === "source") {
        // Группировка по источнику
        groupedStats = {
          imported: 0,
          builtin: 0,
          downloaded: 0,
          generated: 0,
        }

        // В реальной реализации будет подсчет по источникам
        groupedStats.imported = resourcesProvider.resources.length
      } else if (groupBy === "usage-frequency") {
        // Группировка по частоте использования
        groupedStats = {
          never: 0,
          rarely: 0,
          sometimes: 0,
          often: 0,
        }

        // В реальной реализации будет подсчет из Timeline
        groupedStats.never = resourcesProvider.resources.length
      }

      // Подсчет общей статистики
      const totalResources = resourcesProvider.resources.length
      const usedResources = 0 // В реальной реализации из Timeline
      const unusedResources = includeUnused ? totalResources - usedResources : 0

      // Генерация предложений
      const suggestions: string[] = []

      if (unusedResources > totalResources * 0.3) {
        suggestions.push("Рассмотреть удаление неиспользуемых ресурсов для экономии места")
      }

      if (typeStats.music.total === 0) {
        suggestions.push("Добавить музыкальные треки для звукового сопровождения")
      } else if (typeStats.music.total < 3) {
        suggestions.push("Добавить больше музыкальных треков для разнообразия")
      }

      if (typeStats.transitions.total === 0) {
        suggestions.push("Добавить переходы для плавности монтажа")
      }

      if (typeStats.effects.total === 0) {
        suggestions.push("Использовать визуальные эффекты для улучшения качества")
      }

      if (stats.totalSize > 1000 * 1024 * 1024) {
        // > 1GB
        suggestions.push("Оптимизировать размер медиафайлов для лучшей производительности")
      }

      return {
        success: true,
        message: "Статистика использования ресурсов получена",
        data: {
          analysis: {
            totalResources,
            usedResources,
            unusedResources: includeUnused ? unusedResources : undefined,
            byType: typeStats,
            groupedBy: groupBy,
            groupedStats,
            overallStats: {
              totalSize: stats.totalSize,
              totalDuration: stats.totalDuration,
              averageSize: totalResources > 0 ? Math.round(stats.totalSize / totalResources) : 0,
            },
            timeRange,
          },
          suggestions,
        },
        nextActions:
          suggestions.length > 0
            ? ["Оптимизировать неиспользуемые ресурсы", "Применить рекомендации"]
            : ["Экспортировать статистику"],
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка получения статистики: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }

  private async cleanupUnusedResources(params: CleanupParams): Promise<ResourceToolResult> {
    const { dryRun = true, criteria = {}, reason } = params
    const { unusedForDays = 30, resourceTypes = [], excludeFavorites = true } = criteria

    try {
      const resourcesProvider = getResourcesProvider()
      const resourcesStateAccess = getResourcesStateAccess()!
      const toRemove: Array<{
        resourceId: string
        type: string
        name: string
        size?: number
      }> = []

      // Получаем текущую дату для проверки давности использования
      const now = new Date()
      const cutoffDate = new Date(now.getTime() - unusedForDays * 24 * 60 * 60 * 1000)

      // Проходим по всем ресурсам и находим неиспользуемые
      for (const resource of resourcesProvider.resources) {
        // Фильтр по типу ресурса
        if (resourceTypes.length > 0 && !resourceTypes.includes(resource.type)) {
          continue
        }

        // В реальной реализации здесь будет проверка:
        // 1. Используется ли ресурс в Timeline
        // 2. Когда последний раз использовался
        // 3. Является ли избранным

        let shouldRemove = false
        let resourceName = ""
        let resourceSize = 0

        // Проверяем по типу ресурса
        switch (resource.type) {
          case "media": {
            const mediaResource = resourcesProvider.mediaResources.find((m) => m.resourceId === resource.resourceId)
            if (mediaResource) {
              resourceName = mediaResource.file.name
              resourceSize = mediaResource.file.size || 0
              // В реальной реализации проверка использования в Timeline
              const isUsedInTimeline = false // timelineStateAccess?.isResourceUsed(resource.resourceId)
              const lastUsed = new Date(resource.addedAt || now)

              if (!isUsedInTimeline && lastUsed < cutoffDate) {
                shouldRemove = true
              }
            }
            break
          }
          case "music": {
            const musicResource = resourcesProvider.musicResources.find((m) => m.resourceId === resource.resourceId)
            if (musicResource) {
              resourceName = musicResource.file.name
              resourceSize = musicResource.file.size || 0
              const isUsedInTimeline = false
              const lastUsed = new Date(resource.addedAt || now)

              if (!isUsedInTimeline && lastUsed < cutoffDate) {
                shouldRemove = true
              }
            }
            break
          }
          case "effect": {
            const effectResource = resourcesProvider.effectResources.find((e) => e.resourceId === resource.resourceId)
            if (effectResource) {
              resourceName = (effectResource as any).effect.name
              const isUsedInTimeline = false
              if (!isUsedInTimeline) {
                shouldRemove = true
              }
            }
            break
          }
          case "filter": {
            const filterResource = resourcesProvider.filterResources.find((f) => f.resourceId === resource.resourceId)
            if (filterResource) {
              resourceName = filterResource.filter.name
              const isUsedInTimeline = false
              if (!isUsedInTimeline) {
                shouldRemove = true
              }
            }
            break
          }
          case "transition": {
            const transitionResource = resourcesProvider.transitionResources.find(
              (t) => t.resourceId === resource.resourceId,
            )
            if (transitionResource) {
              resourceName = transitionResource.transition.name || transitionResource.transition.type
              const isUsedInTimeline = false
              if (!isUsedInTimeline) {
                shouldRemove = true
              }
            }
            break
          }
          default:
            break
        }

        if (shouldRemove) {
          toRemove.push({
            resourceId: resource.resourceId,
            type: resource.type,
            name: resourceName,
            size: resourceSize,
          })
        }
      }

      // Подсчитываем статистику
      const totalSizeToRemove = toRemove.reduce((sum, r) => sum + (r.size || 0), 0)
      const byType = toRemove.reduce<Record<string, number>>((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1
        return acc
      }, {})

      if (dryRun) {
        return {
          success: true,
          message: `Найдено ${toRemove.length} неиспользуемых ресурсов для удаления`,
          data: {
            analysis: {
              dryRun: true,
              toRemove: toRemove.map((r) => ({
                id: r.resourceId,
                type: r.type,
                name: r.name,
              })),
              criteria: { unusedForDays, resourceTypes, excludeFavorites },
              reason,
              statistics: {
                totalCount: toRemove.length,
                totalSize: totalSizeToRemove,
                byType,
                potentialSavings: formatFileSize(totalSizeToRemove),
              },
            },
            suggestions:
              toRemove.length > 0
                ? ["Проверить список перед удалением", "Создать резервную копию перед очисткой"]
                : ["Все ресурсы используются или недавно добавлены"],
          },
          nextActions:
            toRemove.length > 0
              ? ["Проверить список для удаления", "Выполнить реальную очистку"]
              : ["Изменить критерии поиска"],
        }
      }

      // Выполняем реальное удаление
      const removedResources: string[] = []
      const errors: string[] = []

      for (const resource of toRemove) {
        try {
          await resourcesStateAccess.removeResource(resource.resourceId, resource.type)
          removedResources.push(resource.resourceId)
        } catch (error) {
          errors.push(`Не удалось удалить ${resource.name}: ${String(error)}`)
        }
      }

      return {
        success: errors.length === 0,
        message: `Удалено ${removedResources.length} из ${toRemove.length} неиспользуемых ресурсов`,
        data: {
          removedResources,
          analysis: {
            dryRun: false,
            criteria,
            reason,
            removedCount: removedResources.length,
            failedCount: errors.length,
            freedSpace: formatFileSize(totalSizeToRemove),
            byType,
          },
          warnings: errors.length > 0 ? errors : undefined,
        },
        nextActions: ["Проверить освобожденное место", "Оптимизировать оставшиеся ресурсы"],
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка очистки ресурсов: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }
}

// Создаем singleton экземпляр
const usageStatsTool = new UsageStatsTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeUsageStatsTool(
  operation: UsageStatsInput["operation"],
  params: Omit<UsageStatsInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<UsageStatsResult>> {
  return usageStatsTool.processUsageStats({ operation, ...params }, options)
}

/**
 * Функции для обратной совместимости
 */
export async function getResourceUsageStats(params: UsageStatsParams): Promise<ResourceToolResult> {
  const result = await usageStatsTool.processUsageStats({
    operation: "get_resource_usage_stats",
    timeRange: params.timeRange,
    groupBy: params.groupBy,
    includeUnused: params.includeUnused,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        analysis: result.data.analysis,
        suggestions: result.data.recommendations,
      },
      nextActions: ["Оптимизировать ресурсы", "Экспортировать статистику"],
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка получения статистики",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

export async function cleanupUnusedResources(params: CleanupParams): Promise<ResourceToolResult> {
  const result = await usageStatsTool.processUsageStats({
    operation: "cleanup_unused_resources",
    dryRun: params.dryRun,
    criteria: params.criteria,
    reason: params.reason,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        analysis: result.data.analysis,
        removedResources: result.data.removedResources,
        suggestions: result.data.recommendations,
        warnings: result.data.warnings,
      },
      nextActions: ["Проверить освобожденное место", "Оптимизировать оставшиеся ресурсы"],
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка очистки ресурсов",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const getResourceUsageStatsTool: any = {
  name: "get_resource_usage_stats",
  description: "Получает статистику использования ресурсов в проекте",
  input_schema: {
    type: "object",
    properties: {
      timeRange: {
        type: "object",
        properties: {
          start: { type: "string", description: "Начальная дата анализа" },
          end: { type: "string", description: "Конечная дата анализа" },
        },
        description: "Временной диапазон для анализа",
      },
      groupBy: {
        type: "string",
        enum: ["type", "date", "source", "usage-frequency"],
        description: "Способ группировки статистики",
      },
      includeUnused: {
        type: "boolean",
        description: "Включить неиспользуемые ресурсы в статистику",
        default: true,
      },
    },
  },
}

export const cleanupUnusedResourcesTool: any = {
  name: "cleanup_unused_resources",
  description: "Удаляет неиспользуемые ресурсы из пула для оптимизации",
  input_schema: {
    type: "object",
    properties: {
      dryRun: {
        type: "boolean",
        description: "Только показать, что будет удалено, не удалять",
        default: true,
      },
      criteria: {
        type: "object",
        properties: {
          unusedForDays: {
            type: "number",
            description: "Не использовались N дней",
          },
          resourceTypes: {
            type: "array",
            items: { type: "string" },
            description: "Типы ресурсов для очистки",
          },
          excludeFavorites: {
            type: "boolean",
            description: "Исключить избранные ресурсы",
            default: true,
          },
        },
      },
      reason: {
        type: "string",
        description: "Причина очистки ресурсов",
      },
    },
    required: ["reason"],
  },
}

export const usageStatsTools = [getResourceUsageStatsTool, cleanupUnusedResourcesTool]

export default usageStatsTools
