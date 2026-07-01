import { useNotifications } from "@timeline-studio/core/hooks"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { YoloVideoData } from "@/features/recognition/types/yolo"

interface YoloTrackOverlayProps {
  yoloData: YoloVideoData
  currentTime: number
  width?: number
  height?: number
  showTrajectories?: boolean
}

/**
 * Компонент для отображения треков объектов YOLO
 * Показывает траектории движения объектов во времени
 */
export function YoloTrackOverlay({
  yoloData,
  currentTime,
  width = 400,
  height = 300,
  showTrajectories: initialShowTrajectories = true,
}: YoloTrackOverlayProps) {
  const { t } = useTranslation()
  const { showInfo } = useNotifications()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [showTrajectories, setShowTrajectories] = useState(initialShowTrajectories)
  const [trackHistory, setTrackHistory] = useState<
    Map<
      string,
      Array<{
        timestamp: number
        x: number
        y: number
        class: string
      }>
    >
  >(new Map())

  // Цвета для разных классов объектов
  const classColors: Record<string, string> = {
    person: "#FF6B6B",
    car: "#4ECDC4",
    dog: "#45B7D1",
    cat: "#F9CA24",
    bicycle: "#6C5CE7",
    motorcycle: "#A29BFE",
    bus: "#FD79A8",
    truck: "#00B894",
  }

  const getColorForClass = (className: string): string => {
    return classColors[className] || "#95A5A6"
  }

  // Обновляем историю треков
  useEffect(() => {
    const newTrackHistory = new Map<
      string,
      Array<{
        timestamp: number
        x: number
        y: number
        class: string
      }>
    >()

    // Группируем обнаружения по трекам (используем простую эвристику)
    yoloData.frames.forEach((frame) => {
      frame.detections.forEach((detection, _index) => {
        // Простая эвристика для создания треков - используем комбинацию класса и позиции
        const trackId = `${detection.class}_${Math.floor(detection.bbox.x * 10)}_${Math.floor(detection.bbox.y * 10)}`

        if (!newTrackHistory.has(trackId)) {
          newTrackHistory.set(trackId, [])
        }

        const track = newTrackHistory.get(trackId)!

        // Добавляем точку только если она не слишком близко к предыдущей
        const lastPoint = track[track.length - 1]
        const centerX = detection.bbox.x + detection.bbox.width / 2
        const centerY = detection.bbox.y + detection.bbox.height / 2

        if (
          !lastPoint ||
          Math.abs(lastPoint.timestamp - frame.timestamp) > 0.5 ||
          Math.abs(lastPoint.x - centerX) > 0.05 ||
          Math.abs(lastPoint.y - centerY) > 0.05
        ) {
          track.push({
            timestamp: frame.timestamp,
            x: centerX,
            y: centerY,
            class: detection.class,
          })
        }
      })
    })

    // Фильтруем треки с минимальным количеством точек
    const filteredTracks = new Map()
    newTrackHistory.forEach((track, trackId) => {
      if (track.length >= 3) {
        // Минимум 3 точки для трека
        filteredTracks.set(trackId, track)
      }
    })

    setTrackHistory(filteredTracks)
  }, [yoloData])

  // Рисуем треки
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height)

    // Настраиваем размеры с учетом DPI
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Рисуем фон
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
    ctx.fillRect(0, 0, width, height)

    if (!showTrajectories) return

    // Рисуем треки
    trackHistory.forEach((track, trackId) => {
      const className = track[0]?.class || "unknown"
      const color = getColorForClass(className)
      const isSelected = selectedTrack === trackId

      // Фильтруем точки до текущего времени
      const visibleTrack = track.filter((point) => point.timestamp <= currentTime)

      if (visibleTrack.length < 2) return

      // Рисуем траекторию
      ctx.strokeStyle = isSelected ? color : `${color}80` // 50% прозрачности для невыбранных
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      ctx.beginPath()
      visibleTrack.forEach((point, index) => {
        const x = point.x * width
        const y = point.y * height

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Рисуем точки трека
      visibleTrack.forEach((point, index) => {
        const x = point.x * width
        const y = point.y * height
        const isCurrentPoint = index === visibleTrack.length - 1

        // Размер точки зависит от того, является ли она текущей
        const radius = isCurrentPoint ? 6 : 3

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()

        // Обводка для текущей точки
        if (isCurrentPoint) {
          ctx.strokeStyle = "#FFFFFF"
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      // Подпись для выбранного трека
      if (isSelected && visibleTrack.length > 0) {
        const lastPoint = visibleTrack[visibleTrack.length - 1]
        const x = lastPoint.x * width
        const y = lastPoint.y * height

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        ctx.fillRect(x + 10, y - 20, 80, 20)

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "12px Arial"
        ctx.fillText(className, x + 15, y - 5)
      }
    })

    // Рисуем текущие обнаружения
    const currentFrame = yoloData.frames.find((frame) => Math.abs(frame.timestamp - currentTime) < 0.5)

    if (currentFrame) {
      currentFrame.detections.forEach((detection) => {
        const x = (detection.bbox.x + detection.bbox.width / 2) * width
        const y = (detection.bbox.y + detection.bbox.height / 2) * height
        const color = getColorForClass(detection.class)

        // Рисуем пульсирующий круг для текущих обнаружений
        const pulseRadius = 8 + Math.sin(Date.now() / 200) * 2

        ctx.fillStyle = `${color}40` // 25% прозрачности
        ctx.beginPath()
        ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI)
        ctx.fill()

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }
  }, [trackHistory, currentTime, width, height, showTrajectories, selectedTrack, yoloData])

  // Обработчик клика по треку
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = (event.clientX - rect.left) / width
    const clickY = (event.clientY - rect.top) / height

    // Находим ближайший трек к клику
    let closestTrack: string | null = null
    let minDistance = Number.POSITIVE_INFINITY

    trackHistory.forEach((track, trackId) => {
      const visibleTrack = track.filter((point) => point.timestamp <= currentTime)

      visibleTrack.forEach((point) => {
        const distance = Math.sqrt((point.x - clickX) ** 2 + (point.y - clickY) ** 2)

        if (distance < 0.05 && distance < minDistance) {
          // 5% от размера canvas
          minDistance = distance
          closestTrack = trackId
        }
      })
    })

    if (closestTrack) {
      setSelectedTrack(selectedTrack === closestTrack ? null : closestTrack)

      // Показываем информацию о треке
      const track = trackHistory.get(closestTrack)
      if (track) {
        const className = track[0]?.class || "unknown"
        const trackLength = track.length

        showInfo(
          `${t("recognition.yolo.trackSelectedTitle")}: ${className}`,
          `${t("recognition.yolo.pointsInTrack")}: ${trackLength}`,
        )
      }
    } else {
      setSelectedTrack(null)
    }
  }

  return (
    <div className="space-y-4" data-oid="z-.pyx7">
      <div className="flex items-center justify-between" data-oid="atzd86.">
        <h3 className="text-lg font-semibold" data-oid="-jtzrbv">
          {t("recognition.yolo.objectTracksHeading")}
        </h3>
        <div className="flex items-center gap-2" data-oid="03bs1ll">
          <label className="flex items-center gap-2 text-sm" data-oid="p:42kke">
            <input
              type="checkbox"
              checked={showTrajectories}
              onChange={(e) => setShowTrajectories(e.target.checked)}
              className="rounded"
              data-oid="c_d.g9b"
            />

            {t("recognition.yolo.showTrajectories")}
          </label>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={t("recognition.yolo.objectTracksAriaLabel")}
        className="cursor-pointer border border-gray-300 rounded bg-white"
        onClick={handleCanvasClick}
        style={{ width, height }}
        data-oid="g9rt6j9"
      />

      {/* Информация о треках */}
      <div className="grid grid-cols-2 gap-4 text-sm" data-oid="4p9zojb">
        <div data-oid="3ebsgt_">
          <div className="font-medium" data-oid="m7by5o0">
            {t("recognition.yolo.totalTracks")}
          </div>
          <div className="text-gray-600" data-oid="gpi_mwf">
            {trackHistory.size}
          </div>
        </div>
        <div data-oid="x7bx9bm">
          <div className="font-medium" data-oid="o56msms">
            {t("recognition.yolo.selectedTrack")}
          </div>
          <div className="text-gray-600" data-oid="hc5g-qj">
            {selectedTrack
              ? trackHistory.get(selectedTrack)?.[0]?.class || t("recognition.yolo.unknownClass")
              : t("recognition.yolo.noneSelected")}
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-2" data-oid=".-qk88s">
        {Array.from(
          new Set(
            Array.from(trackHistory.values())
              .flat()
              .map((point) => point.class),
          ),
        ).map((className) => (
          <div key={className} className="flex items-center gap-1 text-xs" data-oid="ix6d2pt">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getColorForClass(className) }}
              data-oid="rp:fn:x"
            />

            <span data-oid="l3zf6sq">{className}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
