/**
 * Drag and Drop Provider for Timeline
 *
 * Wraps the timeline with DndContext and provides drag overlay
 */

import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { createSnapModifier } from "@dnd-kit/modifiers"
import type React from "react"
import { useEffect } from "react"

import type { MediaFile } from "@/features/media/types/media"

import { useDragDropTimeline } from "../hooks/use-drag-drop-timeline"
import { initializeDragDropBridge } from "../services/drag-drop-bridge"

interface DragDropProviderProps {
  children: React.ReactNode
}

/**
 * Drag overlay component showing the dragged video
 */
function DraggedVideoOverlay({ mediaFile, count }: { mediaFile: MediaFile; count?: number }) {
  const isMultiSelect = count && count > 1

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 opacity-90">
      <div className="flex items-center gap-2">
        <div className="w-16 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center relative">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {mediaFile.isVideo ? "Video" : mediaFile.isAudio ? "Audio" : "Image"}
          </span>
          {isMultiSelect && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32">
            {isMultiSelect ? `${count} files` : mediaFile.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isMultiSelect ? "Multiple files selected" : mediaFile.duration ? `${Math.round(mediaFile.duration)}s` : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  const { dragState, handleDragStart, handleDragOver, handleDragEnd } = useDragDropTimeline()

  // Инициализируем bridge при монтировании провайдера
  useEffect(() => {
    initializeDragDropBridge()
  }, [])

  // Configure sensors for mouse and touch
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // Require 10px movement to start drag
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Require 250ms hold to start drag on touch
      tolerance: 5,
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  // Create snap modifier for grid snapping
  const snapToGridModifier = createSnapModifier(20) // Grid size in pixels

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[snapToGridModifier]}
    >
      {children}

      <DragOverlay>
        {dragState.isDragging && dragState.draggedItem ? (
          <DraggedVideoOverlay mediaFile={dragState.draggedItem.mediaFile} count={dragState.draggedCount} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
