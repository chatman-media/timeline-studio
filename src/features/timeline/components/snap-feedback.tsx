/**
 * Snap Feedback Component - показывает визуальную обратную связь при снэппинге
 */

import { memo } from "react"
import { cn } from "@/lib/utils"
import type { SnapPoint } from "../types/edit-modes"

interface SnapFeedbackProps {
  snapPoint: SnapPoint | null
  isActive: boolean
  timeScale: number
  className?: string
}

export const SnapFeedback = memo(function SnapFeedback({ snapPoint, isActive, className }: SnapFeedbackProps) {
  if (!snapPoint || !isActive) return null

  const left = snapPoint.position

  // Разные стили для разных типов snap точек
  const getSnapStyle = (type: string) => {
    switch (type) {
      case "grid":
        return "border-blue-400 bg-blue-400/20"
      case "clip":
        return "border-green-400 bg-green-400/20"
      case "marker":
        return "border-purple-400 bg-purple-400/20"
      case "playhead":
        return "border-red-400 bg-red-400/20"
      default:
        return "border-gray-400 bg-gray-400/20"
    }
  }

  const getSnapLabel = (type: string) => {
    switch (type) {
      case "grid":
        return "Grid"
      case "clip":
        return "Clip"
      case "marker":
        return "Marker"
      case "playhead":
        return "Playhead"
      default:
        return "Snap"
    }
  }

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-0.5 pointer-events-none z-50",
        "transition-opacity duration-200",
        getSnapStyle(snapPoint.type),
        className,
      )}
      style={{ left: `${left}px` }}
      data-oid="l9hwdvq"
    >
      {/* Вертикальная линия */}
      <div className="w-full h-full border-l-2 border-dashed opacity-80" data-oid="w1kgm86" />

      {/* Метка типа snap'а */}
      <div
        className={cn(
          "absolute top-2 left-1 px-1.5 py-0.5 rounded text-xs font-medium",
          "transform -translate-x-1/2",
          "text-white shadow-lg",
          getSnapStyle(snapPoint.type).includes("blue") && "bg-blue-500",
          getSnapStyle(snapPoint.type).includes("green") && "bg-green-500",
          getSnapStyle(snapPoint.type).includes("purple") && "bg-purple-500",
          getSnapStyle(snapPoint.type).includes("red") && "bg-red-500",
          getSnapStyle(snapPoint.type).includes("gray") && "bg-gray-500",
        )}
        data-oid="n3sua6a"
      >
        {getSnapLabel(snapPoint.type)}
      </div>

      {/* Усиленная точка в месте snap'а */}
      <div
        className={cn(
          "absolute top-1/2 left-0 w-2 h-2 rounded-full",
          "transform -translate-x-1/2 -translate-y-1/2",
          "border-2 border-white shadow-md",
          getSnapStyle(snapPoint.type).replace("/20", "/80"),
        )}
        data-oid="f304e6z"
      />
    </div>
  )
})

/**
 * Snap Guidelines Component - показывает все активные snap линии
 */
interface SnapGuidelinesProps {
  snapPoints: SnapPoint[]
  isVisible: boolean
  timeScale: number
  activeSnapPoint?: SnapPoint | null
  className?: string
}

export const SnapGuidelines = memo(function SnapGuidelines({
  snapPoints,
  isVisible,
  activeSnapPoint,
  className,
}: SnapGuidelinesProps) {
  if (!isVisible || snapPoints.length === 0) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-40", className)} data-oid="rd2-7v5">
      {snapPoints.map((snapPoint, index) => {
        const isActive = activeSnapPoint?.position === snapPoint.position
        const left = snapPoint.position

        return (
          <div
            key={`${snapPoint.type}-${index}`}
            className={cn(
              "absolute top-0 bottom-0 w-px",
              "transition-opacity duration-150",
              isActive ? "opacity-100" : "opacity-30",
              snapPoint.type === "grid" && "bg-blue-300",
              snapPoint.type === "clip" && "bg-green-300",
              snapPoint.type === "marker" && "bg-purple-300",
              snapPoint.type === "playhead" && "bg-red-300",
            )}
            style={{ left: `${left}px` }}
            data-oid="c:cq:td"
          />
        )
      })}
    </div>
  )
})
