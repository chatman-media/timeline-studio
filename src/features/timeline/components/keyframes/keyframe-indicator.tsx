/**
 * Индикатор keyframes на клипе
 */

import { Zap } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { TimelineClip } from "../../types"

interface KeyframeIndicatorProps {
  clip: TimelineClip
  timeScale: number // Пикселей в секунду
  className?: string
  showLabels?: boolean
}

export function KeyframeIndicator({ clip, className, showLabels = false }: KeyframeIndicatorProps) {
  // Группируем keyframes по свойствам
  const keyframeGroups = useMemo(() => {
    if (!clip.keyframes || clip.keyframes.length === 0) return []

    const groups = new Map<string, typeof clip.keyframes>()

    for (const kf of clip.keyframes) {
      if (!groups.has(kf.property)) {
        groups.set(kf.property, [])
      }
      groups.get(kf.property)!.push(kf)
    }

    return Array.from(groups.entries()).map(([property, keyframes]) => ({
      property,
      keyframes: keyframes.sort((a: { time: number }, b: { time: number }) => a.time - b.time),
      color: getPropertyColor(property),
    }))
  }, [clip.keyframes])

  if (keyframeGroups.length === 0) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {keyframeGroups.map(({ property, keyframes, color }, groupIndex) => (
        <div key={property} className="relative h-full">
          {keyframes.map((keyframe: { id: string; time: number }, index: number) => {
            const leftPosition = (keyframe.time / clip.duration) * 100

            return (
              <div
                key={keyframe.id}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${leftPosition}%` }}
              >
                {/* Вертикальная линия keyframe */}
                <div className="w-0.5 h-full opacity-80" style={{ backgroundColor: color }} />

                {/* Маркер keyframe */}
                <div
                  className={cn(
                    "absolute w-2 h-2 rounded-full border border-white",
                    "transform -translate-x-1/2 shadow-sm",
                    showLabels && index === 0 && "mb-4",
                  )}
                  style={{
                    backgroundColor: color,
                    top: `${groupIndex * 8 + 4}px`,
                  }}
                />

                {/* Подпись для первого keyframe каждого свойства */}
                {showLabels && index === 0 && (
                  <div
                    className={cn(
                      "absolute text-xs px-1 py-0.5 rounded",
                      "bg-black/70 text-white whitespace-nowrap",
                      "transform -translate-x-1/2 -translate-y-full",
                    )}
                    style={{ top: `${groupIndex * 8 - 2}px` }}
                  >
                    {getPropertyLabel(property)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Общий индикатор наличия keyframes */}
      <div className="absolute top-1 right-1">
        <div className="bg-blue-500 text-white rounded-full p-1">
          <Zap className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}

// Получает цвет для свойства
function getPropertyColor(property: string): string {
  const colors: Record<string, string> = {
    opacity: "#3B82F6", // blue
    "position.x": "#EF4444", // red
    "position.y": "#10B981", // emerald
    "position.width": "#F59E0B", // amber
    "position.height": "#8B5CF6", // violet
    "position.scaleX": "#EC4899", // pink
    "position.scaleY": "#06B6D4", // cyan
    "position.rotation": "#84CC16", // lime
    volume: "#F97316", // orange
    speed: "#6366F1", // indigo
  }

  return colors[property] || "#6B7280" // gray as fallback
}

// Получает читаемое название свойства
function getPropertyLabel(property: string): string {
  const labels: Record<string, string> = {
    opacity: "Прозрачность",
    "position.x": "X",
    "position.y": "Y",
    "position.width": "Ширина",
    "position.height": "Высота",
    "position.scaleX": "Масштаб X",
    "position.scaleY": "Масштаб Y",
    "position.rotation": "Поворот",
    volume: "Громкость",
    speed: "Скорость",
  }

  return labels[property] || property
}
