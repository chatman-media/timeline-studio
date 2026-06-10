import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { getUserSettingsService } from "@timeline-studio/core/services"
import type { BrowserTab } from "@timeline-studio/core/types"
import type { LayoutMode, UserSettingsContextType } from "@timeline-studio/core/types/user-settings"

export type UserSettingsThemeMode = "light" | "dark" | "system"

export type UserSettingsColorSchemeVars = {
  teal: string
  "teal-light": string
  "teal-dark": string
}

export interface UserSettingsColorScheme {
  id: string
  name: string
  isBuiltin?: boolean
  light: UserSettingsColorSchemeVars
  dark: UserSettingsColorSchemeVars
}

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
  isLoaded: boolean // Флаг загрузки настроек

  // Внешний вид
  themeMode: UserSettingsThemeMode
  colorScheme: string
  customColorSchemes: UserSettingsColorScheme[]
  quickAccessSchemeIds: string[]

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
  updateSettings: (updates: Record<string, unknown>) => void // Пакетное обновление настроек

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
  const [settingsService] = useState(() => getUserSettingsService())
  const [settings, setSettings] = useState(() => settingsService.getUserSettings())

  // Применяем начальные настройки при монтировании, если переданы
  useEffect(() => {
    if (initialSettings) {
      settingsService.updateUserSettings(initialSettings)
    }
  }, [settingsService, initialSettings])

  useEffect(() => {
    const sub = settingsService.subscribeToUserSettings((s) => setSettings(s))
    return () => sub.unsubscribe()
  }, [settingsService])

  // Мемоизированные методы изменения настроек
  const handleTabChange = useCallback(
    (value: string) => {
      if (["media", "music", "transitions", "effects", "filters", "templates"].includes(value)) {
        settingsService.updateUserSettings({ activeTab: value as BrowserTab })
      }
    },
    [settingsService],
  )

  const handleLayoutChange = useCallback(
    (value: LayoutMode) => settingsService.updateUserSettings({ layoutMode: value }),
    [settingsService],
  )

  const handlePlayerScreenshotsPathChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ playerScreenshotsPath: value }),
    [settingsService],
  )

  const handleScreenshotsPathChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ screenshotsPath: value }),
    [settingsService],
  )

  const handleAiApiKeyChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ openAiApiKey: value }),
    [settingsService],
  )

  const handleClaudeApiKeyChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ claudeApiKey: value }),
    [settingsService],
  )

  const handlePlayerVolumeChange = useCallback(
    (value: number) => settingsService.updateUserSettings({ playerVolume: value }),
    [settingsService],
  )

  const toggleBrowserVisibility = useCallback(
    () =>
      settingsService.updateUserSettings({
        isBrowserVisible: !settings.isBrowserVisible,
      }),
    [settingsService, settings.isBrowserVisible],
  )

  const toggleTimelineVisibility = useCallback(
    () =>
      settingsService.updateUserSettings({
        isTimelineVisible: !settings.isTimelineVisible,
      }),
    [settingsService, settings.isTimelineVisible],
  )

  const toggleOptionsVisibility = useCallback(
    () =>
      settingsService.updateUserSettings({
        isOptionsVisible: !settings.isOptionsVisible,
      }),
    [settingsService, settings.isOptionsVisible],
  )

  // GPU и производительность
  const handleGpuAccelerationChange = useCallback(
    (value: boolean) => settingsService.updateUserSettings({ gpuAccelerationEnabled: value }),
    [settingsService],
  )

  const handlePreferredGpuEncoderChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ preferredGpuEncoder: value }),
    [settingsService],
  )

  const handleMaxConcurrentJobsChange = useCallback(
    (value: number) => settingsService.updateUserSettings({ maxConcurrentJobs: value }),
    [settingsService],
  )

  const handleRenderQualityChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ renderQuality: value }),
    [settingsService],
  )

  const handleBackgroundRenderingChange = useCallback(
    (value: boolean) => settingsService.updateUserSettings({ backgroundRenderingEnabled: value }),
    [settingsService],
  )

  const handleRenderDelayChange = useCallback(
    (value: number) => settingsService.updateUserSettings({ renderDelay: value }),
    [settingsService],
  )

  // Прокси
  const handleProxyEnabledChange = useCallback(
    (value: boolean) => settingsService.updateUserSettings({ proxyEnabled: value }),
    [settingsService],
  )

  const handleProxyTypeChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ proxyType: value }),
    [settingsService],
  )

  const handleProxyHostChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ proxyHost: value }),
    [settingsService],
  )

  const handleProxyPortChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ proxyPort: value }),
    [settingsService],
  )

  const handleProxyUsernameChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ proxyUsername: value }),
    [settingsService],
  )

  const handleProxyPasswordChange = useCallback(
    (value: string) => settingsService.updateUserSettings({ proxyPassword: value }),
    [settingsService],
  )

  // Автосохранение
  const handleAutoSaveEnabledChange = useCallback(
    (value: boolean) => settingsService.updateUserSettings({ autoSaveEnabled: value }),
    [settingsService],
  )

  const handleAutoSaveIntervalChange = useCallback(
    (value: number) => settingsService.updateUserSettings({ autoSaveInterval: value }),
    [settingsService],
  )

  // Оптимизация Timeline
  const handleTimelineVirtualizationEnabledChange = useCallback(
    (value: boolean) => settingsService.updateUserSettings({ timelineVirtualizationEnabled: value }),
    [settingsService],
  )

  const handleTimelineVirtualizationOverscanChange = useCallback(
    (value: number) =>
      settingsService.updateUserSettings({
        timelineVirtualizationOverscan: value,
      }),
    [settingsService],
  )

  const handleTimelineClipDetailsThresholdChange = useCallback(
    (value: number) => settingsService.updateUserSettings({ timelineClipDetailsThreshold: value }),
    [settingsService],
  )

  const updateSettings = useCallback(
    (updates: Record<string, unknown>) =>
      settingsService.updateUserSettings(updates as Partial<UserSettingsContextType>),
    [settingsService],
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
      isLoaded: settings?.isLoaded ?? false,

      // Внешний вид
      themeMode: settings?.themeMode ?? "system",
      colorScheme: settings?.colorScheme ?? "teal",
      customColorSchemes: settings?.customColorSchemes ?? [],
      quickAccessSchemeIds: settings?.quickAccessSchemeIds ?? [],

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
      updateSettings,
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
      updateSettings,
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

  return (
    <UserSettingsContext.Provider value={value} data-oid="j_7xub3">
      {children}
    </UserSettingsContext.Provider>
  )
}
