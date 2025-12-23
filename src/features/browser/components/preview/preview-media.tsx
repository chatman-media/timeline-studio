import { memo, useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface PreviewMediaProps {
  /** URL изображения */
  thumbnailUrl?: string

  /** URL видео для hover */
  videoUrl?: string

  /** Показывать видео при hover */
  showVideoOnHover?: boolean

  /** Ширина */
  width: number

  /** Высота */
  height: number

  /** Альтернативный текст */
  alt?: string

  /** CSS классы */
  className?: string

  /** Плейсхолдер если нет изображения */
  placeholder?: React.ReactNode
}

/**
 * Компонент для отображения медиа в превью
 * Поддерживает изображения и видео при hover
 */
export const PreviewMedia = memo(function PreviewMedia({
  thumbnailUrl,
  videoUrl,
  showVideoOnHover = false,
  width,
  height,
  alt = "",
  className,
  placeholder,
}: PreviewMediaProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (showVideoOnHover && videoUrl) {
      setIsHovered(true)
    }
  }, [showVideoOnHover, videoUrl])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleVideoError = useCallback(() => {
    setVideoError(true)
    setIsHovered(false)
  }, [])

  // Управляем воспроизведением видео при hover
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      console.log("[PreviewMedia] No video ref")
      return
    }

    console.log("[PreviewMedia] showVideo changed:", {
      showVideo,
      paused: video.paused,
      currentTime: video.currentTime,
      videoSrc: video.src,
      muted: video.muted,
    })

    if (showVideo) {
      // Запускаем воспроизведение при hover
      video.currentTime = 0
      console.log("[PreviewMedia] Starting video playback")
      video.play().catch((error) => {
        console.warn("[PreviewMedia] Failed to play preview video:", error)
      })
    } else {
      // Останавливаем при уходе мыши
      console.log("[PreviewMedia] Stopping video playback")
      video.pause()
      video.currentTime = 0
    }
  }, [showVideo])

  // Очищаем видео при размонтировании
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ""
      }
    }
  }, [])

  const showVideo = isHovered && videoUrl && !videoError

  // Если нет изображения или ошибка - показываем плейсхолдер
  if (!thumbnailUrl || imageError) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted", className)}
        style={{ width, height }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {placeholder || <div className="text-muted-foreground text-xs">No preview</div>}
      </div>
    )
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail image */}
      <img
        src={thumbnailUrl}
        alt={alt}
        className={cn("h-full w-full object-cover transition-opacity duration-200", showVideo && "opacity-0")}
        onError={handleImageError}
        loading="lazy"
      />

      {/* Video on hover - всегда в DOM для контроля через ref */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            showVideo ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          muted
          loop
          playsInline
          onError={handleVideoError}
        />
      )}
    </div>
  )
})
