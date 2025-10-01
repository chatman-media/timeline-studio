/**
 * Browser State Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @/domains/browser
 * Этот файл оставлен для обратной совместимости
 */

// Re-export event types for backward compatibility
export type { BrowserMachine, BrowserMachineEvent as BrowserEvent } from "@/domains/browser"
// Re-export everything from the new domain location
export { browserMachine } from "@/domains/browser"
