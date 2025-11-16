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

  // Проект создан на backend
  // Полное состояние проекта придет через отдельный запрос или следующие события
  return {
    isLoading: false,
    hasUnsavedChanges: false,
    error: null,
  }
}

function handleProjectOpened(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectOpened" }>,
): Partial<ProjectManagementContext> {
  const { project_id, path } = event.payload

  logger.info("Project opened:", { projectId: project_id, path })

  // Проект открыт на backend
  // Полное состояние проекта будет получено через getProjectState()
  return {
    isLoading: false,
    hasUnsavedChanges: false,
    error: null,
  }
}

function handleProjectSaved(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectSaved" }>,
): Partial<ProjectManagementContext> {
  const { project_id, path } = event.payload

  logger.info("Project saved:", { projectId: project_id, path })

  // Проект сохранен на backend
  return {
    hasUnsavedChanges: false,
    error: null,
  }
}

function handleProjectClosed(
  _context: ProjectManagementContext,
  event: Extract<ProjectEvent, { type: "ProjectClosed" }>,
): Partial<ProjectManagementContext> {
  const { project_id } = event.payload

  logger.info("Project closed:", { projectId: project_id })

  // Проект закрыт на backend - очищаем состояние
  return {
    projectState: null,
    hasUnsavedChanges: false,
    error: null,
  }
}
