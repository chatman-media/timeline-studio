/**
 * User Settings Machine - Project Management Domain
 *
 * Управляет пользовательскими настройками приложения
 * Перенесено из src/features/user-settings/services/user-settings-machine.ts
 */

import { assign, createMachine } from "xstate"
import { BrowserContext, BrowserTab, DEFAULT_TAB } from "@/domains/browser/types"
import { DEFAULT_CONTENT_SIZES, type PreviewSize, type PreviewSizeKey } from "@/features/media/utils/preview-sizes"

/**
 * Допустимые значения для макета интерфейса
 * Определяют, как организованы элементы интерфейса
 */
export const LAYOUTS = ["default", "options", "vertical", "chat"] as const
export const DEFAULT_LAYOUT = "default" // Макет по умолчанию

/**
 * Типы для TypeScript, основанные на константах
 */
export type LayoutMode = (typeof LAYOUTS)[number] // Тип макета интерфейса

/**
 * Интерфейс контекста пользовательских настроек
 * Содержит все настройки, которые может изменять пользователь
 *
 * @interface UserSettingsContextType
 */
export interface UserSettingsContextType {
  previewSizes: Record<PreviewSizeKey, PreviewSize> // Размеры превью для разных типов контента
  activeTab: BrowserTab // Активный таб в браузере
  layoutMode: LayoutMode // Текущий макет интерфейса
  screenshotsPath: string // Путь для сохранения скриншотов
  playerScreenshotsPath: string // Путь для сохранения скриншотов из плеера
  playerVolume: number // Громкость плеера (0-100)

  // AI сервисы
  openAiApiKey: string // API ключ для OpenAI
  claudeApiKey: string // API ключ для Claude

  // Социальные сети OAuth
  youtubeClientId: string // YouTube OAuth Client ID
  youtubeClientSecret: string // YouTube OAuth Client Secret
  tiktokClientId: string // TikTok Client Key
  tiktokClientSecret: string // TikTok Client Secret
  vimeoClientId: string // Vimeo Client ID
  vimeoClientSecret: string // Vimeo Client Secret
  vimeoAccessToken: string // Vimeo Personal Access Token
  telegramBotToken: string // Telegram Bot Token
  telegramChatId: string // Telegram Chat ID или Channel ID

  // Дополнительные сервисы
  codecovToken: string // Codecov token для отчетов покрытия
  tauriAnalyticsKey: string // Tauri Analytics ключ

  // GPU и производительность
  gpuAccelerationEnabled: boolean // Включено ли GPU ускорение
  preferredGpuEncoder: string // Предпочитаемый GPU кодировщик (auto, nvidia, amd, intel, apple)
  maxConcurrentJobs: number // Максимальное количество параллельных задач
  renderQuality: string // Качество рендеринга (low, medium, high, ultra)
  backgroundRenderingEnabled: boolean // Включен ли фоновый рендеринг
  renderDelay: number // Задержка начала рендеринга в секундах

  // Настройки прокси
  proxyEnabled: boolean // Включен ли прокси
  proxyType: string // Тип прокси (http, https, socks5)
  proxyHost: string // Хост прокси
  proxyPort: string // Порт прокси
  proxyUsername: string // Имя пользователя для прокси
  proxyPassword: string // Пароль для прокси

  // Статусы подключений
  apiKeysStatus: Record<string, "not_set" | "testing" | "invalid" | "valid"> // Статус каждого API ключа

  // Настройки автосохранения проекта
  autoSaveEnabled: boolean // Включено ли автосохранение
  autoSaveInterval: number // Интервал автосохранения в секундах (по умолчанию 60)

  // Настройки оптимизации Timeline
  timelineVirtualizationEnabled: boolean // Включена ли виртуализация Timeline
  timelineVirtualizationOverscan: number // Количество дополнительных элементов для рендеринга (по умолчанию 5)
  timelineClipDetailsThreshold: number // Минимальная ширина клипа для показа деталей в пикселях (по умолчанию 50)

  // AI Analysis настройки
  aiAnalysisEnabled: boolean // Включен ли AI анализ контента
  aiAnalysisFrameRate: number // Частота анализа кадров (1-10 fps)
  aiContentDetectionTypes: string[] // Типы детекции: objects, faces, text, scenes
  aiAnalysisConfidenceThreshold: number // Минимальный порог уверенности (0-1)

  // Vision Service настройки
  visionServiceEnabled: boolean // Включен ли Vision сервис
  visionObjectDetectionThreshold: number // Порог детекции объектов (0-1)
  visionFaceDetectionThreshold: number // Порог детекции лиц (0-1)
  visionTextRecognitionThreshold: number // Порог распознавания текста (0-1)
  visionMaxDetectionsPerFrame: number // Макс. детекций на кадр

  // Smart Montage Planner настройки
  montagePlannerEnabled: boolean // Включен ли умный планировщик
  montagePlannerDefaultStyle: string // Стиль по умолчанию
  montagePlannerAnalysisDepth: string // basic, medium, detailed
  montagePlannerAutoSuggest: boolean // Автоматические предложения

  // Языковые настройки
  preferredLanguage: string // Язык интерфейса (en, ru, es, fr, etc.)
  dateFormat: string // Формат даты
  timeFormat: string // 12h или 24h

