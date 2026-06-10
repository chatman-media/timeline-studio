import type { BrowserTab } from "@/types/generated/tauri-bindings"

export const LAYOUTS = ["default", "options", "vertical", "chat"] as const
export const DEFAULT_LAYOUT = "default"
export const DEFAULT_USER_SETTINGS_COLOR_SCHEME_ID = "teal"
export const DEFAULT_USER_SETTINGS_QUICK_ACCESS_SCHEME_IDS = ["teal", "blue", "purple", "green"]

export type LayoutMode = (typeof LAYOUTS)[number]
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

export interface UserSettingsContextType {
  previewSizes: Record<string, unknown>
  activeTab: BrowserTab
  layoutMode: LayoutMode
  screenshotsPath: string
  playerScreenshotsPath: string
  playerVolume: number
  playerVideoSource: "browser" | "timeline"
  openAiApiKey: string
  claudeApiKey: string
  youtubeClientId: string
  youtubeClientSecret: string
  tiktokClientId: string
  tiktokClientSecret: string
  vimeoClientId: string
  vimeoClientSecret: string
  vimeoAccessToken: string
  telegramBotToken: string
  telegramChatId: string
  codecovToken: string
  tauriAnalyticsKey: string
  gpuAccelerationEnabled: boolean
  preferredGpuEncoder: string
  maxConcurrentJobs: number
  renderQuality: string
  backgroundRenderingEnabled: boolean
  renderDelay: number
  proxyEnabled: boolean
  proxyType: string
  proxyHost: string
  proxyPort: string
  proxyUsername: string
  proxyPassword: string
  apiKeysStatus: Record<string, "not_set" | "testing" | "invalid" | "valid">
  autoSaveEnabled: boolean
  autoSaveInterval: number
  timelineVirtualizationEnabled: boolean
  timelineVirtualizationOverscan: number
  timelineClipDetailsThreshold: number
  aiAnalysisEnabled: boolean
  aiAnalysisFrameRate: number
  aiContentDetectionTypes: string[]
  aiAnalysisConfidenceThreshold: number
  visionServiceEnabled: boolean
  visionObjectDetectionThreshold: number
  visionFaceDetectionThreshold: number
  visionTextRecognitionThreshold: number
  visionMaxDetectionsPerFrame: number
  montagePlannerEnabled: boolean
  montagePlannerDefaultStyle: string
  montagePlannerAnalysisDepth: string
  montagePlannerAutoSuggest: boolean
  preferredLanguage: string
  dateFormat: string
  timeFormat: string
  themeMode: UserSettingsThemeMode
  colorScheme: string
  customColorSchemes: UserSettingsColorScheme[]
  quickAccessSchemeIds: string[]
  isBrowserVisible: boolean
  isTimelineVisible: boolean
  isOptionsVisible: boolean
  isAIAssistantVisible: boolean
  isLoaded: boolean
  browserSettings?: unknown
}

export const DEFAULT_USER_SETTINGS: UserSettingsContextType = {
  previewSizes: {
    MEDIA: 250,
    TEMPLATES: 250,
    STYLE_TEMPLATES: 250,
    EFFECTS: 250,
    FILTERS: 250,
    TRANSITIONS: 250,
    SUBTITLES: 250,
    MUSIC: 250,
  },
  activeTab: "media",
  layoutMode: DEFAULT_LAYOUT,
  screenshotsPath: "",
  playerScreenshotsPath: "",
  playerVolume: 100,
  playerVideoSource: "browser",
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
  themeMode: "system",
  colorScheme: DEFAULT_USER_SETTINGS_COLOR_SCHEME_ID,
  customColorSchemes: [],
  quickAccessSchemeIds: DEFAULT_USER_SETTINGS_QUICK_ACCESS_SCHEME_IDS,
  isBrowserVisible: true,
  isTimelineVisible: true,
  isOptionsVisible: true,
  isAIAssistantVisible: false,
  isLoaded: false,
}

export interface UserSettingsSnapshot extends UserSettingsContextType {
  updateLayoutMode: (layoutMode: LayoutMode) => void
  updateActiveTab: (activeTab: BrowserTab) => void
  updateOpenAiApiKey: (openAiApiKey: string) => void
  updateClaudeApiKey: (claudeApiKey: string) => void
  updateGpuAcceleration: (gpuAccelerationEnabled: boolean) => void
  updateAutoSave: (autoSaveEnabled: boolean) => void
  updateAutoSaveInterval: (autoSaveInterval: number) => void
  updatePlayerVolume: (playerVolume: number) => void
  updatePlayerVideoSource: (playerVideoSource: "browser" | "timeline") => void
  updateScreenshotsPath: (screenshotsPath: string) => void
  updatePlayerScreenshotsPath: (playerScreenshotsPath: string) => void
  updateSettings: (updates: Partial<UserSettingsContextType>) => void
  toggleBrowserVisibility: () => void
  toggleTimelineVisibility: () => void
  toggleOptionsVisibility: () => void
  toggleAIAssistantVisibility: () => void
  hasOpenAiApiKey: boolean
  hasClaudeApiKey: boolean
  isGpuEnabled: boolean
  isAutoSaveOn: boolean
}
