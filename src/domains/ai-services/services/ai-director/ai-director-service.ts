/**
 * AI Director Service - сервис для работы с реальной AI Director архитектурой
 * Все операции проходят через актуальные Tauri backend команды
 *
 * @module ai-services/services/ai-director
 */

import { createLogger } from "@/lib/tauri-logger"
import {
  type AIDirectorConfig,
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
    return aiDirectorAnalyzeBatchParallel(filePaths, {
      performance_mode: config?.performance_mode ?? "balanced",
      enable_audio_analysis: config?.enable_audio_analysis ?? true,
      enable_scene_detection: config?.enable_scene_detection ?? true,
      enable_video_analysis: config?.enable_video_analysis ?? true,
      enable_object_detection: config?.enable_object_detection ?? true,
      enable_face_recognition: config?.enable_face_recognition ?? true,
      enable_transcription: config?.enable_transcription ?? false,
      timeout_seconds: config?.timeout_seconds ?? 300,
      max_memory_mb: config?.max_memory_mb ?? 4096,
      enable_parallel_processing: true,
      max_parallel_files: maxParallel ?? 4,
    })
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
  async getDefaultConfig(mode: "fast" | "balanced" | "quality" | "custom"): Promise<AIDirectorConfig> {
    return aiDirectorGetDefaultConfig(mode)
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
      performanceMode?: "fast" | "balanced" | "quality"
    },
  ): Promise<any> {
    const unifiedConfig: UnifiedAudioConfig = {
      enable_ffmpeg_analysis: config?.enableFFmpeg ?? true,
      enable_montage_analysis: config?.enableMontage ?? true,
      enable_transcription: config?.enableTranscription ?? false,
      performance_mode: config?.performanceMode ?? "balanced",
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
    config?: { performanceMode?: "fast" | "balanced" | "quality" },
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
    return this.getDefaultConfig("balanced")
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
