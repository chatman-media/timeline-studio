/**
 * Person Identification Services
 * Migrated from features/person-identification/services
 */

export type {
  AdvancedDetectionConfig,
  AdvancedFaceDetection,
  RealtimeProcessingStatus,
} from "./advanced-face-detection-service"
export { AdvancedFaceDetectionService } from "./advanced-face-detection-service"
export type { TrackedPerson } from "./advanced-tracking-service"
export { AdvancedTrackingService } from "./advanced-tracking-service"
// Re-export types for convenience
export type {
  DatabaseConfig,
  DatabaseStats,
  SimilaritySearchResult,
} from "./person-database-service"
export { PersonDatabaseService } from "./person-database-service"
