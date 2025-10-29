/**
 * Единые типы для AI анализа контента
 * Централизованное место для всех типов анализа видео, аудио и контента
 */

// Import типы из interfaces.ts для re-export
import {
  type MediaFile,
  type VideoMetadata,
  type Scene,
  type QualityAnalysisResult,
  type SilenceDetectionResult,
  type SilentSegment,
  type MotionAnalysisResult,
  type MotionVector,
  type FrameAnalysis,
  type DetectedObject,
  type BoundingBox,
  type ExtractedText,
  type CompositionAnalysis,
  type Point2D,
  type Line2D,
  type VideoAnalysisResult,
  type AudioAnalysisResult,
  type FrameAnalysisResult,
  type SceneDetectionResult,
  type ContentAnalysisResult,
} from "./interfaces"

// Import ProcessingStatus from processing.ts
import { ProcessingStatus } from "./processing"

// Re-export основные типы из interfaces.ts
export {
  MediaFile,
  VideoMetadata,
  Scene,
  QualityAnalysisResult,
  SilenceDetectionResult,
  SilentSegment,
  MotionAnalysisResult,
  MotionVector,
  FrameAnalysis,
  DetectedObject,
  BoundingBox,
  ExtractedText,
  CompositionAnalysis,
  Point2D,
  Line2D,
  VideoAnalysisResult,
  AudioAnalysisResult,
  FrameAnalysisResult,
  SceneDetectionResult,
  ContentAnalysisResult,
}

// Import типы из shared/types/ai-tools/content-analysis.ts для re-export
import type {
  ContentInsights,
  KeyFrame,
  KeyMoment,
  QualityMetrics,
  SceneAnalysis,
  SceneInfo,
  UnifiedContentAnalysis as UnifiedContentAnalysisShared
} from "../../shared/types/ai-tools/content-analysis"

import {
  KeyMomentType,
  NarrativeType,
  PaceType,
  SceneType
} from "../../shared/types/ai-tools/content-analysis"

// Re-export типы из shared/types/ai-tools/content-analysis.ts
export type {
  ContentInsights,
  KeyFrame,
  KeyMoment,
  QualityMetrics,
  SceneAnalysis,
  SceneInfo
}

export {
  KeyMomentType,
  NarrativeType,
  PaceType,
  SceneType
}

// Alias to avoid naming conflict
export type UnifiedContentAnalysis = UnifiedContentAnalysisShared

// Import типы из ai-intelligence.ts для re-export
import {
  type ProcessedMoment,
} from "./ai-intelligence"

// Re-export типы из ai-intelligence.ts
export {
  ProcessedMoment,
}

// Дополнительные унифицированные типы

/**
 * Результат полного анализа медиафайла
 * Объединяет все виды анализа в единую структуру
 */
export interface UnifiedMediaAnalysis {
  // Основная информация
  id: string
  mediaFile: MediaFile
  timestamp: Date
  
  // Результаты анализа
  video?: VideoAnalysisResult
  audio?: AudioAnalysisResult
  content?: ContentAnalysisResult
  insights?: ContentInsights
  
  // AI анализ
  aiAnalysis?: {
    keyMoments?: KeyMoment[]
    processedMoments?: ProcessedMoment[]
    tags?: string[]
    sentiment?: {
      positive: number
      neutral: number
      negative: number
    }
  }
  
  // Метаданные процесса
  processing?: {
    duration: number
    status: ProcessingStatus
    errors?: string[]
  }
}

/**
 * Опции для унифицированного анализа
 */
export interface UnifiedAnalysisOptions {
  // Какие виды анализа выполнять
  analyzeVideo?: boolean
  analyzeAudio?: boolean
  analyzeContent?: boolean
  generateInsights?: boolean
  
  // Детальность анализа
  deepAnalysis?: boolean
  includeFrameAnalysis?: boolean
  includeTranscription?: boolean
  
  // Параметры анализа
  videoOptions?: {
    extractKeyframes?: boolean
    detectScenes?: boolean
    analyzeMotion?: boolean
    analyzeQuality?: boolean
  }
  
  audioOptions?: {
    detectSilence?: boolean
    transcribe?: boolean
    analyzeQuality?: boolean
  }
  
  contentOptions?: {
    generateTags?: boolean
    analyzeSentiment?: boolean
    extractNarrative?: boolean
    generateSuggestions?: boolean
  }
}

/**
 * Результат пакетного анализа
 */
export interface BatchAnalysisResult {
  results: UnifiedMediaAnalysis[]
  summary: {
    totalFiles: number
    successful: number
    failed: number
    processingTime: number
  }
  errors?: Array<{
    fileId: string
    error: string
  }>
}

// Type guards для проверки типов
export function isVideoAnalysisResult(obj: any): obj is VideoAnalysisResult {
  return obj && typeof obj.duration === 'number' && 'fps' in obj && 'resolution' in obj
}

export function isAudioAnalysisResult(obj: any): obj is AudioAnalysisResult {
  return obj && typeof obj.duration === 'number' && 'channels' in obj && 'sampleRate' in obj
}

export function isContentAnalysisResult(obj: any): obj is ContentAnalysisResult {
  return obj && 'mediaFile' in obj && 'scenes' in obj && 'transcript' in obj
}

export function isUnifiedMediaAnalysis(obj: any): obj is UnifiedMediaAnalysis {
  return obj && 'id' in obj && 'mediaFile' in obj && 'timestamp' in obj
}