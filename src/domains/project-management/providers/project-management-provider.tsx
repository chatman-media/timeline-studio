/**
 * Project Management Domain Provider с интеграцией BackendSync
 *
 * Модульная система провайдеров для работы с управлением проектами и настройками.
 * Добавлена прямая интеграция с BackendSync для улучшенной синхронизации.
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext, useEffect } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
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
  // Новые методы для BackendSync
  syncProjectState: () => Promise<void>
  isBackendConnected: boolean
}

const ProjectContext = createContext<ProjectContext | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const appActor = orchestrator.getAppActor()
  const backendSync = getBackendSync()
  const isBackendConnected = backendSync.connected

  const projectState = useSelector(appActor, (state) => state.context.projectState)
  const isLoading = useSelector(appActor, (state) => state.matches("connected.executing"))
  const hasUnsavedChanges = useSelector(appActor, (state) => {
    // Check if project has unsaved changes based on state
    return state.context.projectState?.hasUnsavedChanges || false
  })

  // Синхронизация состояния проекта с backend
  const syncProjectState = async () => {
    if (!isBackendConnected || !projectState) return

    try {
      await backendSync.executeCommand({
        type: "Project",
        params: {
          type: "SyncProjectState",
          params: {
            projectId: projectState.id,
            state: projectState,
          },
        },
      })
      console.log("[ProjectProvider] Project state synced with backend")
    } catch (error) {
      console.error("[ProjectProvider] Failed to sync project state:", error)
    }
  }

  // Автоматическая синхронизация при изменениях
  useEffect(() => {
    if (projectState && isBackendConnected && hasUnsavedChanges) {
      // Debounce синхронизацию
      const timer = setTimeout(() => {
        syncProjectState().catch(console.error)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [projectState, isBackendConnected, hasUnsavedChanges])

  // Расширенные методы с BackendSync
  const createProject = async (settings: ProjectSettings) => {
    const result = await orchestrator.createProject(settings)
    
    // Дополнительно сообщаем backend о создании проекта
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "Project",
        params: {
          type: "NotifyProjectCreated",
          params: { settings },
        },
      })
    }
    
    return result
  }

  const saveProject = async () => {
    const result = await orchestrator.saveProject()
    
    // Синхронизируем с backend после сохранения
    if (isBackendConnected) {
      await syncProjectState()
    }
    
    return result
  }

  const openProject = async (path: string) => {
    const result = await orchestrator.openProject(path)
    
    // Уведомляем backend об открытии проекта
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "Project",
        params: {
          type: "NotifyProjectOpened",
          params: { path },
        },
      })
    }
    
    return result
  }

  const contextValue: ProjectContext = {
    projectState,
    isLoading,
    hasUnsavedChanges,
    createProject,
    saveProject,
    saveProjectAs: orchestrator.saveProjectAs.bind(orchestrator),
    openProject,
    closeProject: orchestrator.closeProject.bind(orchestrator),
    syncProjectState,
    isBackendConnected,
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
  const backendSync = getBackendSync()
  const isBackendConnected = backendSync.connected

  const settings = useSelector(userSettingsActor, (state) => state.context)
  const isLoading = useSelector(userSettingsActor, (state) => !state.context.isLoaded)

  // Синхронизация настроек с backend
  const syncSettings = async () => {
    if (!isBackendConnected) return

    try {
      await backendSync.executeCommand({
        type: "Settings",
        params: {
          type: "SyncUserSettings",
          params: settings,
        },
      })
      console.log("[UserSettingsProvider] Settings synced with backend")
    } catch (error) {
      console.error("[UserSettingsProvider] Failed to sync settings:", error)
    }
  }

  const updateSettings = (newSettings: Partial<UserSettingsContextType>) => {
    orchestrator.updateUserSettings(newSettings)
    
    // Синхронизируем с backend
    if (isBackendConnected) {
      // Debounce синхронизацию
      setTimeout(() => {
        syncSettings().catch(console.error)
      }, 500)
    }
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
    
    // Для API ключей важна немедленная синхронизация
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "Settings",
        params: {
          type: "UpdateApiKey",
          params: { service, key },
        },
      })
    }
  }

  const updateGpuAcceleration = async (enabled: boolean) => {
    updateSettings({ gpuAccelerationEnabled: enabled })
    
    // GPU настройки критичны для производительности
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "Settings",
        params: {
          type: "UpdateGpuAcceleration",
          params: { enabled },
        },
      })
    }
  }

  const updateAutoSave = (enabled: boolean, interval?: number) => {
    const settings: Partial<UserSettingsContextType> = { autoSaveEnabled: enabled }
    if (interval !== undefined) {
      settings.autoSaveInterval = interval
    }
    updateSettings(settings)
  }

  // Синхронизация при инициализации
  useEffect(() => {
    if (settings.isLoaded && isBackendConnected) {
      syncSettings().catch(console.error)
    }
  }, [settings.isLoaded, isBackendConnected])

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
  const backendSync = getBackendSync()

  const isConnected = useSelector(appActor, (state) => state.context.isConnected)
  const connectionError = useSelector(appActor, (state) => state.context.error)
  const isLoading = useSelector(appActor, (state) => state.matches("connecting"))

  // Отслеживание статуса backend
  const backendStatus = {
    connected: backendSync.isConnected(),
    lastSync: new Date(),
    syncErrors: 0,
  }

  const retryConnection = () => {
    appActor.send({ type: "RETRY_CONNECTION" })
    
    // Также пытаемся переподключить backend
    if (!backendSync.isConnected()) {
      backendSync.connect().catch(console.error)
    }
  }

  // Мониторинг соединения с backend
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const currentlyConnected = backendSync.isConnected()
      
      if (currentlyConnected !== backendStatus.connected) {
        console.log(`[AppStateProvider] Backend connection status changed: ${currentlyConnected}`)
        
        // Если восстановилось соединение, синхронизируем состояние
        if (currentlyConnected) {
          backendSync.executeCommand({
            type: "System",
            params: {
              type: "ReconnectNotify",
              params: { timestamp: new Date().toISOString() },
            },
          }).catch(console.error)
        }
      }
    }, 5000) // Проверка каждые 5 секунд

    return () => clearInterval(checkInterval)
  }, [backendSync])

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
 * ProjectManagementProvider с улучшенной BackendSync интеграцией
 * 
 * Добавляет:
 * - Автоматическую синхронизацию состояния проекта
 * - Синхронизацию пользовательских настроек
 * - Мониторинг состояния backend соединения
 * - Восстановление после потери соединения
 */
export function ProjectManagementProvider({ children }: ProjectManagementProviderProps) {
  const backendSync = getBackendSync()

  // Инициализация BackendSync при монтировании
  useEffect(() => {
    console.log("[ProjectManagementProvider] Initializing BackendSync integration")
    
    // Подписываемся на события backend
    const unsubscribe = backendSync.onEvent((event) => {
      switch (event.type) {
        case "PROJECT_STATE_UPDATED":
          // Backend сообщает об обновлении состояния проекта
          console.log("[ProjectManagementProvider] Project state updated from backend")
          break
          
        case "SETTINGS_UPDATED":
          // Backend сообщает об обновлении настроек
          console.log("[ProjectManagementProvider] Settings updated from backend")
          break
      }
    })

    return unsubscribe
  }, [backendSync])

  return (
    <ProjectProvider>
      <UserSettingsProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </UserSettingsProvider>
    </ProjectProvider>
  )
}