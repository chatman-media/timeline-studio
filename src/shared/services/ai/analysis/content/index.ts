/**
 * Content Analysis Service
 * Композитный сервис для полного анализа медиа контента
 */

// Экспорт content classifier
export * from "./content-classifier"

// Импорт адаптеров
import { FFmpegAdapter } from "../ffmpeg"
import type {
  ContentAnalysisOptions,
  ContentAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaFile,
  VideoMetadata,
} from "../interfaces"
import { VisionAdapter } from "../vision"

export class ContentAnalysisService implements IContentAnalysisService {
  private ffmpegService: IFFmpegAnalysisService
  private visionService: IVisionService

  constructor(ffmpegService?: IFFmpegAnalysisService, visionService?: IVisionService) {
    this.ffmpegService = ffmpegService || new FFmpegAdapter()
    this.visionService = visionService || new VisionAdapter()
  }

  async analyzeMedia(file: MediaFile, options: ContentAnalysisOptions = {}): Promise<ContentAnalysisResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Получаем базовые метаданные
      const metadata = await this.getMetadata(file)

      // Выполняем анализы параллельно в зависимости от опций
      const analysisPromises: Promise<any>[] = []

      // Scene detection
      if (options.includeSceneDetection !== false) {
        analysisPromises.push(
          this.ffmpegService
            .detectScenes(file.path, {
              sensitivity: options.analysisDepth === "deep" ? 0.2 : 0.3,
              minSceneDuration: options.analysisDepth === "quick" ? 5.0 : 2.0,
            })
            .catch((error) => {
              errors.push(`Scene detection failed: ${error.message}`)
              return null
            }),
        )
      } else {
        analysisPromises.push(Promise.resolve(null))
      }

      // Quality analysis
      if (options.includeQualityAnalysis !== false) {
        analysisPromises.push(
          this.ffmpegService
            .analyzeQuality(file.path, {
              checkVideo: true,
              checkAudio: metadata.hasAudio,
              deepAnalysis: options.analysisDepth === "deep",
            })
            .catch((error) => {
              errors.push(`Quality analysis failed: ${error.message}`)
              return null
            }),
        )
      } else {
        analysisPromises.push(Promise.resolve(null))
      }

      // Motion analysis
      if (options.includeMotionAnalysis !== false) {
        analysisPromises.push(
          this.ffmpegService
            .analyzeMotion(file.path, {
              sensitivity: options.analysisDepth === "deep" ? 0.1 : 0.3,
              stabilityCheck: true,
            })
            .catch((error) => {
              errors.push(`Motion analysis failed: ${error.message}`)
              return null
            }),
        )
      } else {
        analysisPromises.push(Promise.resolve(null))
      }

      // Silence detection (только для видео с аудио)
      if (metadata.hasAudio && options.analysisDepth !== "quick") {
        analysisPromises.push(
          this.ffmpegService
            .detectSilence(file.path, {
              threshold: -30,
              minDuration: 1.0,
            })
            .catch((error) => {
              warnings.push(`Silence detection failed: ${error.message}`)
              return null
            }),
        )
      } else {
        analysisPromises.push(Promise.resolve(null))
      }

      // Vision analysis (извлекаем ключевые кадры и анализируем их)
      if (options.includeVisionAnalysis !== false && options.analysisDepth !== "quick") {
        analysisPromises.push(
          this.performVisionAnalysis(file, options).catch((error) => {
            warnings.push(`Vision analysis failed: ${error.message}`)
            return []
          }),
        )
      } else {
        analysisPromises.push(Promise.resolve([]))
      }

      // Ждем завершения всех анализов
      const [scenes, quality, motion, silence, frames] = await Promise.all(analysisPromises)

      const processingTime = Date.now() - startTime

      const result: ContentAnalysisResult = {
        id: `analysis-${Date.now()}`,
        mediaFile: file,
        video: {
          duration: metadata.duration,
          fps: metadata.fps,
          resolution: { width: metadata.width, height: metadata.height },
          codec: metadata.codec || "unknown",
          bitrate: metadata.bitrate,
          scenes: scenes || [],
        } as any,
        audio: {
          duration: metadata.duration,
          channels: metadata.audioChannels || 2,
          sampleRate: metadata.audioSampleRate || 48000,
          bitrate: metadata.bitrate,
          codec: "unknown",
          volume: { average: 0, peak: 0, min: 0 },
          silentSegments: [],
        } as any,
        scenes: scenes || [],
        transcript: {
          text: "",
          segments: [],
        },
        summary: "Analysis completed",
        tags: [],
        sentiment: {
          positive: 0,
          neutral: 1,
          negative: 0,
        },
        metadata,
        quality,
        motion,
        processingTime,
      }

      // Логируем результат анализа
      this.logAnalysisResult(result)

      return result
    } catch (error) {
      throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private async getMetadata(file: MediaFile): Promise<VideoMetadata> {
    try {
      return await this.ffmpegService.getVideoMetadata(file.path)
    } catch (error) {
      // Возвращаем базовые метаданные если FFmpeg недоступен
      return {
        format: file.format || "unknown",
        duration: file.duration || 0,
        width: 0,
        height: 0,
        fps: 0,
        bitrate: 0,
        hasAudio: false,
      }
    }
  }

  private async performVisionAnalysis(file: MediaFile, options: ContentAnalysisOptions) {
    try {
      // Извлекаем ключевые кадры
      const keyframeCount = options.analysisDepth === "deep" ? 10 : 5
      const keyframes = await this.ffmpegService.extractKeyframes(file.path, {
        count: keyframeCount,
        outputDir: options.outputDir || "/tmp/keyframes",
      })

      // Анализируем кадры
      if (keyframes.length > 0) {
        return await this.visionService.analyzeFrames(keyframes)
      }

      return []
    } catch (error) {
      console.warn(`Vision analysis failed for ${file.path}:`, error)
      return []
    }
  }

  // Обязательные методы из интерфейса IContentAnalysisService
  async analyzeContent(file: MediaFile): Promise<ContentAnalysisResult> {
    return this.analyzeMedia(file)
  }

  async analyzeMultiple(files: MediaFile[]): Promise<ContentAnalysisResult[]> {
    return Promise.all(files.map((file) => this.analyzeContent(file)))
  }

  async generateSummary(analysis: ContentAnalysisResult): Promise<string> {
    return analysis.summary || "No summary available"
  }

  async extractKeyMoments(
    analysis: ContentAnalysisResult,
    count: number = 5,
  ): Promise<Array<{ timestamp: number; description: string; confidence: number }>> {
    const scenes = analysis.scenes || []
    return scenes.slice(0, count).map((scene) => ({
      timestamp: scene.start,
      description: scene.description || "Key moment",
      confidence: scene.confidence,
    }))
  }

  async batchAnalyzeMedia(files: MediaFile[], options?: ContentAnalysisOptions): Promise<ContentAnalysisResult[]> {
    return Promise.all(files.map((file) => this.analyzeMedia(file, options)))
  }

  private logAnalysisResult(result: ContentAnalysisResult): void {
    const stats = {
      file: result.mediaFile.filename || "unknown",
      duration: result.metadata?.duration || 0,
      scenes: result.scenes?.length || 0,
      qualityScore: result.quality?.overall || 0,
      motionIntensity: result.motion?.motionIntensity || 0,
      processingTime: result.processingTime || 0,
    }

    console.log("Content Analysis Complete:", stats)
  }
}

// Фабричная функция
export function createContentAnalysisService(): ContentAnalysisService {
  return new ContentAnalysisService()
}
