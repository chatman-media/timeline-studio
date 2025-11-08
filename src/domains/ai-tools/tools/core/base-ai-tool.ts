/**
 * Базовый класс для всех AI инструментов
 * Обеспечивает унифицированную обработку ошибок и стандартизацию результатов
 */

import type { AIToolMetadata, AIToolResult } from "@/domains/ai-tools/types/tool-interfaces"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("BaseAITool")

// Опции выполнения инструмента
export interface AIToolExecutionOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  enableLogging?: boolean
  metadata?: Record<string, any>
}

// Контекст выполнения инструмента
export interface AIToolContext {
  toolName: string
  startTime: number
  attempt: number
  maxRetries: number
  logger?: (level: "info" | "warn" | "error", message: string, data?: any) => void
}

// Интерфейс для логгера
export interface AIToolLogger {
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, data?: any): void
}

/**
 * Базовый абстрактный класс для AI инструментов
 */
export abstract class BaseAITool {
  protected toolName: string
  protected logger?: AIToolLogger

  constructor(toolName: string, logger?: AIToolLogger) {
    this.toolName = toolName
    this.logger = logger
  }

  /**
   * Метаданные инструмента (должны быть реализованы в наследниках)
   */
  abstract get metadata(): AIToolMetadata

  /**
   * Основной метод выполнения инструмента (должен быть реализован в наследниках)
   */
  abstract execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult>

  /**
   * Валидация входных данных (должна быть реализована в наследниках)
   */
  abstract validate(input: any): boolean

  /**
   * Получение схемы входных и выходных данных (должна быть реализована в наследниках)
   */
  abstract getSchema(): { input: any; output: any }

