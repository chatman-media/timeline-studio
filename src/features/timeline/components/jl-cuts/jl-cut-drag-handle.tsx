import type React from "react"
import { useCallback, useState } from "react"
import type { TimelineClip } from "@/features/timeline/types"
import { cn } from "@/lib/utils"
import { useJLCuts } from "../../hooks/editing/use-jl-cuts"
import type { CutType } from "../../types/jl-cuts"

interface JLCutDragHandleProps {
  clip: TimelineClip
  linkedClip?: TimelineClip
  cutType: CutType
  pixelsPerSecond: number
  onOffsetChange?: (offset: number) => void
  className?: string
}

export function JLCutDragHandle({ clip, cutType, pixelsPerSecond, onOffsetChange, className }: JLCutDragHandleProps) {
  const { createJCut, createLCut } = useJLCuts()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [initialOffset, setInitialOffset] = useState(0)

  const currentOffset = Math.abs(clip.audioOffset || 0)
  const isJCut = cutType === "j-cut"

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      setDragStartX(e.clientX)
      setInitialOffset(currentOffset)

      // Add global mouse listeners
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStartX
        const deltaTime = deltaX / pixelsPerSecond
        const newOffset = Math.max(0.1, Math.min(5, initialOffset + deltaTime))

        if (isJCut) {
          createJCut(clip.id, newOffset)
        } else {
          createLCut(clip.id, newOffset)
        }

        onOffsetChange?.(newOffset)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [
      clip.id,
      createJCut,
      createLCut,
      currentOffset,
      dragStartX,
      initialOffset,
      isJCut,
      onOffsetChange,
      pixelsPerSecond,
    ],
  )

  return (
    <div
      className={cn(
        "absolute top-0 h-full w-2 cursor-ew-resize",
        "hover:bg-primary/20 transition-colors",
        isDragging && "bg-primary/30",
        isJCut ? "left-0 -translate-x-full" : "right-0 translate-x-full",
        className,
      )}
      onMouseDown={handleMouseDown}
      style={{
        [isJCut ? "marginLeft" : "marginRight"]: `${currentOffset * pixelsPerSecond}px`,
      }}
    >
      {/* Visual handle */}
      <div
        className={cn(
          "absolute inset-y-2 w-1 rounded-full",
          "bg-primary/50 hover:bg-primary/70 transition-colors",
          isJCut ? "right-0" : "left-0",
        )}
      />

      {/* Offset tooltip */}
      {isDragging && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 px-2 py-1 rounded",
            "bg-popover text-popover-foreground text-xs font-medium",
            "shadow-md pointer-events-none whitespace-nowrap",
            isJCut ? "right-full mr-2" : "left-full ml-2",
          )}
        >
          {currentOffset.toFixed(1)}s
        </div>
      )}
    </div>
  )
}
