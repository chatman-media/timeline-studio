// Используем типы и машину из домена

import { createContext, useEffect, useState } from "react"
import { type BrowserTab } from "@/domains/browser/types"
import { type LayoutMode } from "@/domains/project-management/machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "@/domains/project-management/services/project-management-orchestrator"

/**
 * Интерфейс значения контекста пользовательских настроек
 * Определяет данные и методы, доступные через хук useUserSettings
 *
 * @interface UserSettingsContextValue
 */
export interface UserSettingsContextValue {
  // Данные настроек
  activeTab: BrowserTab // Активная вкладка в браузере
  layoutMode: LayoutMode // Текущий макет интерфейса
  playerScreenshotsPath: string // Путь для сохранения скриншотов плеера
  screenshotsPath: string // Путь для сохранения скриншотов
  playerVolume: number // Громкость плеера (0-100)
  openAiApiKey: string // API ключ OpenAI
  claudeApiKey: string // API ключ Claude
  isBrowserVisible: boolean // Флаг видимости браузера
  isTimelineVisible: boolean // Флаг видимости временной шкалы
  isOptionsVisible: boolean // Флаг видимости опций

  // GPU и производительность
  gpuAccelerationEnabled: boolean
  preferredGpuEncoder: string
  maxConcurrentJobs: number
  renderQuality: string
  backgroundRenderingEnabled: boolean
  renderDelay: number

  // Настройки прокси
  proxyEnabled: boolean
  proxyType: string
  proxyHost: string
  proxyPort: string
  proxyUsername: string
  proxyPassword: string

  // Настройки автосохранения
  autoSaveEnabled: boolean
  autoSaveInterval: number

  // Методы для изменения настроек
  handleTabChange: (value: string) => void // Изменение активной вкладки
  handleLayoutChange: (value: LayoutMode) => void // Изменение макета интерфейса
  handleScreenshotsPathChange: (value: string) => void // Изменение пути для скриншотов
  handlePlayerScreenshotsPathChange: (value: string) => void // Изменение пути для скриншотов плеера
  handlePlayerVolumeChange: (value: number) => void // Изменение громкости плеера
  handleAiApiKeyChange: (value: string) => void // Изменение API ключа OpenAI
  handleClaudeApiKeyChange: (value: string) => void // Изменение API ключа Claude
  toggleBrowserVisibility: () => void // Переключение видимости браузера
  toggleTimelineVisibility: () => void // Переключение видимости временной шкалы
  toggleOptionsVisibility: () => void // Переключение видимости опций

  // Методы для GPU и производительности
  handleGpuAccelerationChange: (value: boolean) => void
  handlePreferredGpuEncoderChange: (value: string) => void
  handleMaxConcurrentJobsChange: (value: number) => void
  handleRenderQualityChange: (value: string) => void
  handleBackgroundRenderingChange: (value: boolean) => void
  handleRenderDelayChange: (value: number) => void

  // Методы для прокси
  handleProxyEnabledChange: (value: boolean) => void
  handleProxyTypeChange: (value: string) => void
  handleProxyHostChange: (value: string) => void
  handleProxyPortChange: (value: string) => void
  handleProxyUsernameChange: (value: string) => void
  handleProxyPasswordChange: (value: string) => void

  // Методы для автосохранения
  handleAutoSaveEnabledChange: (value: boolean) => void
  handleAutoSaveIntervalChange: (value: number) => void
}

/**
 * Контекст для хранения и предоставления доступа к пользовательским настройкам
 * Изначально не имеет значения (undefined)
 */

export const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

/**
 * Провайдер пользовательских настроек
 * Компонент, который предоставляет доступ к пользовательским настройкам через контекст
 * Использует XState машину состояний для управления настройками
 *
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 * @returns {JSX.Element} Провайдер контекста с пользовательскими настройками
 */
