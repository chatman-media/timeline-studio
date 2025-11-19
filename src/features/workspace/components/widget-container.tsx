/**
 * Widget Container Component
 *
 * Draggable and resizable container for workspace widgets
 */

"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react"
import React, { type ReactNode, useCallback, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import type { ResizeHandle } from "../services/workspace-layout-machine"
import type { Widget, WidgetBounds } from "../types/widget"

// Minimum widget size (in percentage)
const MIN_WIDTH = 10
const MIN_HEIGHT = 10

interface WidgetContainerProps {
  widget: Widget
  children: ReactNode
  onRemove?: (widgetId: string) => void
  onMinimize?: (widgetId: string) => void
  onMaximize?: (widgetId: string) => void
  onSelect?: (widgetId: string) => void
  onResize?: (widgetId: string, bounds: WidgetBounds) => void
  isSelected?: boolean
  enableResize?: boolean
}

export function WidgetContainer({
  widget,
  children,
  onRemove,
  onMinimize,
  onMaximize,
  onSelect,
  onResize,
  isSelected = false,
  enableResize = true,
}: WidgetContainerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
    data: {
      type: "widget",
      widget,
    },
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const resizeStartRef = useRef<{ x: number; y: number; bounds: WidgetBounds } | null>(null)

  const handleResizeStart = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      e.stopPropagation()
      setIsResizing(true)
      setResizeHandle(handle)
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        bounds: { ...widget.bounds },
      }
    },
    [widget.bounds],
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current || !resizeHandle || !containerRef.current) return

      const parent = containerRef.current.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const deltaX = ((e.clientX - resizeStartRef.current.x) / parentRect.width) * 100
      const deltaY = ((e.clientY - resizeStartRef.current.y) / parentRect.height) * 100

      const { bounds: startBounds } = resizeStartRef.current
      let newBounds = { ...startBounds }

      // Calculate new bounds based on resize handle
      switch (resizeHandle) {
        case "e":
          newBounds.width = Math.max(MIN_WIDTH, Math.min(100 - startBounds.x, startBounds.width + deltaX))
          break
        case "w":
          {
            const newWidth = Math.max(MIN_WIDTH, startBounds.width - deltaX)
            const widthDiff = startBounds.width - newWidth
            newBounds.x = Math.max(0, startBounds.x + widthDiff)
            newBounds.width = newWidth
          }
          break
        case "n":
          {
            const newHeight = Math.max(MIN_HEIGHT, startBounds.height - deltaY)
            const heightDiff = startBounds.height - newHeight
            newBounds.y = Math.max(0, startBounds.y + heightDiff)
            newBounds.height = newHeight
          }
          break
        case "s":
          newBounds.height = Math.max(MIN_HEIGHT, Math.min(100 - startBounds.y, startBounds.height + deltaY))
          break
        case "ne":
          {
            newBounds.width = Math.max(MIN_WIDTH, Math.min(100 - startBounds.x, startBounds.width + deltaX))
            const newHeight = Math.max(MIN_HEIGHT, startBounds.height - deltaY)
            const heightDiff = startBounds.height - newHeight
            newBounds.y = Math.max(0, startBounds.y + heightDiff)
            newBounds.height = newHeight
          }
          break
        case "nw":
          {
            const newWidth = Math.max(MIN_WIDTH, startBounds.width - deltaX)
            const widthDiff = startBounds.width - newWidth
            newBounds.x = Math.max(0, startBounds.x + widthDiff)
            newBounds.width = newWidth

            const newHeight = Math.max(MIN_HEIGHT, startBounds.height - deltaY)
            const heightDiff = startBounds.height - newHeight
            newBounds.y = Math.max(0, startBounds.y + heightDiff)
            newBounds.height = newHeight
          }
          break
        case "se":
          newBounds.width = Math.max(MIN_WIDTH, Math.min(100 - startBounds.x, startBounds.width + deltaX))
          newBounds.height = Math.max(MIN_HEIGHT, Math.min(100 - startBounds.y, startBounds.height + deltaY))
          break
        case "sw":
          {
            const newWidth = Math.max(MIN_WIDTH, startBounds.width - deltaX)
            const widthDiff = startBounds.width - newWidth
            newBounds.x = Math.max(0, startBounds.x + widthDiff)
            newBounds.width = newWidth
            newBounds.height = Math.max(MIN_HEIGHT, Math.min(100 - startBounds.y, startBounds.height + deltaY))
          }
          break
      }

      onResize?.(widget.id, newBounds)
    },
    [isResizing, resizeHandle, widget.id, onResize],
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
    resizeStartRef.current = null
  }, [])

  // Add mouse event listeners for resize
  React.useEffect(() => {
    if (!isResizing) return

    window.addEventListener("mousemove", handleResizeMove)
    window.addEventListener("mouseup", handleResizeEnd)

    return () => {
      window.removeEventListener("mousemove", handleResizeMove)
      window.removeEventListener("mouseup", handleResizeEnd)
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const style = {
    position: "absolute" as const,
    left: `${widget.bounds.x}%`,
    top: `${widget.bounds.y}%`,
    width: `${widget.bounds.width}%`,
    height: `${widget.bounds.height}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: widget.zIndex + (isDragging ? 1000 : 0),
    opacity: widget.isVisible ? 1 : 0.3,
    pointerEvents: widget.isVisible ? ("auto" as const) : ("none" as const),
  }

  if (widget.isMinimized) {
    return null
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        ;(containerRef as any).current = node
      }}
      style={style}
      className={cn(
        "rounded-lg border bg-background shadow-sm transition-shadow",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50",
        isResizing && "cursor-grabbing",
      )}
      onClick={() => onSelect?.(widget.id)}
    >
      {/* Widget Header */}
      <div className="flex h-8 items-center justify-between border-b bg-muted/50 px-2">
        <div className="flex items-center gap-1">
          {/* Drag Handle */}
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab touch-none p-1 hover:bg-muted active:cursor-grabbing"
            title="Drag to move"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-xs font-medium capitalize">{widget.type}</span>
        </div>

        {/* Widget Actions */}
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMinimize(widget.id)
              }}
              className="p-1 hover:bg-muted"
              title="Minimize"
            >
              <Minimize2 className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {onMaximize && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMaximize(widget.id)
              }}
              className="p-1 hover:bg-muted"
              title="Maximize"
            >
              <Maximize2 className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(widget.id)
              }}
              className="p-1 hover:bg-destructive/10 hover:text-destructive"
              title="Close"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="h-[calc(100%-2rem)] overflow-hidden">{children}</div>

      {/* Resize Handles */}
      {enableResize && !widget.isMinimized && (
        <>
          {/* Edge handles */}
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-ew-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart("e", e)}
          />
          <div
            className="absolute bottom-0 left-0 h-1 w-full cursor-ns-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart("s", e)}
          />
          <div
            className="absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart("w", e)}
          />
          <div
            className="absolute left-0 top-0 h-1 w-full cursor-ns-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart("n", e)}
          />

          {/* Corner handles */}
          <div
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 border-primary bg-background"
            onMouseDown={(e) => handleResizeStart("se", e)}
          />
          <div
            className="absolute -right-1 -top-1 h-3 w-3 cursor-nesw-resize rounded-full border-2 border-primary bg-background"
            onMouseDown={(e) => handleResizeStart("ne", e)}
          />
          <div
            className="absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize rounded-full border-2 border-primary bg-background"
            onMouseDown={(e) => handleResizeStart("sw", e)}
          />
          <div
            className="absolute -left-1 -top-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 border-primary bg-background"
            onMouseDown={(e) => handleResizeStart("nw", e)}
          />
        </>
      )}
    </div>
  )
}
