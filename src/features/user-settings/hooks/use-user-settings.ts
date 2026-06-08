import { type BrowserTab } from "@/domains/browser"
import { useUserSettings as useDomainUserSettings } from "@/domains/project-management"
import { type LayoutMode } from "@/domains/project-management/machines/user-settings-machine"
import { type UserSettingsContextValue } from "../services/user-settings-provider"

/**
 * Адаптер-хук: сохраняем публичный API features/use-user-settings,
 * но под капотом используем доменную реализацию через Orchestrator.
 * Провайдер контекста больше не обязателен.
 */
export function useUserSettings(): UserSettingsContextValue {
  const d = useDomainUserSettings()

  // Совместимый API обработчиков (handle*) из legacy-версии
  const handleTabChange = (value: string) => {
    // Совместимость с прежней валидацией вкладок
    const allowed = ["media", "music", "transitions", "effects", "filters", "templates"] as const
    if (allowed.includes(value as (typeof allowed)[number])) {
      d.updateActiveTab(value as BrowserTab)
    }
  }

  const handleLayoutChange = (value: LayoutMode) => d.updateLayoutMode(value)
  const handleScreenshotsPathChange = (value: string) => d.updateScreenshotsPath(value)
  const handlePlayerScreenshotsPathChange = (value: string) => d.updatePlayerScreenshotsPath(value)
  const handlePlayerVolumeChange = (value: number) => d.updatePlayerVolume(value)
  const handleAiApiKeyChange = (value: string) => d.updateOpenAiApiKey(value)
  const handleClaudeApiKeyChange = (value: string) => d.updateClaudeApiKey(value)

  // GPU/Perf
  const handleGpuAccelerationChange = (value: boolean) => d.updateGpuAcceleration(value)
  const handlePreferredGpuEncoderChange = (value: string) => d.updateSettings({ preferredGpuEncoder: value })
  const handleMaxConcurrentJobsChange = (value: number) => d.updateSettings({ maxConcurrentJobs: value })
  const handleRenderQualityChange = (value: string) => d.updateSettings({ renderQuality: value })
  const handleBackgroundRenderingChange = (value: boolean) => d.updateSettings({ backgroundRenderingEnabled: value })
  const handleRenderDelayChange = (value: number) => d.updateSettings({ renderDelay: value })

  // Proxy
  const handleProxyEnabledChange = (value: boolean) => d.updateSettings({ proxyEnabled: value })
  const handleProxyTypeChange = (value: string) => d.updateSettings({ proxyType: value })
  const handleProxyHostChange = (value: string) => d.updateSettings({ proxyHost: value })
  const handleProxyPortChange = (value: string) => d.updateSettings({ proxyPort: value })
  const handleProxyUsernameChange = (value: string) => d.updateSettings({ proxyUsername: value })
  const handleProxyPasswordChange = (value: string) => d.updateSettings({ proxyPassword: value })

  // Auto-save
  const handleAutoSaveEnabledChange = (value: boolean) => d.updateAutoSave(value)
  const handleAutoSaveIntervalChange = (value: number) => d.updateAutoSaveInterval(value)

  // Timeline optimization
  const handleTimelineVirtualizationEnabledChange = (value: boolean) =>
    d.updateSettings({ timelineVirtualizationEnabled: value })
  const handleTimelineVirtualizationOverscanChange = (value: number) =>
    d.updateSettings({ timelineVirtualizationOverscan: value })
  const handleTimelineClipDetailsThresholdChange = (value: number) =>
    d.updateSettings({ timelineClipDetailsThreshold: value })

  return {
    // Данные настроек (сквозняк из доменного стора)
    activeTab: d.activeTab,
    layoutMode: d.layoutMode,
    playerScreenshotsPath: d.playerScreenshotsPath,
    screenshotsPath: d.screenshotsPath,
    playerVolume: d.playerVolume,
    openAiApiKey: d.openAiApiKey,
    claudeApiKey: d.claudeApiKey,
    isBrowserVisible: d.isBrowserVisible,
    isTimelineVisible: d.isTimelineVisible,
    isOptionsVisible: d.isOptionsVisible,
    isLoaded: d.isLoaded,

    // Внешний вид
    themeMode: d.themeMode,
    colorScheme: d.colorScheme,
    customColorSchemes: d.customColorSchemes ?? [],
    quickAccessSchemeIds: d.quickAccessSchemeIds ?? [],

    // GPU/Perf
    gpuAccelerationEnabled: d.gpuAccelerationEnabled,
    preferredGpuEncoder: d.preferredGpuEncoder,
    maxConcurrentJobs: d.maxConcurrentJobs,
    renderQuality: d.renderQuality,
    backgroundRenderingEnabled: d.backgroundRenderingEnabled,
    renderDelay: d.renderDelay,

    // Proxy
    proxyEnabled: d.proxyEnabled,
    proxyType: d.proxyType,
    proxyHost: d.proxyHost,
    proxyPort: d.proxyPort,
    proxyUsername: d.proxyUsername,
    proxyPassword: d.proxyPassword,

    // Auto-save
    autoSaveEnabled: d.autoSaveEnabled,
    autoSaveInterval: d.autoSaveInterval,

    // Timeline optimization
    timelineVirtualizationEnabled: d.timelineVirtualizationEnabled ?? true,
    timelineVirtualizationOverscan: d.timelineVirtualizationOverscan ?? 5,
    timelineClipDetailsThreshold: d.timelineClipDetailsThreshold ?? 50,

    // Методы изменения (совместимый API)
    handleTabChange,
    handleLayoutChange,
    handleScreenshotsPathChange,
    handlePlayerScreenshotsPathChange,
    handlePlayerVolumeChange,
    handleAiApiKeyChange,
    handleClaudeApiKeyChange,
    toggleBrowserVisibility: d.toggleBrowserVisibility,
    toggleTimelineVisibility: d.toggleTimelineVisibility,
    toggleOptionsVisibility: d.toggleOptionsVisibility,
    updateSettings: (updates: Record<string, unknown>) => d.updateSettings(updates as any),

    // GPU/Perf
    handleGpuAccelerationChange,
    handlePreferredGpuEncoderChange,
    handleMaxConcurrentJobsChange,
    handleRenderQualityChange,
    handleBackgroundRenderingChange,
    handleRenderDelayChange,

    // Proxy
    handleProxyEnabledChange,
    handleProxyTypeChange,
    handleProxyHostChange,
    handleProxyPortChange,
    handleProxyUsernameChange,
    handleProxyPasswordChange,

    // Auto-save
    handleAutoSaveEnabledChange,
    handleAutoSaveIntervalChange,

    // Timeline optimization
    handleTimelineVirtualizationEnabledChange,
    handleTimelineVirtualizationOverscanChange,
    handleTimelineClipDetailsThresholdChange,
  }
}
