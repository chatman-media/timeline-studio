/**
 * Video Editing Domain Types
 *
 * Центральное место для всех типов Video Editing домена
 */

export * from "./context"
// Note: effects.ts is deprecated, use unified-effects.ts instead
// But we still need to export VideoEffect and AppliedFilter for backward compatibility
export type {
  VideoEffect,
  AppliedFilter,
  AppliedTransition,
  FilterType,
  TransitionDirection,
  TransitionEasing,
} from "./effects"

// Core types - экспорт из специализированных файлов
export * from "./media"
export * from "./player"
export * from "./timeline"

// Video compiler types (moved from src/shared/types)
// Export all from video-compiler EXCEPT conflicting Transition types
export {
  AlignX,
  AlignY,
  AnimationDirection,
  AnimationEasing,
  AnimationType,
  AspectRatio,
  CompilerFilterType,
  CompilerTemplateType,
  FitMode,
  FontWeight,
  ObjectFit,
  StyleElementType,
  StyleTemplateCategory,
  StyleTemplateStyle,
  SubtitleAlignX,
  SubtitleAlignY,
  SubtitleAnimationType,
  SubtitleDirection,
  SubtitleEasing,
  SubtitleFontWeight,
  TextAlign,
  toRustEnumCase,
} from "./video-compiler"

export type {
  CacheStats,
  Clip as BackendClip,
  CompilerEffectParameter,
  CompilerFilter,
  CompilerSettings,
  CompilerTemplate,
  CompilerTemplateCell,
  CompilerTimeline,
  CompilerTrack,
  CompilerTrackType,
  ElementAnimation,
  ElementTiming,
  ExportProjectSettings,
  ExportSettings,
  FfmpegCapabilities,
  GpuCapabilities,
  GpuInfo,
  Position2D,
  PreviewSettings,
  ProjectMetadata,
  ProjectSchema,
  Size2D,
  StyleElementProperties,
  StyleTemplate as BackendStyleTemplate,
  StyleTemplateElement,
  Subtitle as BackendSubtitle,
  SubtitleAnimation as BackendSubtitleAnimation,
  SubtitlePosition as BackendSubtitlePosition,
  SubtitleStyle as BackendSubtitleStyle,
  SystemInfo,
  Transition as CompilerTransition,
  TransitionCategory,
  TransitionComplexity,
  TransitionDuration,
  TransitionTag,
} from "./video-compiler"

// Re-export enums and types from video-compiler
export { GpuEncoder, OutputFormat, RenderStatus } from "./video-compiler"
export type { RenderJob, RenderProgress } from "./video-compiler"

// Unified effects system (canonical source)
export * from "./unified-effects"
export * from "./filters"
export * from "./transitions"

// Re-export subtitle types without aliases for direct imports
export type {
  Subtitle,
  SubtitleAnimation,
  SubtitlePosition,
  SubtitleStyle,
} from "./video-compiler"

// Re-export other types needed by consumers
export type {
  AppliedTransition,
  FilterType,
  TransitionDirection,
  TransitionEasing,
} from "./effects"
