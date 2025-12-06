/**
 * AI Director Types
 * Типы для AI Director системы анализа
 */

import type { AIDirectorConfig } from "@/core/ports/ai.port"

import type {
  AnalysisCompleted,
  AnalysisError,
  AnalysisProgress,
  AnalysisStageCompleted,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "./events"

// ============================================================================
// Configuration Types
// ============================================================================

// AIDirectorConfig is imported from core/ports/ai.port
export type { AIDirectorConfig }

// PerformanceMode is extracted from AIDirectorConfig
export type PerformanceMode = AIDirectorConfig["performance_mode"]

// ============================================================================
// Analysis Result Types
// ============================================================================

export type AnalysisStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled"

export interface UnifiedAudioAnalysisResult {
  /** Длительность аудио */
  duration: number
  /** Громкость */
  loudness: number
  /** Темп */
  tempo: number
  /** Тишина */
  silence_percentage: number
  /** Транскрипция */
  transcription?: string
  /** Дополнительные метрики */
  metrics?: Record<string, number>
}

export interface SceneAnalysisResult {
  /** Обнаруженные сцены */
  scenes: Array<{
    start_time: number
    end_time: number
    confidence: number
    description?: string
  }>
  /** Общее количество сцен */
  scene_count: number
}

export interface VideoAnalysisResult {
  /** Ширина */
  width: number
  /** Высота */
  height: number
  /** FPS */
  fps: number
  /** Длительность */
  duration: number
  /** Битрейт */
  bitrate?: number
  /** Кодек */
  codec?: string
}

export interface ObjectDetectionResult {
  /** Обнаруженные объекты */
  objects: Array<{
    label: string
    confidence: number
    bbox: [number, number, number, number]
    timestamp: number
  }>
  /** Общее количество объектов */
  total_objects: number
}

export interface FaceRecognitionResult {
  /** Обнаруженные лица */
  faces: Array<{
    person_id?: string
    confidence: number
    bbox: [number, number, number, number]
    timestamp: number
  }>
  /** Общее количество лиц */
  total_faces: number
}

export interface ComprehensiveAnalysisResult {
  /** ID анализа */
  analysis_id: string
  /** Статус анализа */
  status: AnalysisStatus
  /** Unified audio analysis результат */
  audio_analysis?: UnifiedAudioAnalysisResult
  /** Scene analysis результат */
  scene_analysis?: SceneAnalysisResult
  /** Video analysis результат */
  video_analysis?: VideoAnalysisResult
  /** Object detection результат */
  object_detection?: ObjectDetectionResult
  /** Face recognition результат */
  face_recognition?: FaceRecognitionResult
  /** Время начала */
  started_at: string
  /** Время завершения */
  completed_at?: string
  /** Общая длительность (мс) */
  total_duration_ms?: number
  /** Ошибки */
  errors: string[]
}

// ============================================================================
// Machine Events
// ============================================================================

export type AIDirectorEvent =
  // Analysis commands
  | { type: "START_COMPREHENSIVE_ANALYSIS"; videoPath: string; config?: AIDirectorConfig }
  | { type: "START_QUICK_ANALYSIS"; videoPath: string }
  | { type: "START_BATCH_ANALYSIS"; filePaths: string[]; config?: AIDirectorConfig }
  | { type: "CANCEL_ANALYSIS"; analysisId: string }
  // System commands
  | { type: "GET_CAPABILITIES" }
  | { type: "GET_DEFAULT_CONFIG"; mode: string }
  | { type: "VALIDATE_CONFIG"; config: AIDirectorConfig }
  | { type: "HEALTH_CHECK" }
  // Analysis events
  | { type: "ANALYSIS_PROGRESS"; progress: AnalysisProgress }
  | { type: "ANALYSIS_ERROR"; error: AnalysisError }
  | { type: "ANALYSIS_COMPLETED"; result: ComprehensiveAnalysisResult }
  | { type: "ANALYSIS_STAGE_COMPLETED"; stage: AnalysisStageCompleted }
  // UI commands
  | { type: "CLEAR_ERRORS" }
  | { type: "CLEAR_RESULTS" }
  | { type: "SET_AUTO_REFRESH"; enabled: boolean }
  | { type: "REFRESH_STATUS" }

// Re-export types from events
export type {
  AnalysisCompleted,
  AnalysisError,
  AnalysisProgress,
  AnalysisStageCompleted,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
}
