import { getVideoEditingBindings } from "@/core/services/video-editing-registry"
import type { ActionType, UndoRedoAction } from "../../services/undo-redo-service"

interface Clip {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  mediaId: string
}

interface UndoRedoHistoryStats {
  totalActions: number
  undoCount: number
  redoableActions: number
  redoCount: number
  historySize: number
  currentIndex: number
  actionsByType: Record<string, number>
  memoryUsage: number
  maxHistorySize: number
}

export interface UseUndoRedoReturn {
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  undoMultiple: (count: number) => Promise<boolean>
  redoMultiple: (count: number) => Promise<boolean>
  undoToAction: (actionId: string) => Promise<boolean>
  undoByType: (actionType: ActionType, maxCount?: number) => Promise<boolean>
  undoByEntity: (entityIds: string[], entityType: "clips" | "tracks" | "keyframes") => Promise<boolean>
  startGrouping: (description?: string) => string
  endGrouping: () => void
  undoGroup: (groupId: string) => Promise<boolean>
  canUndo: boolean
  canRedo: boolean
  historyStats: UndoRedoHistoryStats
  undoableActions: UndoRedoAction[]
  redoableActions: UndoRedoAction[]
  clearHistory: () => void
  optimizeHistory: () => void
  setMaxHistorySize: (size: number) => void
  registerAction: (action: Omit<UndoRedoAction, "id" | "timestamp">) => string
}

export function useUndoRedo(): UseUndoRedoReturn {
  return getVideoEditingBindings().useUndoRedo()
}

export const UndoRedoHelpers = {
  createAddClipAction: (clipId: string, trackId: string, mediaFile: any, time: number) =>
    getVideoEditingBindings().UndoRedoHelpers.createAddClipAction(clipId, trackId, mediaFile, time),

  createRemoveClipAction: (clip: Clip) => getVideoEditingBindings().UndoRedoHelpers.createRemoveClipAction(clip),

  createMoveClipAction: (clipId: string, oldTrackId: string, oldTime: number, newTrackId: string, newTime: number) =>
    getVideoEditingBindings().UndoRedoHelpers.createMoveClipAction(clipId, oldTrackId, oldTime, newTrackId, newTime),

  createBatchOperationAction: (description: string, originalClips: Clip[], updatedClips: Clip[]) =>
    getVideoEditingBindings().UndoRedoHelpers.createBatchOperationAction(description, originalClips, updatedClips),
}
