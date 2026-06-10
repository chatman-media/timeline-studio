import { container } from "../container"
import type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  ComprehensiveAnalysisResult as PortComprehensiveAnalysisResult,
  ConfigValidationResult as PortConfigValidationResult,
  SystemCapabilities as PortSystemCapabilities,
} from "../ports/ai.port"
import type {
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../types/ai-director"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "AiDirectorService" })

export type { AIDirectorConfig }

export interface UnifiedAudioConfig {
  enable_ffmpeg_analysis?: boolean
  enable_montage_analysis?: boolean
  enable_transcription?: boolean
  performance_mode?: "fast" | "balanced" | "quality" | "Fast" | "Balanced" | "Quality"
}

export interface AIDirectorVideoAnalysisOptions {
  enable_object_detection?: boolean
  enable_face_detection?: boolean
  enable_emotion_analysis?: boolean
  enable_composition_analysis?: boolean
  enable_audio_analysis?: boolean
  quality_threshold?: number
  max_moments?: number
}

type DefaultConfigMode = "fast" | "balanced" | "quality" | "custom" | "Fast" | "Balanced" | "Quality" | "Custom"

function toPascalMode(mode: DefaultConfigMode): "Fast" | "Balanced" | "Quality" | "Custom" {
  switch (mode) {
    case "fast":
    case "Fast":
      return "Fast"
    case "quality":
    case "Quality":
      return "Quality"
    case "custom":
    case "Custom":
      return "Custom"
    default:
      return "Balanced"
  }
}

function normalizeValidationResult(
  result: PortConfigValidationResult | Partial<ConfigValidationResult>,
): ConfigValidationResult {
  const candidate = result as Partial<ConfigValidationResult> & Partial<PortConfigValidationResult>
  return {
    is_valid: candidate.is_valid ?? candidate.valid ?? candidate.errors?.length === 0,
    warnings: candidate.warnings ?? [],
    errors: candidate.errors ?? [],
    estimated_time: candidate.estimated_time ?? 0,
    estimated_memory: candidate.estimated_memory ?? 0,
  }
}

function normalizeHealthResult(result: AIDirectorHealthCheckResult | HealthCheckResult): HealthCheckResult {
  const candidate = result as HealthCheckResult
  return {
    overall_status: candidate.overall_status,
    services: candidate.services,
    last_check: candidate.last_check,
  }
}

function toCoreAnalysis(result: PortComprehensiveAnalysisResult): ComprehensiveAnalysisResult {
  return result as unknown as ComprehensiveAnalysisResult
}

function toCoreCapabilities(result: PortSystemCapabilities): SystemCapabilities {
  return result as SystemCapabilities
}

function toAudioMode(mode?: UnifiedAudioConfig["performance_mode"]): "Fast" | "Balanced" | "Quality" {
  switch (mode) {
    case "fast":
    case "Fast":
      return "Fast"
    case "quality":
    case "Quality":
      return "Quality"
    default:
      return "Balanced"
  }
}

export async function aiDirectorAnalyzeComprehensive(
  videoPath: string,
  config?: Partial<AIDirectorConfig>,
): Promise<ComprehensiveAnalysisResult> {
  logger.info("Running comprehensive analysis", { videoPath })
  return toCoreAnalysis(await container.getAI().aiDirectorAnalyzeComprehensive(videoPath, config as AIDirectorConfig))
}

export async function aiDirectorAnalyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
  logger.info("Running quick analysis", { videoPath })
  return toCoreAnalysis(await container.getAI().aiDirectorAnalyzeQuick(videoPath))
}

export async function aiDirectorAnalyzeBatch(
  filePaths: string[],
  config?: Partial<AIDirectorConfig>,
): Promise<ComprehensiveAnalysisResult[]> {
  const useParallel = config?.enable_parallel_processing !== false
  logger.info("Running batch analysis", {
    fileCount: filePaths.length,
    mode: useParallel ? "parallel" : "sequential",
    maxParallel: config?.max_parallel_files,
  })

  const ai = container.getAI()
  const normalizedConfig = config as AIDirectorConfig
  const parallelConfig = {
    ...normalizedConfig,
    max_parallel_files: normalizedConfig.max_parallel_files ?? undefined,
  } as Parameters<typeof ai.aiDirectorAnalyzeBatchParallel>[1]
  const results = useParallel
    ? await ai.aiDirectorAnalyzeBatchParallel(filePaths, parallelConfig)
    : await ai.aiDirectorAnalyzeBatch(filePaths, normalizedConfig)

  return results.map(toCoreAnalysis)
}

