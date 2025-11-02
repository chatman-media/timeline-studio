/**
 * Тесты для BaseAITool
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { BaseAITool, ConsoleAIToolLogger, NoOpAIToolLogger } from "../../base/base-ai-tool"
import type { AIToolExecutionOptions, AIToolMetadata, AIToolResult } from "../../types"

// Тестовый инструмент
class TestAITool extends BaseAITool {
  constructor(metadata?: Partial<AIToolMetadata>) {
    const defaultMetadata: AIToolMetadata = {
      name: "test-tool",
      domain: "core",
      category: "timeline",
      description: "Тестовый инструмент",
      version: "1.0.0",
      author: "Test",
      tags: ["test"],
      examples: [],
      dependencies: [],
    }
    super({ ...defaultMetadata, ...metadata })
  }

  async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
    return this.executeWithErrorHandling(
      async (_context) => {
        if (input.shouldFail) {
          throw new Error("Тестовая ошибка")
        }
        return { result: "success", input }
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return input !== null && input !== undefined && typeof input === "object" && !input.invalid
  }

  getSchema() {
    return {
      input: { type: "object" },
      output: { type: "object" },
    }
  }
}

describe("BaseAITool", () => {
  let tool: TestAITool

  beforeEach(() => {
    tool = new TestAITool()
  })

  describe("Конструктор и метаданные", () => {
    it("должен создавать инструмент с корректными метаданными", () => {
      expect(tool.metadata.name).toBe("test-tool")
      expect(tool.metadata.domain).toBe("core")
      expect(tool.metadata.category).toBe("timeline")
      expect(tool.metadata.version).toBe("1.0.0")
    })

    it("должен позволять переопределять метаданные", () => {
      const customTool = new TestAITool({
        name: "custom-tool",
        description: "Кастомный инструмент",
      })

      expect(customTool.metadata.name).toBe("custom-tool")
      expect(customTool.metadata.description).toBe("Кастомный инструмент")
      expect(customTool.metadata.domain).toBe("core") // Остальные поля по умолчанию
    })
  })

  describe("Выполнение инструмента", () => {
    it("должен успешно выполнять инструмент", async () => {
      const input = { test: "data" }
      const result = await tool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ result: "success", input })
      expect(result.toolName).toBe("test-tool")
      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.executionTime).toBeDefined()
    })

    it("должен обрабатывать ошибки", async () => {
      const input = { shouldFail: true }
      const result = await tool.execute(input)

      expect(result.success).toBe(false)
      expect(result.errors).toContain("Тестовая ошибка")
      expect(result.message).toContain("Ошибка выполнения инструмента test-tool")
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it("должен поддерживать retry логику", async () => {
      const input = { shouldFail: true }
      const options: AIToolExecutionOptions = {
        retries: 3,
        retryDelay: 10,
      }

      const result = await tool.execute(input, options)

      expect(result.success).toBe(false)
      expect(result.metadata?.attempts).toBe(3)
      expect(result.metadata?.maxRetries).toBe(3)
    })

    it("должен поддерживать таймаут", async () => {
      // Создаем инструмент с долгим выполнением
      class SlowTool extends TestAITool {
        async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
          return this.executeWithErrorHandling(
            async (_context) => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return { result: "slow" }
            },
            input,
            options,
          )
        }
      }

      const slowTool = new SlowTool()
      const options: AIToolExecutionOptions = { timeout: 50 }

      const result = await slowTool.execute({}, options)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Таймаут выполнения")
    })
  })

  describe("Валидация", () => {
    it("должен валидировать корректные входные данные", () => {
      expect(tool.validate({ valid: true })).toBe(true)
    })

    it("должен отклонять некорректные входные данные", () => {
      expect(tool.validate({ invalid: true })).toBe(false)
      expect(tool.validate(null)).toBe(false)
      expect(tool.validate("string")).toBe(false)
    })
  })

  describe("Схема", () => {
    it("должен возвращать схему входных и выходных данных", () => {
      const schema = tool.getSchema()

      expect(schema.input).toEqual({ type: "object" })
      expect(schema.output).toEqual({ type: "object" })
    })
  })

  describe("Логирование", () => {
    it("должен работать с ConsoleAIToolLogger", () => {
      const logger = new ConsoleAIToolLogger("[Test]")
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      logger.info("Test message", { data: "test" })

      expect(consoleSpy).toHaveBeenCalledWith("[Test] INFO: Test message", {
        data: "test",
      })

      consoleSpy.mockRestore()
    })

    it("должен работать с NoOpAIToolLogger", () => {
      const logger = new NoOpAIToolLogger()

      // Не должно выбрасывать ошибок
      expect(() => {
        logger.info()
        logger.warn()
        logger.error()
      }).not.toThrow()
    })

    it("должен использовать логгер при выполнении", async () => {
      const logger = new NoOpAIToolLogger()
      const infoSpy = vi.spyOn(logger, "info")

      tool.setLogger(logger)

      const options: AIToolExecutionOptions = { enableLogging: true }
      await tool.execute({ test: "data" }, options)

      expect(infoSpy).toHaveBeenCalled()
    })
  })

  describe("Утилитарные методы", () => {
    it("getToolName должен возвращать имя инструмента", () => {
      expect(tool.getToolName()).toBe("test-tool")
    })

    it("getMetadata должен возвращать метаданные", () => {
      const metadata = tool.getMetadata()
      expect(metadata.name).toBe("test-tool")
      expect(metadata.domain).toBe("core")
    })

    it("setLogger должен устанавливать логгер", () => {
      const logger = new ConsoleAIToolLogger()
      tool.setLogger(logger)

      // Проверяем, что логгер установлен (через приватное поле)
      expect((tool as any).logger).toBe(logger)
    })
  })

  describe("Защищенные методы", () => {
    class ExtendedTestTool extends TestAITool {
      public testCreateSuccessResult(data: any, message?: string) {
        return this.createSuccessResult(data, message)
      }

      public testSafeParseJSON(jsonString: string) {
        return this.safeParseJSON(jsonString)
      }

      public testNormalizeString(str: string) {
        return this.normalizeString(str)
      }

      public testIsEmpty(value: any) {
        return this.isEmpty(value)
      }
    }

    let extendedTool: ExtendedTestTool

    beforeEach(() => {
      extendedTool = new ExtendedTestTool()
    })

    it("createSuccessResult должен создавать успешный результат", () => {
      const result = extendedTool.testCreateSuccessResult({ test: "data" }, "Успех")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ test: "data" })
      expect(result.message).toBe("Успех")
      expect(result.metadata?.toolVersion).toBe("1.0.0")
    })

    it("safeParseJSON должен безопасно парсить JSON", () => {
      const validJson = extendedTool.testSafeParseJSON('{"test": "data"}')
      expect(validJson.success).toBe(true)
      expect(validJson.data).toEqual({ test: "data" })

      const invalidJson = extendedTool.testSafeParseJSON("invalid json")
      expect(invalidJson.success).toBe(false)
      expect(invalidJson.error).toContain("Ошибка парсинга JSON")
    })

    it("normalizeString должен нормализовать строки", () => {
      expect(extendedTool.testNormalizeString("  test   string  ")).toBe("test string")
      expect(extendedTool.testNormalizeString("test\n\nstring")).toBe("test string")
    })

    it("isEmpty должен проверять пустые значения", () => {
      expect(extendedTool.testIsEmpty(null)).toBe(true)
      expect(extendedTool.testIsEmpty(undefined)).toBe(true)
      expect(extendedTool.testIsEmpty("")).toBe(true)
      expect(extendedTool.testIsEmpty("   ")).toBe(true)
      expect(extendedTool.testIsEmpty([])).toBe(true)
      expect(extendedTool.testIsEmpty({})).toBe(true)

      expect(extendedTool.testIsEmpty("test")).toBe(false)
      expect(extendedTool.testIsEmpty([1])).toBe(false)
      expect(extendedTool.testIsEmpty({ test: "data" })).toBe(false)
      expect(extendedTool.testIsEmpty(0)).toBe(false)
    })
  })
})
