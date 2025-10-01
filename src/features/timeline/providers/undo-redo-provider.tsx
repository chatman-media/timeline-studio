/**
 * Adapter для миграции на доменный UndoRedoProvider
 *
 * Этот файл обеспечивает обратную совместимость
 */

export {
  UndoRedoProvider,
  useClipUndoRedo,
  useKeyframeUndoRedo,
  useTrackUndoRedo,
  useUndoRedoContext,
} from "@/domains/video-editing/providers/undo-redo-provider"
