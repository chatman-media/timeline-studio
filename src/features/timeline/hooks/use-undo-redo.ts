/**
 * Adapter для миграции на доменный useUndoRedo
 *
 * Этот файл обеспечивает обратную совместимость
 */

export type { UseUndoRedoReturn } from "@/domains/video-editing/hooks/use-undo-redo"
export { UndoRedoHelpers, useUndoRedo } from "@/domains/video-editing/hooks/use-undo-redo"
