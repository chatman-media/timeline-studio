"use client"

import { Moon, Sun } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@timeline-studio/ui/components/button"
import { useTheme } from "@/config/providers"
import { useUserSettings } from "@/features/user-settings"
import { TOP_BAR_BUTTON_CLASS } from "../top-bar"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { updateSettings } = useUserSettings()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = useCallback(() => {
    if (!mounted) return
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    updateSettings({ themeMode: newTheme })
  }, [mounted, resolvedTheme, setTheme, updateSettings])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={TOP_BAR_BUTTON_CLASS}
      title={mounted ? (resolvedTheme === "dark" ? "Светлая тема" : "Тёмная тема") : "Переключить тему"}
      data-testid="theme-toggle-button"
      data-oid="6zco41g"
    >
      <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" data-oid="jqf.czz" />
      <Moon
        className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        data-oid="_1n.9:u"
      />
    </Button>
  )
}
