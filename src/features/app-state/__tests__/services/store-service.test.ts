import { load, Store } from "@tauri-apps/plugin-store"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  type AppSettings,
  type FavoritesType,
  StoreService,
  USER_SETTINGS_STORE_PATH,
} from "../../services/store-service"

// После vi.mock импортируем типы

// Мокаем Tauri Store
vi.mock("@tauri-apps/plugin-store", () => {
  return {
    load: vi.fn(),
    Store: vi.fn(),
  }
})

// Создаем моки для Store
const createMockStore = () => ({
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  reset: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  entries: vi.fn(),
  length: vi.fn(),
  load: vi.fn(),
  onKeyChange: vi.fn(),
  close: vi.fn(),
})

describe("StoreService", () => {
  let mockStore: ReturnType<typeof createMockStore>

  const mockSettings: AppSettings = {
    userSettings: {
      previewSizes: {
        MEDIA: 200,
        TRANSITIONS: 200,
        TEMPLATES: 200,
        EFFECTS: 200,
        FILTERS: 200,
        SUBTITLES: 200,
        STYLE_TEMPLATES: 200,
        MUSIC: 125,
      },
      activeTab: "media",
      layoutMode: "default",
      screenshotsPath: "",
      playerScreenshotsPath: "",
      playerVolume: 80,
      openAiApiKey: "test-key",
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
      renderDelay: 0,
      proxyEnabled: false,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      apiKeysStatus: {},
      autoSaveEnabled: true,
      autoSaveInterval: 60,
      timelineVirtualizationEnabled: true,
      timelineVirtualizationOverscan: 5,
      timelineClipDetailsThreshold: 50,
      aiAnalysisEnabled: true,
      aiAnalysisFrameRate: 5,
      aiContentDetectionTypes: ["objects", "faces"],
      aiAnalysisConfidenceThreshold: 0.5,
      visionServiceEnabled: true,
      visionObjectDetectionThreshold: 0.5,
      visionFaceDetectionThreshold: 0.5,
      visionTextRecognitionThreshold: 0.5,
      visionMaxDetectionsPerFrame: 10,
      montagePlannerEnabled: true,
      montagePlannerDefaultStyle: "dynamic",
      montagePlannerAnalysisDepth: "medium",
      montagePlannerAutoSuggest: true,
      preferredLanguage: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "24h",
      isBrowserVisible: true,
      isOptionsVisible: true,
      isTimelineVisible: true,
      isAIAssistantVisible: false,
      isLoaded: true,
    },
    recentProjects: [
      { path: "/project1.tls", name: "Project 1", lastOpened: Date.now() - 1000 },
      { path: "/project2.tls", name: "Project 2", lastOpened: Date.now() - 2000 },
    ],
    currentProject: {
      path: "/current.tls",
      name: "Current Project",
      isDirty: false,
      isNew: false,
    },
    favorites: {
      media: [],
      music: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
    },
    mediaFiles: {
      allFiles: [],
      error: null,
      isLoading: false,
    },
    musicFiles: {
      allFiles: [],
      error: null,
      isLoading: false,
    },
    meta: {
      lastUpdated: Date.now(),
      version: "1.0.0",
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Сбрасываем singleton instance
    // @ts-expect-error - обращаемся к приватному свойству для тестов
    StoreService.instance = null

    // Создаем новый экземпляр mockStore для каждого теста
    mockStore = createMockStore()

    // Настраиваем моки
    vi.mocked(load).mockResolvedValue(mockStore as unknown as Store)
    // @ts-expect-error - Store это конструктор
    vi.mocked(Store).mockImplementation(() => mockStore)
  })

  afterEach(() => {
    // Очищаем singleton после каждого теста
    // @ts-expect-error - обращаемся к приватному свойству для тестов
    StoreService.instance = null
  })

  describe("getInstance", () => {
    it("должен возвращать singleton экземпляр", () => {
      const instance1 = StoreService.getInstance()
      const instance2 = StoreService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("initialize", () => {
    it("должен успешно инициализировать хранилище", async () => {
      const service = StoreService.getInstance()

      await service.initialize()

      expect(load).toHaveBeenCalledWith(USER_SETTINGS_STORE_PATH, { autoSave: true })
    })

    it("должен инициализироваться только один раз", async () => {
      const service = StoreService.getInstance()

      await service.initialize()
      await service.initialize()

      expect(load).toHaveBeenCalledTimes(1)
    })

    it("должен обрабатывать ошибки при инициализации", async () => {
      const service = StoreService.getInstance()

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      vi.mocked(load).mockRejectedValueOnce(new Error("Failed to load"))

      await service.initialize()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[StoreService] Error initializing store:",
        new Error("Failed to load"),
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe("getSettings", () => {
    it("должен возвращать настройки из хранилища", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      const settings = await service.getSettings()

      expect(settings).toEqual(mockSettings)
      expect(mockStore.get).toHaveBeenCalledWith("app-settings")
    })

    it("должен возвращать null, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      const settings = await service.getSettings()

      expect(settings).toBeNull()
    })

    it("должен возвращать null при ошибке", async () => {
      const service = StoreService.getInstance()

      // Настраиваем мок store с ошибкой при получении настроек
      mockStore.get.mockRejectedValue(new Error("Failed to get"))

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const settings = await service.getSettings()

      expect(settings).toBeNull()
      // Проверяем, что была вызвана ошибка получения настроек
      expect(consoleErrorSpy).toHaveBeenCalledWith("[StoreService] Error getting settings:", expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it("должен возвращать null, если хранилище не инициализировано и не удалось инициализировать", async () => {
      const service = StoreService.getInstance()
      vi.mocked(load).mockRejectedValue(new Error("Failed to initialize"))

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const settings = await service.getSettings()

      expect(settings).toBeNull()

      consoleErrorSpy.mockRestore()
    })
  })

  describe("saveSettings", () => {
    it("должен сохранять настройки с обновленными метаданными", async () => {
      const service = StoreService.getInstance()
      const settingsToSave = { ...mockSettings }
      const now = Date.now()
      vi.setSystemTime(now)

      await service.saveSettings(settingsToSave)

      expect(mockStore.set).toHaveBeenCalledWith("app-settings", {
        ...settingsToSave,
        meta: {
          ...settingsToSave.meta,
          lastUpdated: now,
        },
      })
      expect(mockStore.save).toHaveBeenCalled()

      vi.useRealTimers()
    })

    it("должен обрабатывать ошибки при сохранении", async () => {
      const service = StoreService.getInstance()
      mockStore.set.mockRejectedValue(new Error("Failed to save"))

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await service.saveSettings(mockSettings)

      expect(consoleErrorSpy).toHaveBeenCalledWith("[StoreService] Error saving settings:", new Error("Failed to save"))

      consoleErrorSpy.mockRestore()
    })

    it("не должен сохранять, если хранилище не инициализировано", async () => {
      // Сбрасываем singleton полностью
      // @ts-expect-error - обращаемся к приватному свойству для тестов
      StoreService.instance = null

      // Оба способа создания store должны провалиться
      vi.mocked(load).mockRejectedValue(new Error("Failed to initialize"))
      // @ts-expect-error - Store это конструктор
      vi.mocked(Store).mockImplementation(() => {
        throw new Error("Failed to create store")
      })

      const service = StoreService.getInstance()
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await service.saveSettings(mockSettings)

      expect(mockStore.set).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe("getUserSettings", () => {
    it("должен возвращать пользовательские настройки", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      const userSettings = await service.getUserSettings()

      expect(userSettings).toEqual(mockSettings.userSettings)
    })

    it("должен возвращать null, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      const userSettings = await service.getUserSettings()

      expect(userSettings).toBeNull()
    })
  })

  describe("saveUserSettings", () => {
    it("должен обновлять существующие настройки", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      const newUserSettings = {
        ...mockSettings.userSettings,
        theme: "light" as const,
      }

      await service.saveUserSettings(newUserSettings)

      expect(mockStore.set).toHaveBeenCalledWith(
        "app-settings",
        expect.objectContaining({
          ...mockSettings,
          userSettings: newUserSettings,
          meta: expect.objectContaining({
            version: "1.0.0",
            lastUpdated: expect.any(Number),
          }),
        }),
      )
    })

    it("должен создавать новые настройки, если их нет", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      await service.saveUserSettings(mockSettings.userSettings)

      expect(mockStore.set).toHaveBeenCalledWith(
        "app-settings",
        expect.objectContaining({
          userSettings: mockSettings.userSettings,
          recentProjects: [],
          currentProject: {
            path: null,
            name: "Новый проект",
            isDirty: false,
            isNew: true,
          },
        }),
      )
    })
  })

  describe("getRecentProjects", () => {
    it("должен возвращать список недавних проектов", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      const recentProjects = await service.getRecentProjects()

      expect(recentProjects).toEqual(mockSettings.recentProjects)
    })

    it("должен возвращать пустой массив, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      const recentProjects = await service.getRecentProjects()

      expect(recentProjects).toEqual([])
    })
  })

  describe("addRecentProject", () => {
    it("должен добавлять проект в начало списка", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      await service.addRecentProject("/new-project.tls", "New Project")

      expect(mockStore.set).toHaveBeenCalledWith(
        "app-settings",
        expect.objectContaining({
          recentProjects: expect.arrayContaining([
            expect.objectContaining({
              path: "/new-project.tls",
              name: "New Project",
            }),
          ]),
        }),
      )
    })

    it("должен удалять дубликаты из списка", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      await service.addRecentProject("/project1.tls", "Updated Project 1")

      const savedSettings = mockStore.set.mock.calls[0][1] as AppSettings
      const projectPaths = savedSettings.recentProjects.map((p) => p.path)
      const uniquePaths = new Set(projectPaths)

      expect(uniquePaths.size).toBe(projectPaths.length)
    })

    it("должен ограничивать список 10 проектами", async () => {
      const service = StoreService.getInstance()
      const manyProjects = Array.from({ length: 15 }, (_, i) => ({
        path: `/project${i}.tls`,
        name: `Project ${i}`,
        lastOpened: Date.now() - i * 1000,
      }))

      mockStore.get.mockResolvedValue({
        ...mockSettings,
        recentProjects: manyProjects,
      })

      await service.addRecentProject("/new-project.tls", "New Project")

      const savedSettings = mockStore.set.mock.calls[0][1] as AppSettings
      expect(savedSettings.recentProjects).toHaveLength(10)
    })

    it("не должен падать, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      await expect(service.addRecentProject("/new-project.tls", "New Project")).resolves.not.toThrow()
    })
  })

  describe("getFavorites", () => {
    it("должен возвращать избранные элементы", async () => {
      const service = StoreService.getInstance()
      const customFavorites: FavoritesType = {
        ...mockSettings.favorites,
        effect: [{ id: "1", name: "Blur" }],
        filter: [{ id: "2", name: "Sepia" }],
      }

      mockStore.get.mockResolvedValue({
        ...mockSettings,
        favorites: customFavorites,
      })

      const favorites = await service.getFavorites()

      expect(favorites).toEqual(customFavorites)
    })

    it("должен возвращать пустые избранные, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      const favorites = await service.getFavorites()

      expect(favorites).toEqual({
        media: [],
        music: [],
        transition: [],
        effect: [],
        template: [],
        filter: [],
        subtitle: [],
      })
    })
  })

  describe("saveFavorites", () => {
    it("должен сохранять избранные элементы", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(mockSettings)

      const newFavorites: FavoritesType = {
        ...mockSettings.favorites,
        effect: [{ id: "1", name: "Blur" }],
      }

      await service.saveFavorites(newFavorites)

      expect(mockStore.set).toHaveBeenCalledWith(
        "app-settings",
        expect.objectContaining({
          favorites: newFavorites,
        }),
      )
    })

    it("не должен падать, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStore.get.mockResolvedValue(undefined)

      await expect(service.saveFavorites(mockSettings.favorites)).resolves.not.toThrow()
    })
  })
})
