/**
 * AI Intelligence Types for AI Services Domain
 *
 * Перенесено из src/features/ai-content-intelligence/shared/types/
 */

// Import only what we need from other modules to avoid circular deps
import type { ProcessingStatus, ProcessingStep, ProcessingError } from "./processing"
import type { UnifiedContentAnalysis, NarrativeType, PaceType } from "./unified-analysis"
import { ContentType, Emotion } from "../../shared/types/ai-tools/content-analysis"
import type { AIConfig, IntelligentContent } from "./ai-config"
import type { GeneratedScript, ScriptGenerationParams } from "./script"
import type { PlatformId, AdaptedContent } from "./platform"
import type { MediaFile } from "./interfaces"

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

// Temporary types removed - using imports from other modules



// Domain configuration type
export interface AIServicesDomainConfig {
  chatEnabled: boolean
  intelligenceEnabled: boolean
  montagePlannerEnabled: boolean
  recognitionEnabled: boolean
}
