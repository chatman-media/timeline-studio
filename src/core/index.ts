/**
 * Core Module
 *
 * Ядро приложения - не зависит от конкретной платформы (Tauri, Browser, Node.js).
 * Содержит:
 * - Ports: интерфейсы для взаимодействия с внешними системами
 * - Types: типы данных (команды, события, состояние)
 * - Container: DI контейнер для управления зависимостями
 */

// Ports (Interfaces)
export type { IBackendService, IPlatformService, IStorageService, Unsubscribe } from "./ports"
export type { NotificationOptions, OpenDialogOptions, SaveDialogOptions } from "./ports"

// Container (DI)
export { container, getBackend, getPlatform, getStorage, resetContainer } from "./container"

// Types (re-exported from generated bindings for now)
export type {
  BrowserState,
  BrowserTab,
  Clip,
  CommandResult,
  EventEnvelope,
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
