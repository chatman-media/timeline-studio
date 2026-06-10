/**
 * Media Feature Types
 *
 * Domain-level types moved to @timeline-studio/domains/media-management
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
  MediaTimeRange as TimeRange,
  MediaTrack,
  QualityMetrics,
  SavedMediaFile,
  SavedMusicFile,
  SceneDetectionResult,
  ThumbnailData,
  TimelineFrame,
  VideoSegment,
} from "@timeline-studio/core/types"

export { MediaType } from "@timeline-studio/core/types"

// Local UI-specific types (not moved to domain)
export type { Sector, Track } from "./types"
