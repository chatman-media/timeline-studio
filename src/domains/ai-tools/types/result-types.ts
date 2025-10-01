/**
 * Типы результатов выполнения AI инструментов
 */

import type { AIToolExecutionStatus, AIToolPriority } from "./tool-interfaces"

// Базовый результат выполнения AI инструмента
export interface AIToolResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  warnings?: string[]
  executionTime: number
  toolName: string
  executionId: string
  metadata?: AIToolResultMetadata
}

// Метаданные результата
export interface AIToolResultMetadata {
  // AI модель и провайдер
  model?: string
  provider?: string

  // Токены и стоимость
  tokenCount?: number
  inputTokens?: number
  outputTokens?: number
  cost?: number

  // Кэширование
  cacheHit?: boolean
  cacheKey?: string

  // Производительность
  executionTime: number
  memoryUsage?: number
  cpuUsage?: number

  // Качество результата
  confidence?: number
  accuracy?: number

  // Версионирование
  toolVersion?: string
  apiVersion?: string

  // Дополнительные данные
  [key: string]: any
}

// Результат batch выполнения
export interface BatchExecutionResult {
  batchId: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  successRate: number

  // Временные метрики
  startTime: number
  endTime: number
  totalExecutionTime: number
  averageTaskTime: number

  // Результаты задач
  results: Map<string, AIToolResult>
  errors: Map<string, Error>

  // Статистика
  statistics: BatchStatistics

  // Метаданные
  metadata: {
    maxConcurrent: number
    failFast: boolean
    retryCount: number
    [key: string]: any
  }
}

// Статистика batch выполнения
export interface BatchStatistics {
  tasksByStatus: Record<AIToolExecutionStatus, number>
  tasksByPriority: Record<AIToolPriority, number>
  executionTimeDistribution: {
    min: number
    max: number
    average: number
    median: number
    p95: number
    p99: number
  }
  errorDistribution: Record<string, number>
  resourceUsage: {
    peakMemory: number
    averageMemory: number
    peakCpu: number
    averageCpu: number
  }
}

// Результат pipeline выполнения
export interface PipelineExecutionResult {
  pipelineId: string
  status: "completed" | "failed" | "partial"

  // Шаги
  totalSteps: number
  completedSteps: number
  failedSteps: number
  skippedSteps: number

  // Результаты шагов
  stepResults: Map<string, AIToolResult>
  finalResult?: any

  // Временные метрики
  startTime: number
  endTime: number
  totalExecutionTime: number

  // Ошибки
  errors: PipelineError[]

  // Метаданные
  metadata: {
    stopOnError: boolean
    enableRollback: boolean
    rollbackPerformed: boolean
    [key: string]: any
  }
}

// Ошибка pipeline
export interface PipelineError {
  stepId: string
  stepIndex: number
  error: Error
  timestamp: number
  recoverable: boolean
}

// Результат анализа производительности
export interface PerformanceAnalysisResult {
  executionId: string
  toolName: string

  // Общие метрики
  executionTime: number
  memoryUsage: MemoryUsageMetrics
  cpuUsage: CpuUsageMetrics

  // Сетевые метрики
  networkMetrics: NetworkMetrics

  // Кэш метрики
  cacheMetrics: CacheMetrics

  // Оценка производительности
  performanceScore: number
  performanceGrade: "A" | "B" | "C" | "D" | "F"

  // Рекомендации
  recommendations: PerformanceRecommendation[]

  // Сравнение с предыдущими выполнениями
  comparison?: PerformanceComparison
}

// Метрики использования памяти
export interface MemoryUsageMetrics {
  initial: number
  peak: number
  final: number
  average: number
  allocations: number
  deallocations: number
  leaks: number
}

// Метрики использования CPU
export interface CpuUsageMetrics {
  average: number
  peak: number
  userTime: number
  systemTime: number
  idleTime: number
}

// Сетевые метрики
export interface NetworkMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalBytes: number
  averageResponseTime: number
  slowestRequest: number
  fastestRequest: number
}

// Метрики кэша
export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalSize: number
  evictions: number
}

// Рекомендация по производительности
export interface PerformanceRecommendation {
  type: "memory" | "cpu" | "network" | "cache" | "algorithm"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  impact: string
  effort: "low" | "medium" | "high"
  implementation?: string
}

// Сравнение производительности
export interface PerformanceComparison {
  previousExecutionTime: number
  executionTimeDelta: number
  previousMemoryUsage: number
  memoryUsageDelta: number
  trend: "improving" | "degrading" | "stable"
  significantChange: boolean
}

// Результат валидации инструмента
export interface ToolValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]

  // Проверки
  schemaValidation: boolean
  dependencyValidation: boolean
  permissionValidation: boolean
  resourceValidation: boolean

  // Метаданные
  validationTime: number
  validatorVersion: string
}

// Ошибка валидации
export interface ValidationError {
  code: string
  message: string
  field?: string
  value?: any
  severity: "error" | "warning"
}

// Предупреждение валидации
export interface ValidationWarning {
  code: string
  message: string
  suggestion?: string
}

// Результат поиска инструментов
export interface ToolSearchResult {
  query: string
  totalResults: number
  executionTime: number

  // Результаты
  tools: ToolSearchMatch[]

  // Фильтры
  appliedFilters: Record<string, any>

  // Предложения
  suggestions: string[]

  // Метаданные
  metadata: {
    searchAlgorithm: string
    indexVersion: string
    [key: string]: any
  }
}

// Совпадение в поиске
export interface ToolSearchMatch {
  toolName: string
  score: number
  matchedFields: string[]
  highlights: Record<string, string>
  metadata: any
}

// Результат экспорта/импорта инструментов
export interface ToolExportResult {
  success: boolean
  exportedTools: string[]
  skippedTools: string[]
  errors: string[]

  // Метаданные экспорта
  exportFormat: string
  exportTime: number
  fileSize: number
  checksum: string
}

// Результат импорта инструментов
export interface ToolImportResult {
  success: boolean
  importedTools: string[]
  skippedTools: string[]
  errors: string[]
  conflicts: ToolConflict[]

  // Метаданные импорта
  importFormat: string
  importTime: number
  sourceChecksum: string
}

// Конфликт при импорте
export interface ToolConflict {
  toolName: string
  conflictType: "version" | "dependency" | "permission" | "name"
  existingVersion: string
  newVersion: string
  resolution: "skip" | "overwrite" | "rename" | "merge"
}
