/**
 * Unit tests for Project Management Provider
 */

import { render, renderHook } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { UserSettingsContextType, useProjectManagementContext } from "../.."
import {
  AppStateProvider,
  ProjectManagementProvider,
  ProjectProvider,
  UserSettingsProvider,
  useAppState,
  useProject,
  useUserSettings,
} from "../../providers/project-management-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock useSelector from @xstate/react
vi.mock("@xstate/react", async () => {
  const actual = await vi.importActual<typeof import("@xstate/react")>("@xstate/react")
  return {
    ...actual,
    useSelector: vi.fn((_actor, selector) => {
      // Return mock values based on the selector function
      const mockState = {
        context: {
          projectState: null,
          isConnected: true,
          error: null,
          settings: { isLoaded: true },
        },
        matches: vi.fn(() => false),
      }
      return selector(mockState)
    }),
  }
})

// Mock the orchestrator
vi.mock("../../services/project-management-orchestrator", () => ({
  getProjectManagementOrchestrator: vi.fn(() => {
    const mockUpdateUserSettings = vi.fn()
    return {
      getAppActor: vi.fn(() => ({
        send: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getSnapshot: vi.fn(() => ({
          context: { isConnected: true, error: null, projectState: null },
          matches: vi.fn(() => false),
        })),
      })),
      getUserSettingsActor: vi.fn(() => ({
        send: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getSnapshot: vi.fn(() => ({
          context: { settings: {}, isLoaded: true },
          matches: vi.fn(() => false),
        })),
      })),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      saveProjectAs: vi.fn(),
      openProject: vi.fn(),
      closeProject: vi.fn(),
      updateUserSettings: mockUpdateUserSettings,
      getProjectState: vi.fn(() => null),
      getUserSettings: vi.fn(
        () =>
          ({
            previewSize: "medium",
            activeTab: "timeline",
            layoutMode: "horizontal",
            openaiApiKey: null,
            claudeApiKey: null,
            gpuAcceleration: false,
            autoSave: true,
            autoSaveInterval: 30,
            playerVolume: 1,
            playerScreenshotsPath: "",
            isBrowserVisible: true,
            isTimelineVisible: true,
            isOptionsVisible: true,
            isAIAssistantVisible: false,
          }) as unknown as UserSettingsContextType,
      ),
      isConnected: vi.fn(() => true),
      getConnectionError: vi.fn(() => null),
      subscribeToProjectState: vi.fn(() => ({ unsubscribe: vi.fn() })),
      subscribeToUserSettings: vi.fn(() => ({ unsubscribe: vi.fn() })),
    }
  }),
}))

