/**
 * Media Types
 *
 * Типы для медиа файлов, форматов и разрешений
 */

// Реэкспорт resolution типов из project/settings для удобства
export type {
  COMMON_FRAMERATES,
  COMMON_RESOLUTIONS,
  RESOLUTIONS_1_1,
  RESOLUTIONS_4_3,
  RESOLUTIONS_4_5,
  RESOLUTIONS_9_16,
  RESOLUTIONS_16_9,
  RESOLUTIONS_21_9,
  ResolutionOption,
} from "../project/settings"

// Media file (canonical source)
export type { MediaFile } from "./media-file"
export { isAudioFile, isImageFile, isVideoFile, MediaCodec, MediaColorSpace } from "./media-file"
// Core media types
export { MediaType } from "./types"
