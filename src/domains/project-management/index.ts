/**
 * Project Management Domain
 *
 * Домен для управления проектами и настройками приложения
 */

// Экспорт хуков (работают через оркестратор, не требуют провайдеров)
export { useAppState } from "./hooks/use-app-state"
export { useProjectManagement } from "./hooks/use-project-management"
export { useUserSettings } from "./hooks/use-user-settings"
// Экспорт машин
export { appMachine } from "./machines/app-machine"
export { userSettingsMachine } from "./machines/user-settings-machine"
// Экспорт только провайдеров (без хуков чтобы избежать конфликта имен)
export {
  AppStateProvider,
  ProjectManagementProvider,
  ProjectProvider,
  UserSettingsProvider,
} from "./providers/project-management-provider"
// Экспорт оркестратора
export {
  getProjectManagementOrchestrator,
  ProjectManagementOrchestrator,
  resetProjectManagementOrchestrator,
} from "./services/project-management-orchestrator"
// Экспорт метрик производительности
export {
  getPerformanceMetricsTracker,
  resetPerformanceMetricsTracker,
  type CommandMetric,
  type StateUpdateMetric,
  type MemorySnapshot,
  type PerformanceReport,
} from "./services/performance-metrics"
// Экспорт типов
export * from "./types"
