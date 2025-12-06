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
  FileGroup,
  FileOperationsContext,
  FileOperationsEvent,
  FfprobeChapter,
  FfprobeData,
  FfprobeFormat,
  FfprobeStream,
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
  MediaPoolFilter,
  MediaPoolItem,
  MediaPoolSort,
  MediaPoolView,
  MediaPreviewData,
  PreviewGenerationOptions,
  QualityMetrics,
  SavedMediaFile,
  SavedMediaMetadata,
  SavedMusicFile,
  SceneDetectionResult,
  ThumbnailData,
  TimelineFrame,
  TimeRange,
  VideoSegment,
} from "@/domains/media-management"

export { MediaType } from "@/domains/media-management"

// Local UI-specific types (not moved to domain)
export type { MediaTrack, Sector, Track } from "./types"
