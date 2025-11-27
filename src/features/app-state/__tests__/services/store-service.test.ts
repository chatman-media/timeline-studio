import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { type AppSettings, type FavoritesType, StoreService } from "../../services/store-service"

// Создаем моки для IStorageService
const createMockStorage = () => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  clear: vi.fn(),
})

// Мокаем @/core
const mockStorage = createMockStorage()
vi.mock("@/core", () => ({
  container: {
    hasStorage: vi.fn(() => true),
    getStorage: vi.fn(() => mockStorage),
  },
}))

// Импорт для доступа к контейнеру в тестах
import { container } from "@/core"

describe("StoreService", () => {
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

    // Сбрасываем моки storage
    mockStorage.get.mockReset()
    mockStorage.set.mockReset()
    mockStorage.delete.mockReset()
    mockStorage.has.mockReset()
    mockStorage.keys.mockReset()
    mockStorage.clear.mockReset()

    // Настраиваем container mock по умолчанию
    vi.mocked(container.hasStorage).mockReturnValue(true)
    vi.mocked(container.getStorage).mockReturnValue(mockStorage)
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

      expect(container.hasStorage).toHaveBeenCalled()
      expect(container.getStorage).toHaveBeenCalled()
    })

    it("должен инициализироваться только один раз", async () => {
      const service = StoreService.getInstance()

      await service.initialize()
      await service.initialize()

      // getStorage вызывается только один раз при первой инициализации
      expect(container.getStorage).toHaveBeenCalledTimes(1)
    })

    it("должен обрабатывать ошибки при инициализации", async () => {
      const service = StoreService.getInstance()

      // Делаем так, чтобы storage был недоступен
      vi.mocked(container.hasStorage).mockReturnValue(false)

      // Не должно выбрасывать исключение, а обработать ошибку gracefully
      await expect(service.initialize()).resolves.not.toThrow()

      // После ошибки storage должен быть null и isInitialized должен быть true
      // (проверяем через поведение - getSettings должен вернуть null)
      const settings = await service.getSettings()
      expect(settings).toBeNull()
    })
  })

  describe("getSettings", () => {
    it("должен возвращать настройки из хранилища", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(mockSettings)

      const settings = await service.getSettings()

      expect(settings).toEqual(mockSettings)
      expect(mockStorage.get).toHaveBeenCalledWith("app-settings")
    })

    it("должен возвращать null, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(undefined)

      const settings = await service.getSettings()

      expect(settings).toBeNull()
    })

    it("должен возвращать null при ошибке", async () => {
      const service = StoreService.getInstance()

      // Настраиваем мок storage с ошибкой при получении настроек
      mockStorage.get.mockRejectedValue(new Error("Failed to get"))

      // Должен обработать ошибку gracefully и вернуть null
      const settings = await service.getSettings()

      expect(settings).toBeNull()
      // Проверяем, что метод get был вызван (подтверждает, что попытка получения была)
      expect(mockStorage.get).toHaveBeenCalledWith("app-settings")
    })

    it("должен возвращать null, если хранилище не инициализировано и не удалось инициализировать", async () => {
      const service = StoreService.getInstance()
      vi.mocked(container.hasStorage).mockReturnValue(false)

      const settings = await service.getSettings()

      expect(settings).toBeNull()
    })
  })

  describe("saveSettings", () => {
    it("должен сохранять настройки с обновленными метаданными", async () => {
      const service = StoreService.getInstance()
      const settingsToSave = { ...mockSettings }
      const now = Date.now()
      vi.setSystemTime(now)

      await service.saveSettings(settingsToSave)

      expect(mockStorage.set).toHaveBeenCalledWith("app-settings", {
        ...settingsToSave,
        meta: {
          ...settingsToSave.meta,
          lastUpdated: now,
        },
      })

      vi.useRealTimers()
    })

    it("должен обрабатывать ошибки при сохранении", async () => {
      const service = StoreService.getInstance()

      mockStorage.set.mockRejectedValue(new Error("Failed to save"))

      // Не должно выбрасывать исключение, а обработать ошибку gracefully
      await expect(service.saveSettings(mockSettings)).resolves.not.toThrow()

      // Проверяем, что метод set был вызван (подтверждает, что попытка сохранения была)
      expect(mockStorage.set).toHaveBeenCalledWith(
        "app-settings",
        expect.objectContaining({
          ...mockSettings,
          meta: expect.objectContaining({
            lastUpdated: expect.any(Number),
          }),
        }),
      )
    })

    it("не должен сохранять, если хранилище не инициализировано", async () => {
      // Сбрасываем singleton полностью
      // @ts-expect-error - обращаемся к приватному свойству для тестов
      StoreService.instance = null

      // Storage недоступен
      vi.mocked(container.hasStorage).mockReturnValue(false)

      const service = StoreService.getInstance()

      await service.saveSettings(mockSettings)

      expect(mockStorage.set).not.toHaveBeenCalled()
    })
  })

  describe("getUserSettings", () => {
    it("должен возвращать пользовательские настройки", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(mockSettings)

      const userSettings = await service.getUserSettings()

      expect(userSettings).toEqual(mockSettings.userSettings)
    })

    it("должен возвращать null, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(undefined)

      const userSettings = await service.getUserSettings()

      expect(userSettings).toBeNull()
    })
  })

  describe("saveUserSettings", () => {
    it("должен обновлять существующие настройки", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(mockSettings)

      const newUserSettings = {
        ...mockSettings.userSettings,
        theme: "light" as const,
      }

      await service.saveUserSettings(newUserSettings)

      expect(mockStorage.set).toHaveBeenCalledWith(
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
      mockStorage.get.mockResolvedValue(undefined)

      await service.saveUserSettings(mockSettings.userSettings)

      expect(mockStorage.set).toHaveBeenCalledWith(
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
      mockStorage.get.mockResolvedValue(mockSettings)

      const recentProjects = await service.getRecentProjects()

      expect(recentProjects).toEqual(mockSettings.recentProjects)
    })

    it("должен возвращать пустой массив, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(undefined)

      const recentProjects = await service.getRecentProjects()

      expect(recentProjects).toEqual([])
    })
  })

  describe("addRecentProject", () => {
    it("должен добавлять проект в начало списка", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(mockSettings)

      await service.addRecentProject("/new-project.tls", "New Project")

      expect(mockStorage.set).toHaveBeenCalledWith(
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
      mockStorage.get.mockResolvedValue(mockSettings)

      await service.addRecentProject("/project1.tls", "Updated Project 1")

      const savedSettings = mockStorage.set.mock.calls[0][1] as AppSettings
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

      mockStorage.get.mockResolvedValue({
        ...mockSettings,
        recentProjects: manyProjects,
      })

      await service.addRecentProject("/new-project.tls", "New Project")

      const savedSettings = mockStorage.set.mock.calls[0][1] as AppSettings
      expect(savedSettings.recentProjects).toHaveLength(10)
    })

    it("не должен падать, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(undefined)

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

      mockStorage.get.mockResolvedValue({
        ...mockSettings,
        favorites: customFavorites,
      })

      const favorites = await service.getFavorites()

      expect(favorites).toEqual(customFavorites)
    })

    it("должен возвращать пустые избранные, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(undefined)

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
      mockStorage.get.mockResolvedValue(mockSettings)

      const newFavorites: FavoritesType = {
        ...mockSettings.favorites,
        effect: [{ id: "1", name: "Blur" }],
      }

      await service.saveFavorites(newFavorites)

      expect(mockStorage.set).toHaveBeenCalledWith(
        "app-settings",
        expect.objectContaining({
          favorites: newFavorites,
        }),
      )
    })

    it("не должен падать, если настройки не найдены", async () => {
      const service = StoreService.getInstance()
      mockStorage.get.mockResolvedValue(undefined)

      await expect(service.saveFavorites(mockSettings.favorites)).resolves.not.toThrow()
    })
  })
})
