/**
 * Drop Zone для клипов - позволяет перетаскивать эффекты, фильтры и переходы на клипы
 */

import { memo, useCallback, useEffect, useRef, useState } from "react"
import type { DragDropManager, DraggableItem, DropTarget } from "@/features/drag-drop/services/drag-drop-manager"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useClipResources } from "../../hooks/use-clip-resources"
import type { TimelineClip } from "../../types"

const logger = createLogger("ClipDropZone")

interface ClipDropZoneProps {
  clip: TimelineClip
  className?: string
  children: React.ReactNode
}

export const ClipDropZone = memo(function ClipDropZone({ clip, className, children }: ClipDropZoneProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [canAcceptDrag, setCanAcceptDrag] = useState(false)
  const [dragType, setDragType] = useState<string>("")

  const {
    applyEffectToClip,
    applyFilterToClip,
    applyTransitionToClip,
    canApplyEffectToClip,
    canApplyFilterToClip,
    canApplyTransitionToClip,
  } = useClipResources()

  // Обработчик drop
  const handleDrop = useCallback(
    (item: DraggableItem, event: DragEvent) => {
      event.preventDefault()

      setIsDragOver(false)
      setCanAcceptDrag(false)
      setDragType("")

      if (!canAcceptDrag) return

      try {
        switch (item.type) {
          case "effect":
            applyEffectToClip(clip.id, item.data)
            break
          case "filter":
            applyFilterToClip(clip.id, item.data)
            break
          case "transition":
            // Определяем тип перехода по позиции в клипе
            if (dropZoneRef.current) {
              const rect = dropZoneRef.current.getBoundingClientRect()
              const relativeX = event.clientX - rect.left
              const type = relativeX < rect.width / 2 ? "in" : "out"
              applyTransitionToClip(clip.id, item.data, type)
            }
            break
          case "style-template":
            // Style template можно применить как эффект или переход в зависимости от категории
            const template = item.data
            if (template.category === "transition") {
              // Применяем как переход
              if (dropZoneRef.current) {
                const rect = dropZoneRef.current.getBoundingClientRect()
                const relativeX = event.clientX - rect.left
                const type = relativeX < rect.width / 2 ? "in" : "out"
                applyTransitionToClip(clip.id, template, type)
              }
            } else {
              // Применяем как эффект (intro, outro, lower-third, overlay)
              applyEffectToClip(clip.id, template)
            }
            break
        }
      } catch (error) {
        logger.error("Error applying resource to clip:", { error })
      }
    },
    [clip.id, canAcceptDrag, applyEffectToClip, applyFilterToClip, applyTransitionToClip],
  )

  // Обработчик drag enter
  const handleDragEnter = useCallback(
    (item: DraggableItem) => {
      setIsDragOver(true)
      setDragType(item.type)

      // Проверяем совместимость
      let canAccept = false
      switch (item.type) {
        case "effect":
          canAccept = canApplyEffectToClip(clip.id, item.data)
          break
        case "filter":
          canAccept = canApplyFilterToClip(clip.id, item.data)
          break
        case "transition":
          canAccept = canApplyTransitionToClip(clip.id, item.data)
          break
        case "style-template":
          // Style template всегда можно применить
          canAccept = true
          break
      }

      setCanAcceptDrag(canAccept)
    },
    [clip.id, canApplyEffectToClip, canApplyFilterToClip, canApplyTransitionToClip],
  )

  // Обработчик drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
    setCanAcceptDrag(false)
    setDragType("")
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
      id: `clip-${clip.id}`,
      accepts: ["effect", "filter", "transition", "style-template"],
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
  }, [clip.id, handleDragEnter, handleDragOver, handleDragLeave, handleDrop])

  // Fallback для обычных HTML drag events (если DragDropManager недоступен)
  const handleNativeDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    // Проверяем тип перетаскиваемых данных
    const hasEffect = event.dataTransfer.types.includes("effect")
    const hasFilter = event.dataTransfer.types.includes("filter")
    const hasTransition = event.dataTransfer.types.includes("transition")
    const hasStyleTemplate = event.dataTransfer.types.includes("style-template")

    if (hasEffect || hasFilter || hasTransition || hasStyleTemplate) {
      setIsDragOver(true)
      event.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleNativeDragLeave = useCallback((event: React.DragEvent) => {
    // Проверяем, что курсор действительно покинул элемент
    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (!rect) return

    const { clientX, clientY } = event
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setIsDragOver(false)
      setCanAcceptDrag(false)
      setDragType("")
    }
  }, [])

  const handleNativeDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      setCanAcceptDrag(false)
      setDragType("")

      // Пытаемся получить данные из dataTransfer
      try {
        const applicationData = event.dataTransfer.getData("application/json")
        if (applicationData) {
          const item = JSON.parse(applicationData) as DraggableItem
          handleDrop(item, event.nativeEvent)
        }
      } catch (error) {
        logger.warn("Could not parse drag data:", { error })
      }
    },
    [handleDrop],
  )

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative transition-all duration-200",
        isDragOver && canAcceptDrag && "ring-2 ring-blue-400 ring-opacity-50",
        isDragOver && !canAcceptDrag && "ring-2 ring-red-400 ring-opacity-50",
        className,
      )}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
    >
      {children}

      {/* Overlay для показа типа перетаскиваемого ресурса */}
      {isDragOver && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "backdrop-blur-sm rounded transition-all duration-200",
            canAcceptDrag
              ? "bg-blue-500/20 border-2 border-blue-400 border-dashed"
              : "bg-red-500/20 border-2 border-red-400 border-dashed",
          )}
        >
          <div
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              canAcceptDrag ? "bg-blue-500 text-white" : "bg-red-500 text-white",
            )}
          >
            {canAcceptDrag
              ? dragType === "effect"
                ? "Добавить эффект"
                : dragType === "filter"
                  ? "Добавить фильтр"
                  : dragType === "transition"
                    ? "Добавить переход"
                    : dragType === "style-template"
                      ? "Добавить шаблон"
                      : "Добавить ресурс"
              : "Несовместимый ресурс"}
          </div>
        </div>
      )}
    </div>
  )
})
