import { useCallback, useEffect, useRef, useState } from "react"

import { logInfo } from "@/lib/tauri-logger"
import { getUserSettingsService } from "../services/user-settings-service"
import type { UserSettingsContextType, UserSettingsSnapshot } from "../types/user-settings"

export function useUserSettings(): UserSettingsSnapshot {
  const [settingsService] = useState(() => getUserSettingsService())
  const [settings, setSettings] = useState<UserSettingsContextType>(() => settingsService.getUserSettings())

  const isInitialized = useRef(false)
  useEffect(() => {
    if (!isInitialized.current) {
      logInfo("[useUserSettings] Инициализация хука")
      isInitialized.current = true
    }
  }, [])

  useEffect(() => {
    const subscription = settingsService.subscribeToUserSettings((newSettings) => {
      setSettings(newSettings)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [settingsService])

  const updateLayoutMode = useCallback(
    (layoutMode: UserSettingsContextType["layoutMode"]) => {
      settingsService.updateUserSettings({ layoutMode })
    },
    [settingsService],
  )

  const updateActiveTab = useCallback(
    (activeTab: UserSettingsContextType["activeTab"]) => {
      settingsService.updateUserSettings({ activeTab })
    },
    [settingsService],
  )

  const updateOpenAiApiKey = useCallback(
    (openAiApiKey: string) => {
      settingsService.updateUserSettings({ openAiApiKey })
    },
    [settingsService],
  )

  const updateClaudeApiKey = useCallback(
    (claudeApiKey: string) => {
      settingsService.updateUserSettings({ claudeApiKey })
    },
    [settingsService],
  )

  const updateGpuAcceleration = useCallback(
    (gpuAccelerationEnabled: boolean) => {
      settingsService.updateUserSettings({ gpuAccelerationEnabled })
    },
    [settingsService],
  )

  const updateAutoSave = useCallback(
    (autoSaveEnabled: boolean) => {
      settingsService.updateUserSettings({ autoSaveEnabled })
    },
    [settingsService],
  )

  const updateAutoSaveInterval = useCallback(
    (autoSaveInterval: number) => {
      settingsService.updateUserSettings({ autoSaveInterval })
    },
    [settingsService],
  )

  const updatePlayerVolume = useCallback(
    (playerVolume: number) => {
      settingsService.updateUserSettings({ playerVolume })
    },
    [settingsService],
  )

  const updatePlayerVideoSource = useCallback(
    (playerVideoSource: "browser" | "timeline") => {
      settingsService.updateUserSettings({ playerVideoSource })
    },
    [settingsService],
  )

  const updateScreenshotsPath = useCallback(
    (screenshotsPath: string) => {
      settingsService.updateUserSettings({ screenshotsPath })
    },
    [settingsService],
  )

  const updatePlayerScreenshotsPath = useCallback(
    (playerScreenshotsPath: string) => {
      settingsService.updateUserSettings({ playerScreenshotsPath })
    },
    [settingsService],
  )

  const toggleBrowserVisibility = useCallback(() => {
    settingsService.updateUserSettings({ isBrowserVisible: !settings.isBrowserVisible })
  }, [settingsService, settings.isBrowserVisible])

  const toggleTimelineVisibility = useCallback(() => {
    settingsService.updateUserSettings({ isTimelineVisible: !settings.isTimelineVisible })
  }, [settingsService, settings.isTimelineVisible])

  const toggleOptionsVisibility = useCallback(() => {
    settingsService.updateUserSettings({ isOptionsVisible: !settings.isOptionsVisible })
  }, [settingsService, settings.isOptionsVisible])

  const toggleAIAssistantVisibility = useCallback(() => {
    settingsService.updateUserSettings({ isAIAssistantVisible: !settings.isAIAssistantVisible })
  }, [settingsService, settings.isAIAssistantVisible])

  const updateSettings = useCallback(
    (updates: Partial<UserSettingsContextType>) => {
      settingsService.updateUserSettings(updates)
    },
    [settingsService],
  )

  return {
    ...settings,
    updateLayoutMode,
    updateActiveTab,
    updateOpenAiApiKey,
    updateClaudeApiKey,
    updateGpuAcceleration,
    updateAutoSave,
    updateAutoSaveInterval,
    updatePlayerVolume,
    updatePlayerVideoSource,
    updateScreenshotsPath,
    updatePlayerScreenshotsPath,
    updateSettings,
    toggleBrowserVisibility,
    toggleTimelineVisibility,
    toggleOptionsVisibility,
    toggleAIAssistantVisibility,
    hasOpenAiApiKey: !!settings.openAiApiKey,
    hasClaudeApiKey: !!settings.claudeApiKey,
    isGpuEnabled: settings.gpuAccelerationEnabled,
    isAutoSaveOn: settings.autoSaveEnabled,
  }
}
