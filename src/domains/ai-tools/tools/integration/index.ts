/**
 * Integration AI Tools Domain
 * Инструменты интеграции с внешними сервисами и форматами
 */

// Export Tools
export * from "./export"
// Format Conversion Tools
export * from "./format-conversion"

// Импорты для статистики
import { exportTools } from "./export"
import { formatConversionTools } from "./format-conversion"

// Все Integration инструменты
export const integrationTools = [...exportTools, ...formatConversionTools]

// Статистика Integration Tools
export const INTEGRATION_TOOLS_COUNT = integrationTools.length

export const INTEGRATION_TOOLS_STATS = {
  export: exportTools.length,
  formatConversion: formatConversionTools.length,
  total: INTEGRATION_TOOLS_COUNT,
} as const

// Утилиты для работы с Integration Tools
export function getIntegrationToolsByCategory(category: keyof typeof INTEGRATION_TOOLS_STATS) {
  switch (category) {
    case "export":
      return exportTools
    case "formatConversion":
      return formatConversionTools
    default:
      return integrationTools
  }
}

export function getIntegrationToolsMetadata() {
  return integrationTools.map((tool) => ({
    name: tool.metadata.name,
    category: tool.metadata.category,
    description: tool.metadata.description,
    tags: tool.metadata.tags,
    dependencies: tool.metadata.dependencies,
  }))
}

export function findIntegrationToolByName(name: string) {
  return integrationTools.find((tool) => tool.metadata.name === name)
}

export function getIntegrationToolsByTags(tags: string[]) {
  return integrationTools.filter((tool) => tool.metadata.tags?.some((tag) => tags.includes(tag)))
}

export function validateIntegrationTools() {
  const issues: string[] = []

  integrationTools.forEach((tool) => {
    if (!tool.metadata.name) {
      issues.push(`Tool missing name: ${tool.constructor.name}`)
    }
    if (!tool.metadata.description) {
      issues.push(`Tool missing description: ${tool.metadata.name}`)
    }
    if (!tool.metadata.category) {
      issues.push(`Tool missing category: ${tool.metadata.name}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
    totalTools: integrationTools.length,
  }
}