  isBrowserVisible: boolean // Флаг видимости браузера
  isTimelineVisible: boolean // Флаг видимости временной шкалы
  isOptionsVisible: boolean // Флаг видимости опций
  isAIAssistantVisible: boolean // Флаг видимости AI помощника
  isLoaded: boolean // Флаг загрузки настроек
  browserSettings?: BrowserContext // Настройки состояния браузера (опционально)
}

/**
 * Начальный контекст пользовательских настроек
 * Используется при первом запуске или если нет сохраненных настроек
 */
const initialContext: UserSettingsContextType = {
  // Размеры превью по умолчанию для разных типов контента
  previewSizes: DEFAULT_CONTENT_SIZES,
  activeTab: DEFAULT_TAB, // Активный таб по умолчанию
  layoutMode: DEFAULT_LAYOUT, // Макет по умолчанию
  screenshotsPath: "public/screenshots", // Путь для скриншотов по умолчанию
  playerScreenshotsPath: "public/media", // Путь для скриншотов плеера по умолчанию
  playerVolume: 100, // Громкость плеера по умолчанию (100%)

  // AI сервисы - пустые по умолчанию
  openAiApiKey: "", // Пустой API ключ OpenAI
  claudeApiKey: "", // Пустой API ключ Claude

  // Социальные сети - пустые по умолчанию
  youtubeClientId: "",
  youtubeClientSecret: "",
  tiktokClientId: "",
  tiktokClientSecret: "",
  vimeoClientId: "",
  vimeoClientSecret: "",
  vimeoAccessToken: "",
  telegramBotToken: "",
  telegramChatId: "",

  // Дополнительные сервисы - пустые по умолчанию
  codecovToken: "",
  tauriAnalyticsKey: "",

  // GPU и производительность - значения по умолчанию
  gpuAccelerationEnabled: true, // GPU ускорение включено по умолчанию
  preferredGpuEncoder: "auto", // Автоматический выбор кодировщика
  maxConcurrentJobs: 2, // 2 параллельные задачи по умолчанию
  renderQuality: "high", // Высокое качество рендеринга по умолчанию
  backgroundRenderingEnabled: true, // Фоновый рендеринг включен
  renderDelay: 5, // Задержка 5 секунд перед началом рендеринга

  // Настройки прокси - отключены по умолчанию
  proxyEnabled: false, // Прокси отключен
  proxyType: "http", // HTTP прокси по умолчанию
  proxyHost: "", // Пустой хост
  proxyPort: "", // Пустой порт
  proxyUsername: "", // Пустое имя пользователя
  proxyPassword: "", // Пустой пароль

  // Статусы всех ключей - не настроены по умолчанию
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

  // Настройки автосохранения
  autoSaveEnabled: true, // Автосохранение включено по умолчанию
  autoSaveInterval: 60, // Интервал 60 секунд по умолчанию

  // Настройки оптимизации Timeline
  timelineVirtualizationEnabled: true, // Виртуализация включена по умолчанию для производительности
  timelineVirtualizationOverscan: 5, // Рендерим 5 дополнительных элементов сверху/снизу
  timelineClipDetailsThreshold: 50, // Показываем детали клипов шире 50px

  // AI Analysis настройки по умолчанию
  aiAnalysisEnabled: false, // AI анализ отключен по умолчанию для производительности
  aiAnalysisFrameRate: 2, // Анализ 2 кадра в секунду
  aiContentDetectionTypes: ["objects", "faces", "scenes"], // Основные типы детекции
  aiAnalysisConfidenceThreshold: 0.7, // Порог уверенности 70%

  // Vision Service настройки по умолчанию
  visionServiceEnabled: false, // Vision сервис отключен по умолчанию
  visionObjectDetectionThreshold: 0.5, // Порог детекции объектов 50%
  visionFaceDetectionThreshold: 0.5, // Порог детекции лиц 50%
  visionTextRecognitionThreshold: 0.7, // Порог распознавания текста 70%
  visionMaxDetectionsPerFrame: 100, // Максимум 100 детекций на кадр

  // Smart Montage Planner настройки по умолчанию
  montagePlannerEnabled: true, // Планировщик включен по умолчанию
  montagePlannerDefaultStyle: "dynamic", // Динамичный стиль по умолчанию
  montagePlannerAnalysisDepth: "medium", // Средняя глубина анализа
  montagePlannerAutoSuggest: true, // Автопредложения включены

  // Языковые настройки по умолчанию
  preferredLanguage: "ru", // Русский язык по умолчанию (согласно CLAUDE.md)
  dateFormat: "DD.MM.YYYY", // Формат даты
  timeFormat: "24h", // 24-часовой формат времени

  isBrowserVisible: true, // Браузер виден по умолчанию
  isTimelineVisible: true, // Временная шкала видна по умолчанию
  isOptionsVisible: true, // Опции видны по умолчанию
  isAIAssistantVisible: false, // AI помощник скрыт по умолчанию
  isLoaded: false, // Флаг загрузки настроек (изначально false)
}

/**
 * Интерфейс события обновления размера превью
 * @interface UpdatePreviewSizeEvent
 */
interface UpdatePreviewSizeEvent {
  type: "UPDATE_PREVIEW_SIZE" // Тип события
  key: PreviewSizeKey // Тип контента для обновления размера
  size: PreviewSize // Новый размер превью
}

/**
 * Интерфейс события обновления активного таба
 * @interface UpdateActiveTabEvent
 */
