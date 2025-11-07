import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { useModal } from "@/features/modals/services/modal-provider"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import { ShortcutHandler } from "../components/shortcut-handler"
import { DEFAULT_SHORTCUTS } from "../constants/default-shortcuts"
import { usePanelShortcuts } from "../hooks/use-panel-shortcuts"
import { type ShortcutContext, type ShortcutDefinition, shortcutsRegistry } from "./shortcuts-registry"
import { tauriGlobalShortcuts } from "./tauri-global-shortcuts"

const logger = createLogger({ module: "ShortcutsProvider" })

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
  // BackendSync методы
  syncShortcuts: () => Promise<void>
  isBackendConnected: boolean
  shortcutUsageStats: {
    [shortcutId: string]: number
  }
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null)

interface ShortcutsProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер для управления клавиатурными сочетаниями с интеграцией BackendSync
 *
 * Добавлено:
 * - Синхронизация пользовательских shortcuts с backend
 * - Статистика использования shortcuts
 * - Синхронизация между окнами/устройствами
 */
export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
  const { openModal } = useModal()
  const backendSync = getBackendSync()
  const [isBackendConnected, setIsBackendConnected] = useState(backendSync.connected)
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([])
  const [activeShortcuts, setActiveShortcuts] = useState<ShortcutDefinition[]>([])
  const [currentContext, setCurrentContextState] = useState<ShortcutContext>("global")
  const [isEnabled, setIsEnabled] = useState(true)
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(false)
  const [shortcutUsageStats, setShortcutUsageStats] = useState<{ [shortcutId: string]: number }>({})

  // Синхронизация shortcuts с backend
  const syncShortcuts = async () => {
    if (!isBackendConnected) return

    try {
      // TODO: Implement proper shortcuts sync command in backend
      // For now, sync via SyncUserSettings
      await backendSync.executeCommand({
        type: "SyncUserSettings",
        params: {
          settings: {
            shortcuts: shortcuts.map((s) => ({ id: s.id, keys: s.keys })),
            globalEnabled: isGlobalEnabled,
            context: currentContext,
            usageStats: shortcutUsageStats,
          },
        },
      })

      logger.info("[ShortcutsProvider] Shortcuts synced with backend")
    } catch (error) {
      logger.error("[ShortcutsProvider] Failed to sync shortcuts:", { error })
    }
  }

  // Подписка на backend события
  useEffect(() => {
    const unsubscribeConnection = backendSync.onStateChange((_state: ProjectState) => {
      setIsBackendConnected(true)

      // Восстанавливаем shortcuts из backend
      // TODO: ProjectState doesn't have user_settings property yet
      // Need to implement proper state structure in backend
      logger.info("[ShortcutsProvider] Backend connection established")
    })

    const unsubscribeEvents = backendSync.onEvent((event) => {
      // TODO: Add SHORTCUTS_UPDATED event type to ProjectEvent
      if (event.type === "ProjectOpened") {
        // Reload shortcuts when project is opened
        loadSettings().catch((error) => logger.error("Operation failed", { error }))
      }
    })

    return () => {
      unsubscribeConnection()
      unsubscribeEvents()
    }
  }, [backendSync])

  // Инициализация shortcuts при первой загрузке
  useEffect(() => {
    if (shortcutsRegistry.getAll().length === 0) {
      // Добавляем обработчики для shortcuts с логированием использования
      const enhancedShortcuts = DEFAULT_SHORTCUTS.map((shortcut) => {
        const originalAction = shortcut.action

        // Оборачиваем action для логирования
        const wrappedAction = (event: KeyboardEvent) => {
          // Логируем использование shortcut
          setShortcutUsageStats((prev) => ({
            ...prev,
            [shortcut.id]: (prev[shortcut.id] || 0) + 1,
          }))

          // Отправляем аналитику в backend
          if (isBackendConnected) {
            backendSync
              .executeCommand({
                type: "LogUserAction",
                params: {
                  action: `shortcut:${shortcut.id}`,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    keys: shortcut.keys,
                    context: currentContext,
                  },
                },
              })
              .catch((error) => logger.error("Operation failed", { error }))
          }

          // Выполняем оригинальное действие или стандартные действия
          if (originalAction) {
            originalAction(event, { hotkey: shortcut.keys.join(",") })
          } else {
            // Добавляем действия для модальных окон
            switch (shortcut.id) {
              case "open-user-settings":
                event.preventDefault()
                openModal("user-settings")
                break
              case "open-project-settings":
                event.preventDefault()
                openModal("project-settings")
                break
              case "open-keyboard-shortcuts":
                event.preventDefault()
                openModal("keyboard-shortcuts")
                break
              case "export-video":
                event.preventDefault()
                openModal("export")
                break
              // TODO: Добавить обработчики для остальных shortcuts
            }
          }
        }

        return { ...shortcut, action: wrappedAction }
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
              logger.error("Failed to enable global shortcuts:", { error })
              setIsGlobalEnabled(false)
            }
          }
        }
      } catch (error) {
        logger.error("Failed to load shortcuts settings:", { error })
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
  }, [openModal, isBackendConnected, currentContext])

  // Синхронизация с backend при изменениях
  useEffect(() => {
    if (!isBackendConnected) return

    const syncTimeout = setTimeout(() => {
      syncShortcuts().catch((error) => logger.error("Operation failed", { error }))
    }, 3000) // Задержка 3 секунды для debouncing

    return () => clearTimeout(syncTimeout)
  }, [shortcuts, isGlobalEnabled, shortcutUsageStats, isBackendConnected])

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

      // Синхронизация с backend
      await syncShortcuts()
    } catch (error) {
      logger.error("Failed to toggle global shortcuts:", { error })
      // Возвращаем предыдущее состояние при ошибке
      setIsGlobalEnabled(tauriGlobalShortcuts.isEnabled())
      throw error
    }
  }

  const updateShortcutKeys = (id: string, keys: string[]) => {
    shortcutsRegistry.updateKeys(id, keys)

    // Обновляем глобальные shortcuts если они включены
    if (isGlobalEnabled) {
      tauriGlobalShortcuts.updateGlobalShortcuts().catch((error) => logger.error("Operation failed", { error }))
    }

    // Автосохранение настроек
    shortcutsRegistry.saveSettings(isGlobalEnabled).catch((error) => logger.error("Operation failed", { error }))

    // Немедленная синхронизация с backend для важных изменений
    if (isBackendConnected) {
      backendSync
        .executeCommand({
          type: "LogUserAction",
          params: {
            action: "shortcut:update",
            timestamp: new Date().toISOString(),
            metadata: { id, keys },
          },
        })
        .catch((error) => logger.error("Operation failed", { error }))
    }
  }

  const resetShortcut = (id: string) => {
    shortcutsRegistry.reset(id)
  }

  const resetAllShortcuts = async () => {
    shortcutsRegistry.resetAll()

    // Сбрасываем статистику
    setShortcutUsageStats({})

    // Уведомляем backend
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "LogUserAction",
        params: {
          action: "shortcuts:reset",
          timestamp: new Date().toISOString(),
          metadata: {},
        },
      })
    }
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
    await syncShortcuts()
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
          logger.error("Failed to sync global shortcuts:", { error })
        }
      }
    }
  }

  const exportSettings = async () => {
    const settings = await shortcutsRegistry.exportSettings()

    // Добавляем статистику использования
    const exportData = JSON.parse(settings)
    exportData.usageStats = shortcutUsageStats

    return JSON.stringify(exportData)
  }

  const importSettings = async (jsonString: string) => {
    const importData = JSON.parse(jsonString)

    // Восстанавливаем статистику если есть
    if (importData.usageStats) {
      setShortcutUsageStats(importData.usageStats)
    }

    await shortcutsRegistry.importSettings(jsonString)
    // Перезагружаем состояние после импорта
    await loadSettings()

    // Синхронизируем с backend
    await syncShortcuts()
  }

  const clearSettings = async () => {
    await shortcutsRegistry.clearSettings()
    setShortcutUsageStats({})
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
    syncShortcuts,
    isBackendConnected,
    shortcutUsageStats,
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

/**
 * Новый хук для мониторинга статистики использования shortcuts
 */
export function useShortcutStats() {
  const { shortcutUsageStats, syncShortcuts, isBackendConnected } = useShortcuts()

  const getMostUsedShortcuts = (limit = 10) => {
    return Object.entries(shortcutUsageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }))
  }

  const getTotalUsage = () => {
    return Object.values(shortcutUsageStats).reduce((sum, count) => sum + count, 0)
  }

  return {
    stats: shortcutUsageStats,
    mostUsed: getMostUsedShortcuts(),
    totalUsage: getTotalUsage(),
    sync: syncShortcuts,
    isConnected: isBackendConnected,
  }
}
