/**
 * Video Editing Domain Types
 *
 * Центральное место для всех типов Video Editing домена
 */

export * from "./context"
// Note: effects.ts is deprecated, use unified-effects.ts instead
// But we still need to export VideoEffect and AppliedFilter for backward compatibility
export type {
  AppliedFilter,
  AppliedTransition,
  FilterType,
  TransitionDirection,
  TransitionEasing,
  VideoEffect,
} from "./effects"
export * from "./filters"
// Core types - экспорт из специализированных файлов
export * from "./media"
export * from "./player"
// Template types (canonical source for StyleTemplate, MediaTemplate, SubtitleStyleTemplate)
export * from "./templates"
// Aliases for backward compatibility with features layer
export type { Section as TimelineSection, Timeline as TimelineProject, Track as TimelineTrack } from "./timeline"
export * from "./timeline"
export * from "./transitions"
// Unified effects system (canonical source)
export * from "./unified-effects"
// Re-export subtitle types without aliases for direct imports
export type {
  CacheStats,
  Clip as BackendClip,
  Clip,
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
  RenderJob,
  RenderProgress,
  Size2D,
  StyleElementProperties,
  StyleTemplate as BackendStyleTemplate,
  StyleTemplate,
  StyleTemplateElement,
  Subtitle as BackendSubtitle,
  Subtitle,
  SubtitleAnimation as BackendSubtitleAnimation,
  SubtitleAnimation,
  SubtitlePosition as BackendSubtitlePosition,
  SubtitlePosition,
  SubtitleStyle as BackendSubtitleStyle,
  SubtitleStyle,
  SystemInfo,
  Transition as CompilerTransition,
  TransitionCategory,
  TransitionComplexity,
  TransitionDuration,
  TransitionTag,
} from "./video-compiler"
// Video compiler types (moved from src/shared/types)
// Export all from video-compiler EXCEPT conflicting Transition types
// Re-export enums and types from video-compiler
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
  GpuEncoder,
  ObjectFit,
  OutputFormat,
  RenderStatus,
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
