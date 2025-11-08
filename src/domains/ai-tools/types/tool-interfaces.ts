/**
 * Интерфейсы для AI инструментов
 */

// Импортируем AIToolResult из result-types для избежания дублирования
import type { AIToolResult } from "./result-types"
export type { AIToolResult } from "./result-types"

// Опции выполнения инструмента
export interface AIToolExecutionOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  enableLogging?: boolean
  metadata?: Record<string, any>
}

// Контекст выполнения инструмента
export interface AIToolContext {
  toolName: string
  startTime: number
  attempt: number
  maxRetries: number
  logger?: (level: "info" | "warn" | "error", message: string, data?: any) => void
}

// Интерфейс для логгера
export interface AIToolLogger {
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, data?: any): void
}

// Метаданные инструмента
export interface AIToolMetadata {
  name: string
  displayName?: string
  description: string
  domain: AIToolDomain
  category: AIToolCategory
  version: string
  author?: string
  tags?: string[]
  dependencies?: string[]
  inputSchema?: any
  outputSchema?: any
  examples?: AIToolExample[]
}

// Пример использования инструмента
export interface AIToolExample {
  name?: string
  description: string
  input: any
  output?: any // Для обратной совместимости
  expectedOutput?: any
}

// Домены AI инструментов
export type AIToolDomain = "core" | "analysis" | "automation" | "integration"

// Категории инструментов по доменам
export type CoreToolCategory = "timeline" | "resources" | "browser" | "player"
export type AnalysisToolCategory =
  | "video-analysis"
  | "audio-analysis"
  | "content-intelligence"
  | "whisper-tools"
  | "multimodal"
export type AutomationToolCategory = "batch-processing" | "workflow-automation" | "smart-templates" | "performance"
export type IntegrationToolCategory = "export-tools" | "platform-integration"

export type AIToolCategory = CoreToolCategory | AnalysisToolCategory | AutomationToolCategory | IntegrationToolCategory

// Статус выполнения инструмента
export type AIToolExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled"

// Приоритет выполнения
export type AIToolPriority = "low" | "medium" | "high" | "critical"

// Интерфейс для базового AI инструмента
export interface IAITool {
  readonly metadata: AIToolMetadata
  execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult>
  validate(input: any): boolean
  getSchema(): { input: any; output: any }
}

// Интерфейс для реестра инструментов
export interface IToolRegistry {
  register(tool: IAITool): void
  unregister(toolName: string): void
  get(toolName: string): IAITool | undefined
  getByDomain(domain: AIToolDomain): IAITool[]
  getByCategory(category: AIToolCategory): IAITool[]
  list(): AIIToolInfo[]
  search(query: string, filters?: ToolSearchFilters): ToolSearchResult
}

// Информация об инструменте в реестре
export interface AIIToolInfo {
  name: string
  domain: AIToolDomain
  category: AIToolCategory
  description: string
  version: string
  isLoaded: boolean
  lastUsed?: Date
  usageCount: number
}

// Интерфейс для движка выполнения
export interface IExecutionEngine {
  execute(toolName: string, input: any, options?: AIToolExecutionOptions): Promise<AIToolResult>
  executeParallel(tasks: AIToolTask[]): Promise<AIToolResult[]>
  cancel(executionId: string): Promise<void>
  getStatus(executionId: string): AIToolExecutionStatus
  getMetrics(): ExecutionMetrics
}

// Задача для выполнения
export interface AIToolTask {
  id?: string
  toolName: string
  input: any
  options?: AIToolExecutionOptions
  priority?: AIToolPriority
}

// Метрики выполнения
export interface ExecutionMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  totalExecutionTime: number
  toolUsageStats: Record<string, number>
}

// События выполнения инструментов
export interface AIToolExecutionEvent {
  type: "started" | "progress" | "completed" | "failed" | "cancelled"
  toolName: string
  executionId: string
  timestamp: Date
  data?: any
  error?: Error
}

// Конфигурация домена AI Tools
export interface AIToolsConfig {
  defaultTimeout: number
  defaultRetries: number
  enableLogging: boolean
  enableMetrics: boolean
  maxConcurrentExecutions: number
  cacheResults: boolean
  cacheTTL: number
}

// Статистика по доменам
export interface DomainStats {
  domain: AIToolDomain
  toolCount: number
  totalExecutions: number
  averageExecutionTime: number
  successRate: number
  lastUsed?: Date
}

// Фильтры для поиска инструментов
export interface ToolSearchFilters {
  domain?: AIToolDomain
  category?: AIToolCategory
  tags?: string[]
  author?: string
  minVersion?: string
  maxVersion?: string
}

// Конфигурация lazy loading
export interface LazyLoadingConfig {
  enabled: boolean
  preloadDomains: AIToolDomain[]
  cacheSize: number
  unloadTimeout: number
}

// Результат поиска инструментов (для обратной совместимости)
export interface ToolSearchResult {
  query: string
  totalResults: number
  executionTime: number
  tools: ToolSearchMatch[]
  appliedFilters: Record<string, any>
  suggestions: string[]
  metadata: {
    searchAlgorithm: string
    indexVersion: string
    [key: string]: any
  }
}

// Совпадение в поиске инструментов
export interface ToolSearchMatch {
  toolName: string
  score: number
  matchedFields: string[]
  highlights: Record<string, string>
  metadata: any
}
