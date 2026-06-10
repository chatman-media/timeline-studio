/**
 * AI Director Service - сервис для работы с реальной AI Director архитектурой
 * Все операции проходят через актуальные Tauri backend команды
 *
 * @module ai-services/services/ai-director
 */

import type { AIDirectorConfig } from "@timeline-studio/core/ports/ai.port"
import { createLogger } from "@/lib/tauri-logger"
import {
  type AIDirectorHealthCheckResult,
  type AIDirectorVideoAnalysisOptions,
  aiDirectorAnalyzeBatch,
  aiDirectorAnalyzeBatchParallel,
  aiDirectorAnalyzeComprehensive,
  aiDirectorAnalyzeQuick,
  aiDirectorGetCapabilities,
  aiDirectorGetDefaultConfig,
  aiDirectorHealthCheck,
  aiDirectorValidateConfig,
  analyzeVideoComprehensive,
  type ComprehensiveAnalysisResult,
  type ConfigValidationResult,
  type SystemCapabilities,
  type UnifiedAudioConfig,
  unifiedAudioAnalyzeBatch,
  unifiedAudioAnalyzeComprehensive,
  unifiedAudioAnalyzeQuick,
  unifiedAudioGetCapabilities,
} from "../../tauri/ai-director-commands"

const logger = createLogger({ module: "AiDirectorService" })

export class AIDirectorService {
  private static instance: AIDirectorService | null = null

  static getInstance(): AIDirectorService {
    if (!AIDirectorService.instance) {
      AIDirectorService.instance = new AIDirectorService()
    }
    return AIDirectorService.instance
  }

  // === Core AI Director Operations ===

  /**
   * Запустить comprehensive analysis медиафайла
   */
  async analyzeComprehensive(videoPath: string, config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult> {
    return aiDirectorAnalyzeComprehensive(videoPath, config)
  }

  /**
   * Запустить быстрый анализ медиафайла
   */
  async analyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
    return aiDirectorAnalyzeQuick(videoPath)
  }

