// AI Configuration Types

import type { PlatformId } from "./platform-adaptation"
import type { ScriptGenerationParams } from "./script-generation"

// AI Provider Configuration
export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
  model?: string
  endpoint?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  DEEPSEEK = "deepseek",
  OLLAMA = "ollama",
  LOCAL = "local",
}

// AI Intelligence Configuration
export interface AIConfig {
  // Providers
  providers: AIProviderConfig[]
  defaultProvider: AIProvider

  // Feature toggles
  features: AIFeatures

  // Processing options
  processing: ProcessingConfig

  // Quality settings
  quality: QualityConfig

  // Platform targets
  platforms?: PlatformId[]

  // Script generation
  scriptParams?: ScriptGenerationParams

  // Language settings
  languages?: LanguageConfig
}

export interface AIFeatures {
  sceneAnalysis: boolean
  scriptGeneration: boolean
  multiPlatform: boolean
  personIdentification?: boolean
  contentClassification: boolean
  qualityEnhancement: boolean
  autoSuggestions: boolean
}

export interface ProcessingConfig {
  parallel: boolean
  maxConcurrent: number
  batchSize: number
  cacheResults: boolean
  cacheDuration: number // hours
  retryAttempts: number
  timeout: number // seconds
}

export interface QualityConfig {
  analysisDepth: AnalysisDepth
  accuracy: AccuracyLevel
  speed: SpeedPriority
  resourceUsage: ResourceLimit
}

export enum AnalysisDepth {
  BASIC = "basic",
  STANDARD = "standard",
  DETAILED = "detailed",
  COMPREHENSIVE = "comprehensive",
}

export enum AccuracyLevel {
  FAST = "fast",
  BALANCED = "balanced",
  ACCURATE = "accurate",
  MAXIMUM = "maximum",
}

export enum SpeedPriority {
  REALTIME = "realtime",
  FAST = "fast",
  NORMAL = "normal",
  QUALITY = "quality",
}

export interface ResourceLimit {
  maxCPU: number // percentage
  maxRAM: number // MB
  maxGPU?: number // percentage
  maxDiskSpace: number // MB for cache
}

export interface LanguageConfig {
  source: string // ISO code
  targets: string[] // ISO codes
  autoDetect: boolean
  preserveOriginal: boolean
}

// Pipeline Configuration
export interface PipelineConfig {
  name: string
  description?: string
  steps: PipelineStep[]
  triggers?: PipelineTrigger[]
  outputs: PipelineOutput[]
}

export interface PipelineStep {
  id: string
  type: StepType
  config: any
  dependencies?: string[] // Other step IDs
  condition?: StepCondition
}

export enum StepType {
  ANALYZE = "analyze",
  CLASSIFY = "classify",
  GENERATE = "generate",
  ADAPT = "adapt",
  ENHANCE = "enhance",
  EXPORT = "export",
}

export interface StepCondition {
  type: ConditionType
  value: any
}

export enum ConditionType {
  ALWAYS = "always",
  IF_SUCCESS = "if_success",
  IF_FAILURE = "if_failure",
  IF_RESULT = "if_result",
  CUSTOM = "custom",
}

export interface PipelineTrigger {
  type: TriggerType
  config: any
}

export enum TriggerType {
  MANUAL = "manual",
  ON_IMPORT = "on_import",
  ON_TIMELINE_CHANGE = "on_timeline_change",
  ON_EXPORT = "on_export",
  SCHEDULED = "scheduled",
}

export interface PipelineOutput {
  type: OutputType
  format: string
  destination: string
  naming?: NamingPattern
}

export enum OutputType {
  ANALYSIS_REPORT = "analysis_report",
  GENERATED_SCRIPT = "generated_script",
  ADAPTED_CONTENT = "adapted_content",
  TIMELINE_PROJECT = "timeline_project",
  EXPORT_PACKAGE = "export_package",
}

export interface NamingPattern {
  template: string
  variables: string[]
  timestamp: boolean
}

// Presets
export interface AIPreset {
  id: string
  name: string
  description: string
  category: PresetCategory
  config: AIConfig
  thumbnail?: string
}

export enum PresetCategory {
  YOUTUBE = "youtube",
  SOCIAL_MEDIA = "social_media",
  FILM = "film",
  DOCUMENTARY = "documentary",
  EDUCATIONAL = "educational",
  COMMERCIAL = "commercial",
  PERSONAL = "personal",
  PROFESSIONAL = "professional",
}

// Error Handling
export interface AIError {
  code: AIErrorCode
  message: string
  details?: any
  timestamp: Date
  retryable: boolean
}

export enum AIErrorCode {
  PROVIDER_ERROR = "provider_error",
  RATE_LIMIT = "rate_limit",
  INVALID_CONFIG = "invalid_config",
  PROCESSING_ERROR = "processing_error",
  TIMEOUT = "timeout",
  INSUFFICIENT_RESOURCES = "insufficient_resources",
  UNSUPPORTED_FORMAT = "unsupported_format",
  ANALYSIS_FAILED = "analysis_failed",
  GENERATION_FAILED = "generation_failed",
}
