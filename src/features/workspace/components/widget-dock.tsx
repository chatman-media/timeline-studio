/**
 * Widget Dock Component
 *
 * Displays minimized widgets at the bottom of the workspace
 * Allows restoring widgets by clicking on them
 */

"use client"

import { useDroppable } from "@dnd-kit/core"
import { Maximize2 } from "lucide-react"

import { cn } from "@/lib/utils"

import { useWorkspaceLayout } from "../services/workspace-layout-provider"
import type { Widget } from "../types/widget"

interface WidgetDockProps {
  className?: string
}

export function WidgetDock({ className }: WidgetDockProps) {
  const { activeWidgets, maximizeWidget } = useWorkspaceLayout()

  const { setNodeRef } = useDroppable({
    id: "widget-dock",
  })

  // Filter minimized widgets
  const minimizedWidgets = activeWidgets.filter((widget: Widget) => widget.isMinimized)

  if (minimizedWidgets.length === 0) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute bottom-0 left-0 right-0 z-50 flex h-12 items-center gap-2 border-t bg-muted/30 px-4 backdrop-blur-sm",
        className,
      )}
    >
      <div className="text-xs text-muted-foreground">Minimized:</div>
      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {minimizedWidgets.map((widget) => (
          <button
            key={widget.id}
            onClick={() => maximizeWidget(widget.id)}
            className="flex items-center gap-2 rounded bg-background px-3 py-1.5 text-sm shadow-sm transition-all hover:bg-accent hover:shadow"
            title={`Restore ${widget.type}`}
          >
            <Maximize2 className="h-3 w-3" />
            <span className="capitalize">{widget.type}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
