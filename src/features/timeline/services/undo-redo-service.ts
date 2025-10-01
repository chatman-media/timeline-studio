/**
 * Adapter для миграции на доменный UndoRedoService
 *
 * Этот файл обеспечивает обратную совместимость
 */

export type {
  ActionPriority,
  ActionType,
  UndoRedoAction,
  UndoRedoResult,
} from "@/domains/video-editing/services/undo-redo-service"
export { UndoRedoService } from "@/domains/video-editing/services/undo-redo-service"
