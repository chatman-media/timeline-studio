/**
 * AI Director Tauri Commands
 *
 * All AI Director operations through Tauri backend commands.
 * This is the only place where invoke() is called for AI Director.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../types"

const logger = createLogger("AiDirectorCommands")

// ============================================================================
// Core AI Director Analysis Commands
// ============================================================================

/**
 * Run comprehensive analysis on a video file
 */
export async function aiDirectorAnalyzeComprehensive(
  videoPath: string,
  config?: Partial<AIDirectorConfig>,
): Promise<ComprehensiveAnalysisResult> {
  logger.info("Running comprehensive analysis", { videoPath })
  return invoke("ai_director_v2_analyze_comprehensive", {
    videoPath,
    config,
  })
}

/**
 * Run quick analysis on a video file
 */
export async function aiDirectorAnalyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
  logger.info("Running quick analysis", { videoPath })
  return invoke("ai_director_v2_analyze_quick", {
    videoPath,
  })
}

/**
 * Run batch analysis on multiple video files
 */
export async function aiDirectorAnalyzeBatch(
  filePaths: string[],
  config?: Partial<AIDirectorConfig>,
): Promise<ComprehensiveAnalysisResult[]> {
  logger.info("Running batch analysis", { fileCount: filePaths.length })
  return invoke("ai_director_v2_analyze_batch", {
    filePaths,
    config,
  })
}

// ============================================================================
// System Capabilities and Configuration Commands
// ============================================================================

/**
 * Get AI Director system capabilities
 */
export async function aiDirectorGetCapabilities(): Promise<SystemCapabilities> {
  logger.debug("Getting AI Director capabilities")
  return invoke("ai_director_get_capabilities")
}

/**
 * Get default configuration for a mode
 */
export async function aiDirectorGetDefaultConfig(
  mode: "fast" | "balanced" | "quality" | "custom",
): Promise<AIDirectorConfig> {
  logger.debug("Getting default config", { mode })
  return invoke("ai_director_get_default_config", { mode })
}

/**
 * Validate AI Director configuration
 */
export async function aiDirectorValidateConfig(config: Partial<AIDirectorConfig>): Promise<ConfigValidationResult> {
  logger.debug("Validating AI Director config")
  return invoke("ai_director_validate_config", { config })
}

/**
 * Run health check on AI Director services
 */
export async function aiDirectorHealthCheck(): Promise<HealthCheckResult> {
  logger.debug("Running health check")
  return invoke("ai_director_health_check")
}

// ============================================================================
// Unified Audio Analysis Commands
// ============================================================================

export interface UnifiedAudioConfig {
  enable_ffmpeg_analysis?: boolean
  enable_montage_analysis?: boolean
  enable_transcription?: boolean
  performance_mode?: "fast" | "balanced" | "quality"
}

/**
 * Run comprehensive audio analysis
 */
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

/**
 * Run quick audio analysis
 */
export async function unifiedAudioAnalyzeQuick(videoPath: string): Promise<any> {
  logger.info("Running unified audio quick analysis", { videoPath })
  return invoke("unified_audio_analyze_quick", { videoPath })
}

/**
 * Run batch audio analysis
 */
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

/**
 * Get unified audio analysis capabilities
 */
export async function unifiedAudioGetCapabilities(): Promise<{
  ffmpegAvailable: boolean
  montageAvailable: boolean
  whisperAvailable: boolean
  gpuAvailable: boolean
}> {
  logger.debug("Getting unified audio capabilities")
  return invoke("unified_audio_get_capabilities")
}

// ============================================================================
// Video Analysis Commands
// ============================================================================

export interface AIDirectorVideoAnalysisOptions {
  enable_object_detection?: boolean
  enable_face_detection?: boolean
  enable_emotion_analysis?: boolean
  enable_composition_analysis?: boolean
  enable_audio_analysis?: boolean
  quality_threshold?: number
  max_moments?: number
}

/**
 * Run comprehensive video analysis
 */
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
