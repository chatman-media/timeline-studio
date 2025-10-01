/**
 * Project Management Domain Provider
 *
 * Модульная система провайдеров для работы с управлением проектами и настройками.
 * Каждый провайдер отвечает за свою область ответственности.
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext } from "react"
import type { ProjectSettings, ProjectState } from "@/types/generated/tauri-bindings"
import type { UserSettingsContextType } from "../machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "../services/project-management-orchestrator"

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
}

const ProjectContext = createContext<ProjectContext | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const appActor = orchestrator.getAppActor()

  const projectState = useSelector(appActor, (state) => state.context.projectState)
  const isLoading = useSelector(appActor, (state) => state.matches("connected.executing"))
  const hasUnsavedChanges = useSelector(appActor, (state) => {
    // Check if project has unsaved changes based on state
    return state.context.projectState?.hasUnsavedChanges || false
  })

  const contextValue: ProjectContext = {
    projectState,
    isLoading,
    hasUnsavedChanges,
    createProject: orchestrator.createProject.bind(orchestrator),
    saveProject: orchestrator.saveProject.bind(orchestrator),
    saveProjectAs: orchestrator.saveProjectAs.bind(orchestrator),
    openProject: orchestrator.openProject.bind(orchestrator),
    closeProject: orchestrator.closeProject.bind(orchestrator),
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
}

const UserSettingsContext = createContext<UserSettingsContext | null>(null)

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const userSettingsActor = orchestrator.getUserSettingsActor()

  const settings = useSelector(userSettingsActor, (state) => state.context)
  const isLoading = useSelector(userSettingsActor, (state) => !state.context.isLoaded)

  const updateSettings = (newSettings: Partial<UserSettingsContextType>) => {
    orchestrator.updateUserSettings(newSettings)
  }

  const updateLayoutMode = (mode: UserSettingsContextType["layoutMode"]) => {
    updateSettings({ layoutMode: mode })
  }

  const updateActiveTab = (tab: UserSettingsContextType["activeTab"]) => {
    updateSettings({ activeTab: tab })
  }

  const updateApiKey = (service: "openai" | "claude", key: string) => {
    const keyMap = {
      openai: "openAiApiKey",
      claude: "claudeApiKey",
    } as const
    updateSettings({ [keyMap[service]]: key })
  }

  const updateGpuAcceleration = (enabled: boolean) => {
    updateSettings({ gpuAccelerationEnabled: enabled })
  }

  const updateAutoSave = (enabled: boolean, interval?: number) => {
    const settings: Partial<UserSettingsContextType> = { autoSaveEnabled: enabled }
    if (interval !== undefined) {
      settings.autoSaveInterval = interval
    }
    updateSettings(settings)
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
}

const AppStateContext = createContext<AppStateContext | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const appActor = orchestrator.getAppActor()

  const isConnected = useSelector(appActor, (state) => state.context.isConnected)
  const connectionError = useSelector(appActor, (state) => state.context.error)
  const isLoading = useSelector(appActor, (state) => state.matches("connecting"))

  const retryConnection = () => {
    appActor.send({ type: "RETRY_CONNECTION" })
  }

  const contextValue: AppStateContext = {
    isConnected,
    connectionError,
    isLoading,
    retryConnection,
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

export function ProjectManagementProvider({ children }: ProjectManagementProviderProps) {
  return (
    <ProjectProvider>
      <UserSettingsProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </UserSettingsProvider>
    </ProjectProvider>
  )
}
