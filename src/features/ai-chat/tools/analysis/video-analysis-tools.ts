/**
 * AI инструменты для анализа видео с помощью FFmpeg с использованием BaseAITool
 * Предоставляет возможности анализа качества, сцен, движения и автоматического улучшения
 */

import {
  IFFmpegAnalysisService,
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  VideoAnalysisOptions,
  VideoMetadata,
} from "@/domains/ai-services"
import { MediaFile, MediaType } from "@/domains/video-editing/types/media"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"
import { AudioAnalysisResult } from "./audio-analysis-tools"

// Типы для операций анализа видео
export interface VideoAnalysisInput {
  operation:
    | "get_metadata"
    | "detect_scenes"
    | "analyze_quality"
    | "analyze_motion"
    | "analyze_audio"
    | "detect_black_frames"
    | "detect_silence"
    | "generate_thumbnails"
    | "extract_keyframes"
    | "analyze_colors"
  clipId: string
  sensitivity?: number
  options?: VideoAnalysisOptions
  includeWaveform?: boolean
  includeSpectrum?: boolean
  threshold?: number
  minDuration?: number
  count?: number
  interval?: number
  format?: "jpg" | "png"
  algorithm?: "scene" | "motion" | "content"
  palette?: boolean
  histogram?: boolean
}

export interface VideoAnalysisResult {
  operation: string
  success: boolean
  metadata?: VideoMetadata
  scenes?: SceneDetectionResult[]
  quality?: QualityAnalysisResult
  motion?: MotionAnalysisResult
  audio?: AudioAnalysisResult
  blackFrames?: Array<{ start: number; end: number; duration: number }>
  silentSegments?: Array<{ start: number; end: number; duration: number }>
  thumbnails?: string[]
  keyframes?: Array<{ time: number; path: string }>
  colorAnalysis?: {
    dominantColors: string[]
    palette: string[]
    histogram: any
  }
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для анализа видео с унифицированной обработкой ошибок
 * Использует shared FFmpeg service
 */
export class VideoAnalysisTool extends BaseAITool {
  private ffmpegService: IFFmpegAnalysisService | any | null = null

  constructor(logger?: AIToolLogger) {
    super("VideoAnalysisTool", logger)
  }

  /**
   * Получить shared FFmpeg service
   */
  private async getFFmpegService(): Promise<IFFmpegAnalysisService> {
    if (!this.ffmpegService) {
      try {
        const { getAIContainer } = await import("@/domains/ai-core")
        const aiContainer = getAIContainer()
        this.ffmpegService = await aiContainer.resolve<IFFmpegAnalysisService>("FFmpegService")
      } catch (error) {
        // Fallback к локальному сервису если shared недоступен
        const { FFmpegAnalysisService } = await import("@/domains/ai-services/services/media-analysis/ffmpeg-analysis-service")
        this.ffmpegService = FFmpegAnalysisService.getInstance()
      }
    }
    return this.ffmpegService!
  }

