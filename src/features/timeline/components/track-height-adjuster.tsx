/**
 * TrackHeightAdjuster - Компонент для изменения высоты трека
 *
 * Добавляет возможность изменения высоты трека перетаскиванием нижней границы
 */

import type React from "react"
import { useCallback, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface TrackHeightAdjusterProps {
  trackId: string
  currentHeight: number
  onHeightChange: (trackId: string, newHeight: number) => void
  className?: string
}

export function TrackHeightAdjuster({ trackId, currentHeight, onHeightChange, className }: TrackHeightAdjusterProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
  })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      dragStateRef.current = {
        isDragging: true,
        startY: e.clientY,
        startHeight: currentHeight,
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragStateRef.current.isDragging) return

        const deltaY = e.clientY - dragStateRef.current.startY
        const newHeight = Math.max(40, Math.min(300, dragStateRef.current.startHeight + deltaY))

        onHeightChange(trackId, newHeight)
      }

      const handleMouseUp = () => {
        dragStateRef.current.isDragging = false
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [trackId, currentHeight, onHeightChange],
  )

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 h-1",
        "cursor-row-resize bg-transparent",
        "hover:bg-primary/20 active:bg-primary/30",
        "transition-colors duration-150",
        "group",
        isDragging && "bg-primary/30",
        className,
      )}
      onMouseDown={handleMouseDown}
      data-testid={`track-height-adjuster-${trackId}`}
      data-oid="0r69g45"
    >
      {/* Визуальный индикатор */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          "bg-primary opacity-0",
          "group-hover:opacity-100 transition-opacity duration-150",
          isDragging && "opacity-100",
        )}
        data-oid="bxtfkaf"
      />

      {/* Расширенная область для захвата */}
      <div
        className="absolute -top-1 -bottom-1 left-0 right-0"
        title="Перетащите для изменения высоты трека"
        data-oid="j0:6je:"
      />
    </div>
  )
}
