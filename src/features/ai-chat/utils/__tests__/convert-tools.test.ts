/**
 * Расширенные тесты для Function Calling интеграции
 */

import { describe, expect, it } from "vitest"
import type { AIToolResult, IAITool } from "@/domains/ai-tools/types"
import {
  convertToolsToUnifiedFormat,
  convertToUnifiedAITool,
  executeToolByName,
  findToolByName,
} from "../convert-tools"

// Mock tool для тестирования
class MockTool implements IAITool {
  metadata = {
    name: "mock-tool",
    displayName: "Mock Tool",
    description: "A mock tool for testing",
    domain: "core" as const,
    category: "timeline" as const,
    version: "1.0.0",
  }

  validate(input: any): boolean {
    return input && typeof input === "object"
  }

  getSchema() {
    return {
      input: {
        testParam: "string",
      },
      output: {
        result: "string",
      },
    }
  }

  async execute(input: any): Promise<AIToolResult<any>> {
    return {
      success: true,
      data: { result: `Executed with ${input.testParam}` },
      message: "Tool executed successfully",
      executionTime: 0,
      toolName: this.metadata.name,
      executionId: `exec-${Date.now()}`,
    }
  }
}

// Mock tool с валидацией
class ValidationTool implements IAITool {
  metadata = {
    name: "validation-tool",
    displayName: "Validation Tool",
    description: "A tool that validates input",
    domain: "core" as const,
    category: "timeline" as const,
    version: "1.0.0",
  }

  validate(input: any): boolean {
    // Требуется поле requiredField
    return input && typeof input === "object" && typeof input.requiredField === "string"
  }

  getSchema() {
    return {
      input: {
        requiredField: "string",
      },
      output: {
        validated: "boolean",
      },
    }
  }

  async execute(_input: any): Promise<AIToolResult<any>> {
    return {
      success: true,
      data: { validated: true },
      message: "Validation successful",
      executionTime: 0,
      toolName: this.metadata.name,
      executionId: `exec-${Date.now()}`,
    }
  }
}

// Mock tool с ошибкой выполнения
class ErrorTool implements IAITool {
  metadata = {
    name: "error-tool",
    displayName: "Error Tool",
    description: "A tool that fails execution",
    domain: "core" as const,
    category: "timeline" as const,
    version: "1.0.0",
  }

  validate(_input: any): boolean {
    return true
  }

  getSchema() {
    return {
      input: {},
      output: {},
    }
  }

  async execute(_input: any): Promise<AIToolResult<any>> {
    return {
      success: false,
      data: null,
      message: "Execution failed",
      executionTime: 0,
      toolName: this.metadata.name,
      executionId: `exec-${Date.now()}`,
    }
  }
}

// Mock tool с асинхронной операцией
class AsyncTool implements IAITool {
  metadata = {
    name: "async-tool",
    displayName: "Async Tool",
    description: "A tool with async operations",
    domain: "core" as const,
    category: "timeline" as const,
    version: "1.0.0",
  }

  validate(input: any): boolean {
    return input && typeof input === "object"
  }

  getSchema() {
    return {
      input: {
        delay: "number",
      },
      output: {
        completed: "boolean",
      },
    }
  }

  async execute(input: any): Promise<AIToolResult<any>> {
    await new Promise((resolve) => setTimeout(resolve, input.delay || 10))
    return {
      success: true,
      data: { completed: true },
      message: "Async operation completed",
      executionTime: input.delay || 10,
      toolName: this.metadata.name,
      executionId: `exec-${Date.now()}`,
    }
  }
}

