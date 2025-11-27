/**
 * Backend synchronization service - Re-export for backwards compatibility
 *
 * @deprecated Import from "@/adapters/tauri" instead:
 *   import { BackendSync, getBackendSync } from "@/adapters/tauri"
 *
 * For platform-independent code, use the container:
 *   import { container, getBackend } from "@/core"
 */

export type { EventHandler, StateChangeHandler } from "@/adapters/tauri"
export { BackendSync, getBackendSync } from "@/adapters/tauri"
