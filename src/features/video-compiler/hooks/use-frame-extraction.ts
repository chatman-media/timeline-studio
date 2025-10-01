import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Subtitle } from "@/domains/video-editing/types"
import { useFramePreview } from "@/features/media/hooks/use-frame-preview"
import {
  type ExtractionPurpose,
  frameExtractionService,
  type RecognitionFrame,
  type SubtitleFrame,
  type TimelineFrame,
} from "../services/frame-extraction-service"

export interface UseFrameExtractionOptions {
  /** Кэшировать ли результаты в IndexedDB */
  cacheResults?: boolean
  /** Автоматически загружать кадры при монтировании */
  autoLoad?: boolean
  /** Интервал между кадрами (секунды) */
  interval?: number
  /** Максимальное количество кадров */
  maxFrames?: number
}

export interface UseFrameExtractionResult {
  /** Кадры для timeline */
  timelineFrames: TimelineFrame[]
  /** Кадры для распознавания */
  recognitionFrames: RecognitionFrame[]
  /** Кадры субтитров */
  subtitleFrames: SubtitleFrame[]
  /** Загружаются ли кадры */
  isLoading: boolean
  /** Ошибка загрузки */
  error: Error | null
  /** Прогресс загрузки (0-100) */
  progress: number
  /** Извлечь кадры для timeline */
  extractTimelineFrames: (videoPath: string, duration: number) => Promise<void>
  /** Извлечь кадры для распознавания */
  extractRecognitionFrames: (videoPath: string, purpose: ExtractionPurpose) => Promise<void>
  /** Извлечь кадры для субтитров */
  extractSubtitleFrames: (videoPath: string, subtitles: Subtitle[]) => Promise<void>
  /** Очистить кэш */
  clearCache: () => Promise<void>
  /** Очистить состояние */
  reset: () => void
}

export function useFrameExtraction(options: UseFrameExtractionOptions = {}): UseFrameExtractionResult {
  const { t } = useTranslation()
  const { cacheResults = true, interval = 1.0, maxFrames } = options

  const [timelineFrames, setTimelineFrames] = useState<TimelineFrame[]>([])
  const [recognitionFrames, setRecognitionFrames] = useState<RecognitionFrame[]>([])
  const [subtitleFrames, setSubtitleFrames] = useState<SubtitleFrame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Используем интегрированный хук для работы с Preview Manager только для timeline frames
  const { extractTimelineFrames: extractFramesWithCache } = useFramePreview({
    onFramesExtracted: (frames) => {
      console.log(`Извлечено ${frames.length} кадров через Preview Manager`)
    },
    onError: (error) => {
      console.error("Ошибка Preview Manager:", error)
    },
  })

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Извлечь кадры для timeline
   */
  const extractTimelineFrames = useCallback(
    async (videoPath: string, duration: number) => {
      try {
        setIsLoading(true)
        setError(null)
        setProgress(0)

        // Создаем новый контроллер для отмены
        abortControllerRef.current = new AbortController()

        // Используем fileId на основе пути для кэширования
        const fileId = videoPath

        // Извлекаем кадры через интегрированный сервис
        const frames = await extractFramesWithCache(fileId, videoPath, duration, interval, maxFrames)

        // Проверяем, не была ли операция отменена
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        setTimelineFrames(frames)
        setProgress(100)
      } catch (err) {
        const error = err as Error
        console.error("Failed to extract timeline frames:", error)
        setError(error)
        toast.error(t("videoCompiler.frameExtraction.errorTimeline"))
      } finally {
        setIsLoading(false)
      }
    },
    [extractFramesWithCache, interval, maxFrames, t],
  )

  /**
   * Извлечь кадры для распознавания
   */
  const extractRecognitionFrames = useCallback(
    async (videoPath: string, purpose: ExtractionPurpose) => {
      try {
        setIsLoading(true)
        setError(null)
        setProgress(0)

        // Используем прямой вызов frameExtractionService для recognition frames
        const frames = await frameExtractionService.extractRecognitionFrames(videoPath, purpose, interval)

        // Кэшируем результаты если нужно
        if (cacheResults) {
          await frameExtractionService.cacheRecognitionFrames(videoPath, frames)
        }

        setRecognitionFrames(frames)
        setProgress(100)
      } catch (err) {
        const error = err as Error
        console.error("Failed to extract recognition frames:", error)
        setError(error)
        toast.error(t("videoCompiler.frameExtraction.errorRecognition"))
      } finally {
        setIsLoading(false)
      }
    },
    [cacheResults, interval, t],
  )

  /**
   * Извлечь кадры для субтитров
   */
  const extractSubtitleFrames = useCallback(async (videoPath: string, subtitles: Subtitle[]) => {
    try {
      setIsLoading(true)
      setError(null)
      setProgress(0)

      const frames = await frameExtractionService.extractSubtitleFrames(videoPath, subtitles)

      setSubtitleFrames(frames)
      setProgress(100)
    } catch (err) {
      const error = err as Error
      console.error("Failed to extract subtitle frames:", error)
      setError(error)
      toast.error(t("videoCompiler.frameExtraction.errorSubtitles"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Очистить кэш
   */
  const clearCache = useCallback(async () => {
    try {
      await frameExtractionService.clearFrameCache()
      toast.success(t("videoCompiler.frameExtraction.cacheCleared"))
    } catch (err) {
      console.error("Failed to clear cache:", err)
      toast.error(t("videoCompiler.frameExtraction.errorClearCache"))
    }
  }, [])

  /**
   * Сбросить состояние
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setTimelineFrames([])
    setRecognitionFrames([])
    setSubtitleFrames([])
    setIsLoading(false)
    setError(null)
    setProgress(0)
  }, [])

  return {
    timelineFrames,
    recognitionFrames,
    subtitleFrames,
    isLoading,
    error,
    progress,
    extractTimelineFrames,
    extractRecognitionFrames,
    extractSubtitleFrames,
    clearCache,
    reset,
  }
}

/**
 * Hook для умной генерации превью timeline
 */
export function useSmartTimelinePreviews(
  videoPath: string | null,
  duration: number,
  containerWidth: number,
  options: UseFrameExtractionOptions = {},
) {
  const { extractTimelineFrames, timelineFrames, isLoading, error, progress } = useFrameExtraction(options)

  const frameWidth = 160 // Стандартная ширина кадра превью

  useEffect(() => {
    if (!videoPath || duration <= 0 || containerWidth <= 0) {
      return
    }

    // Вычисляем оптимальное количество кадров
    const maxFrames = Math.floor(containerWidth / frameWidth)
    const interval = duration / maxFrames

    // Извлекаем кадры
    void extractTimelineFrames(videoPath, duration)
  }, [videoPath, duration, containerWidth, extractTimelineFrames])

  return {
    frames: timelineFrames,
    isLoading,
    error,
    progress,
    frameWidth,
  }
}
