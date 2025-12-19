import { useEffect, useMemo, useRef } from "react"

import type { TransitionCurve } from "@/features/timeline/types/timeline-transition"
import { cn } from "@/lib/utils"

interface TransitionCurveVisualizerProps {
  curve: TransitionCurve
  duration: number // длительность перехода в секундах
  currentTime?: number // текущее время воспроизведения
  width?: number
  height?: number
  className?: string
  showProgress?: boolean
  showValue?: boolean
  onTimeChange?: (time: number) => void
}

/**
 * Компонент визуализации кривой перехода с анимацией
 * Показывает прогресс выполнения перехода в реальном времени
 */
export function TransitionCurveVisualizer({
  curve,
  duration,
  currentTime = 0,
  width = 200,
  height = 100,
  className,
  showProgress = true,
  showValue = true,
  onTimeChange,
}: TransitionCurveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const padding = 20

  // Вычисление значения по кривой в момент времени t (0-1)
  const getValueAtTime = useMemo(
    () =>
      (t: number): number => {
        if (curve.type === "linear") {
          return t
        }

        // Для стандартных easing функций
        if (["ease-in", "ease-out", "ease-in-out"].includes(curve.type)) {
          return calculateEasing(curve.type, t)
        }

        // Для custom кривых используем интерполяцию Безье
        if (curve.points.length < 2) return t

        // Находим сегмент кривой для времени t
        let segmentIndex = 0
        for (let i = 1; i < curve.points.length; i++) {
          if (t <= curve.points[i].x) {
            segmentIndex = i - 1
            break
          }
        }

        const p0 = curve.points[segmentIndex]
        const p1 = curve.points[Math.min(segmentIndex + 1, curve.points.length - 1)]

        if (!p0.handleOut || !p1.handleIn) {
          // Линейная интерполяция
          const localT = (t - p0.x) / (p1.x - p0.x)
          return p0.y + (p1.y - p0.y) * localT
        }

        // Кубическая интерполяция Безье
        const localT = (t - p0.x) / (p1.x - p0.x)
        return cubicBezier(localT, p0.y, p0.handleOut.y, p1.handleIn.y, p1.y)
      },
    [curve],
  )

  // Отрисовка на canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Установка размеров canvas
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Очистка canvas
    ctx.clearRect(0, 0, width, height)

    // Рисуем фон
    ctx.fillStyle = "hsl(var(--background))"
    ctx.fillRect(0, 0, width, height)

    // Рисуем сетку
    ctx.strokeStyle = "hsl(var(--border))"
    ctx.lineWidth = 0.5
    ctx.setLineDash([2, 2])

    // Вертикальные линии
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Горизонтальные линии
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    ctx.setLineDash([])

    // Рисуем оси
    ctx.strokeStyle = "hsl(var(--foreground))"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    // Рисуем кривую
    ctx.strokeStyle = "hsl(var(--primary))"
    ctx.lineWidth = 3
    ctx.beginPath()

    const steps = 100
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const value = getValueAtTime(t)
      const x = padding + t * (width - 2 * padding)
      const y = height - padding - value * (height - 2 * padding)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Рисуем текущую позицию
    if (showProgress && currentTime >= 0 && currentTime <= duration) {
      const t = currentTime / duration
      const value = getValueAtTime(t)
      const x = padding + t * (width - 2 * padding)
      const y = height - padding - value * (height - 2 * padding)

      // Вертикальная линия времени
      ctx.strokeStyle = "hsl(var(--muted-foreground))"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
      ctx.setLineDash([])

      // Точка на кривой
      ctx.fillStyle = "hsl(var(--primary))"
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()

      // Значение
      if (showValue) {
        ctx.fillStyle = "hsl(var(--foreground))"
        ctx.font = "12px monospace"
        ctx.textAlign = "center"
        ctx.fillText(value.toFixed(2), x, y - 10)
      }
    }

    // Подписи осей
    ctx.fillStyle = "hsl(var(--muted-foreground))"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText("Time", width / 2, height - 5)

    ctx.save()
    ctx.translate(5, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("Value", 0, 0)
    ctx.restore()
  }, [curve, currentTime, duration, width, height, showProgress, showValue, getValueAtTime])

  // Обработчик клика для изменения времени
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTimeChange) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const t = Math.max(0, Math.min(1, (x - padding) / (width - 2 * padding)))
    onTimeChange(t * duration)
  }

  return (
    <div className={cn("transition-curve-visualizer", className)} data-oid="lh6xtbe">
      <canvas
        ref={canvasRef}
        className={cn("border rounded", onTimeChange && "cursor-pointer")}
        onClick={handleClick}
        data-oid="x8ojxm8"
      />

      {/* Информация о переходе */}
      <div className="mt-2 flex justify-between text-xs text-muted-foreground" data-oid=".d0y980">
        <span data-oid="aqktbme">Тип: {curve.type}</span>
        <span data-oid="7:-w9-.">Длительность: {duration.toFixed(1)}s</span>
        {showProgress && <span data-oid="v7plop0">Время: {currentTime.toFixed(2)}s</span>}
      </div>
    </div>
  )
}

/**
 * Вычисление стандартных easing функций
 */
function calculateEasing(type: string, t: number): number {
  switch (type) {
    case "ease-in":
      return t * t * t
    case "ease-out":
      return 1 - (1 - t) ** 3
    case "ease-in-out":
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
    default:
      return t
  }
}

/**
 * Кубическая интерполяция Безье
 */
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const t2 = t * t
  const t3 = t2 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt

  return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3
}
