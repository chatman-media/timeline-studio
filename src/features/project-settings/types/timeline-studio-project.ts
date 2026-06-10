import type { ProjectSettings, TimelineStudioProject, TimelineStudioProjectMetadata } from "@/core/types/project"

export type ProjectMetadata = TimelineStudioProjectMetadata
export type { TimelineStudioProject }

export interface ExportPreset {
  id: string
  name: string
  format: string
  settings: Record<string, unknown>
}

export interface ProjectCache {
  [key: string]: unknown
}

export interface CollaborationSettings {
  enabled: boolean
  mode: "local" | "cloud"
  [key: string]: unknown
}

export interface ProjectBackup {
  [key: string]: unknown
}

export interface ProjectOperations {
  createProject(name: string, settings?: Partial<ProjectSettings>): TimelineStudioProject | Promise<TimelineStudioProject>
  openProject(path: string): Promise<TimelineStudioProject>
  saveProject(project: TimelineStudioProject, path: string): Promise<void>
}

export interface ProjectEvents {
  onProjectOpened: (project: TimelineStudioProject) => void
  onProjectSaved: (project: TimelineStudioProject) => void
  onProjectClosed: () => void
}

export interface ProjectState {
  project: TimelineStudioProject | null
  projectPath: string | null
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  progress: {
    operation: string
    current: number
    total: number
  } | null
}
