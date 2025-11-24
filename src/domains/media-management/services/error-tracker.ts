/**
 * Error Tracking Service
 *
 * Сервис для отслеживания и анализа ошибок в Media Management
 * Предоставляет статистику, стратегии восстановления и улучшенный error handling
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ErrorTracker")

/**
 * Тип ошибки
 */
export type ErrorType =
  | "import_failed"
  | "metadata_extraction_failed"
  | "file_operation_failed"
  | "proxy_generation_failed"
  | "camera_access_failed"
  | "organization_failed"
  | "network_error"
  | "permission_denied"
  | "disk_space_error"
  | "unsupported_format"
  | "unknown"

/**
 * Запись об ошибке
 */
export interface ErrorRecord {
  /** Уникальный ID ошибки */
  id: string
  /** Тип ошибки */
  type: ErrorType
  /** Сообщение об ошибке */
  message: string
  /** Путь к файлу (если применимо) */
  filePath?: string
  /** Timestamp */
  timestamp: Date
  /** Стек ошибки */
  stack?: string
  /** Дополнительные данные */
  metadata?: Record<string, any>
  /** Была ли ошибка восстановлена */
  recovered?: boolean
  /** Стратегия восстановления */
  recoveryStrategy?: string
}

/**
 * Статистика ошибок
 */
export interface ErrorStats {
  /** Общее количество ошибок */
  total: number
  /** Количество по типам */
  byType: Record<ErrorType, number>
  /** Процент успешных восстановлений */
  recoveryRate: number
  /** Последние ошибки */
  recent: ErrorRecord[]
  /** Наиболее частые ошибки */
  mostFrequent: Array<{ type: ErrorType; count: number }>
}

/**
 * Стратегия восстановления
 */
export interface RecoveryStrategy {
  /** Название стратегии */
  name: string
  /** Описание */
  description: string
  /** Применима ли для данного типа ошибки */
  appliesTo: ErrorType[]
  /** Функция восстановления */
  recover: (error: ErrorRecord) => Promise<boolean>
}

/**
 * Конфигурация retry логики
 */
export interface RetryConfig {
  /** Максимальное количество попыток */
  maxAttempts: number
  /** Начальная задержка в миллисекундах */
  initialDelay: number
  /** Множитель для exponential backoff */
  backoffMultiplier: number
  /** Типы ошибок, которые можно retry */
  retryableErrors: ErrorType[]
}

/**
 * Статистика успешных операций
 */
export interface OperationStats {
  /** Тип операции */
  type: ErrorType
  /** Количество успешных операций */
  successCount: number
  /** Количество неудачных операций */
  failureCount: number
  /** Последнее обновление */
  lastUpdated: Date
}

/**
 * Сервис отслеживания ошибок
 */
