/**
 * AI инструменты для операций с файлами в браузере с BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { AnalyzeRelationshipsParams, BrowserToolResult, BulkSelectParams, GetFileGroupsParams } from "./types"
import {
  filterFiles,
  findFilesByPattern,
  formatFileSize,
  getBrowserFiles,
  getBrowserStateAccess,
  getRandomFiles,
  groupFiles,
  hasBrowserAccess,
} from "./utils/helpers"

// Типы для операций с файлами в браузере
export interface FileOperationsInput {
  operation: "get_file_groups" | "analyze_file_relationships" | "bulk_select_files"
  groupBy?: "type" | "date" | "size" | "location" | "series" | "project"
  tab?: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  includeEmpty?: boolean
  analysisType?: "series" | "project" | "similarity" | "dependencies"
  fileIds?: string[]
  includeMetadata?: boolean
  selectionCriteria?: {
    method: "all" | "filtered" | "pattern" | "random" | "smart"
    filters?: {
      fileTypes?: string[]
      dateRange?: {
        start?: string
        end?: string
      }
      sizeRange?: {
        min?: number
        max?: number
      }
      tags?: string[]
      location?: string[]
      pattern?: string
    }
    count?: number
    randomSeed?: number
    smartCriteria?: {
      quality?: string
      diversity?: boolean
      recentFirst?: boolean
    }
  }
  action?: "select" | "deselect" | "toggle"
  reason?: string
}

export interface FileOperationsResult {
  operation: string
  success: boolean
  groups?: any[]
  analysis?: any
  relationships?: any[]
  selectionResult?: {
    action: string
    selectedCount: number
    totalProcessed: number
    criteria: any
  }
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для операций с файлами в браузере с унифицированной обработкой ошибок
 */
