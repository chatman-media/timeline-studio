// Re-export browser domain access through the feature boundary.
export type { BrowserState, BrowserTab } from "./browser-domain"

export { BrowserProvider, useBrowser } from "./browser-domain"
// Deprecated exports (for backward compatibility only)
/** @deprecated Use BrowserProvider from @/features/browser/services instead */
/** @deprecated Use useBrowser from @/features/browser/services instead */
export { BrowserStateProvider, useBrowserState } from "./browser-state-provider"
