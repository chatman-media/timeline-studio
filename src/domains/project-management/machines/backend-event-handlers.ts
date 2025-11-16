/**
 * Backend Event Handlers для Project Management
 *
 * Обрабатывает события от Rust backend и обновляет состояние машины
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"

const logger = createLogger("ProjectBackendEventHandlers")

/**
 * Context для Project Management Provider
 * Упрощенная версия без XState машины
 */
export interface ProjectManagementContext {
  projectState: ProjectState | null
  isLoading: boolean
  hasUnsavedChanges: boolean
  error: string | null
  // Dirty flag tracking для auto-save
  isDirty: boolean
  lastModifiedTime: number | null
  lastSavedTime: number | null
}

/**
 * Главный обработчик backend событий для Project Management
 */
export function handleProjectBackendEvent(
  context: ProjectManagementContext,
  event: ProjectEvent,
): Partial<ProjectManagementContext> {
  logger.info("Handling project backend event:", { event: event.type })

  switch (event.type) {
    // Project Lifecycle Events
    case "ProjectCreated":
      return handleProjectCreated(context, event)
    case "ProjectOpened":
      return handleProjectOpened(context, event)
    case "ProjectSaved":
      return handleProjectSaved(context, event)
    case "ProjectClosed":
      return handleProjectClosed(context, event)

    default:
      logger.debug("Unhandled project backend event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Project Lifecycle Handlers
// ============================================================================

function handleProjectCreated(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectCreated" }>,
): Partial<ProjectManagementContext> {
  const { project_id, name } = event.payload

  logger.info("Project created:", { projectId: project_id, name })

  const now = Date.now()

  // Проект создан на backend - новый проект чистый (не dirty)
  return {
    isLoading: false,
    hasUnsavedChanges: false,
    isDirty: false,
    lastModifiedTime: now,
    lastSavedTime: now,
    error: null,
  }
}

function handleProjectOpened(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectOpened" }>,
): Partial<ProjectManagementContext> {
  const { project_id, path } = event.payload

  logger.info("Project opened:", { projectId: project_id, path })

  const now = Date.now()

  // Проект открыт на backend - открытый проект чистый (только что загружен)
  return {
    isLoading: false,
    hasUnsavedChanges: false,
    isDirty: false,
    lastModifiedTime: now,
    lastSavedTime: now,
    error: null,
  }
}

function handleProjectSaved(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectSaved" }>,
): Partial<ProjectManagementContext> {
  const { project_id, path } = event.payload

  logger.info("Project saved:", { projectId: project_id, path })

  const now = Date.now()

  // Проект сохранен на backend - очищаем dirty flag
  return {
    hasUnsavedChanges: false,
    isDirty: false,
    lastSavedTime: now,
    error: null,
  }
}

function handleProjectClosed(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectClosed" }>,
): Partial<ProjectManagementContext> {
  const { project_id } = event.payload

  logger.info("Project closed:", { projectId: project_id })

  // Проект закрыт на backend - очищаем всё состояние включая dirty flags
  return {
    projectState: null,
    hasUnsavedChanges: false,
    isDirty: false,
    lastModifiedTime: null,
    lastSavedTime: null,
    error: null,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Помечает проект как измененный (dirty)
 * Используется когда происходят изменения в проекте
 */
export function markProjectDirty(context: ProjectManagementContext): Partial<ProjectManagementContext> {
  const now = Date.now()

  logger.debug("Marking project as dirty")

  return {
    isDirty: true,
    hasUnsavedChanges: true,
    lastModifiedTime: now,
  }
}

/**
 * Помечает проект как чистый (clean)
 * Используется после успешного сохранения
 */
export function markProjectClean(context: ProjectManagementContext): Partial<ProjectManagementContext> {
  const now = Date.now()

  logger.debug("Marking project as clean")

  return {
    isDirty: false,
    hasUnsavedChanges: false,
    lastSavedTime: now,
  }
}
