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
  // State
  BrowserState,
  BrowserTab,
  Clip,
  // Commands
  CommandResult,
  // Events
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
} from "@/types/generated/tauri-bindings"

// Re-export core-facing compatibility types for features
export * from "./bot-workflow"
export * from "./enhanced-subtitle"
export * from "./filters"
export * from "./media"
export * from "./modals"
export * from "./project-settings-context"
export * from "./render-job"
export * from "./resources"
export * from "./style-template"
export * from "./templates"
export * from "./transcription"
export * from "./transitions"
export * from "./updates"
export * from "./video-editing"
