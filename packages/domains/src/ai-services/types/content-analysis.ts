/**
 * Content Analysis Types for AI Services Domain
 * Типы для анализа контента в AI Services
 */

// Re-export необходимых типов из shared domain
export type {
  ContentClassification,
  ContentInsights,
  ContentType,
  Emotion,
  QualityMetrics,
  SceneAnalysis,
} from "../../shared/types/ai-tools/content-analysis"

// Дополнительные типы специфичные для AI Services
export interface ContentAnalysisConfig {
  analyzeScenes: boolean
  analyzeAudio: boolean
  analyzeObjects: boolean
  analyzeFaces: boolean
  analyzeText: boolean
  generateInsights: boolean
  qualityThreshold: number
}

export interface ContentAnalysisProgress {
  step: string
  progress: number
  total: number
  currentFile?: string
  estimatedTimeRemaining?: number
}
