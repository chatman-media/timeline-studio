/**
 * Media Feature Hooks
 *
 * UI-oriented hooks for media features.
 * Domain-backed media hooks are exposed through ./media-management.
 */

export {
  getMediaFiles,
  getMediaMetadata,
  selectAudioFile,
  selectMediaDirectory,
  useAutoProxy,
  useCacheStatistics,
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
} from "./media-management"
// UI-only hooks (остаются в features)
export * from "./use-file-selection"
