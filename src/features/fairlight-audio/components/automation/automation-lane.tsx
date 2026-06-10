import { Button } from "@timeline-studio/ui/components/button"
import { Eye, EyeOff, Lock, Unlock } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

import type { AutomationLane, AutomationPoint } from "../../services/automation-engine"

interface AutomationLaneProps {
  lane: AutomationLane
  width: number
  height: number
  pixelsPerSecond: number
  currentTime: number
  onPointsChange: (points: AutomationPoint[]) => void
  onVisibilityToggle: () => void
}

export function AutomationLaneComponent({
  lane,
  width,
  height,
  pixelsPerSecond,
  currentTime,
  onPointsChange,
  onVisibilityToggle,
}: AutomationLaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPointIndex, setDragPointIndex] = useState(-1)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const drawAutomation = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height)

    if (!lane.isVisible || lane.points.length === 0) return

    // Настройки рисования
    ctx.strokeStyle = lane.isEnabled ? "#3b82f6" : "#6b7280"
    ctx.fillStyle = lane.isEnabled ? "#3b82f6" : "#6b7280"
    ctx.lineWidth = 2

    // Рисуем линию автоматизации
    ctx.beginPath()

    for (let i = 0; i < lane.points.length; i++) {
      const point = lane.points[i]
      const x = point.time * pixelsPerSecond
      const y = height - point.value * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        const prevPoint = lane.points[i - 1]

        if (prevPoint.curve === "hold") {
          // Ступенчатая линия
          const prevX = prevPoint.time * pixelsPerSecond
          const prevY = height - prevPoint.value * height
          ctx.lineTo(x, prevY)
          ctx.lineTo(x, y)
        } else if (prevPoint.curve === "bezier") {
          // Безье кривая
          const prevX = prevPoint.time * pixelsPerSecond
          const prevY = height - prevPoint.value * height
          const cp1x = prevX + (x - prevX) * 0.3
          const cp1y = prevY
          const cp2x = prevX + (x - prevX) * 0.7
          const cp2y = y
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
        } else {
          // Линейная интерполяция
          ctx.lineTo(x, y)
        }
      }
    }

    ctx.stroke()

    // Рисуем точки
    lane.points.forEach((point, index) => {
      const x = point.time * pixelsPerSecond
      const y = height - point.value * height

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      // Выделяем выбранную точку
      if (index === dragPointIndex) {
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.strokeStyle = lane.isEnabled ? "#3b82f6" : "#6b7280"
        ctx.lineWidth = 2
      }
    })

    // Рисуем текущую позицию
    const playheadX = currentTime * pixelsPerSecond
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
    }
  }, [lane, width, height, pixelsPerSecond, currentTime, dragPointIndex])

  useEffect(() => {
    drawAutomation()
  }, [drawAutomation])

  const getPointAtPosition = (x: number, y: number): number => {
    const tolerance = 8

    for (let i = 0; i < lane.points.length; i++) {
      const point = lane.points[i]
      const pointX = point.time * pixelsPerSecond
      const pointY = height - point.value * height

      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2)
      if (distance <= tolerance) {
        return i
      }
    }

    return -1
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!lane.isEnabled) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const pointIndex = getPointAtPosition(x, y)

    if (pointIndex !== -1) {
      // Начинаем перетаскивание существующей точки
      setIsDragging(true)
      setDragPointIndex(pointIndex)
    } else {
      // Создаем новую точку
      const time = x / pixelsPerSecond
      const value = (height - y) / height

      const newPoint: AutomationPoint = {
        time: Math.max(0, time),
        value: Math.max(0, Math.min(1, value)),
        curve: "linear",
      }

      const newPoints = [...lane.points, newPoint].sort((a, b) => a.time - b.time)
      onPointsChange(newPoints)

      const newIndex = newPoints.findIndex((p) => p.time === newPoint.time && p.value === newPoint.value)
      setDragPointIndex(newIndex)
      setIsDragging(true)
    }

    setMousePosition({ x, y })

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || dragPointIndex === -1) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const time = Math.max(0, x / pixelsPerSecond)
    const value = Math.max(0, Math.min(1, (height - y) / height))

    const newPoints = [...lane.points]
    newPoints[dragPointIndex] = {
      ...newPoints[dragPointIndex],
      time,
      value,
    }

    // Сортируем по времени, но сохраняем индекс перетаскиваемой точки
    const sortedPoints = newPoints.sort((a, b) => a.time - b.time)
    const newIndex = sortedPoints.findIndex((p) => p.time === time && p.value === value)
    setDragPointIndex(newIndex)

    onPointsChange(sortedPoints)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragPointIndex(-1)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!lane.isEnabled) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const pointIndex = getPointAtPosition(x, y)

    if (pointIndex !== -1) {
      // Удаляем точку (кроме первой)
      if (pointIndex > 0) {
        const newPoints = lane.points.filter((_, i) => i !== pointIndex)
        onPointsChange(newPoints)
      }
    }
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-900 border-b border-zinc-800" data-oid="z7xjy0l">
      {/* Заголовок линии */}
      <div className="w-32 px-2 py-1 flex items-center gap-1 border-r border-zinc-800" data-oid="ri-nl7y">
        <Button size="sm" variant="ghost" onClick={onVisibilityToggle} className="h-6 w-6 p-0" data-oid="y745l3l">
          {lane.isVisible ? (
            <Eye className="w-3 h-3" data-oid="01bvl63" />
          ) : (
            <EyeOff className="w-3 h-3" data-oid=":.y:vsz" />
          )}
        </Button>

        <span className="text-xs text-zinc-400 truncate flex-1" data-oid="ufdk-8b">
          {lane.parameterId}
        </span>

        {lane.isEnabled ? (
          <Unlock className="w-3 h-3 text-green-400" data-oid="3bbhzzt" />
        ) : (
          <Lock className="w-3 h-3 text-zinc-600" data-oid="-fj9-8d" />
        )}
      </div>

      {/* Canvas для автоматизации */}
      <div className="flex-1 relative" data-oid="ej7956g">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={cn(
            "cursor-crosshair",
            !lane.isEnabled && "cursor-not-allowed",
            lane.isVisible ? "opacity-100" : "opacity-30",
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          data-oid="hm-ay4u"
        />
      </div>
    </div>
  )
}
