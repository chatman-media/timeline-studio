/**
 * Drop Zone для клипов с использованием @dnd-kit
 * Позволяет перетаскивать эффекты, фильтры на клипы
 */

import { useDroppable } from "@dnd-kit/core"
import { memo, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useDragDropTimeline } from "../../hooks/drag-drop/use-drag-drop-timeline"
import { useClipResources } from "../../hooks/effects/use-clip-resources"
import type { TimelineClip } from "../../types"

interface ClipDropZoneDndProps {
  clip: TimelineClip
  className?: string
  children: React.ReactNode
}

export const ClipDropZoneDnd = memo(function ClipDropZoneDnd({ clip, className, children }: ClipDropZoneDndProps) {
  const { dragState } = useDragDropTimeline()
  const { applyEffectToClip, applyFilterToClip, canApplyEffectToClip, canApplyFilterToClip } = useClipResources()

  // Настраиваем drop zone
  const { isOver, setNodeRef } = useDroppable({
    id: `clip-drop-${clip.id}`,
    data: {
      type: "clip-drop",
      clipId: clip.id,
      clipType: clip.type,
    },
  })

  // Проверяем, можем ли принять текущий перетаскиваемый ресурс
  const canAcceptDrop = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedResource) return false

    switch (dragState.draggedResourceType) {
      case "effect":
        return canApplyEffectToClip(clip.id, dragState.draggedResource)
      case "filter":
        return canApplyFilterToClip(clip.id, dragState.draggedResource)
      default:
        return false
    }
  }, [
    dragState.isDragging,
    dragState.draggedResource,
    dragState.draggedResourceType,
    clip.id,
    canApplyEffectToClip,
    canApplyFilterToClip,
  ])

  // Обработка drop события
  useEffect(() => {
    if (isOver && dragState.draggedResource && canAcceptDrop()) {
      // Drop событие обрабатывается в handleDragEnd хука useDragDropTimeline
      // Здесь мы только обновляем визуальное состояние
    }
  }, [isOver, dragState.draggedResource, canAcceptDrop])

  const showDropFeedback = isOver && canAcceptDrop()
  const showRejectFeedback = isOver && !canAcceptDrop()

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all duration-200",
        showDropFeedback && "ring-2 ring-primary ring-opacity-50 scale-[1.02]",
        showRejectFeedback && "ring-2 ring-destructive ring-opacity-50 opacity-50",
        className,
      )}
    >
      {children}

      {/* Overlay для показа типа перетаскиваемого ресурса */}
      {isOver && dragState.draggedResourceType && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "backdrop-blur-sm rounded transition-all duration-200 pointer-events-none z-10",
            showDropFeedback
              ? "bg-primary/20 border-2 border-primary border-dashed"
              : "bg-destructive/20 border-2 border-destructive border-dashed",
          )}
        >
          <div
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              showDropFeedback ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground",
            )}
          >
            {showDropFeedback
              ? dragState.draggedResourceType === "effect"
                ? "Добавить эффект"
                : dragState.draggedResourceType === "filter"
                  ? "Добавить фильтр"
                  : "Добавить ресурс"
              : "Несовместимый ресурс"}
          </div>
        </div>
      )}
    </div>
  )
})
