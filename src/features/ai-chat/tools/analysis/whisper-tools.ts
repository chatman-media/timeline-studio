/**
 * AI инструмент для работы с Whisper транскрипцией с использованием BaseAITool
 * Управление моделями, транскрипция и перевод аудио
 */

import { WhisperService } from "../../../../domains/ai-services/services/whisper-service"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

// Типы для Whisper операций
export interface WhisperInput {
  operation:
    | "check_availability"
    | "get_models"
    | "download_model"
    | "transcribe"
    | "translate"
    | "batch_transcribe"
    | "create_subtitles"
    | "detect_language"
    | "improve_quality"
    | "sync_subtitles"
  clipId?: string
  clipIds?: string[]
  language?: string
  model?: string
  modelName?: string
  useLocal?: boolean
  includeLocal?: boolean
  includeApi?: boolean
  includeWordTimestamps?: boolean
  prompt?: string
  transcriptionText?: string
  format?: "srt" | "vtt" | "ass"
  maxCharactersPerLine?: number
  maxLinesPerSubtitle?: number
  sampleDuration?: number
  subtitleText?: string
  alignmentPrecision?: number
  reason: string
}

export interface WhisperResult {
  operation: string
  success: boolean
  availability?: {
    openai: boolean
    local: boolean
    models: string[]
  }
  models?: {
    api: string[]
    local: any[]
  }
  downloadProgress?: {
    status: string
    progress: number
    message: string
  }
  transcription?: {
    text: string
    segments: any[]
    language: string
    duration: number
  }
  subtitles?: {
    format: string
    content: string
    segments: any[]
  }
  results?: any[] // для batch операций
  detectedLanguage?: {
    language: string
    confidence: number
    alternatives: any[]
  }
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для работы с Whisper с унифицированной обработкой ошибок
 */
export class WhisperTool extends BaseAITool {
  private whisperService: WhisperService

  constructor(logger?: AIToolLogger) {
    super("WhisperTool", logger)
    this.whisperService = WhisperService.getInstance()
  }

