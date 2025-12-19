import { memo, useCallback, useMemo, useRef } from "react"
import type { Transition } from "@/domains/video-editing/types"
import type { TimelineTransition } from "@/features/timeline/types/timeline-transition"
import { cn } from "@/lib/utils"

import { TransitionHandles } from "./transition-handles"

interface TimelineTransitionProps {
  transition: TimelineTransition
  transitionResource?: Transition
  trackHeight: number
  pixelsPerSecond: number
  onSelect?: (id: string) => void
  onDurationChange?: (id: string, duration: number) => void
  onPositionChange?: (id: string, position: number) => void
  onUpdate?: (updates: Record<string, any>) => void
  onDelete?: () => void
}

/**
 * Компонент визуализации перехода на таймлайне
 * Отображает переход как отдельный объект между клипами
 */
export const TimelineTransitionComponent = memo(function TimelineTransitionComponent({
  transition,
  transitionResource,
  trackHeight,
  pixelsPerSecond,
  onSelect,
  onDurationChange,
  onPositionChange,
  onDelete,
}: TimelineTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Вычисляем размеры и позицию
  const width = transition.duration * pixelsPerSecond
  const left = transition.position * pixelsPerSecond

  // Стили в зависимости от типа перехода
  const transitionStyles = useMemo(() => {
    const baseColor = getTransitionColor(transitionResource?.category || "basic")
    const isComplex = transitionResource?.complexity === "advanced" || transitionResource?.complexity === "gpu-required"

    return {
      backgroundColor: transition.isEnabled ? baseColor : "#666",
      opacity: transition.isEnabled ? 1 : 0.6,
      background: isComplex
        ? `linear-gradient(135deg, ${baseColor} 0%, ${adjustColor(baseColor, -20)} 100%)`
        : baseColor,
    }
  }, [transition.isEnabled, transitionResource])

  // Обработчик клика
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect?.(transition.id)
    },
    [transition.id, onSelect],
  )

  // Обработчик удаления
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.()
    },
    [transition.id, onDelete],
  )

  // Визуализация кривой перехода
  const curvePathData = useMemo(() => {
    if (transition.curve.type === "linear") {
      return `M 0,${trackHeight} L ${width},0`
    }
    if (transition.curve.type === "custom" && transition.curve.points.length > 0) {
      // Генерируем path из точек кривой
      const points = transition.curve.points
      let path = `M ${points[0].x * width},${(1 - points[0].y) * trackHeight}`

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]

        if (prev.handleOut && curr.handleIn) {
          // Bezier кривая
          path += ` C ${prev.handleOut.x * width},${(1 - prev.handleOut.y) * trackHeight} ${curr.handleIn.x * width},${
            (1 - curr.handleIn.y) * trackHeight
          } ${curr.x * width},${(1 - curr.y) * trackHeight}`
        } else {
          // Прямая линия
          path += ` L ${curr.x * width},${(1 - curr.y) * trackHeight}`
        }
      }

      return path
    }
    // Стандартные easing кривые
    return generateEasingCurve(transition.curve.type, width, trackHeight)
  }, [transition.curve, width, trackHeight])

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute transition-container group cursor-pointer",
        "hover:z-10",
        transition.isLocked && "pointer-events-none opacity-50",
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${trackHeight}px`,
        top: 0,
        ...transitionStyles,
      }}
      onClick={handleClick}
      data-oid="o9aj1qp"
    >
      {/* Форма перехода */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={trackHeight}
        style={{ overflow: "visible" }}
        data-oid="avo_4ha"
      >
        {/* Основная форма */}
        <path
          d={`M 0,${trackHeight} L ${width / 2},${trackHeight / 2} L ${width},${trackHeight} L ${width},0 L ${
            width / 2
          },${trackHeight / 2} L 0,0 Z`}
          fill={transitionStyles.backgroundColor}
          fillOpacity={0.3}
          stroke={transitionStyles.backgroundColor}
          strokeWidth={2}
          data-oid="km_6fz9"
        />

        {/* Кривая перехода */}
        <path
          d={curvePathData}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeOpacity={0.8}
          strokeDasharray={transition.curve.type === "custom" ? "none" : "4 2"}
          data-oid="qj0kmr3"
        />

        {/* Keyframes индикаторы */}
        {transition.keyframes.map((keyframe) => (
          <circle
            key={keyframe.id}
            cx={keyframe.time * width}
            cy={trackHeight / 2}
            r={3}
            fill="white"
            strokeWidth={1}
            stroke={transitionStyles.backgroundColor}
            data-oid="__k0cli"
          />
        ))}
      </svg>

      {/* Название перехода */}
      <div className="absolute inset-x-0 top-1 text-center pointer-events-none" data-oid="1mswee6">
        <span className="text-xs text-white/90 font-medium drop-shadow-sm" data-oid="z60pb51">
          {transitionResource?.labels?.ru || transition.transitionId}
        </span>
      </div>

      {/* Параметры при наведении */}
      {transition.parameters.blur && (
        <div className="absolute bottom-1 left-1 right-1 text-xs text-white/80 space-y-0.5" data-oid="upfifyk">
          <div data-oid="p_xaork">Blur: {transition.parameters.blur.amount}%</div>
        </div>
      )}

      {/* Handles для изменения длительности и позиции */}
      {!transition.isLocked && onDurationChange && onPositionChange && (
        <TransitionHandles
          transitionId={transition.id}
          duration={transition.duration}
          position={transition.position}
          pixelsPerSecond={pixelsPerSecond}
          timelineScale={1}
          minDuration={transitionResource?.duration.min || 0.1}
          maxDuration={transitionResource?.duration.max || 5.0}
          onDurationChange={onDurationChange}
          onPositionChange={onPositionChange}
          isLocked={transition.isLocked}
          data-oid="3jxx0jy"
        />
      )}

      {/* Кнопка удаления */}
      {!transition.isLocked && (
        <button
          className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onClick={handleDelete}
          data-oid="805nynz"
        >
          <span className="text-xs" data-oid="n3c6.w6">
            ×
          </span>
        </button>
      )}

      {/* Индикатор GPU */}
      {transitionResource?.gpuAccelerated && (
        <div
          className="absolute bottom-1 right-1 w-4 h-4 bg-green-500/50 rounded-sm flex items-center justify-center"
          title="GPU Accelerated"
          data-oid="44.1om5"
        >
          <span className="text-xs text-white" data-oid="wugk50.">
            G
          </span>
        </div>
      )}

      {/* Статус кеша */}
      {transition.renderCache?.status === "ready" && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-blue-500 rounded-full" title="Cached" data-oid="n6doivw" />
      )}
    </div>
  )
})

/**
 * Получить цвет для категории перехода
 */
function getTransitionColor(category: string): string {
  const colors: Record<string, string> = {
    basic: "#4A90E2",
    advanced: "#7B68EE",
    creative: "#FF6B6B",
    "3d": "#4ECDC4",
    artistic: "#FFD93D",
    cinematic: "#6C5CE7",
    dynamic: "#A29BFE",
    glitch: "#FD79A8",
    light: "#FDCB6E",
    film: "#6C5CE7",
    motion: "#00B894",
    seamless: "#00CEC9",
  }
  return colors[category] || "#4A90E2"
}

/**
 * Настроить яркость цвета
 */
function adjustColor(color: string, amount: number): string {
  const num = Number.parseInt(color.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

/**
 * Генерировать path для стандартных easing функций
 */
function generateEasingCurve(type: string, width: number, height: number): string {
  const steps = 50
  let path = `M 0,${height}`

  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const x = t * width
    let y: number

    switch (type) {
      case "ease-in":
        y = (1 - t * t) * height
        break
      case "ease-out":
        y = (1 - (1 - t) * (1 - t)) * height
        break
      case "ease-in-out":
        y = (1 - (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)) * height
        break
      default:
        y = (1 - t) * height
    }

    path += ` L ${x},${y}`
  }

  return path
}
