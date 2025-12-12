/**
 * Transition Drop Zone - зона для добавления переходов между клипами
 */

import { memo, useCallback, useEffect, useRef, useState } from "react"
import type { Transition } from "@/domains/video-editing/types"
import type { DragDropManager, DraggableItem, DropTarget } from "@/features/drag-drop/services/drag-drop-manager"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useTimelineEffects } from "../../hooks/effects/use-timeline-effects"
import type { TimelineClip } from "../../types"

const logger = createLogger("TransitionDropZone")

interface TransitionDropZoneProps {
  leftClip: TimelineClip
  rightClip: TimelineClip
  trackId: string
  position: number // Позиция между клипами в секундах
  className?: string
}

export const TransitionDropZone = memo(function TransitionDropZone({
  leftClip,
  rightClip,
  // trackId,
  // position,
  className,
}: TransitionDropZoneProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [canAcceptDrag, setCanAcceptDrag] = useState(false)
  const { applyTransition } = useTimelineEffects()

  // Проверка совместимости клипов для перехода
  const canApplyTransitionBetweenClips = useCallback(
    (_transition: Transition): boolean => {
      // Переходы можно применять только между видео/изображениями
      const isLeftCompatible = leftClip.type === "video" || leftClip.type === "image"
      const isRightCompatible = rightClip.type === "video" || rightClip.type === "image"

      return isLeftCompatible && isRightCompatible
    },
    [leftClip.type, rightClip.type],
  )

  // Обработчик drop
  const handleDrop = useCallback(
    (item: DraggableItem, event: DragEvent) => {
      event.preventDefault()

      setIsDragOver(false)
      setCanAcceptDrag(false)

      if (!canAcceptDrag || item.type !== "transition") return

      const transition = item.data as Transition

      // Определяем длительность перехода (по умолчанию 1 секунда)
      const duration =
        typeof transition.duration === "number" ? transition.duration : transition.duration?.default || 1.0

      // Применяем переход к обоим клипам
      // Переход начинается за duration/2 до конца левого клипа
      // и заканчивается через duration/2 после начала правого клипа
      void applyTransition(leftClip.id, transition.id, {
        type: "out",
        duration,
        position: leftClip.duration - duration / 2,
      })

      void applyTransition(rightClip.id, transition.id, {
        type: "in",
        duration,
        position: 0,
      })
    },
    [canAcceptDrag, leftClip.id, leftClip.duration, rightClip.id, applyTransition],
  )

  // Обработчик drag enter
  const handleDragEnter = useCallback(
    (item: DraggableItem) => {
      setIsDragOver(true)

      if (item.type === "transition") {
        const canAccept = canApplyTransitionBetweenClips(item.data as Transition)
        setCanAcceptDrag(canAccept)
      } else {
        setCanAcceptDrag(false)
      }
    },
    [canApplyTransitionBetweenClips],
  )

  // Обработчик drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
    setCanAcceptDrag(false)
  }, [])

  // Обработчик drag over
  const handleDragOver = useCallback(
    (_item: DraggableItem, event: DragEvent) => {
      event.preventDefault()

      if (canAcceptDrag) {
        event.dataTransfer!.dropEffect = "copy"
      } else {
        event.dataTransfer!.dropEffect = "none"
      }
    },
    [canAcceptDrag],
  )

  // Регистрируем drop target при монтировании
  useEffect(() => {
    const dragDropManager = (window as any).dragDropManager as DragDropManager
    if (!dragDropManager || !dropZoneRef.current) return

    const dropTarget: DropTarget = {
      id: `transition-${leftClip.id}-${rightClip.id}`,
      accepts: ["transition"],
      element: dropZoneRef.current,
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    }

    dragDropManager.registerDropTarget(dropTarget)

    return () => {
      dragDropManager.unregisterDropTarget(dropTarget.id)
    }
  }, [leftClip.id, rightClip.id, handleDragEnter, handleDragOver, handleDragLeave, handleDrop])

  // Fallback для обычных HTML drag events
  const handleNativeDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    if (event.dataTransfer.types.includes("transition")) {
      setIsDragOver(true)
      event.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleNativeDragLeave = useCallback(() => {
    setIsDragOver(false)
    setCanAcceptDrag(false)
  }, [])

  const handleNativeDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      setCanAcceptDrag(false)

      try {
        const applicationData = event.dataTransfer.getData("application/json")
        if (applicationData) {
          const item = JSON.parse(applicationData) as DraggableItem
          if (item.type === "transition") {
            handleDrop(item, event.nativeEvent)
          }
        }
      } catch (error) {
        logger.warn("Could not parse drag data:", { error })
      }
    },
    [handleDrop],
  )

  // Проверяем есть ли уже переход между клипами
  const hasExistingTransition =
    leftClip.transitions.some((t) => t.type === "out") || rightClip.transitions.some((t) => t.type === "in")

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative w-8 h-full flex items-center justify-center",
        "transition-all duration-200 cursor-pointer",
        "hover:bg-white/10",
        isDragOver && canAcceptDrag && "bg-blue-500/30",
        isDragOver && !canAcceptDrag && "bg-red-500/30",
        hasExistingTransition && "bg-purple-500/20",
        className,
      )}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      title={hasExistingTransition ? "Переход применен" : "Перетащите переход сюда"}
    >
      {/* Визуальный индикатор */}
      <div className={cn("w-0.5 h-full", hasExistingTransition ? "bg-purple-400" : "bg-white/30")} />

      {/* Индикатор при перетаскивании */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
              canAcceptDrag ? "bg-blue-500 text-white" : "bg-red-500 text-white",
            )}
          >
            {canAcceptDrag ? "Добавить переход" : "Несовместимо"}
          </div>
        </div>
      )}
    </div>
  )
})

// Компонент для отображения примененного перехода
interface AppliedTransitionProps {
  leftClip: TimelineClip
  rightClip: TimelineClip
  duration: number
  onRemove?: () => void
}

export const AppliedTransition = memo(function AppliedTransition({
  leftClip,
  rightClip,
  duration,
  onRemove,
}: AppliedTransitionProps) {
  // Находим переходы на клипах
  const outTransition = leftClip.transitions.find((t) => t.type === "out")
  const inTransition = rightClip.transitions.find((t) => t.type === "in")

  const transitionName = outTransition?.transitionId || inTransition?.transitionId || "Переход"

  return (
    <div className="relative w-full h-full group">
      {/* Визуализация перехода */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-500/50 to-transparent" />

      {/* Информация о переходе */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/80 rounded px-2 py-1 text-xs text-white">
          <div className="font-medium">{transitionName}</div>
          <div className="text-white/70">{duration.toFixed(1)}s</div>
        </div>
      </div>

      {/* Кнопка удаления */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  )
})