export async function aiDirectorGetCapabilities(): Promise<SystemCapabilities> {
  logger.debug("Getting AI Director capabilities")
  return toCoreCapabilities(await container.getAI().aiDirectorGetCapabilities())
}

export async function aiDirectorGetDefaultConfig(mode: DefaultConfigMode): Promise<AIDirectorConfig> {
  logger.debug("Getting default config", { mode })
  return container.getAI().aiDirectorGetDefaultConfig(toPascalMode(mode))
}

export async function aiDirectorValidateConfig(config: Partial<AIDirectorConfig>): Promise<ConfigValidationResult> {
  logger.debug("Validating AI Director config")
  return normalizeValidationResult(await container.getAI().aiDirectorValidateConfig(config as AIDirectorConfig))
}

export async function aiDirectorHealthCheck(): Promise<HealthCheckResult> {
  logger.debug("Running health check")
  return normalizeHealthResult(await container.getAI().aiDirectorHealthCheck())
}

export async function unifiedAudioAnalyzeComprehensive(
  videoPath: string,
  config?: UnifiedAudioConfig,
): Promise<unknown> {
  logger.info("Running unified audio comprehensive analysis", { videoPath })
  return container.getAI().unifiedAudioAnalyzeComprehensive(videoPath, {
    enable_ffmpeg_analysis: config?.enable_ffmpeg_analysis ?? true,
    enable_montage_analysis: config?.enable_montage_analysis ?? true,
    enable_transcription: config?.enable_transcription ?? false,
    performance_mode: toAudioMode(config?.performance_mode),
  })
}

export async function unifiedAudioAnalyzeQuick(videoPath: string): Promise<unknown> {
  logger.info("Running unified audio quick analysis", { videoPath })
  return container.getAI().unifiedAudioAnalyzeQuick(videoPath)
}

export async function unifiedAudioAnalyzeBatch(
  filePaths: string[],
  config?: { performance_mode?: UnifiedAudioConfig["performance_mode"] },
): Promise<unknown[]> {
  logger.info("Running unified audio batch analysis", { fileCount: filePaths.length })
  return container.getAI().unifiedAudioAnalyzeBatch(filePaths, {
    performance_mode: toAudioMode(config?.performance_mode ?? "fast"),
  })
}

export async function unifiedAudioGetCapabilities(): Promise<{
  ffmpegAvailable: boolean
  montageAvailable: boolean
  whisperAvailable: boolean
  gpuAvailable: boolean
}> {
  logger.debug("Getting unified audio capabilities")
  return container.getAI().unifiedAudioGetCapabilities()
}

export async function analyzeVideoComprehensive(
  videoPath: string,
  options?: AIDirectorVideoAnalysisOptions,
): Promise<unknown> {
  logger.info("Running comprehensive video analysis", { videoPath })
  return container.getAI().analyzeVideoComprehensive(videoPath, {
    enable_object_detection: options?.enable_object_detection ?? true,
    enable_face_detection: options?.enable_face_detection ?? true,
    enable_emotion_analysis: options?.enable_emotion_analysis ?? true,
    enable_composition_analysis: options?.enable_composition_analysis ?? true,
    enable_audio_analysis: options?.enable_audio_analysis ?? true,
    quality_threshold: options?.quality_threshold ?? 50.0,
    max_moments: options?.max_moments ?? 50,
  })
}

export class AIDirectorService {
  private static instance: AIDirectorService | null = null

  static getInstance(): AIDirectorService {
    if (!AIDirectorService.instance) {
      AIDirectorService.instance = new AIDirectorService()
    }
    return AIDirectorService.instance
  }

  async analyzeComprehensive(videoPath: string, config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult> {
    return aiDirectorAnalyzeComprehensive(videoPath, config)
  }

  async analyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
    return aiDirectorAnalyzeQuick(videoPath)
  }

