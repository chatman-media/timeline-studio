/**
 * ProjectSchema types — contract between Rust render engine and consumers.
 *
 * Source of truth: `timeline-render --emit-schema` (JSON Schema from ts-schema Rust crate).
 * Regenerate: `bun run gen:schema-types` in the repo root.
 *
 * Safe for: CLI agents, external API consumers, frontend without Tauri runtime.
 *
 * @module @timeline/shared-types/schema
 */

// ── Core project ──────────────────────────────────────────────────────────────
export type {
  ProjectSchema,
  ProjectMetadata,
  ProjectSettings,
  // Timeline & tracks
  Timeline,
  Track,
  TrackType,
  Clip,
  ClipSource,
  ClipProperties,
  // Media
  Resolution,
  AspectRatio,
  // Effects
  Effect,
  EffectType,
  EffectCategory,
  EffectComplexity,
  EffectParameter,
  EffectPreset,
  EffectTag,
  ColorCorrection,
  CropSettings,
  // Filters
  Filter,
  FilterType,
  // Transitions
  Transition,
  TransitionCategory,
  TransitionComplexity,
  TransitionDuration,
  TransitionTag,
  // Subtitles
  Subtitle,
  SubtitleStyle,
  SubtitlePosition,
  SubtitleAnimation,
  SubtitleAnimationType,
  SubtitleAlignX,
  SubtitleAlignY,
  SubtitleDirection,
  SubtitleEasing,
  SubtitleFontWeight,
  SubtitlePadding,
  // Style templates
  StyleTemplate,
  StyleTemplateCategory,
  StyleTemplateElement,
  StyleTemplateStyle,
  StyleElementType,
  StyleElementProperties,
  ElementStyle,
  ElementAnimation,
  ElementTiming,
  // Templates
  Template,
  TemplateCell,
  TemplateRegion,
  TemplateType,
  // Export & output
  ExportSettings,
  OutputSettings,
  OutputFormat,
  PreviewSettings,
  PreviewFormat,
  // Geometry & layout
  Position2D,
  Size2D,
  ObjectFit,
  FitMode,
  AlignX,
  AlignY,
  TextAlign,
  AnimationType,
  AnimationDirection,
  AnimationEasing,
  // Typography
  FontStyle,
  FontWeight,
  ShadowProperties,
  // Transform
  TransformSettings,
  ShapeType,
} from "../../../src/types/contracts/project-schema"
