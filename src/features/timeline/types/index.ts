// Экспорт всех типов timeline
// Реэкспорт основных типов из domains для обратной совместимости
// Локальные типы и алиасы для обратной совместимости
export type {
  AppliedEffect,
  AppliedFilter,
  AppliedTransition,
  Section,
  Section as TimelineSection,
  Timeline as TimelineProject,
  TimelineClip,
  TimelineKeyframe,
  TimelineTransition,
  Track,
  Track as TimelineTrack,
} from "@/domains/video-editing/types"
export * from "./factories"
// Export TrackType from timeline.ts
export type { TrackType } from "./timeline"
// Export utility functions from timeline module
export { isSubtitleClip } from "./timeline"
export * from "./timeline-transition"
