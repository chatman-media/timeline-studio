/**
 * Tools Converter - конвертация BaseAITool в универсальный формат AITool
 *
 * Конвертирует локальные AI инструменты в универсальный формат,
 * который бэкенд автоматически адаптирует для Claude, OpenAI, DeepSeek и других провайдеров.
 */

import type { IAITool } from "@/domains/ai-tools/types"

// AITool type is not exported from tauri-bindings yet, using placeholder
type AITool = {
  name: string
  description: string
  inputSchema: any
}

/**
 * Конвертирует BaseAITool в универсальный формат AITool
 *
 * @param tool - Локальный AI инструмент
 * @returns Универсальный AITool для отправки на бэкенд
 */
export function convertToUnifiedAITool(tool: IAITool): AITool {
  // Проверяем, что tool имеет метод getSchema
  if (!tool || typeof tool.getSchema !== "function") {
    console.error("Invalid tool structure:", {
      tool,
      hasGetSchema: typeof tool?.getSchema,
      metadata: tool?.metadata,
    })
    throw new Error(
      `Tool ${tool?.metadata?.name || "unknown"} does not have getSchema() method. This tool is not properly implemented.`,
    )
  }

  const schema = tool.getSchema()

  return {
    name: tool.metadata.name,
    description: tool.metadata.description,
    inputSchema: schema.input,
  }
}

/**
 * Конвертирует массив BaseAITool в массив универсальных AITool
 *
 * @param tools - Массив локальных AI инструментов
 * @returns Массив универсальных AITool для отправки на бэкенд
 */
export function convertToolsToUnifiedFormat(tools: IAITool[]): AITool[] {
  // Фильтруем массив - оставляем только валидные инструменты
  const validTools = tools.filter((tool) => {
    // Проверяем, что tool это объект с методом getSchema и metadata
    if (!tool || typeof tool !== "object") return false
    if (typeof tool.getSchema !== "function") return false
    if (!tool.metadata || typeof tool.metadata !== "object") return false
    if (!tool.metadata.name || typeof tool.metadata.name !== "string") return false
    return true
  })

  return validTools.map(convertToUnifiedAITool)
}

/**
 * Находит инструмент по имени
 *
 * @param tools - Массив локальных AI инструментов
 * @param name - Имя инструмента
 * @returns Найденный инструмент или undefined
 */
export function findToolByName(tools: IAITool[], name: string): IAITool | undefined {
  return tools.find((tool) => tool.metadata.name === name)
}

/**
 * Выполняет инструмент по имени с переданными параметрами
 *
 * @param tools - Массив локальных AI инструментов
 * @param name - Имя инструмента для выполнения
 * @param input - Входные данные для инструмента
 * @returns Результат выполнения инструмента
 */
export async function executeToolByName(tools: IAITool[], name: string, input: any): Promise<any> {
  const tool = findToolByName(tools, name)

  if (!tool) {
    throw new Error(`Tool not found: ${name}`)
  }

  // Валидация входных данных
  if (!tool.validate(input)) {
    throw new Error(`Invalid input for tool: ${name}`)
  }

  // Выполнение инструмента
  const result = await tool.execute(input)

  if (!result.success) {
    throw new Error(result.message || `Tool execution failed: ${name}`)
  }

  return result.data
}
