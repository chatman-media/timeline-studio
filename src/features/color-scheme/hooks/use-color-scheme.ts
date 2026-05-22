/**
 * useColorScheme - управление режимом темы и цветовыми схемами.
 *
 * Источник истины — единый стор пользовательских настроек (персистится
 * и в Tauri/Rust через Store-плагин, и в Node через JSON). next-themes
 * используется только для применения класса .dark; его значение
 * синхронизируется с settings.themeMode.
 */

import { useTheme } from "next-themes"
import { useCallback, useMemo } from "react"

import { useUserSettings } from "@/domains/project-management/hooks"
import { BUILTIN_COLOR_SCHEMES, BUILTIN_SCHEMES_BY_ID, DEFAULT_COLOR_SCHEME_ID } from "../constants"
import type { ColorScheme, ThemeMode } from "../types"

export function useColorScheme() {
  const settings = useUserSettings()
  const { setTheme } = useTheme()

  const customSchemes = settings.customColorSchemes ?? []

  const allSchemes = useMemo<ColorScheme[]>(() => [...BUILTIN_COLOR_SCHEMES, ...customSchemes], [customSchemes])

  const schemesById = useMemo(() => new Map(allSchemes.map((s) => [s.id, s])), [allSchemes])

  const activeSchemeId = settings.colorScheme ?? DEFAULT_COLOR_SCHEME_ID
  const activeScheme = schemesById.get(activeSchemeId) ?? BUILTIN_SCHEMES_BY_ID.get(DEFAULT_COLOR_SCHEME_ID)!

  const quickAccessIds = settings.quickAccessSchemeIds ?? []
  const quickAccessSchemes = useMemo(
    () => quickAccessIds.map((id) => schemesById.get(id)).filter((s): s is ColorScheme => Boolean(s)),
    [quickAccessIds, schemesById],
  )

  const themeMode = (settings.themeMode ?? "system") as ThemeMode

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      settings.updateSettings({ themeMode: mode })
      setTheme(mode)
    },
    [settings, setTheme],
  )

  const setColorScheme = useCallback(
    (id: string) => {
      settings.updateSettings({ colorScheme: id })
    },
    [settings],
  )

  const addCustomScheme = useCallback(
    (scheme: ColorScheme) => {
      const next = [...customSchemes.filter((s) => s.id !== scheme.id), scheme]
      settings.updateSettings({ customColorSchemes: next })
    },
    [customSchemes, settings],
  )

  const removeCustomScheme = useCallback(
    (id: string) => {
      const next = customSchemes.filter((s) => s.id !== id)
      const updates: Record<string, unknown> = { customColorSchemes: next }
      // Если удалили активную схему — откатываемся на схему по умолчанию
      if (activeSchemeId === id) updates.colorScheme = DEFAULT_COLOR_SCHEME_ID
      // Убираем из быстрого доступа
      if (quickAccessIds.includes(id)) updates.quickAccessSchemeIds = quickAccessIds.filter((q) => q !== id)
      settings.updateSettings(updates)
    },
    [activeSchemeId, customSchemes, quickAccessIds, settings],
  )

  const setQuickAccessIds = useCallback(
    (ids: string[]) => {
      settings.updateSettings({ quickAccessSchemeIds: ids })
    },
    [settings],
  )

  const toggleQuickAccess = useCallback(
    (id: string) => {
      const next = quickAccessIds.includes(id) ? quickAccessIds.filter((q) => q !== id) : [...quickAccessIds, id]
      settings.updateSettings({ quickAccessSchemeIds: next })
    },
    [quickAccessIds, settings],
  )

  return {
    themeMode,
    setThemeMode,
    activeSchemeId,
    activeScheme,
    allSchemes,
    builtinSchemes: BUILTIN_COLOR_SCHEMES,
    customSchemes,
    quickAccessIds,
    quickAccessSchemes,
    setColorScheme,
    addCustomScheme,
    removeCustomScheme,
    setQuickAccessIds,
    toggleQuickAccess,
  }
}
