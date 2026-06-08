/**
 * Core Module
 *
 * Ядро приложения - не зависит от конкретной платформы (Tauri, Browser, Node.js).
 * Содержит:
 * - Ports: интерфейсы для взаимодействия с внешними системами
 * - Types: типы данных (команды, события, состояние)
 * - Container: DI контейнер для управления зависимостями
 */

// Container (DI)
export {
  container,
  getBackend,
  getLanguage,
  getNodeBackend,
  getPlatform,
  getStorage,
  resetContainer,
} from "./container"
// Ports (Interfaces)
export type {
  IBackendService,
  ILanguageService,
  INodeBackendService,
  IPlatformService,
  IStorageService,
  NodeBackendHealth,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
  Unsubscribe,
} from "./ports"
export type { LanguageResponse } from "./services"
export { getAppLanguage, setAppLanguage } from "./services"

// Types (re-exported from generated bindings for now)
export type {
  BrowserState,
  BrowserTab,
  Clip,
  CommandResult,
  EventEnvelope,
  MediaFile,
  MediaItem,
  Project,
  ProjectCommand,
  ProjectEvent,
  ProjectSettings,
  ProjectState,
  TabSettings,
  Timeline,
  Track,
  ViewMode,
} from "./types"
