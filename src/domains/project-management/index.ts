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
// Экспорт API Keys Service
export {
  API_DOCUMENTATION_LINKS,
  API_KEY_MASKS,
  API_KEY_MIN_LENGTH,
  API_KEY_PATTERNS,
  type ApiKeyMask,
  ApiKeysService,
  apiKeysService,
  VALIDATION_ERROR_MESSAGES,
} from "./services/api-keys-service"
// Экспорт App Directories Service
export {
  type AppDirectories,
  AppDirectoriesService,
  appDirectoriesService,
  type DirectorySizes,
} from "./services/app-directories-service"
// Экспорт Batch Commands Service
export {
  BatchCommandBuilder,
  type BatchCommandRequest,
  type BatchCommandResult,
  batchOperations,
  batchUtils,
  type CommandResult,
  createBatch,
  executeBatch,
  useBatchCommands,
} from "./services/batch-commands-service"
// Экспорт метрик производительности
export {
  type CommandMetric,
  getPerformanceMetricsTracker,
  type MemorySnapshot,
  type PerformanceReport,
  resetPerformanceMetricsTracker,
  type StateUpdateMetric,
} from "./services/performance-metrics"
// Экспорт оркестратора
export {
  getProjectManagementOrchestrator,
  ProjectManagementOrchestrator,
  resetProjectManagementOrchestrator,
} from "./services/project-management-orchestrator"
// Экспорт Tauri Commands (Advanced)
export * from "./tauri/api-keys-commands"
export * from "./tauri/project-commands"
// Экспорт типов
export * from "./types"
