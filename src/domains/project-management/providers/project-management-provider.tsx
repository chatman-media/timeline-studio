/**
 * Project Management Domain Provider - упрощенная версия
 *
 * Использует ТОЛЬКО состояние из XState акторов оркестратора.
 * Минимальное локальное состояние для dirty flags.
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext, useState } from "react"
import { container } from "@/core/container"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectSettings, ProjectState } from "@/types/generated/tauri-bindings"
import type { UserSettingsContextType } from "../machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "../services/project-management-orchestrator"

const logger = createLogger("ProjectManagementProvider")

// ===========================
// Project Provider
// ===========================
interface ProjectContext {
  projectState: ProjectState | null
  isLoading: boolean
  hasUnsavedChanges: boolean
  createProject: (settings: ProjectSettings) => Promise<void>
  saveProject: () => Promise<void>
  saveProjectAs: (path: string) => Promise<void>
  openProject: (path: string) => Promise<void>
  closeProject: () => Promise<void>
  // Новые методы для BackendSync
  syncProjectState: () => Promise<void>
  isBackendConnected: boolean
  // Dirty flag tracking
  isDirty: boolean
  lastModifiedTime: number | null
  lastSavedTime: number | null
  markDirty: () => void
}

const ProjectContext = createContext<ProjectContext | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const appActor = orchestrator.getAppActor()
  const backend = container.getBackend()

  // Используем ТОЛЬКО состояние из актора оркестратора
  const projectState = useSelector(appActor, (state) => state.context.projectState)
  const isLoading = useSelector(appActor, (state) => state.matches({ connected: "executing" }))
  const isBackendConnected = backend.connected

  // Локальное состояние только для dirty flags (не связанных с backend)
  const [dirtyState, setDirtyState] = useState({
    isDirty: false,
    lastModifiedTime: null as number | null,
    lastSavedTime: null as number | null,
  })

  // Синхронизация состояния проекта с backend
  const syncProjectState = async () => {
    if (!isBackendConnected) return

    try {
      await backend.getProjectState()
      logger.info("[ProjectProvider] Project state synced with backend")
    } catch (error) {
      logger.error("[ProjectProvider] Failed to sync project state:", { error })
    }
  }

  // Команды выполняются через оркестратор
  const createProject = async (settings: ProjectSettings) => {
    try {
      await orchestrator.createProject(settings)
      // Состояние обновляется автоматически через XState машину
    } catch (error) {
      logger.error("[ProjectProvider] Failed to create project:", { error })
      throw error
    }
  }

  const saveProject = async () => {
    try {
      await orchestrator.saveProject()
      // Очищаем dirty flags после успешного сохранения
      setDirtyState({
        isDirty: false,
        lastModifiedTime: dirtyState.lastModifiedTime,
        lastSavedTime: Date.now(),
      })
    } catch (error) {
      logger.error("[ProjectProvider] Failed to save project:", { error })
      throw error
    }
  }

  const openProject = async (path: string) => {
    try {
      await orchestrator.openProject(path)
      // Очищаем dirty flags при открытии проекта
      setDirtyState({
        isDirty: false,
        lastModifiedTime: Date.now(),
        lastSavedTime: Date.now(),
      })
    } catch (error) {
      logger.error("[ProjectProvider] Failed to open project:", { error })
      throw error
    }
  }

  const closeProject = async () => {
    try {
      await orchestrator.closeProject()
      // Очищаем dirty flags при закрытии
      setDirtyState({
        isDirty: false,
        lastModifiedTime: null,
        lastSavedTime: null,
      })
    } catch (error) {
      logger.error("[ProjectProvider] Failed to close project:", { error })
      throw error
    }
  }

  const saveProjectAs = async (path: string) => {
    try {
      await orchestrator.saveProjectAs(path)
      // Очищаем dirty flags после успешного сохранения
      setDirtyState({
        isDirty: false,
        lastModifiedTime: dirtyState.lastModifiedTime,
        lastSavedTime: Date.now(),
      })
    } catch (error) {
      logger.error("[ProjectProvider] Failed to save project as:", { error })
      throw error
    }
  }

  // Метод для пометки проекта как измененного
  const markDirty = () => {
    setDirtyState({
      isDirty: true,
      lastModifiedTime: Date.now(),
      lastSavedTime: dirtyState.lastSavedTime,
    })
  }

  const contextValue: ProjectContext = {
    projectState,
    isLoading,
    hasUnsavedChanges: dirtyState.isDirty,
    createProject,
    saveProject,
    saveProjectAs,
    openProject,
    closeProject,
    syncProjectState,
    isBackendConnected,
    // Dirty flag tracking
    isDirty: dirtyState.isDirty,
    lastModifiedTime: dirtyState.lastModifiedTime,
    lastSavedTime: dirtyState.lastSavedTime,
    markDirty,
  }

  return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider")
  }
  return context
}

// ===========================
// User Settings Provider
// ===========================
interface UserSettingsContext {
  settings: UserSettingsContextType
  isLoading: boolean
  updateSettings: (settings: Partial<UserSettingsContextType>) => void
  updateLayoutMode: (mode: UserSettingsContextType["layoutMode"]) => void
  updateActiveTab: (tab: UserSettingsContextType["activeTab"]) => void
  updateApiKey: (service: "openai" | "claude", key: string) => void
  updateGpuAcceleration: (enabled: boolean) => void
  updateAutoSave: (enabled: boolean, interval?: number) => void
  // Новые методы для BackendSync
  syncSettings: () => Promise<void>
  isBackendConnected: boolean
}

const UserSettingsContext = createContext<UserSettingsContext | null>(null)

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const userSettingsActor = orchestrator.getUserSettingsActor()
  const backend = container.getBackend()

  // Используем ТОЛЬКО состояние из актора оркестратора
  const settings = useSelector(userSettingsActor, (state) => state.context)
  const isLoading = useSelector(userSettingsActor, (state) => !state.context.isLoaded)
  const isBackendConnected = backend.connected

  // Все обновления идут через оркестратор
  const updateSettings = (newSettings: Partial<UserSettingsContextType>) => {
    orchestrator.updateUserSettings(newSettings)
  }

  const updateLayoutMode = (mode: UserSettingsContextType["layoutMode"]) => {
    updateSettings({ layoutMode: mode })
  }

  const updateActiveTab = (tab: UserSettingsContextType["activeTab"]) => {
    updateSettings({ activeTab: tab })
  }

  const updateApiKey = async (service: "openai" | "claude", key: string) => {
    const keyMap = {
      openai: "openAiApiKey",
      claude: "claudeApiKey",
    } as const

    updateSettings({ [keyMap[service]]: key })
  }

  const updateGpuAcceleration = async (enabled: boolean) => {
    updateSettings({ gpuAccelerationEnabled: enabled })
  }

  const updateAutoSave = (enabled: boolean, interval?: number) => {
    const settings: Partial<UserSettingsContextType> = { autoSaveEnabled: enabled }
    if (interval !== undefined) {
      settings.autoSaveInterval = interval
    }
    updateSettings(settings)
  }

  const syncSettings = async () => {
    // User settings хранятся локально в IndexedDB через app-settings-provider
    // Синхронизация происходит автоматически через оркестратор
    logger.info("[UserSettingsProvider] Settings synced locally")
  }

  const contextValue: UserSettingsContext = {
    settings,
    isLoading,
    updateSettings,
    updateLayoutMode,
    updateActiveTab,
    updateApiKey,
    updateGpuAcceleration,
    updateAutoSave,
    syncSettings,
    isBackendConnected,
  }

  return <UserSettingsContext.Provider value={contextValue}>{children}</UserSettingsContext.Provider>
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider")
  }
  return context
}

// ===========================
// App State Provider
// ===========================
interface AppStateContext {
  isConnected: boolean
  connectionError: string | null
  isLoading: boolean
  retryConnection: () => void
  // Новые методы для BackendSync
  backendStatus: {
    connected: boolean
    lastSync: Date | null
    syncErrors: number
  }
}

const AppStateContext = createContext<AppStateContext | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const appActor = orchestrator.getAppActor()
  const backend = container.getBackend()

  // Используем ТОЛЬКО состояние из актора оркестратора
  const isConnected = useSelector(appActor, (state) => state.context.isConnected)
  const connectionError = useSelector(appActor, (state) => state.context.error)
  const isLoading = useSelector(appActor, (state) => state.matches("connecting"))

  // Статус backend - простая проверка без локального состояния
  const backendStatus = {
    connected: backend.connected,
    lastSync: new Date(),
    syncErrors: 0,
  }

  const retryConnection = () => {
    appActor.send({ type: "RETRY_CONNECTION" })

    // Также пытаемся переподключить backend
    if (!backend.connected) {
      backend.connect().catch((error) => logger.error("Failed to connect backend sync", { error }))
    }
  }

  const contextValue: AppStateContext = {
    isConnected,
    connectionError,
    isLoading,
    retryConnection,
    backendStatus,
  }

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider")
  }
  return context
}

// ===========================
// Main Project Management Provider
// ===========================
interface ProjectManagementProviderProps {
  children: ReactNode
}

/**
 * ProjectManagementProvider - упрощенная версия
 *
 * Все sub-провайдеры используют ТОЛЬКО состояние из XState акторов оркестратора.
 * Минимальное локальное состояние только для UI-специфичных данных (dirty flags).
 */
export function ProjectManagementProvider({ children }: ProjectManagementProviderProps) {
  return (
    <ProjectProvider>
      <UserSettingsProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </UserSettingsProvider>
    </ProjectProvider>
  )
}
