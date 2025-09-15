/**
 * AI инструмент для экспорта списка ресурсов с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { ExportListParams, ResourceToolResult } from "./types"
import { getResourcesProvider, groupResourcesByType, hasResourcesAccess } from "./utils/helpers"

// Типы для операций экспорта ресурсов
export interface ExportResourcesInput {
  operation: "export_resource_list"
  format: "json" | "csv" | "text" | "markdown"
  includeMetadata?: boolean
  filterCriteria?: {
    resourceTypes?: string[]
    usedOnly?: boolean
    addedAfter?: string
  }
  reason?: string
}

export interface ExportResourcesResult {
  operation: string
  success: boolean
  exportData?: {
    format: string
    timestamp: string
    includeMetadata: boolean
    filterCriteria: any
    resourceCount: number
    exportPath: string
    mimeType: string
    contentSize: number
    statistics: any
  }
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для экспорта ресурсов с унифицированной обработкой ошибок
 */
export class ExportResourcesTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ExportResourcesTool", logger)
  }

  /**
   * Выполняет экспорт ресурсов
   */
  public async processResourcesExport(
    input: ExportResourcesInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ExportResourcesResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          const validFormats = ["json", "csv", "text", "markdown"]
          if (!validFormats.includes(data.format)) {
            errors.push(`Неподдерживаемый формат: ${data.format}`)
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

        const result = await this.exportResourceList({
          format: input.format,
          includeMetadata: input.includeMetadata ?? true,
          filterCriteria: input.filterCriteria ?? {},
        })

        if (!result.success) {
          throw new Error(result.message)
        }

        return {
          operation: input.operation,
          success: true,
          exportData: result.data?.analysis,
          message: result.message,
          recommendations: result.data?.suggestions || [],
        }
      },
      options,
    )
  }

  private async exportResourceList(params: ExportListParams): Promise<ResourceToolResult> {
    const { format, includeMetadata = true, filterCriteria = {} } = params

    if (!hasResourcesAccess()) {
      return {
        success: false,
        message: "Resources state access не настроен",
        errors: ["Доступ к ресурсам не сконфигурирован"],
      }
    }

    try {
      const resourcesProvider = getResourcesProvider()
      let resourcesToExport = [...resourcesProvider.resources]

      // Применяем фильтры
      if (filterCriteria.resourceTypes && filterCriteria.resourceTypes.length > 0) {
        resourcesToExport = resourcesToExport.filter((r) => filterCriteria.resourceTypes!.includes((r as any).type))
      }

      if (filterCriteria.usedOnly) {
        // В реальной реализации фильтр по использованию в Timeline
        // resourcesToExport = resourcesToExport.filter(r => timelineStateAccess?.isResourceUsed(r.resourceId))
      }

      if (filterCriteria.addedAfter) {
        const afterDate = new Date(filterCriteria.addedAfter)
        resourcesToExport = resourcesToExport.filter((r) => new Date(r.addedAt || 0) >= afterDate)
      }

      // Собираем данные для экспорта
      const exportItems = resourcesToExport.map((resource) => {
        const baseData: any = {
          id: resource.resourceId,
          type: resource.type,
          addedAt: resource.addedAt,
        }

        if (includeMetadata) {
          // Добавляем метаданные в зависимости от типа
          switch (resource.type) {
            case "media":
            case "music": {
              const mediaResource =
                resourcesProvider.mediaResources.find((m) => m.resourceId === resource.resourceId) ||
                resourcesProvider.musicResources.find((m) => m.resourceId === resource.resourceId)
              if (mediaResource) {
                baseData.name = mediaResource.file.name
                baseData.path = mediaResource.file.path
                baseData.size = mediaResource.file.size
                baseData.duration = mediaResource.file.duration
                // Извлекаем resolution и fps из probeData
                if (mediaResource.file.probeData?.streams) {
                  const videoStream = mediaResource.file.probeData.streams.find((s) => s.codec_type === "video")
                  if (videoStream) {
                    baseData.resolution = {
                      width: videoStream.width || 0,
                      height: videoStream.height || 0,
                    }
                    if (videoStream.r_frame_rate) {
                      try {
                        baseData.fps = eval(videoStream.r_frame_rate)
                      } catch {
                        baseData.fps = 30 // default
                      }
                    }
                  }
                }
                baseData.isFavorite = false
              }
              break
            }
            case "effect": {
              const effectResource = resourcesProvider.effectResources.find((e) => e.resourceId === resource.resourceId)
              if (effectResource) {
                baseData.name = effectResource.effect.name
                baseData.category = effectResource.effect.category
                baseData.description = effectResource.effect.description
              }
              break
            }
            case "filter": {
              const filterResource = resourcesProvider.filterResources.find((f) => f.resourceId === resource.resourceId)
              if (filterResource) {
                baseData.name = filterResource.filter.name
                baseData.category = filterResource.filter.category
                baseData.params = filterResource.filter.params
              }
              break
            }
            case "transition": {
              const transitionResource = resourcesProvider.transitionResources.find(
                (t) => t.resourceId === resource.resourceId,
              )
              if (transitionResource) {
                baseData.name = transitionResource.transition.name || transitionResource.transition.type
                baseData.duration = transitionResource.transition.duration
              }
              break
            }
            default:
              break
          }
        }

        return baseData
      })

      // Форматируем данные в зависимости от формата
      let exportContent = ""
      let mimeType = "text/plain"
      let fileExtension = "txt"

      switch (format) {
        case "json":
          exportContent = JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              projectName: "Timeline Studio Project", // В реальной реализации из ProjectSettings
              totalResources: exportItems.length,
              filterCriteria,
              resources: exportItems,
            },
            null,
            2,
          )
          mimeType = "application/json"
          fileExtension = "json"
          break

        case "csv": {
          // Создаем CSV с заголовками
          const headers = ["ID", "Type", "Name", "Added At", "Size", "Duration", "Category"]
          const rows = exportItems.map((item) => [
            item.id,
            item.type,
            item.name || "",
            item.addedAt || "",
            item.size || "",
            item.duration || "",
            item.category || "",
          ])
          exportContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
          mimeType = "text/csv"
          fileExtension = "csv"
          break
        }

        case "markdown": {
          exportContent = `# Timeline Studio Resources Export

**Export Date:** ${new Date().toISOString()}
**Total Resources:** ${exportItems.length}

## Resources by Type

`
          const byType = groupResourcesByType(exportItems)

          for (const [type, items] of Object.entries(byType)) {
            exportContent += `\n### ${type.charAt(0).toUpperCase() + type.slice(1)} (${items.length})\n\n`
            items.forEach((item) => {
              exportContent += `- **${item.name || item.id}**`
              if (item.duration) exportContent += ` - ${(item.duration / 60).toFixed(2)} min`
              if (item.size) exportContent += ` - ${(item.size / 1024 / 1024).toFixed(2)} MB`
              exportContent += "\n"
            })
          }
          mimeType = "text/markdown"
          fileExtension = "md"
          break
        }
        default:
          exportContent = `Timeline Studio Resources Export
================================
Export Date: ${new Date().toISOString()}
Total Resources: ${exportItems.length}

Resources:
${exportItems.map((item) => `- [${item.type}] ${item.name || item.id}`).join("\n")}
`
          break
      }

      // В реальной реализации здесь будет сохранение файла через Tauri API
      const exportPath = `/exports/resources_${Date.now()}.${fileExtension}`

      // Статистика экспорта
      const exportStats = {
        totalCount: exportItems.length,
        byType: exportItems.reduce<Record<string, number>>((acc, item) => {
          acc[item.type] = Number(acc[item.type] || 0) + 1
          return acc
        }, {}),
        totalSize: exportItems.reduce((sum: number, item: any) => sum + Number(item.size || 0), 0),
      }

      return {
        success: true,
        message: `Список ресурсов экспортирован в формате ${format}`,
        data: {
          analysis: {
            format,
            timestamp: new Date().toISOString(),
            includeMetadata,
            filterCriteria,
            resourceCount: exportItems.length,
            exportPath,
            mimeType,
            contentSize: exportContent.length,
            statistics: exportStats,
          },
          suggestions: [
            "Сохранить экспорт для резервного копирования",
            "Использовать для переноса ресурсов между проектами",
          ],
        },
        nextActions: ["Открыть экспортированный файл", "Поделиться экспортом"],
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка экспорта списка ресурсов: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }
}