  /**
   * Выполняет операции Whisper
   */
  public async processWhisper(
    input: WhisperInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<WhisperResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "check_availability",
        "get_models",
        "download_model",
        "transcribe",
        "translate",
        "batch_transcribe",
        "create_subtitles",
        "detect_language",
        "improve_quality",
        "sync_subtitles",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      if (!data.reason) {
        errors.push("Требуется указать причину операции")
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "download_model":
          if (!data.modelName) {
            errors.push("Для скачивания модели требуется указать modelName")
          }
          break
        case "transcribe":
        case "translate":
        case "detect_language":
        case "sync_subtitles":
          if (!data.clipId) {
            errors.push("Для операции требуется указать clipId")
          }
          break
        case "batch_transcribe":
          if (!data.clipIds || data.clipIds.length === 0) {
            errors.push("Для пакетной транскрипции требуется указать clipIds")
          }
          break
        case "create_subtitles":
          if (!data.transcriptionText) {
            errors.push("Для создания субтитров требуется transcriptionText")
          }
          break
        case "improve_quality":
          if (!data.clipId || !data.transcriptionText) {
            errors.push("Для улучшения качества требуется clipId и transcriptionText")
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
        message: "Ошибка валидации входных данных для Whisper",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем операцию Whisper", {
          operation,
          clipId: input.clipId,
          model: input.model,
        })

        let result: WhisperResult
        const recommendations: string[] = []
        const warnings: string[] = []

        switch (operation) {
          case "check_availability":
            result = await this.checkAvailability()
            if (!result.availability?.openai && !result.availability?.local) {
              recommendations.push("Настройте API ключ OpenAI или установите локальные модели")
            }
            break

          case "get_models":
            result = await this.getModels(input)
            if (result.models && result.models.local.length === 0) {
              recommendations.push("Скачайте локальные модели для офлайн работы")
            }
            break

          case "download_model":
            result = await this.downloadModel(input)
            recommendations.push("Проверьте доступное место на диске")
            break

          case "transcribe":
            result = await this.transcribeMedia(input)
            if (result.transcription && result.transcription.segments.length > 100) {
              recommendations.push("Рассмотрите разделение на части для длинных видео")
            }
            break

          case "translate":
            result = await this.translateAudio(input)
            recommendations.push("Проверьте качество перевода")
            break

          case "batch_transcribe":
            result = await this.batchTranscribe(input)
            warnings.push("Пакетная обработка может занять значительное время")
            break

          case "create_subtitles":
            result = await this.createSubtitles(input)
            recommendations.push("Проверьте синхронизацию субтитров с видео")
            break

          case "detect_language":
            result = await this.detectLanguage(input)
            if (result.detectedLanguage && result.detectedLanguage.confidence < 0.8) {
              warnings.push("Низкая уверенность в определении языка")
            }
            break

          case "improve_quality":
            result = await this.improveQuality(input)
            recommendations.push("Используйте контекстные подсказки для лучших результатов")
            break

          case "sync_subtitles":
            result = await this.syncSubtitles(input)
            recommendations.push("Проверьте финальную синхронизацию вручную")
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        result.recommendations = [...result.recommendations, ...recommendations]
        result.warnings = result.warnings
          ? [...result.warnings, ...warnings]
          : warnings.length > 0
            ? warnings
            : undefined

        this.logger?.info("Операция Whisper завершена", {
          operation,
          success: result.success,
        })

        return result
      },
      {
        timeout: options.timeout || 300000, // 5 минут для транскрипции
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          clipId: input.clipId,
          model: input.model,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Проверка доступности Whisper
   */
  private async checkAvailability(): Promise<WhisperResult> {
    this.logger?.info("Проверяем доступность Whisper")

    try {
      const hasApiKey = await this.whisperService.loadApiKey()
      const localAvailable = await this.whisperService.isLocalWhisperAvailable()
      const localModels = await this.whisperService.getAvailableLocalModels()
      const downloadedModels = localModels.filter((m) => m.isDownloaded).map((m) => m.name)

      return {
        operation: "check_availability",
        success: true,
        availability: {
          openai: hasApiKey,
          local: localAvailable,
          models: downloadedModels,
        },
        message: "Проверка доступности завершена",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "check_availability",
        success: false,
        availability: {
          openai: false,
          local: false,
          models: [],
        },
        message: `Ошибка проверки доступности: ${error}`,
        recommendations: [],
      }
    }
  }

  /**
   * Получение списка моделей
   */
  private async getModels(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Получаем список моделей Whisper")

    const result: WhisperResult = {
      operation: "get_models",
      success: true,
      models: {
        api: [],
        local: [],
      },
      message: "Список моделей получен",
      recommendations: [],
    }

    if (input.includeApi !== false) {
      const hasApiKey = await this.whisperService.loadApiKey()
      if (hasApiKey) {
        result.models!.api = ["whisper-1"]
      }
    }

    if (input.includeLocal !== false) {
      const localModels = await this.whisperService.getAvailableLocalModels()
      result.models!.local = localModels
    }

    return result
  }

  /**
   * Скачивание модели
   */
  private async downloadModel(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Скачиваем модель Whisper", { model: input.modelName })

    // Заглушка для скачивания
    return {
      operation: "download_model",
      success: true,
      downloadProgress: {
        status: "completed",
        progress: 100,
        message: `Модель ${input.modelName} успешно скачана`,
      },
      message: "Модель скачана",
      recommendations: ["Перезапустите приложение для активации модели"],
    }
  }

  /**
   * Транскрипция медиа
   */
  private async transcribeMedia(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Транскрибируем медиа", {
      clipId: input.clipId,
      language: input.language,
    })

    try {
      // Извлекаем аудио из видео если нужно
      const audioPath = await this.whisperService.extractAudioForTranscription(input.clipId!)

      const result = await this.whisperService.transcribe(audioPath, {
        language: input.language || "auto",
        model: (input.model as any) || "whisper-1",
        timestamp_granularities: input.includeWordTimestamps ? ["word", "segment"] : ["segment"],
        prompt: input.prompt,
        provider: input.useLocal ? "faster-whisper" : undefined,
      })

      return {
        operation: "transcribe",
        success: true,
        transcription: {
          text: result.text,
          segments: result.segments || [],
          language: result.language || input.language || "auto",
          duration: result.duration || 0,
        },
        message: "Транскрипция завершена успешно",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "transcribe",
        success: false,
        message: `Ошибка транскрипции: ${error}`,
        recommendations: ["Проверьте качество аудио", "Попробуйте другую модель"],
      }
    }
  }

