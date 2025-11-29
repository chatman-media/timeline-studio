/**
 * Drop Zone для категории ресурсов
 * Позволяет перетаскивать элементы из браузера в панель ресурсов
 */

import { Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { DraggableItem } from "@/features/drag-drop/services/drag-drop-manager"
import { getDragDropManager } from "@/features/drag-drop/services/drag-drop-manager"
import { cn } from "@/lib/utils"
import { useResources } from "../services/resources-provider"

interface ResourceCategoryDropZoneProps {
  categoryId: string
  categoryName: string
  acceptedTypes: Array<
    "media" | "music" | "effect" | "filter" | "transition" | "template" | "style-template" | "subtitle-style"
  >
  children: React.ReactNode
}

export function ResourceCategoryDropZone({
  categoryId,
  categoryName,
  acceptedTypes,
  children,
}: ResourceCategoryDropZoneProps) {
  const { t } = useTranslation()
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [canAcceptDrag, setCanAcceptDrag] = useState(false)

  const { addMedia, addMusic, addEffect, addFilter, addTransition, addTemplate, addStyleTemplate, addSubtitle } =
    useResources()

  // Обработчик drop
  const handleDrop = useCallback(
    async (item: DraggableItem, event: DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      setCanAcceptDrag(false)

      if (!canAcceptDrag) return

      try {
        switch (item.type) {
          case "media":
            await addMedia(item.data)
            break
          case "music":
            await addMusic(item.data)
            break
          case "effect":
            await addEffect(item.data)
            break
          case "filter":
            await addFilter(item.data)
            break
          case "transition":
            await addTransition(item.data)
            break
          case "template":
            await addTemplate(item.data)
            break
          case "style-template":
            await addStyleTemplate(item.data)
            break
          case "subtitle-style":
            await addSubtitle(item.data)
            break
        }
      } catch (error) {
        console.error("Error adding resource:", error)
      }
    },
    [
      canAcceptDrag,
      addMedia,
      addMusic,
      addEffect,
      addFilter,
      addTransition,
      addTemplate,
      addStyleTemplate,
      addSubtitle,
    ],
  )

  // Обработчик drag enter
  const handleDragEnter = useCallback(
    (item: DraggableItem) => {
      setIsDragOver(true)

      // Проверяем совместимость типа
      const canAccept = acceptedTypes.includes(item.type as any)
      setCanAcceptDrag(canAccept)
    },
    [acceptedTypes],
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
    const dragDropManager = getDragDropManager()
    if (!dragDropManager || !dropZoneRef.current) return

    const dropTarget = {
      id: `resource-category-${categoryId}`,
      accepts: acceptedTypes,
      element: dropZoneRef.current,
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    }

    const unregister = dragDropManager.registerDropTarget(dropTarget)

    return () => {
      unregister()
    }
  }, [categoryId, acceptedTypes, handleDragEnter, handleDragOver, handleDragLeave, handleDrop])

  // Fallback для обычных HTML drag events
  const handleNativeDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      // Проверяем тип перетаскиваемых данных
      const hasAcceptedType = acceptedTypes.some(
        (type) => event.dataTransfer.types.includes(type) || event.dataTransfer.types.includes("application/json"),
      )

      if (hasAcceptedType) {
        setIsDragOver(true)
        event.dataTransfer.dropEffect = "copy"
      }
    },
    [acceptedTypes],
  )

  const handleNativeDragLeave = useCallback((event: React.DragEvent) => {
    // Проверяем, что курсор действительно покинул элемент
    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (!rect) return

    const { clientX, clientY } = event
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setIsDragOver(false)
      setCanAcceptDrag(false)
    }
  }, [])

  const handleNativeDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      setCanAcceptDrag(false)

      // Пытаемся получить данные из dataTransfer
      try {
        const applicationData = event.dataTransfer.getData("application/json")
        if (applicationData) {
          const item = JSON.parse(applicationData) as DraggableItem
          handleDrop(item, event.nativeEvent)
        }
      } catch (error) {
        console.warn("Could not parse drag data:", error)
      }
    },
    [handleDrop],
  )

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative transition-all duration-200",
        isDragOver && canAcceptDrag && "ring-2 ring-blue-400/50 rounded",
        isDragOver && !canAcceptDrag && "ring-2 ring-red-400/50 rounded",
      )}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
    >
      {children}

      {/* Overlay для показа возможности drop */}
      {isDragOver && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "backdrop-blur-sm rounded transition-all duration-200 z-10",
            canAcceptDrag
              ? "bg-blue-500/20 border-2 border-blue-400 border-dashed"
              : "bg-red-500/20 border-2 border-red-400 border-dashed",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
              canAcceptDrag ? "bg-blue-500 text-white" : "bg-red-500 text-white",
            )}
          >
            {canAcceptDrag ? (
              <>
                <Upload className="h-3.5 w-3.5" />
                {t("timeline.resources.dropHere", "Добавить в {{category}}", { category: categoryName })}
              </>
            ) : (
              <>{t("timeline.resources.incompatibleType", "Несовместимый тип")}</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