interface UpdateActiveTabEvent {
  type: "UPDATE_ACTIVE_TAB" // Тип события
  tab: BrowserTab // Новый активный таб
}

/**
 * Интерфейс события обновления макета интерфейса
 * @interface UpdateLayoutEvent
 */
interface UpdateLayoutEvent {
  type: "UPDATE_LAYOUT" // Тип события
  layoutMode: LayoutMode // Новый макет интерфейса
}

/**
 * Интерфейс события обновления пути для скриншотов
 * @interface UpdateScreenshotsPathEvent
 */
interface UpdateScreenshotsPathEvent {
  type: "UPDATE_SCREENSHOTS_PATH" // Тип события
  path: string // Новый путь для скриншотов
}

/**
 * Интерфейс события обновления всех настроек сразу
 * Используется для массового обновления нескольких настроек
 * @interface UpdateAllSettingsEvent
 */
interface UpdateAllSettingsEvent {
  type: "UPDATE_ALL" // Тип события
  settings: Partial<UserSettingsContextType> // Частичные настройки для обновления
}

/**
 * Интерфейс события обновления пути для скриншотов плеера
 * @interface UpdatePlayerScreenshotsPathEvent
 */
interface UpdatePlayerScreenshotsPathEvent {
  type: "UPDATE_PLAYER_SCREENSHOTS_PATH" // Тип события
  path: string // Новый путь для скриншотов плеера
}

/**
 * Интерфейс события обновления API ключа OpenAI
 * @interface UpdateOpenAiApiKeyEvent
 */
interface UpdateOpenAiApiKeyEvent {
  type: "UPDATE_OPENAI_API_KEY" // Тип события
  apiKey: string // Новый API ключ
}

/**
 * Интерфейс события обновления API ключа Claude
 * @interface UpdateClaudeApiKeyEvent
 */
interface UpdateClaudeApiKeyEvent {
  type: "UPDATE_CLAUDE_API_KEY" // Тип события
  apiKey: string // Новый API ключ
}

/**
 * Интерфейс события переключения видимости браузера
 * @interface ToggleBrowserVisibilityEvent
 */
interface ToggleBrowserVisibilityEvent {
  type: "TOGGLE_BROWSER_VISIBILITY" // Тип события
}

/**
 * Интерфейс события переключения видимости временной шкалы
 * @interface ToggleTimelineVisibilityEvent
 */
interface ToggleTimelineVisibilityEvent {
  type: "TOGGLE_TIMELINE_VISIBILITY" // Тип события
}

// ToggleOptionsVisibilityEvent
/**
 * Интерфейс события переключения видимости опций
 * @interface ToggleOptionsVisibilityEvent
 */
interface ToggleOptionsVisibilityEvent {
  type: "TOGGLE_OPTIONS_VISIBILITY" // Тип события
}

/**
 * Интерфейс события обновления громкости плеера
 * @interface UpdatePlayerVolumeEvent
 */
interface UpdatePlayerVolumeEvent {
  type: "UPDATE_PLAYER_VOLUME" // Тип события
  volume: number // Новое значение громкости (0-100)
}

/**
 * Интерфейс события загрузки пользовательских настроек
 * @interface LoadUserSettingsEvent
 */
interface LoadUserSettingsEvent {
  type: "LOAD_SETTINGS" // Тип события
  settings: Partial<UserSettingsContextType> // Загруженные настройки
}

/**
 * События для управления API ключами социальных сетей
 */
interface UpdateYoutubeCredentialsEvent {
  type: "UPDATE_YOUTUBE_CREDENTIALS"
  clientId: string
  clientSecret: string
}

interface UpdateTiktokCredentialsEvent {
  type: "UPDATE_TIKTOK_CREDENTIALS"
  clientId: string
  clientSecret: string
}

interface UpdateVimeoCredentialsEvent {
  type: "UPDATE_VIMEO_CREDENTIALS"
  clientId: string
  clientSecret: string
  accessToken: string
}

interface UpdateTelegramCredentialsEvent {
  type: "UPDATE_TELEGRAM_CREDENTIALS"
  botToken: string
  chatId: string
}

interface UpdateCodecovTokenEvent {
  type: "UPDATE_CODECOV_TOKEN"
  token: string
}

interface UpdateTauriAnalyticsKeyEvent {
  type: "UPDATE_TAURI_ANALYTICS_KEY"
  key: string
}

interface UpdateApiKeyStatusEvent {
  type: "UPDATE_API_KEY_STATUS"
  service: string
  status: "not_set" | "testing" | "invalid" | "valid"
}

interface TestApiKeyEvent {
  type: "TEST_API_KEY"
  service: string
}

/**
 * GPU и производительность события
 */
interface UpdateGpuAccelerationEvent {
  type: "UPDATE_GPU_ACCELERATION"
  enabled: boolean
}

interface UpdatePreferredGpuEncoderEvent {
  type: "UPDATE_PREFERRED_GPU_ENCODER"
  encoder: string
}

interface UpdateMaxConcurrentJobsEvent {
  type: "UPDATE_MAX_CONCURRENT_JOBS"
  jobs: number
}

interface UpdateRenderQualityEvent {
  type: "UPDATE_RENDER_QUALITY"
  quality: string
}

interface UpdateBackgroundRenderingEvent {
  type: "UPDATE_BACKGROUND_RENDERING"
  enabled: boolean
}

interface UpdateRenderDelayEvent {
  type: "UPDATE_RENDER_DELAY"
  delay: number
}

