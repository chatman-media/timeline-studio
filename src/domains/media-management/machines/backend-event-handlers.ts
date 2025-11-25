/**
 * Backend Event Handlers для Media Management
 *
 * Обрабатывает события от Rust backend и обновляет состояние медиа-пула
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/state-types-extensions"
import type { MediaType } from "@/types/generated/tauri-bindings"
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
    // Project Events - очищаем mediaPool при создании/закрытии проекта
    case "ProjectCreated":
    case "ProjectClosed":
      return handleProjectReset(context)

    // Media Events (media_pool - файлы добавленные в проект)
    case "MediaAdded":
      return handleMediaAdded(context, event)
    case "MediaRemoved":
      return handleMediaRemoved(context, event)
    case "MediaUpdated":
      return handleMediaUpdated(context, event)

    // Imported Media Events (imported_media - временное хранилище браузера)
    case "ImportedMediaAdded":
      return handleImportedMediaAdded(context, event)
    case "ImportedMediaRemoved":
      return handleImportedMediaRemoved(context, event)
    case "ImportedMediaUpdated":
      return handleImportedMediaUpdated(context, event)
    case "ImportedMediaCleared":
      return handleImportedMediaCleared(context)

    default:
      logger.debug("Unhandled media event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Project Event Handlers
// ============================================================================

/**
 * Обработка события ProjectCreated/ProjectClosed
 * Очищает mediaPool для нового/закрытого проекта
 */
function handleProjectReset(_context: MediaManagementContext): Partial<MediaManagementContext> {
  logger.info("Resetting media pool for new/closed project")

  return {
    mediaPool: new Map(),
    isLoading: false,
    error: null,
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
    id: media.id,
    path: media.path,
    name: media.name,
    type: media.media_type as MediaType,
    duration: media.duration ?? undefined,
    thumbnailPath: (media as any).thumbnail ?? undefined,
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

  // Обновляем media info с изменениями, сохраняя id
  const updatedMedia: MediaInfo = {
    ...existingMedia,
    id: media_id,
    ...(changes.name && { name: changes.name }),
    ...(changes.thumbnail && { thumbnailPath: changes.thumbnail }),
  }

  // Обновляем в pool
  updatedMediaPool.set(media_id, updatedMedia)

  return {
    mediaPool: updatedMediaPool,
  }
}

// ============================================================================
// Imported Media Event Handlers
// ============================================================================

/**
 * Обработка события ImportedMediaAdded
 * Добавляет импортированный медиа файл в media pool для отображения в браузере
 */
function handleImportedMediaAdded(
  context: MediaManagementContext,
  event: ProjectEvent,
): Partial<MediaManagementContext> {
  // Type guard
  if (event.type !== "ImportedMediaAdded") return {}

  const { media } = event.payload as {
    media: { id: string; path: string; name: string; media_type: string; duration?: number }
  }

  logger.info("Imported media added to pool:", {
    mediaId: media.id,
    path: media.path,
    name: media.name,
    type: media.media_type,
  })

  // Создаем новую копию media pool
  const updatedMediaPool = new Map(context.mediaPool)

  // Конвертируем backend MediaData в frontend MediaInfo
  const mediaInfo: MediaInfo = {
    id: media.id,
    path: media.path,
    name: media.name,
    type: media.media_type as MediaType,
    duration: media.duration ?? undefined,
  }

  // Добавляем в pool
  updatedMediaPool.set(media.id, mediaInfo)

  return {
    mediaPool: updatedMediaPool,
    isLoading: false,
  }
}

/**
 * Обработка события ImportedMediaRemoved
 * Удаляет импортированный медиа файл из media pool
 */
function handleImportedMediaRemoved(
  context: MediaManagementContext,
  event: ProjectEvent,
): Partial<MediaManagementContext> {
  // Type guard
  if (event.type !== "ImportedMediaRemoved") return {}

  const { media_id } = event.payload as { media_id: string }

  logger.info("Imported media removed from pool:", { mediaId: media_id })

  // Создаем новую копию media pool
  const updatedMediaPool = new Map(context.mediaPool)

  // Удаляем из pool
  updatedMediaPool.delete(media_id)

  return {
    mediaPool: updatedMediaPool,
  }
}

/**
 * Обработка события ImportedMediaUpdated
 * Обновляет импортированный медиа файл в media pool
 */
function handleImportedMediaUpdated(
  _context: MediaManagementContext,
  event: ProjectEvent,
): Partial<MediaManagementContext> {
  // Type guard
  if (event.type !== "ImportedMediaUpdated") return {}

  const { media_id } = event.payload as { media_id: string }

  logger.info("Imported media updated in pool:", { mediaId: media_id })

  // Для ImportedMediaUpdated бэкенд не присылает полные данные,
  // поэтому просто логируем. Данные обновятся при следующей синхронизации
  // или при получении состояния через getProjectState()
  return {}
}

/**
 * Обработка события ImportedMediaCleared
 * Очищает все импортированные медиа файлы из pool
 * Примечание: это очищает ВСЕ файлы из mediaPool, что может быть не желаемым поведением
 * если нужно очищать только imported, а не media_pool
 */
function handleImportedMediaCleared(_context: MediaManagementContext): Partial<MediaManagementContext> {
  logger.info("All imported media cleared from pool")

  // При очистке imported_media мы НЕ очищаем mediaPool полностью,
  // так как там могут быть файлы из media_pool проекта.
  // Вместо этого нужно отфильтровать только imported файлы,
  // но для этого нужно хранить метаданные об источнике файла.
  // Пока оставляем как есть - бэкенд сам управляет состоянием.
  return {}
}