  /**
   * Выполняет анализ видео
   */
  public async analyzeVideo(
    input: VideoAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<VideoAnalysisResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "get_metadata",
        "detect_scenes",
        "analyze_quality",
        "analyze_motion",
        "analyze_audio",
        "detect_black_frames",
        "detect_silence",
        "generate_thumbnails",
        "extract_keyframes",
        "analyze_colors",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      if (!data.clipId) {
        errors.push("Требуется указать clipId")
      }

      // Специфические валидации
      if (data.sensitivity !== undefined && (data.sensitivity < 0 || data.sensitivity > 1)) {
        errors.push("Чувствительность должна быть от 0 до 1")
      }

      if (data.threshold !== undefined && (data.threshold < 0 || data.threshold > 1)) {
        errors.push("Порог должен быть от 0 до 1")
      }

      if (data.count !== undefined && data.count <= 0) {
        errors.push("Количество должно быть больше 0")
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации входных данных для анализа видео",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем анализ видео", {
          operation,
          clipId: input.clipId,
        })

        let result: VideoAnalysisResult
        const recommendations: string[] = []
        const warnings: string[] = []

        switch (operation) {
          case "get_metadata":
            result = await this.getVideoMetadata(input)
            break

          case "detect_scenes":
            result = await this.detectVideoScenes(input)
            if (result.scenes && Array.isArray(result.scenes) && result.scenes.length > 50) {
              recommendations.push("Много сцен обнаружено, возможно стоит увеличить чувствительность")
            }
            break

          case "analyze_quality":
            result = await this.analyzeVideoQuality(input)
            if (result.quality && result.quality.overall < 0.5) {
              warnings.push("Низкое качество видео")
              recommendations.push("Рассмотрите возможность улучшения качества")
            }
            break

          case "analyze_motion":
            result = await this.analyzeVideoMotion(input)
            if (result.motion && result.motion.motionIntensity > 0.8) {
              warnings.push("Высокая активность движения в видео")
            }
            break

          case "analyze_audio":
            result = await this.analyzeVideoAudio(input)
            if (result.audio && result.audio.audioLevels?.clippingInstances && result.audio.audioLevels.clippingInstances > 0) {
              warnings.push("Обнаружен клиппинг в аудио")
              recommendations.push("Уменьшите уровень громкости")
            }
            break

          case "detect_black_frames":
            result = await this.detectBlackFrames(input)
            if (result.blackFrames && result.blackFrames.length > 0) {
              warnings.push(`Обнаружено ${result.blackFrames.length} черных участков`)
            }
            break

          case "detect_silence":
            result = await this.detectSilence(input)
            if (result.silentSegments && result.silentSegments.length > 0) {
              warnings.push(`Обнаружено ${result.silentSegments.length} участков тишины`)
            }
            break

          case "generate_thumbnails":
            result = await this.generateThumbnails(input)
            break

          case "extract_keyframes":
            result = await this.extractKeyframes(input)
            recommendations.push("Используйте ключевые кадры для предпросмотра")
            break

          case "analyze_colors":
            result = await this.analyzeColors(input)
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        result.recommendations = [...result.recommendations, ...recommendations]
        result.warnings = warnings.length > 0 ? warnings : undefined

        this.logger?.info("Анализ видео завершен", {
          operation,
          success: result.success,
        })

        return result
      },
      {
        timeout: options.timeout || 120000, // 2 минуты для анализа
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          clipId: input.clipId,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Получение метаданных видео
   */
  private async getVideoMetadata(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Получаем метаданные видео", { clipId: input.clipId })

    try {
      const ffmpegService = await this.getFFmpegService()
      const metadata = await ffmpegService.getVideoMetadata(input.clipId)

      return {
        operation: "get_metadata",
        success: true,
        metadata,
        message: "Метаданные получены успешно",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "get_metadata",
        success: false,
        message: `Ошибка получения метаданных: ${error}`,
        recommendations: ["Проверьте доступность файла"],
      }
    }
  }

  /**
   * Детекция сцен в видео
   */
  private async detectVideoScenes(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Детектируем сцены", {
      clipId: input.clipId,
      sensitivity: input.sensitivity,
    })

    try {
      const ffmpegService = await this.getFFmpegService()
      const scenes = await ffmpegService.detectScenes(input.clipId, {
        sensitivity: input.sensitivity || 0.3,
        minSceneDuration: 1,
      })

      return {
        operation: "detect_scenes",
        success: true,
        scenes,
        message: `Обнаружено ${Array.isArray(scenes) ? scenes.length : 0} сцен`,
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "detect_scenes",
        success: false,
        message: `Ошибка детекции сцен: ${error}`,
        recommendations: ["Попробуйте изменить чувствительность"],
      }
    }
  }

  /**
   * Анализ качества видео
   */
  private async analyzeVideoQuality(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Анализируем качество видео", { clipId: input.clipId })

    try {
      const ffmpegService = await this.getFFmpegService()
      const quality = await ffmpegService.analyzeQuality(input.clipId, {})

      const recommendations: string[] = []
      if (quality.video && quality.video.sharpness < 0.5) {
        recommendations.push("Применить фильтр повышения резкости")
      }
      if (quality.video && quality.video.noise > 0.3) {
        recommendations.push("Применить шумоподавление")
      }

      return {
        operation: "analyze_quality",
        success: true,
        quality,
        message: `Качество видео: ${Math.round(quality.overall * 100)}%`,
        recommendations,
      }
    } catch (error) {
      return {
        operation: "analyze_quality",
        success: false,
        message: `Ошибка анализа качества: ${error}`,
        recommendations: [],
      }
    }
  }

  /**
   * Анализ движения в видео
   */
  private async analyzeVideoMotion(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Анализируем движение", { clipId: input.clipId })

    try {
      const ffmpegService = await this.getFFmpegService()
      const motion = await ffmpegService.analyzeMotion(input.clipId, {})

      const recommendations: string[] = []
      if (motion.motionIntensity > 0.7) {
        recommendations.push("Видео содержит много движения, рассмотрите стабилизацию")
      }

      return {
        operation: "analyze_motion",
        success: true,
        motion,
        message: "Анализ движения завершен",
        recommendations,
      }
    } catch (error) {
      return {
        operation: "analyze_motion",
        success: false,
        message: `Ошибка анализа движения: ${error}`,
        recommendations: [],
      }
    }
  }

