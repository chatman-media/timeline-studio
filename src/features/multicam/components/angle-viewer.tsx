/**
 * Компонент для просмотра всех углов камер в мультикамерном режиме
 */

import { Camera, Pause, Play } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import type { MulticamAngle } from "../hooks/use-multicam"
import { useMulticam } from "../hooks/use-multicam"
import { useVideoLazyLoading } from "../hooks/use-video-lazy-loading"
import { SyncControls } from "./sync-controls"

const logger = createLogger({ module: "AngleViewer" })

/**
 * Компонент для отдельного угла камеры с lazy loading
 */
interface AngleVideoItemProps {
  angle: MulticamAngle
  index: number
  syncOffset: number
  showLabels: boolean
  showTimecode: boolean
  onClick: (angle: MulticamAngle, index: number) => void
  onVideoRef: (index: number, video: HTMLVideoElement | null) => void
}

const AngleVideoItem = memo(function AngleVideoItem({
  angle,
  index,
  syncOffset,
  showLabels,
  showTimecode,
  onClick,
  onVideoRef,
}: AngleVideoItemProps) {
  const [loadError, setLoadError] = useState(false)
  const { ref: lazyRef, hasBeenVisible } = useVideoLazyLoading({
    threshold: 0.1,
    rootMargin: "100px",
  })

  // Комбинированный ref для video и lazy loading
  const setVideoRef = useCallback(
    (video: HTMLVideoElement | null) => {
      lazyRef(video)
      onVideoRef(index, video)
    },
    [lazyRef, onVideoRef, index],
  )

  const handleClick = useCallback(() => {
    onClick(angle, index)
  }, [onClick, angle, index])

  return (
    <div
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-lg bg-black",
        "border-2 transition-all",
        angle.isActive
          ? "border-primary ring-2 ring-primary ring-offset-2"
          : "border-muted hover:border-muted-foreground",
      )}
      onClick={handleClick}
    >
      {/* Видео превью */}
      <div className="aspect-video relative">
        <video
          ref={setVideoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          loop
          onError={() => {
            setLoadError(true)
            logger.error("[AngleVideoItem] Video load error", { angle: angle.id })
          }}
          onLoadedData={() => {
            setLoadError(false)
          }}
        >
          {/* Загружаем видео только если оно было видимым хотя бы раз */}
          {hasBeenVisible && angle.mediaPath && <source src={`media-loader://${angle.mediaPath}`} type="video/mp4" />}
          {hasBeenVisible && angle.preview && <source src={angle.preview} type="video/mp4" />}
        </video>

        {/* Показываем заглушку при ошибке загрузки */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
            <Camera className="w-8 h-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Ошибка загрузки видео</span>
          </div>
        )}

        {/* Показываем placeholder пока не загружено */}
        {!hasBeenVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Camera className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        )}

        {/* Затемнение для неактивных */}
        {!angle.isActive && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />}
      </div>

      {/* Метка камеры */}
      {showLabels && (
        <div className="absolute top-2 left-2">
          <Badge variant={angle.isActive ? "default" : "secondary"}>{angle.name}</Badge>
        </div>
      )}

      {/* Номер камеры */}
      <div className="absolute bottom-2 right-2">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            angle.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {index + 1}
        </div>
      </div>

      {/* Таймкод */}
      {showTimecode && (
        <div className="absolute bottom-2 left-2">
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">00:00:00</div>
        </div>
      )}

      {/* Индикатор синхронизации */}
      {Math.abs(syncOffset) > 0.1 && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-xs">
            {syncOffset > 0 ? "+" : ""}
            {syncOffset.toFixed(1)}s
          </Badge>
        </div>
      )}
    </div>
  )
})

interface AngleViewerProps {
  /**
   * ID базового клипа для мультикамерной группы
   */
  baseClipId: string

  /**
   * Максимальное количество колонок в сетке
   */
  maxColumns?: number

  /**
   * Показывать ли метки камер
   */
  showLabels?: boolean

  /**
   * Показывать ли таймкод
   */
  showTimecode?: boolean

  /**
   * Обработчик клика по углу
   */
  onAngleClick?: (angle: MulticamAngle, index: number) => void

  /**
   * Класс для контейнера
   */
  className?: string
}

export function AngleViewer({
  baseClipId,
  maxColumns = 2,
  showLabels = true,
  showTimecode = false,
  onAngleClick,
  className,
}: AngleViewerProps) {
  const multicam = useMulticam(baseClipId)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  // Вычисляем оптимальное количество колонок для сетки
  const getOptimalColumns = (count: number): number => {
    if (count <= 1) return 1
    if (count <= 4) return 2
    if (count <= 9) return 3
    if (count <= 16) return 4
    return Math.min(maxColumns, Math.ceil(Math.sqrt(count)))
  }

  const columns = getOptimalColumns(multicam.angles.length)

  // Обработчик клика по углу
  const handleAngleClick = useCallback(
    (angle: MulticamAngle, index: number) => {
      // Переключаемся на выбранный угол
      multicam.switchToAngle(index)

      // Вызываем внешний обработчик если есть
      onAngleClick?.(angle, index)
    },
    [multicam, onAngleClick],
  )

  // Управление воспроизведением
  const togglePlayback = useCallback(() => {
    const newIsPlaying = !isPlaying
    setIsPlaying(newIsPlaying)

    // Синхронизируем воспроизведение всех видео
    videoRefs.current.forEach((video) => {
      if (video) {
        if (newIsPlaying) {
          video.play().catch((error) => logger.error("Operation failed", { error }))
        } else {
          video.pause()
        }
      }
    })
  }, [isPlaying])

  // Синхронизация времени при изменении активного угла
  useEffect(() => {
    if (multicam.activeAngle) {
      const activeVideo = videoRefs.current[multicam.activeAngleIndex]
      if (activeVideo) {
        const currentTime = activeVideo.currentTime

        // Синхронизируем остальные видео
        videoRefs.current.forEach((video, index) => {
          if (video && index !== multicam.activeAngleIndex) {
            const offset = multicam.syncOffsets[index] || 0
            // ИСПРАВЛЕНО: если offset положительный, значит этот клип опережает базовый
            // поэтому вычитаем offset из текущего времени
            video.currentTime = currentTime - offset
          }
        })
      }
    }
  }, [multicam.activeAngleIndex, multicam.activeAngle, multicam.syncOffsets])

  if (multicam.angles.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-muted-foreground", className)}>
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Нет доступных углов камер</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Контролы воспроизведения и синхронизации */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <SyncControls
          baseClipId={baseClipId}
          className="shadow-lg"
          onSyncComplete={() => {
            console.log("[AngleViewer] Sync completed")
          }}
        />
        <Button size="sm" variant="secondary" onClick={togglePlayback} className="shadow-lg">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>

      {/* Сетка с углами камер */}
      <div
        className="grid gap-2 p-2"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {multicam.angles.map((angle, index) => (
          <AngleVideoItem
            key={angle.id}
            angle={angle}
            index={index}
            syncOffset={multicam.syncOffsets[index] || 0}
            showLabels={showLabels}
            showTimecode={showTimecode}
            onClick={handleAngleClick}
            onVideoRef={(idx, video) => {
              videoRefs.current[idx] = video
            }}
          />
        ))}
      </div>
    </div>
  )
}
