/**
 * Widget Workspace Component
 *
 * Main workspace area with draggable widgets
 */

"use client"

import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { ReactNode } from "react"

import { createLogger } from "@/lib/tauri-logger"

import { useWorkspaceLayout } from "../services/workspace-layout-provider"
import type { Widget, WidgetType } from "../types/widget"
import { WidgetContainer } from "./widget-container"
import { WidgetDock } from "./widget-dock"

const logger = createLogger("WidgetWorkspace")

interface WidgetWorkspaceProps {
  widgetRenderers: Record<WidgetType, (widget: Widget) => ReactNode>
}

/**
 * WidgetWorkspace component
 *
 * IMPORTANT: This component must be used within WorkspaceLayoutProvider.
 * It uses useWorkspaceLayout hook to access the workspace state and actions.
 *
 * @example
 * ```tsx
 * <WorkspaceLayoutProvider>
 *   <WidgetWorkspace widgetRenderers={...} />
 * </WorkspaceLayoutProvider>
 * ```
 */
export function WidgetWorkspace({ widgetRenderers }: WidgetWorkspaceProps) {
  // Get workspace state and actions from context
  const { activeWidgets, selectedWidgetId, isDragging, send, updateWidgetBounds } = useWorkspaceLayout()

  // DEBUG: Log active widgets
  console.log("[WidgetWorkspace] Rendering with:", {
    activeWidgetsCount: activeWidgets.length,
    activeWidgets: activeWidgets.map((w) => ({ id: w.id, type: w.type, isVisible: w.isVisible })),
    widgetRenderers: Object.keys(widgetRenderers),
  })

  // Configure drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8, // 8px movement before drag starts
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event

    if (!delta.x && !delta.y) {
      send({ type: "END_DRAG" })
      return
    }

    const widget = activeWidgets.find((w: Widget) => w.id === active.id)
    if (!widget) return

    // Calculate new position based on drag delta
    // Delta is in pixels, we need to convert to percentage
    const containerWidth = event.over?.rect?.width || window.innerWidth
    const containerHeight = event.over?.rect?.height || window.innerHeight

    const deltaXPercent = (delta.x / containerWidth) * 100
    const deltaYPercent = (delta.y / containerHeight) * 100

    const newBounds = {
      ...widget.bounds,
      x: Math.max(0, Math.min(100 - widget.bounds.width, widget.bounds.x + deltaXPercent)),
      y: Math.max(0, Math.min(100 - widget.bounds.height, widget.bounds.y + deltaYPercent)),
    }

    logger.debugSync("Widget dragged", {
      widgetId: widget.id,
      oldPosition: { x: widget.bounds.x, y: widget.bounds.y },
      newPosition: { x: newBounds.x, y: newBounds.y },
    })

    send({
      type: "UPDATE_WIDGET_BOUNDS",
      widgetId: widget.id,
      bounds: newBounds,
    })

    send({ type: "END_DRAG" })
  }

  const handleDragStart = (event: any) => {
    send({ type: "START_DRAG", widgetId: event.active.id })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} data-oid="nt6haqq">
      <div className="relative h-full w-full overflow-hidden bg-background" data-oid="3f4d5j8">
        {activeWidgets.map((widget: Widget) => {
          const renderWidget = widgetRenderers[widget.type]
          if (!renderWidget) {
            logger.warnSync("No renderer for widget type", {
              type: widget.type,
            })
            return null
          }

          return (
            <WidgetContainer
              key={widget.id}
              widget={widget}
              isSelected={selectedWidgetId === widget.id}
              onSelect={(id) => send({ type: "SELECT_WIDGET", widgetId: id })}
              onRemove={(id) => send({ type: "REMOVE_WIDGET", widgetId: id })}
              onMinimize={(id) => send({ type: "MINIMIZE_WIDGET", widgetId: id })}
              onMaximize={(id) => send({ type: "MAXIMIZE_WIDGET", widgetId: id })}
              onResize={updateWidgetBounds}
              enableResize={true}
              data-oid="n:jvis5"
            >
              {renderWidget(widget)}
            </WidgetContainer>
          )
        })}

        {/* Drag overlay indicator */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 bg-primary/5 transition-colors" data-oid="wywa07l" />
        )}

        {/* Widget Dock for minimized widgets */}
        <WidgetDock data-oid="k8f.wjs" />
      </div>
    </DndContext>
  )
}