// Создаем singleton экземпляр
const exportResourcesTool = new ExportResourcesTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeExportResourcesTool(
  format: ExportResourcesInput["format"],
  params: Omit<ExportResourcesInput, "operation" | "format">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<ExportResourcesResult>> {
  return exportResourcesTool.processResourcesExport({ operation: "export_resource_list", format, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function exportResourceList(params: ExportListParams): Promise<ResourceToolResult> {
  const result = await exportResourcesTool.processResourcesExport({
    operation: "export_resource_list",
    format: params.format as any,
    includeMetadata: params.includeMetadata,
    filterCriteria: params.filterCriteria,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        analysis: result.data.exportData,
        suggestions: result.data.recommendations,
      },
      nextActions: ["Открыть экспортированный файл", "Поделиться экспортом"],
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка экспорта",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const exportResourceListTool: any = {
  name: "export_resource_list",
  description: "Экспортирует список ресурсов в различных форматах для внешнего использования",
  input_schema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv", "text", "markdown"],
        description: "Формат экспорта",
      },
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные ресурсов",
        default: true,
      },
      filterCriteria: {
        type: "object",
        properties: {
          resourceTypes: { type: "array", items: { type: "string" } },
          usedOnly: { type: "boolean" },
          addedAfter: { type: "string" },
        },
        description: "Критерии фильтрации для экспорта",
      },
      reason: {
        type: "string",
        description: "Причина экспорта ресурсов",
      },
    },
    required: ["format"],
  },
}

export const exportResourceTools = [exportResourceListTool]

export default exportResourceTools
