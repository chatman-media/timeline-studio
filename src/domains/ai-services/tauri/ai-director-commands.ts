/**
 * AI Director Tauri Commands for AI Services Domain
 *
 * All AI Director operations through actual Tauri backend commands
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AiDirectorCommands")

/**
 * AI Director Types
 */
export interface AIDirectorConfig {
  performance_mode: "fast" | "balanced" | "quality"
  enable_audio_analysis: boolean
  enable_scene_detection: boolean
  enable_video_analysis: boolean
  enable_object_detection: boolean
  enable_face_recognition: boolean
  enable_transcription: boolean
  timeout_seconds: number
  max_memory_mb: number
}

export interface ComprehensiveAnalysisResult {
  analysis_id: string
  status: string
  audio_analysis?: {
    duration: number
    loudness: number
    tempo: number
    silence_percentage: number
    transcription?: string
  }
  scene_analysis?: {
    scenes: Array<{
      start_time: number
      end_time: number
      confidence: number
      description: string
    }>
    scene_count: number
  }
  video_analysis?: {
    width: number
    height: number
    fps: number
    duration: number
    bitrate: number
    codec: string
  }
  object_detection?: {
    objects: any[]
    total_objects: number
  }
  face_recognition?: {
    faces: any[]
    total_faces: number
  }
  started_at: string
  completed_at: string
  total_duration_ms: number
  errors: string[]
}

export interface SystemCapabilities {
  audio_analysis: boolean
  video_analysis: boolean
  object_detection: boolean
  face_recognition: boolean
  transcription: boolean
  gpu_acceleration: boolean
  mcp_agents: boolean
}

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface HealthCheckResult {
  overall_status: "healthy" | "degraded" | "unhealthy"
  services: {
    audio_engine: "healthy" | "degraded" | "unhealthy"
    video_analysis: "healthy" | "degraded" | "unhealthy"
    scene_detection: "healthy" | "degraded" | "unhealthy"
  }
  last_check: string
}

/**
 * Core AI Director Analysis Commands
 */
export async function aiDirectorAnalyzeComprehensive(
  videoPath: string,
  config?: AIDirectorConfig,
): Promise<ComprehensiveAnalysisResult> {
  logger.info("Running comprehensive analysis", { videoPath })
  return invoke("ai_director_v2_analyze_comprehensive", {
    videoPath,
    config,
  })
}

export async function aiDirectorAnalyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
  logger.info("Running quick analysis", { videoPath })
  return invoke("ai_director_v2_analyze_quick", {
    videoPath,
  })
}

export async function aiDirectorAnalyzeBatch(
  filePaths: string[],
  config?: AIDirectorConfig,
): Promise<ComprehensiveAnalysisResult[]> {
  logger.info("Running batch analysis", { fileCount: filePaths.length })
  return invoke("ai_director_v2_analyze_batch", {
    filePaths,
    config,
  })
}

/**
 * System Capabilities and Configuration Commands
 */
export async function aiDirectorGetCapabilities(): Promise<SystemCapabilities> {
  logger.debug("Getting AI Director capabilities")
  return invoke("ai_director_get_capabilities")
}

export async function aiDirectorGetDefaultConfig(
  mode: "fast" | "balanced" | "quality" | "custom",
): Promise<AIDirectorConfig> {
  logger.debug("Getting default config", { mode })
  return invoke("ai_director_get_default_config", { mode })
}

export async function aiDirectorValidateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult> {
  logger.debug("Validating AI Director config")
  return invoke("ai_director_validate_config", { config })
}

export async function aiDirectorHealthCheck(): Promise<HealthCheckResult> {
  logger.debug("Running health check")
  return invoke("ai_director_health_check")
}

/**
 * Unified Audio Analysis Commands
 */
export interface UnifiedAudioConfig {
  enable_ffmpeg_analysis?: boolean
  enable_montage_analysis?: boolean
  enable_transcription?: boolean
  performance_mode?: "fast" | "balanced" | "quality"
}

export async function unifiedAudioAnalyzeComprehensive(videoPath: string, config?: UnifiedAudioConfig): Promise<any> {
  logger.info("Running unified audio comprehensive analysis", { videoPath })
  return invoke("unified_audio_analyze_comprehensive", {
    videoPath,
    config: {
      enable_ffmpeg_analysis: config?.enable_ffmpeg_analysis ?? true,
      enable_montage_analysis: config?.enable_montage_analysis ?? true,
      enable_transcription: config?.enable_transcription ?? false,
      performance_mode: config?.performance_mode ?? "balanced",
    },
  })
}

export async function unifiedAudioAnalyzeQuick(videoPath: string): Promise<any> {
  logger.info("Running unified audio quick analysis", { videoPath })
  return invoke("unified_audio_analyze_quick", { videoPath })
}

export async function unifiedAudioAnalyzeBatch(
  filePaths: string[],
  config?: { performance_mode?: "fast" | "balanced" | "quality" },
): Promise<any[]> {
  logger.info("Running unified audio batch analysis", { fileCount: filePaths.length })
  return invoke("unified_audio_analyze_batch", {
    filePaths,
    config: {
      performance_mode: config?.performance_mode ?? "fast",
    },
  })
}

export async function unifiedAudioGetCapabilities(): Promise<{
  ffmpegAvailable: boolean
  montageAvailable: boolean
  whisperAvailable: boolean
  gpuAvailable: boolean
}> {
  logger.debug("Getting unified audio capabilities")
  return invoke("unified_audio_get_capabilities")
}

/**
 * Video Analysis Commands
 */
export interface AIDirectorVideoAnalysisOptions {
  enable_object_detection?: boolean
  enable_face_detection?: boolean
  enable_emotion_analysis?: boolean
  enable_composition_analysis?: boolean
  enable_audio_analysis?: boolean
  quality_threshold?: number
  max_moments?: number
}

export async function analyzeVideoComprehensive(
  videoPath: string,
  options?: AIDirectorVideoAnalysisOptions,
): Promise<any> {
  logger.info("Running comprehensive video analysis", { videoPath })
  return invoke("analyze_video_comprehensive", {
    videoPath,
    options: {
      enable_object_detection: options?.enable_object_detection ?? true,
      enable_face_detection: options?.enable_face_detection ?? true,
      enable_emotion_analysis: options?.enable_emotion_analysis ?? true,
      enable_composition_analysis: options?.enable_composition_analysis ?? true,
      enable_audio_analysis: options?.enable_audio_analysis ?? true,
      quality_threshold: options?.quality_threshold ?? 50.0,
      max_moments: options?.max_moments ?? 50,
    },
  })
}