export class FileOperationsTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("FileOperationsTool", logger)
  }

  /**
   * Выполняет операции с файлами в браузере
   */
  public async processFileOperations(
    input: FileOperationsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<FileOperationsResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        const validOperations = ["get_file_groups", "analyze_file_relationships", "bulk_select_files"]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        // Специфичные валидации
        if (data.operation === "get_file_groups" && !data.groupBy) {
          errors.push("Требуется groupBy для операции get_file_groups")
        }

        if (data.operation === "analyze_file_relationships" && !data.analysisType) {
          errors.push("Требуется analysisType для операции analyze_file_relationships")
        }

        if (data.operation === "bulk_select_files") {
          if (!data.selectionCriteria || !data.action || !data.reason) {
            errors.push("Требуется selectionCriteria, action и reason для операции bulk_select_files")
          }
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

      let result: FileOperationsResult

      switch (input.operation) {
        case "get_file_groups":
          const groupsResult = await this.getFileGroups({
            groupBy: input.groupBy!,
            tab: input.tab!,
            includeEmpty: input.includeEmpty || false,
          })
          if (!groupsResult.success) {
            throw new Error(groupsResult.message)
          }
          result = {
            operation: input.operation,
            success: true,
            groups: groupsResult.data?.groups,
            analysis: groupsResult.data?.analysis,
            message: groupsResult.message,
            recommendations: groupsResult.data?.suggestions || [],
          }
          break

        case "analyze_file_relationships":
          const relationshipsResult = await this.analyzeFileRelationships({
            tab: input.tab!,
            analysisDepth: input.analysisType === "detailed" ? "detailed" : "basic",
            includeUsage: input.includeMetadata ?? true,
          })
          if (!relationshipsResult.success) {
            throw new Error(relationshipsResult.message)
          }
          result = {
            operation: input.operation,
            success: true,
            analysis: relationshipsResult.data?.analysis,
            message: relationshipsResult.message,
            recommendations: relationshipsResult.data?.suggestions || [],
          }
          break

        case "bulk_select_files":
          const selectResult = await this.bulkSelectFiles({
            selectionCriteria: input.selectionCriteria!,
            action: input.action!,
            reason: input.reason!,
          })
          if (!selectResult.success) {
            throw new Error(selectResult.message)
          }
          result = {
            operation: input.operation,
            success: true,
            message: selectResult.message,
            recommendations: selectResult.data?.suggestions || [],
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

  private async getFileGroups(params: GetFileGroupsParams): Promise<BrowserToolResult> {
    const { groupBy, tab, includeEmpty = false } = params

    if (!hasBrowserAccess()) {
      return {
        success: false,
        message: "Browser state access не настроен",
        errors: ["Доступ к браузеру не сконфигурирован"],
      }
    }

    try {
      const files = tab ? getBrowserFiles(tab) : getBrowserFiles()
      const groups = groupFiles(files, groupBy)

      // Фильтруем пустые группы, если нужно
      const filteredGroups = includeEmpty ? groups : groups.filter((group) => group.count > 0)

      // Сортируем группы по количеству файлов (по убыванию)
      filteredGroups.sort((a, b) => b.count - a.count)

      // Анализируем группы
      const analysis = {
        groupBy,
        tab: tab || "all",
        totalGroups: filteredGroups.length,
        totalFiles: files.length,
        filesInGroups: filteredGroups.reduce((sum, group) => sum + group.count, 0),
        largestGroup:
          filteredGroups.length > 0
            ? {
                name: filteredGroups[0].name,
                count: filteredGroups[0].count,
                percentage: Math.round((filteredGroups[0].count / files.length) * 100),
              }
            : null,
        averageGroupSize:
          filteredGroups.length > 0
            ? Math.round(filteredGroups.reduce((sum, group) => sum + group.count, 0) / filteredGroups.length)
            : 0,
        groupSummary: filteredGroups.map((group) => ({
          name: group.name,
          count: group.count,
          totalSize: formatFileSize(group.totalSize),
          percentage: Math.round((group.count / files.length) * 100),
        })),
      }

      // Генерируем предложения
      const suggestions: string[] = []

      if (filteredGroups.length === 0) {
        suggestions.push(`Нет групп для критерия "${groupBy}"`)
        suggestions.push("Попробуйте другой критерий группировки")
      } else {
        if (filteredGroups.length === 1) {
          suggestions.push("Все файлы попали в одну группу")
          suggestions.push("Попробуйте более детальный критерий группировки")
        } else if (filteredGroups.length > 10) {
          suggestions.push("Много групп - рассмотрите укрупнение критериев")
        }

        // Анализ по типу группировки
        if (groupBy === "size") {
          const largeFiles = filteredGroups.find((g) => g.name.includes("большие"))
          if (largeFiles && largeFiles.count > files.length * 0.3) {
            suggestions.push("Много больших файлов - проверьте доступное место")
          }
        }

        if (groupBy === "type") {
          const videoGroup = filteredGroups.find((g) => g.name.includes("video"))
          const audioGroup = filteredGroups.find((g) => g.name.includes("audio"))

          if (videoGroup && !audioGroup) {
            suggestions.push("Найдены только видео файлы - добавьте аудио")
          } else if (!videoGroup && audioGroup) {
            suggestions.push("Найдены только аудио файлы - добавьте видео")
          }
        }
      }

      // Следующие действия
      const nextActions: string[] = []
      if (filteredGroups.length > 0) {
        nextActions.push("Выбрать файлы из конкретных групп")
        nextActions.push("Применить действия к целым группам")
        if (filteredGroups.length > 1) {
          nextActions.push("Объединить или разделить группы")
        }
      } else {
        nextActions.push("Изменить критерий группировки")
        nextActions.push("Проверить наличие файлов во вкладке")
      }

      return {
        success: true,
        message: `Группировка по ${groupBy} завершена: создано ${filteredGroups.length} групп`,
        data: {
          groups: filteredGroups,
          analysis,
          suggestions,
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка группировки файлов: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }

  private async analyzeFileRelationships(params: AnalyzeRelationshipsParams): Promise<BrowserToolResult> {
    const { analysisType, fileIds, includeMetadata = true } = params

    if (!hasBrowserAccess()) {
      return {
        success: false,
        message: "Browser state access не настроен",
        errors: ["Доступ к браузеру не сконфигурирован"],
      }
    }

    try {
      let files = getBrowserFiles()

      // Фильтруем файлы, если указаны конкретные ID
      if (fileIds && fileIds.length > 0) {
        files = files.filter((file) => fileIds.includes(file.id))
      }

      // Выполняем анализ связей
      const relationships = await analyzeFileRelationshipsData(files, analysisType)

      // Дополнительная статистика
      const analysis = {
        analysisType,
        totalFilesAnalyzed: files.length,
        specificFiles: fileIds && fileIds.length > 0,
        includeMetadata,
        ...relationships,
      }

      // Генерируем предложения на основе типа анализа
      const suggestions: string[] = []

      switch (analysisType) {
        case "series":
          if (relationships.series && relationships.series.length > 0) {
            suggestions.push(`Найдено ${relationships.series.length} серий файлов`)
            suggestions.push("Рассмотрите группировку файлов по сериям")
            if (relationships.filesInSeries < files.length * 0.5) {
              suggestions.push("Много файлов не входят в серии - проверьте именование")
            }
          } else {
            suggestions.push("Серии файлов не обнаружены")
            suggestions.push("Проверьте соглашения об именовании файлов")
          }
          break

        case "similarity":
          if (relationships.similar && relationships.similar.length > 0) {
            suggestions.push(`Найдено ${relationships.similar.length} групп похожих файлов`)
            suggestions.push("Проверьте дубликаты и похожие файлы")
          } else {
            suggestions.push("Похожие файлы не найдены")
          }
          break

        case "dependencies":
          suggestions.push("Анализ зависимостей требует дополнительной настройки")
          break

        default:
          suggestions.push(`Анализ типа ${analysisType} выполнен`)
          break
      }

      // Следующие действия
      const nextActions: string[] = []
      if (analysisType === "series" && relationships.series?.length > 0) {
        nextActions.push("Сгруппировать файлы по сериям")
        nextActions.push("Переименовать файлы для лучшей организации")
      }
      if (analysisType === "similarity" && relationships.similar?.length > 0) {
        nextActions.push("Проверить дубликаты")
        nextActions.push("Удалить или переместить похожие файлы")
      }
      nextActions.push("Применить результаты анализа к организации файлов")

      return {
        success: true,
        message: `Анализ связей типа ${analysisType} завершен`,
        data: {
          analysis,
          suggestions,
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка анализа связей: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }

  private async bulkSelectFiles(params: BulkSelectParams): Promise<BrowserToolResult> {
    const { selectionCriteria, action, reason } = params

    if (!hasBrowserAccess()) {
      return {
        success: false,
        message: "Browser state access не настроен",
        errors: ["Доступ к браузеру не сконфигурирован"],
      }
    }

    try {
      const browserStateAccess = getBrowserStateAccess()!
      const files = getBrowserFiles()
      let filesToProcess: any[] = []

      // Выбираем файлы по критериям
      switch (selectionCriteria.method) {
        case "all":
          filesToProcess = files
          break

        case "filtered":
          if (selectionCriteria.filters) {
            filesToProcess = filterFiles(files, selectionCriteria.filters)
          }
          break

        case "pattern":
          if (selectionCriteria.filters?.searchPattern) {
            filesToProcess = findFilesByPattern(files, selectionCriteria.filters.searchPattern)
          }
          break

        case "random": {
          const count = selectionCriteria.count || 10
          filesToProcess = getRandomFiles(files, count)
          break
        }

        case "smart":
          // Умный выбор - комбинация критериев
          filesToProcess = files
          if (selectionCriteria.filters) {
            filesToProcess = filterFiles(filesToProcess, selectionCriteria.filters)
          }
          // Дополнительная логика умного выбора
          if (filesToProcess.length > 50) {
            // Берем самые релевантные файлы
            filesToProcess = filesToProcess.slice(0, 50)
          }
          break

        default:
          filesToProcess = []
          break
      }

      const fileIds = filesToProcess.map((file) => file.id)
      let processedCount = 0

      // Выполняем действие
      switch (action) {
        case "select":
          browserStateAccess.selectFiles(fileIds)
          processedCount = fileIds.length
          break

        case "deselect":
          browserStateAccess.deselectFiles(fileIds)
          processedCount = fileIds.length
          break

        case "toggle": {
          // В реальной реализации нужно проверить текущее состояние каждого файла
          const currentlySelected = browserStateAccess.getSelectedFiles().map((f) => f.id)
          const toSelect = fileIds.filter((id) => !currentlySelected.includes(id))
          const toDeselect = fileIds.filter((id) => currentlySelected.includes(id))

          if (toSelect.length > 0) {
            browserStateAccess.selectFiles(toSelect)
          }
          if (toDeselect.length > 0) {
            browserStateAccess.deselectFiles(toDeselect)
          }
          processedCount = fileIds.length
          break
        }

        default:
          throw new Error(`Неизвестное действие: ${action}`)
      }

      // Анализ результатов
      const analysis = {
        selectionCriteria,
        action,
        reason,
        candidateFiles: filesToProcess.length,
        processedFiles: processedCount,
        currentSelection: browserStateAccess.getSelectedFiles().length,
        timestamp: new Date().toISOString(),
      }

      // Генерируем предложения
      const suggestions: string[] = []

      if (processedCount === 0) {
        suggestions.push("Файлы не были обработаны")
        suggestions.push("Проверьте критерии выбора")
      } else {
        suggestions.push(`Обработано ${processedCount} файлов`)

        if (action === "select" && processedCount > 20) {
          suggestions.push("Выбрано много файлов - рассмотрите группировку")
        }

        if (selectionCriteria.method === "filtered" && filesToProcess.length < files.length * 0.1) {
          suggestions.push("Фильтры слишком строгие - найдено мало файлов")
        }
      }

      // Следующие действия
      const nextActions: string[] = []
      if (processedCount > 0) {
        if (action === "select") {
          nextActions.push("Добавить выбранные файлы в ресурсы")
          nextActions.push("Применить операции к выбранным файлам")
        }
        nextActions.push("Просмотреть результаты выбора")
      } else {
        nextActions.push("Изменить критерии выбора")
        nextActions.push("Проверить доступные файлы")
      }

      return {
        success: true,
        message: `${action} выполнен для ${processedCount} файлов (${reason})`,
        data: {
          files: filesToProcess,
          analysis,
          suggestions,
        },
        nextActions,
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка массового выбора файлов: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }
}

// Helper function to analyze file relationships data
function analyzeFileRelationshipsData(files: any[], analysisType: string): any {
  const relationships: any = {
    totalRelationships: 0,
    relatedGroups: [],
    unrelatedFiles: [],
  }

  switch (analysisType) {
    case "series": {
      // Analyze series relationships
      const seriesGroups = groupFilesBySeries(files)
      relationships.totalRelationships = seriesGroups.length
      relationships.relatedGroups = seriesGroups
      relationships.unrelatedFiles = files.filter(
        (file) => !seriesGroups.some((group) => group.files.some((f: any) => f.id === file.id)),
      )
      break
    }

    case "temporal": {
      // Analyze temporal relationships
      const temporalGroups = groupFilesByTime(files)
      relationships.totalRelationships = temporalGroups.length
      relationships.relatedGroups = temporalGroups
      break
    }

    case "format": {
      // Analyze format relationships
      const formatGroups = groupFilesByFormat(files)
      relationships.totalRelationships = formatGroups.length
      relationships.relatedGroups = formatGroups
      break
    }

    case "custom":
      // Custom analysis logic
      relationships.totalRelationships = 0
      relationships.relatedGroups = []
      relationships.unrelatedFiles = files
      break

    default:
      // Default analysis
      relationships.totalRelationships = 0
      relationships.relatedGroups = []
      relationships.unrelatedFiles = files
      break
  }

  return relationships
}

// Helper functions for grouping
function groupFilesBySeries(files: any[]): any[] {
  const groups = new Map<string, any[]>()

  files.forEach((file) => {
    const seriesMatch = file.name.match(/(.+?)[\s_-]?(\d+)/)
    if (seriesMatch) {
      const seriesName = seriesMatch[1]
      if (!groups.has(seriesName)) {
        groups.set(seriesName, [])
      }
      groups.get(seriesName)!.push(file)
    }
  })

  return Array.from(groups.entries())
    .filter(([_, files]) => files.length > 1)
    .map(([name, files]) => ({
      groupName: name,
      files,
      count: files.length,
    }))
}

function groupFilesByTime(files: any[]): any[] {
  const timeThreshold = 60 * 60 * 1000 // 1 hour
  const groups: any[] = []
  const sortedFiles = [...files].sort((a, b) => new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime())

  let currentGroup: any[] = []
  sortedFiles.forEach((file, _index) => {
    if (currentGroup.length === 0) {
      currentGroup.push(file)
    } else {
      const lastFileTime = new Date(currentGroup[currentGroup.length - 1].modifiedAt).getTime()
      const currentFileTime = new Date(file.modifiedAt).getTime()

      if (currentFileTime - lastFileTime <= timeThreshold) {
        currentGroup.push(file)
      } else {
        if (currentGroup.length > 1) {
          groups.push({
            groupName: `Temporal Group ${groups.length + 1}`,
            files: currentGroup,
            count: currentGroup.length,
          })
        }
        currentGroup = [file]
      }
    }
  })

  if (currentGroup.length > 1) {
    groups.push({
      groupName: `Temporal Group ${groups.length + 1}`,
      files: currentGroup,
      count: currentGroup.length,
    })
  }

  return groups
}

function groupFilesByFormat(files: any[]): any[] {
  const groups = new Map<string, any[]>()

  files.forEach((file) => {
    const format = file.extension || "unknown"
    if (!groups.has(format)) {
      groups.set(format, [])
    }
    groups.get(format)!.push(file)
  })

  return Array.from(groups.entries())
    .filter(([_, files]) => files.length > 0)
    .map(([format, files]) => ({
      groupName: `${format.toUpperCase()} Files`,
      files,
      count: files.length,
    }))
}

// Создаем singleton экземпляр
const fileOperationsTool = new FileOperationsTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeFileOperationsTool(
  operation: FileOperationsInput["operation"],
  params: Omit<FileOperationsInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<FileOperationsResult>> {
  return fileOperationsTool.processFileOperations({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function analyzeFileRelationships(params: AnalyzeRelationshipsParams): Promise<BrowserToolResult> {
  const result = await fileOperationsTool.processFileOperations({
    operation: "analyze_file_relationships",
    analysisType: params.analysisType,
    fileIds: params.fileIds,
    includeMetadata: params.includeMetadata,
    reason: "Анализ связей файлов",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        analysis: result.data.analysis,
        relationships: result.data.relationships,
      },
      nextActions: result.data.recommendations,
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка анализа связей файлов",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

/**
 * Функция для обратной совместимости
 */
export async function bulkSelectFiles(params: BulkSelectParams): Promise<BrowserToolResult> {
  const result = await fileOperationsTool.processFileOperations({
    operation: "bulk_select_files",
    selectionCriteria: params.selectionCriteria,
    action: params.action,
    reason: params.reason,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        selectionResult: result.data.selectionResult,
      },
      nextActions: result.data.recommendations,
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка массового выбора файлов",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

/**
 * Функция для обратной совместимости
 */
export async function getFileGroups(params: GetFileGroupsParams): Promise<BrowserToolResult> {
  const result = await fileOperationsTool.processFileOperations({
    operation: "get_file_groups",
    groupBy: params.groupBy,
    tab: params.tab,
    includeEmpty: params.includeEmpty,
    reason: "Группировка файлов",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        groups: result.data.groups,
        analysis: result.data.analysis,
        suggestions: result.data.recommendations,
      },
      nextActions: ["Просмотреть группы", "Организовать файлы"],
    }
  }
  return {
    success: false,
    message: result.errors?.[0] || "Ошибка группировки файлов",
    errors: result.errors || ["Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const fileOperationsTools: any[] = [
  {
    name: "get_file_groups",
    description: "Группирует файлы браузера по различным критериям",
    input_schema: {
      type: "object",
      properties: {
        groupBy: {
          type: "string",
          enum: ["type", "date", "size", "location", "series", "project"],
          description: "Критерий группировки файлов",
        },
        tab: {
          type: "string",
          enum: ["media", "effects", "filters", "transitions", "templates", "music"],
          description: "Вкладка браузера для группировки",
        },
        includeEmpty: {
          type: "boolean",
          description: "Включить пустые группы",
          default: false,
        },
      },
      required: ["groupBy"],
    },
  },
  {
    name: "analyze_file_relationships",
    description: "Анализирует связи между файлами браузера",
    input_schema: {
      type: "object",
      properties: {
        analysisType: {
          type: "string",
          enum: ["series", "project", "similarity", "dependencies"],
          description: "Тип анализа связей",
        },
        fileIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID файлов для анализа",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные в анализ",
          default: true,
        },
      },
      required: ["analysisType"],
    },
  },
  {
    name: "bulk_select_files",
    description: "Массовый выбор файлов по критериям",
    input_schema: {
      type: "object",
      properties: {
        selectionCriteria: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["all", "filtered", "pattern", "random", "smart"],
              description: "Метод выбора файлов",
            },
            filters: {
              type: "object",
              description: "Фильтры для выбора",
            },
            count: {
              type: "number",
              description: "Количество файлов для random выбора",
            },
            pattern: {
              type: "string",
              description: "Паттерн для поиска файлов",
            },
          },
          required: ["method"],
        },
        action: {
          type: "string",
          enum: ["select", "deselect", "toggle"],
          description: "Действие с выбранными файлами",
        },
        reason: {
          type: "string",
          description: "Причина массового выбора",
        },
      },
      required: ["selectionCriteria", "action", "reason"],
    },
  },
]

// Экспорты для tool-обертки
export const getFileGroupsTool = fileOperationsTools[0]
export const analyzeFileRelationshipsTool = fileOperationsTools[1]
export const bulkSelectFilesTool = fileOperationsTools[2]
