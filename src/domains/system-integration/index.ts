/**
 * System Integration Domain
 *
 * Домен для системной интеграции: модальные окна, обновления, уведомления
 */

export { useFeatures } from "./hooks/use-features"
// Экспорт хуков
export { useModals } from "./hooks/use-modals"
export { useNotifications } from "./hooks/use-notifications"
export { useUpdates } from "./hooks/use-updates"
// Экспорт типов машин
export type { ModalActor, ModalMachine } from "./machines/modal-machine"
// Экспорт машин
export { modalMachine } from "./machines/modal-machine"
export type { UpdateMachine, UpdateMachineActor } from "./machines/update-machine"
export { updateMachine } from "./machines/update-machine"
// Экспорт провайдера
export { SystemIntegrationProvider, useSystemIntegrationContext } from "./providers/system-integration-provider"
// Экспорт оркестратора
export {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
  SystemIntegrationOrchestrator,
} from "./services/system-integration-orchestrator"
// Экспорт типов
export * from "./types"
