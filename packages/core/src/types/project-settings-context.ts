import { createContext } from "react"

import type { ProjectSettings } from "./project"

export interface ProjectSettingsContextType {
  settings: ProjectSettings
  isLoading: boolean
  error: string | null
  updateSettings: (settings: Partial<ProjectSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

export type ProjectSettingsProviderType = ProjectSettingsContextType

export const ProjectSettingsContext = createContext<ProjectSettingsContextType | undefined>(undefined)
