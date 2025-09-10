/**
 * Person Identification Services
 * Migrated from features/person-identification/services
 */

export { AdvancedFaceDetectionService } from "./advanced-face-detection-service"
export { AdvancedTrackingService } from "./advanced-tracking-service"
// Re-export types for convenience
export type {
  DatabaseConfig,
  SimilaritySearchResult,
} from "./person-database-service"
export { PersonDatabaseService } from "./person-database-service"
