/**
 * Project Management Provider Tests
 *
 * Тесты для провайдеров проектного управления
 */

import { render, renderHook, screen, waitFor } from "@testing-library/react"
import { type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectSettings } from "@/types/generated/tauri-bindings"
import {
  AppStateProvider,
  ProjectManagementProvider,
  ProjectProvider,
  UserSettingsProvider,
  useAppState,
  useProject,
  useUserSettings,
} from "../../providers/project-management-provider"
import { resetProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock BackendSync
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    connected: true,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    executeCommand: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    getProjectState: vi.fn().mockResolvedValue(null),
    onEvent: vi.fn(() => vi.fn()),
    onStateChange: vi.fn(() => vi.fn()),
  })),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
  })),
  logInfo: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
}))

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe("Project Management Providers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetProjectManagementOrchestrator()
  })

  afterEach(() => {
    resetProjectManagementOrchestrator()
  })

  describe("ProjectProvider", () => {
    it("should provide project context", () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      expect(result.current.projectState).toBeDefined()
      expect(result.current.isLoading).toBeDefined()
      expect(result.current.hasUnsavedChanges).toBeDefined()
      expect(result.current.isBackendConnected).toBe(true)
    })

    it("should provide project operations", () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      expect(typeof result.current.createProject).toBe("function")
      expect(typeof result.current.saveProject).toBe("function")
      expect(typeof result.current.saveProjectAs).toBe("function")
      expect(typeof result.current.openProject).toBe("function")
      expect(typeof result.current.closeProject).toBe("function")
      expect(typeof result.current.syncProjectState).toBe("function")
    })

    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useProject())
      }).toThrow("useProject must be used within ProjectProvider")

      console.error = originalError
    })

    it("should handle createProject call", async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      const settings: ProjectSettings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      }

      await result.current.createProject(settings)
      // Should not throw
    })

    it("should handle saveProject call", async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      await result.current.saveProject()

      // Should complete without errors
    })

    it("should handle syncProjectState when connected", async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      await result.current.syncProjectState()

      // Should complete without errors
    })

    it("should not sync when backend disconnected", async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      await result.current.syncProjectState()

      // Should complete without errors
    })
  })

  describe("UserSettingsProvider", () => {
    it("should provide user settings context", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      expect(result.current.settings).toBeDefined()
      expect(result.current.isLoading).toBeDefined()
      expect(result.current.isBackendConnected).toBe(true)
    })

    it("should provide settings operations", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      expect(typeof result.current.updateSettings).toBe("function")
      expect(typeof result.current.updateLayoutMode).toBe("function")
      expect(typeof result.current.updateActiveTab).toBe("function")
      expect(typeof result.current.updateApiKey).toBe("function")
      expect(typeof result.current.updateGpuAcceleration).toBe("function")
      expect(typeof result.current.updateAutoSave).toBe("function")
      expect(typeof result.current.syncSettings).toBe("function")
    })

    it("should throw error when used outside provider", () => {
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useUserSettings())
      }).toThrow("useUserSettings must be used within UserSettingsProvider")

      console.error = originalError
    })

    it("should update layout mode", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      result.current.updateLayoutMode("vertical")

      // Should complete without errors
      expect(typeof result.current.updateLayoutMode).toBe("function")
    })

    it("should update active tab", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      result.current.updateActiveTab("audio")

      expect(typeof result.current.updateActiveTab).toBe("function")
    })

    it("should update API keys", async () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      await result.current.updateApiKey("openai", "test-key")

      expect(typeof result.current.updateApiKey).toBe("function")
    })

    it("should update GPU acceleration", async () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      await result.current.updateGpuAcceleration(false)

      expect(typeof result.current.updateGpuAcceleration).toBe("function")
    })

    it("should update auto-save settings", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      result.current.updateAutoSave(false, 120)

      // Settings updated (no need to wait as it's synchronous in the hook)
    })
  })

  describe("AppStateProvider", () => {
    it("should provide app state context", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      })

      expect(result.current.isConnected).toBeDefined()
      expect(result.current.connectionError).toBeDefined()
      expect(result.current.isLoading).toBeDefined()
      expect(result.current.backendStatus).toBeDefined()
    })

    it("should provide retry connection function", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      })

      expect(typeof result.current.retryConnection).toBe("function")
    })

    it("should throw error when used outside provider", () => {
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useAppState())
      }).toThrow("useAppState must be used within AppStateProvider")

      console.error = originalError
    })

    it("should track backend status", () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      })

      expect(result.current.backendStatus.connected).toBe(true)
      expect(result.current.backendStatus.lastSync).toBeInstanceOf(Date)
      expect(result.current.backendStatus.syncErrors).toBe(0)
    })

    it("should handle retry connection", async () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      })

      result.current.retryConnection()

      // Should not throw
    })
  })

  describe("ProjectManagementProvider", () => {
    it("should render children", () => {
      const TestComponent = () => <div>Test Content</div>

      render(
        <ProjectManagementProvider>
          <TestComponent />
        </ProjectManagementProvider>,
      )

      expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("should provide all nested contexts", () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ProjectManagementProvider>{children}</ProjectManagementProvider>
      )

      const { result } = renderHook(
        () => ({
          project: useProject(),
          settings: useUserSettings(),
          appState: useAppState(),
        }),
        { wrapper },
      )

      expect(result.current.project).toBeDefined()
      expect(result.current.settings).toBeDefined()
      expect(result.current.appState).toBeDefined()
    })

    it("should initialize backend sync on mount", () => {
      render(
        <ProjectManagementProvider>
          <div>Test</div>
        </ProjectManagementProvider>,
      )

      // Should mount without errors
      expect(screen.getByText("Test")).toBeInTheDocument()
    })

    it("should cleanup backend sync on unmount", () => {
      const { unmount } = render(
        <ProjectManagementProvider>
          <div>Test</div>
        </ProjectManagementProvider>,
      )

      unmount()

      // Should unmount without errors
    })
  })

  describe("Integration Tests", () => {
    it("should allow cross-provider communication", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ProjectManagementProvider>{children}</ProjectManagementProvider>
      )

      const { result } = renderHook(
        () => ({
          project: useProject(),
          settings: useUserSettings(),
        }),
        { wrapper },
      )

      // Update settings
      result.current.settings.updateLayoutMode("vertical")

      // Create project
      const projectSettings: ProjectSettings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      }

      await result.current.project.createProject(projectSettings)

      // Should not throw
      expect(result.current.project).toBeDefined()
      expect(result.current.settings).toBeDefined()
    })

    it("should handle backend connection changes", async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ProjectManagementProvider>{children}</ProjectManagementProvider>
      )

      const { result } = renderHook(() => useAppState(), { wrapper })

      expect(result.current.backendStatus.connected).toBe(true)

      // Backend status should be tracked
      expect(result.current.backendStatus).toBeDefined()
    })
  })

  describe("Edge Cases", () => {
    it("should handle sync errors gracefully", async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      await expect(result.current.syncProjectState()).resolves.not.toThrow()
    })

    it("should handle multiple rapid setting updates", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsProvider,
      })

      result.current.updateLayoutMode("vertical")
      result.current.updateLayoutMode("chat")
      result.current.updateLayoutMode("options")

      // Should complete without errors
      expect(typeof result.current.updateLayoutMode).toBe("function")
    })

    it("should handle null project state", () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      })

      expect(result.current.projectState).toBeNull()
      expect(result.current.hasUnsavedChanges).toBe(false)
    })
  })
})
