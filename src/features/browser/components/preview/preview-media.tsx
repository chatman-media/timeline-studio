import { memo, useCallback, useState } from "react"

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

      {/* Video on hover */}
      {showVideo && (
        <video
          src={videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={handleVideoError}
        />
      )}
    </div>
  )
})
