/**
 * Компонент для просмотра всех углов камер в мультикамерном режиме
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Camera, Pause, Play } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
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
      data-oid="e.a43n2"
    >
      {/* Видео превью */}
      <div className="aspect-video relative" data-oid="q2ha47g">
        <video
          ref={setVideoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          loop
          onError={() => {
            setLoadError(true)
            logger.error("[AngleVideoItem] Video load error", {
              angle: angle.id,
            })
          }}
          onLoadedData={() => {
            setLoadError(false)
          }}
          data-oid="8hdn_ct"
        >
          {/* Загружаем видео только если оно было видимым хотя бы раз */}
          {hasBeenVisible && angle.mediaPath && (
            <source src={`media-loader://${angle.mediaPath}`} type="video/mp4" data-oid="175ufg6" />
          )}
          {hasBeenVisible && angle.preview && <source src={angle.preview} type="video/mp4" data-oid="ry.pvjd" />}
        </video>

        {/* Показываем заглушку при ошибке загрузки */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2" data-oid="zd.x7ae">
            <Camera className="w-8 h-8 text-muted-foreground" data-oid="jamnlyd" />
            <span className="text-xs text-muted-foreground" data-oid="6gs2k_8">
              Ошибка загрузки видео
            </span>
          </div>
        )}

        {/* Показываем placeholder пока не загружено */}
        {!hasBeenVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted" data-oid="2bscw4f">
            <Camera className="w-8 h-8 text-muted-foreground animate-pulse" data-oid="ub04mhz" />
          </div>
        )}

        {/* Затемнение для неактивных */}
        {!angle.isActive && (
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" data-oid="p9dwtch" />
        )}
      </div>

      {/* Метка камеры */}
      {showLabels && (
        <div className="absolute top-2 left-2" data-oid="vnod9:c">
          <Badge variant={angle.isActive ? "default" : "secondary"} data-oid="k58ku_e">
            {angle.name}
          </Badge>
        </div>
      )}

      {/* Номер камеры */}
      <div className="absolute bottom-2 right-2" data-oid="8l53n0r">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            angle.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
          data-oid="-qki3-m"
        >
          {index + 1}
        </div>
      </div>

      {/* Таймкод */}
      {showTimecode && (
        <div className="absolute bottom-2 left-2" data-oid=".yp18zy">
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded" data-oid="3f2su00">
            00:00:00
          </div>
        </div>
      )}

      {/* Индикатор синхронизации */}
      {Math.abs(syncOffset) > 0.1 && (
        <div className="absolute top-2 right-2" data-oid=":0.fyye">
          <Badge variant="outline" className="text-xs" data-oid="xcd3__u">
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
      <div className={cn("flex items-center justify-center p-8 text-muted-foreground", className)} data-oid="t69xezz">
        <div className="text-center" data-oid="r1br25o">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" data-oid="0939xl9" />
          <p data-oid="puc2d76">Нет доступных углов камер</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} data-oid="jl_uj.s">
      {/* Контролы воспроизведения и синхронизации */}
      <div className="absolute top-2 right-2 z-10 flex gap-2" data-oid="q4o35ri">
        <SyncControls
          baseClipId={baseClipId}
          className="shadow-lg"
          onSyncComplete={() => {
            console.log("[AngleViewer] Sync completed")
          }}
          data-oid="6rfvcj_"
        />

        <Button size="sm" variant="secondary" onClick={togglePlayback} className="shadow-lg" data-oid="m22kal4">
          {isPlaying ? (
            <Pause className="w-4 h-4" data-oid="13mtnum" />
          ) : (
            <Play className="w-4 h-4" data-oid="cx5z.fr" />
          )}
        </Button>
      </div>

      {/* Сетка с углами камер */}
      <div
        className="grid gap-2 p-2"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
        data-oid="wzy_8-8"
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
            data-oid="rkh.3r6"
          />
        ))}
      </div>
    </div>
  )
}
