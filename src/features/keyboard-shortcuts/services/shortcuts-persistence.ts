/**
 * Сервис для сохранения и загрузки настроек shortcuts
 * Поддерживает localStorage и Tauri Store API
 */

import { isDesktop } from "@/lib/environment"
import { createLogger } from "@/lib/tauri-logger"
import type { ShortcutDefinition } from "./shortcuts-registry"

const logger = createLogger({ module: "ShortcutsPersistence" })

const STORAGE_KEY = "timeline-studio-shortcuts"
const GLOBAL_SHORTCUTS_KEY = "timeline-studio-global-shortcuts-enabled"

export interface ShortcutSettings {
  shortcuts: Record<string, Partial<ShortcutDefinition>>
  globalEnabled: boolean
  version: string
  activePreset?: string // Название активной предустановки
}

export class ShortcutsPersistence {
  private static instance: ShortcutsPersistence
  private currentVersion = "1.0.0"

  static getInstance(): ShortcutsPersistence {
    if (!ShortcutsPersistence.instance) {
      ShortcutsPersistence.instance = new ShortcutsPersistence()
    }
    return ShortcutsPersistence.instance
  }

  /**
   * Сохранить настройки shortcuts
   */
  async saveSettings(shortcuts: ShortcutDefinition[], globalEnabled: boolean, activePreset?: string): Promise<void> {
    const settings: ShortcutSettings = {
      shortcuts: this.serializeShortcuts(shortcuts),
      globalEnabled,
      version: this.currentVersion,
      activePreset,
    }

    try {
      // Попробуем использовать Tauri Store если доступен
      if (isDesktop()) {
        const { Store } = await import("@tauri-apps/plugin-store")
        const store = await Store.load("shortcuts.json")
        await store.set(STORAGE_KEY, settings)
        await store.save()
      } else {
        // Fallback на localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      }

      logger.info("Shortcuts settings saved successfully")
    } catch (error) {
      logger.error("Failed to save shortcuts settings:", { error })

      // Fallback на localStorage в случае ошибки
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (localStorageError) {
        logger.error("Failed to save to localStorage:", { error: localStorageError })
        throw error
      }
    }
  }

  /**
   * Загрузить настройки shortcuts
   */
  async loadSettings(): Promise<ShortcutSettings | null> {
    try {
      let settings: ShortcutSettings | null = null

      // Попробуем использовать Tauri Store если доступен
      if (isDesktop()) {
        const { Store } = await import("@tauri-apps/plugin-store")
        const store = await Store.load("shortcuts.json")
        const result = await store.get<ShortcutSettings>(STORAGE_KEY)
        settings = result === undefined ? null : result
      }

      // Fallback на localStorage
      if (!settings) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          settings = JSON.parse(stored)
        }
      }

      // Проверяем версию настроек
      if (settings && settings.version !== this.currentVersion) {
        logger.info(`Migrating shortcuts settings from ${settings.version} to ${this.currentVersion}`)
        settings = this.migrateSettings(settings)
      }

      return settings
    } catch (error) {
      logger.error("Failed to load shortcuts settings:", { error })
      return null
    }
  }

  /**
   * Применить сохраненные настройки к shortcuts
   */
  applySettings(shortcuts: ShortcutDefinition[], settings: ShortcutSettings): ShortcutDefinition[] {
    return shortcuts.map((shortcut) => {
      const savedShortcut = settings.shortcuts[shortcut.id]
      if (!savedShortcut) return shortcut

      return {
        ...shortcut,
        keys: savedShortcut.keys || shortcut.keys,
        enabled: savedShortcut.enabled !== undefined ? savedShortcut.enabled : shortcut.enabled,
      }
    })
  }

  /**
   * Очистить сохраненные настройки
   */
  async clearSettings(): Promise<void> {
    try {
      if (isDesktop()) {
        const { Store } = await import("@tauri-apps/plugin-store")
        const store = await Store.load("shortcuts.json")
        await store.delete(STORAGE_KEY)
        await store.save()
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }

      logger.info("Shortcuts settings cleared")
    } catch (error) {
      logger.error("Failed to clear shortcuts settings:", { error })
      throw error
    }
  }

  /**
   * Экспортировать настройки в JSON
   */
  async exportSettings(): Promise<string> {
    const settings = await this.loadSettings()
    if (!settings) {
      throw new Error("No settings to export")
    }

    return JSON.stringify(settings, null, 2)
  }

  /**
   * Импортировать настройки из JSON
   */
  async importSettings(jsonString: string): Promise<void> {
    try {
      const settings: ShortcutSettings = JSON.parse(jsonString)

      // Валидация структуры
      if (!settings.shortcuts || !settings.version) {
        throw new Error("Invalid settings format")
      }

      // Мигрируем при необходимости
      const migratedSettings = settings.version !== this.currentVersion ? this.migrateSettings(settings) : settings

      // Сохраняем
      if (isDesktop()) {
        const { Store } = await import("@tauri-apps/plugin-store")
        const store = await Store.load("shortcuts.json")
        await store.set(STORAGE_KEY, migratedSettings)
        await store.save()
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedSettings))
      }

      logger.info("Settings imported successfully")
    } catch (error) {
      logger.error("Failed to import settings:", { error })
      throw error
    }
  }

  /**
   * Сериализует shortcuts для сохранения
   */
  private serializeShortcuts(shortcuts: ShortcutDefinition[]): Record<string, Partial<ShortcutDefinition>> {
    const serialized: Record<string, Partial<ShortcutDefinition>> = {}

    shortcuts.forEach((shortcut) => {
      // Сохраняем только измененные поля
      serialized[shortcut.id] = {
        keys: shortcut.keys,
        enabled: shortcut.enabled,
      }
    })

    return serialized
  }

  /**
   * Миграция настроек между версиями
   */
  private migrateSettings(settings: ShortcutSettings): ShortcutSettings {
    // Здесь можно добавить логику миграции для разных версий
    return {
      ...settings,
      version: this.currentVersion,
    }
  }
}

export const shortcutsPersistence = ShortcutsPersistence.getInstance()
