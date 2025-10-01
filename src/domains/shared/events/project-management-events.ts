/**
 * Project Management Domain Events
 *
 * События домена управления проектами
 */

// === Project Events ===

export interface ProjectCreatedEvent {
  projectId: string
  name: string
  path: string
  createdAt: number
}

export interface ProjectOpenedEvent {
  projectId: string
  path: string
  version: string
}

export interface ProjectSavedEvent {
  projectId: string
  path: string
  autoSave: boolean
  fileSize: number
}

export interface ProjectClosedEvent {
  projectId: string
  duration: number // Время работы с проектом
}

// === Settings Events ===

export interface UserSettingsChangedEvent {
  setting: string
  oldValue: any
  newValue: any
  category: "general" | "performance" | "appearance" | "shortcuts"
}

export interface ProjectSettingsChangedEvent {
  projectId: string
  setting: string
  oldValue: any
  newValue: any
}

export interface LanguageChangedEvent {
  oldLanguage: string
  newLanguage: string
}

export interface ThemeChangedEvent {
  oldTheme: string
  newTheme: string
}

// === API Keys Events ===

export interface ApiKeyUpdatedEvent {
  provider: "openai" | "claude" | "deepseek" | "custom"
  isValid: boolean
}

export interface ApiKeyValidatedEvent {
  provider: string
  success: boolean
  error?: string
}

// === Backend Connection Events ===

export interface BackendConnectedEvent {
  version: string
  features: string[]
}

export interface BackendDisconnectedEvent {
  reason: "manual" | "error" | "timeout"
  error?: string
}

export interface BackendCommandExecutedEvent {
  command: string
  success: boolean
  duration: number
  error?: string
}

// === Event Type Constants ===

export const PROJECT_MANAGEMENT_EVENTS = {
  // Project
  PROJECT_CREATED: "project.created",
  PROJECT_OPENED: "project.opened",
  PROJECT_SAVED: "project.saved",
  PROJECT_CLOSED: "project.closed",

  // Settings
  USER_SETTINGS_CHANGED: "project.settings.user-changed",
  PROJECT_SETTINGS_CHANGED: "project.settings.project-changed",
  LANGUAGE_CHANGED: "project.settings.language-changed",
  THEME_CHANGED: "project.settings.theme-changed",

  // API Keys
  API_KEY_UPDATED: "project.api-key.updated",
  API_KEY_VALIDATED: "project.api-key.validated",

  // Backend
  BACKEND_CONNECTED: "project.backend.connected",
  BACKEND_DISCONNECTED: "project.backend.disconnected",
  BACKEND_COMMAND_EXECUTED: "project.backend.command-executed",
} as const
