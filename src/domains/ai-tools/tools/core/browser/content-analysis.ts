/**
 * AI инструменты для анализа контента и предложения источников с BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { AnalyzeMissingContentParams, BrowserToolResult, ExportFileListParams, SuggestImportParams } from "./types"
import { formatFileSize, getBrowserFiles, getBrowserStats, hasBrowserAccess } from "./utils/helpers"

// Типы для операций анализа контента
export interface ContentAnalysisInput {
  operation: "analyze_missing_content" | "suggest_import_sources" | "export_file_list"
  analysisScope?: "project" | "resources" | "timeline" | "all"
  includeRecent?: boolean
  checkExternal?: boolean
  contentType?: "video" | "audio" | "image" | "effect" | "filter" | "transition" | "template" | "music"
  style?: string
  mood?: string
  projectType?: string
  includeAI?: boolean
  includeFree?: boolean
  includePremium?: boolean
  format?: "json" | "csv" | "text" | "xml"
  includeMetadata?: boolean
  filterCriteria?: {
    selectedOnly?: boolean
    fileTypes?: string[]
    sizeRange?: {
      min?: number
      max?: number
    }
    dateRange?: {
      start?: string
      end?: string
    }
  }
  reason?: string
}

export interface ContentAnalysisResult {
  operation: string
  success: boolean
  missingContent?: {
    categories: string[]
    suggestions: any[]
    priority: string[]
    analysis: any
  }
  importSources?: {
    sources: any[]
    recommendations: any[]
    categories: string[]
  }
  exportData?: {
    format: string
    fileCount: number
    exportPath: string
    statistics: any
  }
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для анализа контента с унифицированной обработкой ошибок
 */
