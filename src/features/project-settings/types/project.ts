/**
 * Типы перемещены в @/domains/shared/types/project
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
} from "@/domains/shared/types/project"

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
} from "@/domains/shared/types/project"
