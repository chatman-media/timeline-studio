import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:retry-helper")

export interface RetryOptions {
  /**
   * Максимальное количество попыток
   * @default 3
   */
  maxRetries?: number

  /**
   * Начальная задержка в миллисекундах
   * @default 100
   */
  initialDelay?: number

  /**
   * Множитель для exponential backoff
   * @default 2
   */
  backoffMultiplier?: number

  /**
   * Максимальная задержка в миллисекундах
   * @default 5000
   */
  maxDelay?: number

  /**
   * Функция для определения, нужно ли повторять попытку
   * @default undefined (повторяет для всех ошибок)
   */
  shouldRetry?: (error: Error, attempt: number) => boolean

  /**
   * Callback, вызываемый перед каждой попыткой
   */
  onRetry?: (error: Error, attempt: number, delay: number) => void
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attempts: number
  totalDuration: number
}

/**
 * Выполняет операцию с повторными попытками и exponential backoff
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     return await backendSync.executeCommand(command)
 *   },
 *   {
 *     maxRetries: 3,
 *     initialDelay: 100,
 *     shouldRetry: (error) => {
 *       // Не повторяем для критичных ошибок
 *       return !error.message.includes('CRITICAL')
 *     }
 *   }
 * )
 * ```
 */
export async function retryWithBackoff<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, initialDelay = 100, backoffMultiplier = 2, maxDelay = 5000, shouldRetry, onRetry } = options

  let lastError: Error | null = null
  let delay = initialDelay
  const startTime = performance.now()

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()

      if (attempt > 0) {
        const duration = performance.now() - startTime
        logger.info("Operation succeeded after retries", {
          attempts: attempt + 1,
          duration: `${duration.toFixed(2)}ms`,
        })
      }

      return result
    } catch (error) {
      lastError = error as Error

      // Проверяем, нужно ли повторять
      const isLastAttempt = attempt === maxRetries
      const shouldRetryError = shouldRetry ? shouldRetry(lastError, attempt) : true

      if (isLastAttempt || !shouldRetryError) {
        const duration = performance.now() - startTime
        logger.error("Operation failed after all retries", {
          attempts: attempt + 1,
          duration: `${duration.toFixed(2)}ms`,
          error: lastError.message,
        })
        throw lastError
      }

      // Вызываем callback перед повтором
      onRetry?.(lastError, attempt, delay)

      logger.warn("Operation failed, retrying", {
        attempt: attempt + 1,
        maxRetries,
        delay: `${delay}ms`,
        error: lastError.message,
      })

      // Ждем перед следующей попыткой
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Увеличиваем задержку с exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay)
    }
  }

  // Этот код не должен выполниться, но TypeScript требует return
  throw lastError!
}

/**
 * Декоратор для автоматического добавления retry logic к методам
 *
 * @example
 * ```typescript
 * class BackendService {
 *   @withRetry({ maxRetries: 3 })
 *   async executeCommand(command: Command) {
 *     return await this.backend.execute(command)
 *   }
 * }
 * ```
 */
export function withRetry(options: RetryOptions = {}) {
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return retryWithBackoff(() => originalMethod.apply(this, args), options)
    }

    return descriptor
  }
}

/**
 * Создает retry-обертку для функции
 *
 * @example
 * ```typescript
 * const executeWithRetry = createRetryWrapper(
 *   backendSync.executeCommand,
 *   { maxRetries: 3 }
 * )
 *
 * await executeWithRetry(command)
 * ```
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(fn: T, options: RetryOptions = {}): T {
  return ((...args: any[]) => {
    return retryWithBackoff(() => fn(...args), options)
  }) as T
}

/**
 * Проверяет, является ли ошибка временной (можно повторить)
 */
export function isTransientError(error: Error): boolean {
  const transientPatterns = [
    /network/i,
    /timeout/i,
    /ECONNRESET/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
    /ECONNREFUSED/i,
    /temporary/i,
    /unavailable/i,
  ]

  return transientPatterns.some((pattern) => pattern.test(error.message))
}

/**
 * Проверяет, является ли ошибка критичной (не нужно повторять)
 */
export function isCriticalError(error: Error): boolean {
  const criticalPatterns = [
    /CRITICAL/i,
    /FATAL/i,
    /invalid/i,
    /unauthorized/i,
    /forbidden/i,
    /not found/i,
    /bad request/i,
  ]

  return criticalPatterns.some((pattern) => pattern.test(error.message))
}

/**
 * Стандартная функция shouldRetry для общего использования
 */
export const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  // Не повторяем критичные ошибки
  if (isCriticalError(error)) {
    return false
  }

  // Повторяем временные ошибки
  if (isTransientError(error)) {
    return true
  }

  // Повторяем первые 2 попытки для остальных ошибок
  return attempt < 2
}
