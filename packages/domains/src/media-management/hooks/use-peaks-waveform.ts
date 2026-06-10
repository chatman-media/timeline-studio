/**
 * usePeaksWaveform Hook
 *
 * React hook для интеграции peaks.js в Timeline Studio
 * Предоставляет интерактивную визуализацию waveform для аудио
 */

import type { PeaksInstance, PeaksOptions } from "peaks.js"
import { useCallback, useEffect, useRef, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import type { PeaksPoint, PeaksSegment, UsePeaksResult } from "../types/peaks-waveform"

const logger = createLogger("usePeaksWaveform")

export interface UsePeaksWaveformOptions {
  /** URL аудио файла */
  audioUrl: string

  /** URL waveform данных (JSON) */
  dataUri?: string

  /** Использовать Web Audio API */
  useWebAudio?: boolean

  /** Zoom levels */
  zoomLevels?: number[]

  /** Цвета */
  waveformColor?: string
  playedWaveformColor?: string

  /** Auto init */
  autoInit?: boolean

  /** Callbacks */
  onReady?: (peaks: PeaksInstance) => void
  onError?: (error: Error) => void
}

export function usePeaksWaveform(options: UsePeaksWaveformOptions): UsePeaksResult {
  const {
    audioUrl,
    dataUri,
    useWebAudio = true,
    zoomLevels = [512, 1024, 2048, 4096],
    waveformColor = "#3b82f6",
    playedWaveformColor = "#1e40af",
    autoInit = true,
    onReady,
    onError,
  } = options

  // Refs
  const overviewRef = useRef<HTMLDivElement | null>(null)
  const zoomviewRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const peaksRef = useRef<PeaksInstance | null>(null)

  // State
  const [peaks, setPeaks] = useState<PeaksInstance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isReady, setIsReady] = useState(false)

  /**
   * Инициализация peaks.js
   */
  const initializePeaks = useCallback(async () => {
    if (!audioRef.current) {
      const err = new Error("Audio element not found")
      setError(err)
      onError?.(err)
      return
    }

    // Проверка на SSR - peaks.js требует window
    if (typeof window === "undefined") {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      logger.info("Initializing peaks.js", { audioUrl, dataUri })

      // Динамический импорт peaks.js (требует window)
      const Peaks = (await import("peaks.js")).default

      // Базовая конфигурация
      const baseConfig: Partial<PeaksOptions> = {
        overview: overviewRef.current
          ? {
              container: overviewRef.current,
              waveformColor,
              playedWaveformColor,
            }
          : undefined,
        zoomview: zoomviewRef.current
          ? {
              container: zoomviewRef.current,
              waveformColor,
              playedWaveformColor,
            }
          : undefined,
        mediaElement: audioRef.current,
        zoomLevels,
        showPlayheadTime: true,
        showAxisLabels: true,
      }

      // Добавляем данные waveform если есть
      if (dataUri) {
        baseConfig.dataUri = { json: dataUri }
      } else if (useWebAudio) {
        // Используем Web Audio API для генерации waveform
        const audioContext = new AudioContext()
        baseConfig.webAudio = { audioContext }
      }

      const config = baseConfig as PeaksOptions

      // Инициализируем peaks.js с callback
      Peaks.init(config, (error, peaksInstance) => {
        if (error) {
          logger.error("Failed to initialize peaks.js", { error })
          setError(error)
          setIsLoading(false)
          onError?.(error)
          return
        }

        if (peaksInstance) {
          peaksRef.current = peaksInstance
          setPeaks(peaksInstance)
          setIsReady(true)
          setIsLoading(false)

          logger.info("Peaks.js initialized successfully")

          // Вызываем callback
          onReady?.(peaksInstance)
        }
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      logger.error("Failed to initialize peaks.js", { error })
      setError(error)
      setIsLoading(false)
      onError?.(error)
    }
  }, [audioUrl, dataUri, useWebAudio, zoomLevels, waveformColor, playedWaveformColor, onReady, onError])

  /**
   * Auto init при монтировании
   */
  useEffect(() => {
    if (autoInit && audioRef.current) {
      initializePeaks()
    }

    return () => {
      if (peaksRef.current) {
        logger.info("Destroying peaks.js instance")
        peaksRef.current.destroy()
        peaksRef.current = null
      }
    }
  }, [autoInit, initializePeaks])

  /**
   * Добавить segment (region)
   */
  const addSegment = useCallback(
    (segment: Omit<PeaksSegment, "id">) => {
      if (!peaks) {
        logger.warn("Cannot add segment: peaks not initialized")
        return
      }

      try {
        const segmentId =
          (segment as PeaksSegment).id ?? `segment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const segmentWithId = {
          ...segment,
          id: segmentId,
        } as PeaksSegment

        peaks.segments.add(segmentWithId)
        logger.debug("Segment added", { segmentId })
      } catch (err) {
        logger.error("Failed to add segment", { error: err })
      }
    },
    [peaks],
  )

  /**
   * Добавить point (marker)
   */
  const addPoint = useCallback(
    (point: Omit<PeaksPoint, "id">) => {
      if (!peaks) {
        logger.warn("Cannot add point: peaks not initialized")
        return
      }

      try {
        const pointId = (point as PeaksPoint).id ?? `point-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const pointWithId = {
          ...point,
          id: pointId,
        } as PeaksPoint

        peaks.points.add(pointWithId)
        logger.debug("Point added", { pointId })
      } catch (err) {
        logger.error("Failed to add point", { error: err })
      }
    },
    [peaks],
  )

  /**
   * Очистить все segments
   */
  const clearSegments = useCallback(() => {
    if (!peaks) return
    peaks.segments.removeAll()
    logger.debug("All segments cleared")
  }, [peaks])

  /**
   * Очистить все points
   */
  const clearPoints = useCallback(() => {
    if (!peaks) return
    peaks.points.removeAll()
    logger.debug("All points cleared")
  }, [peaks])

  /**
   * Seek к времени
   */
  const seek = useCallback(
    (time: number) => {
      if (!peaks) return
      peaks.player.seek(time)
      logger.debug("Seeked to time", { time })
    },
    [peaks],
  )

  /**
   * Play
   */
  const play = useCallback(() => {
    if (!peaks) return
    peaks.player.play()
    logger.debug("Playing")
  }, [peaks])

  /**
   * Pause
   */
  const pause = useCallback(() => {
    if (!peaks) return
    peaks.player.pause()
    logger.debug("Paused")
  }, [peaks])

  return {
    peaks,
    overviewRef,
    zoomviewRef,
    isLoading,
    error,
    isReady,
    addSegment,
    addPoint,
    clearSegments,
    clearPoints,
    seek,
    play,
    pause,
  }
}

/**
 * Создать аудио элемент для peaks.js
 */
export function createAudioElement(audioUrl: string): HTMLAudioElement {
  const audio = document.createElement("audio")
  audio.src = audioUrl
  audio.controls = false
  audio.preload = "auto"
  return audio
}
