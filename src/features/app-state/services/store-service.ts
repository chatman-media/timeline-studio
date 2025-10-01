import { load, type Store } from "@tauri-apps/plugin-store"
import type { UserSettingsContextType } from "@/domains/project-management/machines/user-settings-machine"
import type { MediaFile } from "@/features/media"

/**
 * Путь к файлу хранилища пользовательских настроек
 * Используется для сохранения и загрузки настроек приложения
 */
export interface FavoritesType {
  [key: string]: any[]
  media: MediaFile[]
  music: MediaFile[]
  transition: any[]
  effect: any[]
  template: any[]
  filter: any[]
  subtitle: any[]
}

/**
 * Ключ для хранилища пользовательских настроек
 */
export const USER_SETTINGS_STORE_PATH = ".timeline-studio-settings.json"

/**
 * Интерфейс для хранилища пользовательских настроек
 */
export interface AppSettings {
  // Пользовательские настройки из UserSettingsContextType
  userSettings: UserSettingsContextType

  // Информация о последних открытых проектах
  recentProjects: {
    path: string
    name: string
    lastOpened: number
  }[]

  // Информация о текущем открытом проекте
  currentProject: {
    path: string | null
    name: string
    isDirty: boolean
    isNew: boolean
  }

  // Избранные элементы
  favorites: FavoritesType

  // Медиа файлы
  mediaFiles: {
    allFiles: MediaFile[]
    error: string | null
    isLoading: boolean
  }

  // Медиа файлы для музыки
  musicFiles: {
    allFiles: MediaFile[]
    error: string | null
    isLoading: boolean
  }

  // Метаданные хранилища
  meta: {
    lastUpdated: number
    version: string
  }
}

/**
 * Сервис для работы с хранилищем Tauri Store
 * Предоставляет методы для сохранения и загрузки настроек приложения
 */
export class StoreService {
  private static instance: StoreService
  private store: Store | null = null
  private isInitialized = false

  /**
   * Приватный конструктор для реализации паттерна Singleton
   */
  private constructor() {
    // Инициализация store будет выполнена в методе initialize
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): StoreService {
    if (!StoreService.instance) {
      StoreService.instance = new StoreService()
    }
    return StoreService.instance
  }

  /**
   * Инициализация хранилища
   * Загружает данные из файла хранилища
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Используем метод load вместо конструктора Store
      this.store = await load(USER_SETTINGS_STORE_PATH, { autoSave: true })
      this.isInitialized = true
      console.log("[StoreService] Store initialized successfully")

      // Проверяем, что хранилище действительно работает
      const testRead = await this.store.get<any>("app-settings")
      if (testRead !== undefined) {
        console.log("[StoreService] Store is working correctly, found existing settings")
      } else {
        console.log("[StoreService] Store is empty, will use default settings")
      }
    } catch (error) {
      console.error("[StoreService] Error initializing store:", error)
      // Попытаемся создать новое хранилище
      try {
        this.store = await load(USER_SETTINGS_STORE_PATH, { autoSave: true })
        if (this.store) {
          await this.store.save()
        }
        this.isInitialized = true
        console.log("[StoreService] Created new store after initialization error")
      } catch (createError) {
        console.error("[StoreService] Failed to create new store:", createError)
        this.store = null
        this.isInitialized = true
      }
    }
  }

  /**
   * Получить все настройки приложения
   */
  public async getSettings(): Promise<AppSettings | null> {
    await this.ensureInitialized()

    try {
      if (!this.store) return null

      // Используем синхронный метод get
      const settings = await this.store.get<AppSettings>("app-settings")
      return settings ?? null
    } catch (error) {
      console.error("[StoreService] Error getting settings:", error)
      return null
    }
  }

  /**
   * Сохранить настройки приложения
   */
  public async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureInitialized()

    try {
      if (!this.store) return

      // Обновляем метаданные
      const updatedSettings = {
        ...settings,
        meta: {
          ...settings.meta,
          lastUpdated: Date.now(),
        },
      }

      // Сохраняем настройки
      await this.store.set("app-settings", updatedSettings)

      // Явно сохраняем изменения на диск
      await this.store.save()

      // Убираем лог для уменьшения шума в консоли
      // console.log("[StoreService] Settings saved successfully")
    } catch (error) {
      console.error("[StoreService] Error saving settings:", error)
    }
  }

  /**
   * Получить пользовательские настройки
   */
  public async getUserSettings(): Promise<UserSettingsContextType | null> {
    const settings = await this.getSettings()
    return settings?.userSettings ?? null
  }

  /**
   * Сохранить пользовательские настройки
   */
  public async saveUserSettings(userSettings: UserSettingsContextType): Promise<void> {
    const settings = await this.getSettings()

    if (settings) {
      // Обновляем существующие настройки
      await this.saveSettings({
        ...settings,
        userSettings,
      })
    } else {
      // Создаем новые настройки с дефолтным проектом
      await this.saveSettings({
        userSettings,
        recentProjects: [],
        currentProject: {
          path: null,
          name: "Новый проект",
          isDirty: false,
          isNew: true,
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
        favorites: {
          media: [],
          music: [],
          transition: [],
          effect: [],
          template: [],
          filter: [],
          subtitle: [],
        },
        meta: {
          lastUpdated: Date.now(),
          version: "1.0.0",
        },
      })
    }
  }

  /**
   * Получить список последних открытых проектов
   */
  public async getRecentProjects(): Promise<AppSettings["recentProjects"]> {
    const settings = await this.getSettings()
    return settings?.recentProjects ?? []
  }

  /**
   * Добавить проект в список последних открытых
   */
  public async addRecentProject(path: string, name: string): Promise<void> {
    const settings = await this.getSettings()

    if (settings) {
      // Фильтруем список, чтобы удалить проект с таким же путем, если он уже есть
      const filteredProjects = settings.recentProjects.filter((p) => p.path !== path)

      // Добавляем проект в начало списка
      const updatedProjects = [{ path, name, lastOpened: Date.now() }, ...filteredProjects].slice(0, 10) // Ограничиваем список 10 последними проектами

      // Сохраняем обновленный список
      await this.saveSettings({
        ...settings,
        recentProjects: updatedProjects,
      })
    }
  }

  /**
   * Получить избранные элементы
   */
  public async getFavorites(): Promise<FavoritesType> {
    const settings = await this.getSettings()
    return (
      settings?.favorites ?? {
        media: [],
        music: [],
        transition: [],
        effect: [],
        template: [],
        filter: [],
        subtitle: [],
      }
    )
  }

  /**
   * Сохранить избранные элементы
   */
  public async saveFavorites(favorites: FavoritesType): Promise<void> {
    const settings = await this.getSettings()

    if (settings) {
      await this.saveSettings({
        ...settings,
        favorites,
      })
    }
  }

  /**
   * Проверяет, что хранилище инициализировано
   * Если нет, то инициализирует его
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

// Экспортируем экземпляр сервиса
export const storeService = StoreService.getInstance()
