/**
 * App Provider
 *
 * Главный провайдер с архитектурой backend state management
 * Использует ProjectManagementOrchestrator для единого управления состоянием
 */

import { useSelector } from "@xstate/react"
import React, { type ReactNode, useCallback, useMemo } from "react"
import { getProjectManagementOrchestrator } from "@/domains/project-management/services/project-management-orchestrator"
import type { ProjectCommand, ProjectState } from "@/types/generated/tauri-bindings"

export interface AppContext {
  // Backend connection state
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null

  // Project state (from backend)
  projectState: ProjectState | null

  // Actions
  connect: () => void
  disconnect: () => void
  retryConnection: () => void
  executeCommand: (command: ProjectCommand) => Promise<any>
}

const AppContextInternal = React.createContext<AppContext | null>(null)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  // Используем orchestrator вместо создания собственного actor
  const orchestrator = useMemo(() => getProjectManagementOrchestrator(), [])
  const appActor = orchestrator.getAppActor()

  // Получаем состояние из actor через useSelector
  const isConnected = useSelector(appActor, (state) => state.context.isConnected)
  const isConnecting = useSelector(appActor, (state) => state.matches("connecting"))
  const connectionError = useSelector(appActor, (state) => state.context.error)
  const projectState = useSelector(appActor, (state) => state.context.projectState)

  // 🔧 FIX: Активно загружаем начальное состояние при монтировании
  // ПРОБЛЕМА: app-machine создается и подключается к backend ДО того как
  // AppProvider монтируется. В результате начальное состояние может не попасть в React.
  // РЕШЕНИЕ: Активно загружаем projectState из backend после монтирования
  React.useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Ждем подключения и только потом загружаем
        if (!isConnected || isConnecting) return

        // Если состояние уже загружено - ничего не делаем
        if (projectState) return

        const { createLogger } = await import("@/lib/tauri-logger")
        const logger = createLogger("AppProvider")

        logger.infoSync("[AppProvider] 🔧 Loading initial project state from backend...")

        // Загружаем состояние напрямую из backend (bypass actor)
        const state = await orchestrator.loadProjectStateFromBackend()

        if (state) {
          logger.infoSync("[AppProvider] ✅ Initial project state loaded", {
            hasMediaPool: !!state.project?.media_pool,
            mediaItemsCount: state.project?.media_pool?.items ? Object.keys(state.project.media_pool.items).length : 0
          })
          // Отправляем в machine для обновления React state
          appActor.send({ type: "STATE_UPDATED", state })
        } else {
          logger.warnSync("[AppProvider] ⚠️ No initial project state available")
        }
      } catch (error) {
        const { createLogger } = await import("@/lib/tauri-logger")
        const logger = createLogger("AppProvider")
        logger.errorSync("[AppProvider] ❌ Failed to load initial project state", { error })
      }
    }

    void loadInitialState()
  }, [isConnected, isConnecting, projectState, orchestrator, appActor])

  // Actions через actor напрямую
  const connect = useCallback(() => {
    appActor.send({ type: "CONNECT" })
  }, [appActor])

  const disconnect = useCallback(() => {
    appActor.send({ type: "DISCONNECT" })
  }, [appActor])

  const retryConnection = useCallback(() => {
    appActor.send({ type: "RETRY_CONNECTION" })
  }, [appActor])

  // Выполнение команды через orchestrator для правильной синхронизации
  const executeCommand = useCallback(
    async (command: ProjectCommand) => {
      return orchestrator.executeCommand(command)
    },
    [orchestrator],
  )

  // Context value
  const contextValue: AppContext = useMemo(
    () => ({
      isConnected,
      isConnecting,
      connectionError,
      projectState,
      connect,
      disconnect,
      retryConnection,
      executeCommand,
    }),
    [isConnected, isConnecting, connectionError, projectState, connect, disconnect, retryConnection, executeCommand],
  )

  return <AppContextInternal.Provider value={contextValue}>{children}</AppContextInternal.Provider>
}

// Hook for using app context
export function useApp(): AppContext {
  const context = React.useContext(AppContextInternal)

  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }

  return context
}
