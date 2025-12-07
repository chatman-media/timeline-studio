/**
 * Типы перемещены в @/domains/shared/types/resources
 * Реэкспортируются здесь для обратной совместимости
 */

export type {
  EffectResource,
  FilterResource,
  MediaResource,
  MusicResource,
  Resource,
  ResourceType,
  StyleTemplateResource,
  SubtitleResource,
  TemplateResource,
  TimelineResource,
  TransitionResource,
} from "@/domains/shared/types/resources"

export {
  createEffectResource,
  createFilterResource,
  createMediaResource,
  createMusicResource,
  createStyleTemplateResource,
  createSubtitleResource,
  createTemplateResource,
  createTransitionResource,
} from "@/domains/shared/types/resources"
