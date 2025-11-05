/**
 * Project Management Domain
 *
 * Домен для управления проектами и настройками приложения
 */

// Экспорт хуков
export { useProjectManagement } from "./hooks/use-project-management"
// Экспорт машин
export { appMachine } from "./machines/app-machine"
export { userSettingsMachine } from "./machines/user-settings-machine"
// Экспорт провайдеров и хуков
export {
  AppStateProvider,
  ProjectManagementProvider,
  ProjectProvider,
  UserSettingsProvider,
  useAppState,
  useProject,
  useUserSettings,
} from "./providers/project-management-provider"
// Экспорт оркестратора
export {
  getProjectManagementOrchestrator,
  ProjectManagementOrchestrator,
  resetProjectManagementOrchestrator,
} from "./services/project-management-orchestrator"
// Экспорт типов
export * from "./types"
