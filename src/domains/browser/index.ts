/**
 * Browser Domain
 *
 * Домен для управления браузером медиа файлов и ресурсов
 */

// Hooks
export { useBrowserDomain, useBrowserSelection, useBrowserSettings } from "./hooks"
export type { BrowserMachine } from "./machines/browser-machine"
// Machines
export { browserMachine } from "./machines/browser-machine"

// Providers - Legacy (XState-based)
export { BrowserDomainContext, BrowserDomainProvider } from "./providers/browser-domain-provider"

// Providers - New (BackendSync-based)
export { BrowserProviderV2, useBrowserV2 } from "./providers/browser-provider-v2"

// Types
export type {
  BrowserContext,
  BrowserMachineContext,
  BrowserMachineEvent,
  BrowserService,
  BrowserStorageService,
  BrowserTab,
  TabSettings,
  ViewMode,
} from "./types"
