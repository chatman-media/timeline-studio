/**
 * Re-export app machine from new domain location
 * Для обратной совместимости
 */

export type { AppMachineContext, AppMachineEvent } from "@/domains/project-management/machines/app-machine"
export { appMachine } from "@/domains/project-management/machines/app-machine"
