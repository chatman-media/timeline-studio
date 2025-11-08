/**
 * AI Tools Domain - Все инструменты
 * Централизованный экспорт всех AI инструментов
 */

// Analysis Tools
export * from "./analysis"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("Index")

// Automation Tools
export * from "./automation"
// Core Tools
export * from "./core"

import { ANALYSIS_TOOLS_STATS, analysisTools } from "./analysis"
import { AUTOMATION_TOOLS_STATS, automationTools } from "./automation"
// Импорты для статистики
import { CORE_TOOLS_STATS, coreTools } from "./core"

// Все инструменты домена
export const allAITools = [
  ...coreTools,
  ...analysisTools,
  ...automationTools,
  // Здесь будут добавлены Integration tools
]

// Статистика по всем инструментам
export const AI_TOOLS_DOMAIN_STATS = {
  core: CORE_TOOLS_STATS,
  analysis: ANALYSIS_TOOLS_STATS,
  automation: AUTOMATION_TOOLS_STATS,
  // integration: INTEGRATION_TOOLS_STATS, // Будет добавлено позже
  total: allAITools.length,
}

/**
 * Поиск инструмента по имени
 */
export function findToolByName(toolName: string) {
  return allAITools.find((tool) => tool.metadata.name === toolName)
}

/**
 * Получение инструментов по домену
 */
export function getToolsByDomain(domain: "core" | "analysis" | "automation" | "integration") {
  return allAITools.filter((tool) => tool.metadata.domain === domain)
}

/**
 * Получение инструментов по категории
 */
export function getToolsByCategory(category: string) {
  return allAITools.filter((tool) => tool.metadata.category === category)
}

/**
 * Получение инструментов по тегам
 */
export function getToolsByTags(tags: string[]) {
  return allAITools.filter((tool) => tool.metadata.tags?.some((tag: string) => tags.includes(tag)))
}

/**
 * Валидация всех инструментов
 */
export function validateAllTools() {
  const results = allAITools.map((tool) => ({
    name: tool.metadata.name,
    domain: tool.metadata.domain,
    category: tool.metadata.category,
    hasValidate: typeof tool.validate === "function",
    hasExecute: typeof tool.execute === "function",
    hasGetSchema: typeof tool.getSchema === "function",
    hasMetadata: !!tool.metadata,
  }))

  const issues = results.filter(
    (result) => !result.hasValidate || !result.hasExecute || !result.hasGetSchema || !result.hasMetadata,
  )

  return {
    totalTools: results.length,
    validTools: results.length - issues.length,
    issues,
    isValid: issues.length === 0,
  }
}

/**
 * Получение схем всех инструментов
 */
export function getAllToolSchemas() {
  return allAITools.reduce(
    (schemas, tool) => {
      try {
        schemas[tool.metadata.name] = tool.getSchema()
      } catch (error) {
        logger.warn("Ошибка получения схемы для инструмента", { toolName: tool.metadata.name, error })
      }
      return schemas
    },
    {} as Record<string, any>,
  )
}

/**
 * Получение метаданных всех инструментов
 */
export function getAllToolMetadata() {
  return allAITools.map((tool) => tool.metadata)
}

/**
 * Группировка инструментов по доменам
 */
export function getToolsGroupedByDomain() {
  return allAITools.reduce(
    (groups, tool) => {
      const domain = tool.metadata.domain
      if (!groups[domain]) {
        groups[domain] = []
      }
      groups[domain].push(tool)
      return groups
    },
    {} as Record<string, typeof allAITools>,
  )
}

/**
 * Группировка инструментов по категориям
 */
export function getToolsGroupedByCategory() {
  return allAITools.reduce(
    (groups, tool) => {
      const category = tool.metadata.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(tool)
      return groups
    },
    {} as Record<string, typeof allAITools>,
  )
}

/**
 * Получение статистики использования тегов
 */
export function getTagsStatistics() {
  const tagCounts = allAITools.reduce(
    (counts, tool) => {
      tool.metadata.tags?.forEach((tag: string) => {
        counts[tag] = (counts[tag] || 0) + 1
      })
      return counts
    },
    {} as Record<string, number>,
  )

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([tag, count]) => ({ tag, count }))
}

/**
 * Получение инструментов с зависимостями
 */
export function getToolsWithDependencies() {
  return allAITools.filter((tool) => tool.metadata.dependencies && tool.metadata.dependencies.length > 0)
}

/**
 * Анализ зависимостей между инструментами
 */
export function analyzeDependencies() {
  const dependencies = new Map<string, string[]>()
  const dependents = new Map<string, string[]>()

  allAITools.forEach((tool) => {
    const toolName = tool.metadata.name
    const toolDeps = tool.metadata.dependencies || []

    dependencies.set(toolName, toolDeps)

    toolDeps.forEach((dep) => {
      if (!dependents.has(dep)) {
        dependents.set(dep, [])
      }
      dependents.get(dep)!.push(toolName)
    })
  })

  return {
    dependencies: Object.fromEntries(dependencies),
    dependents: Object.fromEntries(dependents),
    totalDependencies: Array.from(dependencies.values()).flat().length,
    uniqueDependencies: new Set(Array.from(dependencies.values()).flat()).size,
  }
}

/**
 * Проверка целостности инструментов
 */
export function checkToolsIntegrity() {
  const validation = validateAllTools()
  const dependencies = analyzeDependencies()
  const schemas = getAllToolSchemas()

  const duplicateNames = allAITools
    .map((tool) => tool.metadata.name)
    .filter((name, index, arr) => arr.indexOf(name) !== index)

  const missingDependencies = Object.entries(dependencies.dependencies).flatMap(([toolName, deps]) =>
    deps
      .filter((dep: string) => !allAITools.some((tool) => tool.metadata.name === dep))
      .map((dep: string) => ({ toolName, missingDep: dep })),
  )

  return {
    validation,
    dependencies,
    schemasCount: Object.keys(schemas).length,
    duplicateNames,
    missingDependencies,
    isHealthy: validation.isValid && duplicateNames.length === 0 && missingDependencies.length === 0,
  }
}

/**
 * Экспорт для регистрации в контейнере
 */
export function registerAllToolsInContainer(container: any) {
  const registry = container.getToolRegistry()

  allAITools.forEach((tool) => {
    try {
      registry.register(tool)
      logger.info("[AI Tools] Зарегистрирован инструмент:", { toolName: tool.metadata.name })
    } catch (error) {
      logger.error("[AI Tools] Ошибка регистрации инструмента", { toolName: tool.metadata.name, error })
    }
  })

  logger.info("[AI Tools] Зарегистрировано", { count: allAITools.length })
  return registry.getStatistics()
}
