/**
 * AI инструменты для поиска файлов в браузере с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"
import type { BrowserToolResult, SearchMediaParams } from "./types"
import { findFilesByPattern, getBrowserFiles, getBrowserStateAccess, hasBrowserAccess } from "./utils/helpers"

// Типы для поисковых операций
export interface FileSearchInput {
  query: string
  searchIn?: ("filename" | "metadata" | "tags" | "location")[]
  tab?: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  advanced?: {
    exactMatch?: boolean
    caseSensitive?: boolean
    includeHidden?: boolean
    searchSubfolders?: boolean
  }
  maxResults?: number
}

export interface FileSearchResult {
  files: any[]
  analysis: {
    query: string
    searchAreas: string[]
    tab: string
    settings: any
    totalMatches: number
    wasTruncated: boolean
    fileTypeBreakdown: Record<string, number>
  }
  suggestions: string[]
}

/**
 * AI инструмент для поиска файлов в браузере с унифицированной обработкой ошибок
 */
export class FileSearchTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("FileSearchTool", logger)
  }

  /**
   * Выполняет поиск медиафайлов
   */
  public async searchFiles(
    input: FileSearchInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<FileSearchResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (!data.query || data.query.trim().length === 0) {
        errors.push("Поисковый запрос не может быть пустым")
      }

      if (data.searchIn) {
        const validAreas = ["filename", "metadata", "tags", "location"]
        const invalidAreas = data.searchIn.filter((area) => !validAreas.includes(area))
        if (invalidAreas.length > 0) {
          errors.push(`Неверные области поиска: ${invalidAreas.join(", ")}`)
        }
      }

      if (data.tab) {
        const validTabs = ["media", "effects", "filters", "transitions", "templates", "music"]
        if (!validTabs.includes(data.tab)) {
          errors.push(`Неверная вкладка: ${data.tab}`)
        }
      }

      if (data.maxResults && data.maxResults <= 0) {
        errors.push("Максимальное количество результатов должно быть больше 0")
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
        message: "Ошибка валидации входных данных для поиска файлов",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    // Выполняем поиск с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем поиск файлов", {
          query: input.query,
          searchIn: input.searchIn,
          tab: input.tab,
        })

        const result = await this.performSearch(input)

        this.logger?.info("Поиск файлов завершен", {
          query: input.query,
          totalMatches: result.analysis.totalMatches,
        })

        return result
      },
      {
        timeout: options.timeout || 30000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          query: input.query,
          tab: input.tab,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Выполняет поиск файлов
   */
  private async performSearch(input: FileSearchInput, _context: any): Promise<FileSearchResult> {
    const params: SearchMediaParams = {
      query: input.query,
      searchIn: input.searchIn || ["filename"],
      tab: input.tab,
      advanced: input.advanced || {},
      maxResults: input.maxResults || 100,
    }

    const result = await searchMediaFiles(params)

    if (!result.success) {
      throw new Error(result.message || "Ошибка поиска файлов")
    }

    return result.data as FileSearchResult
  }
}

// Экспортируем готовый экземпляр для использования
export const fileSearchTool = new FileSearchTool()

