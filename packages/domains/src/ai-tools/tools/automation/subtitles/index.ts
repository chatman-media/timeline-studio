/**
 * AI инструменты для работы с субтитрами с использованием BaseAITool
 * Функции для генерации, редактирования и управления субтитрами
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../../base"
import type { AIToolMetadata, IAITool } from "../../../types"
import {
  createProjectSubtitlesFromSegments,
  type ProjectSubtitle,
  type ProjectSubtitleSegmentInput,
} from "@timeline-studio/core/services"

// Типы для операций с субтитрами
export interface SubtitleInput {
  operation:
    | "generate_subtitles"
    | "translate_subtitles"
    | "sync_subtitles"
    | "format_subtitles"
    | "edit_subtitle_timing"
    | "merge_subtitle_files"
    | "extract_subtitles"
    | "improve_subtitle_quality"
    | "add_subtitle_styles"
    | "validate_subtitles"
  clipId?: string
  subtitles?: SubtitleItem[]
  transcription?: { segments?: TranscriptionSegmentInput[] } | TranscriptionSegmentInput[]
  language?: string
  targetLanguage?: string
  format?: "srt" | "vtt" | "ass" | "sub" | "sbv" | "dfxp"
  targetFormat?: "srt" | "vtt" | "ass" | "sub" | "sbv" | "dfxp"
  filePaths?: string[]
  timingAdjustments?: any
  styleSettings?: any
  improvementOptions?: any
  validationRules?: any
  autoSync?: boolean
  detectSpeakers?: boolean
  preserveTimestamps?: boolean
  formatStyle?: "formal" | "casual" | "technical"
  includeTimestamps?: boolean
  confidenceThreshold?: number
}

export interface SubtitleItem {
  id: string
  startTime: number // в миллисекундах
  endTime: number // в миллисекундах
  text: string
  speaker?: string // имя говорящего (для диалогов)
}

export interface TranscriptionSegmentInput {
  id?: string | number
  start?: number
  end?: number
  start_time?: number
  end_time?: number
  startTime?: number
  endTime?: number
  text?: string
  transcript?: string
  speaker?: string
  confidence?: number
  language?: string
}

export interface SubtitleResult {
  operation: string
  success: boolean
  subtitles?: SubtitleItem[]
  projectSubtitles?: ProjectSubtitle[]
  filePath?: string
  stats?: {
    totalSubtitles: number
    totalDuration: number
    averageLength: number
    languages?: string[]
  }
  validation?: {
    errors: string[]
    warnings: string[]
  }
  message: string
  recommendations: string[]
}

function resolveRealSubtitleItems(input: SubtitleInput): SubtitleItem[] {
  if (input.subtitles?.length) {
    return input.subtitles.map((subtitle, index) => normalizeSubtitleItem(subtitle, index))
  }

  const transcriptionSegments = Array.isArray(input.transcription)
    ? input.transcription
    : input.transcription?.segments

  if (transcriptionSegments?.length) {
    return transcriptionSegments.map((segment, index) => subtitleItemFromTranscriptionSegment(segment, index))
  }

  throw new Error(
    "Генерация субтитров требует реальные subtitles или transcription.segments; demo subtitles отключены",
  )
}

function normalizeSubtitleItem(subtitle: SubtitleItem, index: number): SubtitleItem {
  const text = subtitle.text.trim()
  const startTime = finiteNumber(subtitle.startTime, `subtitles.${index}.startTime`)
  const endTime = finiteNumber(subtitle.endTime, `subtitles.${index}.endTime`)

  if (!text) {
    throw new Error(`subtitles.${index}.text cannot be empty`)
  }
  if (endTime <= startTime) {
    throw new Error(`subtitles.${index}.endTime must be greater than startTime`)
  }

  return {
    ...subtitle,
    id: subtitle.id || `subtitle-${index + 1}`,
    text,
    startTime,
    endTime,
  }
}

function subtitleItemFromTranscriptionSegment(segment: TranscriptionSegmentInput, index: number): SubtitleItem {
  const startSeconds = finiteNumber(
    segment.start ?? segment.start_time ?? segment.startTime,
    `transcription.segments.${index}.start`,
  )
  const endSeconds = finiteNumber(
    segment.end ?? segment.end_time ?? segment.endTime,
    `transcription.segments.${index}.end`,
  )
  const text = String(segment.text ?? segment.transcript ?? "").trim()

  if (!text) {
    throw new Error(`transcription.segments.${index}.text cannot be empty`)
  }
  if (endSeconds <= startSeconds) {
    throw new Error(`transcription.segments.${index}.end must be greater than start`)
  }

  return {
    id: String(segment.id ?? `transcript-${index + 1}`),
    startTime: startSeconds * 1000,
    endTime: endSeconds * 1000,
    text,
    speaker: segment.speaker,
  }
}

function toProjectSubtitleSegments(subtitles: SubtitleItem[]): ProjectSubtitleSegmentInput[] {
  return subtitles.map((subtitle) => ({
    id: subtitle.id,
    text: subtitle.text,
    startTime: subtitle.startTime,
    endTime: subtitle.endTime,
    speaker: subtitle.speaker,
  }))
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`)
  }

  return value
}

/**
 * AI инструмент для работы с субтитрами с унифицированной обработкой ошибок
 */
