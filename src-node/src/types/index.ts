/**
 * Type re-exports from main project for single source of truth
 *
 * Note: When running, ensure the main project types are built and accessible
 */

// Media types (commented out - will be defined locally to avoid import issues)
// export type {
//   MediaFile,
//   MediaType,
//   MediaCodec,
//   MediaColorSpace,
// } from "@/domains/shared/types/media/media-file"

// export {
//   isVideoFile,
//   isAudioFile,
//   isImageFile,
// } from "@/domains/shared/types/media/media-file"

// Media service types
export type {
  IMediaService,
  MediaMetadata,
  VideoMetadataFields,
  AudioMetadataFields,
  ImageMetadataFields,
  ProcessMediaOptions,
  ProcessMediaResult,
  MediaImportOptions,
  MediaImportResult,
  ThumbnailOptions as IMediaServiceThumbnailOptions,
  WaveformOptions,
  WaveformData,
  SceneDetectionResult,
  ProxyGenerationOptions,
  ProxyGenerationResult,
  MediaPreviewData,
  ScanFolderOptions,
  ScannedMediaFile,
} from "../../../src/core/ports/media.port"

// FFprobe types
export type {
  FfprobeData,
  FfprobeFormat,
  FfprobeStream,
} from "../../../src/domains/media-management/types/ffprobe"
