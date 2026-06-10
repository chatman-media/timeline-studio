import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("core:retry-helper")

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  backoffMultiplier?: number
  maxDelay?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
  onRetry?: (error: Error, attempt: number, delay: number) => void
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attempts: number
  totalDuration: number
}

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

      onRetry?.(lastError, attempt, delay)

      logger.warn("Operation failed, retrying", {
        attempt: attempt + 1,
        maxRetries,
        delay: `${delay}ms`,
        error: lastError.message,
      })

      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * backoffMultiplier, maxDelay)
    }
  }

  throw lastError!
}

export function withRetry(options: RetryOptions = {}) {
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return retryWithBackoff(() => originalMethod.apply(this, args), options)
    }

    return descriptor
  }
}

export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(fn: T, options: RetryOptions = {}): T {
  return ((...args: any[]) => {
    return retryWithBackoff(() => fn(...args), options)
  }) as T
}

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

export const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  if (isCriticalError(error)) {
    return false
  }

  if (isTransientError(error)) {
    return true
  }

  return attempt < 2
}