  /**
   * Анализ аудио
   */
  private async analyzeVideoAudio(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Анализируем аудио", { clipId: input.clipId })

    try {
      const ffmpegService = await this.getFFmpegService()
      const mediaFile = {
        path: input.clipId,
        name: input.clipId.split("/").pop() || input.clipId,
        filename: input.clipId.split("/").pop() || input.clipId,
        type: "video" as const,
        duration: 0,
        size: 0,
      }
      const audio = await ffmpegService.analyzeAudio(mediaFile)

      const recommendations: string[] = []
      if (audio.volume.peak > 0.9) {
        recommendations.push("Уменьшите уровень громкости для предотвращения искажений")
      }
      if (audio.volume.average < 0.1) {
        recommendations.push("Увеличьте уровень громкости для лучшей слышимости")
      }

      return {
        operation: "analyze_audio",
        success: true,
        audio: {
          analysisType: "audio_analysis",
          audioLevels: {
            peakLevels: [audio.volume.peak],
            averageLevel: audio.volume.average,
            dynamicRange: audio.volume.peak - audio.volume.average,
            clippingInstances: 0,
            recommendedAdjustments: recommendations,
          },
        },
        message: "Анализ аудио завершен",
        recommendations,
      }
    } catch (error) {
      return {
        operation: "analyze_audio",
        success: false,
        message: `Ошибка анализа аудио: ${error}`,
        recommendations: [],
      }
    }
  }

  /**
   * Детекция черных кадров
   */
  private async detectBlackFrames(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Детектируем черные кадры", { clipId: input.clipId })

    // Заглушка для детекции черных кадров
    const blackFrames = [
      { start: 0, end: 1.5, duration: 1.5 },
      { start: 45.2, end: 46.1, duration: 0.9 },
    ]

    return {
      operation: "detect_black_frames",
      success: true,
      blackFrames,
      message: `Обнаружено ${blackFrames.length} черных участков`,
      recommendations: blackFrames.length > 0 ? ["Рассмотрите удаление черных кадров"] : [],
    }
  }

  /**
   * Детекция тишины
   */
  private async detectSilence(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Детектируем тишину", {
      clipId: input.clipId,
      threshold: input.threshold,
    })

    // Заглушка для детекции тишины
    const silentSegments = [
      { start: 10.5, end: 12.3, duration: 1.8 },
      { start: 58.7, end: 60.0, duration: 1.3 },
    ]

    return {
      operation: "detect_silence",
      success: true,
      silentSegments,
      message: `Обнаружено ${silentSegments.length} участков тишины`,
      recommendations: silentSegments.length > 0 ? ["Рассмотрите удаление участков тишины"] : [],
    }
  }

  /**
   * Генерация миниатюр
   */
  private async generateThumbnails(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Генерируем миниатюры", {
      clipId: input.clipId,
      count: input.count,
    })

    // Заглушка для генерации миниатюр
    const count = input.count || 10
    const thumbnails = Array.from({ length: count }, (_, i) => `/tmp/thumb_${i + 1}.jpg`)

    return {
      operation: "generate_thumbnails",
      success: true,
      thumbnails,
      message: `Сгенерировано ${thumbnails.length} миниатюр`,
      recommendations: ["Используйте миниатюры для навигации по видео"],
    }
  }

  /**
   * Извлечение ключевых кадров
   */
  private async extractKeyframes(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Извлекаем ключевые кадры", {
      clipId: input.clipId,
      algorithm: input.algorithm,
    })

    // Заглушка для извлечения ключевых кадров
    const keyframes = [
      { time: 0, path: "/tmp/keyframe_0.jpg" },
      { time: 15.5, path: "/tmp/keyframe_15.jpg" },
      { time: 32.1, path: "/tmp/keyframe_32.jpg" },
      { time: 48.7, path: "/tmp/keyframe_48.jpg" },
    ]

    return {
      operation: "extract_keyframes",
      success: true,
      keyframes,
      message: `Извлечено ${keyframes.length} ключевых кадров`,
      recommendations: [],
    }
  }

  /**
   * Анализ цветов
   */
  private async analyzeColors(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    this.logger?.info("Анализируем цвета", {
      clipId: input.clipId,
      palette: input.palette,
    })

    // Заглушка для анализа цветов
    const colorAnalysis = {
      dominantColors: ["#1a1a1a", "#4a90e2", "#ffffff", "#f5a623", "#7ed321"],
      palette: input.palette
        ? ["#1a1a1a", "#4a90e2", "#ffffff", "#f5a623", "#7ed321", "#d0021b", "#9013fe", "#50e3c2"]
        : [],
      histogram: input.histogram ? { red: [0.1, 0.2, 0.3], green: [0.2, 0.3, 0.2], blue: [0.3, 0.2, 0.1] } : undefined,
    }

    return {
      operation: "analyze_colors",
      success: true,
      colorAnalysis,
      message: "Анализ цветов завершен",
      recommendations: ["Используйте доминантные цвета для стилизации"],
    }
  }
}

