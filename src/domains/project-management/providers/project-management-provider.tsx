/**
 * Project Management Domain Provider с event-driven архитектурой
 *
 * Использует BackendSync для получения событий от backend.
 * Следует паттерну Command → Event → State Update.
 * События обрабатываются через backend-event-handlers.ts
 */

import { useSelector } from "@xstate/react"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent, ProjectSettings, ProjectState } from "@/types/generated/tauri-bindings"
import { handleProjectBackendEvent, type ProjectManagementContext } from "../machines/backend-event-handlers"
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
}

const ProjectContext = createContext<ProjectContext | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const orchestrator = getProjectManagementOrchestrator()
  const appActor = orchestrator.getAppActor()
  const backendSync = getBackendSync()
  const isBackendConnected = backendSync.connected

  // ✅ НОВАЯ АРХИТЕКТУРА: Локальное состояние для event-driven обновлений
  const [localContext, setLocalContext] = useState<ProjectManagementContext>({
    projectState: null,
    isLoading: false,
    hasUnsavedChanges: false,
    error: null,
  })

  // Получаем состояние из appActor (для совместимости)
  const projectState = useSelector(appActor, (state) => state.context.projectState)
  const isLoading = useSelector(appActor, (state) => state.matches({ connected: "executing" }))

  // Используем локальное состояние если оно обновлено событиями, иначе из актора
  const effectiveProjectState = localContext.projectState ?? projectState
  const effectiveIsLoading = localContext.isLoading || isLoading
  const effectiveHasUnsavedChanges = localContext.hasUnsavedChanges

  // ✅ НОВАЯ АРХИТЕКТУРА: Подписываемся на backend СОБЫТИЯ
  useEffect(() => {
    const handleBackendEvent = (event: ProjectEvent) => {
      logger.info("[ProjectProvider] Received backend event:", { eventType: event.type })

      // Проверяем, является ли это событие проекта
      if (
        event.type === "ProjectCreated" ||
        event.type === "ProjectOpened" ||
        event.type === "ProjectSaved" ||
        event.type === "ProjectClosed"
      ) {
        // Используем event handler для обновления состояния
        const updates = handleProjectBackendEvent(localContext, event)

        // Применяем обновления к локальному контексту
        setLocalContext((prev) => ({
          ...prev,
          ...updates,
        }))

        // Если проект открыт или создан, получаем полное состояние
        if (event.type === "ProjectOpened" || event.type === "ProjectCreated") {
          backendSync
            .getProjectState()
            .then((state) => {
              logger.info("[ProjectProvider] Project state loaded after event")
              setLocalContext((prev) => ({
                ...prev,
                projectState: state,
                isLoading: false,
              }))
            })
            .catch((error) => {
              logger.error("[ProjectProvider] Failed to load project state:", { error })
              setLocalContext((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : "Failed to load project state",
                isLoading: false,
              }))
            })
        }
      }
    }

    // Подписываемся на backend события
    const unsubscribeEvents = backendSync.onEvent(handleBackendEvent)

    // ✅ Получаем начальное состояние при монтировании
    backendSync
      .getProjectState()
      .then((state) => {
        if (state) {
          logger.info("[ProjectProvider] Initial project state loaded")
          setLocalContext((prev) => ({
            ...prev,
            projectState: state,
          }))
        }
      })
      .catch((error) => {
        logger.error("[ProjectProvider] Failed to load initial project state:", { error })
      })

    return () => {
      unsubscribeEvents()
    }
  }, [backendSync])

  // Синхронизация состояния проекта с backend
  const syncProjectState = async () => {
    if (!isBackendConnected) return

    try {
      setLocalContext((prev) => ({ ...prev, isLoading: true }))

      const state = await backendSync.getProjectState()
      logger.info("[ProjectProvider] Project state synced with backend")

      setLocalContext((prev) => ({
        ...prev,
        projectState: state,
        isLoading: false,
      }))
    } catch (error) {
      logger.error("[ProjectProvider] Failed to sync project state:", { error })
      setLocalContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to sync project state",
        isLoading: false,
      }))
    }
  }

  // ✅ НОВАЯ АРХИТЕКТУРА: Методы выполняют команды, события обновляют состояние
  const createProject = async (settings: ProjectSettings) => {
    setLocalContext((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Выполняем команду через orchestrator
      await orchestrator.createProject(settings)

      // ❌ НЕ обновляем состояние вручную!
      // Backend пришлет событие ProjectCreated, которое обновит состояние автоматически
    } catch (error) {
      logger.error("[ProjectProvider] Failed to create project:", { error })
      setLocalContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to create project",
        isLoading: false,
      }))
      throw error
    }
  }

  const saveProject = async () => {
    setLocalContext((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Выполняем команду через orchestrator
      await orchestrator.saveProject()

      // ❌ НЕ обновляем состояние вручную!
      // Backend пришлет событие ProjectSaved, которое обновит hasUnsavedChanges автоматически
    } catch (error) {
      logger.error("[ProjectProvider] Failed to save project:", { error })
      setLocalContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to save project",
        isLoading: false,
      }))
      throw error
    }
  }

  const openProject = async (path: string) => {
    setLocalContext((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Выполняем команду через orchestrator
      await orchestrator.openProject(path)

      // ❌ НЕ обновляем состояние вручную!
      // Backend пришлет событие ProjectOpened, которое обновит состояние автоматически
    } catch (error) {
      logger.error("[ProjectProvider] Failed to open project:", { error })
      setLocalContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to open project",
        isLoading: false,
      }))
      throw error
    }
  }

  const closeProject = async () => {
    setLocalContext((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Выполняем команду через orchestrator
      await orchestrator.closeProject()

      // ❌ НЕ обновляем состояние вручную!
      // Backend пришлет событие ProjectClosed, которое очистит состояние автоматически
    } catch (error) {
      logger.error("[ProjectProvider] Failed to close project:", { error })
      setLocalContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to close project",
        isLoading: false,
      }))
      throw error
    }
  }

  const saveProjectAs = async (path: string) => {
    setLocalContext((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Выполняем команду через orchestrator
      await orchestrator.saveProjectAs(path)

      // ❌ НЕ обновляем состояние вручную!
      // Backend пришлет событие ProjectSaved, которое обновит состояние автоматически
    } catch (error) {
      logger.error("[ProjectProvider] Failed to save project as:", { error })
      setLocalContext((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to save project as",
        isLoading: false,
      }))
      throw error
    }
  }

  const contextValue: ProjectContext = {
    projectState: effectiveProjectState,
    isLoading: effectiveIsLoading,
    hasUnsavedChanges: effectiveHasUnsavedChanges,
    createProject,
    saveProject,
    saveProjectAs,
    openProject,
    closeProject,
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
      // User settings хранятся локально в IndexedDB через app-settings-provider
      // Backend sync не управляет пользовательскими настройками напрямую
      logger.info("[UserSettingsProvider] Settings synced locally")
    } catch (error) {
      logger.error("[UserSettingsProvider] Failed to sync settings:", { error: error })
    }
  }

  const updateSettings = (newSettings: Partial<UserSettingsContextType>) => {
    orchestrator.updateUserSettings(newSettings)

    // Синхронизируем с backend
    if (isBackendConnected) {
      // Debounce синхронизацию
      setTimeout(() => {
        syncSettings().catch((error) => logger.error("Failed to sync settings", { error }))
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

    // API ключи хранятся локально, дополнительная синхронизация не требуется
  }

  const updateGpuAcceleration = async (enabled: boolean) => {
    updateSettings({ gpuAccelerationEnabled: enabled })

    // GPU настройки хранятся локально, дополнительная синхронизация не требуется
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
      syncSettings().catch((error) => logger.error("Failed to sync settings on init", { error }))
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
    connected: backendSync.connected,
    lastSync: new Date(),
    syncErrors: 0,
  }

  const retryConnection = () => {
    appActor.send({ type: "RETRY_CONNECTION" })

    // Также пытаемся переподключить backend
    if (!backendSync.connected) {
      backendSync.connect().catch((error) => logger.error("Failed to connect backend sync", { error }))
    }
  }

  // Мониторинг соединения с backend
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const currentlyConnected = backendSync.connected

      if (currentlyConnected !== backendStatus.connected) {
        logger.info("[AppStateProvider] Backend connection status changed:", { currentlyConnected })

        // Если восстановилось соединение, синхронизируем состояние
        if (currentlyConnected) {
          backendSync.getProjectState().catch((error) => logger.error("Failed to sync state on reconnect", { error }))
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
 * ProjectManagementProvider с event-driven архитектурой
 *
 * Все sub-провайдеры используют BackendSync для получения событий.
 * События обрабатываются через backend-event-handlers.ts
 * Следует паттерну Command → Event → State Update
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
