/**
 * App Provider
 *
 * Главный провайдер с архитектурой backend state management
 */

import { useMachine } from "@xstate/react"
import React, { type ReactNode, useEffect } from "react"
// Используем машину из домена
import { appMachine } from "@/domains/project-management/machines/app-machine"

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
  executeCommand: (command: any) => void
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

  const executeCommand = (command: any) => {
    send({ type: "EXECUTE_COMMAND", command })
  }

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
