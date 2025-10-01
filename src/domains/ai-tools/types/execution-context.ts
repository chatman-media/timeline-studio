/**
 * Типы для контекста выполнения AI инструментов
 */

import type { AIToolExecutionOptions, AIToolLogger, AIToolPriority } from "./tool-interfaces"

// Расширенный контекст выполнения
export interface AIToolExecutionContext {
  // Основная информация
  toolName: string
  executionId: string
  startTime: number
  endTime?: number

  // Попытки и повторы
  attempt: number
  maxRetries: number

  // Конфигурация
  options: AIToolExecutionOptions
  priority: AIToolPriority

  // Логирование и мониторинг
  logger?: AIToolLogger
  enableMetrics: boolean

  // Состояние выполнения
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress?: number

  // Ресурсы и зависимости
  dependencies: string[]
  requiredServices: string[]

  // Кэширование
  cacheKey?: string
  enableCache: boolean

  // Пользовательские данные
  userData?: Record<string, any>

  // Callback функции
  onProgress?: (progress: number, message?: string) => void
  onStatusChange?: (status: string) => void
  onComplete?: (result: any) => void
  onError?: (error: Error) => void
}

// Контекст для batch выполнения
export interface BatchExecutionContext {
  batchId: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  startTime: number
  estimatedEndTime?: number

  // Конфигурация batch
  maxConcurrent: number
  failFast: boolean
  retryFailedTasks: boolean

  // Прогресс
  overallProgress: number
  currentTask?: string

  // Результаты
  results: Map<string, any>
  errors: Map<string, Error>

  // Callback функции
  onTaskComplete?: (taskId: string, result: any) => void
  onTaskFailed?: (taskId: string, error: Error) => void
  onBatchComplete?: (results: Map<string, any>) => void
}

// Контекст для pipeline выполнения
export interface PipelineExecutionContext {
  pipelineId: string
  steps: PipelineStep[]
  currentStepIndex: number

  // Состояние pipeline
  status: "pending" | "running" | "completed" | "failed" | "paused"
  startTime: number
  pausedTime?: number
  resumedTime?: number

  // Данные между шагами
  stepResults: Map<string, any>
  sharedData: Record<string, any>

  // Конфигурация
  stopOnError: boolean
  enableRollback: boolean

  // Callback функции
  onStepStart?: (step: PipelineStep) => void
  onStepComplete?: (step: PipelineStep, result: any) => void
  onStepFailed?: (step: PipelineStep, error: Error) => void
  onPipelineComplete?: (results: Map<string, any>) => void
}

// Шаг pipeline
export interface PipelineStep {
  id: string
  toolName: string
  input: any
  options?: AIToolExecutionOptions
  dependencies?: string[]
  condition?: (context: PipelineExecutionContext) => boolean
  transform?: (input: any, context: PipelineExecutionContext) => any
}

// Контекст для мониторинга производительности
export interface PerformanceContext {
  executionId: string
  toolName: string

  // Временные метрики
  startTime: number
  endTime?: number
  executionTime?: number

  // Ресурсы
  memoryUsage: {
    start: number
    peak: number
    end?: number
  }

  cpuUsage: {
    start: number
    average: number
    peak: number
  }

  // Сетевые запросы
  networkRequests: NetworkRequestMetric[]

  // Кэш
  cacheHits: number
  cacheMisses: number

  // Ошибки и предупреждения
  errors: PerformanceError[]
  warnings: PerformanceWarning[]
}

// Метрика сетевого запроса
export interface NetworkRequestMetric {
  url: string
  method: string
  startTime: number
  endTime: number
  responseSize: number
  statusCode: number
  cached: boolean
}

// Ошибка производительности
export interface PerformanceError {
  type: "timeout" | "memory" | "network" | "other"
  message: string
  timestamp: number
  details?: any
}

// Предупреждение производительности
export interface PerformanceWarning {
  type: "slow_execution" | "high_memory" | "many_retries" | "cache_miss"
  message: string
  timestamp: number
  threshold: number
  actualValue: number
}

// Контекст для отладки
export interface DebugContext {
  executionId: string
  toolName: string

  // Отладочная информация
  debugLevel: "none" | "basic" | "detailed" | "verbose"
  enableStackTrace: boolean
  enableParameterLogging: boolean

  // Логи
  logs: DebugLog[]

  // Точки останова
  breakpoints: string[]

  // Состояние переменных
  variables: Record<string, any>

  // Callback функции
  onBreakpoint?: (breakpoint: string, context: DebugContext) => void
  onVariableChange?: (name: string, oldValue: any, newValue: any) => void
}

// Отладочный лог
export interface DebugLog {
  level: "debug" | "info" | "warn" | "error"
  message: string
  timestamp: number
  data?: any
  stackTrace?: string
}

// Контекст для безопасности
export interface SecurityContext {
  executionId: string
  toolName: string

  // Права доступа
  permissions: string[]
  restrictions: string[]

  // Пользователь
  userId?: string
  userRole?: string

  // Аудит
  auditLog: SecurityAuditEntry[]

  // Валидация
  inputValidation: boolean
  outputSanitization: boolean

  // Ограничения ресурсов
  maxExecutionTime: number
  maxMemoryUsage: number
  allowedNetworkHosts: string[]
}

// Запись аудита безопасности
export interface SecurityAuditEntry {
  action: string
  timestamp: number
  userId?: string
  details: any
  riskLevel: "low" | "medium" | "high" | "critical"
}

// Объединенный контекст выполнения
export interface FullExecutionContext extends AIToolExecutionContext {
  performance?: PerformanceContext
  debug?: DebugContext
  security?: SecurityContext
  batch?: BatchExecutionContext
  pipeline?: PipelineExecutionContext
}
