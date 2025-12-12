/**
 * Video Editing Domain
 *
 * Домен для управления редактированием видео
 */

export { PlayerProvider, usePlayer } from "@/features/timeline/providers/player-provider"
export { ResourcesProvider, useResources } from "@/features/timeline/providers/resources-provider"
// Экспорт провайдеров (реэкспорт из features для обратной совместимости)
export {
  TimelineClipsProvider,
  TimelineEffectsProvider,
  TimelineKeyframesProvider,
  TimelineMarkersProvider,
  TimelinePlaybackProvider,
  TimelineProjectProvider,
  TimelineProvider,
  TimelineSelectionProvider,
  TimelineTracksProvider,
  useTimelineClips,
  useTimelineEffects,
  useTimelineKeyframes,
  useTimelineMarkers,
  useTimelinePlayback,
  useTimelineProject,
  useTimelineSelection,
  useTimelineTracks,
} from "@/features/timeline/providers/timeline-providers"
export {
  UndoRedoProvider,
  useClipUndoRedo,
  useKeyframeUndoRedo,
  useTrackUndoRedo,
  useUndoRedoContext,
} from "@/features/timeline/providers/undo-redo-provider"
export { useVideoEditingContext, VideoEditingProvider } from "@/features/timeline/providers/video-editing-provider"
export type { UseUndoRedoReturn } from "./hooks/use-undo-redo"
export { UndoRedoHelpers, useUndoRedo } from "./hooks/use-undo-redo"
// Экспорт типов машин
// Экспорт типов контекста и событий
export type { PlayerContext, PlayerEvent, PlayerMachine } from "./machines/player-machine"
// Экспорт машин
export { playerMachine } from "./machines/player-machine"
export type { TimelineContext, TimelineEvent, TimelineMachine } from "./machines/timeline-machine"
export { timelineMachine } from "./machines/timeline-machine"
// Экспорт compiler services
export * from "./services/compiler"
// Экспорт effects services
export * from "./services/effects"
// Экспорт import-export
export * from "./services/import-export"
export type { ActionType, UndoRedoAction, UndoRedoResult } from "./services/undo-redo-service"
// Экспорт undo-redo
export { UndoRedoService } from "./services/undo-redo-service"
// Экспорт оркестратора
export {
  getPlayerActor,
  getTimelineActor,
  getVideoEditingOrchestrator,
  VideoEditingOrchestrator,
} from "./services/video-editing-orchestrator"
// Экспорт Tauri Commands (Advanced) - экспортируем только функции, не дублирующиеся с services/compiler
export {
  addEffectToClip,
  addFilterToClip,
  checkFfmpegCapabilities,
  checkHardwareAccelerationSupport,
  configureCache,
  createEffect,
  createFilter,
  deleteUserEffect,
  deleteUserEffectById,
  extractRecognitionFrames,
  extractSubtitleFrames,
  extractTimelineFrames,
  getCompilerSettingsAdvanced,
  getGpuCapabilitiesFull,
  getRenderProgress,
  getSystemInfo,
  getUserEffectsList,
  loadEffectsCollection,
  loadFile,
  loadUserEffect,
  removeEffectFromClip,
  removeFilterFromClip,
  saveEffectsCollection,
  saveFile,
  saveUserEffect,
  setHardwareAcceleration,
} from "./tauri/compiler-commands"
// Экспорт типов
export * from "./types"
// Экспорт утилит
export * from "./utils"
