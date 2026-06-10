/**
 * Media Management Domain
 *
 * Домен для управления медиа файлами и операциями с ними
 */

// AudioWaveform components require peaks.js which needs browser environment
// Import directly from "./components/audio-waveform" with "use client" directive
// export { AudioWaveform, AudioWaveformCompact } from "./components/audio-waveform"

// Hooks
export {
  // Media processing and preview hooks
  useAutoProxy,
  useCacheStatistics,
  // Core domain hooks
  useFileOperations,
  useFramePreview,
  useMediaImport,
  useMediaManagement,
  useMediaMetadata,
  useMediaPreview,
  useMediaProcessor,
  useMediaRestoration,
  usePreviewPreloader,
  useSimpleMediaProcessor,
} from "./hooks"
// Peaks.js Waveform - requires browser environment, import directly when needed
// export { createAudioElement, usePeaksWaveform } from "./hooks/use-peaks-waveform"
export type { FileOperationsMachine } from "./machines/file-operations-machine"
// Machines
export { fileOperationsMachine } from "./machines/file-operations-machine"
export type { MediaImportMachine } from "./machines/media-import-machine"
export { mediaImportMachine } from "./machines/media-import-machine"
// Providers
export { MediaManagementContext, MediaManagementProvider } from "./providers/media-management-provider"
// Camera Import
export type {
  CameraDevice,
  CameraFile,
  CameraImportOptions,
  CameraImportResult,
} from "./services/camera-import"
export { CameraImportService, getCameraImport } from "./services/camera-import"
// Error Tracker
export type {
  ErrorRecord,
  ErrorStats,
  ErrorType,
  OperationStats,
  RecoveryStrategy,
  RetryConfig,
} from "./services/error-tracker"
export { ErrorTrackerService, getErrorTracker } from "./services/error-tracker"
export type {
  CachedFrames,
  CachedPreview,
  CachedRecognition,
  CachedSubtitles,
  CacheStatistics,
} from "./services/indexeddb-cache-service"
// IndexedDB Cache
export { IndexedDBCacheService, indexedDBCacheService } from "./services/indexeddb-cache-service"
// Media API
export * from "./services/media-api"
// Orchestrator
export {
  getMediaManagementOrchestrator,
  MediaManagementOrchestrator,
  resetMediaManagementOrchestrator,
} from "./services/media-management-orchestrator"
export type { MediaMetadataService } from "./services/media-metadata-service"
// Services
export { getMediaMetadataService } from "./services/media-metadata-service"
// Media Restoration
export type {
  FileRestorationResult,
  ProjectRestorationResult,
} from "./services/media-restoration-service"
export {
  generateRestorationReport,
  handleMissingFiles,
  promptUserToFindFile,
  restoreFile,
  restoreProjectMedia,
} from "./services/media-restoration-service"
// Proxy Generator
export type {
  ProxyGenerationOptions,
  ProxyGenerationResult,
  ProxyQuality,
  ProxyResolution,
} from "./services/proxy-generator"
export { getProxyGenerator, ProxyGeneratorService } from "./services/proxy-generator"
// Smart Organization
export type {
  DateFormat,
  MediaGroup,
  OrganizationResult,
  OrganizeByCameraOptions,
  OrganizeByDateOptions,
  OrganizeByEventsOptions,
} from "./services/smart-organization"
export { getSmartOrganization, SmartOrganizationService } from "./services/smart-organization"
// Waveform Generator
export type { WaveformData, WaveformOptions, WaveformResult } from "./services/waveform-generator"
export { getWaveformGenerator, WaveformGeneratorService } from "./services/waveform-generator"
// Note: All media functions are now exported from "./services/media-api"
// which uses container.getMedia() internally for proper DI support
// Types
export type {
  AudioMetadata,
  // Media metadata
  BrowserVideoMetadata,
  FfprobeData,
  FfprobeFormat,
  FfprobeStream,
  // Core media types
  FileGroup,
  FileOperationsContext,
  FileOperationsEvent,
  FileStatus,
  ImageMetadata,
  // Metadata service
  MediaAnalysisResult,
  // Service interfaces
  MediaBin,
  // File operations
  MediaFile,
  MediaFileOperation,
  MediaImportContext,
  MediaImportEvent,
  // Media import
  MediaImportOptions,
  MediaInfo,
  MediaItemStatus,
  MediaItemType,
  MediaManagementService,
  MediaMetadata,
  MediaPool,
  MediaPoolItem,
  MediaPreviewData,
  MediaTrack,
  MusicMetadata,
  QualityMetrics,
  RecognitionResults,
  SavedMediaFile,
  SavedMusicFile,
  SceneDetectionResult,
  ThumbnailData,
  TimelineFrame,
  TimeRange,
  VideoSegment,
} from "./types"
export { MediaType } from "./types"
export type {
  AudiowaveformData,
  PeaksInstance,
  PeaksOptions,
  PeaksPoint,
  PeaksSegment,
  UsePeaksResult,
  WaveformDataOptions,
  WaveformDataResult,
} from "./types/peaks-waveform"
// Utilities
export * from "./utils"
