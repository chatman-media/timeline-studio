/**
 * Хук для регистрации горячих клавиш мультикамеры
 */

import { useEffect } from "react"
import { shortcutsRegistry } from "@/features/keyboard-shortcuts/services/shortcuts-registry"
import { logInfo } from "@/lib/tauri-logger"

import { multicamManager } from "../services/multicam-manager"

export function useMulticamShortcuts() {
  logInfo("[useMulticamShortcuts] Инициализация хука")

  useEffect(() => {
    // Регистрируем обработчики для переключения камер 1-9
    const shortcuts = Array.from({ length: 9 }, (_, i) => ({
      id: `switch-camera-${i + 1}`,
      action: (event: KeyboardEvent) => {
        event.preventDefault()
        multicamManager.switchToCameraByNumber(i + 1)
      },
    }))

    // Обновляем действия для существующих shortcuts
    shortcuts.forEach(({ id, action }) => {
      const existingShortcut = shortcutsRegistry.get(id)
      if (existingShortcut) {
        // Регистрируем shortcut с новым action
        shortcutsRegistry.register({
          ...existingShortcut,
          action,
        })
      }
    })

    // Cleanup - удаляем действия при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        const existingShortcut = shortcutsRegistry.get(id)
        if (existingShortcut) {
          // Регистрируем shortcut без action
          shortcutsRegistry.register({
            ...existingShortcut,
            action: undefined,
          })
        }
      })
    }
  }, [])
}
