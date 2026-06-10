/**
 * System Integration Domain
 *
 * Домен для системной интеграции: модальные окна, обновления, уведомления, workspace
 */

// Экспорт хуков для использования
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
// Экспорт Language Service
export type { LanguageResponse } from "./services/language"
export { getAppLanguage, setAppLanguage } from "./services/language"
// Экспорт Plugin Service
export type { PluginCommandResponse } from "./services/plugins"
export { isPluginLoaded, sendPluginCommand } from "./services/plugins"
// Экспорт оркестратора
export {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
  SystemIntegrationOrchestrator,
} from "./services/system-integration-orchestrator"
// Экспорт Update Services
export { UpdateService, updateService } from "./services/updates"
export {
  getAppLanguage as getAppLanguageTauri,
  type LanguageResponse as LanguageResponseTauri,
  setAppLanguage as setAppLanguageTauri,
} from "./tauri/language-commands"

// Экспорт Tauri Commands (Advanced)
export {
  type PluginCommandResponse as PluginCommandResponseTauri,
  sendPluginCommand as sendPluginCommandTauri,
} from "./tauri/plugin-commands"
export {
  checkForUpdate as checkForUpdateTauri,
  downloadAndInstallUpdate as downloadAndInstallUpdateTauri,
} from "./tauri/update-commands"
// Экспорт типов
export * from "./types"
