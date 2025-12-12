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

// Aliases for backward compatibility (deprecated - use domain names directly)
export type {
  // Applied resources
  AppliedEffect,
  AppliedFilter,
  AppliedStyleTemplate,
  AppliedTransition,
  // Media types
  MediaFile,
  Section,
  Section as TimelineSection,
  // Core timeline types
  Timeline,
  Timeline as TimelineProject,
  TimelineClip,
  TimelineKeyframe,
  TimelineMarker,
  TimelineResources,
  TimelineResources as ProjectResources, // Legacy alias
  TimelineSettings,
  Track,
  Track as TimelineTrack,
  TrackType,
  // Supporting types
  VideoFadeKeyframe,
} from "@/domains/video-editing/types"

// ============================================================================
// UI-ONLY TYPES - Локальные типы для UI слоя
// ============================================================================

// Specialized features (TODO: migrate to domain)
export * from "./clip-groups"
export * from "./color-grading"

// Drag & Drop
export * from "./drag-drop"
// Edit modes and operations
export * from "./edit-modes"
export * from "./edit-schema"
// Factories
export * from "./factories"
export * from "./jl-cuts"
export * from "./markers"
export * from "./music"
export * from "./sequence"
export * from "./speed-ramping"
export * from "./split-edit"
export * from "./subtitle-styles"
export * from "./timeline-transition"
// UI State
export * from "./ui"
