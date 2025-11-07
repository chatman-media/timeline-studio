/**
 * Widget Container Component
 *
 * Draggable and resizable container for workspace widgets
 */

"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import type { Widget } from "../types/widget"

interface WidgetContainerProps {
  widget: Widget
  children: ReactNode
  onRemove?: (widgetId: string) => void
  onMinimize?: (widgetId: string) => void
  onMaximize?: (widgetId: string) => void
  onSelect?: (widgetId: string) => void
  isSelected?: boolean
}

export function WidgetContainer({
  widget,
  children,
  onRemove,
  onMinimize,
  onMaximize,
  onSelect,
  isSelected = false,
}: WidgetContainerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
    data: {
      type: "widget",
      widget,
    },
  })

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
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-background shadow-sm transition-shadow",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50",
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
    </div>
  )
}
