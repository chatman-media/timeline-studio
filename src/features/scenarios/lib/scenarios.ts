import type { Scenario } from "../types"
import { automationScenarios } from "./automation-scenarios"
import { structureScenarios } from "./structure-scenarios"

/**
 * Все сценарии монтажа
 */
export const allScenarios: Scenario[] = [...structureScenarios, ...automationScenarios]

/**
 * Группировка сценариев по категориям
 */
export const scenariosByCategory = {
  structure: structureScenarios,
  automation: automationScenarios,
  effects: [], // Заглушка для будущих сценариев
  workflow: [], // Заглушка для будущих сценариев
} as const

/**
 * Группировка по сложности
 */
export const scenariosByDifficulty = {
  beginner: allScenarios.filter((s) => s.difficulty === "beginner"),
  intermediate: allScenarios.filter((s) => s.difficulty === "intermediate"),
  advanced: allScenarios.filter((s) => s.difficulty === "advanced"),
} as const

/**
 * Получить сценарий по ID
 */
export function getScenarioById(id: string): Scenario | undefined {
  return allScenarios.find((s) => s.id === id)
}

/**
 * Получить сценарии по категории
 */
export function getScenariosByCategory(category: Scenario["category"]): Scenario[] {
  return allScenarios.filter((s) => s.category === category)
}

/**
 * Получить сценарии по сложности
 */
export function getScenariosByDifficulty(difficulty: Scenario["difficulty"]): Scenario[] {
  return allScenarios.filter((s) => s.difficulty === difficulty)
}

/**
 * Получить AI-сценарии
 */
export function getAiScenarios(): Scenario[] {
  return allScenarios.filter((s) => s.requirements.aiAssisted)
}

// Экспорты
export { automationScenarios, structureScenarios }
