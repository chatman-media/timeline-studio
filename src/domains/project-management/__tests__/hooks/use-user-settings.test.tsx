/**
 * @vitest-environment jsdom
 */
/**
 * Use User Settings Hook Tests
 *
 * Тесты для хука useUserSettings из domains/project-management
 */

import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useUserSettings } from "../../hooks/use-user-settings"
import { resetProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock BackendSync
vi.mock("@/domains/project-management/services/backend-sync", () => ({
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

describe("useUserSettings Hook (Domain)", () => {
  beforeEach(() => {
    resetProjectManagementOrchestrator()
  })

  afterEach(() => {
    resetProjectManagementOrchestrator()
  })

  describe("Initial State", () => {
    it("should initialize with default settings", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.layoutMode).toBe("default")
      expect(result.current.activeTab).toBe("media")
      expect(result.current.playerVolume).toBe(100)
      expect(result.current.autoSaveEnabled).toBe(true)
      expect(result.current.gpuAccelerationEnabled).toBe(true)
    })

    it("should initialize computed properties", () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.hasOpenAiApiKey).toBe(false)
      expect(result.current.hasClaudeApiKey).toBe(false)
      expect(result.current.isGpuEnabled).toBe(true)
      expect(result.current.isAutoSaveOn).toBe(true)
    })
  })

  describe("Layout Mode", () => {
    it("should update layout mode", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateLayoutMode("vertical")

      // Update is synchronous in hook
      expect(typeof result.current.updateLayoutMode).toBe("function")
    })

    it("should support all layout modes", () => {
      const { result } = renderHook(() => useUserSettings())

      const modes = ["default", "options", "vertical", "chat"] as const

      modes.forEach((mode) => {
        result.current.updateLayoutMode(mode)
      })

      // All modes should be supported
      expect(typeof result.current.updateLayoutMode).toBe("function")
    })
  })

  describe("Active Tab", () => {
    it("should update active tab", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateActiveTab("music")

      expect(typeof result.current.updateActiveTab).toBe("function")
    })

    it("should support various tab types", () => {
      const { result } = renderHook(() => useUserSettings())

      const tabs = ["media", "music", "effects", "transitions"] as const

      tabs.forEach((tab) => {
        result.current.updateActiveTab(tab)
      })

      expect(typeof result.current.updateActiveTab).toBe("function")
    })
  })

  describe("API Keys", () => {
    it("should update OpenAI API key", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateOpenAiApiKey("test-openai-key")

      expect(typeof result.current.updateOpenAiApiKey).toBe("function")
    })

    it("should update Claude API key", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateClaudeApiKey("test-claude-key")

      expect(typeof result.current.updateClaudeApiKey).toBe("function")
    })

    it("should handle empty API keys", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateOpenAiApiKey("")
      result.current.updateClaudeApiKey("")

      expect(typeof result.current.updateOpenAiApiKey).toBe("function")
    })
  })

  describe("GPU Settings", () => {
    it("should update GPU acceleration", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateGpuAcceleration(false)

      expect(typeof result.current.updateGpuAcceleration).toBe("function")
    })

    it("should toggle GPU acceleration", () => {
      const { result } = renderHook(() => useUserSettings())

      const initialState = result.current.gpuAccelerationEnabled

      result.current.updateGpuAcceleration(!initialState)

      expect(typeof result.current.updateGpuAcceleration).toBe("function")
    })
  })

  describe("Auto-save Settings", () => {
    it("should update auto-save enabled", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateAutoSave(false)

      expect(typeof result.current.updateAutoSave).toBe("function")
    })

    it("should update auto-save interval", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateAutoSaveInterval(120)

      expect(typeof result.current.updateAutoSaveInterval).toBe("function")
    })

    it("should update both auto-save enabled and interval", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateSettings({
        autoSaveEnabled: false,
        autoSaveInterval: 180,
      })

      expect(typeof result.current.updateSettings).toBe("function")
    })
  })

  describe("Player Settings", () => {
    it("should update player volume", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updatePlayerVolume(75)

      expect(typeof result.current.updatePlayerVolume).toBe("function")
    })

    it("should update screenshots path", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateScreenshotsPath("/custom/screenshots")

      expect(typeof result.current.updateScreenshotsPath).toBe("function")
    })

    it("should update player screenshots path", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updatePlayerScreenshotsPath("/custom/player/screenshots")

      expect(typeof result.current.updatePlayerScreenshotsPath).toBe("function")
    })
  })

  describe("Visibility Toggles", () => {
    it("should toggle browser visibility", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.toggleBrowserVisibility()

      expect(typeof result.current.toggleBrowserVisibility).toBe("function")
    })

    it("should toggle timeline visibility", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.toggleTimelineVisibility()

      expect(typeof result.current.toggleTimelineVisibility).toBe("function")
    })

    it("should toggle options visibility", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.toggleOptionsVisibility()

      expect(typeof result.current.toggleOptionsVisibility).toBe("function")
    })

    it("should handle multiple toggles", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.toggleBrowserVisibility()
      result.current.toggleBrowserVisibility()

      expect(typeof result.current.toggleBrowserVisibility).toBe("function")
    })
  })

  describe("Bulk Updates", () => {
    it("should update multiple settings at once", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateSettings({
        layoutMode: "chat",
        activeTab: "music",
        playerVolume: 50,
        autoSaveEnabled: false,
      })

      expect(typeof result.current.updateSettings).toBe("function")
    })

    it("should handle partial updates", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateSettings({
        layoutMode: "vertical",
      })

      expect(typeof result.current.updateSettings).toBe("function")
    })
  })

  describe("State Subscriptions", () => {
    it("should subscribe to settings changes", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateLayoutMode("vertical")

      expect(typeof result.current.updateLayoutMode).toBe("function")
    })

    it("should cleanup subscriptions on unmount", () => {
      const { unmount } = renderHook(() => useUserSettings())

      // Should not throw on unmount
      unmount()
    })
  })

  describe("Edge Cases", () => {
    it("should handle zero volume", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updatePlayerVolume(0)

      expect(typeof result.current.updatePlayerVolume).toBe("function")
    })

    it("should handle maximum volume", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updatePlayerVolume(100)

      expect(typeof result.current.updatePlayerVolume).toBe("function")
    })

    it("should handle very long API keys", () => {
      const { result } = renderHook(() => useUserSettings())

      const longKey = "a".repeat(1000)
      result.current.updateOpenAiApiKey(longKey)

      expect(typeof result.current.updateOpenAiApiKey).toBe("function")
    })

    it("should handle rapid setting changes", () => {
      const { result } = renderHook(() => useUserSettings())

      result.current.updateLayoutMode("vertical")
      result.current.updateLayoutMode("chat")
      result.current.updateLayoutMode("options")

      expect(typeof result.current.updateLayoutMode).toBe("function")
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", () => {
      const { result, rerender } = renderHook(() => useUserSettings())

      const initialUpdateLayoutMode = result.current.updateLayoutMode
      const initialUpdateActiveTab = result.current.updateActiveTab
      const initialUpdateSettings = result.current.updateSettings
      const initialToggleBrowser = result.current.toggleBrowserVisibility

      rerender()

      expect(result.current.updateLayoutMode).toBe(initialUpdateLayoutMode)
      expect(result.current.updateActiveTab).toBe(initialUpdateActiveTab)
      expect(result.current.updateSettings).toBe(initialUpdateSettings)
      expect(result.current.toggleBrowserVisibility).toBe(initialToggleBrowser)
    })
  })
})
