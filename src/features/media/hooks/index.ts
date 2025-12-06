/**
 * Media Feature Hooks
 *
 * UI-oriented hooks for media features.
 * Business logic hooks moved to @/domains/media-management
 */

// UI-only hooks (остаются в features)
export * from "./use-file-selection"

// Re-export domain hooks for convenience
export {
  // Core domain hooks
  useMediaImport,
  useFileOperations,
  useMediaManagement,
  useMediaMetadata,
  // Media processing and preview hooks
  useAutoProxy,
  useCacheStatistics,
  useFramePreview,
  useMediaPreview,
  useMediaProcessor,
  useMediaRestoration,
  usePreviewPreloader,
  useSimpleMediaProcessor,
} from "@/domains/media-management"
