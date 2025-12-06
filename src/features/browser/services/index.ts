// Re-export browser types from domain
export type { BrowserState, BrowserTab } from "@/domains/browser"

// Primary exports (recommended) - use @/domains/browser directly
export { BrowserProvider, useBrowser } from "@/domains/browser"
// Deprecated exports (for backward compatibility only)
/** @deprecated Use BrowserProvider from @/domains/browser instead */
/** @deprecated Use useBrowser from @/domains/browser instead */
export { BrowserStateProvider, useBrowserState } from "./browser-state-provider"
