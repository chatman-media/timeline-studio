/**
 * Media Feature Types
 *
 * Domain-level types moved to @/domains/media-management
 * This file re-exports them for backward compatibility and local UI types
 */

// Re-export all domain types for convenience
export type {
  // Core media types
  AudioMetadata,
  BrowserVideoMetadata,
  FfprobeData,
  FfprobeFormat,
  FfprobeStream,
  FileGroup,
  FileOperationsContext,
  FileOperationsEvent,
  ImageMetadata,
  MediaAnalysisResult,
  MediaFile,
  MediaFileOperation,
  MediaImportContext,
  MediaImportEvent,
  MediaImportOptions,
  MediaManagementService,
  MediaMetadata,
  MediaMetadataService,
  MediaPool,
  MediaPoolItem,
  MediaPreviewData,
  MediaTrack,
  QualityMetrics,
  SavedMediaFile,
  SavedMusicFile,
  SceneDetectionResult,
  ThumbnailData,
  TimelineFrame,
  TimeRange,
  VideoSegment,
} from "@/domains/media-management"

export { MediaType } from "@/domains/media-management"

// Local UI-specific types (not moved to domain)
export type { Sector, Track } from "./types"
