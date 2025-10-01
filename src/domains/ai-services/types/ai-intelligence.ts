/**
 * AI Intelligence Types for AI Services Domain
 *
 * Перенесено из src/features/ai-content-intelligence/shared/types/
 */

import {
  AdaptedContent,
  AIConfig,
  ContentType,
  Emotion,
  GeneratedScript,
  IntelligentContent,
  NarrativeType,
  PaceType,
  PlatformId,
  ProcessingError,
  ProcessingStatus,
  ProcessingStep,
  ScriptGenerationParams,
  ScriptStyle,
  UnifiedContentAnalysis,
} from "."

// Types are imported above and used in interfaces below
// Re-exports are handled in the main index.ts

// Additional types for domain usage
export interface ContentClassification {
  category: string
  confidence: number
  tags: string[]
}

export interface ProcessedMoment {
  id: string
  timestamp: number
  type: string
  confidence: number
  metadata?: Record<string, any>
}

// Media file interface
export interface MediaFile {
  id: string
  path: string
  name: string
  type: ContentType
  duration?: number
  metadata?: Record<string, any>
}

// Machine-specific types
export interface AIIntelligenceContext {
  // Конфигурация
  config: AIConfig

  // Данные
  mediaFiles: MediaFile[]
  analysis?: UnifiedContentAnalysis
  script?: GeneratedScript
  moments?: ProcessedMoment[]
  classification?: ContentClassification
  platformContent?: AdaptedContent[]

  // Состояние обработки
  currentStep: string
  steps: ProcessingStep[]
  progress: number
  errors: ProcessingError[]

  // Результат
  result?: IntelligentContent
}

export type AIIntelligenceEvent =
  | { type: "START_ANALYSIS"; mediaFiles: MediaFile[]; config: AIConfig }
  | { type: "ANALYSIS_COMPLETE"; analysis: UnifiedContentAnalysis }
  | { type: "ANALYSIS_FAILED"; error: Error }
  | { type: "START_SCRIPT_GENERATION"; params: ScriptGenerationParams }
  | { type: "SCRIPT_GENERATED"; script: GeneratedScript }
  | { type: "SCRIPT_GENERATION_FAILED"; error: Error }
  | { type: "START_PLATFORM_ADAPTATION"; platforms: PlatformId[] }
  | { type: "PLATFORM_ADAPTATION_COMPLETE"; content: AdaptedContent[] }
  | { type: "PLATFORM_ADAPTATION_FAILED"; error: Error }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CANCEL" }
  | { type: "RESET" }
  | { type: "UPDATE_PROGRESS"; step: string; progress: number }

// Temporary types (will be replaced with domain contracts)
export interface MediaFile {
  path: string
  name: string
  size?: number
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

// ContentInsights interface (missing from original)
export interface ContentInsights {
  summary: string
  highlights: string[]
  suggestions: string[]
  warnings: string[]
  opportunities: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  marketingAngles: string[]
  targetDemographics: string[]
}

// Scene and Key Moment types
export interface SceneInfo {
  id: string
  type: string
  startTime: number
  endTime: number
  duration: number
  confidence: number
}

export interface KeyMoment {
  id: string
  timestamp: number
  duration: number
  type: KeyMomentType
  score: number
  description: string
  sceneId: string
}

export enum KeyMomentType {
  CLIMAX = "climax",
  EMOTIONAL_PEAK = "emotional_peak",
  ACTION_PEAK = "action_peak",
  DIALOGUE_HIGHLIGHT = "dialogue_highlight",
  VISUAL_HIGHLIGHT = "visual_highlight",
  AUDIO_PEAK = "audio_peak",
  TRANSITION = "transition",
  INTRO = "intro",
  OUTRO = "outro",
}

// Direct exports for current usage
export type {
  AdaptedContent,
  AIConfig,
  GeneratedScript,
  IntelligentContent,
  PlatformId,
  ProcessingError,
  ProcessingStep,
  ScriptGenerationParams,
  ScriptStyle,
  UnifiedContentAnalysis,
}

// Enum exports
export { ContentType, Emotion, type NarrativeType, type PaceType, type ProcessingStatus }

// Re-exports for backward compatibility
export type { AIConfig as LegacyAIConfig }
export type { IntelligentContent as LegacyIntelligentContent }
export type { UnifiedContentAnalysis as LegacyUnifiedContentAnalysis }

// Domain configuration type
export interface AIServicesDomainConfig {
  chatEnabled: boolean
  intelligenceEnabled: boolean
  montagePlannerEnabled: boolean
  recognitionEnabled: boolean
}
