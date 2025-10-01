/**
 * Video Editing Domain
 *
 * Домен для управления редактированием видео
 */

export type { UseUndoRedoReturn } from "./hooks/use-undo-redo"
export { UndoRedoHelpers, useUndoRedo } from "./hooks/use-undo-redo"
// Экспорт типов машин
// Экспорт типов контекста и событий
export type { PlayerContext, PlayerEvent, PlayerMachine } from "./machines/player-machine"
// Экспорт машин
export { playerMachine } from "./machines/player-machine"
export type {
  TimelineExtendedContext,
  TimelineExtendedEvent,
  TimelineExtendedMachine,
} from "./machines/timeline-extended-machine"
export { timelineExtendedMachine } from "./machines/timeline-extended-machine"
export type { TimelineContext, TimelineEvent, TimelineMachine } from "./machines/timeline-machine"
export { timelineMachine } from "./machines/timeline-machine"
// Экспорт провайдеров
export {
  TimelineClipsProvider,
  TimelineEffectsProvider,
  TimelinePlaybackProvider,
  TimelineProjectProvider,
  TimelineProvider,
  TimelineSelectionProvider,
  TimelineTracksProvider,
  useTimelineClips,
  useTimelineEffects,
  useTimelinePlayback,
  useTimelineProject,
  useTimelineSelection,
  useTimelineTracks,
} from "./providers/timeline-providers"
export {
  UndoRedoProvider,
  useClipUndoRedo,
  useKeyframeUndoRedo,
  useTrackUndoRedo,
  useUndoRedoContext,
} from "./providers/undo-redo-provider"
// Экспорт import-export
export * from "./services/import-export"
export type { ActionType, UndoRedoAction, UndoRedoResult } from "./services/undo-redo-service"
// Экспорт undo-redo
export { UndoRedoService } from "./services/undo-redo-service"
// Экспорт оркестратора
export {
  getPlayerActor,
  getTimelineActor,
  getTimelineUIActor,
  getVideoEditingOrchestrator,
  VideoEditingOrchestrator,
} from "./services/video-editing-orchestrator"
// Экспорт типов
export * from "./types"
