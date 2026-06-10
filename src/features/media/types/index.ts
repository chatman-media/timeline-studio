/**
 * Media Feature Types
 *
 * Domain-level types moved to @/domains/media-management
 * This file re-exports them for backward compatibility and local UI types
 */

// Re-export all domain types for convenience
export type {
  // Core media types
  FfprobeData,
  FfprobeFormat,
  FfprobeStream,
  FileGroup,
  MediaFile,
  MediaTrack,
  MediaTimeRange as TimeRange,
  SavedMediaFile,
  SavedMusicFile,
  VideoSegment,
} from "@/core/types"

export type {
  AudioMetadata,
  BrowserVideoMetadata,
  FileOperationsContext,
  FileOperationsEvent,
  ImageMetadata,
  MediaAnalysisResult,
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
  QualityMetrics,
  SceneDetectionResult,
  ThumbnailData,
  TimelineFrame,
} from "@/domains/media-management"

export { MediaType } from "@/core/types"

// Local UI-specific types (not moved to domain)
export type { Sector, Track } from "./types"
