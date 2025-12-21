/**
 * Browser Domain
 *
 * Домен для управления браузером медиа файлов и ресурсов
 */

import type { BrowserTab } from "@/types/generated/tauri-bindings"

// Types (re-exported from generated bindings)
// Legacy type alias for backward compatibility
export type {
  BrowserState,
  BrowserState as BrowserContext,
  BrowserTab,
  TabSettings,
  ViewMode,
} from "@/types/generated/tauri-bindings"
// Optimistic updates hook
export { useOptimisticSelection } from "./hooks/use-optimistic-selection"
// Backend Event Handlers
export { handleBrowserBackendEvent } from "./machines/backend-event-handlers"
// XState Machine
export { type BrowserMachineContext, browserMachine, createBrowserActor } from "./machines/browser-machine"
// Provider (BackendSync-based with event-driven architecture)
export {
  BrowserProvider,
  useBrowser,
  // Granular selector hooks for performance optimization
  useBrowserActiveTab,
  useBrowserPreviewSize,
  useBrowserSearchQuery,
  useBrowserSelectedFiles,
  useBrowserState,
  useBrowserTabSettings,
  useBrowserViewMode,
} from "./providers/browser-provider"

// Constants
export const DEFAULT_TAB: BrowserTab = "media"
export const BROWSER_TABS: readonly BrowserTab[] = [
  "media",
  "effects",
  "filters",
  "transitions",
  "templates",
  "style_templates",
]