describe("Function Calling Integration", () => {
  describe("convertToUnifiedAITool", () => {
    it("должен конвертировать BaseAITool в AITool формат", () => {
      const mockTool = new MockTool()
      const aiTool = convertToUnifiedAITool(mockTool)

      expect(aiTool).toHaveProperty("name", "mock-tool")
      expect(aiTool).toHaveProperty("description", "A mock tool for testing")
      expect(aiTool).toHaveProperty("inputSchema")
      expect(aiTool.inputSchema).toEqual({
        testParam: "string",
      })
    })

    it("должен корректно обрабатывать сложные схемы", () => {
      class ComplexTool implements IAITool {
        metadata = {
          name: "complex-tool",
          displayName: "Complex Tool",
          description: "Tool with complex schema",
          domain: "core" as const,
          category: "timeline" as const,
          version: "1.0.0",
        }

        validate(_input: any): boolean {
          return true
        }

        getSchema() {
          return {
            input: {
              stringField: "string",
              numberField: "number",
              booleanField: "boolean",
              arrayField: "array",
              objectField: "object",
            },
            output: {
              result: "object",
            },
          }
        }

        async execute(_input: any): Promise<AIToolResult<any>> {
          return {
            success: true,
            data: {},
            message: "",
            executionTime: 0,
            toolName: this.metadata.name,
            executionId: `exec-${Date.now()}`,
          }
        }
      }

      const complexTool = new ComplexTool()
      const aiTool = convertToUnifiedAITool(complexTool)

      expect(aiTool.inputSchema).toEqual({
        stringField: "string",
        numberField: "number",
        booleanField: "boolean",
        arrayField: "array",
        objectField: "object",
      })
    })
  })

  describe("convertToolsToUnifiedFormat", () => {
    it("должен конвертировать массив инструментов", () => {
      const mockTools = [new MockTool(), new ValidationTool()]
      const aiTools = convertToolsToUnifiedFormat(mockTools)

      expect(aiTools).toHaveLength(2)
      expect(aiTools[0]).toHaveProperty("name", "mock-tool")
      expect(aiTools[1]).toHaveProperty("name", "validation-tool")
    })

    it("должен обрабатывать пустой массив", () => {
      const aiTools = convertToolsToUnifiedFormat([])

      expect(aiTools).toEqual([])
    })

    it("должен конвертировать множество различных инструментов", () => {
      const tools = [new MockTool(), new ValidationTool(), new ErrorTool(), new AsyncTool()]
      const aiTools = convertToolsToUnifiedFormat(tools)

      expect(aiTools).toHaveLength(4)
      expect(aiTools.map((t) => t.name)).toEqual(["mock-tool", "validation-tool", "error-tool", "async-tool"])
    })
  })

  describe("findToolByName", () => {
    it("должен найти инструмент по имени", () => {
      const tools = [new MockTool(), new ValidationTool(), new ErrorTool()]
      const found = findToolByName(tools, "validation-tool")

      expect(found).toBeDefined()
      expect(found?.metadata.name).toBe("validation-tool")
    })

    it("должен вернуть undefined если инструмент не найден", () => {
      const tools = [new MockTool(), new ValidationTool()]
      const found = findToolByName(tools, "non-existent-tool")

      expect(found).toBeUndefined()
    })

    it("должен обрабатывать пустой массив инструментов", () => {
      const found = findToolByName([], "any-tool")

      expect(found).toBeUndefined()
    })

    it("должен быть чувствительным к регистру", () => {
      const tools = [new MockTool()]
      const found = findToolByName(tools, "Mock-Tool")

      expect(found).toBeUndefined()
    })
  })

  describe("executeToolByName", () => {
    it("должен выполнить инструмент по имени", async () => {
      const mockTools = [new MockTool()]
      const result = await executeToolByName(mockTools, "mock-tool", { testParam: "test" })

      expect(result).toHaveProperty("result")
      expect(result.result).toBe("Executed with test")
    })

    it("должен выбросить ошибку если инструмент не найден", async () => {
      const mockTools = [new MockTool()]

      await expect(executeToolByName(mockTools, "non-existent", {})).rejects.toThrow("Tool not found: non-existent")
    })

    it("должен выбросить ошибку если входные данные невалидны", async () => {
      const mockTools = [new ValidationTool()]

      // Отсутствует requiredField
      await expect(executeToolByName(mockTools, "validation-tool", {})).rejects.toThrow(
        "Invalid input for tool: validation-tool",
      )
    })

    it("должен выбросить ошибку если входные данные null", async () => {
      const mockTools = [new MockTool()]

      await expect(executeToolByName(mockTools, "mock-tool", null)).rejects.toThrow("Invalid input for tool: mock-tool")
    })

    it("должен выбросить ошибку если выполнение инструмента не удалось", async () => {
      const mockTools = [new ErrorTool()]

      await expect(executeToolByName(mockTools, "error-tool", {})).rejects.toThrow("Execution failed")
    })

    it("должен корректно выполнять асинхронные инструменты", async () => {
      const mockTools = [new AsyncTool()]
      const startTime = Date.now()

      const result = await executeToolByName(mockTools, "async-tool", { delay: 50 })

      const elapsed = Date.now() - startTime
      expect(result).toEqual({ completed: true })
      expect(elapsed).toBeGreaterThanOrEqual(45) // Учитываем небольшую погрешность
    })

    it("должен передавать корректные параметры в инструмент", async () => {
      const mockTools = [new MockTool()]
      const input = { testParam: "custom-value" }

      const result = await executeToolByName(mockTools, "mock-tool", input)

      expect(result.result).toBe("Executed with custom-value")
    })

    it("должен обрабатывать инструменты с пустым результатом", async () => {
      class EmptyResultTool implements IAITool {
        metadata = {
          name: "empty-result-tool",
          displayName: "Empty Result Tool",
          description: "Returns empty data",
          domain: "core" as const,
          category: "timeline" as const,
          version: "1.0.0",
        }

        validate(_input: any): boolean {
          return true
        }

        getSchema() {
          return {
            input: {},
            output: {},
          }
        }

        async execute(_input: any): Promise<AIToolResult<any>> {
          return {
            success: true,
            data: {},
            message: "Empty result",
            executionTime: 0,
            toolName: this.metadata.name,
            executionId: `exec-${Date.now()}`,
          }
        }
      }

      const mockTools = [new EmptyResultTool()]
      const result = await executeToolByName(mockTools, "empty-result-tool", {})

      expect(result).toEqual({})
    })
  })

  describe("Edge Cases", () => {
    it("должен обрабатывать инструменты с одинаковым именем (берет первый)", async () => {
      const tool1 = new MockTool()
      const tool2 = new MockTool()
      const tools = [tool1, tool2]

      const found = findToolByName(tools, "mock-tool")
      expect(found).toBe(tool1)
    })

    it("должен обрабатывать большие входные данные", async () => {
      const mockTools = [new MockTool()]
      const largeString = "x".repeat(10000)
      const result = await executeToolByName(mockTools, "mock-tool", { testParam: largeString })

      expect(result.result).toBe(`Executed with ${largeString}`)
    })

    it("должен обрабатывать специальные символы в именах инструментов", () => {
      class SpecialNameTool implements IAITool {
        metadata = {
          name: "tool-with-special_chars-123",
          displayName: "Special Name Tool",
          description: "Tool with special characters in name",
          domain: "core" as const,
          category: "timeline" as const,
          version: "1.0.0",
        }

        validate(_input: any): boolean {
          return true
        }

        getSchema() {
          return {
            input: {},
            output: {},
          }
        }

        async execute(_input: any): Promise<AIToolResult<any>> {
          return {
            success: true,
            data: {},
            message: "",
            executionTime: 0,
            toolName: this.metadata.name,
            executionId: `exec-${Date.now()}`,
          }
        }
      }

      const tools = [new SpecialNameTool()]
      const found = findToolByName(tools, "tool-with-special_chars-123")

      expect(found).toBeDefined()
      expect(found?.metadata.name).toBe("tool-with-special_chars-123")
    })

    it("должен корректно обрабатывать параллельное выполнение инструментов", async () => {
      const tools = [new AsyncTool()]

      const promises = [
        executeToolByName(tools, "async-tool", { delay: 10 }),
        executeToolByName(tools, "async-tool", { delay: 20 }),
        executeToolByName(tools, "async-tool", { delay: 15 }),
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result.completed).toBe(true)
      })
    })
  })
})
