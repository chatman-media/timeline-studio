import { useCallback, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface TransitionHandlesProps {
  transitionId: string
  duration: number
  position: number
  pixelsPerSecond: number
  timelineScale: number
  minDuration: number
  maxDuration: number
  onDurationChange: (id: string, duration: number) => void
  onPositionChange: (id: string, position: number) => void
  isLocked?: boolean
}

/**
 * Handles для изменения длительности и позиции перехода
 */
export function TransitionHandles({
  transitionId,
  duration,
  position,
  pixelsPerSecond,
  timelineScale,
  minDuration,
  maxDuration,
  onDurationChange,
  onPositionChange,
  isLocked = false,
}: TransitionHandlesProps) {
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)
  const dragStartRef = useRef<{ x: number; duration: number; position: number } | undefined>(undefined)

  // Обработчик начала перетаскивания
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: "start" | "end") => {
      if (isLocked) return

      e.preventDefault()
      e.stopPropagation()

      setIsDragging(handle)
      dragStartRef.current = {
        x: e.clientX,
        duration,
        position,
      }

      // Добавляем глобальные обработчики
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [duration, position, isLocked],
  )

  // Обработчик перемещения мыши
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.x
      const deltaTime = deltaX / (pixelsPerSecond * timelineScale)

      if (isDragging === "start") {
        // Изменяем позицию и длительность
        const newPosition = Math.max(0, dragStartRef.current.position + deltaTime)
        const newDuration = Math.max(minDuration, Math.min(maxDuration, dragStartRef.current.duration - deltaTime))

        onPositionChange(transitionId, newPosition)
        onDurationChange(transitionId, newDuration)
      } else if (isDragging === "end") {
        // Изменяем только длительность
        const newDuration = Math.max(minDuration, Math.min(maxDuration, dragStartRef.current.duration + deltaTime))

        onDurationChange(transitionId, newDuration)
      }
    },
    [
      isDragging,
      transitionId,
      pixelsPerSecond,
      timelineScale,
      minDuration,
      maxDuration,
      onDurationChange,
      onPositionChange,
    ],
  )

  // Обработчик отпускания мыши
  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    dragStartRef.current = undefined

    // Удаляем глобальные обработчики
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseMove])

  return (
    <>
      {/* Левый handle (начало) */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize group/handle",
          "transition-all duration-150",
          isDragging === "start" && "bg-primary/30",
          isLocked && "cursor-not-allowed opacity-50",
        )}
        onMouseDown={(e) => handleMouseDown(e, "start")}
        data-oid="y5aroev"
      >
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/60 rounded-full",
            "opacity-0 group-hover/handle:opacity-100 transition-opacity",
            "group-hover/handle:bg-white group-hover/handle:shadow-lg",
          )}
          data-oid="-8u:r:o"
        />
      </div>

      {/* Правый handle (конец) */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize group/handle",
          "transition-all duration-150",
          isDragging === "end" && "bg-primary/30",
          isLocked && "cursor-not-allowed opacity-50",
        )}
        onMouseDown={(e) => handleMouseDown(e, "end")}
        data-oid="mnvd9_5"
      >
        <div
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/60 rounded-full",
            "opacity-0 group-hover/handle:opacity-100 transition-opacity",
            "group-hover/handle:bg-white group-hover/handle:shadow-lg",
          )}
          data-oid="zdbmi.c"
        />
      </div>

      {/* Индикатор длительности при перетаскивании */}
      {isDragging && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
          data-oid="vp-d.7k"
        >
          {duration.toFixed(2)}s
        </div>
      )}
    </>
  )
}
