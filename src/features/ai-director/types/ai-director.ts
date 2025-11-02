/**
 * AI Director Domain Types
 * Типы для реальной AI Director архитектуры анализа медиа
 */

// === Core AI Director Types ===

export interface AIDirectorConfig {
  performance_mode: "fast" | "balanced" | "quality"
  enable_audio_analysis: boolean
  enable_video_analysis: boolean
  enable_face_analysis: boolean
  enable_object_analysis: boolean
  enable_emotion_analysis: boolean
  enable_composition_analysis: boolean
  enable_scene_detection: boolean
  enable_mcp_agents: boolean
  max_processing_time?: number
  generate_editing_recommendations: boolean
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

export interface ComprehensiveAnalysisResult {
  analysis_id: string
  status: "pending" | "in_progress" | "completed" | "failed" | "partially_completed"
  video_path: string
  audio_analysis?: {
    unified_result: any
    basic_metrics: {
      has_audio: boolean
      duration: number
      channels: number
      sample_rate: number
      bitrate: number
      file_size_bytes: number
      codec: string
    }
    ffmpeg_analysis?: {
      volume_analysis: number[]
      frequency_analysis: any
      spectral_analysis: any
      quality_issues: string[]
    }
    montage_analysis?: {
      speech_segments: Array<{ start: number; end: number; confidence: number }>
      music_segments: Array<{ start: number; end: number; genre?: string }>
      emotional_tone: string
      energy_level: number
      tempo_analysis: any
    }
    whisper_transcription?: {
      full_text: string
      segments: Array<{
        start: number
        end: number
        text: string
        confidence: number
      }>
      detected_language: string
    }
  }
  video_analysis?: {
    basic_info: {
      duration: number
      fps: number
      resolution: { width: number; height: number }
      codec: string
      file_size: number
    }
    scene_analysis?: Array<{
      start_time: number
      end_time: number
      scene_type: string
      confidence: number
      description: string
    }>
    object_detection?: Array<{
      timestamp: number
      objects: Array<{
        class_name: string
        confidence: number
        bbox: [number, number, number, number]
      }>
    }>
    face_analysis?: Array<{
      timestamp: number
      faces: Array<{
        confidence: number
        emotion?: string
        age?: number
        gender?: string
        bbox: [number, number, number, number]
        embedding?: number[]
      }>
    }>
    composition_analysis?: {
      overall_quality: number
      aesthetic_score: number
      rule_of_thirds: boolean
      symmetry_score: number
      brightness_histogram: number[]
      color_analysis: any
    }
  }
  scene_analysis?: any
  face_analysis?: any
  object_analysis?: any
  composition_analysis?: any
  editing_recommendations?: Array<{
    type: string
    description: string
    confidence: number
    suggested_action: string
    time_range?: { start: number; end: number }
  }>
  processing_time_ms: number
  created_at: string
  metadata?: {
    analysis_version: string
    engines_used: string[]
    config_used: AIDirectorConfig
    system_info: any
  }
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

// === Progress & Event Types ===

export interface AnalysisProgress {
  analysisId: string
  stage: string // "initialization", "audio", "video", "integration", "complete"
  progress: number // 0.0 - 1.0
  message?: string
  estimatedTimeRemaining?: number // seconds
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

// === Events для AI Director machine ===

export type AIDirectorEvent =
  | { type: "START_COMPREHENSIVE_ANALYSIS"; videoPath: string; config?: AIDirectorConfig }
  | { type: "START_QUICK_ANALYSIS"; videoPath: string }
  | { type: "START_BATCH_ANALYSIS"; filePaths: string[]; config?: AIDirectorConfig }
  | { type: "GET_CAPABILITIES" }
  | { type: "GET_DEFAULT_CONFIG"; mode: string }
  | { type: "VALIDATE_CONFIG"; config: AIDirectorConfig }
  | { type: "HEALTH_CHECK" }
  | { type: "ANALYSIS_PROGRESS"; progress: AnalysisProgress }
  | { type: "ANALYSIS_ERROR"; error: AnalysisError }
  | { type: "ANALYSIS_STAGE_COMPLETED"; stage: AnalysisStageCompleted }
  | { type: "ANALYSIS_COMPLETED"; result: ComprehensiveAnalysisResult }
  | { type: "CLEAR_ERRORS" }
  | { type: "CLEAR_RESULTS" }
  | { type: "SET_AUTO_REFRESH"; enabled: boolean }
  | { type: "REFRESH_STATUS" }

// === Dashboard State ===

export interface DashboardState {
  // Configuration
  config: AIDirectorConfig | null
  capabilities: SystemCapabilities | null
  health: HealthCheckResult | null

  // Current analysis
  currentAnalysis: ComprehensiveAnalysisResult | null
  analysisProgress: AnalysisProgress | null

  // Results history
  results: ComprehensiveAnalysisResult[]

  // Error handling
  errors: AnalysisError[]

  // UI state
  isLoading: boolean
  autoRefresh: boolean
  lastUpdate: string | null
  selectedTab: "overview" | "capabilities" | "analysis" | "results" | "config" | "health"
}

// === Legacy compatibility exports ===
// Для совместимости со старым кодом, если он существует

export interface SwarmStatus {
  initialized: boolean
  topology: "mesh" | "hierarchical" | "ring" | "star"
  activeAgents: number
  maxAgents: number
  strategy: "balanced" | "specialized" | "adaptive"
  health: "healthy" | "warning" | "error"
  lastUpdate: string
}

export interface AgentInfo {
  id: string
  name: string
  type: "researcher" | "coder" | "analyst" | "optimizer" | "coordinator"
  status: "active" | "idle" | "busy" | "error"
  capabilities: string[]
  performance: {
    tasksCompleted: number
    successRate: number
    averageTime: number
  }
  created: string
  lastActive: string
}

export interface TaskInfo {
  id: string
  description: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  priority: "low" | "medium" | "high" | "critical"
  strategy: "parallel" | "sequential" | "adaptive"
  assignedAgents: string[]
  progress: number
  created: string
  started?: string
  completed?: string
  error?: string
}

export interface AnalysisResult {
  id: string
  mediaPath: string
  type: "audio" | "video" | "comprehensive"
  status: "completed" | "failed" | "partial"
  metadata: {
    analysisVersion: string
    processingTime: number
    enginesUsed: string[]
    timestamp: string
    configUsed: any
  }
  error?: string
}

export interface WorkflowExecution {
  id: string
  templateId: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  mediaFiles: string[]
  parameters: Record<string, any>
  currentStep?: string
  completedSteps: string[]
  failedSteps: string[]
  stepResults: Record<string, any>
  finalResult?: any
  startTime: string
  endTime?: string
  totalDuration?: number
  errors: Array<{
    step: string
    error: string
    timestamp: string
  }>
  assignedAgents: string[]
}

export interface AIDirectorError {
  code: string
  message: string
  details?: any
  timestamp: string
  source: "analysis" | "system" | "validation" | "config"
  severity: "low" | "medium" | "high" | "critical"
  suggestions?: string[]
}

// === Export all types ===
export type {
  // Re-export for convenience
  SwarmStatus as McpSwarmStatus,
  AgentInfo as McpAgentInfo,
  TaskInfo as McpTaskInfo,
}
