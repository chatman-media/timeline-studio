/**
 * AI инструмент для анализа медиа браузера с BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { AnalyzeBrowserParams, BrowserToolResult } from "./types"
import {
  filterFiles,
  formatDuration,
  formatFileSize,
  getBrowserFiles,
  groupFiles,
  hasBrowserAccess,
  sortFiles,
} from "./utils/helpers"

// Типы для операций анализа браузера
export interface BrowserAnalysisInput {
  operation: "analyze_media_browser"
  tab?: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  filters?: {
    searchQuery?: string
    fileTypes?: ("video" | "audio" | "image")[]
    dateRange?: {
      start?: string
      end?: string
    }
    sizeRange?: {
      min?: number
      max?: number
    }
    durationRange?: {
      min?: number
      max?: number
    }
    tags?: string[]
    location?: string
  }
  includeMetadata?: boolean
  groupBy?: "type" | "date" | "size" | "location" | "tags"
  sortBy?: "name" | "date" | "size" | "duration" | "type"
  sortOrder?: "asc" | "desc"
}

export interface BrowserAnalysisResult {
  operation: string
  success: boolean
  files?: any[]
  groups?: any[]
  analysis?: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для анализа браузера с унифицированной обработкой ошибок
 */
export class BrowserAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("BrowserAnalysisTool", logger)
  }

  /**
   * Выполняет анализ медиа браузера
   */
  public async processBrowserAnalysis(
    input: BrowserAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<BrowserAnalysisResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        if (data.operation !== "analyze_media_browser") {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        if (!data.tab) {
          errors.push("Требуется указать tab для анализа")
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

      const filters: any = input.filters || {}
      if (filters.dateRange && (!filters.dateRange.start || !filters.dateRange.end)) {
        delete filters.dateRange
      }
      if (filters.sizeRange && (!filters.sizeRange.min || !filters.sizeRange.max)) {
        delete filters.sizeRange
      }

      const analysisResult = await this.analyzeMediaBrowser({
        tab: input.tab!,
        filters,
        includeMetadata: input.includeMetadata ?? true,
        groupBy: input.groupBy,
        sortBy: input.sortBy || "name",
        sortOrder: input.sortOrder || "asc",
      })

      if (!analysisResult.success) {
        throw new Error(analysisResult.message)
      }

      const result: BrowserAnalysisResult = {
        operation: input.operation,
        success: true,
        files: analysisResult.data?.files,
        groups: analysisResult.data?.groups,
        analysis: analysisResult.data?.analysis,
        message: analysisResult.message,
        recommendations: analysisResult.data?.suggestions || [],
      }

      return result
    }, options)
  }

  private async analyzeMediaBrowser(params: AnalyzeBrowserParams): Promise<BrowserToolResult> {
    const { tab, filters = {}, includeMetadata = true, groupBy, sortBy = "name", sortOrder = "asc" } = params

    try {
      // Получаем файлы из указанной вкладки
      let files = getBrowserFiles(tab)

      // Применяем фильтры
      if (Object.keys(filters).length > 0) {
        files = filterFiles(files, filters)
      }

      // Сортируем файлы
      if (sortBy) {
        files = sortFiles(files, sortBy, sortOrder)
      }

      // Подготавливаем данные для анализа
      const analysis: any = {
        tab,
        totalFiles: files.length,
        filters: filters,
        sorting: { sortBy, sortOrder },
      }

      // Статистика по типам файлов
      const fileTypeStats = files.reduce((acc: Record<string, number>, file) => {
        const type = file.type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})

      // Общая статистика
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
      const totalDuration = files.reduce((sum, file) => sum + (file.duration || 0), 0)
      const averageSize = files.length > 0 ? totalSize / files.length : 0

      analysis.statistics = {
        fileTypeBreakdown: fileTypeStats,
        totalSize: totalSize,
        totalDuration: totalDuration,
        averageSize: averageSize,
        formattedTotalSize: formatFileSize(totalSize),
        formattedTotalDuration: formatDuration(totalDuration),
        formattedAverageSize: formatFileSize(averageSize),
      }

      // Группировка, если запрошена
      let groups: any[] = []
      if (groupBy) {
        groups = groupFiles(files, groupBy)
        analysis.grouping = {
          method: groupBy,
          totalGroups: groups.length,
          groupSummary: groups.map((group) => ({
            name: group.name,
            count: group.count,
            totalSize: formatFileSize(group.totalSize),
            totalDuration: group.totalDuration ? formatDuration(group.totalDuration) : undefined,
          })),
        }
      }

      // Подготавливаем список файлов для возврата
      const resultFiles = includeMetadata
        ? files
        : files.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            duration: f.duration,
          }))

      // Генерируем предложения
      const suggestions: string[] = []

      if (files.length === 0) {
        suggestions.push(`Во вкладке ${tab} нет файлов, соответствующих критериям`)
        if (Object.keys(filters).length > 0) {
          suggestions.push("Попробуйте изменить критерии фильтрации")
        }
      } else {
        if (files.length > 100) {
          suggestions.push("Большое количество файлов - рассмотрите дополнительную фильтрацию")
        }

        if (totalSize > 1000 * 1024 * 1024) {
          // > 1GB
          suggestions.push("Общий размер файлов превышает 1GB - проверьте доступное место")
        }

        const videoFiles = files.filter((f) => f.type?.includes("video")).length
        const audioFiles = files.filter((f) => f.type?.includes("audio")).length

        if (tab === "media" && videoFiles === 0 && audioFiles > 0) {
          suggestions.push("Найдены только аудио файлы - добавьте видео для полноценного монтажа")
        }

        if (tab === "media" && videoFiles > 0 && audioFiles === 0) {
          suggestions.push("Найдены только видео файлы - рассмотрите добавление фоновой музыки")
        }
      }

      // Определяем следующие действия
      const nextActions: string[] = []
      if (files.length > 0) {
        nextActions.push("Выбрать файлы для добавления в ресурсы")
        if (!groupBy) {
          nextActions.push("Сгруппировать файлы для лучшей организации")
        }
        nextActions.push("Применить дополнительные фильтры")
      } else {
        nextActions.push("Изменить критерии поиска")
        nextActions.push("Проверить другие вкладки браузера")
      }

      return {
        success: true,
        message: `Анализ вкладки ${tab} завершен: найдено ${files.length} файлов`,
        data: {
          files: resultFiles,
          groups: groups.length > 0 ? groups : undefined,
          analysis,
          suggestions,
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка анализа браузера: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }
}

