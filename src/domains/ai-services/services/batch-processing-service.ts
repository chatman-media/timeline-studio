/**
 * Сервис для пакетной обработки клипов
 * Координирует массовые операции анализа, транскрипции и обработки видео
 */

import { invoke } from "@tauri-apps/api/core"

/**
 * Типы пакетных операций
 */
export type BatchOperationType =
  | "video_analysis"
  | "whisper_transcription"
  | "subtitle_generation"
  | "quality_analysis"
  | "scene_detection"
  | "motion_analysis"
  | "audio_analysis"
  | "language_detection"
  | "comprehensive_analysis"

/**
 * Статус пакетной операции
 */
export type BatchJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled"

/**
 * Параметры для пакетной операции
 */
export interface BatchOperationParams {
  clipIds: string[]
  operation: BatchOperationType
  options: Record<string, any>
  priority?: "low" | "medium" | "high"
  maxConcurrent?: number
  retryOnFailure?: boolean
  progressCallback?: (progress: BatchProgress) => void
}

/**
 * Прогресс пакетной операции
 */
export interface BatchProgress {
  jobId: string
  total: number
  completed: number
  failed: number
  currentClip?: string
  status: BatchJobStatus
  startTime: Date
  estimatedTimeRemaining?: number
  errors: string[]
}

/**
 * Результат пакетной операции
 */
export interface BatchOperationResult {
  id: string
  jobId: string
  status: BatchJobStatus
  results: Record<string, any>[]
  errors: string[]
  totalProcessed: number
  successCount: number
  failureCount: number
  executionTime: number
  createdAt: Date
  summary: {
    operation: BatchOperationType
    clipIds: string[]
    startTime: Date
    endTime: Date
  }
}

/**
 * Статистика пакетных операций
 */
export interface BatchProcessingStats {
  totalJobs: number
  runningJobs: number
  completedJobs: number
  failedJobs: number
  averageExecutionTime: number
  totalClipsProcessed: number
  successRate: number
}

/**
 * Сервис для пакетной обработки клипов
 */
