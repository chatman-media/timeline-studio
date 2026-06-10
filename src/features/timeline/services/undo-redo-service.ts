export type ActionPriority = "low" | "medium" | "high" | "critical"

export type ActionType =
  | "CREATE_PROJECT"
  | "ADD_CLIP"
  | "REMOVE_CLIP"
  | "MOVE_CLIP"
  | "TRIM_CLIP"
  | "SPLIT_CLIP"
  | "UPDATE_CLIP"
  | "ADD_TRACK"
  | "REMOVE_TRACK"
  | "UPDATE_TRACK"
  | "REORDER_TRACKS"
  | "ADD_KEYFRAME"
  | "REMOVE_KEYFRAME"
  | "UPDATE_KEYFRAME"
  | "BATCH_OPERATION"
  | "ADD_EFFECT"
  | "REMOVE_EFFECT"
  | "UPDATE_EFFECT"
  | "APPLY_EFFECT"
  | "ADD_FILTER"
  | "REMOVE_FILTER"
  | "UPDATE_FILTER"
  | "APPLY_FILTER"
  | "ADD_TRANSITION"
  | "REMOVE_TRANSITION"
  | "UPDATE_TRANSITION"
  | "APPLY_TRANSITION"
  | "CUSTOM"

export interface UndoRedoAction {
  id: string
  type: ActionType
  description: string
  timestamp: number
  undoData: any
  redoData: any
  affectedEntities?: {
    clips?: string[]
    tracks?: string[]
    keyframes?: string[]
    effects?: string[]
  }
  groupId?: string
  priority?: ActionPriority
  mergeable?: boolean
}

export interface UndoRedoHistoryStats {
  totalActions: number
  historySize: number
  redoStackSize: number
  currentGroupSize: number
  maxHistorySize: number
}

export interface UndoRedoService {
  getHistoryStats(): UndoRedoHistoryStats
  clearHistory(): void
}
