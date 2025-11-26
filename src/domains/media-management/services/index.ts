/**
 * Media Management Services
 *
 * Централизованный экспорт всех сервисов домена
 */

export type { CameraDevice, CameraFile, CameraImportOptions, CameraImportResult } from "./camera-import"
// Camera Import
export { CameraImportService, getCameraImport } from "./camera-import"
export type { ErrorRecord, ErrorStats, ErrorType, OperationStats, RecoveryStrategy, RetryConfig } from "./error-tracker"
// Error Tracker
export { ErrorTrackerService, getErrorTracker } from "./error-tracker"
// File System Service
export { FileSystemService } from "./file-system-service"
export type {
  CachedFrames,
  CachedPreview,
  CachedRecognition,
  CachedSubtitles,
  CacheStatistics,
} from "./indexeddb-cache-service"
// IndexedDB Cache
export { IndexedDBCacheService, indexedDBCacheService } from "./indexeddb-cache-service"
// Media API
export * from "./media-api"
// Orchestrator - главный сервис координации
export {
  getMediaManagementOrchestrator,
  MediaManagementOrchestrator,
  resetMediaManagementOrchestrator,
} from "./media-management-orchestrator"
export type { MediaMetadataService } from "./media-metadata-service"
// Media Metadata Service
export { getMediaMetadataService } from "./media-metadata-service"
// Media Preview Service
export { MediaPreviewService } from "./media-preview-service"
// Media Processor Service
export { MediaProcessorService } from "./media-processor-service"
// Media Restoration
export * from "./media-restoration-service"
export type { ProxyGenerationOptions, ProxyGenerationResult, ProxyQuality, ProxyResolution } from "./proxy-generator"
// Proxy Generator
export { getProxyGenerator, ProxyGeneratorService } from "./proxy-generator"
export type {
  DateFormat,
  MediaGroup,
  OrganizationResult,
  OrganizeByCameraOptions,
  OrganizeByDateOptions,
  OrganizeByEventsOptions,
} from "./smart-organization"
// Smart Organization
export { getSmartOrganization, SmartOrganizationService } from "./smart-organization"
export type { WaveformData, WaveformOptions, WaveformResult } from "./waveform-generator"
// Waveform Generator
export { getWaveformGenerator, WaveformGeneratorService } from "./waveform-generator"
