import { useEffect, useMemo, useRef, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { frameExtractionService } from "@/domains/video-editing/services/compiler"
import { useSmartTimelinePreviews } from "@/features/video-compiler/hooks/use-frame-extraction"
import { cn } from "@/lib/utils"

export interface TimelinePreviewStripProps {
  /** Путь к видео файлу */
  videoPath: string | null
  /** Длительность видео в секундах */
  duration: number
  /** Ширина контейнера */
  containerWidth: number
  /** Масштаб timeline (пиксели на секунду) */
  scale: number
  /** Смещение прокрутки */
  scrollOffset?: number
  /** Высота полосы превью */
  height?: number
  /** Класс для стилизации */
  className?: string
  /** Обработчик клика на кадр */
  onFrameClick?: (timestamp: number) => void
  /** Показывать ли временные метки */
  showTimestamps?: boolean
}

export function TimelinePreviewStrip({
  videoPath,
  duration,
  containerWidth,
  scale,
  scrollOffset = 0,
  height = 60,
  className,
  onFrameClick,
  showTimestamps = false,
}: TimelinePreviewStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: duration })

  const { frames, isLoading, error, progress, frameWidth } = useSmartTimelinePreviews(
    videoPath,
    duration,
    containerWidth,
    {
      cacheResults: true,
      interval: 1.0,
    },
  )

  // Вычисляем видимый диапазон на основе прокрутки
  useEffect(() => {
    const startTime = scrollOffset / scale
    const endTime = startTime + containerWidth / scale
    setVisibleRange({
      start: Math.max(0, startTime),
      end: Math.min(duration, endTime),
    })
  }, [scrollOffset, containerWidth, scale, duration])

  // Фильтруем только видимые кадры
  const visibleFrames = useMemo(() => {
    return frames.filter((frame) => frame.timestamp >= visibleRange.start && frame.timestamp <= visibleRange.end)
  }, [frames, visibleRange])

  // Обработчик клика на кадр
  const handleFrameClick = (timestamp: number) => {
    onFrameClick?.(timestamp)
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }} data-oid="76jp-_n">
        <span className="text-sm text-destructive" data-oid="aae7b9-">
          Ошибка загрузки превью
        </span>
      </div>
    )
  }

  if (isLoading && frames.length === 0) {
    return (
      <div className={cn("flex items-center gap-1 p-1", className)} style={{ height }} data-oid="62xoykb">
        {Array.from({
          length: Math.min(10, Math.floor(containerWidth / frameWidth)),
        }).map((_, i) => (
          <Skeleton
            key={i}
            className="rounded"
            style={{ width: frameWidth - 4, height: height - 8 }}
            data-oid="nu0x:fp"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-background/50", className)}
      style={{ height }}
      data-oid="un1kcs1"
    >
      {/* Прогресс загрузки */}
      {isLoading && progress < 100 && (
        <div className="absolute inset-x-0 top-0 h-1 bg-muted" data-oid="1381s2o">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            data-oid="dbdkv.q"
          />
        </div>
      )}

      {/* Контейнер для кадров */}
      <div
        className="absolute inset-0 flex items-center"
        style={{
          transform: `translateX(-${scrollOffset}px)`,
          width: `${duration * scale}px`,
        }}
        data-oid="t2flgx4"
      >
        {frames.map((frame, index) => (
          <PreviewFrame
            key={`${frame.timestamp}-${index}`}
            frame={frame}
            scale={scale}
            height={height}
            showTimestamp={showTimestamps}
            isKeyframe={frame.isKeyframe}
            onClick={() => handleFrameClick(frame.timestamp)}
            data-oid="7khwhe4"
          />
        ))}
      </div>

      {/* Оверлей для текущей позиции воспроизведения */}
      {/* TODO: Добавить индикатор текущей позиции */}
    </div>
  )
}

interface PreviewFrameProps {
  frame: {
    timestamp: number
    frameData: string
    isKeyframe: boolean
  }
  scale: number
  height: number
  showTimestamp: boolean
  isKeyframe: boolean
  onClick: () => void
}

function PreviewFrame({ frame, scale, height, showTimestamp, isKeyframe, onClick }: PreviewFrameProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Позиция кадра на timeline
  const position = frame.timestamp * scale

  useEffect(() => {
    if (imgRef.current) {
      const img = frameExtractionService.createPreviewElement(frame.frameData, frame.timestamp)
      img.onload = () => setIsLoaded(true)
      img.className = "w-full h-full object-cover"

      // Заменяем содержимое
      if (imgRef.current) {
        imgRef.current.src = img.src
      }
    }
  }, [frame.frameData, frame.timestamp])

  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-opacity hover:opacity-80",
        isKeyframe && "ring-2 ring-primary ring-offset-1",
      )}
      style={{
        left: `${position}px`,
        transform: "translateX(-50%)",
        height: height - 8,
        width: "auto",
        maxWidth: 120,
        top: 4,
      }}
      onClick={onClick}
      title={`${frame.timestamp.toFixed(2)}s${isKeyframe ? " (Ключевой кадр)" : ""}`}
      data-oid="ncl3uz-"
    >
      {/* Изображение */}
      <div className="relative h-full overflow-hidden rounded border border-border" data-oid="_ayanus">
        {!isLoaded && <Skeleton className="absolute inset-0" data-oid="u3yr-lw" />}
        {}
        <img
          ref={imgRef}
          alt={`Frame at ${frame.timestamp}s`}
          className={cn("h-full w-auto object-cover transition-opacity", !isLoaded && "opacity-0")}
          loading="lazy"
          data-oid="pwvul-k"
        />
      </div>

      {/* Временная метка */}
      {showTimestamp && (
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap"
          data-oid="c:.:7sd"
        >
          {formatTimestamp(frame.timestamp)}
        </div>
      )}

      {/* Индикатор ключевого кадра */}
      {isKeyframe && (
        <div
          className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center"
          data-oid="nu35rd8"
        >
          <span className="text-[8px] text-primary-foreground font-bold" data-oid="yfh-nee">
            K
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Форматировать временную метку
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)

  return `${minutes}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
}

/**
 * Hook для использования превью strip в timeline
 */
export function useTimelinePreviewStrip(_videoPath: string | null, _duration: number) {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  return {
    containerRef,
    containerWidth,
  }
}
