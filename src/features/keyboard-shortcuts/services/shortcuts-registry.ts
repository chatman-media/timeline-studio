/**
 * Централизованный реестр клавиатурных сочетаний
 * Управляет регистрацией, хранением и выполнением shortcuts
 */

import type { HotkeyCallback, Options as HotkeyOptions } from "react-hotkeys-hook"
import { createLogger } from "@/lib/tauri-logger"
import { type ConflictInfo, detectConflicts, validateNewKeys } from "./shortcuts-conflicts"
import { shortcutsPersistence } from "./shortcuts-persistence"

const logger = createLogger({ module: "ShortcutsRegistry" })

// Типы контекстов приложения
export type ShortcutContext =
  | "global" // Работают везде
  | "timeline" // Только в режиме редактирования таймлайна
  | "browser" // Только в режиме браузера медиафайлов
  | "player" // Только при фокусе на плеере
  | "chat" // Только в AI чате
  | "modal" // Только в модальных окнах

export interface ShortcutDefinition {
  id: string
  name: string
  category: string
  keys: string[] // Массив возможных комбинаций
  description?: string
  action?: HotkeyCallback
  options?: HotkeyOptions
  enabled?: boolean
  context?: ShortcutContext // Контекст активации shortcut
}

export interface ShortcutCategory {
  id: string
  name: string
  order: number
}

class ShortcutsRegistry {
  private static instance: ShortcutsRegistry
  private shortcuts = new Map<string, ShortcutDefinition>()
  private categories = new Map<string, ShortcutCategory>()
  private listeners: ((shortcuts: ShortcutDefinition[]) => void)[] = []
  private currentContext: ShortcutContext = "global"
  private contextStack: ShortcutContext[] = ["global"]
  private conflicts: ConflictInfo[] = []

  private constructor() {
    this.initializeCategories()
  }

  static getInstance(): ShortcutsRegistry {
    if (!ShortcutsRegistry.instance) {
      ShortcutsRegistry.instance = new ShortcutsRegistry()
    }
    return ShortcutsRegistry.instance
  }

  private initializeCategories() {
    const defaultCategories: ShortcutCategory[] = [
      { id: "settings", name: "Настройки", order: 1 },
      { id: "file", name: "Файл", order: 2 },
      { id: "edit", name: "Редактировать", order: 3 },
      { id: "view", name: "Вид", order: 4 },
      { id: "timeline", name: "Таймлайн", order: 5 },
      { id: "playback", name: "Воспроизведение", order: 6 },
      { id: "tools", name: "Инструменты", order: 7 },
      { id: "markers", name: "Маркеры", order: 8 },
      { id: "browser", name: "Браузер", order: 9 },
      { id: "export", name: "Экспорт", order: 10 },
      { id: "other", name: "Прочее", order: 11 },
    ]

    defaultCategories.forEach((category) => {
      this.categories.set(category.id, category)
    })
  }

  /**
   * Регистрирует новое клавиатурное сочетание
   */
  register(shortcut: ShortcutDefinition): void {
    // Нормализуем keys в массив
    if (!Array.isArray(shortcut.keys)) {
      shortcut.keys = [shortcut.keys as any]
    }

    // Добавляем значение по умолчанию для enabled
    if (shortcut.enabled === undefined) {
      shortcut.enabled = true
    }

    this.shortcuts.set(shortcut.id, shortcut)
    this.updateConflicts()
    this.notifyListeners()
  }

  /**
   * Регистрирует несколько shortcuts сразу
   */
  registerMany(shortcuts: ShortcutDefinition[]): void {
    shortcuts.forEach((shortcut) => this.register(shortcut))
  }

