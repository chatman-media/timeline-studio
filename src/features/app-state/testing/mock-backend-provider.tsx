/**
 * Centralized Mock Backend Provider for app-state testing
 *
 * This provider simplifies testing of components that depend on the backend integration.
 * It provides consistent mocks for all Tauri commands and events used by the app-state module.
 */

import React, { createContext, type ReactNode, useContext } from "react"

import { type MockedFunction, vi } from "vitest"

import type { CommandResult, ProjectCommand, ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"

// Mock data types
export interface MockProjectState {
  project: {
    id: string
    name: string
    metadata: {
      name: string
      description: string | null
      created_at: string
      modified_at: string
      file_path: string | null
      is_dirty: boolean
      version: string
    }
  } | null
  ui_state: {
    selected_clips: string[]
    selected_tracks: string[]
    timeline_zoom: number
    timeline_scroll: number
    active_tool: string
  }
  playback_state: {
    is_playing: boolean
    current_time: number
    playback_rate: number
    loop_enabled: boolean
    loop_start: number | null
    loop_end: number | null
    volume: number
    current_media_id: string | null
    selected_clip_id: string | null
  }
  version: number
  version_info: {
    current_version: string
    current_branch: string
    has_unsaved_changes: boolean
    last_save_time: string | null
  }
}

export interface MockBackendContext {
  // Current state
  projectState: MockProjectState
  eventHistory: ProjectEvent[]

  // Mock functions
  executeCommand: MockedFunction<(command: ProjectCommand) => Promise<CommandResult>>
  getProjectState: MockedFunction<() => Promise<ProjectState>>
  getEventHistory: MockedFunction<() => Promise<ProjectEvent[]>>

  // Utilities for tests
  updateProjectState: (updates: Partial<MockProjectState>) => void
  addEvent: (event: ProjectEvent) => void
  clearHistory: () => void
  reset: () => void
}

// Default mock state
const createDefaultMockState = (): MockProjectState => ({
  project: {
    id: "test-project-123",
    name: "Test Project",
    metadata: {
      name: "Test Project",
      description: "A test project for unit testing",
      created_at: "2025-01-22T12:00:00.000Z",
      modified_at: "2025-01-22T12:00:00.000Z",
      file_path: "/test/path/project.tls",
      is_dirty: false,
      version: "1.0.0",
    },
  },
  ui_state: {
    selected_clips: [],
    selected_tracks: [],
    timeline_zoom: 1.0,
    timeline_scroll: 0,
    active_tool: "select",
  },
  playback_state: {
    is_playing: false,
    current_time: 0,
    playback_rate: 1.0,
    loop_enabled: false,
    loop_start: null,
    loop_end: null,
    volume: 0.8,
    current_media_id: null,
    selected_clip_id: null,
  },
  version: 1,
  version_info: {
    current_version: "v1.0.0",
    current_branch: "main",
    has_unsaved_changes: false,
    last_save_time: "2025-01-22T12:00:00.000Z",
  },
})

const MockBackendContext = createContext<MockBackendContext | null>(null)

interface MockBackendProviderProps {
  children: ReactNode
  initialState?: Partial<MockProjectState>
  onCommand?: (command: ProjectCommand) => CommandResult | Promise<CommandResult>
}

export function MockBackendProvider({ children, initialState, onCommand }: MockBackendProviderProps) {
  const [projectState, setProjectState] = React.useState<MockProjectState>(() => ({
    ...createDefaultMockState(),
    ...initialState,
  }))

  const [eventHistory, setEventHistory] = React.useState<ProjectEvent[]>([])

  // Mock command execution
  const executeCommand = vi.fn().mockImplementation(async (command: ProjectCommand): Promise<CommandResult> => {
    // Allow custom command handler
    if (onCommand) {
      const result = await onCommand(command)
      return result
    }

    // Default command handling for common operations
    switch (command.type) {
      case "CreateProject": {
        const newProject = {
          id: `project-${Date.now()}`,
          name: command.params.name,
          metadata: {
            name: command.params.name,
            description: null,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
            file_path: null,
            is_dirty: false,
            version: "1.0.0",
          },
        }
        setProjectState((prev) => ({ ...prev, project: newProject }))
        return { success: true, error: null, data: null }
      }

      case "Play":
        setProjectState((prev) => ({
          ...prev,
          playback_state: { ...prev.playback_state, is_playing: true },
        }))
        return { success: true, error: null, data: null }

      case "Pause":
        setProjectState((prev) => ({
          ...prev,
          playback_state: { ...prev.playback_state, is_playing: false },
        }))
        return { success: true, error: null, data: null }

      case "Seek":
        setProjectState((prev) => ({
          ...prev,
          playback_state: { ...prev.playback_state, current_time: command.params.time },
        }))
        return { success: true, error: null, data: null }

      default:
        return { success: true, error: null, data: null }
    }
  })

  const getProjectState = vi.fn().mockResolvedValue(projectState as unknown as ProjectState)
  const getEventHistory = vi.fn().mockResolvedValue(eventHistory)

  // Utility functions for tests
  const updateProjectState = (updates: Partial<MockProjectState>) => {
    setProjectState((prev) => ({ ...prev, ...updates }))
  }

  const addEvent = (event: ProjectEvent) => {
    setEventHistory((prev) => [...prev, event])
  }

  const clearHistory = () => {
    setEventHistory([])
  }

  const reset = () => {
    setProjectState(createDefaultMockState())
    setEventHistory([])
    vi.clearAllMocks()
  }

  const contextValue: MockBackendContext = {
    projectState,
    eventHistory,
    executeCommand,
    getProjectState,
    getEventHistory,
    updateProjectState,
    addEvent,
    clearHistory,
    reset,
  }

  return <MockBackendContext.Provider value={contextValue}>{children}</MockBackendContext.Provider>
}

// Hook to use the mock backend in tests
export function useMockBackend(): MockBackendContext {
  const context = useContext(MockBackendContext)
  if (!context) {
    throw new Error("useMockBackend must be used within a MockBackendProvider")
  }
  return context
}

// Higher-order component for easy test setup
export function withMockBackend<P extends object>(
  Component: React.ComponentType<P>,
  mockOptions?: {
    initialState?: Partial<MockProjectState>
    onCommand?: (command: ProjectCommand) => CommandResult | Promise<CommandResult>
  },
) {
  return function MockedComponent(props: P) {
    return (
      <MockBackendProvider {...mockOptions}>
        <Component {...props} />
      </MockBackendProvider>
    )
  }
}

// Utility to create test scenarios
export const createTestScenarios = {
  // Empty project state
  emptyProject: (): Partial<MockProjectState> => ({
    project: null,
    version: 0,
  }),

  // Project with media
  projectWithMedia: (): Partial<MockProjectState> => ({
    project: {
      id: "project-with-media",
      name: "Project with Media",
      metadata: {
        name: "Project with Media",
        description: "Test project containing media files",
        created_at: "2025-01-22T12:00:00.000Z",
        modified_at: "2025-01-22T12:30:00.000Z",
        file_path: "/test/media-project.tls",
        is_dirty: true,
        version: "1.0.0",
      },
    },
  }),

  // Playing state
  playingState: (): Partial<MockProjectState> => ({
    playback_state: {
      is_playing: true,
      current_time: 15.5,
      playback_rate: 1.0,
      loop_enabled: false,
      loop_start: null,
      loop_end: null,
      volume: 0.8,
      current_media_id: "media-123",
      selected_clip_id: "clip-456",
    },
  }),

  // Dirty project state
  dirtyProject: (): Partial<MockProjectState> => ({
    project: {
      id: "dirty-project",
      name: "Dirty Project",
      metadata: {
        name: "Dirty Project",
        description: "Project with unsaved changes",
        created_at: "2025-01-22T12:00:00.000Z",
        modified_at: "2025-01-22T13:00:00.000Z",
        file_path: "/test/dirty-project.tls",
        is_dirty: true,
        version: "1.0.0",
      },
    },
    version_info: {
      current_version: "v1.2.0",
      current_branch: "feature/test",
      has_unsaved_changes: true,
      last_save_time: "2025-01-22T12:45:00.000Z",
    },
  }),
}
