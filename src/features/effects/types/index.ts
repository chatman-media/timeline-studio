/**
 * Effects Types
 *
 * Re-export from canonical source in domains
 */

// All effect types now live in domains/video-editing
// Backward compatibility alias
export type {
  AppliedEffect,
  BaseEffect,
  BaseEffect as VideoEffect,
  BlendMode,
  CanvasProcessor,
  CSSProcessor,
  EffectCache,
  EffectCategory,
  EffectEvent,
  EffectEventCallback,
  EffectEventType,
  EffectExportData,
  EffectGroup,
  EffectImportData,
  EffectKeyframe,
  EffectMask,
  EffectParameter,
  EffectPreset,
  EffectProcessingType,
  EffectScope,
  EffectStack,
  FFmpegProcessor,
  ParameterType,
  WebGLProcessor,
} from "@/domains/video-editing/types/unified-effects"

// Node compositing and shader system remain in features (UI-specific)
export * from "./node-compositing"
export * from "./shader-system"
