/**
 * Types are exposed from core for feature-facing compatibility.
 * Реэкспортируются здесь для обратной совместимости
 */
export type {
  AspectRatio,
  AspectRatioValue,
  ColorSpace,
  FrameRate,
  ProjectFile,
  ProjectSettings,
  Resolution,
  ResolutionOption,
} from "@timeline-studio/core/types/project"

export {
  ASPECT_RATIOS,
  COLOR_SPACES,
  COMMON_FRAMERATES,
  COMMON_RESOLUTIONS,
  DEFAULT_PROJECT_SETTINGS,
  FRAME_RATES,
  getDefaultResolutionForAspectRatio,
  getResolutionsForAspectRatio,
  RESOLUTIONS_1_1,
  RESOLUTIONS_4_3,
  RESOLUTIONS_4_5,
  RESOLUTIONS_9_16,
  RESOLUTIONS_16_9,
  RESOLUTIONS_21_9,
} from "@timeline-studio/core/types/project"