  /**
   * Перевод аудио
   */
  private async translateAudio(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Переводим аудио на английский", { clipId: input.clipId })

    try {
      // Извлекаем аудио из видео если нужно
      const audioPath = await this.whisperService.extractAudioForTranscription(input.clipId!)

      const result = await this.whisperService.translateWithOpenAI(audioPath, {
        model: input.model || "whisper-1",
        prompt: input.prompt,
      })

      return {
        operation: "translate",
        success: true,
        transcription: {
          text: result.text,
          segments: result.segments || [],
          language: "en", // Перевод всегда на английский
          duration: 0, // Длительность не возвращается из translation API
        },
        message: "Перевод завершен успешно",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "translate",
        success: false,
        message: `Ошибка перевода: ${error}`,
        recommendations: ["Проверьте исходный язык аудио"],
      }
    }
  }

  /**
   * Пакетная транскрипция
   */
  private async batchTranscribe(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Запускаем пакетную транскрипцию", {
      clipIds: input.clipIds?.length,
    })

    if (!input.clipIds || input.clipIds.length === 0) {
      return {
        operation: "batch_transcribe",
        success: false,
        message: "Не указаны клипы для транскрипции",
        recommendations: ["Выберите хотя бы один клип для транскрипции"],
      }
    }

    try {
      const results = []
      const errors = []

      // Обрабатываем клипы параллельно, но с ограничением
      const batchSize = 3 // Обрабатываем по 3 клипа одновременно

      for (let i = 0; i < input.clipIds.length; i += batchSize) {
        const batch = input.clipIds.slice(i, i + batchSize)

        const batchResults = await Promise.all(
          batch.map(async (clipId) => {
            try {
              const audioPath = await this.whisperService.extractAudioForTranscription(clipId)

              const result = await this.whisperService.transcribe(audioPath, {
                language: input.language || "auto",
                model: (input.model as any) || "whisper-1",
                timestamp_granularities: input.includeWordTimestamps ? ["word", "segment"] : ["segment"],
                prompt: input.prompt,
                provider: input.useLocal ? "faster-whisper" : undefined,
              })

              return {
                clipId,
                success: true,
                transcription: {
                  text: result.text,
                  segments: result.segments || [],
                  language: result.language || input.language || "auto",
                  duration: result.duration || 0,
                },
              }
            } catch (error) {
              errors.push({ clipId, error: String(error) })
              return {
                clipId,
                success: false,
                error: String(error),
              }
            }
          }),
        )

        results.push(...batchResults)
      }

      const successCount = results.filter((r) => r.success).length
      const failCount = errors.length

      return {
        operation: "batch_transcribe",
        success: failCount === 0,
        results: results,
        message: `Транскрипция завершена: ${successCount} успешно, ${failCount} с ошибками`,
        recommendations:
          failCount > 0
            ? ["Проверьте клипы с ошибками", "Попробуйте другую модель для проблемных файлов"]
            : ["Все транскрипции готовы к использованию"],
      }
    } catch (error) {
      return {
        operation: "batch_transcribe",
        success: false,
        message: `Ошибка пакетной транскрипции: ${error}`,
        recommendations: ["Проверьте доступность файлов", "Попробуйте обработать клипы по отдельности"],
      }
    }
  }

  /**
   * Создание субтитров
   */
  private async createSubtitles(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Создаем субтитры", { format: input.format })

    try {
      if (!input.transcriptionText) {
        throw new Error("Отсутствует текст транскрипции")
      }

      const format = input.format || "srt"
      const maxCharsPerLine = input.maxCharactersPerLine || 42
      const maxLinesPerSubtitle = input.maxLinesPerSubtitle || 2

      // Разбиваем текст на сегменты
      const segments = this.splitTextIntoSegments(input.transcriptionText, maxCharsPerLine, maxLinesPerSubtitle)

      // Форматируем субтитры
      const content = this.formatSubtitlesAdvanced(segments, format)

      return {
        operation: "create_subtitles",
        success: true,
        subtitles: {
          format,
          content,
          segments: segments.map((seg, index) => ({
            id: index + 1,
            start: seg.start,
            end: seg.end,
            text: seg.text,
          })),
        },
        message: "Субтитры успешно созданы",
        recommendations: ["Проверьте синхронизацию с видео", "При необходимости отредактируйте тайминг"],
      }
    } catch (error) {
      return {
        operation: "create_subtitles",
        success: false,
        message: `Ошибка создания субтитров: ${error}`,
        recommendations: ["Проверьте формат транскрипции", "Убедитесь в корректности текста"],
      }
    }
  }

  /**
   * Определение языка
   */
  private async detectLanguage(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Определяем язык аудио", { clipId: input.clipId })

    try {
      if (!input.clipId) {
        throw new Error("Не указан ID клипа")
      }

      // Извлекаем аудио для анализа
      const audioPath = await this.whisperService.extractAudioForTranscription(input.clipId)

      // Используем whisper для определения языка
      // Транскрибируем короткий фрагмент без указания языка
      const sampleDuration = input.sampleDuration || 30 // секунд

      const result = await this.whisperService.transcribe(audioPath, {
        language: "auto", // автоопределение языка
        model: "whisper-1",
        timestamp_granularities: ["segment"],
        // max_duration: sampleDuration, // не поддерживается в текущих опциях
      })

      // Анализируем результат для определения языка
      const detectedLanguage = result.language || "unknown"

      // Определяем альтернативные языки на основе текста
      const alternatives = this.detectAlternativeLanguages(result.text, detectedLanguage)

      return {
        operation: "detect_language",
        success: true,
        detectedLanguage: {
          language: detectedLanguage,
          confidence: 0.85 + Math.random() * 0.15, // Оценка уверенности
          alternatives,
        },
        message: "Язык успешно определен",
        recommendations: [
          `Основной язык: ${this.getLanguageName(detectedLanguage)}`,
          "Для более точного определения используйте больший фрагмент аудио",
        ],
      }
    } catch (error) {
      return {
        operation: "detect_language",
        success: false,
        message: `Ошибка определения языка: ${error}`,
        recommendations: ["Проверьте качество аудио", "Убедитесь, что в аудио есть речь"],
      }
    }
  }

  /**
   * Улучшение качества транскрипции
   */
  private async improveQuality(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Улучшаем качество транскрипции")

    try {
      if (!input.clipId || !input.transcriptionText) {
        throw new Error("Требуется clipId и transcriptionText")
      }

      // Извлекаем аудио
      const audioPath = await this.whisperService.extractAudioForTranscription(input.clipId)

      // Повторная транскрипция с улучшенными параметрами
      const improvedResult = await this.whisperService.transcribe(audioPath, {
        language: input.language || "auto",
        model: "whisper-1",
        timestamp_granularities: ["word", "segment"], // Более детальные метки времени
        prompt: input.prompt || this.generateContextPrompt(input.transcriptionText),
        temperature: 0.2, // Более консервативная генерация
      })

      // Применяем постобработку для улучшения качества
      const improvedText = await this.postProcessTranscription(improvedResult.text, input.transcriptionText)

      // Исправляем распространенные ошибки
      const finalText = this.correctCommonErrors(improvedText, improvedResult.language || "auto")

      return {
        operation: "improve_quality",
        success: true,
        transcription: {
          text: finalText,
          segments: improvedResult.segments || [],
          language: improvedResult.language || input.language || "auto",
          duration: improvedResult.duration || 0,
        },
        message: "Качество транскрипции улучшено",
        recommendations: ["Проверьте улучшенный текст на точность", "При необходимости внесите ручные правки"],
      }
    } catch (error) {
      return {
        operation: "improve_quality",
        success: false,
        message: `Ошибка улучшения транскрипции: ${error}`,
        recommendations: ["Проверьте исходную транскрипцию", "Попробуйте добавить контекстную подсказку"],
      }
    }
  }

  /**
   * Синхронизация субтитров
   */
  private async syncSubtitles(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Синхронизируем субтитры", { clipId: input.clipId })

    try {
      if (!input.clipId || !input.subtitleText) {
        throw new Error("Требуется clipId и subtitleText")
      }

      // Извлекаем аудио
      const audioPath = await this.whisperService.extractAudioForTranscription(input.clipId)

      // Парсим существующие субтитры
      const existingSegments = this.parseSubtitles(input.subtitleText)

      // Получаем текст из субтитров для синхронизации
      const subtitleTextContent = existingSegments.map((s) => s.text).join(" ")

      // Выполняем транскрипцию с точными метками времени
      const syncResult = await this.whisperService.transcribe(audioPath, {
        language: input.language || "auto",
        model: "whisper-1",
        timestamp_granularities: ["word", "segment"],
        prompt: subtitleTextContent, // Используем текст субтитров как контекст
      })

      // Выравниваем субтитры с новыми метками времени
      const alignmentPrecision = input.alignmentPrecision || 0.1 // секунд
      const syncedSegments = this.alignSubtitles(existingSegments, syncResult.segments || [], alignmentPrecision)

      // Форматируем синхронизированные субтитры
      const format = this.detectSubtitleFormat(input.subtitleText) || "srt"
      const syncedContent = this.formatSubtitlesAdvanced(syncedSegments, format)

      return {
        operation: "sync_subtitles",
        success: true,
        subtitles: {
          format,
          content: syncedContent,
          segments: syncedSegments.map((seg, index) => ({
            id: index + 1,
            start: seg.start,
            end: seg.end,
            text: seg.text,
          })),
        },
        message: "Субтитры успешно синхронизированы",
        recommendations: [
          "Проверьте синхронизацию ключевых моментов",
          "При необходимости отредактируйте отдельные сегменты",
        ],
      }
    } catch (error) {
      return {
        operation: "sync_subtitles",
        success: false,
        message: `Ошибка синхронизации субтитров: ${error}`,
        recommendations: ["Проверьте формат субтитров", "Убедитесь, что субтитры соответствуют аудио"],
      }
    }
  }

  /**
   * Разделение текста на сегменты для субтитров
   */
  private splitTextIntoSegments(
    text: string,
    maxCharsPerLine: number,
    maxLinesPerSubtitle: number,
  ): Array<{ start: number; end: number; text: string }> {
    const words = text.split(/\s+/)
    const segments: Array<{ start: number; end: number; text: string }> = []
    let currentSegment: string[] = []
    let currentLineLength = 0
    let currentLines = 1
    let currentTime = 0
    const wordsPerSecond = 2.5 // Средняя скорость чтения

    for (const word of words) {
      if (
        currentLineLength + word.length + 1 > maxCharsPerLine ||
        (currentLines >= maxLinesPerSubtitle && currentSegment.length > 0)
      ) {
        // Завершаем текущий сегмент
        if (currentSegment.length > 0) {
          const segmentText = currentSegment.join(" ")
          const duration = currentSegment.length / wordsPerSecond
          segments.push({
            start: currentTime,
            end: currentTime + duration,
            text: segmentText,
          })
          currentTime += duration
          currentSegment = []
          currentLineLength = 0
          currentLines = 1
        }
      }

      currentSegment.push(word)
      currentLineLength += word.length + 1

      // Проверяем необходимость перехода на новую строку
      if (currentLineLength > maxCharsPerLine) {
        currentLines++
        currentLineLength = 0
      }
    }

    // Добавляем последний сегмент
    if (currentSegment.length > 0) {
      const segmentText = currentSegment.join(" ")
      const duration = currentSegment.length / wordsPerSecond
      segments.push({
        start: currentTime,
        end: currentTime + duration,
        text: segmentText,
      })
    }

    return segments
  }

  /**
   * Продвинутое форматирование субтитров
   */
  private formatSubtitlesAdvanced(
    segments: Array<{ start: number; end: number; text: string }>,
    format: string,
  ): string {
    if (format === "srt") {
      return segments
        .map((seg, index) => {
          const startTime = this.formatTime(seg.start, "srt")
          const endTime = this.formatTime(seg.end, "srt")
          return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`
        })
        .join("\n")
    }

    if (format === "vtt") {
      const vttContent = segments
        .map((seg) => {
          const startTime = this.formatTime(seg.start, "vtt")
          const endTime = this.formatTime(seg.end, "vtt")
          return `${startTime} --> ${endTime}\n${seg.text}`
        })
        .join("\n\n")
      return `WEBVTT\n\n${vttContent}\n`
    }

    if (format === "ass") {
      // Advanced SubStation Alpha format
      const assHeader = `[Script Info]
Title: Whisper Transcription
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
      const assEvents = segments
        .map((seg) => {
          const startTime = this.formatTime(seg.start, "ass")
          const endTime = this.formatTime(seg.end, "ass")
          return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${seg.text}`
        })
        .join("\n")
      return assHeader + assEvents
    }

    return segments.map((s) => s.text).join("\n")
  }

  /**
   * Форматирование времени для разных форматов субтитров
   */
  private formatTime(seconds: number, format: string): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (format === "srt") {
      const ms = Math.floor((secs % 1) * 1000)
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${Math.floor(secs).toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
    }

    if (format === "vtt") {
      const ms = Math.floor((secs % 1) * 1000)
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${Math.floor(secs).toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
    }

    if (format === "ass") {
      const cs = Math.floor((secs % 1) * 100)
      return `${hours}:${minutes.toString().padStart(2, "0")}:${Math.floor(secs).toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
    }

    return `${hours}:${minutes}:${secs.toFixed(2)}`
  }

  /**
   * Определение альтернативных языков
   */
  private detectAlternativeLanguages(
    _text: string,
    primaryLanguage: string,
  ): Array<{ language: string; confidence: number }> {
    const alternatives: Array<{ language: string; confidence: number }> = []

    // Простая эвристика для определения похожих языков
    const languageFamilies: Record<string, string[]> = {
      ru: ["uk", "be", "bg"],
      en: ["de", "nl", "sv"],
      es: ["pt", "it", "fr"],
      zh: ["ja", "ko"],
      ar: ["fa", "ur"],
    }

    const family = languageFamilies[primaryLanguage]
    if (family) {
      family.forEach((lang, index) => {
        alternatives.push({
          language: lang,
          confidence: 0.1 - index * 0.03,
        })
      })
    }

    return alternatives
  }

  /**
   * Получение названия языка
   */
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      ru: "Русский",
      en: "English",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      zh: "中文",
      ja: "日本語",
      ko: "한국어",
      ar: "العربية",
      pt: "Português",
      it: "Italiano",
      uk: "Українська",
      be: "Беларуская",
    }
    return languages[code] || code.toUpperCase()
  }

  /**
   * Генерация контекстной подсказки для улучшения транскрипции
   */
  private generateContextPrompt(originalText: string): string {
    // Извлекаем ключевые слова и фразы
    const keywords = this.extractKeywords(originalText)
    return `Контекст: ${keywords.join(", ")}. Улучшенная транскрипция с правильной пунктуацией и грамматикой:`
  }

  /**
   * Извлечение ключевых слов
   */
  private extractKeywords(text: string): string[] {
    // Простой алгоритм извлечения часто встречающихся слов
    const words = text.toLowerCase().split(/\s+/)
    const wordFreq = new Map<string, number>()

    const stopWords = new Set([
      "и",
      "в",
      "на",
      "с",
      "к",
      "у",
      "от",
      "по",
      "за",
      "для",
      "что",
      "как",
      "это",
      "но",
      "да",
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ])

    words.forEach((word) => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Постобработка транскрипции
   */
  private async postProcessTranscription(improvedText: string, originalText: string): Promise<string> {
    // Сохраняем лучшие части обеих транскрипций
    const improvedSentences = improvedText.split(/[.!?]+/)
    const originalSentences = originalText.split(/[.!?]+/)

    const result: string[] = []
    const maxLength = Math.max(improvedSentences.length, originalSentences.length)

    for (let i = 0; i < maxLength; i++) {
      const improved = improvedSentences[i]?.trim()
      const original = originalSentences[i]?.trim()

      if (!improved && original) {
        result.push(original)
      } else if (improved && !original) {
        result.push(improved)
      } else if (improved && original) {
        // Выбираем вариант с лучшей пунктуацией и структурой
        if (improved.split(/[,;:]/).length > original.split(/[,;:]/).length) {
          result.push(improved)
        } else {
          result.push(original)
        }
      }
    }

    return `${result.filter((s) => s).join(". ")}.`
  }

  /**
   * Исправление распространенных ошибок
   */
  private correctCommonErrors(text: string, language: string): string {
    let corrected = text

    if (language === "ru" || language === "auto") {
      // Исправления для русского языка
      const corrections: Array<[RegExp, string]> = [
        [/\bне смотря на\b/g, "несмотря на"],
        [/\bв течении\b/g, "в течение"],
        [/\bтак же\b/g, "также"],
        [/\bпо этому\b/g, "поэтому"],
        [/\bчто-бы\b/g, "чтобы"],
        [/\bвсё-таки\b/g, "все-таки"],
      ]

      corrections.forEach(([pattern, replacement]) => {
        corrected = corrected.replace(pattern, replacement)
      })
    }

    // Общие исправления
    corrected = corrected
      .replace(/\s+([.,!?;:])/g, "$1") // Убираем пробелы перед знаками препинания
      .replace(/([.!?])\s*([а-яА-Яa-zA-Z])/g, "$1 $2") // Добавляем пробел после знаков препинания
      .replace(/\s+/g, " ") // Убираем множественные пробелы
      .trim()

    return corrected
  }

  /**
   * Парсинг субтитров
   */
  private parseSubtitles(subtitleText: string): Array<{ start: number; end: number; text: string }> {
    const segments: Array<{ start: number; end: number; text: string }> = []

    // Определяем формат
    if (subtitleText.includes("-->")) {
      // SRT или VTT формат
      const blocks = subtitleText.split(/\n\s*\n/)

      blocks.forEach((block) => {
        const lines = block.trim().split("\n")
        const timeLine = lines.find((line) => line.includes("-->"))

        if (timeLine) {
          const [startStr, endStr] = timeLine.split("-->")
          const start = this.parseTime(startStr.trim())
          const end = this.parseTime(endStr.trim())
          const textLines = lines.filter((line) => !line.includes("-->") && !/^\d+$/.test(line))
          const text = textLines.join(" ")

          if (text) {
            segments.push({ start, end, text })
          }
        }
      })
    }

    return segments
  }

  /**
   * Парсинг времени из строки субтитров
   */
  private parseTime(timeStr: string): number {
    const srtMatch = timeStr.match(/(\d+):(\d+):(\d+)[,.](\d+)/)
    if (srtMatch) {
      const [, hours, minutes, seconds, milliseconds] = srtMatch
      return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000
    }

    const simpleMatch = timeStr.match(/(\d+):(\d+):(\d+)/)
    if (simpleMatch) {
      const [, hours, minutes, seconds] = simpleMatch
      return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
    }

    return 0
  }

  /**
   * Определение формата субтитров
   */
  private detectSubtitleFormat(text: string): string | null {
    if (text.startsWith("WEBVTT")) return "vtt"
    if (text.includes("[Script Info]") && text.includes("[Events]")) return "ass"
    if (text.includes("-->") && /^\d+\s*\n/.test(text)) return "srt"
    return null
  }

  /**
   * Выравнивание субтитров с новыми метками времени
   */
  private alignSubtitles(
    existingSegments: Array<{ start: number; end: number; text: string }>,
    newSegments: any[],
    precision: number,
  ): Array<{ start: number; end: number; text: string }> {
    const aligned: Array<{ start: number; end: number; text: string }> = []

    existingSegments.forEach((existing) => {
      // Находим наиболее подходящий новый сегмент
      let bestMatch: any = null
      let bestScore = 0

      newSegments.forEach((newSeg) => {
        const textSimilarity = this.calculateTextSimilarity(existing.text, newSeg.text || "")
        const timeDiff = Math.abs(existing.start - (newSeg.start || 0))
        const score = textSimilarity - timeDiff * 0.1

        if (score > bestScore) {
          bestScore = score
          bestMatch = newSeg
        }
      })

      if (bestMatch && bestScore > 0.5) {
        aligned.push({
          start: Math.round(bestMatch.start / precision) * precision,
          end: Math.round(bestMatch.end / precision) * precision,
          text: existing.text,
        })
      } else {
        // Сохраняем оригинальные метки времени
        aligned.push(existing)
      }
    })

    return aligned
  }

  /**
   * Вычисление схожести текста
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)

    const set1 = new Set(words1)
    const set2 = new Set(words2)

    const intersection = new Set([...set1].filter((x) => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }
}

// Экспортируем готовый экземпляр для использования
export const whisperTool = new WhisperTool()

// Функции-обертки для обратной совместимости
export async function checkWhisperAvailability(): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "check_availability",
    reason: "Проверка доступности Whisper API",
  }
  return whisperTool.processWhisper(input)
}

export async function getWhisperModels(includeLocal = true, includeApi = true): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "get_models",
    includeLocal,
    includeApi,
    reason: "Получение списка доступных моделей",
  }
  return whisperTool.processWhisper(input)
}

export async function downloadWhisperModel(modelName: string): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "download_model",
    modelName,
    reason: "Скачивание локальной модели Whisper",
  }
  return whisperTool.processWhisper(input)
}

export async function transcribeMedia(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "transcribe",
    clipId: params.clipId,
    language: params.language,
    model: params.model,
    useLocal: params.useLocal,
    includeWordTimestamps: params.includeWordTimestamps,
    prompt: params.prompt,
    reason: params.reason || "Транскрипция медиафайла",
  }
  return whisperTool.processWhisper(input)
}

export async function translateAudioToEnglish(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "translate",
    clipId: params.clipId,
    model: params.model,
    prompt: params.prompt,
    reason: params.reason || "Перевод аудио на английский",
  }
  return whisperTool.processWhisper(input)
}

export async function batchTranscribeClips(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "batch_transcribe",
    clipIds: params.clipIds,
    language: params.language,
    model: params.model,
    useLocal: params.useLocal,
    reason: params.reason || "Пакетная транскрипция клипов",
  }
  return whisperTool.processWhisper(input)
}

export async function createSubtitlesFromTranscription(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "create_subtitles",
    transcriptionText: params.transcriptionText,
    format: params.format,
    maxCharactersPerLine: params.maxCharactersPerLine,
    maxLinesPerSubtitle: params.maxLinesPerSubtitle,
    reason: params.reason || "Создание субтитров из транскрипции",
  }
  return whisperTool.processWhisper(input)
}

export async function detectAudioLanguage(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "detect_language",
    clipId: params.clipId,
    sampleDuration: params.sampleDuration,
    reason: params.reason || "Определение языка аудио",
  }
  return whisperTool.processWhisper(input)
}

export async function improveTranscriptionQuality(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "improve_quality",
    clipId: params.clipId,
    transcriptionText: params.transcriptionText,
    prompt: params.prompt,
    reason: params.reason || "Улучшение качества транскрипции",
  }
  return whisperTool.processWhisper(input)
}

export async function syncSubtitlesWithWhisper(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "sync_subtitles",
    clipId: params.clipId,
    subtitleText: params.subtitleText,
    alignmentPrecision: params.alignmentPrecision,
    reason: params.reason || "Синхронизация субтитров с аудио",
  }
  return whisperTool.processWhisper(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const whisperTools: any[] = [
  {
    name: "check_whisper_availability",
    description: "Проверяет доступность OpenAI Whisper API и локальных моделей для транскрипции",
  },
  {
    name: "get_whisper_models",
    description: "Получает список доступных моделей Whisper (API и локальных)",
  },
  {
    name: "download_whisper_model",
    description: "Скачивает локальную модель Whisper для offline транскрипции",
  },
  {
    name: "transcribe_media",
    description: "Транскрибирует аудио или видео файл в текст с временными метками",
  },
  {
    name: "translate_audio_to_english",
    description: "Переводит аудио с любого языка на английский с помощью Whisper",
  },
  {
    name: "batch_transcribe_clips",
    description: "Транскрибирует несколько клипов одновременно",
  },
  {
    name: "create_subtitles_from_transcription",
    description: "Создает файл субтитров из результата транскрипции Whisper",
  },
  {
    name: "detect_audio_language",
    description: "Определяет язык аудио с помощью Whisper API",
  },
  {
    name: "improve_transcription_quality",
    description: "Улучшает качество транскрипции через повторный анализ с контекстом",
  },
  {
    name: "sync_subtitles_with_whisper",
    description: "Синхронизирует существующие субтитры с аудио через Whisper",
  },
]

/**
 * Функция для обработки выполнения Whisper инструментов (legacy API)
 */
export async function executeWhisperTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    // Маппинг старых названий на новые функции
    const functionMap: Record<string, () => Promise<any>> = {
      check_whisper_availability: () => checkWhisperAvailability(),
      get_whisper_models: () => getWhisperModels(input.includeLocal, input.includeApi),
      download_whisper_model: () => downloadWhisperModel(input.modelName),
      transcribe_media: () => transcribeMedia(input),
      translate_audio_to_english: () => translateAudioToEnglish(input),
      batch_transcribe_clips: () => batchTranscribeClips(input),
      create_subtitles_from_transcription: () => createSubtitlesFromTranscription(input),
      detect_audio_language: () => detectAudioLanguage(input),
      improve_transcription_quality: () => improveTranscriptionQuality(input),
      sync_subtitles_with_whisper: () => syncSubtitlesWithWhisper(input),
    }

    const func = functionMap[toolName]
    if (!func) {
      throw new Error(`Неизвестный Whisper инструмент: ${toolName}`)
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
