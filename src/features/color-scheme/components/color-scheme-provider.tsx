/**
 * ColorSchemeProvider
 *
 * Применяет CSS-переменные активной цветовой схемы к документу и
 * синхронизирует режим темы (settings.themeMode) с next-themes.
 * Не рендерит UI — только сайд-эффекты.
 */

"use client"

import { useTheme } from "next-themes"
import { type ReactNode, useEffect } from "react"

import { useUserSettings } from "@/features/user-settings"
import { useColorScheme } from "../hooks/use-color-scheme"
import { applyColorScheme } from "../lib"

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const { activeScheme } = useColorScheme()
  const { theme, setTheme } = useTheme()
  const { themeMode, isLoaded } = useUserSettings()

  // Применяем переменные активной схемы (инжектится <style> в <head>)
  useEffect(() => {
    applyColorScheme(activeScheme)
  }, [activeScheme])

  // После загрузки/изменения themeMode из стора — приводим next-themes к нему.
  // Намеренно не включаем `theme` в deps — нас интересует только изменение
  // themeMode в сторе (начальная загрузка, изменение из настроек).
  // Включение `theme` создаёт петлю: toggle → setTheme → effect → setTheme.
  useEffect(() => {
    if (!isLoaded || !themeMode) return
    setTheme(themeMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, themeMode])

  return <>{children}</>
}
