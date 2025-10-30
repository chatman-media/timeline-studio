/**
 * App Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @/domains/project-management
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  AppMachineContext,
  AppMachineEvent,
} from "@/domains/project-management/machines/app-machine"

export type { appMachine as AppMachine } from "@/domains/project-management/machines/app-machine"

export { AppCommands, appMachine } from "@/domains/project-management/machines/app-machine"
