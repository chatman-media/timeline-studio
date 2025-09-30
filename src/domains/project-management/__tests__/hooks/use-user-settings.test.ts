/**
 * Unit tests for useUserSettings hook
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useUserSettings } from "../../hooks/use-user-settings"
import type { UserSettingsContextType } from "../../machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock the orchestrator
vi.mock("../../services/project-management-orchestrator", () => ({
  getProjectManagementOrchestrator: vi.fn(() => ({
    getUserSettingsActor: vi.fn(() => ({
      send: vi.fn(),
      subscribe: vi.fn((callback) => {
        // Simulate initial state
        callback({
          context: {
            layoutMode: "default",
            activeTab: "timeline",
            openAiApiKey: "test-key",
            claudeApiKey: "",
            gpuAccelerationEnabled: true,
            autoSaveEnabled: true,
            autoSaveInterval: 5,
            playerVolume: 0.8,
            screenshotPath: "",
            browserVisible: true,
            timelineVisible: true,
            optionsVisible: true,
          },
          value: "idle",
        })
        return { unsubscribe: vi.fn() }
      }),
    })),
    getUserSettings: vi.fn(() => ({
      layoutMode: "default",
      activeTab: "timeline",
      openAiApiKey: "test-key",
      claudeApiKey: "",
      gpuAccelerationEnabled: true,
      autoSaveEnabled: true,
      autoSaveInterval: 5,
      playerVolume: 0.8,
      screenshotPath: "",
      isBrowserVisible: true,
      isTimelineVisible: true,
      isOptionsVisible: true,
    })),
    subscribeToUserSettings: vi.fn((callback) => {
      callback({
        layoutMode: "default",
        activeTab: "timeline",
        openAiApiKey: "test-key",
        claudeApiKey: "",
        gpuAccelerationEnabled: true,
        autoSaveEnabled: true,
        autoSaveInterval: 5,
        playerVolume: 0.8,
        screenshotPath: "",
        isBrowserVisible: true,
        isTimelineVisible: true,
        isOptionsVisible: true,
      })
      return { unsubscribe: vi.fn() }
    }),
    updateUserSettings: vi.fn(),
  })),
}))

describe("useUserSettings", () => {
  let mockOrchestrator: any
  let mockSubscription: any
  let mockSettings: UserSettingsContextType

  beforeEach(() => {
    mockSubscription = {
      unsubscribe: vi.fn(),
    }

    mockSettings = {
      layoutMode: "default",
      activeTab: "media",
      openAiApiKey: "test-key",
      claudeApiKey: "",
      gpuAccelerationEnabled: true,
      autoSaveEnabled: true,
      autoSaveInterval: 5,
      playerVolume: 0.8,
      screenshotsPath: "",
      playerScreenshotsPath: "",
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
      youtubeCredentials: { clientId: "", clientSecret: "" },
      tiktokCredentials: { clientId: "", clientSecret: "" },
      vimeoCredentials: { clientId: "", clientSecret: "", accessToken: "" },
      telegramCredentials: { botToken: "", chatId: "" },
      codecovToken: "",
      tauriAnalyticsKey: "",
      apiKeyStatuses: {},
      aiAnalysisEnabled: false,
      aiAnalysisFrameRate: 1,
      aiContentDetectionTypes: [],
      aiAnalysisConfidenceThreshold: 0.5,
      visionServiceEnabled: false,
      visionThresholds: { object: 0.5, face: 0.5, text: 0.5 },
      preferredLanguage: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      montagePlannerAnalysisDepth: "medium",
      montagePlannerAutoSuggest: true,
      browserSettings: undefined,
    }

    mockOrchestrator = {
      getUserSettings: vi.fn(() => mockSettings),
      subscribeToUserSettings: vi.fn(() => mockSubscription),
      updateUserSettings: vi.fn(),
    }

    ;(getProjectManagementOrchestrator as any).mockReturnValue(mockOrchestrator)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUserSettings())

    expect(result.current.layoutMode).toBe("default")
    expect(result.current.activeTab).toBe("timeline")
    expect(result.current.openAiApiKey).toBe("test-key")
    expect(result.current.claudeApiKey).toBe("")
    expect(result.current.gpuAccelerationEnabled).toBe(true)
    expect(result.current.autoSaveEnabled).toBe(true)
    expect(result.current.autoSaveInterval).toBe(5)
    expect(result.current.playerVolume).toBe(0.8)
    expect(result.current.screenshotsPath).toBe("")
    expect(result.current.isBrowserVisible).toBe(true)
    expect(result.current.isTimelineVisible).toBe(true)
    expect(result.current.isOptionsVisible).toBe(true)
  })

  it("should provide settings operations", () => {
    const { result } = renderHook(() => useUserSettings())

    expect(result.current.updateSettings).toBeDefined()
    expect(result.current.updateLayoutMode).toBeDefined()
    expect(result.current.updateActiveTab).toBeDefined()
    expect(result.current.updateOpenAiApiKey).toBeDefined()
    expect(result.current.updateClaudeApiKey).toBeDefined()
    expect(result.current.updateGpuAcceleration).toBeDefined()
    expect(result.current.updateAutoSave).toBeDefined()
    expect(result.current.updatePlayerVolume).toBeDefined()
    expect(result.current.updateScreenshotsPath).toBeDefined()
    expect(result.current.updatePlayerScreenshotsPath).toBeDefined()
    expect(result.current.toggleBrowserVisibility).toBeDefined()
    expect(result.current.toggleTimelineVisibility).toBeDefined()
    expect(result.current.toggleOptionsVisibility).toBeDefined()
  })

  describe("Settings operations", () => {
    it("should update settings", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      const newSettings = {
        layoutMode: "vertical",
        activeTab: "browser",
        openAiApiKey: "new-key",
      }

      act(() => {
        result.current.updateSettings(newSettings)
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith(newSettings)
    })

    it("should update layout mode", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateLayoutMode("vertical")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        layoutMode: "vertical",
      })
    })

    it("should update active tab", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateActiveTab("browser")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        activeTab: "browser",
      })
    })

    it("should update OpenAI API key", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateOpenAiApiKey("new-openai-key")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        openAiApiKey: "new-openai-key",
      })
    })

    it("should update Claude API key", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateClaudeApiKey("new-claude-key")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        claudeApiKey: "new-claude-key",
      })
    })

    it("should update GPU acceleration", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateGpuAcceleration(false)
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        gpuAccelerationEnabled: false,
      })
    })

    it("should update auto-save", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateAutoSave(true)
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        autoSaveEnabled: true,
      })
    })

    it("should update player volume", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updatePlayerVolume(0.5)
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        playerVolume: 0.5,
      })
    })

    it("should update screenshots path", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateScreenshotsPath("/new/path/screenshots")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        screenshotsPath: "/new/path/screenshots",
      })
    })

    it("should update screenshots path", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updateScreenshotsPath("/new/path")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        screenshotsPath: "/new/path",
      })
    })

    it("should update player screenshots path", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.updatePlayerScreenshotsPath("/player/new/path")
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        playerScreenshotsPath: "/player/new/path",
      })
    })
  })

  describe("Visibility toggles", () => {
    it("should toggle browser visibility", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.toggleBrowserVisibility()
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        isBrowserVisible: false,
      })
    })

    it("should toggle timeline visibility", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.toggleTimelineVisibility()
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        isTimelineVisible: false,
      })
    })

    it("should toggle options visibility", () => {
      const { result } = renderHook(() => useUserSettings())
      const orchestrator = getProjectManagementOrchestrator()

      act(() => {
        result.current.toggleOptionsVisibility()
      })

      expect(orchestrator.updateUserSettings).toHaveBeenCalledWith({
        isOptionsVisible: false,
      })
    })
  })

  describe("Convenience getters", () => {
    it("should provide hasOpenAiApiKey getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.hasOpenAiApiKey).toBe(true)
    })

    it("should provide hasClaudeApiKey getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.hasClaudeApiKey).toBe(false)
    })

    it("should provide layoutMode getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.layoutMode).toBe("default")
    })

    it("should provide activeTab getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.activeTab).toBe("timeline")
    })

    it("should provide gpuAccelerationEnabled getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.gpuAccelerationEnabled).toBe(true)
    })

    it("should provide autoSaveEnabled getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.autoSaveEnabled).toBe(true)
    })

    it("should provide playerVolume getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.playerVolume).toBe(0.8)
    })

    it("should provide isBrowserVisible getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.isBrowserVisible).toBe(true)
    })

    it("should provide isTimelineVisible getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.isTimelineVisible).toBe(true)
    })

    it("should provide isOptionsVisible getter", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.isOptionsVisible).toBe(true)
    })
  })

  describe("Error handling", () => {
    it("should handle orchestrator errors gracefully", () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate orchestrator error
      vi.mocked(orchestrator.updateUserSettings).mockImplementation(() => {
        throw new Error("Orchestrator error")
      })

      const { result } = renderHook(() => useUserSettings())

      expect(() => {
        act(() => {
          result.current.updateSettings({ layoutMode: "vertical" })
        })
      }).toThrow("Orchestrator error")
    })

    it("should handle subscription errors gracefully", () => {
      const orchestrator = getProjectManagementOrchestrator()

      // Simulate subscription error
      vi.mocked(orchestrator.subscribeToUserSettings).mockImplementation(() => {
        throw new Error("Subscription error")
      })

      expect(() => {
        renderHook(() => useUserSettings())
      }).toThrow("Subscription error")
    })
  })

  describe("Cleanup", () => {
    it("should unsubscribe on unmount", () => {
      const orchestrator = getProjectManagementOrchestrator()
      const mockUnsubscribe = vi.fn()

      vi.mocked(orchestrator.subscribeToUserSettings).mockReturnValue({
        unsubscribe: mockUnsubscribe,
      })

      const { unmount } = renderHook(() => useUserSettings())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe("Edge cases", () => {
    it("should handle empty settings", () => {
      const orchestrator = getProjectManagementOrchestrator()

      vi.mocked(orchestrator.getUserSettings).mockReturnValue({} as any)
      vi.mocked(orchestrator.subscribeToUserSettings).mockImplementation((callback) => {
        callback({} as any)
        return { unsubscribe: vi.fn() }
      })

      const { result } = renderHook(() => useUserSettings())

      // The hook spreads settings, so empty object should still work but properties will be undefined
      expect(result.current.hasOpenAiApiKey).toBe(false)
      expect(result.current.hasClaudeApiKey).toBe(false)
      expect(result.current.layoutMode).toBeUndefined()
      expect(result.current.activeTab).toBeUndefined()
    })

    it("should handle null API keys", () => {
      const orchestrator = getProjectManagementOrchestrator()

      const settingsWithNullKeys = {
        layoutMode: "default",
        activeTab: "timeline",
        openAiApiKey: null,
        claudeApiKey: null,
        gpuAccelerationEnabled: true,
        autoSaveEnabled: true,
        autoSaveInterval: 5,
        playerVolume: 0.8,
        screenshotPath: "",
        isBrowserVisible: true,
        isTimelineVisible: true,
        isOptionsVisible: true,
      }

      vi.mocked(orchestrator.getUserSettings).mockReturnValue(settingsWithNullKeys)
      vi.mocked(orchestrator.subscribeToUserSettings).mockImplementation((callback) => {
        callback(settingsWithNullKeys)
        return { unsubscribe: vi.fn() }
      })

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.hasOpenAiApiKey).toBe(false)
      expect(result.current.hasClaudeApiKey).toBe(false)
    })
  })
})