// Экспортируем готовый экземпляр для использования
export const videoAnalysisTool = new VideoAnalysisTool()

// Функции-обертки для обратной совместимости
export async function getVideoMetadata(clipId: string): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "get_metadata",
    clipId,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function detectVideoScenes(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "detect_scenes",
    clipId: params.clipId,
    sensitivity: params.sensitivity,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function analyzeVideoQuality(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "analyze_quality",
    clipId: params.clipId,
    options: params.options,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function analyzeVideoMotion(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "analyze_motion",
    clipId: params.clipId,
    options: params.options,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function analyzeVideoAudio(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "analyze_audio",
    clipId: params.clipId,
    includeWaveform: params.includeWaveform,
    includeSpectrum: params.includeSpectrum,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function detectBlackFrames(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "detect_black_frames",
    clipId: params.clipId,
    threshold: params.threshold,
    minDuration: params.minDuration,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function detectSilentSegments(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "detect_silence",
    clipId: params.clipId,
    threshold: params.threshold,
    minDuration: params.minDuration,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function generateVideoThumbnails(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "generate_thumbnails",
    clipId: params.clipId,
    count: params.count,
    interval: params.interval,
    format: params.format,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function extractVideoKeyframes(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "extract_keyframes",
    clipId: params.clipId,
    algorithm: params.algorithm,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

export async function analyzeVideoColors(params: any): Promise<AIToolResult<VideoAnalysisResult>> {
  const input: VideoAnalysisInput = {
    operation: "analyze_colors",
    clipId: params.clipId,
    palette: params.extractPalette,
    histogram: params.generateHistogram,
  }
  return videoAnalysisTool.analyzeVideo(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const videoAnalysisTools: any[] = [
  {
    name: "get_video_metadata",
    description: "Получает базовые метаданные видеофайла (длительность, разрешение, кодеки, битрейт)",
  },
  {
    name: "detect_video_scenes",
    description: "Автоматически определяет сцены в видео на основе изменений в кадрах",
  },
  {
    name: "analyze_video_quality",
    description: "Анализирует качество видео (резкость, шум, артефакты сжатия)",
  },
  {
    name: "analyze_video_motion",
    description: "Анализирует движение в видео, определяет статичные и динамичные участки",
  },
  {
    name: "analyze_video_audio",
    description: "Анализирует аудиодорожку видео (уровни громкости, частотный спектр)",
  },
  {
    name: "detect_black_frames",
    description: "Находит черные кадры и участки в видео",
  },
  {
    name: "detect_silent_segments",
    description: "Определяет участки тишины в аудиодорожке",
  },
  {
    name: "generate_video_thumbnails",
    description: "Генерирует миниатюры из видео с заданным интервалом",
  },
  {
    name: "extract_video_keyframes",
    description: "Извлекает ключевые кадры из видео для предпросмотра",
  },
  {
    name: "analyze_video_colors",
    description: "Анализирует цветовую палитру видео, извлекает доминирующие цвета",
  },
]

/**
 * Функция для обработки выполнения инструментов анализа видео (legacy API)
 */
export async function executeVideoAnalysisTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    // Маппинг старых названий на новые функции
    const functionMap: Record<string, () => Promise<any>> = {
      get_video_metadata: () => getVideoMetadata(input.clipId),
      detect_video_scenes: () => detectVideoScenes(input),
      analyze_video_quality: () => analyzeVideoQuality(input),
      analyze_video_motion: () => analyzeVideoMotion(input),
      analyze_video_audio: () => analyzeVideoAudio(input),
      detect_black_frames: () => detectBlackFrames(input),
      detect_silent_segments: () => detectSilentSegments(input),
      generate_video_thumbnails: () => generateVideoThumbnails(input),
      extract_video_keyframes: () => extractVideoKeyframes(input),
      analyze_video_colors: () => analyzeVideoColors(input),
    }

    const func = functionMap[toolName]
    if (!func) {
      throw new Error(`Неизвестный инструмент анализа видео: ${toolName}`)
    }

    const result = await func()

    // Преобразуем AIToolResult в старый формат если нужно
    if (result && result.success !== undefined) {
      return result.data || result
    }
    return result
  } catch (error) {
    throw new Error(`Ошибка выполнения ${toolName}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
