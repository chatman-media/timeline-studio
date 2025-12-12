import { useCallback, useEffect, useState } from "react"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import { EDIT_MODES } from "../../types/edit-modes"

interface ClipTrimHandlesProps {
  onTrimStart: (edge: "start" | "end", initialX: number) => void
  onTrimMove: (deltaX: number) => void
  onTrimEnd: (committed: boolean) => void
  isSelected: boolean
  disabled?: boolean
  className?: string
}

export function ClipTrimHandles({
  onTrimStart,
  onTrimMove,
  onTrimEnd,
  isSelected,
  disabled = false,
  className,
}: ClipTrimHandlesProps) {
  const { isEditMode } = useEditModeContext()
  const [isDragging, setIsDragging] = useState(false)
  const [dragEdge, setDragEdge] = useState<"start" | "end" | null>(null)
  const [dragStartX, setDragStartX] = useState(0)

  // Show handles when in trim/ripple mode or when clip is selected
  const showHandles =
    (isEditMode(EDIT_MODES.TRIM) || isEditMode(EDIT_MODES.RIPPLE) || isEditMode(EDIT_MODES.ROLL)) &&
    (isSelected || isDragging)

  const handleMouseDown = useCallback(
    (edge: "start" | "end", e: React.MouseEvent) => {
      if (disabled) return

      e.preventDefault()
      e.stopPropagation()

      setIsDragging(true)
      setDragEdge(edge)
      setDragStartX(e.clientX)
      onTrimStart(edge, e.clientX)
    },
    [disabled, onTrimStart],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX
      onTrimMove(deltaX)
    }

    const handleMouseUp = (e: MouseEvent) => {
      const committed = !e.shiftKey // Shift+release cancels the operation
      onTrimEnd(committed)
      setIsDragging(false)
      setDragEdge(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStartX, onTrimMove, onTrimEnd])

  if (!showHandles) return null

  return (
    <>
      {/* Start handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-2 cursor-col-resize",
          "bg-primary/20 hover:bg-primary/40 transition-colors",
          "border-l-2 border-primary",
          isDragging && dragEdge === "start" && "bg-primary/60",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        onMouseDown={(e) => handleMouseDown("start", e)}
        data-trim-handle="start"
        data-testid="trim-handle-start"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      </div>

      {/* End handle */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize",
          "bg-primary/20 hover:bg-primary/40 transition-colors",
          "border-r-2 border-primary",
          isDragging && dragEdge === "end" && "bg-primary/60",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        onMouseDown={(e) => handleMouseDown("end", e)}
        data-trim-handle="end"
        data-testid="trim-handle-end"
      >
        <div className="absolute inset-y-0 right-0 w-1 bg-primary" />
      </div>

      {/* Visual feedback during trim */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
        </div>
      )}
    </>
  )
}

// Ripple handle variant with different styling
interface RippleHandleProps extends ClipTrimHandlesProps {
  showRippleIndicator?: boolean
}

export function RippleHandles({ showRippleIndicator = true, ...props }: RippleHandleProps) {
  const { isEditMode } = useEditModeContext()

  if (!isEditMode(EDIT_MODES.RIPPLE)) {
    return <ClipTrimHandles {...props} />
  }

  return (
    <div className="relative">
      <ClipTrimHandles {...props} className="border-orange-500 bg-orange-500/20" />

      {/* Ripple indicator arrow */}
      {showRippleIndicator && props.isSelected && (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-orange-500">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5 L15 10 L10 15 L10 11 L5 11 L5 9 L10 9 Z" />
          </svg>
        </div>
      )}
    </div>
  )
}

// Roll edit handles - connects two adjacent clips
interface RollHandlesProps {
  leftClipId: string
  rightClipId: string
  position: number // Position between clips in pixels
  onRollStart: (initialX: number) => void
  onRollMove: (deltaX: number) => void
  onRollEnd: (committed: boolean) => void
  isActive: boolean
  disabled?: boolean
}

export function RollHandles({
  position,
  onRollStart,
  onRollMove,
  onRollEnd,
  isActive,
  disabled = false,
}: RollHandlesProps) {
  const { isEditMode } = useEditModeContext()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    setIsDragging(true)
    setDragStartX(e.clientX)
    onRollStart(e.clientX)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX
      onRollMove(deltaX)
    }

    const handleMouseUp = (e: MouseEvent) => {
      const committed = !e.shiftKey
      onRollEnd(committed)
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStartX, onRollMove, onRollEnd])

  if (!isEditMode(EDIT_MODES.ROLL) || !isActive) return null

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-4 -translate-x-1/2 cursor-col-resize z-10",
        "bg-purple-500/30 hover:bg-purple-500/50 transition-colors",
        isDragging && "bg-purple-500/70",
        disabled && "cursor-not-allowed opacity-50",
      )}
      style={{ left: `${position}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-purple-500" />

      {/* Roll indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 rounded-full bg-purple-500" />
      </div>
    </div>
  )
}
