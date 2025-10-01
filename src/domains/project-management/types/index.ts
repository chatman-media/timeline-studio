/**
 * Project Management Domain Types
 *
 * Центральное место для всех типов домена управления проектами
 */

// Re-export backend types
export type {
  PlayerSource,
  ProjectCommand,
  ProjectEvent,
  ProjectSettings,
  ProjectState,
} from "@/types/generated/tauri-bindings"

// Re-export app machine types
export type {
  AppMachineContext,
  AppMachineEvent,
} from "../machines/app-machine"

// Re-export user settings types
export type {
  LayoutMode,
  UserSettingsContextType,
  UserSettingsEvent,
} from "../machines/user-settings-machine"

// Project management orchestrator context
export interface ProjectManagementContext {
  // Project state
  project: import("@/types/generated/tauri-bindings").ProjectState | null
  isProjectLoaded: boolean
  projectPath: string | null

  // User settings
  userSettings: import("../machines/user-settings-machine").UserSettingsContextType

  // Connection state
  isConnected: boolean
  connectionError: string | null

  // Commands and operations
  pendingCommands: import("@/types/generated/tauri-bindings").ProjectCommand[]
  lastCommandResult: any

  // Auto-save state
  isDirty: boolean
  lastSaveTime: Date | null
  autoSaveTimer: number | null
}

// Project management events
export type ProjectManagementEvent =
  // Project operations
  | { type: "CREATE_PROJECT"; settings: import("@/types/generated/tauri-bindings").ProjectSettings }
  | { type: "OPEN_PROJECT"; path: string }
  | { type: "SAVE_PROJECT" }
  | { type: "SAVE_PROJECT_AS"; path: string }
  | { type: "CLOSE_PROJECT" }

  // Project state updates
  | { type: "PROJECT_LOADED"; project: import("@/types/generated/tauri-bindings").ProjectState }
  | { type: "PROJECT_SAVED"; path: string }
  | { type: "PROJECT_CLOSED" }
  | { type: "PROJECT_ERROR"; error: string }

  // Settings updates
  | {
      type: "UPDATE_USER_SETTINGS"
      settings: Partial<import("../machines/user-settings-machine").UserSettingsContextType>
    }
  | { type: "UPDATE_PROJECT_SETTINGS"; settings: Partial<import("@/types/generated/tauri-bindings").ProjectSettings> }
  | { type: "RESET_SETTINGS" }

  // Auto-save
  | { type: "ENABLE_AUTO_SAVE" }
  | { type: "DISABLE_AUTO_SAVE" }
  | { type: "TRIGGER_AUTO_SAVE" }
  | { type: "MARK_DIRTY" }
  | { type: "MARK_CLEAN" }

// Project service interface
export interface ProjectManagementService {
  // Project operations
  createProject(settings: import("@/types/generated/tauri-bindings").ProjectSettings): Promise<void>
  openProject(path: string): Promise<void>
  saveProject(): Promise<void>
  saveProjectAs(path: string): Promise<void>
  closeProject(): Promise<void>

  // Settings management
  updateUserSettings(settings: Partial<import("../machines/user-settings-machine").UserSettingsContextType>): void
  updateProjectSettings(settings: Partial<import("@/types/generated/tauri-bindings").ProjectSettings>): void
  resetSettings(): void

  // Auto-save
  enableAutoSave(): void
  disableAutoSave(): void

  // State queries
  getProjectState(): import("@/types/generated/tauri-bindings").ProjectState | null
  getUserSettings(): import("../machines/user-settings-machine").UserSettingsContextType
  isProjectDirty(): boolean
  isAutoSaveEnabled(): boolean
}
