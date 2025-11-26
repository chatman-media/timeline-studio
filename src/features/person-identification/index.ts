/**
 * Barrel exports для модуля Person Identification
 */

// Сервисы (реэкспорт из домена для обратной совместимости)
export {
  AdvancedFaceDetectionService,
  AdvancedTrackingService,
  PersonDatabaseService,
} from "@/domains/ai-services/services/person-identification"
// Компоненты
export * from "./components"
// Hooks
export * from "./hooks"

// Типы
export * from "./types/person"