  async analyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]> {
    return aiDirectorAnalyzeBatch(filePaths, config)
  }

  async getCapabilities(): Promise<SystemCapabilities> {
    return aiDirectorGetCapabilities()
  }

  async getDefaultConfig(mode: DefaultConfigMode): Promise<AIDirectorConfig> {
    return aiDirectorGetDefaultConfig(mode)
  }

  async validateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult> {
    return aiDirectorValidateConfig(config)
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return aiDirectorHealthCheck()
  }

  async analyzeAudioComprehensive(
    videoPath: string,
    config?: {
      enableFFmpeg?: boolean
      enableMontage?: boolean
      enableTranscription?: boolean
      performanceMode?: "fast" | "balanced" | "quality" | "Fast" | "Balanced" | "Quality"
    },
  ): Promise<unknown> {
    return unifiedAudioAnalyzeComprehensive(videoPath, {
      enable_ffmpeg_analysis: config?.enableFFmpeg ?? true,
      enable_montage_analysis: config?.enableMontage ?? true,
      enable_transcription: config?.enableTranscription ?? false,
      performance_mode: config?.performanceMode ?? "balanced",
    })
  }

  async analyzeAudioQuick(videoPath: string): Promise<unknown> {
    return unifiedAudioAnalyzeQuick(videoPath)
  }

  async analyzeAudioBatch(
    filePaths: string[],
    config?: { performanceMode?: "fast" | "balanced" | "quality" | "Fast" | "Balanced" | "Quality" },
  ): Promise<unknown[]> {
    return unifiedAudioAnalyzeBatch(filePaths, config ? { performance_mode: config.performanceMode } : undefined)
  }

  async getAudioAnalysisCapabilities(): Promise<{
    ffmpegAvailable: boolean
    montageAvailable: boolean
    whisperAvailable: boolean
    gpuAvailable: boolean
  }> {
    return unifiedAudioGetCapabilities()
  }

  async analyzeVideoComprehensive(
    videoPath: string,
    options?: {
      enableObjectDetection?: boolean
      enableFaceDetection?: boolean
      enableEmotionAnalysis?: boolean
      enableCompositionAnalysis?: boolean
      enableAudioAnalysis?: boolean
      qualityThreshold?: number
      maxMoments?: number
    },
  ): Promise<unknown> {
    return analyzeVideoComprehensive(videoPath, {
      enable_object_detection: options?.enableObjectDetection ?? true,
      enable_face_detection: options?.enableFaceDetection ?? true,
      enable_emotion_analysis: options?.enableEmotionAnalysis ?? true,
      enable_composition_analysis: options?.enableCompositionAnalysis ?? true,
      enable_audio_analysis: options?.enableAudioAnalysis ?? true,
      quality_threshold: options?.qualityThreshold ?? 50.0,
      max_moments: options?.maxMoments ?? 50,
    })
  }

  async getConfiguration(): Promise<AIDirectorConfig> {
    return this.getDefaultConfig("balanced")
  }

  async updateConfiguration(config: Partial<AIDirectorConfig>): Promise<void> {
    logger.info("Updating AI Director config", { config })
  }

  async resetConfiguration(): Promise<void> {
    logger.info("Resetting AI Director config to defaults")
  }

  async getSystemStatus(): Promise<{
    capabilities: SystemCapabilities
    health: HealthCheckResult
    audioCapabilities: unknown
  }> {
    const [capabilities, health, audioCapabilities] = await Promise.all([
      this.getCapabilities(),
      this.healthCheck(),
      this.getAudioAnalysisCapabilities(),
    ])

    return { capabilities, health, audioCapabilities }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.getCapabilities()
      return true
    } catch (error) {
      logger.error("AI Director not available", { error })
      return false
    }
  }

  async getVersionInfo(): Promise<{
    version: string
    buildDate: string
    capabilities: string[]
  }> {
    return {
      version: "1.0.0",
      buildDate: new Date().toISOString(),
      capabilities: ["audio_analysis", "video_analysis", "comprehensive_analysis"],
    }
  }
}

export const aiDirectorService = AIDirectorService.getInstance()
