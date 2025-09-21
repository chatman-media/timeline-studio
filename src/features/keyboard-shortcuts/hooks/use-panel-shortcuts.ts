import { useEffect } from "react"

import { useUserSettings } from "@/features/user-settings"

import { shortcutsRegistry } from "../services/shortcuts-registry"

/**
 * Хук для регистрации shortcuts панелей
 *
 * Использует useUserSettings для получения методов управления видимостью панелей
 * Примечание: не требует наличия UserSettingsProvider в иерархии
 */
export function usePanelShortcuts() {
  const userSettings = useUserSettings()

  useEffect(() => {
    // Регистрируем shortcuts для панелей с действиями
    const panelShortcuts = [
      {
        id: "toggle-browser",
        action: (event: KeyboardEvent) => {
          event.preventDefault()
          userSettings.toggleBrowserVisibility()
        },
      },
      {
        id: "toggle-options",
        action: (event: KeyboardEvent) => {
          event.preventDefault()
          userSettings.toggleOptionsVisibility()
        },
      },
      {
        id: "toggle-timeline",
        action: (event: KeyboardEvent) => {
          event.preventDefault()
          userSettings.toggleTimelineVisibility()
        },
      },
    ]

    // Обновляем действия для существующих shortcuts
    panelShortcuts.forEach(({ id, action }) => {
      const shortcut = shortcutsRegistry.get(id)
      if (shortcut) {
        shortcut.action = action
        shortcutsRegistry.register(shortcut)
      }
    })
  }, [userSettings])
}