export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  // Получаем оркестратор домена и подписываемся на настройки
  const [orchestrator] = useState(() => getProjectManagementOrchestrator())
  const [settings, setSettings] = useState(() => orchestrator.getUserSettings())

  useEffect(() => {
    const sub = orchestrator.subscribeToUserSettings((s) => setSettings(s))
    return () => sub.unsubscribe()
  }, [orchestrator])

  const value: UserSettingsContextValue = {
    // Значения настроек
    activeTab: settings?.activeTab ?? "media",
    layoutMode: settings?.layoutMode ?? ("default" as LayoutMode),
    screenshotsPath: settings?.screenshotsPath ?? "",
    playerScreenshotsPath: settings?.playerScreenshotsPath ?? "",
    playerVolume: settings?.playerVolume ?? 100,
    openAiApiKey: settings?.openAiApiKey ?? "",
    claudeApiKey: settings?.claudeApiKey ?? "",
    isBrowserVisible: settings?.isBrowserVisible ?? true,
    isTimelineVisible: settings?.isTimelineVisible ?? true,
    isOptionsVisible: settings?.isOptionsVisible ?? false,

    // GPU и производительность
    gpuAccelerationEnabled: settings?.gpuAccelerationEnabled ?? false,
    preferredGpuEncoder: settings?.preferredGpuEncoder ?? "auto",
    maxConcurrentJobs: settings?.maxConcurrentJobs ?? 1,
    renderQuality: settings?.renderQuality ?? "medium",
    backgroundRenderingEnabled: settings?.backgroundRenderingEnabled ?? false,
    renderDelay: settings?.renderDelay ?? 0,

    // Прокси
    proxyEnabled: settings?.proxyEnabled ?? false,
    proxyType: settings?.proxyType ?? "http",
    proxyHost: settings?.proxyHost ?? "",
    proxyPort: settings?.proxyPort ?? "",
    proxyUsername: settings?.proxyUsername ?? "",
    proxyPassword: settings?.proxyPassword ?? "",

    // Автосохранение
    autoSaveEnabled: settings?.autoSaveEnabled ?? true,
    autoSaveInterval: settings?.autoSaveInterval ?? 300,

    // Методы изменения
    handleTabChange: (value: string) => {
      if (["media", "music", "transitions", "effects", "filters", "templates"].includes(value)) {
        orchestrator.updateUserSettings({ activeTab: value as BrowserTab })
      }
    },

    handleLayoutChange: (value: LayoutMode) => {
      orchestrator.updateUserSettings({ layoutMode: value })
    },

    handlePlayerScreenshotsPathChange: (value: string) => {
      orchestrator.updateUserSettings({ playerScreenshotsPath: value })
    },

    handleScreenshotsPathChange: (value: string) => {
      orchestrator.updateUserSettings({ screenshotsPath: value })
    },

    handleAiApiKeyChange: (value: string) => {
      orchestrator.updateUserSettings({ openAiApiKey: value })
    },

    handleClaudeApiKeyChange: (value: string) => {
      orchestrator.updateUserSettings({ claudeApiKey: value })
    },

    handlePlayerVolumeChange: (value: number) => {
      orchestrator.updateUserSettings({ playerVolume: value })
    },

    toggleBrowserVisibility: () => {
      orchestrator.updateUserSettings({ isBrowserVisible: !settings.isBrowserVisible })
    },

    toggleTimelineVisibility: () => {
      orchestrator.updateUserSettings({ isTimelineVisible: !settings.isTimelineVisible })
    },

    toggleOptionsVisibility: () => {
      orchestrator.updateUserSettings({ isOptionsVisible: !settings.isOptionsVisible })
    },

    // GPU и производительность
    handleGpuAccelerationChange: (value: boolean) => {
      orchestrator.updateUserSettings({ gpuAccelerationEnabled: value })
    },

    handlePreferredGpuEncoderChange: (value: string) => {
      orchestrator.updateUserSettings({ preferredGpuEncoder: value })
    },

    handleMaxConcurrentJobsChange: (value: number) => {
      orchestrator.updateUserSettings({ maxConcurrentJobs: value })
    },

    handleRenderQualityChange: (value: string) => {
      orchestrator.updateUserSettings({ renderQuality: value })
    },

    handleBackgroundRenderingChange: (value: boolean) => {
      orchestrator.updateUserSettings({ backgroundRenderingEnabled: value })
    },

    handleRenderDelayChange: (value: number) => {
      orchestrator.updateUserSettings({ renderDelay: value })
    },

    // Прокси
    handleProxyEnabledChange: (value: boolean) => {
      orchestrator.updateUserSettings({ proxyEnabled: value })
    },

    handleProxyTypeChange: (value: string) => {
      orchestrator.updateUserSettings({ proxyType: value })
    },

    handleProxyHostChange: (value: string) => {
      orchestrator.updateUserSettings({ proxyHost: value })
    },

    handleProxyPortChange: (value: string) => {
      orchestrator.updateUserSettings({ proxyPort: value })
    },

    handleProxyUsernameChange: (value: string) => {
      orchestrator.updateUserSettings({ proxyUsername: value })
    },

    handleProxyPasswordChange: (value: string) => {
      orchestrator.updateUserSettings({ proxyPassword: value })
    },

    // Автосохранение
    handleAutoSaveEnabledChange: (value: boolean) => {
      orchestrator.updateUserSettings({ autoSaveEnabled: value })
    },

    handleAutoSaveIntervalChange: (value: number) => {
      orchestrator.updateUserSettings({ autoSaveInterval: value })
    },
  }

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
}