// Функция-обертка для обратной совместимости
export async function searchMediaFilesWrapper(params: SearchMediaParams): Promise<AIToolResult<FileSearchResult>> {
  const input: FileSearchInput = {
    query: params.query,
    searchIn: params.searchIn,
    tab: params.tab,
    advanced: params.advanced,
    maxResults: params.maxResults,
  }
  return fileSearchTool.searchFiles(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const searchMediaFilesTool: any = {
  name: "search_media_files",
  description: "Выполняет поиск медиафайлов в браузере по различным критериям",
}

export const browserSearchTools: any[] = [searchMediaFilesTool]

export async function searchMediaFiles(params: SearchMediaParams): Promise<BrowserToolResult> {
  const { query, searchIn = ["filename"], tab, advanced = {}, maxResults = 100 } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    const browserStateAccess = getBrowserStateAccess()!
    let files = tab ? getBrowserFiles(tab) : getBrowserFiles()

    // Применяем расширенные настройки
    if (!advanced.includeHidden) {
      files = files.filter((file) => !file.name.startsWith("."))
    }

    let searchResults: any[] = []

    // Выполняем поиск в зависимости от настроек
    if (advanced.exactMatch) {
      // Точное соответствие
      const searchTerm = advanced.caseSensitive ? query : query.toLowerCase()

      searchResults = files.filter((file) => {
        return searchIn.some((area) => {
          switch (area) {
            case "filename": {
              const fileName = advanced.caseSensitive ? file.name : file.name.toLowerCase()
              return fileName === searchTerm
            }
            case "location": {
              const location = advanced.caseSensitive ? file.location || "" : (file.location || "").toLowerCase()
              return location === searchTerm
            }
            case "tags":
              return file.tags?.some((tag: string) => {
                const tagValue = advanced.caseSensitive ? tag : tag.toLowerCase()
                return tagValue === searchTerm
              })
            case "metadata":
              // В реальной реализации поиск по метаданным
              return false
            default:
              return false
          }
        })
      })
    } else if (query.includes("*") || query.includes("?")) {
      // Поиск по шаблону
      searchResults = findFilesByPattern(files, query)
    } else {
      // Обычный поиск (частичное соответствие)
      const searchTerm = advanced.caseSensitive ? query : query.toLowerCase()

      searchResults = files.filter((file) => {
        return searchIn.some((area) => {
          switch (area) {
            case "filename": {
              const fileName = advanced.caseSensitive ? file.name : file.name.toLowerCase()
              return fileName.includes(searchTerm)
            }
            case "location": {
              const location = advanced.caseSensitive ? file.location || "" : (file.location || "").toLowerCase()
              return location.includes(searchTerm)
            }
            case "tags":
              return (
                file.tags?.some((tag: string) => {
                  const tagValue = advanced.caseSensitive ? tag : tag.toLowerCase()
                  return tagValue.includes(searchTerm)
                }) || false
              )
            case "metadata":
              // В реальной реализации поиск по метаданным
              if (file.metadata) {
                const metadataString = JSON.stringify(file.metadata)
                const searchableMetadata = advanced.caseSensitive ? metadataString : metadataString.toLowerCase()
                return searchableMetadata.includes(searchTerm)
              }
              return false
            default:
              return false
          }
        })
      })
    }

    // Ограничиваем количество результатов
    if (searchResults.length > maxResults) {
      searchResults = searchResults.slice(0, maxResults)
    }

    // Сортируем результаты по релевантности (простая эвристика)
    searchResults = searchResults.sort((a, b) => {
      // Приоритет файлам, где запрос найден в начале имени
      const aStartsWithQuery = a.name.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWithQuery = b.name.toLowerCase().startsWith(query.toLowerCase())

      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1

      // Затем по алфавиту
      return a.name.localeCompare(b.name)
    })

    // Анализируем результаты
    const analysis = {
      query,
      searchAreas: searchIn,
      tab: tab || "all",
      settings: advanced,
      totalMatches: searchResults.length,
      wasTruncated:
        files.filter((file) =>
          searchIn.some((area) => {
            const searchTerm = advanced.caseSensitive ? query : query.toLowerCase()
            switch (area) {
              case "filename": {
                const fileName = advanced.caseSensitive ? file.name : file.name.toLowerCase()
                return fileName.includes(searchTerm)
              }
              default:
                return false
            }
          }),
        ).length > maxResults,
      fileTypeBreakdown: searchResults.reduce((acc: Record<string, number>, file) => {
        const type = file.type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
    }

    // Генерируем предложения
    const suggestions: string[] = []

    if (searchResults.length === 0) {
      suggestions.push(`По запросу "${query}" ничего не найдено`)
      suggestions.push("Попробуйте изменить поисковый запрос")
      suggestions.push("Проверьте правильность написания")
      if (advanced.exactMatch) {
        suggestions.push("Попробуйте отключить точное соответствие")
      }
      if (advanced.caseSensitive) {
        suggestions.push("Попробуйте отключить учет регистра")
      }
    } else {
      if (searchResults.length === maxResults) {
        suggestions.push(`Найдено максимальное количество результатов (${maxResults})`)
        suggestions.push("Уточните поисковый запрос для более точных результатов")
      }

      if (searchResults.length > 20) {
        suggestions.push("Много результатов - используйте дополнительные фильтры")
      }

      // Предложения по типам файлов
      const types = Object.keys(analysis.fileTypeBreakdown)
      if (types.length > 1) {
        suggestions.push(`Найдены файлы разных типов: ${types.join(", ")}`)
      }
    }

    // Следующие действия
    const nextActions: string[] = []
    if (searchResults.length > 0) {
      nextActions.push("Выбрать нужные файлы из результатов")
      nextActions.push("Добавить найденные файлы в ресурсы")
      if (searchResults.length > 10) {
        nextActions.push("Применить дополнительные фильтры")
      }
    } else {
      nextActions.push("Изменить поисковый запрос")
      nextActions.push("Попробовать поиск в других областях")
      if (tab) {
        nextActions.push("Расширить поиск на все вкладки")
      }
    }

    return {
      success: true,
      message: `Поиск по запросу "${query}" завершен: найдено ${searchResults.length} файлов`,
      data: {
        files: searchResults,
        analysis,
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка поиска файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