  /**
   * Получает shortcut по ID
   */
  get(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id)
  }

  /**
   * Получает все shortcuts
   */
  getAll(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Получает shortcuts по категории
   */
  getByCategory(categoryId: string): ShortcutDefinition[] {
    return this.getAll().filter((shortcut) => shortcut.category === categoryId)
  }

  /**
   * Получает все категории
   */
  getCategories(): ShortcutCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order)
  }

  /**
   * Обновляет клавиши для shortcut
   */
  updateKeys(id: string, keys: string[]): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      // Валидируем новые клавиши
      const validation = validateNewKeys(keys, id, this.getAll())
      if (!validation.valid) {
        logger.warn("Cannot update keys - validation failed:", {
          id,
          keys,
          error: validation.error,
        })
        throw new Error(validation.error)
      }

      shortcut.keys = keys
      this.updateConflicts()
      this.notifyListeners()
    }
  }

  /**
   * Переключает enabled состояние shortcut
   */
  toggleEnabled(id: string): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.enabled = !shortcut.enabled
      this.notifyListeners()
    }
  }

  /**
   * Обновляет action для shortcut
   */
  updateAction(id: string, action?: HotkeyCallback): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.action = action
      this.notifyListeners()
    }
  }

  /**
   * Сбрасывает shortcut к значениям по умолчанию
   */
  reset(_id: string): void {
    // Здесь должна быть логика сброса к дефолтным значениям
    // Пока просто уведомляем слушателей
    this.notifyListeners()
  }

  /**
   * Сбрасывает все shortcuts к значениям по умолчанию
   */
  resetAll(): void {
    // Здесь должна быть логика сброса всех shortcuts
    this.notifyListeners()
  }

  /**
   * Подписка на изменения shortcuts
   */
  subscribe(listener: (shortcuts: ShortcutDefinition[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(): void {
    const shortcuts = this.getAll()
    this.listeners.forEach((listener) => listener(shortcuts))
  }

  /**
   * Обновляет информацию о конфликтах
   */
  private updateConflicts(): void {
    this.conflicts = detectConflicts(this.getAll())
  }

  /**
   * Получает информацию о конфликтах
   */
  getConflicts(): ConflictInfo[] {
    return this.conflicts
  }

  /**
   * Проверяет наличие конфликтов
   */
  hasAnyConflicts(): boolean {
    return this.conflicts.length > 0
  }

  /**
   * Устанавливает текущий контекст для shortcuts
   */
  setContext(context: ShortcutContext): void {
    this.currentContext = context
    this.notifyListeners()
  }

  /**
   * Получает текущий контекст
   */
  getCurrentContext(): ShortcutContext {
    return this.currentContext
  }

  /**
   * Входит в новый контекст (добавляет в стек)
   */
  enterContext(context: ShortcutContext): void {
    this.contextStack.push(context)
    this.currentContext = context
    this.notifyListeners()
  }

  /**
   * Выходит из текущего контекста (убирает из стека)
   */
  exitContext(): void {
    if (this.contextStack.length > 1) {
      this.contextStack.pop()
      this.currentContext = this.contextStack[this.contextStack.length - 1]
      this.notifyListeners()
    }
  }

  /**
   * Получает shortcuts для текущего контекста
   */
  getActiveShortcuts(): ShortcutDefinition[] {
    return this.getAll().filter((shortcut) => {
      // Если контекст не указан, считаем что это global
      const context = shortcut.context || "global"
      return context === "global" || context === this.currentContext
    })
  }

  /**
   * Получает shortcuts по контексту
   */
  getByContext(context: ShortcutContext): ShortcutDefinition[] {
    return this.getAll().filter((shortcut) => {
      const shortcutContext = shortcut.context || "global"
      return shortcutContext === context || shortcutContext === "global"
    })
  }

  /**
   * Сохранение настроек shortcuts
   */
  async saveSettings(globalEnabled = false): Promise<void> {
    try {
      const shortcuts = this.getAll()
      await shortcutsPersistence.saveSettings(shortcuts, globalEnabled)
    } catch (error) {
      logger.error("Failed to save shortcuts settings:", { error })
      throw error
    }
  }

  /**
   * Загрузка настроек shortcuts
   */
  async loadSettings(): Promise<{ globalEnabled: boolean } | null> {
    try {
      const settings = await shortcutsPersistence.loadSettings()
      if (!settings) return null

      // Применяем настройки к существующим shortcuts
      const currentShortcuts = this.getAll()
      const updatedShortcuts = shortcutsPersistence.applySettings(currentShortcuts, settings)

      // Обновляем реестр
      this.shortcuts.clear()
      updatedShortcuts.forEach((shortcut) => {
        this.shortcuts.set(shortcut.id, shortcut)
      })

      this.notifyListeners()

      return { globalEnabled: settings.globalEnabled }
    } catch (error) {
      logger.error("Failed to load shortcuts settings:", { error })
      return null
    }
  }

  /**
   * Экспорт настроек shortcuts
   */
  async exportSettings(): Promise<string> {
    return shortcutsPersistence.exportSettings()
  }

  /**
   * Импорт настроек shortcuts
   */
  async importSettings(jsonString: string): Promise<void> {
    await shortcutsPersistence.importSettings(jsonString)
    // Перезагружаем настройки после импорта
    await this.loadSettings()
  }

  /**
   * Очистка сохраненных настроек
   */
  async clearSettings(): Promise<void> {
    await shortcutsPersistence.clearSettings()
  }

  /**
   * Очищает все shortcuts (для тестов)
   */
  clear(): void {
    this.shortcuts.clear()
    this.currentContext = "global"
    this.contextStack = ["global"]
    this.initializeCategories()
    this.notifyListeners()
  }
}

export const shortcutsRegistry = ShortcutsRegistry.getInstance()
