import type { AIDirectorConfig } from "../ports/ai.port"

export type { AIDirectorConfig }

export type PerformanceMode = AIDirectorConfig["performance_mode"]
export type AnalysisStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled"

export interface UnifiedAudioAnalysisResult {
  duration: number
  loudness: number
  tempo: number
  silence_percentage: number
  transcription?: string
  metrics?: Record<string, number>
}

export interface SceneAnalysisResult {
  scenes: Array<{
    start_time: number
    end_time: number
    confidence: number
    description?: string
  }>
  scene_count: number
}

export interface VideoAnalysisResult {
  width: number
  height: number
  fps: number
  duration: number
  bitrate?: number
  codec?: string
}

export interface ObjectDetectionResult {
  objects: Array<{
    label: string
    confidence: number
    bbox: [number, number, number, number]
    timestamp: number
  }>
  total_objects: number
}

export interface FaceRecognitionResult {
  faces: Array<{
    person_id?: string
    confidence: number
    bbox: [number, number, number, number]
    timestamp: number
  }>
  total_faces: number
}

export interface ComprehensiveAnalysisResult {
  analysis_id: string
  status: AnalysisStatus | string
  audio_analysis?: UnifiedAudioAnalysisResult
  scene_analysis?: SceneAnalysisResult
  video_analysis?: VideoAnalysisResult
  object_detection?: ObjectDetectionResult
  face_recognition?: FaceRecognitionResult
  started_at: string
  completed_at?: string
  total_duration_ms?: number
  errors: string[]
}

export interface AnalysisProgress {
  analysisId: string
  stage: string
  progress: number
  message?: string
  estimatedTimeRemaining?: number
  fileName?: string
}

export interface AnalysisError {
  analysisId: string
  stage: string
  error: string
}

export interface AnalysisStageCompleted {
  analysisId: string
  stage: string
  duration_ms: number
  success: boolean
  error?: string
}

export interface AnalysisCompleted {
  analysisId: string
  success: boolean
  total_duration_ms: number
  stages_completed: string[]
  errors: string[]
}

export interface SystemCapabilities {
  audio_analysis: boolean
  video_analysis: boolean
  face_recognition: boolean
  object_detection: boolean
  transcription: boolean
  gpu_acceleration: boolean
  mcp_agents: boolean
}

export interface HealthCheckResult {
  overall_status: string
  services: Record<string, string>
  last_check: string
}

export interface ConfigValidationResult {
  is_valid: boolean
  warnings: string[]
  errors: string[]
  estimated_time: number
  estimated_memory: number
}

export type AIDirectorEvent =
  | { type: "START_COMPREHENSIVE_ANALYSIS"; videoPath: string; config?: AIDirectorConfig }
  | { type: "START_QUICK_ANALYSIS"; videoPath: string }
  | { type: "START_BATCH_ANALYSIS"; filePaths: string[]; config?: AIDirectorConfig }
  | { type: "CANCEL_ANALYSIS"; analysisId: string }
  | { type: "GET_CAPABILITIES" }
  | { type: "GET_DEFAULT_CONFIG"; mode: string }
  | { type: "VALIDATE_CONFIG"; config: AIDirectorConfig }
  | { type: "HEALTH_CHECK" }
  | { type: "ANALYSIS_PROGRESS"; progress: AnalysisProgress }
  | { type: "ANALYSIS_ERROR"; error: AnalysisError }
  | { type: "ANALYSIS_COMPLETED"; result: ComprehensiveAnalysisResult }
  | { type: "ANALYSIS_STAGE_COMPLETED"; stage: AnalysisStageCompleted }
  | { type: "CLEAR_ERRORS" }
  | { type: "CLEAR_RESULTS" }
  | { type: "SET_AUTO_REFRESH"; enabled: boolean }
  | { type: "REFRESH_STATUS" }
