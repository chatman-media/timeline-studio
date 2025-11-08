// Экспорт всех типов timeline
// Реэкспорт основных типов из domains для обратной совместимости
export type {
  AppliedEffect,
  AppliedFilter,
  AppliedTransition,
  Section,
  TimelineClip,
  TimelineKeyframe,
  TimelineProject,
  TimelineTransition,
  Track,
} from "@/domains/video-editing/types"

// Локальные типы и алиасы для обратной совместимости
export type { Track as TimelineTrack, Section as TimelineSection } from "@/domains/video-editing/types"

// Export TrackType from timeline.ts
export type { TrackType } from "./timeline"

export * from "./factories"
export * from "./timeline-transition"
