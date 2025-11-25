/**
 * AI Director Service - сервис для работы с реальной AI Director архитектурой
 * Все операции проходят через актуальные Tauri backend команды
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "../../../lib/tauri-logger"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../types/ai-director"

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
    return invoke("ai_director_v2_analyze_comprehensive", {
      videoPath,
      config,
    })
  }

  /**
   * Запустить быстрый анализ медиафайла
   */
  async analyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
    return invoke("ai_director_v2_analyze_quick", {
      videoPath,
    })
  }

  /**
   * Запустить batch analysis нескольких файлов
   */
  async analyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]> {
    return invoke("ai_director_v2_analyze_batch", {
      filePaths,
      config,
    })
  }

  /**
   * Получить системные возможности AI Director
   */
  async getCapabilities(): Promise<SystemCapabilities> {
    return invoke("ai_director_get_capabilities")
  }

  /**
   * Получить конфигурацию по умолчанию
   */
  async getDefaultConfig(mode: "fast" | "balanced" | "quality" | "custom"): Promise<AIDirectorConfig> {
    return invoke("ai_director_get_default_config", { mode })
  }

  /**
   * Валидировать конфигурацию AI Director
   */
  async validateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult> {
    return invoke("ai_director_validate_config", { config })
  }

  /**
   * Выполнить health check системы
   */
  async healthCheck(): Promise<HealthCheckResult> {
    return invoke("ai_director_health_check")
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
    return invoke("unified_audio_analyze_comprehensive", {
      videoPath,
      config: {
        enable_ffmpeg_analysis: config?.enableFFmpeg ?? true,
        enable_montage_analysis: config?.enableMontage ?? true,
        enable_transcription: config?.enableTranscription ?? false,
        performance_mode: config?.performanceMode ?? "balanced",
      },
    })
  }

  /**
   * Быстрый audio analysis
   */
  async analyzeAudioQuick(videoPath: string): Promise<any> {
    return invoke("unified_audio_analyze_quick", { videoPath })
  }

  /**
   * Batch audio analysis
   */
  async analyzeAudioBatch(
    filePaths: string[],
    config?: { performanceMode?: "fast" | "balanced" | "quality" },
  ): Promise<any[]> {
    return invoke("unified_audio_analyze_batch", {
      filePaths,
      config: {
        performance_mode: config?.performanceMode ?? "fast",
      },
    })
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
    return invoke("unified_audio_get_capabilities")
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
    return invoke("analyze_video_comprehensive", {
      videoPath,
      options: {
        enable_object_detection: options?.enableObjectDetection ?? true,
        enable_face_detection: options?.enableFaceDetection ?? true,
        enable_emotion_analysis: options?.enableEmotionAnalysis ?? true,
        enable_composition_analysis: options?.enableCompositionAnalysis ?? true,
        enable_audio_analysis: options?.enableAudioAnalysis ?? true,
        quality_threshold: options?.qualityThreshold ?? 50.0,
        max_moments: options?.maxMoments ?? 50,
      },
    })
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
    health: HealthCheckResult
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
