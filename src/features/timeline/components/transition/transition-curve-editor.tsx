import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { CurvePoint, TransitionCurve } from "@/features/timeline/types/timeline-transition"
import { cn } from "@/lib/utils"

interface TransitionCurveEditorProps {
  curve: TransitionCurve
  onChange: (curve: TransitionCurve) => void
  width?: number
  height?: number
  className?: string
  isReadOnly?: boolean
  showGrid?: boolean
  showPresets?: boolean
}

// Предустановленные кривые
const CURVE_PRESETS: Record<string, TransitionCurve> = {
  linear: {
    type: "linear",
    points: [
      { id: "start", x: 0, y: 0 },
      { id: "end", x: 1, y: 1 },
    ],
  },
  "ease-in": {
    type: "ease-in",
    points: [
      { id: "start", x: 0, y: 0 },
      { id: "end", x: 1, y: 1, handleIn: { x: 0.42, y: 0 } },
    ],
  },
  "ease-out": {
    type: "ease-out",
    points: [
      { id: "start", x: 0, y: 0, handleOut: { x: 0.58, y: 1 } },
      { id: "end", x: 1, y: 1 },
    ],
  },
  "ease-in-out": {
    type: "ease-in-out",
    points: [
      { id: "start", x: 0, y: 0, handleOut: { x: 0.42, y: 0 } },
      { id: "end", x: 1, y: 1, handleIn: { x: 0.58, y: 1 } },
    ],
  },
  bounce: {
    type: "custom",
    points: [
      { id: "start", x: 0, y: 0, handleOut: { x: 0.1, y: 0.2 } },
      {
        id: "bounce1",
        x: 0.4,
        y: 1.2,
        handleIn: { x: 0.3, y: 1.2 },
        handleOut: { x: 0.5, y: 1.2 },
      },
      {
        id: "bounce2",
        x: 0.7,
        y: 0.9,
        handleIn: { x: 0.6, y: 0.9 },
        handleOut: { x: 0.8, y: 0.9 },
      },
      { id: "end", x: 1, y: 1, handleIn: { x: 0.9, y: 1 } },
    ],
  },
  elastic: {
    type: "custom",
    points: [
      { id: "start", x: 0, y: 0, handleOut: { x: 0.1, y: -0.1 } },
      {
        id: "elastic1",
        x: 0.3,
        y: -0.1,
        handleIn: { x: 0.2, y: -0.1 },
        handleOut: { x: 0.4, y: -0.1 },
      },
      {
        id: "elastic2",
        x: 0.6,
        y: 1.1,
        handleIn: { x: 0.5, y: 1.1 },
        handleOut: { x: 0.7, y: 1.1 },
      },
      { id: "end", x: 1, y: 1, handleIn: { x: 0.9, y: 1 } },
    ],
  },
}

/**
 * Компонент редактора кривой перехода
 */