  /**
   * Запустить batch analysis нескольких файлов (последовательно)
   */
  async analyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]> {
    return aiDirectorAnalyzeBatch(filePaths, config)
  }

  /**
   * 🆕 Phase 3: Запустить ПАРАЛЛЕЛЬНЫЙ batch analysis нескольких файлов
   *
   * Обрабатывает несколько файлов одновременно для значительного ускорения.
   * По умолчанию использует min(CPU cores, 4) параллельных воркеров.
   *
   * @param filePaths - Пути к файлам для анализа
   * @param config - Конфигурация с опциями параллельной обработки
   * @param maxParallel - Максимальное количество параллельных задач (default: 4)
   * @returns Результаты анализа в исходном порядке файлов
   */
  async analyzeBatchParallel(
    filePaths: string[],
    config?: Partial<AIDirectorConfig>,
    maxParallel?: number,
  ): Promise<ComprehensiveAnalysisResult[]> {
    logger.info("Starting parallel batch analysis", {
      fileCount: filePaths.length,
      maxParallel: maxParallel ?? 4,
    })

    // Создаем полный конфиг с дефолтными значениями
    const fullConfig: AIDirectorConfig & { enable_parallel_processing?: boolean; max_parallel_files?: number } = {
      // Performance
      performance_mode: config?.performance_mode ?? "Balanced",

      // Core analysis toggles
      enable_audio_analysis: config?.enable_audio_analysis ?? true,
      enable_scene_detection: config?.enable_scene_detection ?? true,
      enable_video_analysis: config?.enable_video_analysis ?? true,
      enable_vision_analysis: config?.enable_vision_analysis ?? true,

      // Detection features
      enable_face_detection: config?.enable_face_detection ?? false,
      enable_face_analysis: config?.enable_face_analysis ?? false,
      enable_object_detection: config?.enable_object_detection ?? false,
      enable_object_analysis: config?.enable_object_analysis ?? false,
      enable_emotion_analysis: config?.enable_emotion_analysis ?? false,

      // Advanced analysis
      enable_moment_detection: config?.enable_moment_detection ?? false,
      enable_content_classification: config?.enable_content_classification ?? false,
      enable_composition_analysis: config?.enable_composition_analysis ?? false,
      enable_mood_analysis: config?.enable_mood_analysis ?? false,
      enable_quality_analysis: config?.enable_quality_analysis ?? false,

      // Processing limits
      max_processing_time: config?.max_processing_time ?? 300,
      quality_threshold: config?.quality_threshold ?? 50.0,
      max_key_moments: config?.max_key_moments ?? 50,
      enable_caching: config?.enable_caching ?? true,

      // Recommendations
      generate_editing_recommendations: config?.generate_editing_recommendations ?? false,
      enable_mcp_agents: config?.enable_mcp_agents ?? false,

      // AI Provider integration
      ai_provider: config?.ai_provider ?? null,
      ai_model: config?.ai_model ?? null,
      ai_api_key: config?.ai_api_key ?? null,
      enable_ai_enhanced_analysis: config?.enable_ai_enhanced_analysis ?? false,
      enable_ai_descriptions: config?.enable_ai_descriptions ?? false,
      enable_ai_mood_analysis: config?.enable_ai_mood_analysis ?? false,

      // Vision Language Model
      enable_vision_language_model: config?.enable_vision_language_model ?? false,
      vlm_model: config?.vlm_model ?? null,
      vlm_num_frames: config?.vlm_num_frames ?? 5,
      vlm_temperature: config?.vlm_temperature ?? 0.7,
      vlm_max_tokens: config?.vlm_max_tokens ?? 1024,

      // Parallel processing
      enable_parallel_processing: true,
      max_parallel_files: maxParallel ?? 4,
    }

    return aiDirectorAnalyzeBatchParallel(filePaths, fullConfig)
  }

  /**
   * Получить системные возможности AI Director
   */
  async getCapabilities(): Promise<SystemCapabilities> {
    return aiDirectorGetCapabilities()
  }

  /**
   * Получить конфигурацию по умолчанию
   */
  async getDefaultConfig(mode: "Fast" | "Balanced" | "Quality" | "Custom"): Promise<AIDirectorConfig> {
    // Convert PascalCase to lowercase for Tauri
    const rustMode = mode.toLowerCase() as "fast" | "balanced" | "quality" | "custom"
    return aiDirectorGetDefaultConfig(rustMode)
  }

  /**
   * Валидировать конфигурацию AI Director
   */
  async validateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult> {
    return aiDirectorValidateConfig(config)
  }

  /**
   * Выполнить health check системы
   */
  async healthCheck(): Promise<AIDirectorHealthCheckResult> {
    return aiDirectorHealthCheck()
  }

  // === Audio Analysis (через Unified System) ===

  /**
   * Comprehensive audio analysis
   */
  async analyzeAudioComprehensive(
    videoPath: string,
    config?: {
      enableFFmpeg?: boolean
      enableMontage?: boolean
      enableTranscription?: boolean
      performanceMode?: "Fast" | "Balanced" | "Quality"
    },
  ): Promise<any> {
    const unifiedConfig: UnifiedAudioConfig = {
      enable_ffmpeg_analysis: config?.enableFFmpeg ?? true,
      enable_montage_analysis: config?.enableMontage ?? true,
      enable_transcription: config?.enableTranscription ?? false,
      performance_mode: config?.performanceMode ?? "Balanced",
    }
    return unifiedAudioAnalyzeComprehensive(videoPath, unifiedConfig)
  }

  /**
   * Быстрый audio analysis
   */
  async analyzeAudioQuick(videoPath: string): Promise<any> {
    return unifiedAudioAnalyzeQuick(videoPath)
  }

  /**
   * Batch audio analysis
   */
  async analyzeAudioBatch(
    filePaths: string[],
    config?: { performanceMode?: "Fast" | "Balanced" | "Quality" },
  ): Promise<any[]> {
    return unifiedAudioAnalyzeBatch(filePaths, config ? { performance_mode: config.performanceMode } : undefined)
  }

  /**
   * Получить audio analysis capabilities
   */
  async getAudioAnalysisCapabilities(): Promise<{
    ffmpegAvailable: boolean
    montageAvailable: boolean
    whisperAvailable: boolean
    gpuAvailable: boolean
  }> {
    return unifiedAudioGetCapabilities()
  }

  // === Video Analysis ===

  /**
   * Comprehensive video analysis
   */
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
  ): Promise<any> {
    const videoOptions: AIDirectorVideoAnalysisOptions = {
      enable_object_detection: options?.enableObjectDetection ?? true,
      enable_face_detection: options?.enableFaceDetection ?? true,
      enable_emotion_analysis: options?.enableEmotionAnalysis ?? true,
      enable_composition_analysis: options?.enableCompositionAnalysis ?? true,
      enable_audio_analysis: options?.enableAudioAnalysis ?? true,
      quality_threshold: options?.qualityThreshold ?? 50.0,
      max_moments: options?.maxMoments ?? 50,
    }
    return analyzeVideoComprehensive(videoPath, videoOptions)
  }

  // === Configuration Management ===

  /**
   * Получить конфигурацию AI Director
   */
  async getConfiguration(): Promise<AIDirectorConfig> {
    // Используем getDefaultConfig как временное решение
    return this.getDefaultConfig("Balanced")
  }

  /**
   * Обновить конфигурацию AI Director
   */
  async updateConfiguration(config: Partial<AIDirectorConfig>): Promise<void> {
    // TODO: Implement when backend command is available
    console.log("Updating AI Director config:", config)
  }

  /**
   * Сбросить конфигурацию к значениям по умолчанию
   */
  async resetConfiguration(): Promise<void> {
    // TODO: Implement when backend command is available
    console.log("Resetting AI Director config to defaults")
  }

  // === System Status & Monitoring ===

  /**
   * Получить общий системный статус
   */
  async getSystemStatus(): Promise<{
    capabilities: SystemCapabilities
    health: AIDirectorHealthCheckResult
    audioCapabilities: any
  }> {
    const [capabilities, health, audioCapabilities] = await Promise.all([
      this.getCapabilities(),
      this.healthCheck(),
      this.getAudioAnalysisCapabilities(),
    ])

    return {
      capabilities,
      health,
      audioCapabilities,
    }
  }

  // === Error Handling & Utilities ===

  /**
   * Проверить доступность AI Director системы
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.getCapabilities()
      return true
    } catch (error) {
      console.error("AI Director not available:", error)
      return false
    }
  }

  /**
   * Получить информацию о версии AI Director
   */
  async getVersionInfo(): Promise<{
    version: string
    buildDate: string
    capabilities: string[]
  }> {
    // TODO: Add version command when available
    return {
      version: "1.0.0",
      buildDate: new Date().toISOString(),
      capabilities: ["audio_analysis", "video_analysis", "comprehensive_analysis"],
    }
  }
}

// Export singleton instance
export const aiDirectorService = AIDirectorService.getInstance()

// Re-export types for convenience
export type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  AIDirectorVideoAnalysisOptions,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  SystemCapabilities,
  UnifiedAudioConfig,
}
