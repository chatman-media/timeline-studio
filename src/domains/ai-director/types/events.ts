/**
 * AI Director Event Types
 *
 * Типы для событий AI Director (Tauri events payload)
 */

// ============================================================================
// Event Payload Types
// ============================================================================

export interface AnalysisProgress {
  analysisId: string
  stage: string // "initialization", "audio", "video", "integration", "complete"
  progress: number // 0.0 - 1.0
  message?: string
  estimatedTimeRemaining?: number // seconds
  fileName?: string // имя анализируемого файла
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

// ============================================================================
// System Types
// ============================================================================

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
  overall_status: string // "healthy", "warning", "error"
  services: Record<string, string>
  last_check: string
}

export interface ConfigValidationResult {
  is_valid: boolean
  warnings: string[]
  errors: string[]
  estimated_time: number // seconds
  estimated_memory: number // MB
}
