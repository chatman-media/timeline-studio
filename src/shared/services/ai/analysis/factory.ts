/**
 * Media Analysis Factory
 * Фабрика для создания сервисов анализа медиа
 */

import { ContentAnalysisService } from "./content"
import { FFmpegAdapter } from "./ffmpeg"
import type {
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaAnalysisFactory,
} from "./interfaces"
import { VisionAdapter } from "./vision"

export class MediaAnalysisFactoryImpl implements MediaAnalysisFactory {
  private ffmpegService: IFFmpegAnalysisService | null = null
  private visionService: IVisionService | null = null
  private contentService: IContentAnalysisService | null = null

  createFFmpegService(): IFFmpegAnalysisService {
    if (!this.ffmpegService) {
      this.ffmpegService = new FFmpegAdapter()
    }
    return this.ffmpegService
  }

  createVisionService(): IVisionService {
    if (!this.visionService) {
      this.visionService = new VisionAdapter()
    }
    return this.visionService
  }

  createContentAnalysisService(): IContentAnalysisService {
    if (!this.contentService) {
      // Создаем с зависимостями из фабрики
      const ffmpegService = this.createFFmpegService()
      const visionService = this.createVisionService()
      this.contentService = new ContentAnalysisService(ffmpegService, visionService)
    }
    return this.contentService
  }

  async isFFmpegAvailable(): Promise<boolean> {
    try {
      const ffmpeg = this.createFFmpegService()
      // Пытаемся выполнить простую операцию для проверки доступности
      await ffmpeg.getVideoMetadata("/dev/null")
      return true
    } catch {
      // FFmpeg недоступен или произошла ошибка
      try {
        // Альтернативная проверка через которую мы можем проверить наличие FFmpeg
        // child_process доступен только в Node.js окружении (не в браузере)
        if (typeof window === "undefined" && typeof process !== "undefined" && process.versions?.node) {
          const { exec } = require("child_process")
          return new Promise((resolve) => {
            exec("ffmpeg -version", (error: any) => {
              resolve(!error)
            })
          })
        }
        return false
      } catch {
        return false
      }
    }
  }

  async getAvailableServices(): Promise<string[]> {
    const services: string[] = []

    // Проверяем FFmpeg
    if (await this.isFFmpegAvailable()) {
      services.push("ffmpeg")
    }

    // Проверяем Vision сервисы
    try {
      const visionService = this.createVisionService()
      // Простая проверка - пытаемся создать сервис
      if (visionService) {
        services.push("vision")
      }
    } catch {
      // Vision сервис недоступен
    }

    // Content analysis доступен если есть хотя бы FFmpeg
    if (services.includes("ffmpeg")) {
      services.push("content-analysis")
    }

    return services
  }

  // Дополнительные методы для управления
  async validateServices(): Promise<{ [service: string]: boolean }> {
    const results = {
      ffmpeg: false,
      vision: false,
      contentAnalysis: false,
    }

    try {
      results.ffmpeg = await this.isFFmpegAvailable()
    } catch {
      // FFmpeg validation failed
    }

    try {
      const visionService = this.createVisionService()
      results.vision = !!visionService
    } catch {
      // Vision validation failed
    }

    results.contentAnalysis = results.ffmpeg // Content analysis требует FFmpeg

    return results
  }

  async getServiceCapabilities(): Promise<{
    ffmpeg: string[]
    vision: string[]
    contentAnalysis: string[]
  }> {
    return {
      ffmpeg: [
        "metadata",
        "scene-detection",
        "quality-analysis",
        "silence-detection",
        "motion-analysis",
        "keyframe-extraction",
        "format-conversion",
      ],
      vision: ["frame-analysis", "object-detection", "text-extraction", "composition-analysis", "color-analysis"],
      contentAnalysis: ["full-media-analysis", "batch-processing", "combined-analysis", "quality-scoring"],
    }
  }

  // Очистка ресурсов
  dispose(): void {
    this.ffmpegService = null
    this.visionService = null
    this.contentService = null
  }

  // Статистика использования
  getUsageStats(): {
    ffmpegCalls: number
    visionCalls: number
    contentCalls: number
    averageProcessingTime: number
  } {
    // TODO: Implement usage statistics tracking
    return {
      ffmpegCalls: 0,
      visionCalls: 0,
      contentCalls: 0,
      averageProcessingTime: 0,
    }
  }
}

// Singleton instance
let factoryInstance: MediaAnalysisFactoryImpl | null = null

export function createMediaAnalysisFactory(): MediaAnalysisFactory {
  if (!factoryInstance) {
    factoryInstance = new MediaAnalysisFactoryImpl()
  }
  return factoryInstance
}

export function getMediaAnalysisFactory(): MediaAnalysisFactory {
  return createMediaAnalysisFactory()
}
