/**
 * Project Management Domain
 *
 * Домен для управления проектами и настройками приложения
 */

export { useAppState } from "./hooks/use-app-state"
// Экспорт хуков
export { useProjectManagement } from "./hooks/use-project-management"
export { useUserSettings } from "./hooks/use-user-settings"
// Экспорт машин
export { appMachine } from "./machines/app-machine"
export { userSettingsMachine } from "./machines/user-settings-machine"
// Экспорт провайдера
export { ProjectManagementProvider, useProjectManagementContext } from "./providers/project-management-provider"
// Экспорт оркестратора
export {
  getProjectManagementOrchestrator,
  ProjectManagementOrchestrator,
  resetProjectManagementOrchestrator,
} from "./services/project-management-orchestrator"
// Экспорт типов
export * from "./types"
