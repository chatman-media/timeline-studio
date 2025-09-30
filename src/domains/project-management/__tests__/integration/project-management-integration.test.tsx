/**
 * Integration tests for Project Management domain
 */

import { render } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useProjectManagementContext } from "../.."
import { useAppState, useProjectManagement, useUserSettings } from "../../hooks"
import { ProjectManagementProvider, useProject } from "../../providers/project-management-provider"
import { getProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock the orchestrator
vi.mock("../services/project-management-orchestrator", () => ({
  getProjectManagementOrchestrator: vi.fn(() => ({
    createProject: vi.fn(),
    saveProject: vi.fn(),
    saveProjectAs: vi.fn(),
    openProject: vi.fn(),
    closeProject: vi.fn(),
    updateUserSettings: vi.fn(),
    getProjectState: vi.fn(() => ({
      name: "Integration Test Project",
      path: "/test/integration.tlsp",
      timeline: { duration: 0 },
      tracks: [],
      hasUnsavedChanges: false,
    })),
    getUserSettings: vi.fn(() => ({
      layoutMode: "default",
      activeTab: "timeline",
      openAiApiKey: "integration-test-key",
      claudeApiKey: "",
      gpuAccelerationEnabled: true,
      autoSaveEnabled: true,
      autoSaveInterval: 5,
      playerVolume: 0.8,
      screenshotPath: "",
      browserVisible: true,
      timelineVisible: true,
      optionsVisible: true,
    })),
    isConnected: vi.fn(() => true),
    getConnectionError: vi.fn(() => null),
    subscribeToProjectState: vi.fn((callback) => {
      callback({
        name: "Integration Test Project",
        path: "/test/integration.tlsp",
        timeline: { duration: 0 },
        tracks: [],
        hasUnsavedChanges: false,
      })
      return { unsubscribe: vi.fn() }
    }),
    subscribeToUserSettings: vi.fn((callback) => {
      callback({
        layoutMode: "default",
        activeTab: "timeline",
        openAiApiKey: "integration-test-key",
        claudeApiKey: "",
        gpuAccelerationEnabled: true,
        autoSaveEnabled: true,
        autoSaveInterval: 5,
        playerVolume: 0.8,
        screenshotPath: "",
        browserVisible: true,
        timelineVisible: true,
        optionsVisible: true,
      })
      return { unsubscribe: vi.fn() }
    }),
    subscribeToAppState: vi.fn((callback) => {
      callback({
        isConnected: true,
        connectionError: null,
        timeline: { duration: 0 },
        currentTime: 0,
        isPlaying: false,
        tracks: [],
      })
      return { unsubscribe: vi.fn() }
    }),
    getAppActor: vi.fn(() => ({
      send: vi.fn(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    getUserSettingsActor: vi.fn(() => ({
      send: vi.fn(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
  })),
}))

describe("Project Management Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Provider Integration", () => {
    it("should provide all contexts together", () => {
      const TestComponent = () => {
        const project = useProject()
        const userSettings = useUserSettings()
        const appState = useAppState()
        const context = useProjectManagementContext()

        return (
          <div data-testid="integration">
            <span data-testid="project-name">{project.projectState?.name || "No Project"}</span>
            <span data-testid="layout-mode">{userSettings.layoutMode}</span>
            <span data-testid="is-connected">{appState.isConnected ? "Connected" : "Disconnected"}</span>
            <span data-testid="context-project">{context.projectState?.name || "No Context"}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("project-name").textContent).toBe("Integration Test Project")
      expect(getByTestId("layout-mode").textContent).toBe("default")
      expect(getByTestId("is-connected").textContent).toBe("Connected")
      expect(getByTestId("context-project").textContent).toBe("Integration Test Project")
    })

    it("should work with useProjectManagement hook", () => {
      const TestComponent = () => {
        const projectManagement = useProjectManagement()

        return (
          <div data-testid="project-management">
            <span data-testid="project-name">{projectManagement.projectName}</span>
            <span data-testid="layout-mode">{projectManagement.layoutMode}</span>
            <span data-testid="is-connected">{projectManagement.isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("project-name").textContent).toBe("Integration Test Project")
      expect(getByTestId("layout-mode").textContent).toBe("default")
      expect(getByTestId("is-connected").textContent).toBe("Connected")
    })
  })

  describe("Cross-domain Operations", () => {
    it("should handle project creation with user settings", () => {
      const TestComponent = () => {
        const { createProject } = useProject()
        const { settings } = useUserSettings()

        React.useEffect(() => {
          createProject({
            name: "New Integration Project",
            timeline: { duration: 0 },
            settings: {
              layoutMode: settings.layoutMode,
              autoSave: settings.autoSaveEnabled,
            },
          })
        }, [createProject, settings])

        return <div data-testid="cross-domain">Project created with settings</div>
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("cross-domain").textContent).toBe("Project created with settings")
    })

    it("should synchronize project state with app state", () => {
      const TestComponent = () => {
        const { projectState } = useProject()
        const { timeline, tracks } = useAppState()

        return (
          <div data-testid="sync">
            <span data-testid="project-tracks">{projectState?.tracks?.length || 0}</span>
            <span data-testid="app-tracks">{tracks.length}</span>
            <span data-testid="project-duration">{projectState?.timeline?.duration || 0}</span>
            <span data-testid="app-duration">{timeline?.duration || 0}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("project-tracks").textContent).toBe("0")
      expect(getByTestId("app-tracks").textContent).toBe("0")
      expect(getByTestId("project-duration").textContent).toBe("0")
      expect(getByTestId("app-duration").textContent).toBe("0")
    })
  })

  describe("Error Handling Integration", () => {
    it("should handle connection errors across all providers", () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate connection error
      vi.mocked(orchestrator.isConnected).mockReturnValue(false)
      vi.mocked(orchestrator.getConnectionError).mockReturnValue("Connection failed")
      vi.mocked(orchestrator.subscribeToAppState).mockImplementation((callback) => {
        callback({
          isConnected: false,
          connectionError: "Connection failed",
          timeline: { duration: 0 },
          currentTime: 0,
          isPlaying: false,
          tracks: [],
        })
        return { unsubscribe: vi.fn() }
      })

      const TestComponent = () => {
        const { isConnected, connectionError } = useAppState()
        const context = useProjectManagementContext()

        return (
          <div data-testid="error-handling">
            <span data-testid="app-connected">{isConnected ? "Connected" : "Disconnected"}</span>
            <span data-testid="app-error">{connectionError || "No Error"}</span>
            <span data-testid="context-connected">{context.isConnected ? "Connected" : "Disconnected"}</span>
            <span data-testid="context-error">{context.connectionError || "No Error"}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("app-connected").textContent).toBe("Disconnected")
      expect(getByTestId("app-error").textContent).toBe("Connection failed")
      expect(getByTestId("context-connected").textContent).toBe("Disconnected")
      expect(getByTestId("context-error").textContent).toBe("Connection failed")
    })

    it("should handle loading states", () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate loading state
      vi.mocked(orchestrator.getProjectState).mockReturnValue(null)
      vi.mocked(orchestrator.subscribeToProjectState).mockImplementation((callback) => {
        callback(null)
        return { unsubscribe: vi.fn() }
      })

      const TestComponent = () => {
        const { isLoading } = useProject()
        const { isLoading: appIsLoading } = useAppState()
        const { isLoading: managementIsLoading } = useProjectManagement()

        return (
          <div data-testid="loading">
            <span data-testid="project-loading">{isLoading ? "Loading" : "Loaded"}</span>
            <span data-testid="app-loading">{appIsLoading ? "Loading" : "Loaded"}</span>
            <span data-testid="management-loading">{managementIsLoading ? "Loading" : "Loaded"}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("project-loading").textContent).toBe("Loading")
      expect(getByTestId("app-loading").textContent).toBe("Loading")
      expect(getByTestId("management-loading").textContent).toBe("Loading")
    })
  })

  describe("Performance Integration", () => {
    it("should handle multiple subscribers efficiently", () => {
      const TestComponent = ({ id }: { id: string }) => {
        const { projectState } = useProject()
        const { settings } = useUserSettings()
        const { isConnected } = useAppState()

        return (
          <div data-testid={`subscriber-${id}`}>
            <span data-testid={`project-${id}`}>{projectState?.name || "No Project"}</span>
            <span data-testid={`layout-${id}`}>{settings.layoutMode}</span>
            <span data-testid={`connected-${id}`}>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent id="1" />
          <TestComponent id="2" />
          <TestComponent id="3" />
        </ProjectManagementProvider>,
      )

      // All subscribers should receive the same data
      expect(getByTestId("project-1").textContent).toBe("Integration Test Project")
      expect(getByTestId("project-2").textContent).toBe("Integration Test Project")
      expect(getByTestId("project-3").textContent).toBe("Integration Test Project")
      expect(getByTestId("layout-1").textContent).toBe("default")
      expect(getByTestId("layout-2").textContent).toBe("default")
      expect(getByTestId("layout-3").textContent).toBe("default")
    })

    it("should handle rapid state updates", async () => {
      const TestComponent = () => {
        const { updateLayoutMode } = useUserSettings()
        const { settings } = useUserSettings()

        React.useEffect(() => {
          // Simulate rapid updates
          updateLayoutMode("vertical")
          updateLayoutMode("horizontal")
          updateLayoutMode("default")
        }, [updateLayoutMode])

        return <span data-testid="rapid-updates">{settings.layoutMode}</span>
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      // Should handle rapid updates without errors
      expect(getByTestId("rapid-updates").textContent).toBe("default")
    })
  })

  describe("Real-world Usage Patterns", () => {
    it("should handle typical application workflow", () => {
      const TestComponent = () => {
        const { createProject, saveProject, projectState } = useProject()
        const { updateLayoutMode, settings } = useUserSettings()
        const { addTrack, timeline } = useAppState()

        React.useEffect(() => {
          // Create project
          createProject({
            name: "Workflow Test Project",
            timeline: { duration: 60 },
          })

          // Update layout
          updateLayoutMode("vertical")

          // Add track
          addTrack("video", { name: "Main Track" })
        }, [createProject, updateLayoutMode, addTrack])

        return (
          <div data-testid="workflow">
            <span data-testid="project-name">{projectState?.name || "No Project"}</span>
            <span data-testid="layout">{settings.layoutMode}</span>
            <span data-testid="timeline-duration">{timeline?.duration || 0}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("project-name").textContent).toBe("Workflow Test Project")
      expect(getByTestId("layout").textContent).toBe("vertical")
      expect(getByTestId("timeline-duration").textContent).toBe("60")
    })

    it("should handle settings persistence across providers", () => {
      const TestComponent = () => {
        const { updateLayoutMode } = useUserSettings()
        const { settings: settings1 } = useUserSettings()
        const { layoutMode } = useUserSettings()
        const context = useProjectManagementContext()

        React.useEffect(() => {
          updateLayoutMode("vertical")
        }, [updateLayoutMode])

        return (
          <div data-testid="persistence">
            <span data-testid="settings-layout">{settings1.layoutMode}</span>
            <span data-testid="direct-layout">{layoutMode}</span>
            <span data-testid="context-layout">{context.userSettings.layoutMode}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("settings-layout").textContent).toBe("vertical")
      expect(getByTestId("direct-layout").textContent).toBe("vertical")
      expect(getByTestId("context-layout").textContent).toBe("vertical")
    })
  })
})