export class SubtitleTool extends BaseAITool implements IAITool {
  metadata: AIToolMetadata = {
    name: "subtitle-automation",
    displayName: "Автоматизация субтитров",
    description: "Инструмент для автоматической генерации и обработки субтитров",
    domain: "automation",
    category: "workflow-automation",
    tags: ["subtitles", "automation", "transcription"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  constructor(logger?: AIToolLogger) {
    super(undefined, logger)
  }

  validate(input: any): boolean {
    const validOperations = [
      "generate_subtitles",
      "translate_subtitles",
      "sync_subtitles",
      "format_subtitles",
      "edit_subtitle_timing",
      "merge_subtitle_files",
      "extract_subtitles",
      "improve_subtitle_quality",
      "add_subtitle_styles",
      "validate_subtitles",
    ]
    return input && validOperations.includes(input.operation)
  }

  getSchema() {
    return {
      input: {
        operation: "string (required)",
        clipId: "string (optional)",
        subtitles: "array (optional)",
        language: "string (optional)",
        format: "string (optional)",
      },
      output: {
        operation: "string",
        success: "boolean",
        subtitles: "array (optional)",
        filePath: "string (optional)",
        recommendations: "array",
      },
    }
  }

  /**
   * Выполняет операции с субтитрами
   */
  public async execute(
    input: SubtitleInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<SubtitleResult>> {
    // Валидация входных данных
    const validation = this.validateInputDetailed(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "generate_subtitles",
        "translate_subtitles",
        "sync_subtitles",
        "format_subtitles",
        "edit_subtitle_timing",
        "merge_subtitle_files",
        "extract_subtitles",
        "improve_subtitle_quality",
        "add_subtitle_styles",
        "validate_subtitles",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "generate_subtitles":
        case "extract_subtitles":
          if (!data.clipId) {
            errors.push("Требуется clipId для генерации субтитров")
          }
          if (!data.language) {
            errors.push("Требуется указать язык")
          }
          break
        case "translate_subtitles":
          if (!data.subtitles || data.subtitles.length === 0) {
            errors.push("Требуются субтитры для перевода")
          }
          if (!data.targetLanguage) {
            errors.push("Требуется указать целевой язык")
          }
          break
        case "sync_subtitles":
          if (!data.clipId || !data.subtitles) {
            errors.push("Требуется clipId и субтитры для синхронизации")
          }
          break
        case "format_subtitles":
          if (!data.subtitles || !data.targetFormat) {
            errors.push("Требуются субтитры и целевой формат")
          }
          break
        case "merge_subtitle_files":
          if (!data.filePaths || data.filePaths.length < 2) {
            errors.push("Требуется минимум 2 файла для объединения")
          }
          break
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
        message: "Ошибка валидации входных данных для субтитров",
        executionTime: 0,
        toolName: this.metadata.name,
        executionId: this.generateExecutionId(),
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем операцию с субтитрами", {
          operation,
          clipId: input.clipId,
          language: input.language,
        })

        let result: SubtitleResult
        const recommendations: string[] = []

        switch (operation) {
          case "generate_subtitles":
            result = await this.generateSubtitles(input)
            recommendations.push("Проверьте сгенерированные субтитры на точность")
            break

          case "translate_subtitles":
            result = await this.translateSubtitles(input)
            recommendations.push("Проверьте качество перевода")
            break

          case "sync_subtitles":
            result = await this.syncSubtitles(input)
            recommendations.push("Проверьте синхронизацию с видео")
            break

          case "format_subtitles":
            result = await this.formatSubtitles(input)
            break

          case "edit_subtitle_timing":
            result = await this.editSubtitleTiming(input)
            recommendations.push("Проверьте изменения тайминга в плеере")
            break

          case "merge_subtitle_files":
            result = await this.mergeSubtitleFiles(input)
            recommendations.push("Проверьте порядок объединенных субтитров")
            break

          case "extract_subtitles":
            result = await this.extractSubtitles(input)
            break

          case "improve_subtitle_quality":
            result = await this.improveSubtitleQuality(input)
            recommendations.push("Сравните с оригинальной версией")
            break

          case "add_subtitle_styles":
            result = await this.addSubtitleStyles(input)
            recommendations.push("Проверьте отображение стилей в плеере")
            break

          case "validate_subtitles":
            result = await this.validateSubtitles(input)
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        result.recommendations = [...result.recommendations, ...recommendations]

        this.logger?.info("Операция с субтитрами завершена", {
          operation,
          success: result.success,
          totalSubtitles: result.stats?.totalSubtitles,
        })

        return result
      },
      input,
      {
        timeout: options.timeout || 60000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          clipId: input.clipId,
          language: input.language,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Генерация субтитров
   */
  private async generateSubtitles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Генерируем субтитры", {
      clipId: input.clipId,
      language: input.language,
    })

    const subtitles = resolveRealSubtitleItems(input)
    const projectSubtitles = createProjectSubtitlesFromSegments(toProjectSubtitleSegments(subtitles), {
      timeUnit: "milliseconds",
    })
    const totalDuration = subtitles.reduce((duration, subtitle) => Math.max(duration, subtitle.endTime), 0)

    return {
      operation: "generate_subtitles",
      success: true,
      subtitles,
      projectSubtitles,
      stats: {
        totalSubtitles: subtitles.length,
        totalDuration,
        averageLength: subtitles.length > 0 ? totalDuration / subtitles.length : 0,
        languages: [input.language || "ru"],
      },
      message: "Субтитры подготовлены из реальных сегментов транскрипции",
      recommendations: [],
    }
  }

  /**
   * Перевод субтитров
   */
  private async translateSubtitles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Переводим субтитры", {
      fromLanguage: input.language,
      toLanguage: input.targetLanguage,
      count: input.subtitles?.length,
    })

    // Заглушка для перевода
    const translatedSubtitles = input.subtitles?.map((sub) => ({
      ...sub,
      text: `[Переведено на ${input.targetLanguage}] ${sub.text}`,
    }))

    return {
      operation: "translate_subtitles",
      success: true,
      subtitles: translatedSubtitles,
      stats: {
        totalSubtitles: translatedSubtitles?.length || 0,
        totalDuration: 0,
        averageLength: 0,
        languages: [input.language || "ru", input.targetLanguage || "en"],
      },
      message: `Субтитры переведены на ${input.targetLanguage}`,
      recommendations: [],
    }
  }

  /**
   * Синхронизация субтитров
   */
  private async syncSubtitles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Синхронизируем субтитры с видео", {
      clipId: input.clipId,
      subtitleCount: input.subtitles?.length,
    })

    // Заглушка для синхронизации
    const syncedSubtitles = input.subtitles?.map((sub, index) => ({
      ...sub,
      startTime: index * 3000,
      endTime: (index + 1) * 3000 - 100,
    }))

    return {
      operation: "sync_subtitles",
      success: true,
      subtitles: syncedSubtitles,
      message: "Субтитры синхронизированы с видео",
      recommendations: [],
    }
  }

  /**
   * Форматирование субтитров
   */
  private async formatSubtitles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Форматируем субтитры", {
      fromFormat: input.format,
      toFormat: input.targetFormat,
    })

    // Заглушка для форматирования
    const formattedPath = `/tmp/subtitles.${input.targetFormat}`

    return {
      operation: "format_subtitles",
      success: true,
      filePath: formattedPath,
      message: `Субтитры конвертированы в формат ${input.targetFormat}`,
      recommendations: [],
    }
  }

  /**
   * Редактирование тайминга субтитров
   */
  private async editSubtitleTiming(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Редактируем тайминг субтитров")

    // Заглушка для редактирования
    const adjustedSubtitles = input.subtitles?.map((sub) => ({
      ...sub,
      startTime: sub.startTime + (input.timingAdjustments?.offset || 0),
      endTime: sub.endTime + (input.timingAdjustments?.offset || 0),
    }))

    return {
      operation: "edit_subtitle_timing",
      success: true,
      subtitles: adjustedSubtitles,
      message: "Тайминг субтитров отредактирован",
      recommendations: [],
    }
  }

  /**
   * Объединение файлов субтитров
   */
  private async mergeSubtitleFiles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Объединяем файлы субтитров", {
      fileCount: input.filePaths?.length,
    })

    // Заглушка для объединения
    const mergedSubtitles: SubtitleItem[] = [
      {
        id: "merged-1",
        startTime: 0,
        endTime: 3000,
        text: "Объединенный субтитр из первого файла",
      },
      {
        id: "merged-2",
        startTime: 3000,
        endTime: 6000,
        text: "Объединенный субтитр из второго файла",
      },
    ]

    return {
      operation: "merge_subtitle_files",
      success: true,
      subtitles: mergedSubtitles,
      stats: {
        totalSubtitles: mergedSubtitles.length,
        totalDuration: 6000,
        averageLength: 3000,
      },
      message: `Объединено ${input.filePaths?.length} файлов субтитров`,
      recommendations: [],
    }
  }

  /**
   * Извлечение субтитров
   */
  private async extractSubtitles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Извлекаем субтитры из видео", {
      clipId: input.clipId,
    })

    throw new Error("Извлечение субтитров требует реального backend/transcription provider; demo fallback отключен")
  }

  /**
   * Улучшение качества субтитров
   */
  private async improveSubtitleQuality(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Улучшаем качество субтитров")

    // Заглушка для улучшения
    const improvedSubtitles = input.subtitles?.map((sub) => ({
      ...sub,
      text: this.improveText(sub.text),
    }))

    return {
      operation: "improve_subtitle_quality",
      success: true,
      subtitles: improvedSubtitles,
      message: "Качество субтитров улучшено",
      recommendations: [],
    }
  }

  /**
   * Добавление стилей субтитров
   */
  private async addSubtitleStyles(_input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Добавляем стили к субтитрам")

    // Заглушка для стилей
    return {
      operation: "add_subtitle_styles",
      success: true,
      filePath: "/tmp/styled_subtitles.ass",
      message: "Стили добавлены к субтитрам",
      recommendations: [],
    }
  }

  /**
   * Валидация субтитров
   */
  private async validateSubtitles(input: SubtitleInput): Promise<SubtitleResult> {
    this.logger?.info("Валидируем субтитры")

    // Заглушка для валидации
    const validation = {
      errors: [] as string[],
      warnings: [] as string[],
    }

    input.subtitles?.forEach((sub, index) => {
      if (sub.endTime <= sub.startTime) {
        validation.errors.push(`Субтитр ${index + 1}: конечное время меньше начального`)
      }
      if (sub.text.length > 100) {
        validation.warnings.push(`Субтитр ${index + 1}: слишком длинный текст`)
      }
    })

    return {
      operation: "validate_subtitles",
      success: validation.errors.length === 0,
      validation,
      message:
        validation.errors.length === 0 ? "Валидация прошла успешно" : `Обнаружено ошибок: ${validation.errors.length}`,
      recommendations: [],
    }
  }

  /**
   * Улучшение текста субтитра
   */
  private improveText(text: string): string {
    // Простое улучшение для демонстрации
    return text
      .replace(/\s+/g, " ") // Убираем лишние пробелы
      .replace(/([.!?])\s*([a-zа-я])/g, (_match, p1, p2) => `${p1} ${p2.toUpperCase()}`) // Заглавные после точек
      .trim()
  }
}

export const subtitleTools = [new SubtitleTool()]

export const SUBTITLE_TOOLS_COUNT = subtitleTools.length
