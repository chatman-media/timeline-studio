/**
 * Backend Event Handlers для Undo/Redo
 *
 * Обрабатывает события от Rust backend для undo/redo операций
 * Следует паттерну event-driven architecture
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"

const logger = createLogger("UndoBackendEventHandlers")

/**
 * Состояние Undo/Redo для синхронизации с backend
 */
export interface UndoRedoState {
  canUndo: boolean
  canRedo: boolean
  undoHistory: UndoAction[]
  redoHistory: UndoAction[]
  lastActionId: string | null
}

/**
 * Действие для Undo/Redo
 */
export interface UndoAction {
  id: string
  action_type: string
  description: string
  timestamp: string
  undo_data: unknown
  redo_data: unknown
}

/**
 * Обработчик событий Undo/Redo от backend
 */
export function handleUndoBackendEvent(currentState: UndoRedoState, event: ProjectEvent): Partial<UndoRedoState> {
  logger.info("Handling undo/redo backend event:", { event: event.type })

  switch (event.type) {
    case "UndoPerformed":
      return handleUndoPerformed(currentState, event)
    case "RedoPerformed":
      return handleRedoPerformed(currentState, event)
    case "ActionRegistered":
      return handleActionRegistered(currentState, event)
    case "UndoHistoryCleared":
      return handleHistoryCleared(currentState)
    default:
      return {}
  }
}

/**
 * Обработка события выполнения Undo
 */
function handleUndoPerformed(
  _currentState: UndoRedoState,
  event: Extract<ProjectEvent, { type: "UndoPerformed" }>,
): Partial<UndoRedoState> {
  const { action_id, description } = event.payload

  logger.info("Undo performed:", {
    actionId: action_id,
    description,
  })

  // Backend уже выполнил undo, теперь просто обновляем состояние
  // Реальное состояние истории будет синхронизировано через GetUndoHistory
  return {
    lastActionId: action_id,
    // Optimistic update - предполагаем что можем redo после undo
    canRedo: true,
  }
}

/**
 * Обработка события выполнения Redo
 */
function handleRedoPerformed(
  _currentState: UndoRedoState,
  event: Extract<ProjectEvent, { type: "RedoPerformed" }>,
): Partial<UndoRedoState> {
  const { action_id, description } = event.payload

  logger.info("Redo performed:", {
    actionId: action_id,
    description,
  })

  // Backend уже выполнил redo, теперь просто обновляем состояние
  return {
    lastActionId: action_id,
    // Optimistic update - предполагаем что можем undo после redo
    canUndo: true,
  }
}

/**
 * Обработка события регистрации нового действия
 */
function handleActionRegistered(
  _currentState: UndoRedoState,
  event: Extract<ProjectEvent, { type: "ActionRegistered" }>,
): Partial<UndoRedoState> {
  const { action_id, action_type, description } = event.payload

  logger.info("Action registered:", {
    actionId: action_id,
    actionType: action_type,
    description,
  })

  // Новое действие зарегистрировано - можем делать undo
  // Redo стек должен очиститься
  return {
    lastActionId: action_id,
    canUndo: true,
    canRedo: false,
  }
}

/**
 * Обработка события очистки истории
 */
function handleHistoryCleared(_currentState: UndoRedoState): Partial<UndoRedoState> {
  logger.info("Undo/Redo history cleared")

  return {
    canUndo: false,
    canRedo: false,
    undoHistory: [],
    redoHistory: [],
    lastActionId: null,
  }
}

/**
 * Создать начальное состояние для Undo/Redo
 */
export function createInitialUndoState(): UndoRedoState {
  return {
    canUndo: false,
    canRedo: false,
    undoHistory: [],
    redoHistory: [],
    lastActionId: null,
  }
}

/**
 * Типизация для результата команды GetUndoHistory
 */
export interface UndoHistoryResult {
  undo_history: UndoAction[]
  redo_history: UndoAction[]
  can_undo: boolean
  can_redo: boolean
}

/**
 * Обработать результат загрузки истории
 */
export function handleHistoryLoaded(_currentState: UndoRedoState, result: UndoHistoryResult): Partial<UndoRedoState> {
  logger.debug("Undo history loaded:", {
    undoCount: result.undo_history.length,
    redoCount: result.redo_history.length,
  })

  return {
    undoHistory: result.undo_history,
    redoHistory: result.redo_history,
    canUndo: result.can_undo,
    canRedo: result.can_redo,
  }
}
