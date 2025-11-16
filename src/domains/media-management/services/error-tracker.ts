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
 * Сервис отслеживания ошибок
 */
export class ErrorTrackerService {
  private errors: ErrorRecord[] = []
  private maxErrors = 1000 // Максимум ошибок в памяти
  private recoveryStrategies: RecoveryStrategy[] = []

  constructor() {
    this.initializeRecoveryStrategies()
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
        // TODO: Реализовать retry логику
        return false
      },
    })

    // Стратегия альтернативного пути
    this.recoveryStrategies.push({
      name: "alternative_method",
      description: "Использование альтернативного метода",
      appliesTo: ["metadata_extraction_failed", "proxy_generation_failed"],
      recover: async (error: ErrorRecord) => {
        logger.info("Attempting alternative method recovery", { errorId: error.id })
        // TODO: Реализовать альтернативные методы
        return false
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
   * Получить процент неудач для операции
   */
  getFailureRate(type: ErrorType, timeWindow: number = 3600000): number {
    const now = Date.now()
    const recentErrors = this.errors.filter(
      (error) => error.type === type && now - error.timestamp.getTime() < timeWindow,
    )

    // TODO: Нужна статистика успешных операций для точного расчета
    // Пока возвращаем приблизительный показатель
    return recentErrors.length
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
