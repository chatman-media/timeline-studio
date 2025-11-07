/**
 * Сервис для работы с глобальными shortcuts через Tauri API
 * Интегрируется с централизованным ShortcutsRegistry
 */

import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut"
import { createLogger } from "@/lib/tauri-logger"
import { type ShortcutDefinition, shortcutsRegistry } from "./shortcuts-registry"

const logger = createLogger({ module: "TauriGlobalShortcuts" })

export class TauriGlobalShortcuts {
  private static instance: TauriGlobalShortcuts
  private registeredShortcuts = new Set<string>()
  private isGlobalEnabled = false

  static getInstance(): TauriGlobalShortcuts {
    if (!TauriGlobalShortcuts.instance) {
      TauriGlobalShortcuts.instance = new TauriGlobalShortcuts()
    }
    return TauriGlobalShortcuts.instance
  }

  /**
   * Включить глобальные shortcuts
   */
  async enableGlobal(): Promise<void> {
    if (this.isGlobalEnabled) return

    const shortcuts = shortcutsRegistry.getAll()
    const globalShortcuts = shortcuts.filter((shortcut) => shortcut.context === "global" && shortcut.enabled !== false)

    for (const shortcut of globalShortcuts) {
      await this.registerGlobalShortcut(shortcut)
    }

    this.isGlobalEnabled = true
  }

  /**
   * Отключить глобальные shortcuts
   */
  async disableGlobal(): Promise<void> {
    if (!this.isGlobalEnabled) return

    for (const shortcutId of this.registeredShortcuts) {
      const shortcut = shortcutsRegistry.get(shortcutId)
      if (shortcut) {
        await this.unregisterGlobalShortcut(shortcut)
      }
    }

    this.isGlobalEnabled = false
  }

  /**
   * Проверить состояние глобальных shortcuts
   */
  isEnabled(): boolean {
    return this.isGlobalEnabled
  }

  /**
   * Зарегистрировать глобальный shortcut
   */
  private async registerGlobalShortcut(shortcut: ShortcutDefinition): Promise<void> {
    if (this.registeredShortcuts.has(shortcut.id)) {
      return // Уже зарегистрирован
    }

    try {
      // Берем первую комбинацию клавиш для глобальной регистрации
      const primaryKeys = shortcut.keys[0]
      if (!primaryKeys) return

      // Конвертируем macOS символы в формат Tauri
      const tauriKeys = this.convertKeysToTauriFormat(primaryKeys)

      // Проверяем, не занят ли уже этот shortcut
      const alreadyRegistered = await isRegistered(tauriKeys)
      if (alreadyRegistered) {
        logger.warn(`Global shortcut ${tauriKeys} is already registered by another application`)
        return
      }

      // Регистрируем глобальный shortcut
      await register(tauriKeys, (event) => {
        if (shortcut.action) {
          // Создаем синтетическое KeyboardEvent для совместимости
          const syntheticEvent = new KeyboardEvent("keydown", {
            key: primaryKeys,
            bubbles: false,
            cancelable: false,
          })

          shortcut.action(syntheticEvent, { hotkey: tauriKeys })
        }
      })

      this.registeredShortcuts.add(shortcut.id)
      logger.info(`Registered global shortcut: ${shortcut.name} (${tauriKeys})`)
    } catch (error) {
      logger.error(`Failed to register global shortcut ${shortcut.name}:`, { error })
    }
  }

  /**
   * Отменить регистрацию глобального shortcut
   */
  private async unregisterGlobalShortcut(shortcut: ShortcutDefinition): Promise<void> {
    if (!this.registeredShortcuts.has(shortcut.id)) {
      return // Не зарегистрирован
    }

    try {
      const primaryKeys = shortcut.keys[0]
      if (!primaryKeys) return

      const tauriKeys = this.convertKeysToTauriFormat(primaryKeys)

      await unregister(tauriKeys)
      this.registeredShortcuts.delete(shortcut.id)
      logger.info(`Unregistered global shortcut: ${shortcut.name} (${tauriKeys})`)
    } catch (error) {
      logger.error(`Failed to unregister global shortcut ${shortcut.name}:`, { error })
    }
  }

  /**
   * Конвертирует комбинации клавиш из macOS формата в формат Tauri
   */
  private convertKeysToTauriFormat(keys: string): string {
    let converted = keys

    // Заменяем macOS символы на Tauri формат
    converted = converted.replace(/⌘/g, "CommandOrControl")
    converted = converted.replace(/⌥/g, "Alt")
    converted = converted.replace(/⇧/g, "Shift")
    converted = converted.replace(/⌃/g, "Ctrl")

    // Заменяем текстовые модификаторы (case-insensitive)
    converted = converted.replace(/cmd\+/gi, "CommandOrControl+")
    converted = converted.replace(/command\+/gi, "CommandOrControl+")
    converted = converted.replace(/meta\+/gi, "CommandOrControl+")
    converted = converted.replace(/alt\+/g, "Alt+")
    converted = converted.replace(/option\+/g, "Alt+")
    converted = converted.replace(/opt\+/g, "Alt+")
    converted = converted.replace(/shift\+/g, "Shift+")
    converted = converted.replace(/ctrl\+/g, "Ctrl+")

    // Заменяем специальные клавиши
    converted = converted.replace(/Space/g, "Space")
    converted = converted.replace(/→/g, "ArrowRight")
    converted = converted.replace(/←/g, "ArrowLeft")
    converted = converted.replace(/↑/g, "ArrowUp")
    converted = converted.replace(/↓/g, "ArrowDown")
    converted = converted.replace(/Delete/g, "Delete")
    converted = converted.replace(/Home/g, "Home")
    converted = converted.replace(/End/g, "End")

    return converted
  }

  /**
   * Обновить глобальные shortcuts при изменении реестра
   */
  async updateGlobalShortcuts(): Promise<void> {
    if (!this.isGlobalEnabled) return

    // Отключаем (это установит isGlobalEnabled = false)
    await this.disableGlobal()

    // Временно сбрасываем флаг чтобы enableGlobal сработал
    this.isGlobalEnabled = false
    await this.enableGlobal()
  }

  /**
   * Получить список зарегистрированных глобальных shortcuts
   */
  getRegisteredShortcuts(): string[] {
    return Array.from(this.registeredShortcuts)
  }
}

export const tauriGlobalShortcuts = TauriGlobalShortcuts.getInstance()
