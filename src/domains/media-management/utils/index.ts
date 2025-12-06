/**
 * Media Management Utils
 *
 * Утилиты для работы с медиа файлами
 */

// Saved media utilities
export {
  generateFileId,
  calculateRelativePath,
  fileExists,
  getFileStats,
  getPlatform,
  convertToSavedMediaFile,
  convertToSavedMusicFile,
  convertFromSavedMediaFile,
  getExtensionsForFile,
  generateAlternativePaths,
  searchFilesByName,
  getAbsolutePath,
  validateFileIntegrity,
  getDefaultProjectCreationTime,
  getProjectCreationTime,
} from "./saved-media-utils"

// Media pool utilities
export {
  createEmptyMediaPool,
  addItemToPool,
  createMediaBin,
  convertMediaFileToPoolItem,
  convertSavedMediaFileToPoolItem,
  searchMediaPool,
  getItemsInBin,
  updateItemUsage,
  migrateMediaLibraryToPool,
} from "./media-pool-utils"

// Preview sizes
export {
  DEFAULT_CONTENT_SIZES,
  DEFAULT_PREVIEW_SIZE_INDEX,
  PREVIEW_SIZES,
  type PreviewSize,
  type PreviewSizeKey,
  type ContentSize,
} from "./preview-sizes"
