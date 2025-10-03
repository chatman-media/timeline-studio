/**
 * Media Analysis Factory
 * Фабрика для создания сервисов анализа медиа
 */

import { ContentAnalysisService } from "../services/content"
import { FFmpegAdapter } from "../services/ffmpeg"
import { VisionAdapter } from "../services/vision"
import type {
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaAnalysisFactory,
} from "../types/interfaces"

export class MediaAnalysisFactoryImpl implements MediaAnalysisFactory {
  private ffmpegService: IFFmpegAnalysisService
  private visionService: IVisionService
  private contentService: IContentAnalysisService | null = null

  constructor(ffmpegService: IFFmpegAnalysisService, visionService: IVisionService) {
    this.ffmpegService = ffmpegService
    this.visionService = visionService
  }

  createFFmpegService(): IFFmpegAnalysisService {
    return this.ffmpegService
  }

  createVisionService(): IVisionService {
    return this.visionService
  }

  createContentAnalysisService(): IContentAnalysisService {
    if (!this.contentService) {
      this.contentService = new ContentAnalysisService(this.ffmpegService, this.visionService)
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

export function createMediaAnalysisFactory(
  ffmpegService?: IFFmpegAnalysisService,
  visionService?: IVisionService,
): MediaAnalysisFactory {
  if (!factoryInstance) {
    if (ffmpegService && visionService) {
      factoryInstance = new MediaAnalysisFactoryImpl(ffmpegService, visionService)
    } else {
      // Fallback для обратной совместимости
      const ffmpegService = new FFmpegAdapter()
      const visionService = new VisionAdapter()
      factoryInstance = new MediaAnalysisFactoryImpl(ffmpegService, visionService)
    }
  }
  return factoryInstance
}

export function getMediaAnalysisFactory(): MediaAnalysisFactory {
  return createMediaAnalysisFactory()
}
