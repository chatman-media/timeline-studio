/**
 * System Integration Domain
 *
 * Домен для системной интеграции: модальные окна, обновления, уведомления, workspace
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
export type { UpdateMachine, UpdateMachineActor, UpdateMachineInput } from "./machines/update-machine"
export { createUpdateMachine, updateMachine } from "./machines/update-machine"
// Экспорт оркестратора
export {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
  SystemIntegrationOrchestrator,
} from "./services/system-integration-orchestrator"
// Экспорт Update Services
export { UpdateService, updateService } from "./services/updates"
// Экспорт Workspace Persistence
export type { WorkspaceState } from "./services/workspace"
export {
  clearWorkspaceStateLocal,
  debouncedSave,
  isValidWorkspaceState,
  loadWorkspaceState,
  loadWorkspaceStateBackend,
  loadWorkspaceStateLocal,
  saveWorkspaceStateBackend,
  saveWorkspaceStateLocal,
} from "./services/workspace"
// Экспорт типов
export * from "./types"
