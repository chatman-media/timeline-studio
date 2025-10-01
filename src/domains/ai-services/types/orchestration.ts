/**
 * Интерфейсы для координации AI операций
 * Pipeline, workflow и оркестрация различных AI сервисов
 */

import type { ModelConfiguration } from "@/domains/ai-core/types"
import type { ContentAnalysisResult, MediaFile } from "./interfaces"

// Базовые типы для оркестрации
export interface PipelineStep {
  id: string
  name: string
  status: StepStatus
  progress: number
  startTime?: Date
  endTime?: Date
  error?: string
  dependencies?: string[]
}

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped"

export interface PipelineProgress {
  totalSteps: number
  completedSteps: number
  currentStep?: PipelineStep
  overallProgress: number
  estimatedTimeRemaining?: number
  errors: string[]
  warnings: string[]
}

export interface PipelineControl {
  pause(): Promise<void>
  resume(): Promise<void>
  cancel(): Promise<void>
  getStatus(): PipelineProgress
}

// Workflow типы
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: PipelineWorkflowStep[]
  inputSchema?: any
  outputSchema?: any
  version: string
}

export interface PipelineWorkflowStep {
  id: string
  name: string
  type: "analysis" | "ai_request" | "transformation" | "validation" | "custom"
  config: any
  conditions?: WorkflowCondition[]
  retryPolicy?: RetryPolicy
}

export interface WorkflowCondition {
  field: string
  operator: "equals" | "greater_than" | "less_than" | "contains" | "not_empty"
  value: any
}

export interface RetryPolicy {
  maxAttempts: number
  backoffMs: number
  exponentialBackoff?: boolean
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "running" | "completed" | "failed" | "cancelled"
  input: any
  output?: any
  steps: WorkflowStepExecution[]
  startTime: Date
  endTime?: Date
  error?: string
}

export interface WorkflowStepExecution {
  stepId: string
  status: StepStatus
  input?: any
  output?: any
  startTime?: Date
  endTime?: Date
  error?: string
  attempts: number
}

// Интерфейс для выполнения workflow
export interface IWorkflowEngine {
  // Управление workflow
  registerWorkflow(workflow: WorkflowDefinition): void
  executeWorkflow(workflowId: string, input: any): Promise<WorkflowExecution>
  getWorkflowStatus(executionId: string): Promise<WorkflowExecution>
  cancelWorkflow(executionId: string): Promise<void>

  // Получение workflow
  getAvailableWorkflows(): WorkflowDefinition[]
  getWorkflow(workflowId: string): WorkflowDefinition | null

  // История выполнений
  getExecutionHistory(workflowId?: string): Promise<WorkflowExecution[]>
}

// Интерфейс для AI оркестратора
export interface IAIOrchestrator {
  // Инициализация
  initialize(): Promise<void>

  // Основные операции
  analyzeContent(files: MediaFile[], options?: AnalysisOptions): Promise<AnalysisResult>
  processWorkflow(workflowId: string, input: any): Promise<WorkflowExecution>

  // Управление pipeline
  createPipeline(steps: PipelineStep[]): string
  executePipeline(pipelineId: string, input: any): Promise<PipelineExecution>
  getPipelineStatus(pipelineId: string): PipelineProgress

  // Управление
  pause(): Promise<void>
  resume(): Promise<void>
  cancel(): Promise<void>

  // События
  on(event: string, callback: (data: any) => void): void
  off(event: string, callback: (data: any) => void): void

  // Статистика
  getStats(): OrchestratorStats
}

export interface AnalysisOptions {
  analysisTypes?: AnalysisType[]
  aiModels?: ModelConfiguration[]
  concurrency?: number
  cacheResults?: boolean
  outputDir?: string
}

export type AnalysisType =
  | "scene_detection"
  | "quality_analysis"
  | "vision_analysis"
  | "content_classification"
  | "script_generation"

export interface AnalysisResult {
  id: string
  files: MediaFile[]
  results: ContentAnalysisResult[]
  summary: AnalysisSummary
  processingTime: number
  errors: string[]
  warnings: string[]
}

export interface AnalysisSummary {
  totalFiles: number
  successfulAnalyses: number
  failedAnalyses: number
  averageQuality: number
  detectedScenes: number
  insights: string[]
  recommendations: string[]
}

export interface PipelineExecution {
  id: string
  status: "running" | "completed" | "failed" | "cancelled"
  steps: PipelineStep[]
  progress: PipelineProgress
  input: any
  output?: any
  startTime: Date
  endTime?: Date
  error?: string
}

export interface OrchestratorStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageProcessingTime: number
  activeOperations: number
  cacheHitRate: number
  memory: {
    used: number
    total: number
  }
  performance: {
    opsPerSecond: number
    avgResponseTime: number
  }
}

// State machine типы
export interface StateMachineContext {
  currentState: string
  data: any
  error?: Error
  history: StateTransition[]
}

export interface StateTransition {
  from: string
  to: string
  event: string
  timestamp: Date
  data?: any
}

export interface IStateMachine {
  getCurrentState(): string
  getContext(): StateMachineContext
  send(event: string, data?: any): void
  subscribe(callback: (context: StateMachineContext) => void): () => void
  start(): void
  stop(): void
}

// Фабрика для создания оркестраторов
export interface OrchestrationFactory {
  createWorkflowEngine(): IWorkflowEngine
  createAIOrchestrator(): IAIOrchestrator
  createStateMachine(config: any): IStateMachine

  // Предустановленные workflow
  getBuiltInWorkflows(): WorkflowDefinition[]

  // Утилиты
  validateWorkflow(workflow: WorkflowDefinition): ValidationResult
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
