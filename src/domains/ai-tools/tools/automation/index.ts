/**
 * Automation AI Tools Domain
 * Инструменты автоматизации и оптимизации процессов
 */

// Batch Processing Tools
export * from "./batch-processing"
// Performance Tools
export * from "./performance"
// Subtitle Tools
export * from "./subtitles"

// Template Tools
export * from "./templates"
// Workflow Tools
export * from "./workflow"

// Импорты для статистики
import { batchProcessingTools } from "./batch-processing"
import { performanceTools } from "./performance"
import { subtitleTools } from "./subtitles"
import { templateTools } from "./templates"
import { workflowTools } from "./workflow"

// Все Automation инструменты
export const automationTools = [
  ...batchProcessingTools,
  ...workflowTools,
  ...performanceTools,
  ...templateTools,
  ...subtitleTools,
]

// Статистика Automation Tools
export const AUTOMATION_TOOLS_COUNT = automationTools.length

export const AUTOMATION_TOOLS_STATS = {
  batchProcessing: batchProcessingTools.length,
  workflow: workflowTools.length,
  performance: performanceTools.length,
  templates: templateTools.length,
  subtitles: subtitleTools.length,
  total: AUTOMATION_TOOLS_COUNT,
} as const

// Утилиты для работы с Automation Tools
export function getAutomationToolsByCategory(category: keyof typeof AUTOMATION_TOOLS_STATS) {
  switch (category) {
    case "batchProcessing":
      return batchProcessingTools
    case "workflow":
      return workflowTools
    case "performance":
      return performanceTools
    case "templates":
      return templateTools
    case "subtitles":
      return subtitleTools
    default:
      return automationTools
  }
}

export function getAutomationToolsMetadata() {
  return automationTools.map((tool) => ({
    name: tool.metadata.name,
    category: tool.metadata.category,
    description: tool.metadata.description,
    tags: tool.metadata.tags,
    dependencies: tool.metadata.dependencies,
  }))
}

export function findAutomationToolByName(name: string) {
  return automationTools.find((tool) => tool.metadata.name === name)
}

export function getAutomationToolsByTags(tags: string[]) {
  return automationTools.filter((tool) => tool.metadata.tags?.some((tag) => tags.includes(tag)))
}

export function validateAutomationTools() {
  const issues: string[] = []

  automationTools.forEach((tool) => {
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
    totalTools: automationTools.length,
  }
}

// Утилиты для пакетной обработки
export function createBatchJob(operation: string, items: string[], options?: any) {
  return {
    id: `batch_${Date.now()}`,
    operation,
    items,
    options,
    status: "pending",
    createdAt: new Date(),
    progress: 0,
  }
}

export function calculateBatchProgress(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

// Утилиты для workflow
export function createWorkflowStep(name: string, action: string, params?: any) {
  return {
    id: `step_${Date.now()}`,
    name,
    action,
    params,
    status: "pending",
    duration: 0,
  }
}

export function validateWorkflowSteps(steps: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  steps.forEach((step, index) => {
    if (!step.name) {
      errors.push(`Step ${index + 1}: Missing name`)
    }
    if (!step.action) {
      errors.push(`Step ${index + 1}: Missing action`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Утилиты для производительности
export function calculatePerformanceScore(metrics: any): number {
  const weights = {
    speed: 0.4,
    quality: 0.3,
    efficiency: 0.3,
  }

  return Math.round(
    (metrics.speed || 0) * weights.speed +
      (metrics.quality || 0) * weights.quality +
      (metrics.efficiency || 0) * weights.efficiency,
  )
}

export function generatePerformanceReport(metrics: any) {
  const score = calculatePerformanceScore(metrics)

  return {
    score,
    grade: score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D",
    recommendations:
      score < 80
        ? [
            "Оптимизировать настройки рендеринга",
            "Использовать аппаратное ускорение",
            "Уменьшить разрешение предпросмотра",
          ]
        : ["Производительность в норме"],
    metrics,
  }
}