  /**
   * Генерация уникального ID выполнения
   */
  protected generateExecutionId(): string {
    return `${this.toolName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Выполнить инструмент с унифицированной обработкой ошибок
   */
  protected async executeWithErrorHandling<T>(
    executor: (context: AIToolContext) => Promise<T>,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<T>> {
    const {
      timeout = 30000, // 30 секунд по умолчанию
      retries = 1,
      retryDelay = 1000,
      enableLogging = true,
      metadata = {},
    } = options

    const startTime = Date.now()
    let lastError: Error | null = null

    // Создаем контекст выполнения
    const context: AIToolContext = {
      toolName: this.toolName,
      startTime,
      attempt: 0,
      maxRetries: retries,
      logger: enableLogging ? this.createContextLogger() : undefined,
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      context.attempt = attempt

      try {
        // Логируем начало выполнения
        if (enableLogging && this.logger) {
          this.logger.info(`Выполнение инструмента ${this.toolName}`, {
            attempt: attempt + 1,
            maxRetries: retries,
            timeout,
          })
        }

        // Выполняем инструмент с таймаутом
        const result = await this.executeWithTimeout(executor, context, timeout)

        const executionTime = Date.now() - startTime

        // Логируем успешное выполнение
        if (enableLogging && this.logger) {
          this.logger.info(`Инструмент ${this.toolName} выполнен успешно`, {
            executionTime,
            attempt: attempt + 1,
          })
        }

        return {
          success: true,
          data: result,
          message: `Инструмент ${this.toolName} выполнен успешно`,
          executionTime,
          toolName: this.toolName,
          executionId: this.generateExecutionId(),
          metadata: {
            ...metadata,
            attempt: attempt + 1,
            maxRetries: retries,
          },
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const executionTime = Date.now() - startTime

        // Логируем ошибку
        if (enableLogging && this.logger) {
          this.logger.warn(`Попытка ${attempt + 1}/${retries} не удалась для инструмента ${this.toolName}`, {
            error: lastError.message,
            executionTime,
          })
        }

        // Если это последняя попытка, возвращаем ошибку
        if (attempt === retries - 1) {
          if (enableLogging && this.logger) {
            this.logger.error(`Все попытки исчерпаны для инструмента ${this.toolName}`, {
              error: lastError.message,
              totalExecutionTime: executionTime,
            })
          }

          return this.createErrorResult(lastError, executionTime, metadata, attempt + 1, retries)
        }

        // Ждем перед повторной попыткой
        if (retryDelay > 0) {
          await this.sleep(retryDelay * (attempt + 1)) // Экспоненциальная задержка
        }
      }
    }

    // Этот код не должен выполняться, но на всякий случай
    return this.createErrorResult(
      lastError || new Error("Неизвестная ошибка"),
      Date.now() - startTime,
      metadata,
      retries,
      retries,
    )
  }

  /**
   * Выполнить функцию с таймаутом
   */
  private async executeWithTimeout<T>(
    executor: (context: AIToolContext) => Promise<T>,
    context: AIToolContext,
    timeout: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Таймаут выполнения инструмента ${this.toolName} (${timeout}мс)`))
      }, timeout)

      executor(context)
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * Создать результат с ошибкой
   */
  private createErrorResult(
    error: Error,
    executionTime: number,
    metadata: Record<string, any>,
    attempts: number,
    maxRetries: number,
  ): AIToolResult<never> {
    const errorMessage = error.message || "Неизвестная ошибка"

    return {
      success: false,
      message: `Ошибка выполнения инструмента ${this.toolName}: ${errorMessage}`,
      errors: [errorMessage],
      executionTime,
      toolName: this.toolName,
      executionId: this.generateExecutionId(),
      metadata: {
        ...metadata,
        attempts,
        maxRetries,
        errorType: error.constructor.name,
      },
    }
  }

  /**
   * Создать контекстный логгер
   */
  private createContextLogger(): (level: "info" | "warn" | "error", message: string, data?: any) => void {
    return (level, message, data) => {
      if (this.logger) {
        this.logger[level](`[${this.toolName}] ${message}`, data)
      }
    }
  }

  /**
   * Задержка выполнения
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Валидация входных данных
   */
  protected validateInput<T>(
    input: T,
    validator: (input: T) => { isValid: boolean; errors: string[] },
  ): { isValid: boolean; errors: string[] } {
    try {
      return validator(input)
    } catch (error) {
      return {
        isValid: false,
        errors: [`Ошибка валидации: ${error instanceof Error ? error.message : String(error)}`],
      }
    }
  }

  /**
   * Создать успешный результат
   */
  protected createSuccessResult<T>(
    data: T,
    message?: string,
    metadata?: Record<string, any>,
    warnings?: string[],
  ): Omit<AIToolResult<T>, "executionTime" | "toolName"> {
    return {
      success: true,
      data,
      message: message || `Инструмент ${this.toolName} выполнен успешно`,
      warnings,
      metadata,
      executionId: this.generateExecutionId(),
    }
  }

  /**
   * Создать результат с предупреждением
   */
  protected createWarningResult<T>(
    data: T,
    warnings: string[],
    message?: string,
    metadata?: Record<string, any>,
  ): Omit<AIToolResult<T>, "executionTime" | "toolName"> {
    return {
      success: true,
      data,
      message: message || `Инструмент ${this.toolName} выполнен с предупреждениями`,
      warnings,
      metadata,
      executionId: this.generateExecutionId(),
    }
  }

  /**
   * Обработать исключения при парсинге JSON
   */
  protected safeParseJSON<T>(jsonString: string, fallback?: T): { success: boolean; data?: T; error?: string } {
    try {
      const data = JSON.parse(jsonString)
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        data: fallback,
        error: `Ошибка парсинга JSON: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Нормализация строки для консистентности
   */
  protected normalizeString(str: string): string {
    return str.trim().replace(/\s+/g, " ")
  }

  /**
   * Проверка на пустое значение
   */
  protected isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === "string") return value.trim() === ""
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === "object") return Object.keys(value).length === 0
    return false
  }

  /**
   * Установить логгер
   */
  public setLogger(logger: AIToolLogger): void {
    this.logger = logger
  }

  /**
   * Получить имя инструмента
   */
  public getToolName(): string {
    return this.toolName
  }
}

/**
 * Простая реализация логгера для консоли
 */
export class ConsoleAIToolLogger implements AIToolLogger {
  private prefix: string

  constructor(prefix: string = "[AITool]") {
    this.prefix = prefix
  }

  info(message: string, data?: any): void {
    logger.info(`${this.prefix} INFO: ${message}`, data ? data : "")
  }

  warn(message: string, data?: any): void {
    logger.warn(`${this.prefix} WARN: ${message}`, data ? data : "")
  }

  error(message: string, data?: any): void {
    logger.error(`${this.prefix} ERROR: ${message}`, data ? data : "")
  }
}

/**
 * Логгер-заглушка (ничего не логирует)
 */
export class NoOpAIToolLogger implements AIToolLogger {
  info(): void {}
  warn(): void {}
  error(): void {}
}
