/**
 * Transition Visualizer - визуализация переходов на timeline
 */

import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { TimelineClip } from "../../types"

interface TransitionVisualizerProps {
  leftClip: TimelineClip
  rightClip: TimelineClip
  pixelsPerSecond: number
  trackHeight: number
  className?: string
}

export const TransitionVisualizer = memo(function TransitionVisualizer({
  leftClip,
  rightClip,
  pixelsPerSecond,
  trackHeight,
  className,
}: TransitionVisualizerProps) {
  // Находим переходы
  const outTransition = leftClip.transitions.find((t) => t.type === "out")
  const inTransition = rightClip.transitions.find((t) => t.type === "in")

  // Если нет переходов, не отображаем
  if (!outTransition && !inTransition) return null

  // Вычисляем параметры перехода
  const transitionData = useMemo(() => {
    // Берем данные из любого перехода (они должны быть синхронизированы)
    const transition = outTransition || inTransition
    if (!transition) return null

    // Длительность перехода
    const duration = transition.duration || 1.0

    // Позиция начала перехода (конец левого клипа - половина длительности)
    const startPosition = (leftClip.startTime + leftClip.duration - duration / 2) * pixelsPerSecond

    // Ширина визуализации перехода
    const width = duration * pixelsPerSecond

    return {
      id: transition.id,
      name: transition.transitionId,
      duration,
      startPosition,
      width,
      type: transition.transitionId,
    }
  }, [leftClip, rightClip, outTransition, inTransition, pixelsPerSecond])

  if (!transitionData) return null

  return (
    <div
      className={cn("absolute top-0 pointer-events-none", className)}
      style={{
        left: `${transitionData.startPosition}px`,
        width: `${transitionData.width}px`,
        height: `${trackHeight}px`,
      }}
    >
      {/* Фоновая область перехода */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Центральная линия */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-purple-400 -translate-x-1/2" />

      {/* Визуализация типа перехода */}
      {renderTransitionEffect(transitionData.type, transitionData.width, trackHeight)}

      {/* Метка с названием */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
        {getTransitionDisplayName(transitionData.type)}
      </div>
    </div>
  )
})

// Рендеринг эффекта перехода
function renderTransitionEffect(type: string, width: number, height: number) {
  switch (type) {
    case "fade":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="fade-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="50%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={width} height={height} fill="url(#fade-gradient)" opacity="0.2" />
        </svg>
      )

    case "dissolve":
      return (
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-linear-to-r from-white via-transparent to-white" />
        </div>
      )

    case "wipe":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          <path
            d={`M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`}
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.3"
          />
          <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="white" strokeWidth="2" opacity="0.5" />
        </svg>
      )

    case "slide":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          <path
            d={`M 0 ${height / 2} L ${width / 3} ${height / 3} L ${(width * 2) / 3} ${(height * 2) / 3} L ${width} ${height / 2}`}
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.3"
          />
        </svg>
      )

    case "zoom":
      return (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-1/2 h-1/2 border-2 border-white rounded-lg" />
        </div>
      )

    default:
      return null
  }
}

// Получение отображаемого имени перехода
function getTransitionDisplayName(type: string): string {
  const names: Record<string, string> = {
    fade: "Затухание",
    dissolve: "Растворение",
    wipe: "Вытеснение",
    slide: "Сдвиг",
    zoom: "Масштаб",
    blur: "Размытие",
    glitch: "Глитч",
    flash: "Вспышка",
    rotate: "Вращение",
    flip: "Переворот",
  }

  return names[type] || type
}

// Компонент для предпросмотра перехода при наведении
interface TransitionPreviewProps {
  transition: {
    id: string
    type: string
    duration: number
  }
  leftClip: TimelineClip
  rightClip: TimelineClip
}

export const TransitionPreview = memo(function TransitionPreview({
  transition,
  leftClip,
  rightClip,
}: TransitionPreviewProps) {
  return (
    <div className="absolute z-50 bg-black/90 rounded-lg shadow-xl p-4 w-64">
      <h4 className="text-sm font-medium text-white mb-2">{getTransitionDisplayName(transition.type)}</h4>

      <div className="space-y-2 text-xs text-gray-300">
        <div className="flex justify-between">
          <span>Длительность:</span>
          <span>{transition.duration.toFixed(1)}s</span>
        </div>

        <div className="flex justify-between">
          <span>От клипа:</span>
          <span className="truncate ml-2">{leftClip.name}</span>
        </div>

        <div className="flex justify-between">
          <span>К клипу:</span>
          <span className="truncate ml-2">{rightClip.name}</span>
        </div>
      </div>

      {/* Мини-превью перехода */}
      <div className="mt-3 h-20 bg-gray-800 rounded relative overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-blue-600 flex items-center justify-center text-white text-xs">{leftClip.name}</div>
          <div className="w-8 bg-linear-to-r from-blue-600 via-purple-500 to-green-600" />
          <div className="flex-1 bg-green-600 flex items-center justify-center text-white text-xs">
            {rightClip.name}
          </div>
        </div>
      </div>
    </div>
  )
})
