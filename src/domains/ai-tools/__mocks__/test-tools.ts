/**
 * Моковые AI инструменты для тестирования
 */

import { BaseAITool } from "../base/base-ai-tool"
import type { AIToolExecutionOptions, AIToolMetadata, AIToolResult, FullExecutionContext } from "../types"

/**
 * Простой тестовый инструмент
 */
export class SimpleTestTool extends BaseAITool {
  public readonly metadata: AIToolMetadata = {
    name: "SimpleTestTool",
    displayName: "Simple Test Tool",
    description: "A simple test tool for unit testing",
    domain: "core",
    category: "timeline",
    version: "1.0.0",
    author: "Test Suite",
    tags: ["test", "simple"],
  }

  async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
    return this.executeWithErrorHandling(
      async (context: FullExecutionContext) => {
        // Простая обработка
        return { message: `Processed: ${input.value}` }
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return typeof input === "object" && input !== null && "value" in input
  }

  getSchema() {
    return {
      input: {
        type: "object",
        properties: {
          value: { type: "string" },
        },
        required: ["value"],
      },
      output: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    }
  }
}

/**
 * Тестовый инструмент с ошибкой
 */
export class ErrorTestTool extends BaseAITool {
  public readonly metadata: AIToolMetadata = {
    name: "ErrorTestTool",
    displayName: "Error Test Tool",
    description: "A test tool that always fails",
    domain: "core",
    category: "timeline",
    version: "1.0.0",
    author: "Test Suite",
    tags: ["test", "error"],
  }

  async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
    return this.executeWithErrorHandling(
      async () => {
        throw new Error(input.errorMessage || "Test error")
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return true
  }

  getSchema() {
    return {
      input: { type: "object" },
      output: { type: "object" },
    }
  }
}

/**
 * Тестовый инструмент с задержкой
 */
export class DelayedTestTool extends BaseAITool {
  public readonly metadata: AIToolMetadata = {
    name: "DelayedTestTool",
    displayName: "Delayed Test Tool",
    description: "A test tool with configurable delay",
    domain: "analysis",
    category: "video-analysis",
    version: "1.0.0",
    author: "Test Suite",
    tags: ["test", "delay"],
  }

  async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
    return this.executeWithErrorHandling(
      async () => {
        const delay = input.delay || 100
        await new Promise((resolve) => setTimeout(resolve, delay))
        return { delayed: true, delay }
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    return typeof input === "object" && input !== null
  }

  getSchema() {
    return {
      input: {
        type: "object",
        properties: {
          delay: { type: "number" },
        },
      },
      output: {
        type: "object",
        properties: {
          delayed: { type: "boolean" },
          delay: { type: "number" },
        },
      },
    }
  }
}

/**
 * Тестовый инструмент с невалидными входными данными
 */
export class InvalidInputTestTool extends BaseAITool {
  public readonly metadata: AIToolMetadata = {
    name: "InvalidInputTestTool",
    displayName: "Invalid Input Test Tool",
    description: "A test tool that validates input strictly",
    domain: "automation",
    category: "batch-processing",
    version: "1.0.0",
    author: "Test Suite",
    tags: ["test", "validation"],
  }

  async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
    return this.executeWithErrorHandling(
      async () => {
        return { valid: true }
      },
      input,
      options,
    )
  }

  validate(input: any): boolean {
    // Требуем строгую структуру входных данных
    return (
      typeof input === "object" &&
      input !== null &&
      "requiredField" in input &&
      typeof input.requiredField === "string" &&
      input.requiredField.length > 0
    )
  }

  getSchema() {
    return {
      input: {
        type: "object",
        properties: {
          requiredField: { type: "string", minLength: 1 },
        },
        required: ["requiredField"],
      },
      output: {
        type: "object",
        properties: {
          valid: { type: "boolean" },
        },
      },
    }
  }
}

/**
 * Создание мокового логгера
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}

/**
 * Создание мокового результата выполнения
 */
export function createMockToolResult<T = any>(
  success: boolean = true,
  data?: T,
  errors?: string[],
): AIToolResult<T> {
  return {
    success,
    data,
    message: success ? "Success" : "Failed",
    errors,
    executionTime: 100,
    toolName: "MockTool",
    executionId: "mock_exec_123",
    metadata: {
      attempt: 1,
      maxRetries: 1,
    },
  }
}

/**
 * Создание мокового метаданных инструмента
 */
export function createMockToolMetadata(overrides?: Partial<AIToolMetadata>): AIToolMetadata {
  return {
    name: "MockTool",
    displayName: "Mock Tool",
    description: "A mock tool for testing",
    domain: "core",
    category: "timeline",
    version: "1.0.0",
    author: "Test Suite",
    tags: ["test", "mock"],
    ...overrides,
  }
}