// Создаем singleton экземпляр
const browserAnalysisTool = new BrowserAnalysisTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeBrowserAnalysisTool(
  operation: BrowserAnalysisInput["operation"],
  params: Omit<BrowserAnalysisInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<BrowserAnalysisResult>> {
  return browserAnalysisTool.processBrowserAnalysis({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function analyzeMediaBrowser(params: AnalyzeBrowserParams): Promise<BrowserToolResult> {
  const result = await browserAnalysisTool.processBrowserAnalysis({
    operation: "analyze_media_browser",
    tab: params.tab,
    filters: params.filters,
    includeMetadata: params.includeMetadata,
    groupBy: params.groupBy,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })

  if (result.success && result.data) {
    return {
      success: true,
      message: result.data.message || "Анализ завершен",
      data: {
        files: result.data.files,
        groups: result.data.groups,
        analysis: result.data.analysis,
        suggestions: result.data.recommendations,
      },
      nextActions: ["Выбрать файлы", "Организовать контент"],
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка анализа браузера",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const analyzeMediaBrowserTool = {
  name: "analyze_media_browser",
  description: "Анализирует все доступные медиафайлы в браузере по указанным критериям",
  input_schema: {
    type: "object",
    properties: {
      tab: {
        type: "string",
        enum: ["media", "effects", "filters", "transitions", "templates", "music"],
        description: "Вкладка браузера для анализа",
      },
      filters: {
        type: "object",
        properties: {
          searchQuery: {
            type: "string",
            description: "Поисковый запрос для фильтрации файлов",
          },
          fileTypes: {
            type: "array",
            items: { type: "string", enum: ["video", "audio", "image"] },
            description: "Типы файлов для включения в анализ",
          },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", description: "Начальная дата (ISO format)" },
              end: { type: "string", description: "Конечная дата (ISO format)" },
            },
            description: "Диапазон дат создания/изменения файлов",
          },
        },
        description: "Критерии фильтрации файлов",
      },
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные файлов в анализ",
        default: true,
      },
      groupBy: {
        type: "string",
        enum: ["type", "date", "size", "location", "tags"],
        description: "Способ группировки результатов",
      },
      sortBy: {
        type: "string",
        enum: ["name", "date", "size", "duration", "type"],
        description: "Критерий сортировки",
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
        description: "Порядок сортировки",
        default: "asc",
      },
    },
    required: ["tab"],
  },
}
