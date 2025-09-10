/**
 * Unified Transcription Service
 * Консолидированный сервис для транскрипции из features/transcription
 * Добавляет прогресс, обработку видео, генерацию субтитров поверх WhisperService
 */

import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import type { SpeechDetection } from "../types/content-analysis"
import type {
  ModelInfo,
  SubtitleFormat,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  WhisperIntegrationOptions,
} from "../types/transcription"
import { WhisperService } from "./whisper-service"

export class TranscriptionService {
  private static instance: TranscriptionService | null = null
  private whisperService: WhisperService
  private progressCallbacks: Map<string, (progress: TranscriptionProgress) => void> = new Map()

  private constructor() {
    this.whisperService = WhisperService.getInstance()
  }

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService()
    }
    return TranscriptionService.instance
  }

  /**
   * Транскрибировать медиафайл с прогрессом
   */
  async transcribeMedia(
    mediaPath: string,
    options: TranscriptionOptions,
    onProgress?: (progress: TranscriptionProgress) => void,
  ): Promise<TranscriptionResult> {
    const taskId = `transcription-${Date.now()}`

    if (onProgress) {
      this.progressCallbacks.set(taskId, onProgress)
      onProgress({ status: "initializing", progress: 0, message: "Инициализация..." })
    }

    try {
      // Выбираем провайдер
      const provider = options.provider || (await this.whisperService.autoSelectProvider())

      if (provider === "faster-whisper") {
        // Инициализация Faster Whisper если нужно
        if (!this.whisperService.isFasterWhisperInitialized()) {
          onProgress?.({ status: "initializing", progress: 10, message: "Инициализация Faster Whisper..." })
          await this.whisperService.initFasterWhisper()
        }
      }

      onProgress?.({ status: "processing", progress: 20, message: "Обработка аудио..." })

      // Подготовка аудио если это видео
      let audioPath = mediaPath
      if (this.isVideoFile(mediaPath)) {
        onProgress?.({ status: "processing", progress: 30, message: "Извлечение аудио из видео..." })
        audioPath = await invoke<string>("prepare_audio_for_whisper", {
          inputPath: mediaPath,
          outputFormat: "wav",
        })
      }

      onProgress?.({ status: "processing", progress: 40, message: "Транскрипция..." })

      // Выполняем транскрипцию
      const result = await this.whisperService.transcribe(audioPath, {
        ...options,
        provider,
        timestamp_granularities: options.wordTimestamps ? ["word", "segment"] : ["segment"],
      })

      onProgress?.({ status: "completed", progress: 100, message: "Транскрипция завершена" })

      // Преобразуем результат в наш формат
      return {
        segments:
          result.segments?.map((seg, idx) => ({
            id: idx,
            start: seg.start,
            end: seg.end,
            text: seg.text,
            words: result.words
              ?.filter((w) => w.start >= seg.start && w.end <= seg.end)
              ?.map((w) => ({
                word: w.word,
                start: w.start,
                end: w.end,
                confidence: w.confidence || 0.8,
              })),
            confidence: 0.8, // WhisperSegment не имеет confidence, используем дефолтное значение
          })) || [],
        language: result.language || "unknown",
        languageProbability: result.confidence || 0,
        duration: result.duration || 0,
        text: result.text,
        processingTime: result.processingTime,
      }
    } catch (error) {
      onProgress?.({
        status: "error",
        progress: 0,
        message: `Ошибка: ${error instanceof Error ? error.message : String(error)}`,
      })
      throw error
    } finally {
      this.progressCallbacks.delete(taskId)
    }
  }

  /**
   * Распознавание речи для AI Chat (из WhisperIntegrationService)
   */
  async recognizeSpeech(mediaPath: string, options: WhisperIntegrationOptions = {}): Promise<SpeechDetection[]> {
    console.log("Starting speech recognition with Whisper:", {
      mediaPath,
      options,
    })

    try {
      // Конвертируем наши опции в формат TranscriptionOptions
      const transcriptionOptions: TranscriptionOptions = {
        language: options.language || "auto",
        task: "transcribe",
        modelSize: options.modelSize || "base",
        wordTimestamps: options.wordTimestamps ?? true,
        vadFilter: options.vadFilter ?? true,
        provider: options.provider === "openai" ? "openai" : "faster-whisper",
        device: options.device || "auto",
        computeType: options.computeType || "auto",
      }

      // Выполняем транскрипцию
      const result = await this.transcribeMedia(mediaPath, transcriptionOptions)

      // Конвертируем результат в SpeechDetection[]
      const speechDetections: SpeechDetection[] = result.segments.map((segment) => ({
        startTime: segment.start,
        endTime: segment.end,
        text: segment.text,
        confidence: segment.confidence || 0.8,
        language: result.language,
        speaker: "unknown", // TODO: Добавить определение спикера
        words: segment.words?.map((word) => ({
          word: word.word,
          startTime: word.start,
          endTime: word.end,
          confidence: word.confidence || 0.8,
        })),
      }))

      console.log(`Speech recognition completed: ${speechDetections.length} segments detected`)
      return speechDetections
    } catch (error) {
      console.error("Speech recognition failed:", error)
      throw error
    }
  }

  /**
   * Генерировать субтитры из результата транскрипции
   */
  async generateSubtitles(transcription: TranscriptionResult, format: SubtitleFormat): Promise<string> {
    return await invoke<string>("generate_subtitles_from_transcription", {
      transcription: {
        segments: transcription.segments.map((seg) => ({
          id: seg.id,
          start: seg.start,
          end: seg.end,
          text: seg.text,
          words: seg.words,
          avg_logprob: 0,
          compression_ratio: 0,
          no_speech_prob: 0,
        })),
        language: transcription.language,
        language_probability: transcription.languageProbability,
        duration: transcription.duration,
        text: transcription.text,
      },
      format,
    })
  }

  /**
   * Получить доступные модели
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    const models = await invoke<ModelInfo[]>("get_whisper_models")
    return models
  }

  /**
   * Скачать модель
   */
  async downloadModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    // Подписываемся на события прогресса
    const unlisten = await listen<{ model: string; progress: number }>("whisper_model_downloaded", (event) => {
      if (event.payload.model === modelName && onProgress) {
        onProgress(event.payload.progress)
      }
    })

    try {
      const result = await invoke<boolean>("download_whisper_model", { modelName })
      return result
    } finally {
      unlisten()
    }
  }

  /**
   * Проверить, является ли файл видео
   */
  private isVideoFile(path: string): boolean {
    const videoExtensions = [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v"]
    const ext = path.toLowerCase().substring(path.lastIndexOf("."))
    return videoExtensions.includes(ext)
  }

  /**
   * Получить поддерживаемые языки
   */
  getSupportedLanguages() {
    return this.whisperService.getSupportedLanguages()
  }

  /**
   * Рекомендовать модель на основе длительности
   */
  recommendModel(durationSeconds: number, useLocal = true): string {
    return this.whisperService.recommendModel(durationSeconds, useLocal)
  }
}
