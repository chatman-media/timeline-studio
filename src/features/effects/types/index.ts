/**
 * Effects Types
 *
 * Re-export from core-facing effect contracts.
 */

// All feature-facing effect types now live in core/types.
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
} from "@timeline-studio/core/types"

// Node compositing and shader system remain in features (UI-specific)
export * from "./node-compositing"
export * from "./shader-system"
