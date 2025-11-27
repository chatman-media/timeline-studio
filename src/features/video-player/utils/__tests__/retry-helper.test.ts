import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createRetryWrapper,
  defaultShouldRetry,
  isCriticalError,
  isTransientError,
  retryWithBackoff,
} from "../retry-helper"

describe("retry-helper", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe("retryWithBackoff", () => {
    it("должен успешно выполнить операцию с первого раза", async () => {
      const operation = vi.fn().mockResolvedValue("success")

      const promise = retryWithBackoff(operation)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe("success")
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it("должен повторять операцию при неудаче", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success")

      const promise = retryWithBackoff(operation, { maxRetries: 3, initialDelay: 100 })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe("success")
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it("должен использовать exponential backoff", async () => {
      const delays: number[] = []
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success")

      const onRetry = vi.fn((_error, _attempt, delay) => {
        delays.push(delay)
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        onRetry,
      })
      await vi.runAllTimersAsync()
      await promise

      expect(delays).toEqual([100, 200])
    })

    it("должен ограничивать максимальную задержку", async () => {
      const delays: number[] = []
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockRejectedValueOnce(new Error("fail 3"))
        .mockResolvedValue("success")

      const onRetry = vi.fn((_error, _attempt, delay) => {
        delays.push(delay)
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 4,
        initialDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 2000,
        onRetry,
      })
      await vi.runAllTimersAsync()
      await promise

      // Задержки: 1000, 2000 (capped), 2000 (capped)
      expect(delays).toEqual([1000, 2000, 2000])
    })

    it("должен выбрасывать ошибку после исчерпания попыток", async () => {
      let callCount = 0
      const operation = vi.fn(async () => {
        callCount++
        throw new Error("permanent failure")
      })

      let caughtError: Error | null = null
      const promise = retryWithBackoff(operation, { maxRetries: 2, initialDelay: 10 }).catch((error) => {
        caughtError = error
      })
      await vi.runAllTimersAsync()
      await promise

      expect(caughtError).toBeInstanceOf(Error)
      expect((caughtError as unknown as Error).message).toBe("permanent failure")
      expect(callCount).toBe(3) // initial + 2 retries
    })

    it("должен использовать shouldRetry для определения необходимости повтора", async () => {
      let callCount = 0
      const operation = vi.fn(async () => {
        callCount++
        throw new Error("CRITICAL: fatal error")
      })

      const shouldRetry = vi.fn(() => false)

      let caughtError: Error | null = null
      const promise = retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
        shouldRetry,
      }).catch((error) => {
        caughtError = error
      })
      await vi.runAllTimersAsync()
      await promise

      expect(caughtError).toBeInstanceOf(Error)
      expect((caughtError as unknown as Error).message).toBe("CRITICAL: fatal error")
      expect(callCount).toBe(1)
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 0)
    })

    it("должен вызывать onRetry перед каждой попыткой", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success")

      const onRetry = vi.fn()

      const promise = retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        onRetry,
      })
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledTimes(2)
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 0, 100)
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 1, 200)
    })

    it("должен использовать значения по умолчанию", async () => {
      const operation = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("success")

      const promise = retryWithBackoff(operation)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe("success")
    })
  })

  describe("createRetryWrapper", () => {
    it("должен создавать обертку для функции с retry логикой", async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("success")

      const wrappedFn = createRetryWrapper(fn, { maxRetries: 2, initialDelay: 10 })

      const promise = wrappedFn("arg1", "arg2")
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe("success")
      expect(fn).toHaveBeenCalledWith("arg1", "arg2")
    })

    it("должен передавать аргументы в оригинальную функцию", async () => {
      const fn = vi.fn().mockResolvedValue("ok")
      const wrappedFn = createRetryWrapper(fn)

      const promise = wrappedFn(1, 2, 3)
      await vi.runAllTimersAsync()
      await promise

      expect(fn).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  describe("isTransientError", () => {
    it("должен распознавать временные ошибки", () => {
      expect(isTransientError(new Error("Network timeout"))).toBe(true)
      expect(isTransientError(new Error("ECONNRESET"))).toBe(true)
      expect(isTransientError(new Error("ENOTFOUND"))).toBe(true)
      expect(isTransientError(new Error("ETIMEDOUT"))).toBe(true)
      expect(isTransientError(new Error("ECONNREFUSED"))).toBe(true)
      expect(isTransientError(new Error("Service temporarily unavailable"))).toBe(true)
    })

    it("не должен распознавать постоянные ошибки как временные", () => {
      expect(isTransientError(new Error("Invalid input"))).toBe(false)
      expect(isTransientError(new Error("Not found"))).toBe(false)
      expect(isTransientError(new Error("Unauthorized"))).toBe(false)
    })

    it("должен быть case-insensitive", () => {
      expect(isTransientError(new Error("NETWORK ERROR"))).toBe(true)
      expect(isTransientError(new Error("network error"))).toBe(true)
      expect(isTransientError(new Error("Network Error"))).toBe(true)
    })
  })

  describe("isCriticalError", () => {
    it("должен распознавать критичные ошибки", () => {
      expect(isCriticalError(new Error("CRITICAL: system failure"))).toBe(true)
      expect(isCriticalError(new Error("FATAL error occurred"))).toBe(true)
      expect(isCriticalError(new Error("Invalid request format"))).toBe(true)
      expect(isCriticalError(new Error("Unauthorized access"))).toBe(true)
      expect(isCriticalError(new Error("Forbidden resource"))).toBe(true)
      expect(isCriticalError(new Error("Resource not found"))).toBe(true)
      expect(isCriticalError(new Error("Bad request"))).toBe(true)
    })

    it("не должен распознавать обычные ошибки как критичные", () => {
      expect(isCriticalError(new Error("Network timeout"))).toBe(false)
      expect(isCriticalError(new Error("Connection reset"))).toBe(false)
    })

    it("должен быть case-insensitive", () => {
      expect(isCriticalError(new Error("CRITICAL"))).toBe(true)
      expect(isCriticalError(new Error("critical"))).toBe(true)
      expect(isCriticalError(new Error("Critical"))).toBe(true)
    })
  })

  describe("defaultShouldRetry", () => {
    it("не должен повторять критичные ошибки", () => {
      const error = new Error("CRITICAL: fatal error")
      expect(defaultShouldRetry(error, 0)).toBe(false)
      expect(defaultShouldRetry(error, 1)).toBe(false)
    })

    it("должен повторять временные ошибки", () => {
      const error = new Error("Network timeout")
      expect(defaultShouldRetry(error, 0)).toBe(true)
      expect(defaultShouldRetry(error, 1)).toBe(true)
      expect(defaultShouldRetry(error, 5)).toBe(true)
    })

    it("должен повторять обычные ошибки только первые 2 попытки", () => {
      const error = new Error("Some error")
      expect(defaultShouldRetry(error, 0)).toBe(true)
      expect(defaultShouldRetry(error, 1)).toBe(true)
      expect(defaultShouldRetry(error, 2)).toBe(false)
      expect(defaultShouldRetry(error, 3)).toBe(false)
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать синхронные ошибки", async () => {
      let callCount = 0
      const operation = vi.fn(async () => {
        callCount++
        throw new Error("sync error")
      })

      let caughtError: Error | null = null
      const promise = retryWithBackoff(operation, { maxRetries: 1, initialDelay: 10 }).catch((error) => {
        caughtError = error
      })
      await vi.runAllTimersAsync()
      await promise

      expect(caughtError).toBeInstanceOf(Error)
      expect((caughtError as unknown as Error).message).toBe("sync error")
      expect(callCount).toBe(2) // initial + 1 retry
    })

    it("должен обрабатывать нулевую задержку", async () => {
      const operation = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("success")

      const promise = retryWithBackoff(operation, {
        maxRetries: 1,
        initialDelay: 0,
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe("success")
    })

    it("должен обрабатывать максимальное количество попыток = 0", async () => {
      let callCount = 0
      const operation = vi.fn(async () => {
        callCount++
        throw new Error("fail")
      })

      let caughtError: Error | null = null
      const promise = retryWithBackoff(operation, { maxRetries: 0, initialDelay: 10 }).catch((error) => {
        caughtError = error
      })
      await vi.runAllTimersAsync()
      await promise

      expect(caughtError).toBeInstanceOf(Error)
      expect((caughtError as unknown as Error).message).toBe("fail")
      expect(callCount).toBe(1)
    })

    it("должен обрабатывать undefined как результат операции", async () => {
      const operation = vi.fn().mockResolvedValue(undefined)

      const promise = retryWithBackoff(operation)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBeUndefined()
    })

    it("должен обрабатывать null как результат операции", async () => {
      const operation = vi.fn().mockResolvedValue(null)

      const promise = retryWithBackoff(operation)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBeNull()
    })

    it("должен правильно считать попытки при частичных успехах", async () => {
      let callCount = 0
      const operation = vi.fn(async () => {
        callCount++
        if (callCount < 3) {
          throw new Error("not yet")
        }
        return "success"
      })

      const promise = retryWithBackoff(operation, { maxRetries: 5, initialDelay: 10 })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe("success")
      expect(callCount).toBe(3)
    })
  })

  describe("performance", () => {
    it("не должен добавлять задержку для успешной первой попытки", async () => {
      const operation = vi.fn().mockResolvedValue("success")
      const startTime = Date.now()

      const promise = retryWithBackoff(operation, { initialDelay: 1000 })
      await vi.runAllTimersAsync()
      await promise

      const endTime = Date.now()
      const elapsed = endTime - startTime

      // Успешная операция не должна иметь задержки
      expect(elapsed).toBeLessThan(100)
    })
  })

  describe("интеграция", () => {
    it("должен корректно работать с асинхронными операциями реального мира", async () => {
      let attempt = 0
      const operation = vi.fn(async () => {
        attempt++
        if (attempt < 3) {
          throw new Error(`Attempt ${attempt} failed`)
        }
        return { data: "success", attempt }
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 5,
        initialDelay: 50,
        backoffMultiplier: 2,
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toEqual({ data: "success", attempt: 3 })
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it("должен работать с пользовательской логикой shouldRetry", async () => {
      let callCount = 0
      const errors = [new Error("Temporary issue"), new Error("CRITICAL issue")]
      const operation = vi.fn(async () => {
        const error = errors[callCount] || errors[errors.length - 1]
        callCount++
        throw error
      })

      const shouldRetry = vi.fn((error: Error) => {
        return !error.message.includes("CRITICAL")
      })

      // Создаём promise и добавляем обработчик catch сразу
      let caughtError: Error | null = null
      const promise = retryWithBackoff(operation, {
        maxRetries: 5,
        initialDelay: 10,
        shouldRetry,
      }).catch((error) => {
        caughtError = error
      })

      await vi.runAllTimersAsync()
      await promise

      expect(caughtError).toBeInstanceOf(Error)
      expect((caughtError as unknown as Error).message).toBe("CRITICAL issue")
      expect(callCount).toBe(2)
      // shouldRetry вызывается для каждой ошибки: сначала "Temporary issue" (true), затем "CRITICAL issue" (false)
      expect(shouldRetry).toHaveBeenCalledTimes(2)
    })
  })
})
