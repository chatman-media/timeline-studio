import { RefObject, useEffect } from "react"

export interface VideoEventHandlers {
  /**
   * Вызывается когда видео начинает воспроизведение
   */
  onPlay?: () => void

  /**
   * Вызывается когда видео приостановлено
   */
  onPause?: () => void

  /**
   * Вызывается когда начинается seek операция
   */
  onSeeking?: () => void

  /**
   * Вызывается когда seek операция завершена
   */
  onSeeked?: () => void

  /**
   * Вызывается когда видео достигло конца
   */
  onEnded?: () => void

  /**
   * Вызывается при обновлении времени воспроизведения
   * Внимание: вызывается очень часто (~4 раза в секунду), используйте с осторожностью
   */
  onTimeUpdate?: (time: number) => void

  /**
   * Вызывается когда длительность видео изменилась
   */
  onDurationChange?: (duration: number) => void

  /**
   * Вызывается при ошибке воспроизведения
   */
  onError?: (error: Error) => void

  /**
   * Вызывается когда видео готово к воспроизведению
   */
  onCanPlay?: () => void

  /**
   * Вызывается когда видео полностью загружено
   */
  onLoadedData?: () => void

  /**
   * Вызывается когда метаданные видео загружены
   */
  onLoadedMetadata?: (metadata: { duration: number; videoWidth: number; videoHeight: number }) => void

  /**
   * Вызывается когда начинается загрузка видео
   */
  onLoadStart?: () => void

  /**
   * Вызывается когда видео ждет данных для продолжения воспроизведения
   */
  onWaiting?: () => void

  /**
   * Вызывается когда скорость воспроизведения изменилась
   */
  onRateChange?: (rate: number) => void

  /**
   * Вызывается когда громкость изменилась
   */
  onVolumeChange?: (volume: number, muted: boolean) => void
}

/**
 * Хук для подписки на события video элемента
 *
 * Предоставляет удобный способ обработки событий HTML5 video без необходимости
 * вручную управлять addEventListener/removeEventListener.
 *
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null)
 *
 * useVideoEvents(videoRef, {
 *   onPlay: () => console.log('Started playing'),
 *   onPause: () => console.log('Paused'),
 *   onEnded: () => {
 *     // Синхронизация с backend
 *     backendSync.executeCommand({ type: "PlaybackEnded" })
 *   },
 *   onError: (error) => {
 *     console.error('Video error:', error)
 *   }
 * })
 *
 * return <video ref={videoRef} src={src} />
 * ```
 */
export function useVideoEvents(videoRef: RefObject<HTMLVideoElement | null>, handlers: VideoEventHandlers) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Play event
    const handlePlay = () => {
      handlers.onPlay?.()
    }

    // Pause event
    const handlePause = () => {
      handlers.onPause?.()
    }

    // Seeking event
    const handleSeeking = () => {
      handlers.onSeeking?.()
    }

    // Seeked event
    const handleSeeked = () => {
      handlers.onSeeked?.()
    }

    // Ended event
    const handleEnded = () => {
      handlers.onEnded?.()
    }

    // Time update event
    const handleTimeUpdate = () => {
      handlers.onTimeUpdate?.(video.currentTime)
    }

    // Duration change event
    const handleDurationChange = () => {
      if (!Number.isNaN(video.duration) && Number.isFinite(video.duration)) {
        handlers.onDurationChange?.(video.duration)
      }
    }

    // Error event
    const handleError = () => {
      const error = video.error
      if (error) {
        const errorMessage = error.message || `Media error code: ${error.code}`
        handlers.onError?.(new Error(errorMessage))
      }
    }

    // Can play event
    const handleCanPlay = () => {
      handlers.onCanPlay?.()
    }

    // Loaded data event
    const handleLoadedData = () => {
      handlers.onLoadedData?.()
    }

    // Loaded metadata event
    const handleLoadedMetadata = () => {
      handlers.onLoadedMetadata?.({
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      })
    }

    // Load start event
    const handleLoadStart = () => {
      handlers.onLoadStart?.()
    }

    // Waiting event
    const handleWaiting = () => {
      handlers.onWaiting?.()
    }

    // Rate change event
    const handleRateChange = () => {
      handlers.onRateChange?.(video.playbackRate)
    }

    // Volume change event
    const handleVolumeChange = () => {
      handlers.onVolumeChange?.(video.volume, video.muted)
    }

    // Регистрируем обработчики
    if (handlers.onPlay) video.addEventListener("play", handlePlay)
    if (handlers.onPause) video.addEventListener("pause", handlePause)
    if (handlers.onSeeking) video.addEventListener("seeking", handleSeeking)
    if (handlers.onSeeked) video.addEventListener("seeked", handleSeeked)
    if (handlers.onEnded) video.addEventListener("ended", handleEnded)
    if (handlers.onTimeUpdate) video.addEventListener("timeupdate", handleTimeUpdate)
    if (handlers.onDurationChange) video.addEventListener("durationchange", handleDurationChange)
    if (handlers.onError) video.addEventListener("error", handleError)
    if (handlers.onCanPlay) video.addEventListener("canplay", handleCanPlay)
    if (handlers.onLoadedData) video.addEventListener("loadeddata", handleLoadedData)
    if (handlers.onLoadedMetadata) video.addEventListener("loadedmetadata", handleLoadedMetadata)
    if (handlers.onLoadStart) video.addEventListener("loadstart", handleLoadStart)
    if (handlers.onWaiting) video.addEventListener("waiting", handleWaiting)
    if (handlers.onRateChange) video.addEventListener("ratechange", handleRateChange)
    if (handlers.onVolumeChange) video.addEventListener("volumechange", handleVolumeChange)

    // Очистка при размонтировании
    return () => {
      if (handlers.onPlay) video.removeEventListener("play", handlePlay)
      if (handlers.onPause) video.removeEventListener("pause", handlePause)
      if (handlers.onSeeking) video.removeEventListener("seeking", handleSeeking)
      if (handlers.onSeeked) video.removeEventListener("seeked", handleSeeked)
      if (handlers.onEnded) video.removeEventListener("ended", handleEnded)
      if (handlers.onTimeUpdate) video.removeEventListener("timeupdate", handleTimeUpdate)
      if (handlers.onDurationChange) video.removeEventListener("durationchange", handleDurationChange)
      if (handlers.onError) video.removeEventListener("error", handleError)
      if (handlers.onCanPlay) video.removeEventListener("canplay", handleCanPlay)
      if (handlers.onLoadedData) video.removeEventListener("loadeddata", handleLoadedData)
      if (handlers.onLoadedMetadata) video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      if (handlers.onLoadStart) video.removeEventListener("loadstart", handleLoadStart)
      if (handlers.onWaiting) video.removeEventListener("waiting", handleWaiting)
      if (handlers.onRateChange) video.removeEventListener("ratechange", handleRateChange)
      if (handlers.onVolumeChange) video.removeEventListener("volumechange", handleVolumeChange)
    }
  }, [videoRef, handlers])
}
