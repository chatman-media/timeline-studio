/**
 * Базовый класс для всех AI инструментов в домене ai-tools
 * Расширенная версия с поддержкой новой архитектуры
 */

import { createLogger } from "@/lib/tauri-logger"
import type {
  AIToolExecutionOptions,
  AIToolLogger,
  AIToolMetadata,
  AIToolResult,
  FullExecutionContext,
  IAITool,
} from "../types"

const logger = createLogger("BaseAiTool")

/**
 * Простая реализация логгера для консоли
 */
export class ConsoleAIToolLogger implements AIToolLogger {
  private prefix: string

  constructor(prefix: string = "[AITool]") {
    this.prefix = prefix
  }

  info(message: string, data?: any): void {
    logger.debug(`${this.prefix} INFO: ${message}`, data ? { data } : {})
  }

  warn(message: string, data?: any): void {
    logger.warn(`${this.prefix} WARN: ${message}`, data ? { data } : {})
  }

  error(message: string, data?: any): void {
    logger.error(`${this.prefix} ERROR: ${message}`, data ? { data } : {})
  }
}

/**
 * Логгер-заглушка (ничего не логирует)
 */
export class NoOpAIToolLogger implements AIToolLogger {
  info(_message: string, _data?: any): void {}
  warn(_message: string, _data?: any): void {}
  error(_message: string, _data?: any): void {}
}

/**
 * Базовый абстрактный класс для AI инструментов
 */
export abstract class BaseAITool implements IAITool {
  protected logger?: AIToolLogger
  public abstract readonly metadata: AIToolMetadata

  constructor(metadata?: AIToolMetadata, logger?: AIToolLogger) {
    if (metadata) {
      // @ts-expect-error - Allow assignment to readonly property in constructor
      this.metadata = metadata
    }
    this.logger = logger
  }

  /**
   * Абстрактный метод выполнения инструмента
   * Должен быть реализован в наследниках
   */
  abstract execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult>

  /**
   * Валидация входных данных
   */
  abstract validate(input: any): boolean

  /**
   * Получение схемы входных и выходных данных
   */
  abstract getSchema(): { input: any; output: any }

  /**
   * Выполнить инструмент с унифицированной обработкой ошибок
   */
  protected async executeWithErrorHandling<T>(
    executor: (context: FullExecutionContext) => Promise<T>,
    input: any,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<T>> {
    const {
      timeout = 30000, // 30 секунд по умолчанию
      retries = 1,
      retryDelay = 1000,
      enableLogging = true,
      metadata = {},
    } = options

    // Валидируем входные данные
    if (!this.validate(input)) {
      return {
        success: false,
        message: `Невалидные входные данные для инструмента ${this.metadata.name}`,
        errors: ["Входные данные не прошли валидацию"],
        executionTime: 1,
        toolName: this.metadata.name,
        executionId: this.generateExecutionId(),
        metadata: {
          ...metadata,
          attempts: 0,
          maxRetries: retries,
          toolVersion: this.metadata.version,
          domain: this.metadata.domain,
          category: this.metadata.category,
        },
      }
    }

    const executionId = this.generateExecutionId()
    const startTime = Date.now()
    let lastError: Error | null = null

    // Создаем полный контекст выполнения
    const context: FullExecutionContext = {
      toolName: this.metadata.name,
      executionId,
      startTime,
      attempt: 0,
      maxRetries: retries,
      options,
      priority: "medium",
      logger: enableLogging && this.logger ? this.logger : undefined,
      enableMetrics: true,
      status: "pending",
      dependencies: this.metadata.dependencies || [],
      requiredServices: [],
      enableCache: false,
      userData: metadata,
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      context.attempt = attempt
      context.status = "running"

      try {
        // Логируем начало выполнения
        if (enableLogging && this.logger) {
          this.logger.info(`Выполнение инструмента ${this.metadata.name}`, {
            attempt: attempt + 1,
            maxRetries: retries,
            timeout,
            executionId,
          })
        }

        // Выполняем инструмент с таймаутом
        const result = await this.executeWithTimeout(executor, context, timeout)

        const executionTime = Date.now() - startTime
        context.status = "completed"
        context.endTime = Date.now()

        // Логируем успешное выполнение
        if (enableLogging && this.logger) {
          this.logger.info(`Инструмент ${this.metadata.name} выполнен успешно`, {
            executionTime,
            attempt: attempt + 1,
            executionId,
          })
        }

        return {
          success: true,
          data: result,
          message: `Инструмент ${this.metadata.name} выполнен успешно`,
          executionTime: Math.max(executionTime, 1), // Минимум 1мс для тестов
          toolName: this.metadata.name,
          executionId,
          metadata: {
            ...metadata,
            attempt: attempt + 1,
            maxRetries: retries,
            toolVersion: this.metadata.version,
            domain: this.metadata.domain,
            category: this.metadata.category,
          },
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const executionTime = Date.now() - startTime
        context.status = "failed"

        // Логируем ошибку
        if (enableLogging && this.logger) {
          this.logger.warn(`Попытка ${attempt + 1}/${retries} не удалась для инструмента ${this.metadata.name}`, {
            error: lastError.message,
            executionTime,
            executionId,
          })
        }

        // Если это последняя попытка, возвращаем ошибку
        if (attempt === retries - 1) {
          if (enableLogging && this.logger) {
            this.logger.error(`Все попытки исчерпаны для инструмента ${this.metadata.name}`, {
              error: lastError.message,
              totalExecutionTime: executionTime,
              executionId,
            })
          }

          return this.createErrorResult(lastError, executionTime, metadata, attempt + 1, retries, executionId)
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
      executionId,
    )
  }

  /**
   * Выполнить функцию с таймаутом
   */
  private async executeWithTimeout<T>(
    executor: (context: FullExecutionContext) => Promise<T>,
    context: FullExecutionContext,
    timeout: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        context.status = "failed"
        reject(new Error(`Таймаут выполнения инструмента ${this.metadata.name} (${timeout}мс)`))
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
    executionId: string,
  ): AIToolResult<never> {
    const errorMessage = error.message || "Неизвестная ошибка"

    return {
      success: false,
      message: `Ошибка выполнения инструмента ${this.metadata.name}: ${errorMessage}`,
      errors: [errorMessage],
      executionTime: Math.max(executionTime, 1), // Минимум 1мс для тестов
      toolName: this.metadata.name,
      executionId,
      metadata: {
        ...metadata,
        attempts,
        maxRetries,
        errorType: error.constructor.name,
        toolVersion: this.metadata.version,
        domain: this.metadata.domain,
        category: this.metadata.category,
      },
    }
  }

  /**
   * Генерация уникального ID выполнения
   */
  protected generateExecutionId(): string {
    return `${this.metadata.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Задержка выполнения
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Валидация входных данных с детальными ошибками
   */
  protected validateInputDetailed<T>(
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
  ): Omit<AIToolResult<T>, "executionTime" | "toolName" | "executionId"> {
    return {
      success: true,
      data,
      message: message || `Инструмент ${this.metadata.name} выполнен успешно`,
      warnings,
      metadata: {
        ...metadata,
        toolVersion: this.metadata.version,
        domain: this.metadata.domain,
        category: this.metadata.category,
      },
    }
  }

  /**
   * Безопасный парсинг JSON
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
   * Нормализация строки
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
    return this.metadata.name
  }

  /**
   * Получить метаданные инструмента
   */
  public getMetadata(): AIToolMetadata {
    return this.metadata
  }
}
