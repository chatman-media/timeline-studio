/**
 * Video Compiler Services
 *
 * Централизованные сервисы для работы с компилятором видео
 */

// Cache Service
export {
  clearAllCache,
  clearPreviewCache,
  configureCacheSettings,
  getCacheSize,
  getCacheStats,
} from "./cache-service"
// Frame Extraction Service
export {
  ExtractionPurpose,
  FrameExtractionService,
  frameExtractionService,
  type RecognitionFrame,
  type SubtitleFrame,
  type TimelineFrame,
} from "./frame-extraction-service"

// Metadata Cache Service
export {
  cacheMediaMetadata,
  cacheMultipleMetadata,
  checkCachedFiles,
  getCachedMetadata,
  getCacheMemoryUsage,
  invalidateFileCache,
} from "./metadata-cache-service"
// Video Compiler Service
export {
  cancelRender,
  checkGpuCapabilities,
  checkGpuEncoderAvailability,
  clearMediaMetadataCache,
  clearPrerenderCache,
  generatePreview,
  getActiveJobs,
  getPrerenderCacheInfo,
  getRenderJob,
  type PrerenderCacheFile,
  type PrerenderCacheInfo,
  type PrerenderRequest,
  type PrerenderResult,
  prerenderSegment,
  renderProject,
  trackRenderProgress,
  updateCompilerSettings,
} from "./video-compiler-service"
