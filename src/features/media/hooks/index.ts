/**
 * Media Feature Hooks
 *
 * UI-oriented hooks for media features.
 * Business logic hooks moved to @/domains/media-management
 */

// Re-export domain hooks for convenience
export {
  // Media processing and preview hooks
  useAutoProxy,
  useCacheStatistics,
  useFileOperations,
  useFramePreview,
  // Core domain hooks
  useMediaImport,
  useMediaManagement,
  useMediaMetadata,
  useMediaPreview,
  useMediaProcessor,
  useMediaRestoration,
  usePreviewPreloader,
  useSimpleMediaProcessor,
} from "@/domains/media-management"
// UI-only hooks (остаются в features)
export * from "./use-file-selection"
