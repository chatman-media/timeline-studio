/**
 * Color scheme persistence contract used by project-management.
 */

export type ColorSchemeVars = {
  teal: string
  "teal-light": string
  "teal-dark": string
}

export interface ColorScheme {
  id: string
  name: string
  isBuiltin?: boolean
  light: ColorSchemeVars
  dark: ColorSchemeVars
}

export type ThemeMode = "light" | "dark" | "system"

export const DEFAULT_COLOR_SCHEME_ID = "teal"
export const DEFAULT_QUICK_ACCESS_IDS = ["teal", "blue", "purple", "green"]
