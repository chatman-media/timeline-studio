import { useMemo } from "react"

import type { TransitionCurve } from "@/features/timeline/types/timeline-transition"
import { cn } from "@/lib/utils"

interface TransitionCurvePreviewProps {
  curve: TransitionCurve
  width?: number
  height?: number
  className?: string
  strokeColor?: string
  strokeWidth?: number
  showAxes?: boolean
  animated?: boolean
}

/**
 * Компонент предварительного просмотра кривой перехода
 * Используется для отображения кривой без возможности редактирования
 */
export function TransitionCurvePreview({
  curve,
  width = 100,
  height = 60,
  className,
  strokeColor = "currentColor",
  strokeWidth = 2,
  showAxes = false,
  animated = false,
}: TransitionCurvePreviewProps) {
  const padding = 4
  const viewBoxWidth = width
  const viewBoxHeight = height

  // Преобразование координат из нормализованных (0-1) в координаты SVG
  const normToSvg = (x: number, y: number) => {
    const svgX = padding + x * (viewBoxWidth - 2 * padding)
    const svgY = viewBoxHeight - padding - y * (viewBoxHeight - 2 * padding)
    return { x: svgX, y: svgY }
  }

  // Генерация SVG path для кривой
  const curvePath = useMemo(() => {
    if (curve.type === "linear" || curve.points.length < 2) {
      const start = normToSvg(0, 0)
      const end = normToSvg(1, 1)
      return `M ${start.x},${start.y} L ${end.x},${end.y}`
    }

    // Для стандартных easing функций генерируем путь
    if (["ease-in", "ease-out", "ease-in-out", "bounce", "elastic"].includes(curve.type)) {
      return generateEasingPath(curve.type, viewBoxWidth, viewBoxHeight, padding)
    }

    // Для custom кривых используем точки
    let path = ""
    const firstPoint = normToSvg(curve.points[0].x, curve.points[0].y)
    path = `M ${firstPoint.x},${firstPoint.y}`

    for (let i = 1; i < curve.points.length; i++) {
      const prevPoint = curve.points[i - 1]
      const currPoint = curve.points[i]

      if (prevPoint.handleOut && currPoint.handleIn) {
        // Кубическая кривая Безье
        const c1 = normToSvg(prevPoint.handleOut.x, prevPoint.handleOut.y)
        const c2 = normToSvg(currPoint.handleIn.x, currPoint.handleIn.y)
        const p2 = normToSvg(currPoint.x, currPoint.y)

        path += ` C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`
      } else {
        // Прямая линия
        const p2 = normToSvg(currPoint.x, currPoint.y)
        path += ` L ${p2.x},${p2.y}`
      }
    }

    return path
  }, [curve, viewBoxWidth, viewBoxHeight, padding])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={cn("transition-curve-preview", className)}
      role="img"
      aria-label={`Кривая перехода: ${curve.type}`}
      data-oid="_b9j6tm"
    >
      {/* Оси (опционально) */}
      {showAxes && (
        <g className="opacity-20" data-oid=":l8cq.a">
          <line
            x1={padding}
            y1={viewBoxHeight - padding}
            x2={viewBoxWidth - padding}
            y2={viewBoxHeight - padding}
            stroke={strokeColor}
            strokeWidth={1}
            data-oid="h7t_i1t"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={viewBoxHeight - padding}
            stroke={strokeColor}
            strokeWidth={1}
            data-oid="fx0mdze"
          />
        </g>
      )}

      {/* Кривая */}
      <path
        d={curvePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(animated && "transition-all duration-300")}
        data-oid="t3o9k1g"
      />

      {/* Точки начала и конца */}
      <circle
        cx={normToSvg(0, 0).x}
        cy={normToSvg(0, 0).y}
        r={strokeWidth}
        fill={strokeColor}
        className="opacity-50"
        data-oid="z:ahbeg"
      />

      <circle
        cx={normToSvg(1, 1).x}
        cy={normToSvg(1, 1).y}
        r={strokeWidth}
        fill={strokeColor}
        className="opacity-50"
        data-oid=":-8x-dj"
      />
    </svg>
  )
}

/**
 * Генерация пути для стандартных easing функций
 */
function generateEasingPath(type: string, width: number, height: number, padding: number): string {
  const steps = 30
  const points: Array<{ x: number; y: number }> = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let y: number

    switch (type) {
      case "ease-in":
        y = easeIn(t)
        break
      case "ease-out":
        y = easeOut(t)
        break
      case "ease-in-out":
        y = easeInOut(t)
        break
      case "bounce":
        y = bounce(t)
        break
      case "elastic":
        y = elastic(t)
        break
      default:
        y = t
    }

    const svgX = padding + t * (width - 2 * padding)
    const svgY = height - padding - y * (height - 2 * padding)
    points.push({ x: svgX, y: svgY })
  }

  // Создаем path из точек
  return points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ")
}

// Easing функции
function easeIn(t: number): number {
  return t * t
}

function easeOut(t: number): number {
  return t * (2 - t)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function bounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75

  if (t < 1 / d1) {
    return n1 * t * t
  }
  if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75
  }
  if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375
  }
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

function elastic(t: number): number {
  const c4 = (2 * Math.PI) / 3

  return t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}
