import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

import { useModal } from "@/features/modals/services/modal-provider"
import { ShortcutHandler } from "../components/shortcut-handler"
import { DEFAULT_SHORTCUTS } from "../constants/default-shortcuts"
import { usePanelShortcuts } from "../hooks/use-panel-shortcuts"
import { type ShortcutContext, type ShortcutDefinition, shortcutsRegistry } from "./shortcuts-registry"
import { tauriGlobalShortcuts } from "./tauri-global-shortcuts"

interface ShortcutsContextType {
  shortcuts: ShortcutDefinition[]
  activeShortcuts: ShortcutDefinition[]
  currentContext: ShortcutContext
  isEnabled: boolean
  isGlobalEnabled: boolean
  toggleShortcuts: (enabled: boolean) => void
  toggleGlobalShortcuts: (enabled: boolean) => Promise<void>
  updateShortcutKeys: (id: string, keys: string[]) => void
  resetShortcut: (id: string) => void
  resetAllShortcuts: () => void
  setContext: (context: ShortcutContext) => void
  enterContext: (context: ShortcutContext) => void
  exitContext: () => void
  saveSettings: () => Promise<void>
  loadSettings: () => Promise<void>
  exportSettings: () => Promise<string>
  importSettings: (jsonString: string) => Promise<void>
  clearSettings: () => Promise<void>
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null)

interface ShortcutsProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер для управления клавиатурными сочетаниями
 * Централизованно регистрирует и управляет всеми shortcuts
 *
 * Примечание: Ранее зависел от UserSettingsProvider через хук usePanelShortcuts,
 * теперь использует доменный useUserSettings (через адаптер из features/user-settings)
 * и НЕ требует наличия отдельного UserSettingsProvider в иерархии.
 */
