/**
 * Тест для Function Calling интеграции
 */

import { describe, expect, it } from "vitest"
import type { AIToolResult, IAITool } from "@/domains/ai-tools/types"
import { convertToolsToUnifiedFormat, convertToUnifiedAITool, executeToolByName } from "../utils/convert-tools"

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

describe("Function Calling Integration", () => {
  describe("convertToUnifiedAITool", () => {
    it("should convert BaseAITool to AITool format", () => {
      const mockTool = new MockTool()
      const aiTool = convertToUnifiedAITool(mockTool)

      expect(aiTool).toHaveProperty("name", "mock-tool")
      expect(aiTool).toHaveProperty("description", "A mock tool for testing")
      expect(aiTool).toHaveProperty("inputSchema")
      expect(aiTool.inputSchema).toEqual({
        testParam: "string",
      })
    })
  })

  describe("convertToolsToUnifiedFormat", () => {
    it("should convert array of tools", () => {
      const mockTools = [new MockTool(), new MockTool()]
      const aiTools = convertToolsToUnifiedFormat(mockTools)

      expect(aiTools).toHaveLength(2)
      expect(aiTools[0]).toHaveProperty("name", "mock-tool")
    })
  })

  describe("executeToolByName", () => {
    it("should execute tool by name", async () => {
      const mockTools = [new MockTool()]
      const result = await executeToolByName(mockTools, "mock-tool", { testParam: "test" })

      expect(result).toHaveProperty("result")
      expect(result.result).toBe("Executed with test")
    })

    it("should throw error if tool not found", async () => {
      const mockTools = [new MockTool()]

      await expect(executeToolByName(mockTools, "non-existent", {})).rejects.toThrow("Tool not found: non-existent")
    })

    it("should throw error if input is invalid", async () => {
      const mockTools = [new MockTool()]

      await expect(executeToolByName(mockTools, "mock-tool", null)).rejects.toThrow("Invalid input for tool: mock-tool")
    })
  })
})
