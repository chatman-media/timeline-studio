/**
 * Процессор ответов AI для обработки и форматирования результатов
 * Извлечен из UnifiedAIService для улучшения архитектуры
 */

import type { AIProvider } from "../model-manager"

// Результат запроса
export interface UnifiedResponse {
  content: string
  model: string
  provider: AIProvider
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  responseTime: number
}

// Метрики производительности
export interface ResponseMetrics {
  responseTime: number
  tokenCount?: number
  cacheHit?: boolean
  processingTime?: number
  provider: AIProvider
  model: string
}

// Результат обработки ответа
export interface ProcessedResponse {
  content: string
  originalResponse: UnifiedResponse
  metrics: ResponseMetrics
  formattedContent?: string
  metadata?: Record<string, any>
  errors?: string[]
  warnings?: string[]
}

// Опции обработки
export interface ProcessingOptions {
  format?: "text" | "json" | "markdown" | "html"
  sanitize?: boolean
  validateJson?: boolean
  extractMetadata?: boolean
  trimWhitespace?: boolean
  maxLength?: number
}

/**
 * Процессор ответов AI
 */
export class AIResponseProcessor {
  private static instance: AIResponseProcessor

  private constructor() {}

  /**
   * Получить экземпляр процессора (Singleton)
   */
  public static getInstance(): AIResponseProcessor {
    if (!AIResponseProcessor.instance) {
      AIResponseProcessor.instance = new AIResponseProcessor()
    }
    return AIResponseProcessor.instance
  }

  /**
   * Обработать ответ AI
   */
  public async processResponse(response: UnifiedResponse, options: ProcessingOptions = {}): Promise<ProcessedResponse> {
    const processingStartTime = Date.now()

    const processedResponse: ProcessedResponse = {
      content: response.content,
      originalResponse: response,
      metrics: {
        responseTime: response.responseTime,
        provider: response.provider,
        model: response.model,
        processingTime: 0,
      },
      errors: [],
      warnings: [],
    }

    try {
      // Применяем обработку контента
      let content = response.content

      // Обрезка пробелов
      if (options.trimWhitespace !== false) {
        content = content.trim()
      }

      // Ограничение длины
      if (options.maxLength && content.length > options.maxLength) {
        content = content.substring(0, options.maxLength)
        processedResponse.warnings?.push(`Контент был обрезан до ${options.maxLength} символов`)
      }

      // Санитизация
      if (options.sanitize) {
        content = this.sanitizeContent(content)
      }

      // Форматирование
      if (options.format) {
        processedResponse.formattedContent = await this.formatContent(content, options.format)
      }

      // Валидация JSON
      if (options.validateJson && options.format === "json") {
        const jsonValidation = this.validateJson(content)
        if (!jsonValidation.isValid) {
          processedResponse.errors?.push(`Невалидный JSON: ${jsonValidation.error}`)
        }
      }

      // Извлечение метаданных
      if (options.extractMetadata) {
        processedResponse.metadata = this.extractMetadata(content, options.format)
      }

      // Обновляем контент
      processedResponse.content = content

      // Обновляем метрики
      processedResponse.metrics.processingTime = Date.now() - processingStartTime
      processedResponse.metrics.tokenCount = this.estimateTokenCount(content)
    } catch (error) {
      processedResponse.errors?.push(
        `Ошибка обработки ответа: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    return processedResponse
  }

  /**
   * Санитизация контента
   */
  private sanitizeContent(content: string): string {
    // Удаляем потенциально опасные теги
    let sanitized = content.replace(/<script[^>]*>.*?<\/script>/gi, "")
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    sanitized = sanitized.replace(/javascript:/gi, "")
    sanitized = sanitized.replace(/on\w+\s*=/gi, "")

    return sanitized
  }

  /**
   * Форматирование контента
   */
  private async formatContent(content: string, format: string): Promise<string> {
    switch (format) {
      case "json":
        try {
          const parsed = JSON.parse(content)
          return JSON.stringify(parsed, null, 2)
        } catch {
          return content
        }

      case "markdown":
        return this.formatAsMarkdown(content)

      case "html":
        return this.formatAsHtml(content)
      default:
        return content
    }
  }

  /**
   * Форматирование как Markdown
   */
  private formatAsMarkdown(content: string): string {
    // Базовое форматирование в Markdown
    let markdown = content

    // Конвертируем заголовки
    markdown = markdown.replace(/^(#{1,6})\s*(.+)$/gm, "$1 $2")

    // Конвертируем списки
    markdown = markdown.replace(/^\*\s*(.+)$/gm, "- $1")

    // Конвертируем жирный текст
    markdown = markdown.replace(/\*\*([^*]+)\*\*/g, "**$1**")

    return markdown
  }

  /**
   * Форматирование как HTML
   */
  private formatAsHtml(content: string): string {
    // Базовое форматирование в HTML
    let html = content

    // Экранируем HTML теги
    html = html.replace(/&/g, "&amp;")
    html = html.replace(/</g, "&lt;")
    html = html.replace(/>/g, "&gt;")

    // Конвертируем переносы строк в <br>
    html = html.replace(/\n/g, "<br>")

    // Конвертируем жирный текст
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

    return html
  }

  /**
   * Валидация JSON
   */
  private validateJson(content: string): { isValid: boolean; error?: string; data?: any } {
    try {
      const data = JSON.parse(content)
      return { isValid: true, data }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка парсинга JSON",
      }
    }
  }

  /**
   * Извлечение метаданных из контента
   */
  private extractMetadata(content: string, format?: string): Record<string, any> {
    const metadata: Record<string, any> = {
      length: content.length,
      lines: content.split("\n").length,
      words: content.split(/\s+/).length,
      format: format || "text",
    }

    // Извлекаем метаданные для JSON
    if (format === "json") {
      const jsonValidation = this.validateJson(content)
      if (jsonValidation.isValid && jsonValidation.data) {
        metadata.jsonKeys = Object.keys(jsonValidation.data).length
        metadata.jsonType = Array.isArray(jsonValidation.data) ? "array" : typeof jsonValidation.data
      }
    }

    // Извлекаем метаданные для Markdown
    if (format === "markdown") {
      metadata.headers = (content.match(/^#{1,6}\s+.+$/gm) || []).length
      metadata.lists = (content.match(/^\s*[*\-+]\s+/gm) || []).length
      metadata.codeBlocks = (content.match(/```[^`]*```/g) || []).length
    }

    return metadata
  }

