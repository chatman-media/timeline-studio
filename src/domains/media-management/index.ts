/**
 * Media Management Domain
 *
 * Домен для управления медиа файлами и операциями с ними
 */

// Hooks
export {
  useFileOperations,
  useMediaImport,
  useMediaManagement,
  useMediaMetadata,
} from "./hooks"
export type { FileOperationsMachine } from "./machines/file-operations-machine"
// Machines
export { fileOperationsMachine } from "./machines/file-operations-machine"
export type { MediaImportMachine } from "./machines/media-import-machine"
export { mediaImportMachine } from "./machines/media-import-machine"
// Providers
export { MediaManagementContext, MediaManagementProvider } from "./providers/media-management-provider"
export type { MediaMetadataService } from "./services/media-metadata-service"
// Services
export { getMediaMetadataService } from "./services/media-metadata-service"
// Types
export type {
  AudioMetadata,
  // Media metadata
  BrowserVideoMetadata,
  FileOperationsContext,
  FileOperationsEvent,
  ImageMetadata,
  // Metadata service
  MediaAnalysisResult,
  // File operations
  MediaFileOperation,
  MediaImportContext,
  MediaImportEvent,
  // Media import
  MediaImportOptions,
  MediaInfo,
  // Service interfaces
  MediaManagementService,
  MediaMetadata,
  MediaType,
  QualityMetrics,
  SceneDetectionResult,
} from "./types"
