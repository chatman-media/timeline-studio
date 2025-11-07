/**
 * Browser Domain
 *
 * Домен для управления браузером медиа файлов и ресурсов
 */

// Provider (BackendSync-based)
export { BrowserProvider, useBrowser, useBrowserState } from "./providers/browser-provider"

// Types (re-exported from generated bindings)
export type { BrowserTab, TabSettings, ViewMode } from "@/types/generated/tauri-bindings"