export class ContentAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ContentAnalysisTool", logger)
  }

  /**
   * Выполняет операции анализа контента
   */
  public async processContentAnalysis(
    input: ContentAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ContentAnalysisResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        const validOperations = ["analyze_missing_content", "suggest_import_sources", "export_file_list"]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        // Специфичные валидации
        if (data.operation === "analyze_missing_content" && !data.analysisScope) {
          errors.push("Требуется analysisScope для операции analyze_missing_content")
        }

        if (data.operation === "suggest_import_sources" && !data.contentType) {
          errors.push("Требуется contentType для операции suggest_import_sources")
        }

        if (data.operation === "export_file_list" && !data.format) {
          errors.push("Требуется format для операции export_file_list")
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      // Проверка доступа к браузеру
      if (!hasBrowserAccess()) {
        throw new Error("Доступ к браузеру не сконфигурирован")
      }

      let result: ContentAnalysisResult

      switch (input.operation) {
        case "analyze_missing_content":
          const missingResult = await this.analyzeMissingContent({
            analysisScope: input.analysisScope!,
            includeRecent: input.includeRecent ?? true,
            checkExternal: input.checkExternal ?? false,
          })
          if (!missingResult.success) {
            throw new Error(missingResult.message)
          }
          result = {
            operation: input.operation,
            success: true,
            missingContent: missingResult.data?.missingContent,
            message: missingResult.message,
            recommendations: missingResult.data?.suggestions || [],
          }
          break

        case "suggest_import_sources":
          const sourcesResult = await this.suggestImportSources({
            contentType: input.contentType!,
            style: input.style,
            mood: input.mood,
            projectType: input.projectType,
            includeAI: input.includeAI ?? true,
            includeFree: input.includeFree ?? true,
            includePremium: input.includePremium ?? false,
          })
          if (!sourcesResult.success) {
            throw new Error(sourcesResult.message)
          }
          result = {
            operation: input.operation,
            success: true,
            importSources: {
              websites: sourcesResult.data?.importSources?.sources || [],
              stockSites: [],
              aiTools: [],
              recommendations: sourcesResult.data?.importSources?.recommendations || [],
            },
            message: sourcesResult.message,
            recommendations: sourcesResult.data?.suggestions || [],
          }
          break

        case "export_file_list":
          const exportResult = await this.exportFileList({
            format: input.format!,
            includeMetadata: input.includeMetadata ?? true,
            filterCriteria: input.filterCriteria || {},
          })
          if (!exportResult.success) {
            throw new Error(exportResult.message)
          }
          result = {
            operation: input.operation,
            success: true,
            exportData: {
              format: exportResult.data?.exportData?.format || input.format!,
              content: exportResult.data?.exportData?.content,
              metadata: exportResult.data?.exportData?.statistics,
            },
            message: exportResult.message,
            recommendations: exportResult.data?.suggestions || [],
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
    }, options)
  }

  private async analyzeMissingContent(params: AnalyzeMissingContentParams): Promise<BrowserToolResult> {
    const { analysisScope, includeRecent = true, checkExternal = false } = params

    try {
      const files = getBrowserFiles()
      const stats = getBrowserStats()

      // Анализ отсутствующего контента
      const missingCategories: string[] = []
      const suggestions: any[] = []
      const priority: string[] = []

      // Проверка различных типов контента
      const videoFiles = files.filter((f) => f.type === "video")
      const audioFiles = files.filter((f) => f.type === "audio")
      const imageFiles = files.filter((f) => f.type === "image")

      if (videoFiles.length === 0) {
        missingCategories.push("video")
        suggestions.push({
          type: "video",
          reason: "Нет видео файлов в проекте",
          action: "Добавить видео контент",
          priority: "high",
        })
        priority.push("video")
      }

      if (audioFiles.length === 0) {
        missingCategories.push("audio")
        suggestions.push({
          type: "audio",
          reason: "Отсутствует аудио контент",
          action: "Добавить музыку или звуковые эффекты",
          priority: "medium",
        })
      }

      if (imageFiles.length === 0) {
        missingCategories.push("images")
        suggestions.push({
          type: "images",
          reason: "Нет изображений",
          action: "Добавить изображения или графику",
          priority: "low",
        })
      }

      // Анализ по областям
      const analysis = {
        scope: analysisScope,
        totalFiles: files.length,
        categories: {
          video: videoFiles.length,
          audio: audioFiles.length,
          images: imageFiles.length,
        },
        recentFiles: includeRecent
          ? files.filter((f) => {
              const fileDate = new Date(f.modifiedAt || Date.now())
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              return fileDate > weekAgo
            }).length
          : 0,
        externalSources: checkExternal ? 0 : undefined, // В реальной реализации проверка внешних источников
      }

      const nextActions: string[] = []
      if (missingCategories.length > 0) {
        nextActions.push("Импортировать недостающий контент")
        nextActions.push("Настроить источники контента")
      } else {
        nextActions.push("Контент полный - можно приступать к монтажу")
      }

      return {
        success: true,
        message: `Анализ контента завершен: найдено ${missingCategories.length} пропущенных категорий`,
        data: {
          missingContent: {
            categories: missingCategories,
            suggestions,
            priority,
            analysis,
          },
          suggestions:
            missingCategories.length > 0
              ? ["Добавить недостающий контент", "Проверить качество файлов"]
              : ["Контент готов к использованию"],
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка анализа контента: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }

  private async suggestImportSources(params: SuggestImportParams): Promise<BrowserToolResult> {
    const {
      contentType,
      style,
      mood,
      projectType,
      includeAI = true,
      includeFree = true,
      includePremium = false,
    } = params

    try {
      const sources: any[] = []
      const recommendations: any[] = []
      const categories: string[] = []

      // Предлагаем источники на основе типа контента
      switch (contentType) {
        case "video":
          categories.push("Stock Video", "User Generated", "AI Generated")
          if (includeFree) {
            sources.push({
              name: "Pexels",
              type: "free",
              category: "Stock Video",
              quality: "HD/4K",
              license: "Free for commercial use",
            })
            sources.push({
              name: "Pixabay",
              type: "free",
              category: "Stock Video",
              quality: "HD",
              license: "Pixabay License",
            })
          }
          if (includePremium) {
            sources.push({
              name: "Shutterstock",
              type: "premium",
              category: "Stock Video",
              quality: "4K/HD",
              license: "Standard/Extended",
            })
          }
          if (includeAI) {
            sources.push({
              name: "RunwayML",
              type: "ai",
              category: "AI Generated",
              quality: "HD",
              license: "Generated content",
            })
          }
          break

        case "audio":
        case "music":
          categories.push("Music", "Sound Effects", "Voice")
          if (includeFree) {
            sources.push({
              name: "Freesound",
              type: "free",
              category: "Sound Effects",
              quality: "Various",
              license: "Creative Commons",
            })
            sources.push({
              name: "YouTube Audio Library",
              type: "free",
              category: "Music",
              quality: "High",
              license: "Free to use",
            })
          }
          break

        case "image":
          categories.push("Photography", "Illustrations", "Graphics")
          if (includeFree) {
            sources.push({
              name: "Unsplash",
              type: "free",
              category: "Photography",
              quality: "High Resolution",
              license: "Unsplash License",
            })
          }
          break

        default:
          sources.push({
            name: "Generic Content Library",
            type: "mixed",
            category: "General",
            quality: "Various",
            license: "Mixed",
          })
      }

      // Рекомендации на основе стиля и настроения
      if (style || mood || projectType) {
        recommendations.push({
          type: "style_match",
          suggestion: `Поиск контента в стиле "${style || "современный"}"`,
          sources: sources.slice(0, 2), // Топ 2 источника для стиля
        })
      }

      if (projectType) {
        recommendations.push({
          type: "project_specific",
          suggestion: `Специфичный контент для проекта типа "${projectType}"`,
          sources: sources.filter((s) => s.category !== "AI Generated"),
        })
      }

      const nextActions = [
        "Просмотреть рекомендуемые источники",
        "Настроить параметры поиска",
        "Импортировать подходящий контент",
      ]

      return {
        success: true,
        message: `Найдено ${sources.length} источников для типа "${contentType}"`,
        data: {
          importSources: {
            websites: sources,
            stockSites: [],
            aiTools: [],
            recommendations,
          },
          suggestions: [
            "Проверьте лицензии перед использованием",
            "Учитывайте качество контента для проекта",
            "Комбинируйте разные источники для разнообразия",
          ],
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка предложения источников: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }

  private async exportFileList(params: ExportFileListParams): Promise<BrowserToolResult> {
    const { format, includeMetadata = true, filterCriteria = {} } = params

    try {
      let files = getBrowserFiles()

      // Применение фильтров
      if (filterCriteria.selectedOnly) {
        // В реальной реализации фильтрация выбранных файлов
        files = files.slice(0, Math.floor(files.length / 2))
      }

      if (filterCriteria.fileTypes && filterCriteria.fileTypes.length > 0) {
        files = files.filter((f) => filterCriteria.fileTypes!.includes(f.extension || ""))
      }

      if (filterCriteria.sizeRange) {
        const { min = 0, max = Number.MAX_SAFE_INTEGER } = filterCriteria.sizeRange
        files = files.filter((f) => {
          const size = f.size || 0
          return size >= min && size <= max
        })
      }

      if (filterCriteria.dateRange) {
        const { start, end } = filterCriteria.dateRange
        if (start || end) {
          files = files.filter((f) => {
            const fileDate = new Date(f.modifiedAt || Date.now())
            const startDate = start ? new Date(start) : new Date(0)
            const endDate = end ? new Date(end) : new Date()
            return fileDate >= startDate && fileDate <= endDate
          })
        }
      }

      // Подготовка данных для экспорта
      let exportContent = ""
      const exportPath = `/exports/file_list_${Date.now()}.${format}`

      switch (format) {
        case "json":
          const jsonData = files.map((f) =>
            includeMetadata
              ? f
              : {
                  name: f.name,
                  path: f.path,
                  size: f.size,
                  type: f.type,
                },
          )
          exportContent = JSON.stringify(jsonData, null, 2)
          break

        case "csv":
          const headers = includeMetadata ? "Name,Path,Size,Type,Modified,Duration" : "Name,Path,Size,Type"
          const rows = files.map((f) => {
            const basicFields = [f.name, f.path, f.size || 0, f.type || ""]
            if (includeMetadata) {
              basicFields.push(f.modifiedAt || "", f.duration || "")
            }
            return basicFields.join(",")
          })
          exportContent = [headers, ...rows].join("\n")
          break

        case "text":
          exportContent = files
            .map((f) => (includeMetadata ? `${f.name} (${f.type}, ${formatFileSize(f.size || 0)})` : f.name))
            .join("\n")
          break

        case "xml":
          const xmlFiles = files
            .map(
              (f) => `
            <file>
              <name>${f.name}</name>
              <path>${f.path}</path>
              <size>${f.size || 0}</size>
              <type>${f.type || ""}</type>
              ${includeMetadata ? `<modified>${f.modifiedAt || ""}</modified>` : ""}
            </file>`,
            )
            .join("")
          exportContent = `<?xml version="1.0"?>\n<filelist>\n${xmlFiles}\n</filelist>`
          break
      }

      // Статистика экспорта
      const statistics = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
        fileTypes: files.reduce<Record<string, number>>((acc, f) => {
          const type = f.type || "unknown"
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
        exportSize: exportContent.length,
      }

      const nextActions = [
        "Скачать экспортированный файл",
        "Проверить содержимое экспорта",
        "Импортировать в другие инструменты",
      ]

      return {
        success: true,
        message: `Экспортировано ${files.length} файлов в формате ${format}`,
        data: {
          exportData: {
            format,
            content: files,
            metadata: {
              fileCount: files.length,
              exportPath,
              statistics,
            },
          },
          suggestions: [
            "Проверьте экспортированные данные",
            "Сохраните файл в безопасном месте",
            "Используйте фильтры для точного экспорта",
          ],
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка экспорта списка файлов: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }
}

// Создаем singleton экземпляр
const contentAnalysisTool = new ContentAnalysisTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeContentAnalysisTool(
  operation: ContentAnalysisInput["operation"],
  params: Omit<ContentAnalysisInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<ContentAnalysisResult>> {
  return contentAnalysisTool.processContentAnalysis({ operation, ...params }, options)
}

/**
 * Функции для обратной совместимости
 */
export async function analyzeMissingContent(params: AnalyzeMissingContentParams): Promise<BrowserToolResult> {
  const result = await contentAnalysisTool.processContentAnalysis({
    operation: "analyze_missing_content",
    analysisScope: params.analysisScope,
    includeRecent: params.includeRecent,
    checkExternal: params.checkExternal,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data?.message || result.message,
      data: {
        missingContent: result.data.missingContent,
        suggestions: result.data?.recommendations,
      },
      nextActions: ["Добавить недостающий контент", "Проверить источники"],
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка анализа контента",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

export async function suggestImportSources(params: SuggestImportParams): Promise<BrowserToolResult> {
  const result = await contentAnalysisTool.processContentAnalysis({
    operation: "suggest_import_sources",
    contentType: params.contentType,
    style: params.style,
    mood: params.mood,
    projectType: params.projectType,
    includeAI: params.includeAI,
    includeFree: params.includeFree,
    includePremium: params.includePremium,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data?.message || result.message,
      data: {
        importSources: result.data?.importSources,
        suggestions: result.data?.recommendations,
      },
      nextActions: ["Просмотреть источники", "Импортировать контент"],
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка предложения источников",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

export async function exportFileList(params: ExportFileListParams): Promise<BrowserToolResult> {
  const result = await contentAnalysisTool.processContentAnalysis({
    operation: "export_file_list",
    format: params.format,
    includeMetadata: params.includeMetadata,
    filterCriteria: params.filterCriteria,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data?.message || result.message,
      data: {
        exportData: result.data.exportData,
        suggestions: result.data?.recommendations,
      },
      nextActions: ["Скачать файл", "Проверить экспорт"],
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка экспорта файлов",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const analyzeMissingContentTool = {
  name: "analyze_missing_content",
  description: "Анализирует отсутствующий контент в проекте и предлагает что добавить",
  input_schema: {
    type: "object",
    properties: {
      analysisScope: {
        type: "string",
        enum: ["project", "resources", "timeline", "all"],
        description: "Область анализа контента",
      },
      includeRecent: {
        type: "boolean",
        description: "Учитывать недавно добавленные файлы",
        default: true,
      },
      checkExternal: {
        type: "boolean",
        description: "Проверять внешние источники",
        default: false,
      },
    },
    required: ["analysisScope"],
  },
}

export const suggestImportSourcesTool = {
  name: "suggest_import_sources",
  description: "Предлагает источники для импорта контента на основе потребностей проекта",
  input_schema: {
    type: "object",
    properties: {
      contentType: {
        type: "string",
        enum: ["video", "audio", "image", "effect", "filter", "transition", "template", "music"],
        description: "Тип контента для поиска",
      },
      style: {
        type: "string",
        description: "Стиль контента",
      },
      mood: {
        type: "string",
        description: "Настроение/атмосфера",
      },
      projectType: {
        type: "string",
        description: "Тип проекта",
      },
    },
    required: ["contentType"],
  },
}

export const exportFileListTool = {
  name: "export_file_list",
  description: "Экспортирует список файлов в различных форматах",
  input_schema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv", "text", "xml"],
        description: "Формат экспорта",
      },
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные файлов",
        default: true,
      },
      filterCriteria: {
        type: "object",
        description: "Критерии фильтрации файлов",
        properties: {
          selectedOnly: { type: "boolean" },
          fileTypes: { type: "array", items: { type: "string" } },
        },
      },
    },
    required: ["format"],
  },
}

export const contentAnalysisTools = [analyzeMissingContentTool, suggestImportSourcesTool, exportFileListTool]

export default contentAnalysisTools
