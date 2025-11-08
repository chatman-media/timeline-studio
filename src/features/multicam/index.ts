/**
 * Мультикамерный модуль
 * Экспорт всех публичных API
 */

export { CameraSelector, MulticamIndicator } from "./components"
// Компоненты
export { AngleViewer } from "./components/angle-viewer"
export { SyncControls } from "./components/sync-controls"
export type { UseCameraSyncProps, UseCameraSyncReturn } from "./hooks/use-camera-sync"
export { useCameraSync } from "./hooks/use-camera-sync"
export type { MulticamState, UseMulticamReturn } from "./hooks/use-multicam"
// Хуки
export { useMulticam } from "./hooks/use-multicam"
export { useMulticamShortcuts } from "./hooks/use-multicam-shortcuts"

// Сервисы
export { multicamManager } from "./services/multicam-manager"
export * from "./services/timecode-sync"
// Типы
export type {
  CameraSwitchEvent,
  MulticamAngle,
  MulticamCommand,
  MulticamConfig,
  MulticamDisplaySettings,
  MulticamPlaybackState,
  SyncAnalysisResult,
  SyncMethod,
  SyncPoint,
  SyncResult,
  SyncStatus,
} from "./types/multicam"
