import { useCallback, useEffect, useRef, useState } from "react"

export interface PlaybackTimeSyncOptions {
  isPlaying: boolean
  videoId?: string | null
  videoSelector?: string
  syncInterval?: number
  onBackendSync?: (time: number) => void
  initialTime?: number
}

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

  useEffect(() => {
    setCurrentDisplayTime(0)
    videoElementRef.current = null
    lastBackendSyncRef.current = 0
  }, [videoId])

  useEffect(() => {
    setCurrentDisplayTime(initialTime)
  }, [initialTime])

  const handleBackendSync = useCallback(
    (time: number) => {
      onBackendSync?.(time)
    },
    [onBackendSync],
  )

  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current)
      }
      rafIdRef.current = undefined
      return
    }

    if (!videoElementRef.current) {
      const videoElement = document.querySelector(videoSelector) as HTMLVideoElement
      if (videoElement) {
        videoElementRef.current = videoElement
        setCurrentDisplayTime(videoElement.currentTime)
      }
    }

    const updatePlaybackTime = () => {
      const videoElement = videoElementRef.current

      if (!videoElement) {
        const foundElement = document.querySelector(videoSelector) as HTMLVideoElement
        if (foundElement) {
          videoElementRef.current = foundElement
        } else {
          rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
          return
        }
      }

      const element = videoElementRef.current
      if (!element) {
        rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
        return
      }

      if (element.ended) {
        return
      }

      const currentTime = element.currentTime
      setCurrentDisplayTime(currentTime)

      const now = performance.now()
      if (now - lastBackendSyncRef.current >= syncInterval) {
        handleBackendSync(currentTime)
        lastBackendSyncRef.current = now
      }

      rafIdRef.current = requestAnimationFrame(updatePlaybackTime)
    }

    rafIdRef.current = requestAnimationFrame(updatePlaybackTime)

    return () => {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current)
      }
      rafIdRef.current = undefined
    }
  }, [isPlaying, videoSelector, syncInterval, handleBackendSync])

  useEffect(() => {
    return () => {
      videoElementRef.current = null
    }
  }, [])

  return currentDisplayTime
}
