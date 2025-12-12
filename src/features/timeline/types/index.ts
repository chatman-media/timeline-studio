/**
 * Timeline Feature Types
 *
 * АРХИТЕКТУРА ИМПОРТОВ (FEOD/DDD):
 * 1. Domain types - импортируем ТОЛЬКО из @/domains/video-editing/types
 * 2. UI-only types - локальные типы для UI компонентов
 * 3. NO DUPLICATION - не дублируем domain типы здесь!
 */

// ============================================================================
// DOMAIN TYPES - Реэкспорт из domain layer (CANONICAL SOURCE)
// ============================================================================

export type {
  // Core timeline types
  Timeline,
  Section,
  Track,
  TimelineClip,
  TimelineKeyframe,
  TimelineMarker,
  TimelineSettings,
  TimelineResources,
  TrackType,

  // Applied resources
  AppliedEffect,
  AppliedFilter,
  AppliedTransition,

  // Supporting types
  VideoFadeKeyframe,

  // Media types
  MediaFile,
} from "@/domains/video-editing/types"

// Aliases for backward compatibility (deprecated - use domain names directly)
export type {
  Timeline as TimelineProject,
  Section as TimelineSection,
  Track as TimelineTrack,
} from "@/domains/video-editing/types"

// ============================================================================
// UI-ONLY TYPES - Локальные типы для UI слоя
// ============================================================================

// UI State
export * from "./ui"

// Edit modes and operations
export * from "./edit-modes"

// Drag & Drop
export * from "./drag-drop"

// Specialized features (TODO: migrate to domain)
export * from "./clip-groups"
export * from "./color-grading"
export * from "./edit-schema"
export * from "./jl-cuts"
export * from "./markers"
export * from "./music"
export * from "./sequence"
export * from "./speed-ramping"
export * from "./split-edit"
export * from "./subtitle-styles"
export * from "./timeline-transition"

// Factories
export * from "./factories"
