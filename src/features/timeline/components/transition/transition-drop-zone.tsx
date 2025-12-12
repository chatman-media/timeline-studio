import { useDroppable } from "@dnd-kit/core"
import { memo, useCallback, useEffect, useRef, useState } from "react"

import type { Transition } from "@/domains/video-editing/types"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useDragDropTimeline } from "../../hooks/use-drag-drop-timeline"
import { useTimeline } from "../../hooks/use-timeline"
import { useTimelineEffects } from "../../hooks/use-timeline-effects"
import type { TimelineClip } from "@/features/timeline/types"

const logger = createLogger("TransitionDropZone")

interface TransitionDropZoneProps {
  leftClip: TimelineClip
  rightClip: TimelineClip
  trackId: string
  timeScale: number
  onDrop: (transition: Transition) => void
  disabled?: boolean
  className?: string
}

/**
 * Зона для drag & drop переходов между клипами
 */
export const TransitionDropZone = memo(function TransitionDropZone({
  leftClip,
  rightClip,
  trackId,
  timeScale,
  onDrop,
  disabled = false,
  className,
}: TransitionDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Вычисляем позицию и размер зоны
  const leftEnd = leftClip.startTime + leftClip.duration
  const rightStart = rightClip.startTime
  const gap = rightStart - leftEnd

  // Позиция зоны - середина между клипами
  const position = leftEnd + gap / 2
  const left = position * timeScale

  // Настраиваем drop zone с @dnd-kit
  const { isOver, setNodeRef } = useDroppable({
    id: `transition-drop-${leftClip.id}-${rightClip.id}`,
    disabled,
    data: {
      type: "transition-drop",
      leftClipId: leftClip.id,
      rightClipId: rightClip.id,
      trackId,
    },
  })

  // Используем hook для применения переходов
  const { applyTransition } = useTimelineEffects()
  const { dragState } = useDragDropTimeline()
  const { saveProject } = useTimeline()

  // Обработчик применения перехода
  const handleTransitionApply = useCallback(
    async (transition: Transition) => {
      try {
        // Определяем длительность перехода
        const duration =
          typeof transition.duration === "number" ? transition.duration : transition.duration?.default || 1.0

        // Применяем переход к обоим клипам через backend
        await applyTransition(leftClip.id, transition.id, {
          type: "out",
          duration,
          position: leftClip.duration - duration / 2,
        })

        await applyTransition(rightClip.id, transition.id, {
          type: "in",
          duration,
          position: 0,
        })

        // Сохраняем проект после применения перехода
        await saveProject()

        // Вызываем callback если предоставлен
        onDrop?.(transition)
      } catch (error) {
        logger.error("Failed to apply transition:", { error })
      }
    },
    [leftClip, rightClip, applyTransition, onDrop, saveProject],
  )

  // Обработка drop события когда отпускают ресурс
  useEffect(() => {
    if (isOver && dragState.draggedResourceType === "transition" && dragState.draggedResource) {
      handleTransitionApply(dragState.draggedResource)
    }
  }, [isOver, dragState.draggedResourceType, dragState.draggedResource, handleTransitionApply])

  // Проверяем, можем ли принять текущий перетаскиваемый элемент
  const canAcceptDrop = dragState.isDragging && dragState.draggedResourceType === "transition"

  // Если клипы не соседние, не показываем зону
  if (Math.abs(gap) > 0.01) {
    return null
  }

  // Проверяем есть ли уже переход между клипами
  const hasExistingTransition =
    leftClip.transitions?.some((t) => t.type === "out") || rightClip.transitions?.some((t) => t.type === "in")

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        if (dropZoneRef.current !== el) {
          dropZoneRef.current = el
        }
      }}
      className={cn("absolute top-0 bottom-0 z-10", "transition-all duration-200", isOver && "scale-110", className)}
      style={{
        left: left - 15, // Центрируем зону
        width: 30, // Ширина зоны
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Визуальный индикатор */}
      <div
        className={cn(
          "absolute inset-0 rounded",
          "border-2 border-dashed transition-all",
          isOver && canAcceptDrop
            ? "border-primary bg-primary/20"
            : isHovered || (canAcceptDrop && !hasExistingTransition)
              ? "border-muted-foreground/50 bg-muted/20"
              : "border-transparent",
          hasExistingTransition && "opacity-50",
        )}
      >
        {/* Центральная линия */}
        <div
          className={cn(
            "absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5",
            "transition-all",
            isOver ? "bg-primary" : isHovered ? "bg-muted-foreground/50" : "bg-transparent",
          )}
        />

        {/* Иконка при наведении */}
        {(isOver || isHovered) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                "text-xs font-bold",
                isOver ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground",
              )}
            >
              +
            </div>
          </div>
        )}
      </div>

      {/* Подсказка при наведении */}
      {isOver && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md">
            Отпустите для добавления перехода
          </div>
        </div>
      )}
    </div>
  )
})
