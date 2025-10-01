/**
 * Unit tests for useProjectManagement hook
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BrowserTab } from "@/domains/browser"
import type { ProjectSettings } from "@/types/generated/tauri-bindings"
import { useProjectManagement } from "../../hooks/use-project-management"
import type { LayoutMode, UserSettingsContextType } from "../../machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock the orchestrator
vi.mock("../../services/project-management-orchestrator", () => ({
  getProjectManagementOrchestrator: vi.fn(),
}))

describe("useProjectManagement", () => {
  let mockOrchestrator: any
  let mockProjectSubscription: any
  let mockSettingsSubscription: any
  let mockUserSettings: Partial<UserSettingsContextType>

  beforeEach(() => {
    mockProjectSubscription = {
      unsubscribe: vi.fn(),
    }

    mockSettingsSubscription = {
      unsubscribe: vi.fn(),
    }

    mockUserSettings = {
      layoutMode: "default",
      activeTab: "media",
      gpuAccelerationEnabled: false,
      autoSaveEnabled: true,
      autoSaveInterval: 30,
      playerVolume: 0.8,
      screenshotsPath: "/screenshots",
      playerScreenshotsPath: "/player/screenshots",
      isBrowserVisible: true,
      isTimelineVisible: true,
      isOptionsVisible: true,
      isAIAssistantVisible: false,
      isLoaded: true,
      previewSizes: {} as any,
      proxyEnabled: false,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      renderQuality: "high",
      backgroundRenderingEnabled: true,
      renderDelay: 0,
      // youtubeCredentials: { clientId: "", clientSecret: "" },
      // tiktokCredentials: { clientId: "", clientSecret: "" },
      // vimeoCredentials: { clientId: "", clientSecret: "", accessToken: "" },
      // telegramCredentials: { botToken: "", chatId: "" },
      codecovToken: "",
      tauriAnalyticsKey: "",
      // apiKeyStatuses: {},
      aiAnalysisEnabled: false,
      aiAnalysisFrameRate: 1,
      aiContentDetectionTypes: [],
      aiAnalysisConfidenceThreshold: 0.5,
      visionServiceEnabled: false,
      // visionThresholds: { object: 0.5, face: 0.5, text: 0.5 },
      preferredLanguage: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      montagePlannerAnalysisDepth: "medium",
      montagePlannerAutoSuggest: true,
      browserSettings: undefined,
    }

    mockOrchestrator = {
      getProjectState: vi.fn(() => null),
      getUserSettings: vi.fn(() => mockUserSettings),
      isConnected: vi.fn(() => false),
      getConnectionError: vi.fn(() => null),
      subscribeToProjectState: vi.fn(() => mockProjectSubscription),
      subscribeToUserSettings: vi.fn(() => mockSettingsSubscription),
      createProject: vi.fn(() => Promise.resolve()),
      openProject: vi.fn(() => Promise.resolve()),
      saveProject: vi.fn(() => Promise.resolve()),
      saveProjectAs: vi.fn(() => Promise.resolve()),
      closeProject: vi.fn(() => Promise.resolve()),
      updateUserSettings: vi.fn(),
    }

    ;(getProjectManagementOrchestrator as any).mockReturnValue(mockOrchestrator)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useProjectManagement())

    expect(result.current.projectState).toBeNull()
    expect(result.current.userSettings).toEqual(mockUserSettings)
    expect(result.current.isConnected).toBe(false)
    expect(result.current.connectionError).toBeNull()
    expect(result.current.hasProject).toBe(false)
    expect(result.current.projectName).toBeNull()
    expect(result.current.projectPath).toBeNull()
    expect(result.current.isAutoSaveEnabled).toBe(true)
    expect(result.current.layoutMode).toBe("default")
    expect(result.current.activeTab).toBe("media")
  })

  it("should provide project operations", () => {
    const { result } = renderHook(() => useProjectManagement())

    expect(result.current.createProject).toBeDefined()
    expect(result.current.openProject).toBeDefined()
    expect(result.current.saveProject).toBeDefined()
    expect(result.current.saveProjectAs).toBeDefined()
    expect(result.current.closeProject).toBeDefined()
    expect(result.current.updateUserSettings).toBeDefined()
  })

  it("should provide convenience getters", () => {
    const { result } = renderHook(() => useProjectManagement())

    expect(result.current.hasProject).toBeDefined()
    expect(result.current.projectName).toBeDefined()
    expect(result.current.projectPath).toBeDefined()
    expect(result.current.isAutoSaveEnabled).toBeDefined()
    expect(result.current.layoutMode).toBeDefined()
    expect(result.current.activeTab).toBeDefined()
  })

  describe("Project operations", () => {
    it("should create project", async () => {
      const { result } = renderHook(() => useProjectManagement())

      const projectSettings: ProjectSettings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 44100,
        audio_channels: 2,
      }

      await act(async () => {
        await result.current.createProject(projectSettings)
      })

      expect(mockOrchestrator.createProject).toHaveBeenCalledWith(projectSettings)
    })

    it("should open project", () => {
      const { result } = renderHook(() => useProjectManagement())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.openProject("/path/to/project.tlsp")
      })

      expect(orchestrator.openProject).toHaveBeenCalledWith("/path/to/project.tlsp")
    })

    it("should save project", () => {
      const { result } = renderHook(() => useProjectManagement())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.saveProject()
      })

      expect(orchestrator.saveProject).toHaveBeenCalled()
    })

    it("should save project as", () => {
      const { result } = renderHook(() => useProjectManagement())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.saveProjectAs("/new/path/project.tlsp")
      })

      expect(orchestrator.saveProjectAs).toHaveBeenCalledWith("/new/path/project.tlsp")
    })

    it("should close project", () => {
      const { result } = renderHook(() => useProjectManagement())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.closeProject()
      })

      expect(orchestrator.closeProject).toHaveBeenCalled()
    })
  })

  describe("User settings operations", () => {
    it("should update user settings", () => {
      const { result } = renderHook(() => useProjectManagement())
      const orchestrator = getProjectManagementOrchestrator()

      const newSettings = {
        layoutMode: "vertical" as LayoutMode,
        activeTab: "media" as BrowserTab,
      }

      act(() => {
        result.current.updateUserSettings(newSettings)
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith(newSettings)
    })
  })

  describe("Convenience getters", () => {
    it("should provide projectName getter", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.projectName).toBeNull()
    })

    it("should provide projectPath getter", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.projectPath).toBeNull()
    })

    it("should provide isAutoSaveEnabled getter", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.isAutoSaveEnabled).toBe(true)
    })

    it("should provide layoutMode getter", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.layoutMode).toBe("default")
    })

    it("should provide activeTab getter", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.activeTab).toBe("media")
    })

    it("should provide hasProject getter", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.hasProject).toBe(false)
    })
  })

  describe("Connection state", () => {
    it("should handle connection state changes", () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate connection state change
      vi.mocked(orchestrator.isConnected).mockReturnValue(false)
      vi.mocked(orchestrator.getConnectionError).mockReturnValue("Connection failed")

      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionError).toBe("Connection failed")
    })
  })

  describe("Loading state", () => {
    it("should handle null project state", () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate null project state
      vi.mocked(orchestrator.getProjectState).mockReturnValue(null)

      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.projectState).toBeNull()
      expect(result.current.hasProject).toBe(false)
    })
  })

  describe("Error handling", () => {
    it("should handle orchestrator errors in createProject", async () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate orchestrator error
      vi.mocked(orchestrator.createProject).mockRejectedValue(new Error("Orchestrator error"))

      const { result } = renderHook(() => useProjectManagement())

      await expect(async () => {
        await act(async () => {
          await result.current.createProject({
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 44100,
            audio_channels: 2,
          })
        })
      }).rejects.toThrow("Orchestrator error")
    })
  })

  describe("Cleanup", () => {
    it("should unsubscribe on unmount", () => {
      const orchestrator = getProjectManagementOrchestrator()
      const mockUnsubscribe = vi.fn()

      vi.mocked(orchestrator.subscribeToProjectState).mockReturnValue({
        unsubscribe: mockUnsubscribe,
      })
      vi.mocked(orchestrator.subscribeToUserSettings).mockReturnValue({
        unsubscribe: mockUnsubscribe,
      })

      const { unmount } = renderHook(() => useProjectManagement())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2)
    })
  })
})
