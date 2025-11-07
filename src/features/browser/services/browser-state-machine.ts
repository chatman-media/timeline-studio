/**
 * Browser State Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @/domains/browser
 * Этот файл оставлен для обратной совместимости
 *
 * Note: browserMachine был удален после рефакторинга на BackendSync.
 * Используйте useBrowser() hook для управления состоянием браузера.
 */

// Re-export types for backward compatibility
export type { BrowserState, BrowserTab } from "@/domains/browser"