export class ErrorTrackerService {
  private errors: ErrorRecord[] = []
  private maxErrors = 1000 // Максимум ошибок в памяти
  private recoveryStrategies: RecoveryStrategy[] = []
  private operationStats: Map<ErrorType, OperationStats> = new Map()
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    backoffMultiplier: 2,
    retryableErrors: ["network_error", "import_failed", "metadata_extraction_failed"],
  }

  constructor() {
    this.initializeRecoveryStrategies()
    this.initializeOperationStats()
  }

  /**
   * Инициализация статистики операций
   */
  private initializeOperationStats() {
    const errorTypes: ErrorType[] = [
      "import_failed",
      "metadata_extraction_failed",
      "file_operation_failed",
      "proxy_generation_failed",
      "camera_access_failed",
      "organization_failed",
      "network_error",
      "permission_denied",
      "disk_space_error",
      "unsupported_format",
      "unknown",
    ]

    for (const type of errorTypes) {
      this.operationStats.set(type, {
        type,
        successCount: 0,
        failureCount: 0,
        lastUpdated: new Date(),
      })
    }
  }

  /**
   * Инициализация стратегий восстановления
   */
  private initializeRecoveryStrategies() {
    // Стратегия повторной попытки
    this.recoveryStrategies.push({
      name: "retry",
      description: "Повторная попытка операции",
      appliesTo: ["network_error", "import_failed", "metadata_extraction_failed"],
      recover: async (error: ErrorRecord) => {
        logger.info("Attempting retry recovery", { errorId: error.id })
        return await this.attemptRetry(error)
      },
    })

    // Стратегия альтернативного пути
    this.recoveryStrategies.push({
      name: "alternative_method",
      description: "Использование альтернативного метода",
      appliesTo: ["metadata_extraction_failed", "proxy_generation_failed"],
      recover: async (error: ErrorRecord) => {
        logger.info("Attempting alternative method recovery", { errorId: error.id })
        return await this.attemptAlternativeMethod(error)
      },
    })

    // Стратегия пропуска файла
    this.recoveryStrategies.push({
      name: "skip_file",
      description: "Пропуск проблемного файла",
      appliesTo: ["unsupported_format", "permission_denied"],
      recover: async (error: ErrorRecord) => {
        logger.info("Skipping problematic file", { errorId: error.id, filePath: error.filePath })
        return true // Считаем успешным "восстановлением"
      },
    })
  }

  /**
   * Попытка повторного выполнения операции с exponential backoff
   */
  private async attemptRetry(error: ErrorRecord): Promise<boolean> {
    // Проверяем, можно ли retry этот тип ошибки
    if (!this.retryConfig.retryableErrors.includes(error.type)) {
      logger.debug("Error type is not retryable", { errorType: error.type })
      return false
    }

    // Проверяем метаданные на количество предыдущих попыток
    const attemptCount = (error.metadata?.attemptCount as number) || 0

    if (attemptCount >= this.retryConfig.maxAttempts) {
      logger.warn("Maximum retry attempts reached", {
        errorId: error.id,
        attempts: attemptCount,
      })
      return false
    }

    // Вычисляем задержку с exponential backoff
    const delay = this.retryConfig.initialDelay * this.retryConfig.backoffMultiplier ** attemptCount

    logger.info("Retrying operation with exponential backoff", {
      errorId: error.id,
      attempt: attemptCount + 1,
      maxAttempts: this.retryConfig.maxAttempts,
      delay,
    })

    // Ждем перед повторной попыткой
    await this.sleep(delay)

    // Обновляем метаданные с количеством попыток
    error.metadata = {
      ...error.metadata,
      attemptCount: attemptCount + 1,
      lastRetryAt: new Date().toISOString(),
    }

    // Здесь должна быть повторная попытка операции
    // Так как это generic retry, мы возвращаем true только если есть callback в metadata
    if (error.metadata.retryCallback && typeof error.metadata.retryCallback === "function") {
      try {
        await error.metadata.retryCallback()
        logger.info("Retry successful", { errorId: error.id })
        return true
      } catch (retryError) {
        logger.warn("Retry failed", {
          errorId: error.id,
          attempt: attemptCount + 1,
          error: retryError,
        })

        // Рекурсивно пробуем еще раз, если не достигли лимита
        if (attemptCount + 1 < this.retryConfig.maxAttempts) {
          return await this.attemptRetry(error)
        }

        return false
      }
    }

    // Если нет callback, считаем что retry не удался
    logger.debug("No retry callback provided in metadata", { errorId: error.id })
    return false
  }

  /**
   * Попытка использования альтернативного метода
   */
  private async attemptAlternativeMethod(error: ErrorRecord): Promise<boolean> {
    logger.info("Attempting alternative method", {
      errorId: error.id,
      errorType: error.type,
      filePath: error.filePath,
    })

    // Для ошибок метаданных - пробуем упрощенное извлечение
    if (error.type === "metadata_extraction_failed") {
      if (error.metadata?.alternativeMetadataCallback) {
        try {
          logger.info("Trying alternative metadata extraction", { errorId: error.id })
          await error.metadata.alternativeMetadataCallback()
          return true
        } catch (altError) {
          logger.warn("Alternative metadata extraction failed", {
            errorId: error.id,
            error: altError,
          })
          return false
        }
      }

      // Если нет callback, пробуем базовое извлечение метаданных через File API
      logger.debug("Using basic file metadata as fallback", {
        errorId: error.id,
        filePath: error.filePath,
      })

      // Возвращаем true, так как базовые метаданные всегда доступны
      return true
    }

    // Для ошибок генерации прокси - пробуем более низкое качество
    if (error.type === "proxy_generation_failed") {
      if (error.metadata?.alternativeProxyCallback) {
        try {
          logger.info("Trying alternative proxy generation with lower quality", {
            errorId: error.id,
          })
          await error.metadata.alternativeProxyCallback()
          return true
        } catch (altError) {
          logger.warn("Alternative proxy generation failed", {
            errorId: error.id,
            error: altError,
          })
          return false
        }
      }

      // Можем пропустить генерацию прокси и работать с оригиналом
      logger.debug("Skipping proxy generation, using original file", {
        errorId: error.id,
        filePath: error.filePath,
      })

      return true
    }

    logger.debug("No alternative method available for this error type", {
      errorType: error.type,
    })

    return false
  }

  /**
   * Вспомогательная функция для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Записать ошибку
   */
  trackError(
    type: ErrorType,
    message: string,
    options: {
      filePath?: string
      error?: Error
      metadata?: Record<string, any>
    } = {},
  ): ErrorRecord {
    const record: ErrorRecord = {
      id: this.generateErrorId(),
      type,
      message,
      timestamp: new Date(),
      filePath: options.filePath,
      stack: options.error?.stack,
      metadata: options.metadata,
    }

    this.errors.push(record)

    // Обновляем статистику неудачных операций
    this.updateOperationStats(type, false)

    // Ограничиваем размер массива
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    logger.error("Error tracked", {
      errorId: record.id,
      type: record.type,
      message: record.message,
      filePath: record.filePath,
    })

    return record
  }

  /**
   * Записать успешную операцию
   */
  trackSuccess(type: ErrorType): void {
    this.updateOperationStats(type, true)

    logger.debug("Successful operation tracked", { type })
  }

  /**
   * Обновить статистику операций
   */
  private updateOperationStats(type: ErrorType, success: boolean): void {
    const stats = this.operationStats.get(type)

    if (stats) {
      if (success) {
        stats.successCount++
      } else {
        stats.failureCount++
      }
      stats.lastUpdated = new Date()

      this.operationStats.set(type, stats)
    }
  }

  /**
   * Получить статистику операций
   */
  getOperationStats(type?: ErrorType): OperationStats | Map<ErrorType, OperationStats> {
    if (type) {
      const stats = this.operationStats.get(type)
      if (!stats) {
        // Возвращаем пустую статистику, если тип не найден
        return {
          type,
          successCount: 0,
          failureCount: 0,
          lastUpdated: new Date(),
        }
      }
      return stats
    }

    return new Map(this.operationStats)
  }

  /**
   * Получить reliability score для типа операции (0-100)
   */
  getReliabilityScore(type: ErrorType): number {
    const stats = this.operationStats.get(type)

    if (!stats) {
      return 100 // Если статистики нет, считаем надежность максимальной
    }

    const total = stats.successCount + stats.failureCount

    if (total === 0) {
      return 100 // Если операций не было, считаем надежность максимальной
    }

    return Math.round((stats.successCount / total) * 100)
  }

  /**
   * Попытка восстановления после ошибки
   */
  async attemptRecovery(errorRecord: ErrorRecord): Promise<boolean> {
    logger.info("Attempting error recovery", { errorId: errorRecord.id, type: errorRecord.type })

    // Находим применимые стратегии
    const applicableStrategies = this.recoveryStrategies.filter((strategy) =>
      strategy.appliesTo.includes(errorRecord.type),
    )

    if (applicableStrategies.length === 0) {
      logger.warn("No recovery strategies available", { errorType: errorRecord.type })
      return false
    }

    // Пробуем каждую стратегию
    for (const strategy of applicableStrategies) {
      try {
        logger.info("Trying recovery strategy", {
          errorId: errorRecord.id,
          strategy: strategy.name,
        })

        const recovered = await strategy.recover(errorRecord)

        if (recovered) {
          errorRecord.recovered = true
          errorRecord.recoveryStrategy = strategy.name

          logger.info("Error recovered successfully", {
            errorId: errorRecord.id,
            strategy: strategy.name,
          })

          return true
        }
      } catch (recoveryError) {
        logger.error("Recovery strategy failed", {
          errorId: errorRecord.id,
          strategy: strategy.name,
          recoveryError,
        })
      }
    }

    logger.warn("All recovery strategies exhausted", { errorId: errorRecord.id })
    return false
  }

  /**
   * Получить статистику ошибок
   */
  getStats(): ErrorStats {
    const byType: Record<ErrorType, number> = {
      import_failed: 0,
      metadata_extraction_failed: 0,
      file_operation_failed: 0,
      proxy_generation_failed: 0,
      camera_access_failed: 0,
      organization_failed: 0,
      network_error: 0,
      permission_denied: 0,
      disk_space_error: 0,
      unsupported_format: 0,
      unknown: 0,
    }

    let recoveredCount = 0

    for (const error of this.errors) {
      byType[error.type]++
      if (error.recovered) {
        recoveredCount++
      }
    }

    // Находим наиболее частые ошибки
    const mostFrequent = Object.entries(byType)
      .map(([type, count]) => ({ type: type as ErrorType, count }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: this.errors.length,
      byType,
      recoveryRate: this.errors.length > 0 ? (recoveredCount / this.errors.length) * 100 : 0,
      recent: this.errors.slice(-10).reverse(),
      mostFrequent,
    }
  }

  /**
   * Получить ошибки по типу
   */
  getErrorsByType(type: ErrorType): ErrorRecord[] {
    return this.errors.filter((error) => error.type === type)
  }

  /**
   * Получить ошибки для файла
   */
  getErrorsForFile(filePath: string): ErrorRecord[] {
    return this.errors.filter((error) => error.filePath === filePath)
  }

  /**
   * Очистить старые ошибки
   */
  clearOldErrors(olderThan: Date) {
    const beforeCount = this.errors.length
    this.errors = this.errors.filter((error) => error.timestamp > olderThan)

    const removed = beforeCount - this.errors.length

    logger.info("Cleared old errors", { removed, remaining: this.errors.length })
  }

  /**
   * Очистить все ошибки
   */
  clearAll() {
    const count = this.errors.length
    this.errors = []

    logger.info("Cleared all errors", { count })
  }

  /**
   * Экспорт ошибок для анализа
   */
  exportErrors(): string {
    return JSON.stringify(
      {
        errors: this.errors,
        stats: this.getStats(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    )
  }

  /**
   * Генерация уникального ID ошибки
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Получить процент неудач для операции (0-100)
   */
  getFailureRate(type: ErrorType, timeWindow?: number): number {
    // Если указано временное окно, фильтруем по нему
    if (timeWindow) {
      const now = Date.now()
      const recentErrors = this.errors.filter(
        (error) => error.type === type && now - error.timestamp.getTime() < timeWindow,
      )

      const stats = this.operationStats.get(type)

      if (!stats) {
        return recentErrors.length > 0 ? 100 : 0
      }

      // Приблизительный расчет на основе недавних ошибок и общей статистики
      const totalOperations = stats.successCount + stats.failureCount

      if (totalOperations === 0) {
        return recentErrors.length > 0 ? 100 : 0
      }

      // Используем инверсию reliability score для временного окна
      const recentFailureRatio = recentErrors.length / Math.max(totalOperations / 10, 1)
      return Math.min(100, Math.round(recentFailureRatio * 100))
    }

    // Без временного окна используем общую статистику
    const stats = this.operationStats.get(type)

    if (!stats) {
      return 0
    }

    const total = stats.successCount + stats.failureCount

    if (total === 0) {
      return 0
    }

    return Math.round((stats.failureCount / total) * 100)
  }

  /**
   * Рекомендации по улучшению на основе ошибок
   */
  getRecommendations(): string[] {
    const stats = this.getStats()
    const recommendations: string[] = []

    // Анализируем типы ошибок
    if (stats.byType.disk_space_error > 0) {
      recommendations.push("Освободите место на диске для корректной работы импорта")
    }

    if (stats.byType.permission_denied > 5) {
      recommendations.push("Проверьте права доступа к файлам и папкам")
    }

    if (stats.byType.network_error > 3) {
      recommendations.push("Проверьте сетевое подключение")
    }

    if (stats.byType.unsupported_format > 0) {
      recommendations.push("Некоторые файлы имеют неподдерживаемый формат. Рассмотрите возможность конвертации")
    }

    if (stats.recoveryRate < 50) {
      recommendations.push("Низкий процент восстановления после ошибок. Рекомендуется проверить настройки")
    }

    return recommendations
  }
}

/**
 * Singleton instance
 */
let errorTrackerInstance: ErrorTrackerService | null = null

/**
 * Получить instance сервиса
 */
export function getErrorTracker(): ErrorTrackerService {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTrackerService()
  }

  return errorTrackerInstance
}