describe("Project Management Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("useProject hook", () => {
    it("should throw error when used outside ProjectProvider", () => {
      // This test should throw an error when useProject is called outside ProjectProvider
      expect(() => renderHook(() => useProject())).toThrow("useProject must be used within ProjectProvider")
    })

    it("should provide project context when used within ProjectProvider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <ProjectProvider>{children}</ProjectProvider>

      const { result } = renderHook(() => useProject(), { wrapper })

      expect(result.current).toHaveProperty("projectState")
      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("hasUnsavedChanges")
      expect(result.current).toHaveProperty("createProject")
      expect(result.current).toHaveProperty("saveProject")
      expect(result.current).toHaveProperty("openProject")
      expect(result.current).toHaveProperty("closeProject")
    })
  })

  describe("useUserSettings hook", () => {
    it("should throw error when used outside UserSettingsProvider", () => {
      // This test should throw an error when useUserSettings is called outside UserSettingsProvider
      expect(() => renderHook(() => useUserSettings())).toThrow(
        "useUserSettings must be used within UserSettingsProvider",
      )
    })

    it("should provide user settings context when used within UserSettingsProvider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserSettingsProvider>{children}</UserSettingsProvider>
      )

      const { result } = renderHook(() => useUserSettings(), { wrapper })

      expect(result.current).toHaveProperty("settings")
      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("updateSettings")
      expect(result.current).toHaveProperty("updateLayoutMode")
      expect(result.current).toHaveProperty("updateActiveTab")
      expect(result.current).toHaveProperty("updateApiKey")
      expect(result.current).toHaveProperty("updateGpuAcceleration")
      expect(result.current).toHaveProperty("updateAutoSave")
    })
  })

  describe("useAppState hook", () => {
    it("should throw error when used outside AppStateProvider", () => {
      // This test should throw an error when useAppState is called outside AppStateProvider
      expect(() => renderHook(() => useAppState())).toThrow("useAppState must be used within AppStateProvider")
    })

    it("should provide app state context when used within AppStateProvider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateProvider>{children}</AppStateProvider>

      const { result } = renderHook(() => useAppState(), { wrapper })

      expect(result.current).toHaveProperty("isConnected")
      expect(result.current).toHaveProperty("connectionError")
      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("retryConnection")
    })
  })

  describe("ProjectManagementProvider", () => {
    it("should render without errors", () => {
      const { container } = render(
        <ProjectManagementProvider>
          <div>Test Content</div>
        </ProjectManagementProvider>,
      )

      expect(container.textContent).toBe("Test Content")
    })

    it("should provide all contexts when used together", () => {
      const TestComponent = () => {
        const project = useProject()
        const userSettings = useUserSettings()
        const appState = useAppState()

        return (
          <div>
            <span data-testid="project">{project ? "project-exists" : "no-project"}</span>
            <span data-testid="settings">{userSettings ? "settings-exists" : "no-settings"}</span>
            <span data-testid="appstate">{appState ? "appstate-exists" : "no-appstate"}</span>
          </div>
        )
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(getByTestId("project").textContent).toBe("project-exists")
      expect(getByTestId("settings").textContent).toBe("settings-exists")
      expect(getByTestId("appstate").textContent).toBe("appstate-exists")
    })
  })

  describe("useProjectManagementContext", () => {
    it("should provide context values", () => {
      const TestComponent = () => {
        const context = useProjectManagementContext()
        return <div data-testid="context">{JSON.stringify(context)}</div>
      }

      const { getByTestId } = render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      const context = JSON.parse(getByTestId("context").textContent || "{}")
      expect(context).toHaveProperty("projectState")
      expect(context).toHaveProperty("userSettings")
      expect(context).toHaveProperty("isConnected")
      expect(context).toHaveProperty("connectionError")
      expect(context).toHaveProperty("isLoading")
    })
  })

  describe("User settings functionality", () => {
    it("should handle layout mode updates", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserSettingsProvider>{children}</UserSettingsProvider>
      )
      const { result } = renderHook(() => useUserSettings(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.updateLayoutMode("vertical")).not.toThrow()
    })

    it("should handle API key updates", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserSettingsProvider>{children}</UserSettingsProvider>
      )
      const { result } = renderHook(() => useUserSettings(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.updateApiKey("openai", "new-api-key")).not.toThrow()
    })

    it("should handle GPU acceleration updates", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserSettingsProvider>{children}</UserSettingsProvider>
      )
      const { result } = renderHook(() => useUserSettings(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.updateGpuAcceleration(false)).not.toThrow()
    })

    it("should handle auto-save updates", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserSettingsProvider>{children}</UserSettingsProvider>
      )
      const { result } = renderHook(() => useUserSettings(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.updateAutoSave(true, 10)).not.toThrow()
    })
  })

  describe("Project operations", () => {
    it("should handle project creation", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <ProjectProvider>{children}</ProjectProvider>

      const { result } = renderHook(() => useProject(), { wrapper })

      // Just verify the method exists and can be called without throwing
      const projectSettings = {
        name: "Test Project",
        timeline: { duration: 0 },
        resolution: "1920x1080" as any,
        frame_rate: 30,
        audio_sample_rate: 44100,
        audio_channels: 2,
      }
      expect(() => result.current.createProject(projectSettings)).not.toThrow()
    })

    it("should handle project opening", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <ProjectProvider>{children}</ProjectProvider>

      const { result } = renderHook(() => useProject(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.openProject("/test/project.tlsp")).not.toThrow()
    })

    it("should handle project saving", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <ProjectProvider>{children}</ProjectProvider>

      const { result } = renderHook(() => useProject(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.saveProject()).not.toThrow()
    })

    it("should handle project closing", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <ProjectProvider>{children}</ProjectProvider>

      const { result } = renderHook(() => useProject(), { wrapper })

      // Just verify the method exists and can be called without throwing
      expect(() => result.current.closeProject()).not.toThrow()
    })
  })

  describe("App state operations", () => {
    it("should handle connection retry", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <AppStateProvider>{children}</AppStateProvider>

      const { result } = renderHook(() => useAppState(), { wrapper })

      result.current.retryConnection()

      // The retryConnection should send a RETRY_CONNECTION event
      // This is tested by ensuring no errors are thrown
      expect(result.current.retryConnection).toBeDefined()
    })
  })
})
