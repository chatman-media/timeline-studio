/**
 * Hook для preview эффектов в real-time
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useEffects } from "@/features/effects/hooks/use-effects"
import { createLogger } from "@/lib/tauri-logger"
import { type EffectsPlayerConfig, getEffectsPlayerIntegration } from "../services/effects-player-integration"
import type { TimelineClip } from "../types"

const logger = createLogger({ module: "UseEffectsPreview" })

export interface UseEffectsPreviewOptions extends EffectsPlayerConfig {
  enabled?: boolean
  autoStart?: boolean
}

export interface UseEffectsPreviewReturn {
  // Canvas с обработанным видео
  processedCanvas: HTMLCanvasElement | null

  // Состояние
  isProcessing: boolean
  isInitialized: boolean
  error: string | null

  // Управление
  startProcessing: (videoElement: HTMLVideoElement) => void
  stopProcessing: () => void
  processFrame: (videoElement: HTMLVideoElement, time: number) => Promise<void>
  setClip: (clip: TimelineClip | null) => void

  // Кеширование
  prefetchFrames: (videoElement: HTMLVideoElement, centerTime: number, range?: number) => Promise<void>
  invalidateCache: () => void
  cacheStats: {
    entries: number
    sizeMB: number
    hitRate: number
  }

  // Утилиты
  getFFmpegCommands: () => string[]
}

export function useEffectsPreview(options: UseEffectsPreviewOptions = {}): UseEffectsPreviewReturn {
  const { enabled = true, autoStart = true, ...config } = options
  const { effects: availableEffects } = useEffects()

  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [cacheStats, setCacheStats] = useState({ entries: 0, sizeMB: 0, hitRate: 0 })

  const integrationRef = useRef(getEffectsPlayerIntegration(config))
  const currentClipRef = useRef<TimelineClip | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // Инициализация
  useEffect(() => {
    if (!enabled) return

    const initialize = async () => {
      try {
        await integrationRef.current.initialize(availableEffects)
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize effects")
        logger.error("Effects preview initialization error:", err)
      }
    }

    initialize()

    return () => {
      // Очистка при размонтировании
      if (isProcessing) {
        integrationRef.current.stopRealtimeProcessing()
      }
    }
  }, [enabled, availableEffects])

  // Установка текущего клипа
  const setClip = useCallback(
    (clip: TimelineClip | null) => {
      currentClipRef.current = clip
      integrationRef.current.setCurrentClip(clip)

      // Если обработка идет и клип изменился, перезапускаем
      if (isProcessing && videoElementRef.current && autoStart) {
        integrationRef.current.stopRealtimeProcessing()
        integrationRef.current.startRealtimeProcessing(videoElementRef.current, (canvas) => setProcessedCanvas(canvas))
      }
    },
    [isProcessing, autoStart],
  )

  // Начать обработку
  const startProcessing = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (!isInitialized || !enabled) return

      videoElementRef.current = videoElement
      setIsProcessing(true)
      setError(null)

      integrationRef.current.startRealtimeProcessing(videoElement, (canvas) => setProcessedCanvas(canvas))
    },
    [isInitialized, enabled],
  )

  // Остановить обработку
  const stopProcessing = useCallback(() => {
    integrationRef.current.stopRealtimeProcessing()
    setIsProcessing(false)
    videoElementRef.current = null
  }, [])

  // Обработать один кадр
  const processFrame = useCallback(
    async (videoElement: HTMLVideoElement, time: number) => {
      if (!isInitialized || !enabled) return

      try {
        const canvas = await integrationRef.current.processVideoFrame(videoElement, time)
        if (canvas) {
          setProcessedCanvas(canvas)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process frame")
      }
    },
    [isInitialized, enabled],
  )

  // Получить FFmpeg команды
  const getFFmpegCommands = useCallback(() => {
    if (!currentClipRef.current) return []
    return integrationRef.current.getFFmpegCommands(currentClipRef.current)
  }, [])

  // Предзагрузка кадров
  const prefetchFrames = useCallback(
    async (videoElement: HTMLVideoElement, centerTime: number, range = 2) => {
      if (!isInitialized || !enabled) return

      try {
        await integrationRef.current.prefetchFrames(videoElement, centerTime, range)
        // Обновляем статистику кеша
        setCacheStats(integrationRef.current.getCacheStats())
      } catch (err) {
        logger.warn("Ошибка предзагрузки кадров:", err)
      }
    },
    [isInitialized, enabled],
  )

  // Очистка кеша
  const invalidateCache = useCallback(() => {
    integrationRef.current.invalidateCache()
    setCacheStats({ entries: 0, sizeMB: 0, hitRate: 0 })
  }, [])

  // Обновление статистики кеша при обработке
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setCacheStats(integrationRef.current.getCacheStats())
      }, 1000) // Обновляем каждую секунду

      return () => clearInterval(interval)
    }
  }, [isProcessing])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (isProcessing) {
        integrationRef.current.stopRealtimeProcessing()
      }
    }
  }, [isProcessing])

  return {
    processedCanvas,
    isProcessing,
    isInitialized,
    error,
    startProcessing,
    stopProcessing,
    processFrame,
    setClip,
    prefetchFrames,
    invalidateCache,
    cacheStats,
    getFFmpegCommands,
  }
}
