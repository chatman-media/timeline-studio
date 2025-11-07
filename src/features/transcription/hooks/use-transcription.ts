import { useCallback, useRef, useState } from "react"
import { TranscriptionService } from "@/domains/ai-services/services/transcription-service"
import type {
  ModelInfo,
  SubtitleFormat,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
} from "@/domains/ai-services/types/transcription"
import { logError, logInfo } from "@/lib/tauri-logger"

export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [progress, setProgress] = useState<TranscriptionProgress>({
    status: "idle",
    progress: 0,
  })
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const serviceRef = useRef<TranscriptionService | null>(null)

  // Инициализация сервиса
  if (!serviceRef.current) {
    serviceRef.current = TranscriptionService.getInstance()
  }

  /**
   * Транскрибировать медиафайл
   */
  const transcribe = useCallback(
    async (mediaPath: string, options: TranscriptionOptions): Promise<TranscriptionResult | null> => {
      logInfo("[useTranscription] Начало транскрипции", { mediaPath, options })
      setIsTranscribing(true)
      setError(null)
      setResult(null)
      setProgress({ status: "initializing", progress: 0 })

      try {
        const transcriptionResult = await serviceRef.current!.transcribeMedia(mediaPath, options, (progress) => {
          logInfo("[useTranscription] Прогресс транскрипции", { progress })
          setProgress(progress)
        })

        setResult(transcriptionResult)
        logInfo("[useTranscription] Транскрипция успешно завершена", {
          duration: transcriptionResult.duration,
          segmentsCount: transcriptionResult.segments.length,
          language: transcriptionResult.language,
        })
        return transcriptionResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
        logError("[useTranscription] Ошибка при транскрипции", { error: err })
        setError(errorMessage)
        setProgress({ status: "error", progress: 0, message: errorMessage })
        return null
      } finally {
        setIsTranscribing(false)
      }
    },
    [],
  )

  /**
   * Генерировать субтитры
   */
  const generateSubtitles = useCallback(
    async (format: SubtitleFormat = "srt"): Promise<string | null> => {
      logInfo("[useTranscription] Генерация субтитров", { format })
      if (!result) {
        logError("[useTranscription] Нет результата транскрипции", {
          error: new Error("No transcription result"),
        })
        setError("Нет результата транскрипции")
        return null
      }

      try {
        const subtitles = await serviceRef.current!.generateSubtitles(result, format)
        logInfo("[useTranscription] Субтитры успешно сгенерированы", { format, length: subtitles.length })
        return subtitles
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
        logError("[useTranscription] Ошибка при генерации субтитров", { error: err })
        setError(errorMessage)
        return null
      }
    },
    [result],
  )

  /**
   * Сбросить состояние
   */
  const reset = useCallback(() => {
    logInfo("[useTranscription] Сброс состояния")
    setIsTranscribing(false)
    setProgress({ status: "idle", progress: 0 })
    setResult(null)
    setError(null)
  }, [])

  return {
    // Состояние
    isTranscribing,
    progress,
    result,
    error,

    // Методы
    transcribe,
    generateSubtitles,
    reset,

    // Сервис для дополнительных методов
    service: serviceRef.current!,
  }
}

/**
 * Хук для управления моделями Whisper
 */
export function useWhisperModels() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})

  const serviceRef = useRef<TranscriptionService | null>(null)

  if (!serviceRef.current) {
    serviceRef.current = TranscriptionService.getInstance()
  }

  /**
   * Загрузить список моделей
   */
  const loadModels = useCallback(async () => {
    logInfo("[useWhisperModels] Загрузка списка моделей")
    setIsLoading(true)
    try {
      const availableModels = await serviceRef.current!.getAvailableModels()
      setModels(availableModels)
      logInfo("[useWhisperModels] Модели загружены", { count: availableModels.length })
    } catch (error) {
      logError("[useWhisperModels] Ошибка загрузки моделей", { error })
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Скачать модель
   */
  const downloadModel = useCallback(
    async (modelName: string): Promise<boolean> => {
      logInfo("[useWhisperModels] Начало скачивания модели", { modelName })
      try {
        const success = await serviceRef.current!.downloadModel(modelName, (progress) => {
          logInfo("[useWhisperModels] Прогресс скачивания", { modelName, progress })
          setDownloadProgress((prev) => ({
            ...prev,
            [modelName]: progress,
          }))
        })

        if (success) {
          // Обновляем список моделей
          logInfo("[useWhisperModels] Модель успешно скачана", { modelName })
          await loadModels()
        }

        return success
      } catch (error) {
        logError("[useWhisperModels] Ошибка скачивания модели", { error })
        return false
      } finally {
        // Очищаем прогресс
        setDownloadProgress((prev) => {
          const { [modelName]: _, ...rest } = prev
          return rest
        })
      }
    },
    [loadModels],
  )

  return {
    models,
    isLoading,
    downloadProgress,
    loadModels,
    downloadModel,
  }
}
