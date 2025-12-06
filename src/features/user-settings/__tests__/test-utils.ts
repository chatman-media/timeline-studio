import { vi } from "vitest"
import type { UserSettingsContextValue } from "../services/user-settings-provider"

/**
 * Создает полный мок для useApiKeys со всеми обязательными полями
 */
export function createMockApiKeys(overrides?: any) {
  return {
    getApiKeyStatus: vi.fn().mockReturnValue("not_set"),
    getApiKeyInfo: vi.fn().mockReturnValue(null),
    getValidationError: vi.fn().mockReturnValue(undefined),
    testApiKey: vi.fn(),
    saveSimpleApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
    loadApiKeysInfo: vi.fn(),
    saveOAuthCredentials: vi.fn(),
    generateOAuthUrl: vi.fn(),
    exchangeOAuthCode: vi.fn(),
    refreshOAuthToken: vi.fn(),
    getOAuthUserInfo: vi.fn(),
    parseOAuthCallbackUrl: vi.fn(),
    importFromEnv: vi.fn(),
    exportToEnvFormat: vi.fn(),
    apiKeysInfo: {},
    loadingStatuses: {},
    ...overrides,
  }
}

/**
 * Создает полный мок для UserSettingsContextValue со всеми обязательными полями
 */
export function createMockUserSettings(overrides?: Partial<UserSettingsContextValue>): UserSettingsContextValue {
  return {
    // Базовые настройки
    screenshotsPath: "", // Пути теперь загружаются из AppDirectories
    playerScreenshotsPath: "", // Пути теперь загружаются из AppDirectories
    openAiApiKey: "",
    claudeApiKey: "",
    isBrowserVisible: true,
    isTimelineVisible: true,
    isOptionsVisible: true,
    activeTab: "media",
    layoutMode: "default",
    playerVolume: 100,

    // GPU и производительность
    gpuAccelerationEnabled: false,
    preferredGpuEncoder: "auto",
    maxConcurrentJobs: 1,
    renderQuality: "medium",
    backgroundRenderingEnabled: false,
    renderDelay: 0,

    // Прокси
    proxyEnabled: false,
    proxyType: "http",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: "",

    // Автосохранение
    autoSaveEnabled: true,
    autoSaveInterval: 300,

    // Timeline оптимизация
    timelineVirtualizationEnabled: true,
    timelineVirtualizationOverscan: 5,
    timelineClipDetailsThreshold: 50,

    // Методы изменения базовых настроек
    handleScreenshotsPathChange: vi.fn(),
    handlePlayerScreenshotsPathChange: vi.fn(),
    handleAiApiKeyChange: vi.fn(),
    handleClaudeApiKeyChange: vi.fn(),
    handleTabChange: vi.fn(),
    handleLayoutChange: vi.fn(),
    toggleBrowserVisibility: vi.fn(),
    handlePlayerVolumeChange: vi.fn(),
    toggleTimelineVisibility: vi.fn(),
    toggleOptionsVisibility: vi.fn(),

    // Методы GPU и производительности
    handleGpuAccelerationChange: vi.fn(),
    handlePreferredGpuEncoderChange: vi.fn(),
    handleMaxConcurrentJobsChange: vi.fn(),
    handleRenderQualityChange: vi.fn(),
    handleBackgroundRenderingChange: vi.fn(),
    handleRenderDelayChange: vi.fn(),

    // Методы прокси
    handleProxyEnabledChange: vi.fn(),
    handleProxyTypeChange: vi.fn(),
    handleProxyHostChange: vi.fn(),
    handleProxyPortChange: vi.fn(),
    handleProxyUsernameChange: vi.fn(),
    handleProxyPasswordChange: vi.fn(),

    // Методы автосохранения
    handleAutoSaveEnabledChange: vi.fn(),
    handleAutoSaveIntervalChange: vi.fn(),

    // Методы Timeline оптимизации
    handleTimelineVirtualizationEnabledChange: vi.fn(),
    handleTimelineVirtualizationOverscanChange: vi.fn(),
    handleTimelineClipDetailsThresholdChange: vi.fn(),

    // Применяем переопределения
    ...overrides,
  }
}
