// Pipeline Types

import type { AIConfig } from "./ai-config"
import type { UnifiedContentAnalysis } from "./content-analysis"
import type { AdaptedContent } from "./platform-adaptation"
import type { GeneratedScript } from "./script-generation"

// Pipeline Result
export interface IntelligentContent {
  id: string
  projectId: string
  createdAt: Date
  updatedAt: Date

  // Analysis results
  analysis: UnifiedContentAnalysis

  // Generated content
  script?: GeneratedScript

  // Key moments
  moments: ProcessedMoment[]

  // Content classification
  classification: PipelineContentClassification

  // Platform adaptations
  platformContent?: AdaptedContent[]

  // Processing metadata
  metadata: ProcessingMetadata
}

export interface ProcessedMoment {
  id: string
  timestamp: number
  duration: number
  type: string
  score: number
  description: string
  thumbnail?: string
  tags: string[]
}

export interface PipelineContentClassification {
  primary: PipelineClassificationResult
  secondary: PipelineClassificationResult[]
  confidence: number
  tags: string[]
  warnings?: string[]
}

export interface PipelineClassificationResult {
  category: string
  subcategory?: string
  confidence: number
  reasoning?: string
}

export interface ProcessingMetadata {
  startTime: Date
  endTime: Date
  duration: number // milliseconds
  config: AIConfig
  steps: ProcessingStep[]
  resources: ResourceUsage
  errors?: ProcessingError[]
}

export interface ProcessingStep {
  name: string
  status: ProcessingStatus
  startTime: Date
  endTime?: Date
  duration?: number
  result?: any
  error?: ProcessingError
}

export enum ProcessingStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export interface ProcessingError {
  step: string
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface ResourceUsage {
  cpuUsage: number // percentage
  memoryUsage: number // MB
  gpuUsage?: number // percentage
  apiCalls: APICallStats[]
  cacheHits: number
  cacheMisses: number
}

export interface APICallStats {
  provider: string
  endpoint: string
  count: number
  tokens?: number
  cost?: number
}

// Pipeline Progress
export interface PipelineProgress {
  overall: number // 0-100
  currentStep: string
  steps: StepProgress[]
  estimatedTimeRemaining?: number // seconds
  messages: ProgressMessage[]
  details?: string // Additional details about current progress
}

export interface StepProgress {
  name: string
  progress: number // 0-100
  status: ProcessingStatus
  subSteps?: SubStepProgress[]
}

export interface SubStepProgress {
  name: string
  progress: number
  message?: string
}

export interface ProgressMessage {
  timestamp: Date
  level: MessageLevel
  message: string
  details?: any
}

export enum MessageLevel {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

// Pipeline Events
export interface PipelineEvent {
  type: PipelineEventType
  timestamp: Date
  data: any
}

export enum PipelineEventType {
  STARTED = "started",
  STEP_STARTED = "step_started",
  STEP_PROGRESS = "step_progress",
  STEP_COMPLETED = "step_completed",
  STEP_FAILED = "step_failed",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// Pipeline Control
export interface PipelineControl {
  pause(): Promise<void>
  resume(): Promise<void>
  cancel(): Promise<void>
  getProgress(): PipelineProgress
  onProgress(callback: (progress: PipelineProgress) => void): () => void
  onEvent(callback: (event: PipelineEvent) => void): () => void
}

// Batch Processing
export interface BatchProcessingConfig {
  items: BatchItem[]
  parallel: boolean
  maxConcurrent: number
  continueOnError: boolean
  progressCallback?: (progress: BatchProgress) => void
}

export interface BatchItem {
  id: string
  mediaFiles: string[]
  config?: Partial<AIConfig>
  metadata?: Record<string, any>
}

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  inProgress: number
  items: BatchItemProgress[]
}

export interface BatchItemProgress {
  id: string
  status: ProcessingStatus
  progress?: number
  result?: IntelligentContent
  error?: ProcessingError
}

// Export Types
export interface ExportOptions {
  format: ExportFormat
  includeAnalysis: boolean
  includeScript: boolean
  includePlatformContent: boolean
  compression?: CompressionLevel
  encryption?: EncryptionOptions
}

export enum ExportFormat {
  JSON = "json",
  XML = "xml",
  CSV = "csv",
  PDF = "pdf",
  ZIP = "zip",
}

export enum CompressionLevel {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface EncryptionOptions {
  algorithm: string
  password: string
}

// Import Types
export interface ImportOptions {
  format: ExportFormat
  validate: boolean
  merge: MergeStrategy
  mapping?: FieldMapping[]
}

export enum MergeStrategy {
  REPLACE = "replace",
  MERGE = "merge",
  SKIP = "skip",
  ASK = "ask",
}

export interface FieldMapping {
  source: string
  target: string
  transform?: (value: any) => any
}
