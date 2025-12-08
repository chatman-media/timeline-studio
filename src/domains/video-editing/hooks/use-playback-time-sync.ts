import { useCallback, useEffect, useRef, useState } from "react"

export interface PlaybackTimeSyncOptions {
  /**
   * Флаг воспроизведения - когда true, начинается синхронизация
   */
  isPlaying: boolean

  /**
   * ID текущего видео - при изменении сбрасывается время
   */
  videoId?: string | null

  /**
   * CSS селектор для поиска video элемента
   * @default 'video[data-player-video]'
   */
  videoSelector?: string

  /**
   * Интервал синхронизации с backend в миллисекундах
   * @default 1000 (1 секунда)
   */
  syncInterval?: number

  /**
   * Callback для периодической синхронизации с backend
   * Вызывается с частотой syncInterval
   */
  onBackendSync?: (time: number) => void

  /**
   * Начальное время для отображения
   * @default 0
   */
  initialTime?: number
}

/**
 * Хук для синхронизации времени воспроизведения между video элементом и UI
 *
 * Архитектура:
 * - L1: Обновление UI каждый кадр (~60fps) через requestAnimationFrame
 * - L2: Периодическая синхронизация с backend (по умолчанию раз в секунду)
 *
 * @example
 * ```tsx
 * const currentDisplayTime = usePlaybackTimeSync({
 *   isPlaying: true,
 *   syncInterval: 1000,
 *   onBackendSync: (time) => {
 *     backendSync.executeCommand({
 *       type: "UpdatePlaybackTime",
 *       params: { time }
 *     })
 *   }
 * })
 * ```
 */
export function usePlaybackTimeSync({
  isPlaying,
  videoId,
  videoSelector = "video[data-player-video]",
  syncInterval = 1000,
  onBackendSync,
  initialTime = 0,
}: PlaybackTimeSyncOptions) {
  const [currentDisplayTime, setCurrentDisplayTime] = useState(initialTime)
  const rafIdRef = useRef<number | undefined>(undefined)
  const lastBackendSyncRef = useRef(0)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // Сбрасываем время и кеш при смене видео
  useEffect(() => {
    setCurrentDisplayTime(0)
    videoElementRef.current = null
    lastBackendSyncRef.current = 0
  }, [videoId])

  // Обновляем время при изменении initialTime (важно для тестов и синхронизации с backend)
  useEffect(() => {
    setCurrentDisplayTime(initialTime)
  }, [initialTime])

  // Мемоизированный callback для оптимизации
  const handleBackendSync = useCallback(
    (time: number) => {
      onBackendSync?.(time)
    },
    [onBackendSync],
  )

  useEffect(() => {
    // Если не воспроизводится, останавливаем цикл
    if (!isPlaying) {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current)
      }
      rafIdRef.current = undefined
      return
    }

    // Находим video элемент при старте или кешируем его
    if (!videoElementRef.current) {
      const videoElement = document.querySelector(videoSelector) as HTMLVideoElement
      if (videoElement) {
        videoElementRef.current = videoElement
        // Устанавливаем начальное время из video элемента
        setCurrentDisplayTime(videoElement.currentTime)
      }
    }

    const updatePlaybackTime = () => {
      const videoElement = videoElementRef.current

      if (!videoElement) {
        // Пробуем найти элемент снова
        const foundElement = document.querySelector(videoSelector) as HTMLVideoElement
        if (foundElement) {
          videoElementRef.current = foundElement
        } else {
          // Если элемент не найден, продолжаем цикл
          rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
          return
        }
      }

      const element = videoElementRef.current
      if (!element) {
        rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
        return
      }

      // Если видео закончилось - останавливаем цикл
      // Примечание: НЕ проверяем element.paused здесь, т.к. видео может быть
      // на паузе пока загружается, но isPlaying уже true. Цикл остановится
      // через cleanup useEffect когда isPlaying станет false.
      if (element.ended) {
        return
      }

      const currentTime = element.currentTime

      // L1: Обновляем локальное состояние каждый кадр
      setCurrentDisplayTime(currentTime)

      // L2: Периодическая синхронизация с backend
      const now = performance.now()
      if (now - lastBackendSyncRef.current >= syncInterval) {
        handleBackendSync(currentTime)
        lastBackendSyncRef.current = now
      }

      rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
    }

    // Запускаем цикл обновления
    rafIdRef.current = requestAnimationFrame(updatePlaybackTime)

    return () => {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current)
      }
      rafIdRef.current = undefined
    }
  }, [isPlaying, videoSelector, syncInterval, handleBackendSync])

  // Очищаем кеш video элемента при размонтировании
  useEffect(() => {
    return () => {
      videoElementRef.current = null
    }
  }, [])

  return currentDisplayTime
}
