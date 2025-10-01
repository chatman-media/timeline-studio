/**
 * Общие типы для AI Chat модуля
 * Стандартизированные типы результатов и интерфейсы
 */

import { AIProvider } from "@/features/ai-content-intelligence"

// Базовый результат выполнения операции
export interface BaseResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  warnings?: string[]
}

// Расширенный результат с метриками
export interface ResultWithMetrics<T = any> extends BaseResult<T> {
  executionTime: number
  metadata?: {
    model?: string
    provider?: AIProvider
    tokenCount?: number
    cacheHit?: boolean
    attempt?: number
    maxRetries?: number
    [key: string]: any
  }
}

// Результат выполнения AI инструмента (совместимо с BaseAITool)
export interface AIToolResult<T = any> extends ResultWithMetrics<T> {
  toolName: string
}

// Результат анализа
export interface AnalysisResult<T = any> extends ResultWithMetrics<T> {
  analysisType: string
  confidence?: number
  insights?: string[]
  recommendations?: Recommendation[]
}

// Рекомендация
export interface Recommendation {
  id: string
  category: "technical" | "narrative" | "engagement" | "marketing" | "performance"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  actionSteps: string[]
  estimatedImpact: string
  confidence?: number
  tags?: string[]
}

// Результат обработки медиа
export interface MediaProcessingResult extends ResultWithMetrics {
  mediaPath: string
  mediaType: "video" | "audio" | "image"
  processingType: string
  outputPath?: string
  processingDetails?: {
    duration?: number
    format?: string
    resolution?: string
    bitrate?: string
    codecUsed?: string
    filters?: string[]
    effects?: string[]
  }
}

// Результат генерации контента
export interface ContentGenerationResult<T = any> extends ResultWithMetrics<T> {
  generationType: "text" | "script" | "description" | "tags" | "title"
  originalPrompt: string
  model: string
  provider: AIProvider
  quality?: {
    coherence: number
    relevance: number
    creativity: number
    accuracy: number
  }
}

// Результат поискового запроса
export interface SearchResult<T = any> extends BaseResult<T[]> {
  query: string
  totalResults: number
  searchTime: number
  filters?: Record<string, any>
  sortBy?: string
  page?: number
  pageSize?: number
}

// Результат валидации
export interface ValidationResult extends BaseResult {
  validatedFields: string[]
  invalidFields: Array<{
    field: string
    value: any
    expectedType: string
    errorMessage: string
  }>
  validationRules: string[]
}

// Результат экспорта
export interface ExportResult extends ResultWithMetrics {
  exportType: "timeline" | "project" | "media" | "analysis"
  format: string
  outputPath: string
  fileSize?: number
  duration?: number
  includeMetadata?: boolean
}

// Результат импорта
export interface ImportResult<T = any> extends ResultWithMetrics<T> {
  importType: "timeline" | "project" | "media" | "settings"
  sourceFormat: string
  sourcePath: string
  convertedData?: T
  skippedItems?: Array<{
    item: string
    reason: string
  }>
}

// Опции для пагинации
export interface PaginationOptions {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

// Результат с пагинацией
export interface PaginatedResult<T = any> extends BaseResult<T[]> {
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
  }
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

// Состояние загрузки
export type LoadingState = "idle" | "loading" | "success" | "error"

// Результат с состоянием загрузки
export interface AsyncResult<T = any> extends BaseResult<T> {
  state: LoadingState
  progress?: number
  stage?: string
  cancellable?: boolean
  cancelFn?: () => void
}

// Опции для кэширования
export interface CacheOptions {
  enabled: boolean
  ttl?: number // время жизни в миллисекундах
  key?: string
  invalidateOn?: string[]
}

// Результат с информацией о кэше
export interface CachedResult<T = any> extends BaseResult<T> {
  cached: boolean
  cacheKey?: string
  cachedAt?: Date
  expiresAt?: Date
}

// Метрики производительности
export interface PerformanceMetrics {
  startTime: number
  endTime: number
  executionTime: number
  memoryUsage?: {
    used: number
    peak: number
  }
  cpuUsage?: number
  networkRequests?: number
  cacheHits?: number
  cacheMisses?: number
}

// Контекст выполнения операции
export interface OperationContext {
  userId?: string
  sessionId?: string
  requestId?: string
  correlationId?: string
  userAgent?: string
  ipAddress?: string
  timestamp: Date
  permissions?: string[]
  preferences?: Record<string, any>
}

// Результат с контекстом
export interface ContextualResult<T = any> extends ResultWithMetrics<T> {
  context: OperationContext
}

// Типы ошибок
export type ErrorType =
  | "validation"
  | "authentication"
  | "authorization"
  | "network"
  | "timeout"
  | "resource_not_found"
  | "server_error"
  | "rate_limit"
  | "quota_exceeded"
  | "parsing"
  | "configuration"
  | "dependency"
  | "unknown"

// Подробная информация об ошибке
export interface ErrorDetails {
  type: ErrorType
  code: string
  message: string
  details?: Record<string, any>
  stack?: string
  timestamp: Date
  context?: OperationContext
  retryable?: boolean
  suggestedAction?: string
}

// Результат с подробной информацией об ошибках
export interface DetailedResult<T = any> extends BaseResult<T> {
  errorDetails?: ErrorDetails[]
}

// Batch операции
export interface BatchOperation<TInput, TOutput> {
  id: string
  input: TInput
  result?: ResultWithMetrics<TOutput>
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
}

// Результат batch операции
export interface BatchResult<TInput, TOutput> extends BaseResult {
  totalOperations: number
  completedOperations: number
  failedOperations: number
  cancelledOperations: number
  operations: BatchOperation<TInput, TOutput>[]
  summary: {
    successRate: number
    averageExecutionTime: number
    totalExecutionTime: number
  }
}

// Конфигурация retry логики
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

// Результат с retry информацией
export interface RetriableResult<T = any> extends ResultWithMetrics<T> {
  retryInfo?: {
    attempt: number
    maxRetries: number
    nextRetryDelay?: number
    totalRetryTime: number
    lastError?: ErrorDetails
  }
}

// Утилиты для работы с результатами
export function isSuccess<T>(result: BaseResult<T>): result is BaseResult<T> & { success: true; data: T } {
  return result.success === true
}

export function isFailure<T>(result: BaseResult<T>): result is BaseResult<T> & { success: false } {
  return result.success === false
}

export function hasWarnings<T>(result: BaseResult<T>): boolean {
  return (result.warnings?.length || 0) > 0
}

export function hasErrors<T>(result: BaseResult<T>): boolean {
  return (result.errors?.length || 0) > 0
}

export function createSuccess<T>(data: T, message?: string, warnings?: string[]): BaseResult<T> {
  return {
    success: true,
    data,
    message,
    warnings,
  }
}

export function createFailure<T>(errors: string[], message?: string): BaseResult<T> {
  return {
    success: false,
    errors,
    message: message || errors.join("; "),
  }
}

export function createWithMetrics<T>(
  result: BaseResult<T>,
  executionTime: number,
  metadata?: Record<string, any>,
): ResultWithMetrics<T> {
  return {
    ...result,
    executionTime,
    metadata,
  }
}