/**
 * Прокси события
 */
interface UpdateProxyEnabledEvent {
  type: "UPDATE_PROXY_ENABLED"
  enabled: boolean
}

interface UpdateProxyTypeEvent {
  type: "UPDATE_PROXY_TYPE"
  proxyType: string
}

interface UpdateProxyHostEvent {
  type: "UPDATE_PROXY_HOST"
  host: string
}

interface UpdateProxyPortEvent {
  type: "UPDATE_PROXY_PORT"
  port: string
}

interface UpdateProxyUsernameEvent {
  type: "UPDATE_PROXY_USERNAME"
  username: string
}

interface UpdateProxyPasswordEvent {
  type: "UPDATE_PROXY_PASSWORD"
  password: string
}

/**
 * Интерфейс события обновления настроек автосохранения
 * @interface UpdateAutoSaveEnabledEvent
 */
interface UpdateAutoSaveEnabledEvent {
  type: "UPDATE_AUTO_SAVE_ENABLED"
  enabled: boolean
}

/**
 * Интерфейс события обновления интервала автосохранения
 * @interface UpdateAutoSaveIntervalEvent
 */
interface UpdateAutoSaveIntervalEvent {
  type: "UPDATE_AUTO_SAVE_INTERVAL"
  interval: number // Интервал в секундах
}

/**
 * AI Analysis события
 */
interface UpdateAIAnalysisEnabledEvent {
  type: "UPDATE_AI_ANALYSIS_ENABLED"
  enabled: boolean
}

interface UpdateAIAnalysisFrameRateEvent {
  type: "UPDATE_AI_ANALYSIS_FRAME_RATE"
  frameRate: number
}

interface UpdateAIContentDetectionTypesEvent {
  type: "UPDATE_AI_CONTENT_DETECTION_TYPES"
  types: string[]
}

interface UpdateAIAnalysisConfidenceThresholdEvent {
  type: "UPDATE_AI_ANALYSIS_CONFIDENCE_THRESHOLD"
  threshold: number
}

/**
 * Vision Service события
 */
interface UpdateVisionServiceEnabledEvent {
  type: "UPDATE_VISION_SERVICE_ENABLED"
  enabled: boolean
}

interface UpdateVisionThresholdEvent {
  type: "UPDATE_VISION_THRESHOLD"
  thresholdType: "object" | "face" | "text"
  value: number
}

/**
 * Языковые настройки события
 */
interface UpdatePreferredLanguageEvent {
  type: "UPDATE_PREFERRED_LANGUAGE"
  language: string
}

interface UpdateDateFormatEvent {
  type: "UPDATE_DATE_FORMAT"
  format: string
}

interface UpdateTimeFormatEvent {
  type: "UPDATE_TIME_FORMAT"
  format: string
}

/**
 * Объединенный тип всех событий пользовательских настроек
 * Используется для типизации событий машины состояний
 */
export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent
  | UpdateLayoutEvent
  | UpdateScreenshotsPathEvent
  | UpdatePlayerScreenshotsPathEvent
  | UpdateOpenAiApiKeyEvent
  | UpdateClaudeApiKeyEvent
  | ToggleBrowserVisibilityEvent
  | UpdatePlayerVolumeEvent
  | UpdateAllSettingsEvent
  | ToggleTimelineVisibilityEvent
  | ToggleOptionsVisibilityEvent
  // Новые события для API ключей
  | UpdateYoutubeCredentialsEvent
  | UpdateTiktokCredentialsEvent
  | UpdateVimeoCredentialsEvent
  | UpdateTelegramCredentialsEvent
  | UpdateCodecovTokenEvent
  | UpdateTauriAnalyticsKeyEvent
  | UpdateApiKeyStatusEvent
  | TestApiKeyEvent
  // GPU и производительность
  | UpdateGpuAccelerationEvent
  | UpdatePreferredGpuEncoderEvent
  | UpdateMaxConcurrentJobsEvent
  | UpdateRenderQualityEvent
  | UpdateBackgroundRenderingEvent
  | UpdateRenderDelayEvent
  // Прокси
  | UpdateProxyEnabledEvent
  | UpdateProxyTypeEvent
  | UpdateProxyHostEvent
  | UpdateProxyPortEvent
  | UpdateProxyUsernameEvent
  | UpdateProxyPasswordEvent
  // Автосохранение
  | UpdateAutoSaveEnabledEvent
  | UpdateAutoSaveIntervalEvent
  // AI Analysis
  | UpdateAIAnalysisEnabledEvent
  | UpdateAIAnalysisFrameRateEvent
  | UpdateAIContentDetectionTypesEvent
  | UpdateAIAnalysisConfidenceThresholdEvent
  // Vision Service
  | UpdateVisionServiceEnabledEvent
  | UpdateVisionThresholdEvent
  // Языковые настройки
  | UpdatePreferredLanguageEvent
  | UpdateDateFormatEvent
  | UpdateTimeFormatEvent

/**
 * Машина состояний для управления пользовательскими настройками
 * Обрабатывает события обновления настроек
 */
