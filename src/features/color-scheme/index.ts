/**
 * Color Scheme Feature Module
 *
 * Управление режимом темы (light/dark/system) и цветовыми схемами акцента.
 */

export { ColorSchemeDropdown } from "./components/color-scheme-dropdown"
export { ColorSchemeProvider } from "./components/color-scheme-provider"
export { ColorSchemeSettings } from "./components/color-scheme-settings"
export { BUILTIN_COLOR_SCHEMES, DEFAULT_COLOR_SCHEME_ID, DEFAULT_QUICK_ACCESS_IDS } from "./constants"
export { useColorScheme } from "./hooks/use-color-scheme"
export { buildCustomScheme, hexToHslTriplet, isValidColorScheme, schemePreviewColor } from "./lib"
export type { ColorScheme, ColorSchemeVars, ThemeMode } from "./types"