export class BatchProcessingService {
  private static instance: BatchProcessingService
  private activeJobs = new Map<string, BatchProgress>()
  private jobHistory: BatchOperationResult[] = []
  private maxConcurrentJobs = 3

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): BatchProcessingService {
    if (!BatchProcessingService.instance) {
      BatchProcessingService.instance = new BatchProcessingService()
    }
    return BatchProcessingService.instance
  }

  /**
   * Запустить пакетную операцию
   */
  public async startBatchOperation(params: BatchOperationParams): Promise<string> {
    const jobId = this.generateJobId()

    const progress: BatchProgress = {
      jobId,
      total: params.clipIds.length,
      completed: 0,
      failed: 0,
      status: "pending",
      startTime: new Date(),
      errors: [],
    }

    this.activeJobs.set(jobId, progress)

    // Запускаем обработку асинхронно
    this.processBatchOperation(jobId, params).catch((error: unknown) => {
      console.error(`Batch operation ${jobId} failed:`, error)
      this.updateJobStatus(jobId, "failed")
    })

    return jobId
  }

  /**
   * Получить прогресс пакетной операции
   */
  public getBatchProgress(jobId: string): BatchProgress | null {
    return this.activeJobs.get(jobId) || null
  }

  /**
   * Отменить пакетную операцию
   */
  public async cancelBatchOperation(jobId: string): Promise<boolean> {
    const progress = this.activeJobs.get(jobId)
    if (progress && progress.status === "running") {
      progress.status = "cancelled"
      this.activeJobs.set(jobId, progress)
      return true
    }
    return false
  }

  /**
   * Получить статистику пакетных операций
   */
  public getBatchProcessingStats(): BatchProcessingStats {
    const runningJobs = Array.from(this.activeJobs.values()).filter((j) => j.status === "running").length
    const totalJobs = this.jobHistory.length + this.activeJobs.size
    const completedJobs = this.jobHistory.filter((j) => j.status === "completed").length
    const failedJobs = this.jobHistory.filter((j) => j.status === "failed").length

    const averageExecutionTime =
      this.jobHistory.length > 0
        ? this.jobHistory.reduce((sum, job) => sum + job.executionTime, 0) / this.jobHistory.length
        : 0

    const totalClipsProcessed = this.jobHistory.reduce((sum, job) => sum + job.totalProcessed, 0)
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

    return {
      totalJobs,
      runningJobs,
      completedJobs,
      failedJobs,
      averageExecutionTime,
      totalClipsProcessed,
      successRate,
    }
  }

  /**
   * Получить историю пакетных операций
   */
  public getBatchHistory(limit = 50): BatchOperationResult[] {
    return this.jobHistory.slice(-limit)
  }

  /**
   * Очистить историю пакетных операций
   */
  public clearBatchHistory(idsToRemove?: string[]): void {
    if (idsToRemove && idsToRemove.length > 0) {
      this.jobHistory = this.jobHistory.filter((job) => !idsToRemove.includes(job.id))
    } else {
      this.jobHistory = []
    }
  }

  /**
   * Основная функция обработки пакетной операции
   */
  private async processBatchOperation(jobId: string, params: BatchOperationParams): Promise<void> {
    const progress = this.activeJobs.get(jobId)!
    progress.status = "running"
    this.activeJobs.set(jobId, progress)

    const startTime = Date.now()
    const results: Record<string, any>[] = []
    const errors: string[] = []

    try {
      // Определяем максимальное количество одновременных операций
      const maxConcurrent = params.maxConcurrent || this.maxConcurrentJobs

      // Разбиваем клипы на батчи
      const batches = this.chunkArray(params.clipIds, maxConcurrent)

      for (const batch of batches) {
        // Get fresh progress status as it might be updated by cancellation
        const currentProgress = this.activeJobs.get(jobId)!
        if (currentProgress.status === "cancelled") {
          break
        }

        // Обрабатываем батч параллельно
        const batchPromises = batch.map((clipId) =>
          this.processingleClip(clipId, params.operation, params.options)
            .then((result) => {
              results.push({ clipId, success: true, data: result })
              progress.completed++
              progress.currentClip = clipId
              if (params.progressCallback) {
                params.progressCallback(progress)
              }
            })
            .catch((error: unknown) => {
              const errorMessage = `${clipId}: ${String(error)}`
              errors.push(errorMessage)
              progress.failed++
              progress.errors.push(errorMessage)
              results.push({ clipId, success: false, error: String(error) })

              if (params.progressCallback) {
                params.progressCallback(progress)
              }
            }),
        )

        await Promise.all(batchPromises)

        // Обновляем прогресс
        this.activeJobs.set(jobId, progress)
      }

      // Завершаем операцию
      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Get final progress status as it might have been updated by cancellation
      const finalProgress = this.activeJobs.get(jobId)!

      const operationResult: BatchOperationResult = {
        id: jobId,
        jobId,
        status: finalProgress.status === "cancelled" ? "cancelled" : "completed",
        results,
        errors,
        totalProcessed: params.clipIds.length,
        successCount: finalProgress.completed,
        failureCount: finalProgress.failed,
        executionTime,
        createdAt: progress.startTime,
        summary: {
          operation: params.operation,
          clipIds: params.clipIds,
          startTime: progress.startTime,
          endTime: new Date(),
        },
      }

      // Сохраняем в историю и удаляем из активных
      this.jobHistory.push(operationResult)
      this.activeJobs.delete(jobId)
    } catch (error) {
      console.error(`Batch operation ${jobId} failed:`, error)
      progress.status = "failed"
      progress.errors.push(String(error))
      this.activeJobs.set(jobId, progress)
    }
  }

  /**
   * Обработка одного клипа
   */
  private async processingleClip(
    clipId: string,
    operation: BatchOperationType,
    options: Record<string, any>,
  ): Promise<any> {
    switch (operation) {
      case "video_analysis":
        return await invoke("ffmpeg_quick_analysis", { filePath: this.getClipPath(clipId) })

      case "whisper_transcription":
        return await invoke("whisper_transcribe_openai", {
          audioFilePath: await this.extractAudioPath(clipId),
          apiKey: "",
          model: options.model || "whisper-1",
          language: options.language,
          responseFormat: "verbose_json",
          temperature: 0,
          timestampGranularities: ["segment"],
        })

      case "subtitle_generation": {
        // Сначала транскрибируем, затем генерируем субтитры
        const transcription = await this.processingleClip(clipId, "whisper_transcription", options)
        return this.generateSubtitlesFromTranscription(transcription.text, options)
      }

      case "quality_analysis":
        return await invoke("ffmpeg_analyze_quality", {
          filePath: this.getClipPath(clipId),
          enableBitrateAnalysis: true,
          enableResolutionAnalysis: true,
        })

      case "scene_detection":
        return await invoke("ffmpeg_detect_scenes", {
          filePath: this.getClipPath(clipId),
          threshold: options.threshold || 0.3,
          minSceneLength: options.minSceneLength || 1.0,
        })

      case "motion_analysis":
        return await invoke("ffmpeg_analyze_motion", {
          filePath: this.getClipPath(clipId),
          algorithm: options.algorithm || "optical_flow",
          sensitivity: options.sensitivity || 0.1,
        })

      case "audio_analysis":
        return await invoke("ffmpeg_analyze_audio", {
          filePath: this.getClipPath(clipId),
          enableSpectralAnalysis: true,
          enableDynamicsAnalysis: true,
        })

      case "language_detection": {
        const audioPath = await this.extractAudioPath(clipId)
        const result = await invoke("whisper_transcribe_openai", {
          audioFilePath: audioPath,
          apiKey: "",
          model: "whisper-1",
          responseFormat: "verbose_json",
          temperature: 0,
          timestampGranularities: ["segment"],
        })
        return { language: (result as any)?.language || "unknown", confidence: 0.9 }
      }

      case "comprehensive_analysis": {
        // Комплексный анализ - запускаем несколько операций параллельно
        const [videoAnalysis, audioAnalysis, qualityAnalysis] = await Promise.all([
          this.processingleClip(clipId, "video_analysis", options),
          this.processingleClip(clipId, "audio_analysis", options),
          this.processingleClip(clipId, "quality_analysis", options),
        ])

        return {
          video: videoAnalysis,
          audio: audioAnalysis,
          quality: qualityAnalysis,
          clipId,
          timestamp: new Date().toISOString(),
        }
      }

      default:
        throw new Error(`Unknown batch operation: ${operation}`)
    }
  }

  /**
   * Генерация субтитров из текста транскрипции
   */
  private generateSubtitlesFromTranscription(text: string, options: Record<string, any>): any {
    const words = text.split(" ")
    const subtitles = []
    let currentSubtitle = ""
    const maxCharsPerLine = options.maxCharactersPerLine || 42

    for (const word of words) {
      if (currentSubtitle.length + word.length + 1 > maxCharsPerLine) {
        if (currentSubtitle) {
          subtitles.push(currentSubtitle.trim())
          currentSubtitle = word
        }
      } else {
        currentSubtitle += (currentSubtitle ? " " : "") + word
      }
    }

    if (currentSubtitle) {
      subtitles.push(currentSubtitle.trim())
    }

    return {
      subtitles,
      format: options.format || "srt",
      lineCount: subtitles.length,
      totalCharacters: text.length,
    }
  }

  /**
   * Вспомогательные методы
   */
  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private getClipPath(clipId: string): string {
    // Получаем путь к клипу из Timeline контекста
    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const project = timelineContext.project || timelineContext.getTimelineState?.()

      if (project?.tracks) {
        // Ищем клип во всех треках
        for (const track of project.tracks) {
          const clip = track.clips?.find((c: any) => c.id === clipId)
          if (clip?.mediaFile?.path) {
            return clip.mediaFile.path
          }
        }
      }
    }

    // Fallback на стандартный путь если клип не найден
    console.warn(`Clip ${clipId} not found in timeline, using fallback path`)
    return `/path/to/video/${clipId}.mp4`
  }

  private async extractAudioPath(clipId: string): Promise<string> {
    const videoPath = this.getClipPath(clipId)
    return await invoke("extract_audio_for_whisper", {
      videoFilePath: videoPath,
      outputFormat: "wav",
    })
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private updateJobStatus(jobId: string, status: BatchJobStatus): void {
    const progress = this.activeJobs.get(jobId)
    if (progress) {
      progress.status = status
      this.activeJobs.set(jobId, progress)
    }
  }
}
