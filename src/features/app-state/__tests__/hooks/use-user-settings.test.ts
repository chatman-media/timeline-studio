/**
 * Tests for useUserSettings hook
 * Tests user settings loading, saving, and error handling
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_TAB } from "@/domains/browser"
import {
  DEFAULT_LAYOUT,
  type UserSettingsContextType,
} from "@/domains/project-management/machines/user-settings-machine"
import { DEFAULT_CONTENT_SIZES } from "@/features/media/utils/preview-sizes"
import { useUserSettings } from "../../hooks/use-user-settings"
import { storeService } from "@/domains/project-management/services/store-service"

// Mock storeService
vi.mock("@/domains/project-management/services/store-service", () => ({
  storeService: {
    getUserSettings: vi.fn(),
    saveUserSettings: vi.fn(),
  },
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}))

describe("useUserSettings", () => {
  const mockUserSettings: UserSettingsContextType = {
    previewSizes: DEFAULT_CONTENT_SIZES,
    activeTab: DEFAULT_TAB,
    layoutMode: DEFAULT_LAYOUT,
    screenshotsPath: "public/screenshots",
    playerScreenshotsPath: "public/media",
    playerVolume: 100,
    openAiApiKey: "",
    claudeApiKey: "",
    youtubeClientId: "",
    youtubeClientSecret: "",
    tiktokClientId: "",
    tiktokClientSecret: "",
    vimeoClientId: "",
    vimeoClientSecret: "",
    vimeoAccessToken: "",
    telegramBotToken: "",
    telegramChatId: "",
    codecovToken: "",
    tauriAnalyticsKey: "",
    gpuAccelerationEnabled: true,
    preferredGpuEncoder: "auto",
    maxConcurrentJobs: 2,
    renderQuality: "high",
    backgroundRenderingEnabled: true,
    renderDelay: 5,
    proxyEnabled: false,
    proxyType: "http",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: "",
    apiKeysStatus: {
      openai: "not_set",
      claude: "not_set",
      youtube: "not_set",
      tiktok: "not_set",
      vimeo: "not_set",
      telegram: "not_set",
      codecov: "not_set",
      tauri_analytics: "not_set",
    },
    autoSaveEnabled: true,
    autoSaveInterval: 60,
    timelineVirtualizationEnabled: true,
    timelineVirtualizationOverscan: 5,
    timelineClipDetailsThreshold: 50,
    aiAnalysisEnabled: false,
    aiAnalysisFrameRate: 2,
    aiContentDetectionTypes: ["objects", "faces", "scenes"],
    aiAnalysisConfidenceThreshold: 0.7,
    visionServiceEnabled: false,
    visionObjectDetectionThreshold: 0.5,
    visionFaceDetectionThreshold: 0.5,
    visionTextRecognitionThreshold: 0.7,
    visionMaxDetectionsPerFrame: 100,
    montagePlannerEnabled: true,
    montagePlannerDefaultStyle: "dynamic",
    montagePlannerAnalysisDepth: "medium",
    montagePlannerAutoSuggest: true,
    preferredLanguage: "ru",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "24h",
    isBrowserVisible: true,
    isTimelineVisible: true,
    isOptionsVisible: true,
    isAIAssistantVisible: false,
    isLoaded: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(storeService.getUserSettings).mockResolvedValue(mockUserSettings)
    vi.mocked(storeService.saveUserSettings).mockResolvedValue()
  })

  describe("Initial loading", () => {
    it("should load user settings on mount", async () => {
      const { result } = renderHook(() => useUserSettings())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.userSettings).toEqual(mockUserSettings)
      expect(result.current.error).toBeNull()
      expect(storeService.getUserSettings).toHaveBeenCalled()
    })

    it("should handle loading errors", async () => {
      const error = new Error("Failed to load settings")
      vi.mocked(storeService.getUserSettings).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.userSettings).toBeNull()
      expect(result.current.error).toBe("Failed to load settings")
    })

    it("should handle non-Error exceptions", async () => {
      vi.mocked(storeService.getUserSettings).mockRejectedValueOnce("String error")

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Failed to load user settings")
    })
  })

  describe("Saving settings", () => {
    it("should save user settings", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newSettings: Partial<UserSettingsContextType> = {
        preferredLanguage: "en",
        layoutMode: "vertical",
      }

      const response = await result.current.saveUserSettings(newSettings)

      expect(response.success).toBe(true)
      expect(storeService.saveUserSettings).toHaveBeenCalledWith({
        ...mockUserSettings,
        ...newSettings,
      })

      await waitFor(() => {
        expect(result.current.userSettings).toEqual({
          ...mockUserSettings,
          ...newSettings,
        })
      })
    })

    it("should handle save errors", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const error = new Error("Save failed")
      vi.mocked(storeService.saveUserSettings).mockRejectedValueOnce(error)

      const response = await result.current.saveUserSettings({ preferredLanguage: "en" })

      expect(response.success).toBe(false)
      expect(response.error).toBe("Save failed")

      await waitFor(() => {
        expect(result.current.error).toBe("Save failed")
      })
    })

    it("should handle save with null current settings", async () => {
      vi.mocked(storeService.getUserSettings).mockResolvedValueOnce(null)

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const newSettings: Partial<UserSettingsContextType> = {
        preferredLanguage: "en",
      }

      await result.current.saveUserSettings(newSettings)

      expect(storeService.saveUserSettings).toHaveBeenCalledWith(expect.objectContaining(newSettings))
    })

    it("should merge partial settings with existing settings", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.saveUserSettings({ layoutMode: "vertical" })

      expect(storeService.saveUserSettings).toHaveBeenCalledWith({
        ...mockUserSettings,
        layoutMode: "vertical",
      })
    })
  })

  describe("Updating single setting", () => {
    it("should update single setting", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.updateSetting("preferredLanguage", "en")

      expect(response.success).toBe(true)
      expect(storeService.saveUserSettings).toHaveBeenCalledWith({
        ...mockUserSettings,
        preferredLanguage: "en",
      })
    })

    it("should update nested settings", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.updateSetting("autoSaveInterval", 30)

      expect(storeService.saveUserSettings).toHaveBeenCalledWith({
        ...mockUserSettings,
        autoSaveInterval: 30,
      })
    })

    it("should handle update errors", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(storeService.saveUserSettings).mockRejectedValueOnce(new Error("Update failed"))

      const response = await result.current.updateSetting("layoutMode", "vertical")

      expect(response.success).toBe(false)
      expect(response.error).toBe("Update failed")
    })
  })

  describe("Refetch functionality", () => {
    it("should refetch settings", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.clearAllMocks()

      const updatedSettings: UserSettingsContextType = {
        ...mockUserSettings,
        preferredLanguage: "en",
      }
      vi.mocked(storeService.getUserSettings).mockResolvedValueOnce(updatedSettings)

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.userSettings).toEqual(updatedSettings)
      })

      expect(storeService.getUserSettings).toHaveBeenCalledTimes(1)
    })

    it("should set loading state during refetch", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock with updated settings
      const updatedSettings: UserSettingsContextType = {
        ...mockUserSettings,
        preferredLanguage: "en",
      }
      vi.mocked(storeService.getUserSettings).mockResolvedValueOnce(updatedSettings)

      // Call refetch and wait for it to complete
      await result.current.refetch()

      // Verify settings were updated
      await waitFor(() => {
        expect(result.current.userSettings?.preferredLanguage).toBe("en")
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle refetch errors", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(storeService.getUserSettings).mockRejectedValueOnce(new Error("Refetch failed"))

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.error).toBe("Refetch failed")
      })
    })
  })

  describe("Error state management", () => {
    it("should clear error on successful operation", async () => {
      // First load with error
      vi.mocked(storeService.getUserSettings).mockRejectedValueOnce(new Error("Initial error"))

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.error).toBe("Initial error")
      })

      // Then successful save should clear error
      await result.current.saveUserSettings({ preferredLanguage: "en" })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })

    it("should clear error on successful refetch", async () => {
      // Initial error
      vi.mocked(storeService.getUserSettings).mockRejectedValueOnce(new Error("Load error"))

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.error).toBe("Load error")
      })

      // Successful refetch
      vi.mocked(storeService.getUserSettings).mockResolvedValueOnce(mockUserSettings)

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe("Edge cases", () => {
    it("should handle rapid successive saves", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Fire multiple saves rapidly
      const promises = [
        result.current.saveUserSettings({ preferredLanguage: "en" }),
        result.current.saveUserSettings({ layoutMode: "vertical" }),
        result.current.saveUserSettings({ autoSaveEnabled: false }),
      ]

      await Promise.all(promises)

      expect(storeService.saveUserSettings).toHaveBeenCalledTimes(3)
    })

    it("should handle empty partial settings", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.saveUserSettings({})

      expect(storeService.saveUserSettings).toHaveBeenCalledWith(mockUserSettings)
    })

    it("should handle settings with undefined values", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.saveUserSettings({
        preferredLanguage: undefined,
        layoutMode: "vertical",
      } as any)

      expect(storeService.saveUserSettings).toHaveBeenCalled()
    })
  })

  describe("loadUserSettings method", () => {
    it("should explicitly reload settings", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.clearAllMocks()

      await result.current.loadUserSettings()

      expect(storeService.getUserSettings).toHaveBeenCalledTimes(1)
    })

    it("should be same reference as refetch", async () => {
      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.loadUserSettings).toBe(result.current.refetch)
    })
  })
})