export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
  const { openModal } = useModal()
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([])
  const [activeShortcuts, setActiveShortcuts] = useState<ShortcutDefinition[]>([])
  const [currentContext, setCurrentContextState] = useState<ShortcutContext>("global")
  const [isEnabled, setIsEnabled] = useState(true)
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(false)

  // Инициализация shortcuts при первой загрузке
  useEffect(() => {
    if (shortcutsRegistry.getAll().length === 0) {
      // Добавляем обработчики для shortcuts
      const enhancedShortcuts = DEFAULT_SHORTCUTS.map((shortcut) => {
        // Добавляем действия для модальных окон
        switch (shortcut.id) {
          case "open-user-settings":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("user-settings")
              },
            }
          case "open-project-settings":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("project-settings")
              },
            }
          case "open-keyboard-shortcuts":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("keyboard-shortcuts")
              },
            }
          case "export-video":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("export")
              },
            }
          // TODO: Добавить обработчики для остальных shortcuts
          default:
            return shortcut
        }
      })

      shortcutsRegistry.registerMany(enhancedShortcuts)
    }

    // Загружаем сохраненные настройки
    const loadSavedSettings = async () => {
      try {
        const savedSettings = await shortcutsRegistry.loadSettings()
        if (savedSettings) {
          setIsGlobalEnabled(savedSettings.globalEnabled)

          // Включаем глобальные shortcuts если они были включены
          if (savedSettings.globalEnabled) {
            try {
              await tauriGlobalShortcuts.enableGlobal()
            } catch (error) {
              console.error("Failed to enable global shortcuts:", error)
              setIsGlobalEnabled(false)
            }
          }
        }
      } catch (error) {
        console.error("Failed to load shortcuts settings:", error)
      }
    }

    // Подписываемся на изменения shortcuts
    const unsubscribe = shortcutsRegistry.subscribe((updatedShortcuts) => {
      setShortcuts(updatedShortcuts)
      setActiveShortcuts(shortcutsRegistry.getActiveShortcuts())
      setCurrentContextState(shortcutsRegistry.getCurrentContext())
    })

    // Загружаем начальные shortcuts
    setShortcuts(shortcutsRegistry.getAll())
    setActiveShortcuts(shortcutsRegistry.getActiveShortcuts())
    setCurrentContextState(shortcutsRegistry.getCurrentContext())
    setIsGlobalEnabled(tauriGlobalShortcuts.isEnabled())

    // Загружаем сохраненные настройки асинхронно
    void loadSavedSettings()

    return unsubscribe
  }, [openModal])

  const toggleShortcuts = (enabled: boolean) => {
    setIsEnabled(enabled)
  }

  const toggleGlobalShortcuts = async (enabled: boolean) => {
    try {
      if (enabled) {
        await tauriGlobalShortcuts.enableGlobal()
      } else {
        await tauriGlobalShortcuts.disableGlobal()
      }
      setIsGlobalEnabled(enabled)

      // Автосохранение настроек
      await shortcutsRegistry.saveSettings(enabled)
    } catch (error) {
      console.error("Failed to toggle global shortcuts:", error)
      // Возвращаем предыдущее состояние при ошибке
      setIsGlobalEnabled(tauriGlobalShortcuts.isEnabled())
      throw error
    }
  }

  const updateShortcutKeys = (id: string, keys: string[]) => {
    shortcutsRegistry.updateKeys(id, keys)

    // Обновляем глобальные shortcuts если они включены
    if (isGlobalEnabled) {
      tauriGlobalShortcuts.updateGlobalShortcuts().catch(console.error)
    }

    // Автосохранение настроек
    shortcutsRegistry.saveSettings(isGlobalEnabled).catch(console.error)
  }

  const resetShortcut = (id: string) => {
    shortcutsRegistry.reset(id)
  }

  const resetAllShortcuts = () => {
    shortcutsRegistry.resetAll()
  }

  const setContext = (context: ShortcutContext) => {
    shortcutsRegistry.setContext(context)
  }

  const enterContext = (context: ShortcutContext) => {
    shortcutsRegistry.enterContext(context)
  }

  const exitContext = () => {
    shortcutsRegistry.exitContext()
  }

  const saveSettings = async () => {
    await shortcutsRegistry.saveSettings(isGlobalEnabled)
  }

  const loadSettings = async () => {
    const savedSettings = await shortcutsRegistry.loadSettings()
    if (savedSettings) {
      setIsGlobalEnabled(savedSettings.globalEnabled)

      // Синхронизируем глобальные shortcuts
      if (savedSettings.globalEnabled !== tauriGlobalShortcuts.isEnabled()) {
        try {
          if (savedSettings.globalEnabled) {
            await tauriGlobalShortcuts.enableGlobal()
          } else {
            await tauriGlobalShortcuts.disableGlobal()
          }
        } catch (error) {
          console.error("Failed to sync global shortcuts:", error)
        }
      }
    }
  }

  const exportSettings = async () => {
    return shortcutsRegistry.exportSettings()
  }

  const importSettings = async (jsonString: string) => {
    await shortcutsRegistry.importSettings(jsonString)
    // Перезагружаем состояние после импорта
    await loadSettings()
  }

  const clearSettings = async () => {
    await shortcutsRegistry.clearSettings()
  }

  const contextValue: ShortcutsContextType = {
    shortcuts,
    activeShortcuts,
    currentContext,
    isEnabled,
    isGlobalEnabled,
    toggleShortcuts,
    toggleGlobalShortcuts,
    updateShortcutKeys,
    resetShortcut,
    resetAllShortcuts,
    setContext,
    enterContext,
    exitContext,
    saveSettings,
    loadSettings,
    exportSettings,
    importSettings,
    clearSettings,
  }

  // Регистрируем shortcuts для панелей
  usePanelShortcuts()

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {/* Рендерим обработчики только для активных shortcuts в текущем контексте */}
      {activeShortcuts.map((shortcut) => (
        <ShortcutHandler key={shortcut.id} shortcut={shortcut} enabled={isEnabled} />
      ))}
      {children}
    </ShortcutsContext.Provider>
  )
}

/**
 * Хук для использования контекста shortcuts
 */
export function useShortcuts() {
  const context = useContext(ShortcutsContext)
  if (!context) {
    throw new Error("useShortcuts must be used within ShortcutsProvider")
  }
  return context
}