  /**
   * Оценка количества токенов (приблизительная)
   */
  private estimateTokenCount(content: string): number {
    // Приблизительная оценка: ~4 символа на токен для английского текста
    // ~6 символов на токен для русского текста
    const hasRussian = /[а-яё]/i.test(content)
    const avgCharsPerToken = hasRussian ? 6 : 4
    return Math.ceil(content.length / avgCharsPerToken)
  }

  /**
   * Извлечение структурированных данных
   */
  public extractStructuredData(content: string): {
    codeBlocks: Array<{ language: string; code: string }>
    links: string[]
    mentions: string[]
    hashtags: string[]
    numbers: number[]
  } {
    const result = {
      codeBlocks: [] as Array<{ language: string; code: string }>,
      links: [] as string[],
      mentions: [] as string[],
      hashtags: [] as string[],
      numbers: [] as number[],
    }

    // Извлекаем блоки кода
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let codeMatch: RegExpExecArray | null
    while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
      result.codeBlocks.push({
        language: codeMatch[1] || "text",
        code: codeMatch[2].trim(),
      })
    }

    // Извлекаем ссылки
    const linkRegex = /https?:\/\/[^\s]+/g
    result.links = content.match(linkRegex) || []

    // Извлекаем упоминания
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)
    result.mentions = mentions ? mentions.map((m) => m.substring(1)) : []

    // Извлекаем хештеги
    const hashtagRegex = /#(\w+)/g
    const hashtags = content.match(hashtagRegex)
    result.hashtags = hashtags ? hashtags.map((h) => h.substring(1)) : []

    // Извлекаем числа
    const numberRegex = /\b\d+(?:\.\d+)?\b/g
    const numbers = content.match(numberRegex)
    result.numbers = numbers ? numbers.map(Number).filter((n) => !Number.isNaN(n)) : []

    return result
  }

  /**
   * Создание сводки ответа
   */
  public createSummary(response: ProcessedResponse): {
    length: number
    processingTime: number
    hasErrors: boolean
    hasWarnings: boolean
    tokenEstimate: number
    format?: string
    provider: string
    model: string
  } {
    return {
      length: response.content.length,
      processingTime: response.metrics.processingTime || 0,
      hasErrors: (response.errors?.length || 0) > 0,
      hasWarnings: (response.warnings?.length || 0) > 0,
      tokenEstimate: response.metrics.tokenCount || 0,
      format: response.metadata?.format,
      provider: response.metrics.provider,
      model: response.metrics.model,
    }
  }

  /**
   * Сравнение ответов
   */
  public compareResponses(responses: ProcessedResponse[]): {
    shortest: ProcessedResponse
    longest: ProcessedResponse
    fastest: ProcessedResponse
    slowest: ProcessedResponse
    averageLength: number
    averageTime: number
    providers: string[]
  } {
    if (responses.length === 0) {
      throw new Error("Нет ответов для сравнения")
    }

    const sorted = [...responses]

    return {
      shortest: sorted.reduce((a, b) => (a.content.length < b.content.length ? a : b)),
      longest: sorted.reduce((a, b) => (a.content.length > b.content.length ? a : b)),
      fastest: sorted.reduce((a, b) => (a.metrics.responseTime < b.metrics.responseTime ? a : b)),
      slowest: sorted.reduce((a, b) => (a.metrics.responseTime > b.metrics.responseTime ? a : b)),
      averageLength: responses.reduce((sum, r) => sum + r.content.length, 0) / responses.length,
      averageTime: responses.reduce((sum, r) => sum + r.metrics.responseTime, 0) / responses.length,
      providers: [...new Set(responses.map((r) => r.metrics.provider))],
    }
  }
}
