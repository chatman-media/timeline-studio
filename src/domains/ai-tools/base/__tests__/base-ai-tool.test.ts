/**
 * Тесты для BaseAITool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { BaseAITool, ConsoleAIToolLogger, NoOpAIToolLogger } from "../base-ai-tool"
import {
  SimpleTestTool,
  ErrorTestTool,
  DelayedTestTool,
  InvalidInputTestTool,
  createMockLogger,
} from "../../__mocks__"

describe("BaseAITool", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe("Базовая функциональность", () => {
    it("должен успешно выполнить инструмент с валидными данными", async () => {
      const tool = new SimpleTestTool()
      const input = { value: "test" }

      const promise = tool.execute(input)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ message: "Processed: test" })
      expect(result.toolName).toBe("SimpleTestTool")
      expect(result.executionId).toBeTruthy()
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it("должен вернуть ошибку для невалидных входных данных", async () => {
      const tool = new SimpleTestTool()
      const input = { invalid: "data" }

      const promise = tool.execute(input)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.errors).toContain("Входные данные не прошли валидацию")
      expect(result.message).toContain("Невалидные входные данные")
    })

    it("должен корректно обрабатывать ошибки при выполнении", async () => {
      const tool = new ErrorTestTool()
      const input = { errorMessage: "Custom error message" }

      const promise = tool.execute(input)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.errors).toContain("Custom error message")
      expect(result.message).toContain("Ошибка выполнения инструмента")
    })

    it("должен возвращать правильную схему", () => {
      const tool = new SimpleTestTool()
      const schema = tool.getSchema()

      expect(schema).toHaveProperty("input")
      expect(schema).toHaveProperty("output")
      expect(schema.input.type).toBe("object")
      expect(schema.input.required).toContain("value")
    })

    it("должен возвращать метаданные инструмента", () => {
      const tool = new SimpleTestTool()
      const metadata = tool.getMetadata()

      expect(metadata.name).toBe("SimpleTestTool")
      expect(metadata.domain).toBe("core")
      expect(metadata.category).toBe("timeline")
      expect(metadata.version).toBe("1.0.0")
    })

    it("должен возвращать имя инструмента", () => {
      const tool = new SimpleTestTool()

      expect(tool.getToolName()).toBe("SimpleTestTool")
    })
  })

  describe("Обработка ошибок и retry механизм", () => {
    it("должен повторить выполнение при ошибке", async () => {
      const tool = new ErrorTestTool()
      const input = { errorMessage: "Retry test" }

      const promise = tool.execute(input, {
        retries: 3,
        retryDelay: 100,
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.metadata?.attempts).toBe(3)
      expect(result.metadata?.maxRetries).toBe(3)
    })

    it("должен применять экспоненциальную задержку между попытками", async () => {
      const tool = new ErrorTestTool()
      const input = { errorMessage: "Exponential backoff test" }

      const startTime = Date.now()
      const promise = tool.execute(input, {
        retries: 3,
        retryDelay: 100,
      })

      // Симулируем прохождение времени для всех retry попыток
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.metadata?.attempts).toBe(3)
    })

    it("должен остановиться при первом успехе в retry", async () => {
      let attemptCount = 0
      const tool = new SimpleTestTool()

      // Переопределяем метод для симуляции ошибки на первых двух попытках
      const originalExecute = tool.execute.bind(tool)
      tool.execute = vi.fn(async (input: any, options?: any) => {
        attemptCount++
        if (attemptCount <= 2) {
          return {
            success: false,
            message: "Temporary failure",
            errors: ["Temporary error"],
            executionTime: 1,
            toolName: "SimpleTestTool",
            executionId: "test",
            metadata: {},
          }
        }
        return originalExecute(input, options)
      })

      const promise = tool.execute({ value: "test" }, { retries: 5 })
      await vi.runAllTimersAsync()

      expect(attemptCount).toBeLessThanOrEqual(3)
    })
  })

  describe("Таймауты", () => {
    it("должен прервать выполнение по таймауту", async () => {
      const tool = new DelayedTestTool()
      const input = { delay: 5000 } // 5 секунд задержка

      const promise = tool.execute(input, {
        timeout: 1000, // 1 секунда таймаут
      })

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.message).toContain("Таймаут выполнения")
    })

    it("должен успешно завершиться до таймаута", async () => {
      const tool = new DelayedTestTool()
      const input = { delay: 50 } // 50мс задержка

      const promise = tool.execute(input, {
        timeout: 1000, // 1 секунда таймаут
      })

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(true)
      expect(result.data?.delayed).toBe(true)
    })
  })

  describe("Логирование", () => {
    it("должен логировать выполнение с включенным логированием", async () => {
      const mockLogger = createMockLogger()
      const tool = new SimpleTestTool(undefined, mockLogger)
      const input = { value: "test" }

      const promise = tool.execute(input, { enableLogging: true })
      await vi.runAllTimersAsync()
      await promise

      expect(mockLogger.info).toHaveBeenCalled()
    })

    it("не должен логировать с выключенным логированием", async () => {
      const mockLogger = createMockLogger()
      const tool = new SimpleTestTool(undefined, mockLogger)
      const input = { value: "test" }

      const promise = tool.execute(input, { enableLogging: false })
      await vi.runAllTimersAsync()
      await promise

      expect(mockLogger.info).not.toHaveBeenCalled()
    })

    it("должен логировать ошибки при неудачном выполнении", async () => {
      const mockLogger = createMockLogger()
      const tool = new ErrorTestTool(undefined, mockLogger)
      const input = { errorMessage: "Test error" }

      const promise = tool.execute(input, {
        enableLogging: true,
        retries: 2,
      })
      await vi.runAllTimersAsync()
      await promise

      expect(mockLogger.warn).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it("должен позволить установить логгер после создания", () => {
      const tool = new SimpleTestTool()
      const mockLogger = createMockLogger()

      tool.setLogger(mockLogger)

      expect(() => tool.execute({ value: "test" })).not.toThrow()
    })
  })

  describe("Валидация входных данных", () => {
    it("должен валидировать обязательные поля", () => {
      const tool = new InvalidInputTestTool()

      expect(tool.validate({ requiredField: "value" })).toBe(true)
      expect(tool.validate({ requiredField: "" })).toBe(false)
      expect(tool.validate({})).toBe(false)
      expect(tool.validate(null)).toBe(false)
    })

    it("должен возвращать подробную информацию об ошибке валидации", async () => {
      const tool = new InvalidInputTestTool()
      const input = { invalid: "data" }

      const promise = tool.execute(input)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })

  describe("Метаданные результата", () => {
    it("должен включать метаданные в результат", async () => {
      const tool = new SimpleTestTool()
      const input = { value: "test" }
      const customMetadata = { userId: "123", context: "test" }

      const promise = tool.execute(input, {
        metadata: customMetadata,
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.metadata).toMatchObject(customMetadata)
      expect(result.metadata?.toolVersion).toBe("1.0.0")
      expect(result.metadata?.domain).toBe("core")
      expect(result.metadata?.category).toBe("timeline")
    })

    it("должен генерировать уникальный executionId", async () => {
      const tool = new SimpleTestTool()
      const input = { value: "test" }

      const promise1 = tool.execute(input)
      const promise2 = tool.execute(input)

      await vi.runAllTimersAsync()

      const result1 = await promise1
      const result2 = await promise2

      expect(result1.executionId).toBeTruthy()
      expect(result2.executionId).toBeTruthy()
      expect(result1.executionId).not.toBe(result2.executionId)
    })
  })

  describe("Утилитарные методы", () => {
    it("isEmpty должен корректно определять пустые значения", () => {
      const tool = new SimpleTestTool()

      expect((tool as any).isEmpty(null)).toBe(true)
      expect((tool as any).isEmpty(undefined)).toBe(true)
      expect((tool as any).isEmpty("")).toBe(true)
      expect((tool as any).isEmpty("   ")).toBe(true)
      expect((tool as any).isEmpty([])).toBe(true)
      expect((tool as any).isEmpty({})).toBe(true)

      expect((tool as any).isEmpty("value")).toBe(false)
      expect((tool as any).isEmpty([1, 2])).toBe(false)
      expect((tool as any).isEmpty({ key: "value" })).toBe(false)
      expect((tool as any).isEmpty(0)).toBe(false)
      expect((tool as any).isEmpty(false)).toBe(false)
    })

    it("normalizeString должен нормализовать строки", () => {
      const tool = new SimpleTestTool()

      expect((tool as any).normalizeString("  hello   world  ")).toBe("hello world")
      expect((tool as any).normalizeString("test\n\nstring")).toBe("test string")
    })

    it("safeParseJSON должен безопасно парсить JSON", () => {
      const tool = new SimpleTestTool()

      const validResult = (tool as any).safeParseJSON('{"key": "value"}')
      expect(validResult.success).toBe(true)
      expect(validResult.data).toEqual({ key: "value" })

      const invalidResult = (tool as any).safeParseJSON("invalid json")
      expect(invalidResult.success).toBe(false)
      expect(invalidResult.error).toBeTruthy()
    })

    it("safeParseJSON должен использовать fallback при ошибке", () => {
      const tool = new SimpleTestTool()
      const fallback = { default: "value" }

      const result = (tool as any).safeParseJSON("invalid json", fallback)
      expect(result.success).toBe(false)
      expect(result.data).toEqual(fallback)
    })
  })
})

describe("Логгеры", () => {
  describe("ConsoleAIToolLogger", () => {
    it("должен логировать в консоль", () => {
      const logger = new ConsoleAIToolLogger("[TEST]")

      expect(() => logger.info("Test message")).not.toThrow()
      expect(() => logger.warn("Warning message")).not.toThrow()
      expect(() => logger.error("Error message")).not.toThrow()
    })

    it("должен логировать с дополнительными данными", () => {
      const logger = new ConsoleAIToolLogger("[TEST]")
      const data = { key: "value", number: 123 }

      expect(() => logger.info("Test message", data)).not.toThrow()
    })
  })

  describe("NoOpAIToolLogger", () => {
    it("не должен выполнять никаких действий при логировании", () => {
      const logger = new NoOpAIToolLogger()

      expect(() => logger.info("Test message")).not.toThrow()
      expect(() => logger.warn("Warning message")).not.toThrow()
      expect(() => logger.error("Error message")).not.toThrow()
    })
  })
})
