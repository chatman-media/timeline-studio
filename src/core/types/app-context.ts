import { createContext } from "react"

import type { ProjectCommand, ProjectState } from "@/types/generated/tauri-bindings"

export interface AppContext {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  projectState: ProjectState | null
  connect: () => void
  disconnect: () => void
  retryConnection: () => void
  executeCommand: (command: ProjectCommand) => Promise<any>
}

export const AppContextInternal = createContext<AppContext | null>(null)
