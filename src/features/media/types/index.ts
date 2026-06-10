/**
 * Media Feature Types
 *
 * Domain-level types moved to @/domains/media-management
 * This file re-exports them for backward compatibility and local UI types
 */

// Re-export all domain types for convenience
export type {
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
  MediaFile,
  MediaTrack,
  MediaTimeRange as TimeRange,
  SavedMediaFile,
  SavedMusicFile,
  VideoSegment,
} from "@timeline-studio/core/types"

export { MediaType } from "@timeline-studio/core/types"

// Local UI-specific types (not moved to domain)
export type { Sector, Track } from "./types"
