/**
 * Browser Domain
 *
 * Домен для управления браузером медиа файлов и ресурсов
 */

// Provider (BackendSync-based)
export { BrowserProvider, useBrowser, useBrowserState } from "./providers/browser-provider"

// Types (re-exported from generated bindings)
export type { BrowserTab, TabSettings, ViewMode, BrowserState } from "@/types/generated/tauri-bindings"

// Legacy type alias for backward compatibility
export type { BrowserState as BrowserContext } from "@/types/generated/tauri-bindings"

// Constants
export const DEFAULT_TAB: BrowserTab = "media"
export const BROWSER_TABS = [
  "media",
  "effects",
  "filters",
  "transitions",
  "templates",
  "style-templates",
] as const
