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

import { useUserSettings } from "@/domains/project-management/hooks"
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

  // После загрузки настроек из стора — приводим next-themes к settings.themeMode.
  // Проверка равенства внутри гарантирует отсутствие цикла при изменении theme.
  useEffect(() => {
    if (!isLoaded) return
    if (themeMode && theme !== themeMode) {
      setTheme(themeMode)
    }
  }, [isLoaded, themeMode, theme, setTheme])

  return <>{children}</>
}
