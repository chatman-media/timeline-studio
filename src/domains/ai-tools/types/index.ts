/**
 * AI Tools Domain Types
 * Экспорт всех типов для домена AI инструментов
 */

// Контексты выполнения
export type {
  AIToolExecutionContext,
  BatchExecutionContext,
  DebugContext,
  DebugLog,
  FullExecutionContext,
  NetworkRequestMetric,
  PerformanceContext,
  PerformanceError,
  PerformanceWarning,
  PipelineExecutionContext,
  PipelineStep,
  SecurityAuditEntry,
  SecurityContext,
} from "./execution-context"
// Результаты выполнения
// Переэкспорт AIToolResult из result-types для обратной совместимости
export type {
  AIToolResult as AIToolResultDetailed,
  AIToolResultMetadata,
  BatchExecutionResult,
  BatchStatistics,
  CacheMetrics,
  CpuUsageMetrics,
  MemoryUsageMetrics,
  NetworkMetrics,
  PerformanceAnalysisResult,
  PerformanceComparison,
  PerformanceRecommendation,
  PipelineError,
  PipelineExecutionResult,
  ToolConflict,
  ToolExportResult,
  ToolImportResult,
  ToolSearchMatch,
  ToolValidationResult,
  ValidationError,
  ValidationWarning,
} from "./result-types"
// Основные интерфейсы инструментов
export type {
  AIIToolInfo,
  AIToolCategory,
  AIToolContext,
  AIToolDomain,
  AIToolExample,
  AIToolExecutionEvent,
  AIToolExecutionOptions,
  AIToolExecutionStatus,
  AIToolLogger,
  AIToolMetadata,
  AIToolPriority,
  AIToolResult,
  AIToolsConfig,
  AIToolTask,
  AnalysisToolCategory,
  AutomationToolCategory,
  CoreToolCategory,
  DomainStats,
  ExecutionMetrics,
  IAITool,
  IExecutionEngine,
  IntegrationToolCategory,
  IToolRegistry,
  LazyLoadingConfig,
  ToolSearchFilters,
  ToolSearchResult,
} from "./tool-interfaces"

// Константы доменов
export const AI_TOOL_DOMAINS = ["core", "analysis", "automation", "integration"] as const

// Константы категорий
export const CORE_TOOL_CATEGORIES = ["timeline", "resources", "browser", "player"] as const
export const ANALYSIS_TOOL_CATEGORIES = [
  "video-analysis",
  "audio-analysis",
  "content-intelligence",
  "whisper-tools",
  "multimodal",
] as const
export const AUTOMATION_TOOL_CATEGORIES = [
  "batch-processing",
  "workflow-automation",
  "smart-templates",
  "performance",
] as const
export const INTEGRATION_TOOL_CATEGORIES = ["export-tools", "platform-integration"] as const

// Константы статусов
export const AI_TOOL_EXECUTION_STATUSES = ["pending", "running", "completed", "failed", "cancelled"] as const
export const AI_TOOL_PRIORITIES = ["low", "medium", "high", "critical"] as const

// Утилитарные типы
export type AIToolDomainMap = {
  core: CoreToolCategory
  analysis: AnalysisToolCategory
  automation: AutomationToolCategory
  integration: IntegrationToolCategory
}

// Типы для конфигурации
export interface AIToolsDomainConfig {
  // Общие настройки
  defaultTimeout: number
  defaultRetries: number
  enableLogging: boolean
  enableMetrics: boolean

  // Производительность
  maxConcurrentExecutions: number
  enableLazyLoading: boolean
  cacheResults: boolean
  cacheTTL: number

  // Безопасность
  enableSecurity: boolean
  defaultPermissions: string[]
  auditLogging: boolean

  // Отладка
  debugMode: boolean
  enableStackTrace: boolean
  logLevel: "debug" | "info" | "warn" | "error"

  // Мониторинг
  enablePerformanceMonitoring: boolean
  performanceThresholds: {
    executionTime: number
    memoryUsage: number
    cpuUsage: number
  }
}

// Типы для статистики
export interface AIToolsStatistics {
  // Общая статистика
  totalTools: number
  totalExecutions: number
  successRate: number
  averageExecutionTime: number

  // Статистика по доменам
  domainStats: Record<AIToolDomain, DomainStats>

  // Популярные инструменты
  mostUsedTools: Array<{
    toolName: string
    usageCount: number
    successRate: number
  }>

  // Производительность
  performanceMetrics: {
    fastestTools: string[]
    slowestTools: string[]
    mostReliableTools: string[]
  }

  // Ошибки
  errorStats: Record<string, number>

  // Временные метрики
  lastUpdated: Date
  reportPeriod: {
    start: Date
    end: Date
  }
}

// Типы для событий
export interface AIToolsEventMap {
  "tool:registered": { toolName: string; domain: AIToolDomain }
  "tool:unregistered": { toolName: string }
  "execution:started": { executionId: string; toolName: string }
  "execution:completed": { executionId: string; toolName: string; result: AIToolResult }
  "execution:failed": { executionId: string; toolName: string; error: Error }
  "batch:started": { batchId: string; taskCount: number }
  "batch:completed": { batchId: string; result: BatchExecutionResult }
  "pipeline:started": { pipelineId: string; stepCount: number }
  "pipeline:completed": { pipelineId: string; result: PipelineExecutionResult }
  "performance:warning": { toolName: string; metric: string; value: number; threshold: number }
  "security:violation": { toolName: string; violation: string; severity: string }
}

// Типы для плагинов и расширений
export interface AIToolPlugin {
  name: string
  version: string
  description: string
  author: string

  // Хуки жизненного цикла
  onToolRegistered?: (toolName: string) => void
  onToolUnregistered?: (toolName: string) => void
  onExecutionStarted?: (context: AIToolExecutionContext) => void
  onExecutionCompleted?: (context: AIToolExecutionContext, result: AIToolResult) => void
  onExecutionFailed?: (context: AIToolExecutionContext, error: Error) => void

  // Модификаторы
  modifyInput?: (input: any, context: AIToolExecutionContext) => any
  modifyOutput?: (output: any, context: AIToolExecutionContext) => any

  // Валидация
  validateInput?: (input: any, toolName: string) => ValidationError[]
  validateOutput?: (output: any, toolName: string) => ValidationError[]
}

// Типы для миграции
export interface MigrationInfo {
  fromVersion: string
  toVersion: string
  description: string
  breaking: boolean
  migrationSteps: MigrationStep[]
}

export interface MigrationStep {
  id: string
  description: string
  type: "rename" | "move" | "transform" | "delete" | "add"
  source?: string
  target?: string
  transformer?: (data: any) => any
}
