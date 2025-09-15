/**
 * AI инструмент для анализа медиа в плеере с BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { MediaAnalysisParams, PlayerToolResult } from "./types"
import { getCurrentMedia, parseFps } from "./utils/helpers"

// Типы для операций анализа медиа
export interface MediaAnalysisInput {
  operation: "analyze_current_media"
  includeMetadata?: boolean
  includeQualityMetrics?: boolean
  includeFormatInfo?: boolean
  includeAudioInfo?: boolean
  includeVideoInfo?: boolean
}

export interface MediaAnalysisResult {
  operation: string
  success: boolean
  analysis?: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для анализа медиа с унифицированной обработкой ошибок
 */
export class MediaAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("MediaAnalysisTool", logger)
  }

  /**
   * Выполняет анализ текущего медиа
   */
  public async processMediaAnalysis(
    input: MediaAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<MediaAnalysisResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        if (data.operation !== "analyze_current_media") {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      const analysisResult = await this.analyzeCurrentMedia({
        includeMetadata: input.includeMetadata ?? true,
        includeQualityMetrics: input.includeQualityMetrics ?? false,
        includeFormatInfo: input.includeFormatInfo ?? true,
        includeAudioInfo: input.includeAudioInfo ?? true,
        includeVideoInfo: input.includeVideoInfo ?? true,
      })

      if (!analysisResult.success) {
        throw new Error(analysisResult.message)
      }

      const result: MediaAnalysisResult = {
        operation: input.operation,
        success: true,
        analysis: analysisResult.data?.analysis,
        message: analysisResult.message,
        recommendations: this.generateRecommendations(analysisResult.data?.analysis),
        warnings: analysisResult.warnings,
      }

      return result
    }, options)
  }

  private async analyzeCurrentMedia(params: MediaAnalysisParams): Promise<PlayerToolResult> {
    try {
      const currentMedia = getCurrentMedia()

      if (!currentMedia) {
        return {
          success: false,
          message: "Нет загруженного медиа для анализа",
          warnings: ["Загрузите медиа файл в плеер для анализа"],
        }
      }

      const analysis: any = {
        basic: {
          name: currentMedia.name,
          path: currentMedia.path,
          size: currentMedia.size,
          type: currentMedia.type || "unknown",
          duration: currentMedia.duration || 0,
          isPlaying: currentMedia.playbackPosition !== undefined,
        },
      }

      if (params.includeMetadata && currentMedia.metadata) {
        analysis.metadata = {
          createdAt: currentMedia.createdAt,
          modifiedAt: currentMedia.modifiedAt,
          title: currentMedia.metadata.title,
          description: currentMedia.metadata.description,
          tags: currentMedia.metadata.tags,
        }
      }

      if (params.includeVideoInfo && currentMedia.isVideo) {
        analysis.video = {
          width: currentMedia.width,
          height: currentMedia.height,
          aspectRatio:
            currentMedia.width && currentMedia.height
              ? (currentMedia.width / currentMedia.height).toFixed(2)
              : "unknown",
          fps: currentMedia.fps ? parseFps(currentMedia.fps.toString()) : 0,
          codec: currentMedia.probeData?.streams?.[0]?.codec_name || "unknown",
          bitrate: currentMedia.probeData?.streams?.[0]?.bit_rate || 0,
        }
      }

      if (params.includeAudioInfo && currentMedia.hasAudio) {
        const audioStream = currentMedia.probeData?.streams?.find((s: any) => s.codec_type === "audio")
        analysis.audio = {
          channels: audioStream?.channels || 0,
          sampleRate: audioStream?.sample_rate || 0,
          codec: audioStream?.codec_name || "unknown",
          bitrate: audioStream?.bit_rate || 0,
        }
      }

      if (params.includeFormatInfo && currentMedia.probeData?.format) {
        analysis.format = {
          formatName: currentMedia.probeData.format.format_name,
          formatLongName: currentMedia.probeData.format.format_long_name,
          startTime: currentMedia.probeData.format.start_time,
          bitRate: currentMedia.probeData.format.bit_rate,
        }
      }

      if (params.includeQualityMetrics) {
        analysis.quality = {
          resolution:
            currentMedia.width && currentMedia.height ? `${currentMedia.width}x${currentMedia.height}` : "unknown",
          estimatedQuality: this.calculateEstimatedQuality(currentMedia),
          fileSize: currentMedia.size ? `${(currentMedia.size / 1024 / 1024).toFixed(2)} MB` : "unknown",
        }
      }

      return {
        success: true,
        message: `Анализ медиа "${currentMedia.name}" завершен`,
        data: { analysis },
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка анализа медиа: ${String(error)}`,
        errors: [String(error)],
      }
    }
  }

  private calculateEstimatedQuality(media: any): string {
    if (!media.width || !media.height) return "unknown"

    const pixels = media.width * media.height

    if (pixels >= 3840 * 2160) return "4K"
    if (pixels >= 2560 * 1440) return "2K"
    if (pixels >= 1920 * 1080) return "HD"
    if (pixels >= 1280 * 720) return "720p"
    if (pixels >= 854 * 480) return "480p"

    return "SD"
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = []

    if (!analysis) {
      return ["Загрузите медиа файл для получения рекомендаций"]
    }

    if (analysis.video) {
      const { width, height, fps } = analysis.video

      if (width && height && (width < 1280 || height < 720)) {
        recommendations.push("Рассмотрите использование видео более высокого разрешения")
      }

      if (fps && fps < 24) {
        recommendations.push("Низкая частота кадров может влиять на плавность воспроизведения")
      }

      if (fps && fps > 60) {
        recommendations.push("Высокая частота кадров - проверьте совместимость с целевой платформой")
      }
    }

    if (analysis.audio) {
      const { channels, sampleRate } = analysis.audio

      if (channels === 1) {
        recommendations.push("Моно аудио - рассмотрите использование стерео для лучшего качества")
      }

      if (sampleRate && sampleRate < 44100) {
        recommendations.push("Низкая частота дискретизации аудио может снизить качество звука")
      }
    }

    if (analysis.basic) {
      const { type, duration } = analysis.basic

      if (type === "unknown") {
        recommendations.push("Неизвестный тип файла - проверьте совместимость формата")
      }

      if (duration && duration > 3600) {
        recommendations.push("Длинное видео - рассмотрите разделение на части для лучшей производительности")
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Медиа файл имеет хорошие характеристики для редактирования")
    }

    return recommendations
  }
}

// Создаем singleton экземпляр
const mediaAnalysisTool = new MediaAnalysisTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeMediaAnalysisTool(
  operation: MediaAnalysisInput["operation"],
  params: Omit<MediaAnalysisInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<MediaAnalysisResult>> {
  return mediaAnalysisTool.processMediaAnalysis({ operation, ...params }, options)
}

/**
 * Функция для обратной совместимости
 */
export async function analyzeCurrentMedia(params: MediaAnalysisParams): Promise<PlayerToolResult> {
  const result = await mediaAnalysisTool.processMediaAnalysis({
    operation: "analyze_current_media",
    includeMetadata: params.includeMetadata,
    includeQualityMetrics: params.includeQualityMetrics,
    includeFormatInfo: params.includeFormatInfo,
    includeAudioInfo: params.includeAudioInfo,
    includeVideoInfo: params.includeVideoInfo,
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        analysis: result.data.analysis,
      },
      nextActions: ["Просмотреть детали", "Применить улучшения"],
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка анализа медиа",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const analyzeCurrentMediaTool: any = {
  name: "analyze_current_media",
  description: "Анализирует текущее медиа в плеере и его характеристики",
  input_schema: {
    type: "object",
    properties: {
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные файла",
        default: true,
      },
      includeQualityMetrics: {
        type: "boolean",
        description: "Включить метрики качества",
        default: false,
      },
      includeFormatInfo: {
        type: "boolean",
        description: "Включить информацию о формате",
        default: true,
      },
      includeAudioInfo: {
        type: "boolean",
        description: "Включить информацию об аудио",
        default: true,
      },
      includeVideoInfo: {
        type: "boolean",
        description: "Включить информацию о видео",
        default: true,
      },
    },
  },
}
