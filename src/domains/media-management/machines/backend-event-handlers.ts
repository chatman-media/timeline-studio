/**
 * Backend Event Handlers для Media Management
 *
 * Обрабатывает события от Rust backend и обновляет состояние медиа-пула
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import type { MediaInfo } from "../types"

const logger = createLogger("MediaBackendEventHandlers")

/**
 * Контекст для Media Management
 * Минимальный state для отслеживания медиа файлов
 */
export interface MediaManagementContext {
  mediaPool: Map<string, MediaInfo>
  isLoading: boolean
  error: string | null
}

/**
 * Главный обработчик backend событий для Media Management
 */
export function handleMediaBackendEvent(
  context: MediaManagementContext,
  event: ProjectEvent,
): Partial<MediaManagementContext> {
  logger.info("Handling media backend event:", { event: event.type })

  switch (event.type) {
    // Media Events
    case "MediaAdded":
      return handleMediaAdded(context, event)
    case "MediaRemoved":
      return handleMediaRemoved(context, event)
    case "MediaUpdated":
      return handleMediaUpdated(context, event)

    default:
      logger.debug("Unhandled media event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Media Event Handlers
// ============================================================================

/**
 * Обработка события MediaAdded
 * Добавляет новый медиа файл в media pool
 */
function handleMediaAdded(
  context: MediaManagementContext,
  event: Extract<ProjectEvent, { type: "MediaAdded" }>,
): Partial<MediaManagementContext> {
  const { media } = event.payload

  logger.info("Media added to pool:", {
    mediaId: media.id,
    path: media.path,
    type: media.media_type,
  })

  // Создаем новую копию media pool
  const updatedMediaPool = new Map(context.mediaPool)

  // Конвертируем backend MediaItem в frontend MediaInfo
  const mediaInfo: MediaInfo = {
    path: media.path,
    name: media.name,
    type: media.media_type as MediaType,
    duration: media.duration ?? undefined,
    thumbnailPath: media.thumbnail ?? undefined,
  }

  // Добавляем в pool
  updatedMediaPool.set(media.id, mediaInfo)

  return {
    mediaPool: updatedMediaPool,
    isLoading: false,
  }
}

/**
 * Обработка события MediaRemoved
 * Удаляет медиа файл из media pool
 */
function handleMediaRemoved(
  context: MediaManagementContext,
  event: Extract<ProjectEvent, { type: "MediaRemoved" }>,
): Partial<MediaManagementContext> {
  const { media_id } = event.payload

  logger.info("Media removed from pool:", { mediaId: media_id })

  // Создаем новую копию media pool
  const updatedMediaPool = new Map(context.mediaPool)

  // Удаляем из pool
  updatedMediaPool.delete(media_id)

  return {
    mediaPool: updatedMediaPool,
  }
}

/**
 * Обработка события MediaUpdated
 * Обновляет существующий медиа файл в media pool
 */
function handleMediaUpdated(
  context: MediaManagementContext,
  event: Extract<ProjectEvent, { type: "MediaUpdated" }>,
): Partial<MediaManagementContext> {
  const { media_id, changes } = event.payload

  logger.info("Media updated in pool:", {
    mediaId: media_id,
    changes,
  })

  // Создаем новую копию media pool
  const updatedMediaPool = new Map(context.mediaPool)

  // Получаем существующий media item
  const existingMedia = updatedMediaPool.get(media_id)

  if (!existingMedia) {
    logger.warn("Cannot update media - not found in pool:", { mediaId: media_id })
    return {}
  }

  // Обновляем media info с изменениями
  const updatedMedia: MediaInfo = {
    ...existingMedia,
    ...(changes.name && { name: changes.name }),
    ...(changes.thumbnail && { thumbnailPath: changes.thumbnail }),
  }

  // Обновляем в pool
  updatedMediaPool.set(media_id, updatedMedia)

  return {
    mediaPool: updatedMediaPool,
  }
}
