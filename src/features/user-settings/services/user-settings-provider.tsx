// Используем типы и машину из домена

import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { type BrowserTab } from "@/domains/browser"
import type { UserSettingsContextType } from "@/domains/project-management/machines/user-settings-machine"
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

  // Настройки оптимизации Timeline
  timelineVirtualizationEnabled: boolean
  timelineVirtualizationOverscan: number
  timelineClipDetailsThreshold: number

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

  // Методы для оптимизации Timeline
  handleTimelineVirtualizationEnabledChange: (value: boolean) => void
  handleTimelineVirtualizationOverscanChange: (value: number) => void
  handleTimelineClipDetailsThresholdChange: (value: number) => void
}

/**
 * Контекст для хранения и предоставления доступа к пользовательским настройкам
 * Изначально не имеет значения (undefined)
 */

export const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

/**
 * Провайдер пользовательских настроек
 * Компонент, который предоставляет доступ к пользовательским настройкам через контекст
 * Использует ProjectManagementOrchestrator для управления настройками
 *
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 * @returns {JSX.Element} Провайдер контекста с пользовательскими настройками
 */
export function UserSettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings?: Partial<UserSettingsContextType>
}) {
  // Получаем оркестратор домена и подписываемся на настройки
  const [orchestrator] = useState(() => getProjectManagementOrchestrator())
  const [settings, setSettings] = useState(() => orchestrator.getUserSettings())

  // Применяем начальные настройки при монтировании, если переданы
  useEffect(() => {
    if (initialSettings) {
      orchestrator.updateUserSettings(initialSettings)
    }
  }, [orchestrator, initialSettings])

  useEffect(() => {
    const sub = orchestrator.subscribeToUserSettings((s) => setSettings(s))
    return () => sub.unsubscribe()
  }, [orchestrator])

  // Мемоизированные методы изменения настроек
  const handleTabChange = useCallback(
    (value: string) => {
      if (["media", "music", "transitions", "effects", "filters", "templates"].includes(value)) {
        orchestrator.updateUserSettings({ activeTab: value as BrowserTab })
      }
    },
    [orchestrator],
  )

  const handleLayoutChange = useCallback(
    (value: LayoutMode) => orchestrator.updateUserSettings({ layoutMode: value }),
    [orchestrator],
  )

  const handlePlayerScreenshotsPathChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ playerScreenshotsPath: value }),
    [orchestrator],
  )

  const handleScreenshotsPathChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ screenshotsPath: value }),
    [orchestrator],
  )

  const handleAiApiKeyChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ openAiApiKey: value }),
    [orchestrator],
  )

  const handleClaudeApiKeyChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ claudeApiKey: value }),
    [orchestrator],
  )

  const handlePlayerVolumeChange = useCallback(
    (value: number) => orchestrator.updateUserSettings({ playerVolume: value }),
    [orchestrator],
  )

  const toggleBrowserVisibility = useCallback(
    () => orchestrator.updateUserSettings({ isBrowserVisible: !settings.isBrowserVisible }),
    [orchestrator, settings.isBrowserVisible],
  )

  const toggleTimelineVisibility = useCallback(
    () => orchestrator.updateUserSettings({ isTimelineVisible: !settings.isTimelineVisible }),
    [orchestrator, settings.isTimelineVisible],
  )

  const toggleOptionsVisibility = useCallback(
    () => orchestrator.updateUserSettings({ isOptionsVisible: !settings.isOptionsVisible }),
    [orchestrator, settings.isOptionsVisible],
  )

  // GPU и производительность
  const handleGpuAccelerationChange = useCallback(
    (value: boolean) => orchestrator.updateUserSettings({ gpuAccelerationEnabled: value }),
    [orchestrator],
  )

  const handlePreferredGpuEncoderChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ preferredGpuEncoder: value }),
    [orchestrator],
  )

  const handleMaxConcurrentJobsChange = useCallback(
    (value: number) => orchestrator.updateUserSettings({ maxConcurrentJobs: value }),
    [orchestrator],
  )

  const handleRenderQualityChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ renderQuality: value }),
    [orchestrator],
  )

  const handleBackgroundRenderingChange = useCallback(
    (value: boolean) => orchestrator.updateUserSettings({ backgroundRenderingEnabled: value }),
    [orchestrator],
  )

  const handleRenderDelayChange = useCallback(
    (value: number) => orchestrator.updateUserSettings({ renderDelay: value }),
    [orchestrator],
  )

  // Прокси
  const handleProxyEnabledChange = useCallback(
    (value: boolean) => orchestrator.updateUserSettings({ proxyEnabled: value }),
    [orchestrator],
  )

  const handleProxyTypeChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ proxyType: value }),
    [orchestrator],
  )

  const handleProxyHostChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ proxyHost: value }),
    [orchestrator],
  )

  const handleProxyPortChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ proxyPort: value }),
    [orchestrator],
  )

  const handleProxyUsernameChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ proxyUsername: value }),
    [orchestrator],
  )

  const handleProxyPasswordChange = useCallback(
    (value: string) => orchestrator.updateUserSettings({ proxyPassword: value }),
    [orchestrator],
  )

  // Автосохранение
  const handleAutoSaveEnabledChange = useCallback(
    (value: boolean) => orchestrator.updateUserSettings({ autoSaveEnabled: value }),
    [orchestrator],
  )

  const handleAutoSaveIntervalChange = useCallback(
    (value: number) => orchestrator.updateUserSettings({ autoSaveInterval: value }),
    [orchestrator],
  )

  // Оптимизация Timeline
  const handleTimelineVirtualizationEnabledChange = useCallback(
    (value: boolean) => orchestrator.updateUserSettings({ timelineVirtualizationEnabled: value }),
    [orchestrator],
  )

  const handleTimelineVirtualizationOverscanChange = useCallback(
    (value: number) => orchestrator.updateUserSettings({ timelineVirtualizationOverscan: value }),
    [orchestrator],
  )

  const handleTimelineClipDetailsThresholdChange = useCallback(
    (value: number) => orchestrator.updateUserSettings({ timelineClipDetailsThreshold: value }),
    [orchestrator],
  )

  // Мемоизированное значение контекста
  const value: UserSettingsContextValue = useMemo(
    () => ({
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

      // Оптимизация Timeline
      timelineVirtualizationEnabled: settings?.timelineVirtualizationEnabled ?? true,
      timelineVirtualizationOverscan: settings?.timelineVirtualizationOverscan ?? 5,
      timelineClipDetailsThreshold: settings?.timelineClipDetailsThreshold ?? 50,

      // Методы изменения (стабильные ссылки благодаря useCallback)
      handleTabChange,
      handleLayoutChange,
      handlePlayerScreenshotsPathChange,
      handleScreenshotsPathChange,
      handleAiApiKeyChange,
      handleClaudeApiKeyChange,
      handlePlayerVolumeChange,
      toggleBrowserVisibility,
      toggleTimelineVisibility,
      toggleOptionsVisibility,
      handleGpuAccelerationChange,
      handlePreferredGpuEncoderChange,
      handleMaxConcurrentJobsChange,
      handleRenderQualityChange,
      handleBackgroundRenderingChange,
      handleRenderDelayChange,
      handleProxyEnabledChange,
      handleProxyTypeChange,
      handleProxyHostChange,
      handleProxyPortChange,
      handleProxyUsernameChange,
      handleProxyPasswordChange,
      handleAutoSaveEnabledChange,
      handleAutoSaveIntervalChange,
      handleTimelineVirtualizationEnabledChange,
      handleTimelineVirtualizationOverscanChange,
      handleTimelineClipDetailsThresholdChange,
    }),
    [
      settings,
      handleTabChange,
      handleLayoutChange,
      handlePlayerScreenshotsPathChange,
      handleScreenshotsPathChange,
      handleAiApiKeyChange,
      handleClaudeApiKeyChange,
      handlePlayerVolumeChange,
      toggleBrowserVisibility,
      toggleTimelineVisibility,
      toggleOptionsVisibility,
      handleGpuAccelerationChange,
      handlePreferredGpuEncoderChange,
      handleMaxConcurrentJobsChange,
      handleRenderQualityChange,
      handleBackgroundRenderingChange,
      handleRenderDelayChange,
      handleProxyEnabledChange,
      handleProxyTypeChange,
      handleProxyHostChange,
      handleProxyPortChange,
      handleProxyUsernameChange,
      handleProxyPasswordChange,
      handleAutoSaveEnabledChange,
      handleAutoSaveIntervalChange,
      handleTimelineVirtualizationEnabledChange,
      handleTimelineVirtualizationOverscanChange,
      handleTimelineClipDetailsThresholdChange,
    ],
  )

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
}
