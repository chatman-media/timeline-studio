/**
 * Tools Converter - конвертация BaseAITool в универсальный формат AITool
 *
 * Конвертирует локальные AI инструменты в универсальный формат,
 * который бэкенд автоматически адаптирует для Claude, OpenAI, DeepSeek и других провайдеров.
 */

import type { IAITool } from "@/domains/ai-tools/types"
import type { AITool } from "@/types/generated/tauri-bindings"

/**
 * Конвертирует BaseAITool в универсальный формат AITool
 *
 * @param tool - Локальный AI инструмент
 * @returns Универсальный AITool для отправки на бэкенд
 */
export function convertToUnifiedAITool(tool: IAITool): AITool {
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
  return tools.map(convertToUnifiedAITool)
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
