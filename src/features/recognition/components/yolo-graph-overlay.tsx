import type React from "react"
import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import type { YoloVideoData } from "@/features/recognition/types/yolo"

interface YoloGraphOverlayProps {
  yoloData: YoloVideoData
  currentTime: number
  onTimeChange?: (time: number) => void
  width?: number
  height?: number
}

/**
 * Компонент для отображения графика YOLO данных с возможностью навигации по времени
 * Показывает временную шкалу с количеством обнаружений и позволяет переходить к конкретному времени
 */
export function YoloGraphOverlay({
  yoloData,
  currentTime,
  onTimeChange,
  width = 600,
  height = 100,
}: YoloGraphOverlayProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)

  // Подготавливаем данные для графика
  const chartData = yoloData.frames.map((frame) => ({
    timestamp: frame.timestamp,
    detectionCount: frame.detections.length,
  }))

  // Находим максимальное количество обнаружений и максимальное время
  const maxDetections = Math.max(...chartData.map((d) => d.detectionCount), 1)
  const maxTime = Math.max(...chartData.map((d) => d.timestamp))

  // Рисуем график
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

    // Отступы
    const padding = 10
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Функции масштабирования
    const xScale = (time: number) => (time / maxTime) * chartWidth + padding
    const yScale = (count: number) => height - padding - (count / maxDetections) * chartHeight

    // Рисуем фон
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    ctx.fillRect(0, 0, width, height)

    // Рисуем сетку
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
    ctx.lineWidth = 1

    // Вертикальные линии сетки (каждые 10 секунд)
    for (let time = 0; time <= maxTime; time += 10) {
      const x = xScale(time)
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Горизонтальные линии сетки
    for (let i = 0; i <= 4; i++) {
      const count = (maxDetections / 4) * i
      const y = yScale(count)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Рисуем линию графика
    if (chartData.length > 1) {
      ctx.strokeStyle = "#4CAF50"
      ctx.lineWidth = 2
      ctx.beginPath()

      chartData.forEach((data, index) => {
        const x = xScale(data.timestamp)
        const y = yScale(data.detectionCount)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    // Рисуем точки данных
    chartData.forEach((data) => {
      const x = xScale(data.timestamp)
      const y = yScale(data.detectionCount)

      ctx.fillStyle = "#4CAF50"
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Рисуем индикатор текущего времени
    const currentX = xScale(currentTime)
    ctx.strokeStyle = "#FF5722"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(currentX, padding)
    ctx.lineTo(currentX, height - padding)
    ctx.stroke()

    // Рисуем индикатор hover времени
    if (isHovering && hoverTime !== null) {
      const hoverX = xScale(hoverTime)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(hoverX, padding)
      ctx.lineTo(hoverX, height - padding)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [yoloData, currentTime, width, height, maxDetections, maxTime, isHovering, hoverTime])

  // Обработчик клика по графику
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTimeChange) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const padding = 10
    const chartWidth = width - padding * 2

    // Вычисляем время на основе позиции клика
    const clickTime = ((x - padding) / chartWidth) * maxTime

    // Ограничиваем время в пределах доступных данных
    const clampedTime = Math.max(0, Math.min(maxTime, clickTime))

    onTimeChange(clampedTime)
  }

  // Обработчик движения мыши
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const padding = 10
    const chartWidth = width - padding * 2

    // Вычисляем время на основе позиции мыши
    const mouseTime = ((x - padding) / chartWidth) * maxTime
    const clampedTime = Math.max(0, Math.min(maxTime, mouseTime))

    setHoverTime(clampedTime)
  }

  // Находим ближайшие данные для отображения в tooltip
  const getDataAtTime = (time: number) => {
    if (chartData.length === 0) return null

    // Находим ближайший кадр
    const closestFrame = chartData.reduce((prev, curr) =>
      Math.abs(curr.timestamp - time) < Math.abs(prev.timestamp - time) ? curr : prev,
    )

    return closestFrame
  }

  const tooltipData = hoverTime !== null ? getDataAtTime(hoverTime) : null

  return (
    <div className="relative" data-oid="i-h0m2b">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={t("recognition.yolo.detectionGraphTitle")}
        className="cursor-pointer border border-gray-300 rounded"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false)
          setHoverTime(null)
        }}
        style={{ width, height }}
        data-oid="5:un4nb"
      />

      {/* Tooltip */}
      {isHovering && tooltipData && hoverTime !== null && (
        <div
          className="absolute z-10 rounded bg-black bg-opacity-80 px-2 py-1 text-xs text-white pointer-events-none"
          style={{
            left: Math.min(width - 120, Math.max(0, (hoverTime / maxTime) * width - 60)),
            top: -40,
          }}
          data-oid="cpm2:59"
        >
          <div data-oid=":mxg-8p">
            {t("recognition.yolo.time")}: {hoverTime.toFixed(1)}s
          </div>
          <div data-oid="_k4kqyj">
            {t("recognition.yolo.detectionsLabel")}: {tooltipData.detectionCount}
          </div>
        </div>
      )}

      {/* Легенда */}
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-600" data-oid="ou9nmw9">
        <div className="flex items-center gap-1" data-oid="vn:vpzs">
          <div className="w-3 h-0.5 bg-green-500" data-oid="c88htuv" />
          <span data-oid="is5u12h">{t("recognition.yolo.detectionCount")}</span>
        </div>
        <div className="flex items-center gap-1" data-oid="rxb:yz:">
          <div className="w-3 h-0.5 bg-red-500" data-oid="mi.-wsl" />
          <span data-oid="8mlsasr">{t("recognition.yolo.currentTime")}</span>
        </div>
        <div className="text-gray-500" data-oid="t_vcasa">
          {t("recognition.yolo.clickToSeek")}
        </div>
      </div>
    </div>
  )
}
