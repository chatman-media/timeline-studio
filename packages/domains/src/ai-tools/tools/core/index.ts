/**
 * Core AI Tools Domain
 * Основные инструменты для работы с Timeline Studio
 */

export { browserTools } from "./browser"
// Browser Tools
export * from "./browser/analyze-browser"
export * from "./browser/browser-state"
export * from "./browser/content-analysis"
export * from "./browser/file-operations"
export * from "./browser/search-files"

// Player Tools
export * from "./player"
export { executeResourceTool, resourceTools } from "./resources"
// Resources Tools
export * from "./resources/analyze-resources"
export * from "./resources/compatibility-analysis"
export * from "./resources/export-resources"
export * from "./resources/manage-resources"
export * from "./resources/suggest-resources"
export * from "./resources/usage-stats"

// Timeline Tools
export * from "./timeline"

import { browserTools } from "./browser"
import { playerTools } from "./player"
import { resourceTools } from "./resources"
// Сбор всех core инструментов
import { timelineTools } from "./timeline"

export const coreTools = [...timelineTools, ...browserTools, ...resourceTools, ...playerTools]

export const CORE_TOOLS_COUNT = coreTools.length

/**
 * Статистика Core Tools
 */
export const CORE_TOOLS_STATS = {
  timeline: timelineTools.length,
  browser: browserTools.length,
  resources: resourceTools.length,
  player: playerTools.length,
  total: CORE_TOOLS_COUNT,
}

/**
 * Универсальная функция выполнения Core инструментов
 */
export async function executeCoreToolByName(toolName: string, input: any, options?: any) {
  const tool = coreTools.find((t) => t.metadata.name === toolName)

  if (!tool) {
    throw new Error(`Core инструмент "${toolName}" не найден`)
  }

  return tool.execute(input, options)
}
