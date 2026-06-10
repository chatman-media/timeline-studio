import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"

const logger = createLogger("UndoBackendEventHandlers")

export interface UndoRedoState {
  canUndo: boolean
  canRedo: boolean
  undoHistory: UndoAction[]
  redoHistory: UndoAction[]
  lastActionId: string | null
}

export interface UndoAction {
  id: string
  action_type: string
  description: string
  timestamp: string
  undo_data: unknown
  redo_data: unknown
}

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

function handleUndoPerformed(
  _currentState: UndoRedoState,
  event: Extract<ProjectEvent, { type: "UndoPerformed" }>,
): Partial<UndoRedoState> {
  const { action_id, description } = event.payload

  logger.info("Undo performed:", {
    actionId: action_id,
    description,
  })

  return {
    lastActionId: action_id,
    canRedo: true,
  }
}

function handleRedoPerformed(
  _currentState: UndoRedoState,
  event: Extract<ProjectEvent, { type: "RedoPerformed" }>,
): Partial<UndoRedoState> {
  const { action_id, description } = event.payload

  logger.info("Redo performed:", {
    actionId: action_id,
    description,
  })

  return {
    lastActionId: action_id,
    canUndo: true,
  }
}

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

  return {
    lastActionId: action_id,
    canUndo: true,
    canRedo: false,
  }
}

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

export function createInitialUndoState(): UndoRedoState {
  return {
    canUndo: false,
    canRedo: false,
    undoHistory: [],
    redoHistory: [],
    lastActionId: null,
  }
}

export interface UndoHistoryResult {
  undo_history: UndoAction[]
  redo_history: UndoAction[]
  can_undo: boolean
  can_redo: boolean
}

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