export const userSettingsMachine = createMachine(
  {
    id: "project-management-user-settings", // ID для домена управления проектами
    initial: "idle", // Начальное состояние - ожидание (без загрузки из IndexedDB)
    context: {
      ...initialContext,
      isLoaded: true, // Устанавливаем флаг загрузки в true, так как загрузка происходит в app-settings-provider
    }, // Начальный контекст с настройками по умолчанию

    // Определение состояний машины
    states: {
      /**
       * Состояние ожидания (основное состояние машины)
       * Обрабатывает события обновления настроек
       */
      idle: {
        // Действие при входе в состояние
        entry: () => {
          console.log("UserSettingsMachine entered idle state")
        },

        // Используем вложенные состояния, чтобы машина не останавливалась
        initial: "ready",
        states: {
          ready: {}, // Пустое состояние готовности
        },

        // Обработчики событий
        on: {
          // Обновление всех настроек сразу
          UPDATE_ALL: {
            actions: ["updateAllSettings"],
            // Не указываем target, чтобы это был внутренний переход
          },

          // Обновление размера превью
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize"],
          },

          // Обновление активной вкладки
          UPDATE_ACTIVE_TAB: {
            actions: ["updateActiveTab"],
          },

          // Обновление макета интерфейса
          UPDATE_LAYOUT: {
            actions: ["updateLayout"],
          },

          // Обновление пути для скриншотов
          UPDATE_SCREENSHOTS_PATH: {
            actions: ["updateScreenshotsPath"],
          },

          // Обновление пути для скриншотов плеера
          UPDATE_PLAYER_SCREENSHOTS_PATH: {
            actions: ["updatePlayerScreenshotsPath"],
          },

          // Обновление API ключа OpenAI
          UPDATE_OPENAI_API_KEY: {
            actions: ["updateOpenAiApiKey"],
          },

          // Обновление API ключа Claude
          UPDATE_CLAUDE_API_KEY: {
            actions: ["updateClaudeApiKey"],
          },

          // Переключение видимости браузера
          TOGGLE_BROWSER_VISIBILITY: {
            actions: ["toggleBrowserVisibility"],
          },

          // Переключение видимости временной шкалы
          TOGGLE_TIMELINE_VISIBILITY: {
            actions: ["toggleTimelineVisibility"],
          },

          // Переключение видимости опций
          TOGGLE_OPTIONS_VISIBILITY: {
            actions: ["toggleOptionsVisibility"],
          },

          // Обновление громкости плеера
          UPDATE_PLAYER_VOLUME: {
            actions: ["updatePlayerVolume"],
          },

          // Новые события для API ключей
          UPDATE_YOUTUBE_CREDENTIALS: {
            actions: ["updateYoutubeCredentials"],
          },

          UPDATE_TIKTOK_CREDENTIALS: {
            actions: ["updateTiktokCredentials"],
          },

          UPDATE_VIMEO_CREDENTIALS: {
            actions: ["updateVimeoCredentials"],
          },

          UPDATE_TELEGRAM_CREDENTIALS: {
            actions: ["updateTelegramCredentials"],
          },

          UPDATE_CODECOV_TOKEN: {
            actions: ["updateCodecovToken"],
          },

          UPDATE_TAURI_ANALYTICS_KEY: {
            actions: ["updateTauriAnalyticsKey"],
          },

          UPDATE_API_KEY_STATUS: {
            actions: ["updateApiKeyStatus"],
          },

          TEST_API_KEY: {
            actions: ["testApiKey"],
          },

          // GPU и производительность события
          UPDATE_GPU_ACCELERATION: {
            actions: ["updateGpuAcceleration"],
          },

          UPDATE_PREFERRED_GPU_ENCODER: {
            actions: ["updatePreferredGpuEncoder"],
          },

          UPDATE_MAX_CONCURRENT_JOBS: {
            actions: ["updateMaxConcurrentJobs"],
          },

          UPDATE_RENDER_QUALITY: {
            actions: ["updateRenderQuality"],
          },

          UPDATE_BACKGROUND_RENDERING: {
            actions: ["updateBackgroundRendering"],
          },

          UPDATE_RENDER_DELAY: {
            actions: ["updateRenderDelay"],
          },

          // Прокси события
          UPDATE_PROXY_ENABLED: {
            actions: ["updateProxyEnabled"],
          },

          UPDATE_PROXY_TYPE: {
            actions: ["updateProxyType"],
          },

          UPDATE_PROXY_HOST: {
            actions: ["updateProxyHost"],
          },

          UPDATE_PROXY_PORT: {
            actions: ["updateProxyPort"],
          },

          UPDATE_PROXY_USERNAME: {
            actions: ["updateProxyUsername"],
          },

          UPDATE_PROXY_PASSWORD: {
            actions: ["updateProxyPassword"],
          },

          // Автосохранение события
          UPDATE_AUTO_SAVE_ENABLED: {
            actions: ["updateAutoSaveEnabled"],
          },

          UPDATE_AUTO_SAVE_INTERVAL: {
            actions: ["updateAutoSaveInterval"],
          },

          // AI Analysis события
          UPDATE_AI_ANALYSIS_ENABLED: {
            actions: ["updateAIAnalysisEnabled"],
          },

          UPDATE_AI_ANALYSIS_FRAME_RATE: {
            actions: ["updateAIAnalysisFrameRate"],
          },

          UPDATE_AI_CONTENT_DETECTION_TYPES: {
            actions: ["updateAIContentDetectionTypes"],
          },

          UPDATE_AI_ANALYSIS_CONFIDENCE_THRESHOLD: {
            actions: ["updateAIAnalysisConfidenceThreshold"],
          },

          // Vision Service события
          UPDATE_VISION_SERVICE_ENABLED: {
            actions: ["updateVisionServiceEnabled"],
          },

          UPDATE_VISION_THRESHOLD: {
            actions: ["updateVisionThreshold"],
          },

          // Языковые настройки события
          UPDATE_PREFERRED_LANGUAGE: {
            actions: ["updatePreferredLanguage"],
          },

          UPDATE_DATE_FORMAT: {
            actions: ["updateDateFormat"],
          },

          UPDATE_TIME_FORMAT: {
            actions: ["updateTimeFormat"],
          },
        },
      },
    },
  },
  {
    // Определение действий машины состояний
    actions: {
      /**
       * Действие для обновления всех настроек сразу
       * Объединяет текущий контекст с новыми настройками
       */
      updateAllSettings: assign(({ context, event }) => {
        const typedEvent = event as UpdateAllSettingsEvent
        console.log("Updating all settings:", typedEvent.settings)

        // Возвращаем обновленный контекст
        return {
          ...context, // Текущие настройки
          ...typedEvent.settings, // Новые настройки
        }
      }),

      /**
       * Действие для обновления размера превью
       * Обновляет размер превью для указанного типа контента
       */
      updatePreviewSize: assign(({ context, event }) => {
        const typedEvent = event as UpdatePreviewSizeEvent
        console.log("Updating preview size:", typedEvent.key, typedEvent.size)

        // Создаем копию объекта previewSizes
        const newPreviewSizes = {
          ...context.previewSizes,
        }
        // Обновляем размер для указанного типа контента
        newPreviewSizes[typedEvent.key] = typedEvent.size

        // Возвращаем обновленный контекст
        return {
          ...context,
          previewSizes: newPreviewSizes,
        }
      }),

      /**
       * Действие для обновления активной вкладки
       * Устанавливает новую активную вкладку в браузере
       */
      updateActiveTab: assign(({ context, event }) => {
        const typedEvent = event as UpdateActiveTabEvent
        console.log("Updating active tab:", typedEvent.tab)

        // Возвращаем обновленный контекст
        return {
          ...context,
          activeTab: typedEvent.tab, // Новая активная вкладка
        }
      }),

      /**
       * Действие для обновления макета интерфейса
       * Устанавливает новый макет интерфейса
       */
      updateLayout: assign(({ context, event }) => {
        const typedEvent = event as UpdateLayoutEvent
        console.log("Updating layout mode:", typedEvent.layoutMode)

        // Возвращаем обновленный контекст
        return {
          ...context,
          layoutMode: typedEvent.layoutMode, // Новый макет интерфейса
        }
      }),

      /**
       * Действие для обновления пути для скриншотов плеера
       * Устанавливает новый путь для сохранения скриншотов из плеера
       */
      updatePlayerScreenshotsPath: assign(({ context, event }) => {
        const typedEvent = event as UpdatePlayerScreenshotsPathEvent
        console.log("Updating player screenshots path:", typedEvent.path)

        // Возвращаем обновленный контекст
        return {
          ...context,
          playerScreenshotsPath: typedEvent.path, // Новый путь для скриншотов плеера
        }
      }),

      /**
       * Действие для обновления пути для скриншотов
       * Устанавливает новый путь для сохранения скриншотов
       */
      updateScreenshotsPath: assign(({ context, event }) => {
        const typedEvent = event as UpdateScreenshotsPathEvent
        console.log("Updating screenshots path:", typedEvent.path)

        // Возвращаем обновленный контекст
        return {
          ...context,
          screenshotsPath: typedEvent.path, // Новый путь для скриншотов
        }
      }),

      /**
       * Действие для обновления API ключа OpenAI
       * Устанавливает новый API ключ для OpenAI
       */
      updateOpenAiApiKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateOpenAiApiKeyEvent
        // Скрываем API ключ в логах для безопасности
        console.log("Updating OpenAI API key:", typedEvent.apiKey ? "***" : "(empty)")

        // Возвращаем обновленный контекст
        return {
          ...context,
          openAiApiKey: typedEvent.apiKey, // Новый API ключ OpenAI
        }
      }),

      /**
       * Действие для обновления API ключа Claude
       * Устанавливает новый API ключ для Claude
       */
      updateClaudeApiKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateClaudeApiKeyEvent
        // Скрываем API ключ в логах для безопасности
        console.log("Updating Claude API key:", typedEvent.apiKey ? "***" : "(empty)")

        // Возвращаем обновленный контекст
        return {
          ...context,
          claudeApiKey: typedEvent.apiKey, // Новый API ключ Claude
        }
      }),

      /**
       * Действие для переключения видимости браузера
       */
      toggleBrowserVisibility: assign(({ context }) => {
        console.log("Toggling browser visibility:", !context.isBrowserVisible)

        // Возвращаем обновленный контекст
        return {
          ...context,
          isBrowserVisible: !context.isBrowserVisible, // Инвертируем текущее значение
        }
      }),

      /**
       * Действие для переключения видимости временной шкалы
       */
      toggleTimelineVisibility: assign(({ context }) => {
        console.log("Toggling timeline visibility:", !context.isTimelineVisible)
        return {
          ...context,
          isTimelineVisible: !context.isTimelineVisible,
        }
      }),

      /**
       * Действие для переключения видимости опций
       */
      toggleOptionsVisibility: assign(({ context }) => {
        console.log("Toggling options visibility:", !context.isOptionsVisible)
        return {
          ...context,
          isOptionsVisible: !context.isOptionsVisible,
        }
      }),

      /**
       * Действие для обновления громкости плеера
       * Устанавливает новое значение громкости
       */
      updatePlayerVolume: assign(({ context, event }) => {
        const typedEvent = event as UpdatePlayerVolumeEvent
        console.log("Updating player volume:", typedEvent.volume)

        // Возвращаем обновленный контекст
        return {
          ...context,
          playerVolume: typedEvent.volume, // Новое значение громкости
        }
      }),

      /**
       * Действия для управления API ключами социальных сетей
       */
      updateYoutubeCredentials: assign(({ context, event }) => {
        const typedEvent = event as UpdateYoutubeCredentialsEvent
        console.log("Updating YouTube credentials")

        return {
          ...context,
          youtubeClientId: typedEvent.clientId,
          youtubeClientSecret: typedEvent.clientSecret,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            youtube: (typedEvent.clientId && typedEvent.clientSecret ? "valid" : "not_set") as
              | "not_set"
              | "testing"
              | "invalid"
              | "valid",
          },
        }
      }),

      updateTiktokCredentials: assign(({ context, event }) => {
        const typedEvent = event as UpdateTiktokCredentialsEvent
        console.log("Updating TikTok credentials")

        return {
          ...context,
          tiktokClientId: typedEvent.clientId,
          tiktokClientSecret: typedEvent.clientSecret,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            tiktok: (typedEvent.clientId && typedEvent.clientSecret ? "valid" : "not_set") as
              | "not_set"
              | "testing"
              | "invalid"
              | "valid",
          },
        }
      }),

      updateVimeoCredentials: assign(({ context, event }) => {
        const typedEvent = event as UpdateVimeoCredentialsEvent
        console.log("Updating Vimeo credentials")

        return {
          ...context,
          vimeoClientId: typedEvent.clientId,
          vimeoClientSecret: typedEvent.clientSecret,
          vimeoAccessToken: typedEvent.accessToken,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            vimeo: (typedEvent.clientId && typedEvent.clientSecret ? "valid" : "not_set") as
              | "not_set"
              | "testing"
              | "invalid"
              | "valid",
          },
        }
      }),

      updateTelegramCredentials: assign(({ context, event }) => {
        const typedEvent = event as UpdateTelegramCredentialsEvent
        console.log("Updating Telegram credentials")

        return {
          ...context,
          telegramBotToken: typedEvent.botToken,
          telegramChatId: typedEvent.chatId,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            telegram: (typedEvent.botToken ? "valid" : "not_set") as "not_set" | "testing" | "invalid" | "valid",
          },
        }
      }),

      updateCodecovToken: assign(({ context, event }) => {
        const typedEvent = event as UpdateCodecovTokenEvent
        console.log("Updating Codecov token:", typedEvent.token ? "***" : "(empty)")

        return {
          ...context,
          codecovToken: typedEvent.token,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            codecov: (typedEvent.token ? "valid" : "not_set") as "not_set" | "testing" | "invalid" | "valid",
          },
        }
      }),

      updateTauriAnalyticsKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateTauriAnalyticsKeyEvent
        console.log("Updating Tauri Analytics key:", typedEvent.key ? "***" : "(empty)")

        return {
          ...context,
          tauriAnalyticsKey: typedEvent.key,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            tauri_analytics: (typedEvent.key ? "valid" : "not_set") as "not_set" | "testing" | "invalid" | "valid",
          },
        }
      }),

      updateApiKeyStatus: assign(({ context, event }) => {
        const typedEvent = event as UpdateApiKeyStatusEvent
        console.log(`Updating API key status for ${typedEvent.service}:`, typedEvent.status)

        return {
          ...context,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            [typedEvent.service]: typedEvent.status,
          },
        }
      }),

      testApiKey: assign(({ context, event }) => {
        const typedEvent = event as TestApiKeyEvent
        console.log(`Testing API key for service: ${typedEvent.service}`)

        // Устанавливаем статус "testing" пока идет проверка
        return {
          ...context,
          apiKeysStatus: {
            ...context.apiKeysStatus,
            [typedEvent.service]: "testing" as "not_set" | "testing" | "invalid" | "valid",
          },
        }
      }),

      // GPU и производительность действия
      updateGpuAcceleration: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_GPU_ACCELERATION"; enabled: boolean }
        console.log("Updating GPU acceleration:", typedEvent.enabled)
        return { ...context, gpuAccelerationEnabled: typedEvent.enabled }
      }),

      updatePreferredGpuEncoder: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PREFERRED_GPU_ENCODER"; encoder: string }
        console.log("Updating preferred GPU encoder:", typedEvent.encoder)
        return { ...context, preferredGpuEncoder: typedEvent.encoder }
      }),

      updateMaxConcurrentJobs: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_MAX_CONCURRENT_JOBS"; jobs: number }
        console.log("Updating max concurrent jobs:", typedEvent.jobs)
        return { ...context, maxConcurrentJobs: typedEvent.jobs }
      }),

      updateRenderQuality: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_RENDER_QUALITY"; quality: string }
        console.log("Updating render quality:", typedEvent.quality)
        return { ...context, renderQuality: typedEvent.quality }
      }),

      updateBackgroundRendering: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_BACKGROUND_RENDERING"; enabled: boolean }
        console.log("Updating background rendering:", typedEvent.enabled)
        return { ...context, backgroundRenderingEnabled: typedEvent.enabled }
      }),

      updateRenderDelay: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_RENDER_DELAY"; delay: number }
        console.log("Updating render delay:", typedEvent.delay)
        return { ...context, renderDelay: typedEvent.delay }
      }),

      // Прокси действия
      updateProxyEnabled: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PROXY_ENABLED"; enabled: boolean }
        console.log("Updating proxy enabled:", typedEvent.enabled)
        return { ...context, proxyEnabled: typedEvent.enabled }
      }),

      updateProxyType: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PROXY_TYPE"; proxyType: string }
        console.log("Updating proxy type:", typedEvent.proxyType)
        return { ...context, proxyType: typedEvent.proxyType }
      }),

      updateProxyHost: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PROXY_HOST"; host: string }
        console.log("Updating proxy host:", typedEvent.host)
        return { ...context, proxyHost: typedEvent.host }
      }),

      updateProxyPort: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PROXY_PORT"; port: string }
        console.log("Updating proxy port:", typedEvent.port)
        return { ...context, proxyPort: typedEvent.port }
      }),

      updateProxyUsername: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PROXY_USERNAME"; username: string }
        console.log("Updating proxy username:", typedEvent.username)
        return { ...context, proxyUsername: typedEvent.username }
      }),

      updateProxyPassword: assign(({ context, event }) => {
        const typedEvent = event as { type: "UPDATE_PROXY_PASSWORD"; password: string }
        console.log("Updating proxy password:", "***")
        return { ...context, proxyPassword: typedEvent.password }
      }),

      /**
       * Действие для обновления статуса автосохранения
       * Включает или отключает автоматическое сохранение проекта
       */
      updateAutoSaveEnabled: assign(({ context, event }) => {
        const typedEvent = event as UpdateAutoSaveEnabledEvent
        console.log("Updating auto save enabled:", typedEvent.enabled)
        return {
          ...context,
          autoSaveEnabled: typedEvent.enabled,
        }
      }),

      /**
       * Действие для обновления интервала автосохранения
       * Устанавливает интервал между автоматическими сохранениями в секундах
       */
      updateAutoSaveInterval: assign(({ context, event }) => {
        const typedEvent = event as UpdateAutoSaveIntervalEvent
        console.log("Updating auto save interval:", typedEvent.interval)
        return {
          ...context,
          autoSaveInterval: typedEvent.interval,
        }
      }),

      // AI Analysis действия
      updateAIAnalysisEnabled: assign(({ context, event }) => {
        const typedEvent = event as UpdateAIAnalysisEnabledEvent
        console.log("Updating AI analysis enabled:", typedEvent.enabled)
        return { ...context, aiAnalysisEnabled: typedEvent.enabled }
      }),

      updateAIAnalysisFrameRate: assign(({ context, event }) => {
        const typedEvent = event as UpdateAIAnalysisFrameRateEvent
        console.log("Updating AI analysis frame rate:", typedEvent.frameRate)
        return { ...context, aiAnalysisFrameRate: typedEvent.frameRate }
      }),

      updateAIContentDetectionTypes: assign(({ context, event }) => {
        const typedEvent = event as UpdateAIContentDetectionTypesEvent
        console.log("Updating AI content detection types:", typedEvent.types)
        return { ...context, aiContentDetectionTypes: typedEvent.types }
      }),

      updateAIAnalysisConfidenceThreshold: assign(({ context, event }) => {
        const typedEvent = event as UpdateAIAnalysisConfidenceThresholdEvent
        console.log("Updating AI analysis confidence threshold:", typedEvent.threshold)
        return { ...context, aiAnalysisConfidenceThreshold: typedEvent.threshold }
      }),

      // Vision Service действия
      updateVisionServiceEnabled: assign(({ context, event }) => {
        const typedEvent = event as UpdateVisionServiceEnabledEvent
        console.log("Updating vision service enabled:", typedEvent.enabled)
        return { ...context, visionServiceEnabled: typedEvent.enabled }
      }),

      updateVisionThreshold: assign(({ context, event }) => {
        const typedEvent = event as UpdateVisionThresholdEvent
        console.log(`Updating vision ${typedEvent.thresholdType} threshold:`, typedEvent.value)

        switch (typedEvent.thresholdType) {
          case "object":
            return { ...context, visionObjectDetectionThreshold: typedEvent.value }
          case "face":
            return { ...context, visionFaceDetectionThreshold: typedEvent.value }
          case "text":
            return { ...context, visionTextRecognitionThreshold: typedEvent.value }
          default:
            return context
        }
      }),

      // Языковые настройки действия
      updatePreferredLanguage: assign(({ context, event }) => {
        const typedEvent = event as UpdatePreferredLanguageEvent
        console.log("Updating preferred language:", typedEvent.language)
        return { ...context, preferredLanguage: typedEvent.language }
      }),

      updateDateFormat: assign(({ context, event }) => {
        const typedEvent = event as UpdateDateFormatEvent
        console.log("Updating date format:", typedEvent.format)
        return { ...context, dateFormat: typedEvent.format }
      }),

      updateTimeFormat: assign(({ context, event }) => {
        const typedEvent = event as UpdateTimeFormatEvent
        console.log("Updating time format:", typedEvent.format)
        return { ...context, timeFormat: typedEvent.format }
      }),
    },
  },
)
