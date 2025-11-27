/**
 * Core Types
 *
 * Типы для команд, событий и состояния.
 * Пока реэкспортируем из tauri-bindings для совместимости.
 * В будущем можно определить собственные типы для независимости от бэкенда.
 */

// Re-export types from generated bindings
// These are the contract between frontend and any backend
export type {
  // Commands
  CommandResult,
  ProjectCommand,

  // Events
  EventEnvelope,
  ProjectEvent,

  // State
  BrowserState,
  BrowserTab,
  Clip,
  MediaItem,
  Project,
  ProjectSettings,
  ProjectState,
  TabSettings,
  Timeline,
  Track,
  ViewMode,
} from "@/types/generated/tauri-bindings"
