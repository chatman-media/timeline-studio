/**
 * Компонент для просмотра всех углов камер в мультикамерном режиме
 */

import { Camera, Pause, Play } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import type { MulticamAngle } from "../hooks/use-multicam"
import { useMulticam } from "../hooks/use-multicam"
import { SyncControls } from "./sync-controls"

const logger = createLogger({ module: "AngleViewer" })

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
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({})

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
            video.currentTime = currentTime + offset
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
            logger.info("[AngleViewer] Sync completed")
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
          <div
            key={angle.id}
            className={cn(
              "relative group cursor-pointer overflow-hidden rounded-lg bg-black",
              "border-2 transition-all",
              angle.isActive
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-muted hover:border-muted-foreground",
            )}
            onClick={() => handleAngleClick(angle, index)}
          >
            {/* Видео превью */}
            <div className="aspect-video relative">
              <video
                ref={(el) => {
                  videoRefs.current[index] = el
                }}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                onError={() => {
                  setLoadErrors((prev) => ({ ...prev, [angle.id]: true }))
                }}
                onLoadedData={() => {
                  setLoadErrors((prev) => ({ ...prev, [angle.id]: false }))
                }}
              >
                {/* Используем путь к медиафайлу или preview */}
                {angle.mediaPath && <source src={`media-loader://${angle.mediaPath}`} type="video/mp4" />}
                {angle.preview && <source src={angle.preview} type="video/mp4" />}
              </video>

              {/* Показываем заглушку при ошибке загрузки */}
              {loadErrors[angle.id] && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Затемнение для неактивных */}
              {!angle.isActive && (
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              )}
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
            {multicam.isSync && Math.abs(multicam.syncOffsets[index] || 0) > 0.1 && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs">
                  {multicam.syncOffsets[index] > 0 ? "+" : ""}
                  {multicam.syncOffsets[index]?.toFixed(1)}s
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
