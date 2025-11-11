/**
 * Bridge между @dnd-kit и DragDropManager для межмодульного drag & drop
 *
 * Этот мост позволяет:
 * - Компонентам Browser/Resources использовать DragDropManager
 * - Timeline использовать @dnd-kit
 * - Обеим системам работать вместе без конфликтов
 */

import type { DragEndEvent } from "@dnd-kit/core"
import type { DraggableItem } from "@/features/drag-drop"
import { getDragDropManager } from "@/features/drag-drop"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("DragDropBridge")

/**
 * Конвертирует DragData из @dnd-kit в формат DragDropManager
 */
export function convertDndKitToDragDropManager(event: DragEndEvent): DraggableItem | null {
  const dragData = event.active.data.current

  if (!dragData) return null

  // Конвертируем @dnd-kit данные в формат DragDropManager
  return {
    type:
      dragData.type === "video"
        ? "media"
        : dragData.type === "audio"
          ? "media"
          : dragData.type === "image"
            ? "media"
            : "media",
    // Передаем весь dragData вместо только mediaFile для поддержки multi-select
    data: dragData.isMultiSelect ? dragData : dragData.mediaFile,
    preview: {
      url: dragData.mediaFile?.thumbnailPath,
      width: 100,
      height: 60,
    },
  }
}

/**
 * Проверяет, является ли drag операция межмодульной
 * (из Browser/Resources в Timeline)
 */
export function isInterModuleDrag(event: DragEndEvent): boolean {
  const dragId = event.active.id.toString()
  const dropId = event.over?.id?.toString()

  // Если нет drop target, то не межмодульный
  if (!dropId) return false

  // Drag из Browser/Resources (содержат префиксы)
  const isExternalDrag =
    dragId.includes("video-") || dragId.includes("audio-") || dragId.includes("effect-") || dragId.includes("filter-")

  // Drop в Timeline (содержат track- или track-insertion)
  const isTimelineDrop = dropId.includes("track-") || dropId.includes("track-insertion")

  return isExternalDrag && isTimelineDrop
}

/**
 * Обрабатывает межмодульный drag & drop через bridge
 * Теперь непосредственно интегрируется с Timeline actions вместо эмуляции событий
 */
export function handleInterModuleDrag(
  event: DragEndEvent,
  timelineActions?: {
    addSingleMediaToTimeline: (file: any, trackId?: string, startTime?: number) => Promise<void>
    addMediaToTimeline?: (files: any[]) => Promise<void>
  },
  dragState?: { dropPosition?: { startTime?: number } },
): boolean {
  if (!isInterModuleDrag(event)) return false

  const dragData = convertDndKitToDragDropManager(event)
  if (!dragData) return false

  try {
    const dropId = event.over?.id?.toString()
    if (!dropId) return false

    // Если у нас есть Timeline actions, используем их напрямую
    if (timelineActions && dragData.data) {
      // Определяем параметры для Timeline
      let targetTrackId: string | undefined
      let startTime = 0

      // Обработка разных типов drop zones
      if (dropId.includes("track-insertion")) {
        // Создание нового трека - оставляем targetTrackId undefined
        targetTrackId = undefined
      } else if (dropId.startsWith("track-")) {
        // Drop на существующий трек
        targetTrackId = dropId.replace("track-", "")

        // Извлекаем точное время из dragState если доступно
        if (dragState?.dropPosition?.startTime !== undefined) {
          startTime = dragState.dropPosition.startTime
        }
      }

      // Проверяем на multi-select данные
      const dragItem = dragData.data
      const isMultiSelectDrag =
        dragItem &&
        typeof dragItem === "object" &&
        "isMultiSelect" in dragItem &&
        dragItem.isMultiSelect === true &&
        "selectedFiles" in dragItem &&
        Array.isArray(dragItem.selectedFiles)

      if (isMultiSelectDrag && timelineActions.addMediaToTimeline) {
        // Multi-select drag & drop - добавляем все выбранные файлы
        logger.info("[DragDropBridge] Multi-select drag detected:", dragItem.selectedFiles.length)
        void timelineActions.addMediaToTimeline(dragItem.selectedFiles)
        logger.info(
          "[DragDropBridge] Successfully added multiple media via Timeline actions:",
          dragItem.selectedFiles.length,
        )
      } else {
        // Single file drag & drop
        void timelineActions.addSingleMediaToTimeline(dragData.data, targetTrackId, startTime)
        logger.info(
          "[DragDropBridge] Successfully added media via Timeline actions:",
          dragData.data.name || "media file",
        )
      }
      return true
    }

    // Fallback: эмулируем события DragDropManager для совместимости
    const manager = getDragDropManager()
    manager.emit("dragStart", dragData)
    manager.emit("drop", dragData, { id: dropId })
    manager.emit("dragEnd")

    logger.info("[DragDropBridge] Successfully bridged inter-module drag:", { type: dragData.type })
    return true
  } catch (error) {
    logger.error("[DragDropBridge] Failed to bridge drag:", { error })
    return false
  }
}

/**
 * Инициализирует bridge между системами
 */
export function initializeDragDropBridge() {
  logger.info("[DragDropBridge] Initializing drag & drop bridge")

  // Bridge готов к использованию
  // Timeline будет вызывать handleInterModuleDrag в своём DragEndHandler
}

/**
 * Статус bridge системы
 */
export function getBridgeStatus() {
  return {
    initialized: true,
    dndKitAvailable: typeof window !== "undefined",
    dragDropManagerAvailable: !!getDragDropManager(),
    supportedTypes: ["media", "music", "effect", "filter", "transition", "template"],
  }
}