export function TransitionCurveEditor({
  curve,
  onChange,
  width = 300,
  height = 200,
  className,
  isReadOnly = false,
  showGrid = true,
  showPresets = true,
}: TransitionCurveEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<"point" | "handleIn" | "handleOut" | null>(null)

  // Отступы для визуализации
  const padding = 20
  const gridSize = 20
  const viewBoxWidth = width
  const viewBoxHeight = height

  // Преобразование координат из нормализованных (0-1) в координаты SVG
  const normToSvg = useCallback(
    (x: number, y: number) => {
      const svgX = padding + x * (viewBoxWidth - 2 * padding)
      const svgY = viewBoxHeight - padding - y * (viewBoxHeight - 2 * padding)
      return { x: svgX, y: svgY }
    },
    [viewBoxWidth, viewBoxHeight],
  )

  // Преобразование координат из SVG в нормализованные (0-1)
  const svgToNorm = useCallback(
    (x: number, y: number) => {
      const normX = (x - padding) / (viewBoxWidth - 2 * padding)
      const normY = 1 - (y - padding) / (viewBoxHeight - 2 * padding)
      return {
        x: Math.max(0, Math.min(1, normX)),
        y: Math.max(0, Math.min(1, normY)),
      }
    },
    [viewBoxWidth, viewBoxHeight],
  )

  // Генерация SVG path для кривой
  const curvePath = useMemo(() => {
    if (curve.points.length < 2) return ""

    let path = ""
    const firstPoint = normToSvg(curve.points[0].x, curve.points[0].y)
    path = `M ${firstPoint.x},${firstPoint.y}`

    for (let i = 1; i < curve.points.length; i++) {
      const prevPoint = curve.points[i - 1]
      const currPoint = curve.points[i]

      if (prevPoint.handleOut && currPoint.handleIn) {
        // Кубическая кривая Безье
        const p1 = normToSvg(prevPoint.x, prevPoint.y)
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
  }, [curve.points, normToSvg])

  // Обработчик начала перетаскивания
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pointId: string, type: "point" | "handleIn" | "handleOut") => {
      if (isReadOnly) return

      e.preventDefault()
      setSelectedPointId(pointId)
      setDragType(type)
      setIsDragging(true)
    },
    [isReadOnly],
  )

  // Обработчик перемещения мыши
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !selectedPointId || !dragType || !svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Преобразуем в координаты SVG
      const svgX = (x / rect.width) * viewBoxWidth
      const svgY = (y / rect.height) * viewBoxHeight

      // Преобразуем в нормализованные координаты
      const norm = svgToNorm(svgX, svgY)

      // Обновляем точку
      const updatedPoints = curve.points.map((point) => {
        if (point.id !== selectedPointId) return point

        if (dragType === "point") {
          // Перемещаем точку и её handles
          const deltaX = norm.x - point.x
          const deltaY = norm.y - point.y

          return {
            ...point,
            x: norm.x,
            y: norm.y,
            handleIn: point.handleIn
              ? {
                  x: point.handleIn.x + deltaX,
                  y: point.handleIn.y + deltaY,
                }
              : undefined,
            handleOut: point.handleOut
              ? {
                  x: point.handleOut.x + deltaX,
                  y: point.handleOut.y + deltaY,
                }
              : undefined,
          }
        }
        if (dragType === "handleIn" && point.handleIn) {
          return {
            ...point,
            handleIn: { x: norm.x, y: norm.y },
          }
        }
        if (dragType === "handleOut" && point.handleOut) {
          return {
            ...point,
            handleOut: { x: norm.x, y: norm.y },
          }
        }

        return point
      })

      onChange({
        ...curve,
        type: "custom",
        points: updatedPoints,
      })
    },
    [isDragging, selectedPointId, dragType, curve, onChange, svgToNorm, viewBoxWidth, viewBoxHeight],
  )

  // Обработчик отпускания мыши
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
  }, [])

  // Добавление обработчиков событий
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Добавление новой точки
  const addPoint = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isReadOnly || !svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const svgX = (x / rect.width) * viewBoxWidth
      const svgY = (y / rect.height) * viewBoxHeight
      const norm = svgToNorm(svgX, svgY)

      // Находим позицию для вставки
      let insertIndex = curve.points.length
      for (let i = 1; i < curve.points.length; i++) {
        if (norm.x < curve.points[i].x) {
          insertIndex = i
          break
        }
      }

      const newPoint: CurvePoint = {
        id: `point-${Date.now()}`,
        x: norm.x,
        y: norm.y,
      }

      const updatedPoints = [...curve.points]
      updatedPoints.splice(insertIndex, 0, newPoint)

      onChange({
        ...curve,
        type: "custom",
        points: updatedPoints,
      })
    },
    [isReadOnly, curve, onChange, svgToNorm, viewBoxWidth, viewBoxHeight],
  )

  // Удаление точки
  const deletePoint = useCallback(
    (pointId: string) => {
      if (isReadOnly || curve.points.length <= 2) return

      const updatedPoints = curve.points.filter((p) => p.id !== pointId)
      onChange({
        ...curve,
        type: "custom",
        points: updatedPoints,
      })
    },
    [isReadOnly, curve, onChange],
  )

  // Применение предустановки
  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = CURVE_PRESETS[presetName]
      if (preset) {
        onChange(preset)
      }
    },
    [onChange],
  )

  return (
    <div className={cn("transition-curve-editor", className)} data-oid="77ma:hn">
      {/* Предустановки */}
      {showPresets && (
        <div className="mb-2 flex flex-wrap gap-1" data-oid="plmb8m4">
          {Object.keys(CURVE_PRESETS).map((presetName) => (
            <button
              key={presetName}
              className={cn(
                "px-2 py-1 text-xs rounded border transition-colors",
                curve.type === presetName
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/80 border-border",
              )}
              onClick={() => applyPreset(presetName)}
              disabled={isReadOnly}
              data-oid="vbu_mss"
            >
              {presetName}
            </button>
          ))}
        </div>
      )}

      {/* SVG редактор */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className={cn("border rounded bg-background", !isReadOnly && "cursor-crosshair")}
        onDoubleClick={addPoint}
        data-oid="9po7pww"
      >
        {/* Сетка */}
        {showGrid && (
          <g className="opacity-10" data-oid="ybaue_3">
            {Array.from({ length: Math.floor(viewBoxWidth / gridSize) }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * gridSize}
                y1={0}
                x2={i * gridSize}
                y2={viewBoxHeight}
                stroke="currentColor"
                strokeWidth={1}
                data-oid="vaqxy-z"
              />
            ))}
            {Array.from({ length: Math.floor(viewBoxHeight / gridSize) }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * gridSize}
                x2={viewBoxWidth}
                y2={i * gridSize}
                stroke="currentColor"
                strokeWidth={1}
                data-oid="e0kakqf"
              />
            ))}
          </g>
        )}

        {/* Оси */}
        <g className="opacity-20" data-oid=":f9fbtc">
          <line
            x1={padding}
            y1={viewBoxHeight - padding}
            x2={viewBoxWidth - padding}
            y2={viewBoxHeight - padding}
            stroke="currentColor"
            strokeWidth={2}
            data-oid="jbc1q6o"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={viewBoxHeight - padding}
            stroke="currentColor"
            strokeWidth={2}
            data-oid="1fwbwzw"
          />
        </g>

        {/* Кривая */}
        <path
          d={curvePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          className="pointer-events-none"
          data-oid=".50o.ne"
        />

        {/* Точки и handles */}
        {curve.points.map((point, _index) => {
          const svgPoint = normToSvg(point.x, point.y)
          const isSelected = selectedPointId === point.id

          return (
            <g key={point.id} data-oid="eee6o1f">
              {/* Handle входа */}
              {point.handleIn && (
                <>
                  <line
                    x1={svgPoint.x}
                    y1={svgPoint.y}
                    x2={normToSvg(point.handleIn.x, point.handleIn.y).x}
                    y2={normToSvg(point.handleIn.x, point.handleIn.y).y}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    data-oid="6pdpac3"
                  />

                  <circle
                    cx={normToSvg(point.handleIn.x, point.handleIn.y).x}
                    cy={normToSvg(point.handleIn.x, point.handleIn.y).y}
                    r={4}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    className={cn(
                      "transition-all",
                      !isReadOnly && "cursor-move hover:r-5",
                      isSelected && "fill-primary",
                    )}
                    onMouseDown={(e) => handleMouseDown(e, point.id, "handleIn")}
                    data-oid="sdc.jny"
                  />
                </>
              )}

              {/* Handle выхода */}
              {point.handleOut && (
                <>
                  <line
                    x1={svgPoint.x}
                    y1={svgPoint.y}
                    x2={normToSvg(point.handleOut.x, point.handleOut.y).x}
                    y2={normToSvg(point.handleOut.x, point.handleOut.y).y}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    data-oid="emc.xma"
                  />

                  <circle
                    cx={normToSvg(point.handleOut.x, point.handleOut.y).x}
                    cy={normToSvg(point.handleOut.x, point.handleOut.y).y}
                    r={4}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    className={cn(
                      "transition-all",
                      !isReadOnly && "cursor-move hover:r-5",
                      isSelected && "fill-primary",
                    )}
                    onMouseDown={(e) => handleMouseDown(e, point.id, "handleOut")}
                    data-oid="1zw8nzz"
                  />
                </>
              )}

              {/* Точка */}
              <circle
                cx={svgPoint.x}
                cy={svgPoint.y}
                r={6}
                fill="hsl(var(--background))"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                className={cn("transition-all", !isReadOnly && "cursor-move hover:r-7", isSelected && "fill-primary")}
                onMouseDown={(e) => handleMouseDown(e, point.id, "point")}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  deletePoint(point.id)
                }}
                data-oid="3qrql8v"
              />

              {/* Подпись с координатами */}
              {isSelected && (
                <text
                  x={svgPoint.x + 10}
                  y={svgPoint.y - 10}
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                  className="pointer-events-none select-none"
                  data-oid="h7opwb3"
                >
                  {`${point.x.toFixed(2)}, ${point.y.toFixed(2)}`}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Инструкции */}
      {!isReadOnly && (
        <div className="mt-2 text-xs text-muted-foreground" data-oid="xqujcu9">
          Двойной клик - добавить точку • Двойной клик на точке - удалить • Перетаскивание - изменить положение
        </div>
      )}
    </div>
  )
}
