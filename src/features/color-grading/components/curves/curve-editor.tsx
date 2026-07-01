import { type MouseEvent, useCallback, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export interface CurvePoint {
  x: number
  y: number
  id: string
}

interface CurveEditorProps {
  points: CurvePoint[]
  onPointsChange: (points: CurvePoint[]) => void
  color?: string
  className?: string
}

// Безье интерполяция для плавной кривой
function generateBezierPath(points: CurvePoint[]): string {
  if (!points || points.length < 2) return ""

  // Сортируем точки по X координате
  const sortedPoints = [...points].sort((a, b) => a.x - b.x)

  // Начинаем с первой точки
  let path = `M ${sortedPoints[0].x} ${sortedPoints[0].y}`

  // Генерируем кривую через все точки
  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1]
    const curr = sortedPoints[i]

    // Вычисляем контрольные точки для плавной кривой
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4
    const cpy1 = prev.y
    const cpx2 = curr.x - (curr.x - prev.x) * 0.4
    const cpy2 = curr.y

    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }

  return path
}

export function CurveEditor({ points = [], onPointsChange, color = "white", className }: CurveEditorProps) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)
  const gridPatternId = useId()

  // Размеры SVG
  const width = 256
  const height = 256

  // Преобразование координат мыши в координаты SVG
  const getMousePosition = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 }

    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height

    // Ограничиваем координаты внутри SVG
    return {
      x: Math.max(0, Math.min(width, x)),
      y: Math.max(0, Math.min(height, y)),
    }
  }, [])

  // Обработка начала перетаскивания точки
  const handleMouseDown = useCallback((pointId: string) => {
    setIsDragging(pointId)
  }, [])

  // Обработка перемещения мыши
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const pos = getMousePosition(e)
      const newPoints = points.map((point) => (point.id === isDragging ? { ...point, x: pos.x, y: pos.y } : point))

      onPointsChange(newPoints)
    },
    [isDragging, points, onPointsChange, getMousePosition],
  )

  // Обработка окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Добавление новой точки при клике на пустое место
  const handleSvgClick = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      // Проверяем, что клик был не на точке
      if ((e.target as SVGElement).tagName === "circle") return

      const pos = getMousePosition(e)
      const newPoint: CurvePoint = {
        x: pos.x,
        y: pos.y,
        id: `point-${Date.now()}`,
      }

      onPointsChange([...points, newPoint])
    },
    [points, onPointsChange, getMousePosition],
  )

  // Удаление точки при двойном клике
  const handlePointDoubleClick = useCallback(
    (pointId: string) => {
      // Не удаляем если остается менее 2 точек
      if (!points || points.length <= 2) return

      const newPoints = points.filter((point) => point.id !== pointId)
      onPointsChange(newPoints)
    },
    [points, onPointsChange],
  )

  // Генерируем путь кривой
  const curvePath = generateBezierPath(points)

  return (
    <div className={cn("relative bg-gray-900 rounded border border-gray-600", className)} data-oid="gyxy_5n">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
        data-oid="tf956li"
      >
        {/* Сетка */}
        <defs data-oid="vrd_eq5">
          <pattern id={gridPatternId} width="32" height="32" patternUnits="userSpaceOnUse" data-oid="jrudn4f">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.3" data-oid="h0ihj96" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} data-oid="4ild4f-" />

        {/* Диагональная референсная линия */}
        <line
          x1="0"
          y1={height}
          x2={width}
          y2="0"
          stroke="gray"
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="4 2"
          data-oid="os85exu"
        />

        {/* Кривая */}
        {points && points.length >= 2 && (
          <path d={curvePath} stroke={color} strokeWidth="2" fill="none" pointerEvents="none" data-oid="4h61i5x" />
        )}

        {/* Интерактивные точки */}
        {points &&
          points.map((point) => (
            <g key={point.id} data-oid="io1e25d">
              {/* Увеличенная область клика */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
                className="cursor-move"
                onMouseDown={() => handleMouseDown(point.id)}
                onDoubleClick={() => handlePointDoubleClick(point.id)}
                onMouseEnter={() => setHoveredPoint(point.id)}
                onMouseLeave={() => setHoveredPoint(null)}
                data-oid="3baicob"
              />

              {/* Визуальная точка */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === point.id || isDragging === point.id ? "6" : "4"}
                fill="white"
                stroke={color}
                strokeWidth="2"
                className="pointer-events-none transition-all"
                data-oid="2h8b_11"
              />
            </g>
          ))}
      </svg>

      {/* Подсказка */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none" data-oid="86ojl3z">
        {isDragging
          ? t("colorGrading.curves.dragToMove", "Drag to move")
          : t("colorGrading.curves.clickToAddRemove", "Click to add • Double-click to remove")}
      </div>
    </div>
  )
}
