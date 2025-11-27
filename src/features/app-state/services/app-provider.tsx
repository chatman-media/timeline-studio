/**
 * App Provider
 *
 * Главный провайдер с архитектурой backend state management
 */

import { useMachine } from "@xstate/react"
import React, { type ReactNode, useEffect, useCallback } from "react"
// Используем машину из домена
import { appMachine } from "@/domains/project-management/machines/app-machine"
import { getBackendSync } from "./backend-sync"
import type { ProjectCommand } from "@/types/generated/tauri-bindings"

export interface AppContext {
  // Backend connection state
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null

  // Project state (from backend)
  projectState: any // ProjectState from backend

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
  const [state, send] = useMachine(appMachine)

  // Auto-connect when component mounts
  useEffect(() => {
    if (state?.matches("disconnected")) {
      send({ type: "CONNECT" })
    }
  }, [state, send])

  // Actions
  const connect = () => {
    send({ type: "CONNECT" })
  }

  const disconnect = () => {
    send({ type: "DISCONNECT" })
  }

  const retryConnection = () => {
    send({ type: "RETRY_CONNECTION" })
  }

  // Выполнение команды напрямую через backendSync для получения результата
  const executeCommand = useCallback(async (command: ProjectCommand) => {
    const backendSync = getBackendSync()
    const result = await backendSync.executeCommand(command)

    // Также уведомляем машину для синхронизации состояния
    send({ type: "EXECUTE_COMMAND", command })

    return result
  }, [send])

  // Context value with safe fallbacks
  const contextValue: AppContext = {
    isConnected: state?.context?.isConnected ?? false,
    isConnecting: state?.matches("connecting") ?? false,
    connectionError: state?.context?.error ?? null,
    projectState: state?.context?.projectState ?? null,
    connect,
    disconnect,
    retryConnection,
    executeCommand,
  }

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
