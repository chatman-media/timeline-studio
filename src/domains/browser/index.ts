/**
 * Browser Domain
 *
 * Домен для управления браузером медиа файлов и ресурсов
 */

// Types (re-exported from generated bindings)
// Legacy type alias for backward compatibility
export type {
  BrowserState,
  BrowserState as BrowserContext,
  BrowserTab,
  TabSettings,
  ViewMode,
} from "@/types/generated/tauri-bindings"
// Provider (BackendSync-based)
export { BrowserProvider, useBrowser, useBrowserState } from "./providers/browser-provider"

// Constants
export const DEFAULT_TAB: BrowserTab = "media"
export const BROWSER_TABS = ["media", "effects", "filters", "transitions", "templates", "style-templates"] as const
