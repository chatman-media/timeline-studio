/**
 * Legacy адаптеры для обратной совместимости
 * Предоставляют старые интерфейсы поверх shared сервисов
 * @deprecated Используйте shared сервисы напрямую
 */

import type { IFFmpegAnalysisService } from "@/shared/services/ai"
import { getAIContainer } from "@/shared/services/ai"

/**
 * Legacy FFmpeg сервис адаптер
 * @deprecated Используйте getAIContainer().resolve("FFmpegService") вместо этого
 */
export class LegacyFFmpegAnalysisService {
  private static instance: LegacyFFmpegAnalysisService
  private sharedService: IFFmpegAnalysisService | null = null

  private constructor() {}

  public static getInstance(): LegacyFFmpegAnalysisService {
    if (!LegacyFFmpegAnalysisService.instance) {
      LegacyFFmpegAnalysisService.instance = new LegacyFFmpegAnalysisService()
    }
    return LegacyFFmpegAnalysisService.instance
  }

  private async getSharedService(): Promise<IFFmpegAnalysisService> {
    if (!this.sharedService) {
      // Используем прямой импорт для избежания циклической зависимости
      const { FFmpegAdapter } = await import("@/shared/services/ai/analysis/ffmpeg")
      this.sharedService = new FFmpegAdapter()
    }
    return this.sharedService
  }

  // Все методы проксируются к shared сервису
  async getVideoMetadata(path: string) {
    const service = await this.getSharedService()
    return service.getVideoMetadata(path)
  }

  async detectScenes(path: string, options?: any) {
    const service = await this.getSharedService()
    return service.detectScenes(path, options)
  }

  async analyzeQuality(path: string, options?: any) {
    const service = await this.getSharedService()
    return service.analyzeQuality(path, options)
  }

  async analyzeMotion(path: string, options?: any) {
    const service = await this.getSharedService()
    return service.analyzeMotion(path, options)
  }

  async analyzeAudio(file: { path: string; filename?: string; [key: string]: any }, _options?: any) {
    const service = await this.getSharedService()
    const mediaFile = {
      ...file,
      id: file.id || Date.now().toString(),
      path: file.path,
      filename: file.filename || file.path.split("/").pop() || "unknown",
      size: file.size || 0,
      type: "audio" as const,
    }
    return service.analyzeAudio(mediaFile)
  }
}

// Экспорт для обратной совместимости
export const LegacyFFmpeg = LegacyFFmpegAnalysisService
