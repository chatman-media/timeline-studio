/**
 * Media Management Utils
 *
 * Утилиты для работы с медиа файлами
 */

// Media pool utilities
export {
  addItemToPool,
  convertMediaFileToPoolItem,
  convertSavedMediaFileToPoolItem,
  createEmptyMediaPool,
  createMediaBin,
  getItemsInBin,
  migrateMediaLibraryToPool,
  searchMediaPool,
  updateItemUsage,
} from "./media-pool-utils"
// Preview sizes
export {
  type ContentSize,
  DEFAULT_CONTENT_SIZES,
  DEFAULT_PREVIEW_SIZE_INDEX,
  PREVIEW_SIZES,
  type PreviewSize,
  type PreviewSizeKey,
} from "./preview-sizes"
// Saved media utilities
export {
  calculateRelativePath,
  convertFromSavedMediaFile,
  convertToSavedMediaFile,
  convertToSavedMusicFile,
  fileExists,
  generateAlternativePaths,
  generateFileId,
  getAbsolutePath,
  getDefaultProjectCreationTime,
  getExtensionsForFile,
  getFileStats,
  getPlatform,
  getProjectCreationTime,
  searchFilesByName,
  validateFileIntegrity,
} from "./saved-media-utils"
