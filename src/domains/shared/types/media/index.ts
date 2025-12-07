/**
 * Media Types
 *
 * Типы для медиа файлов, форматов и разрешений
 */

// Core media types
export { MediaType } from "./types"

// Media file (canonical source)
export type { MediaFile } from "./media-file"
export { MediaCodec, MediaColorSpace, isVideoFile, isAudioFile, isImageFile } from "./media-file"

// Реэкспорт resolution типов из project/settings для удобства
export type {
  COMMON_FRAMERATES,
  COMMON_RESOLUTIONS,
  ResolutionOption,
  RESOLUTIONS_16_9,
  RESOLUTIONS_1_1,
  RESOLUTIONS_21_9,
  RESOLUTIONS_4_3,
  RESOLUTIONS_4_5,
  RESOLUTIONS_9_16,
} from "../project/settings"
