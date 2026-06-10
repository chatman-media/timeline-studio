export type EffectCategory =
  | "color_correction"
  | "color_grading"
  | "color_match"
  | "luts"
  | "blur_sharpen"
  | "stylize"
  | "distort"
  | "lighting"
  | "noise_grain"
  | "transform"
  | "keying"
  | "motion"
  | "temporal"
  | "audio_effects"
  | "text_graphics"
  | "transitions"

export type EffectScope = "clip" | "track" | "sequence" | "global"
export type EffectProcessingType = "realtime" | "render" | "hybrid"
export type ParameterType =
  | "number"
  | "boolean"
  | "color"
  | "point"
  | "angle"
  | "dropdown"
  | "file"
  | "text"
  | "keyframes"

export interface EffectParameter {
  id: string
  name: {
    en: string
    ru: string
    [key: string]: string
  }
  type: ParameterType
  defaultValue: any
  currentValue?: any
  min?: number
  max?: number
  step?: number
  unit?: string
  options?: Array<{
    value: any
    label: {
      en: string
      ru: string
      [key: string]: string
    }
  }>
  group?: string
  visible?: boolean
  enabled?: boolean
  animatable?: boolean
  keyframes?: EffectKeyframe[]
}

export interface EffectKeyframe {
  time: number
  value: any
  interpolation?: "linear" | "bezier" | "ease" | "hold"
  inTangent?: { x: number; y: number }
  outTangent?: { x: number; y: number }
}

export interface BaseEffect {
  id: string
  name: {
    en: string
    ru: string
    [key: string]: string
  }
  description?: {
    en: string
    ru: string
    [key: string]: string
  }
  category: EffectCategory
  scope: EffectScope[]
  processingType: EffectProcessingType
  version: string
  minVersion?: string
  tags: string[]
  author?: string
  license?: string
  complexity: "low" | "medium" | "high" | "extreme"
  gpuAccelerated: boolean
  parameters: EffectParameter[]
  presets: EffectPreset[]
  thumbnail?: string
  preview?: string
  processors: {
    webgl?: WebGLProcessor
    css?: CSSProcessor
    ffmpeg?: FFmpegProcessor
    canvas?: CanvasProcessor
  }
}

export interface WebGLProcessor {
  vertexShader?: string
  fragmentShader: string
  uniforms: Record<string, any>
  textures?: string[]
}

export interface CSSProcessor {
  filter: (params: Record<string, any>) => string
  transform?: (params: Record<string, any>) => string
  additionalStyles?: (params: Record<string, any>) => Record<string, string>
}

export interface FFmpegProcessor {
  filter: (params: Record<string, any>) => string
  complex?: boolean
  inputs?: number
}

export interface CanvasProcessor {
  process: (ctx: CanvasRenderingContext2D, params: Record<string, any>, frame: ImageData) => ImageData
}

export interface EffectPreset {
  id: string
  name: {
    en: string
    ru: string
    [key: string]: string
  }
  description?: {
    en: string
    ru: string
    [key: string]: string
  }
  parameters: Record<string, any>
  thumbnail?: string
  tags: string[]
  category?: string
  isUserPreset?: boolean
  createdAt?: Date
  modifiedAt?: Date
}

export interface AppliedEffect {
  id: string
  effectId: string
  startTime: number
  duration?: number
  parameters: Record<string, any>
  enabled: boolean
  order: number
  keyframes: Record<string, EffectKeyframe[]>
  masks: EffectMask[]
  blendMode: BlendMode
  opacity: number
  label?: string
  color?: string
  notes?: string
  effectVersion: string
  createdAt: Date
  modifiedAt: Date
}

export interface EffectMask {
  id: string
  name: string
  type: "rectangle" | "ellipse" | "polygon" | "bezier" | "freehand" | "gradient"
  points: Array<{ x: number; y: number }>
  feather: number
  opacity: number
  invert: boolean
  keyframes: Record<string, EffectKeyframe[]>
}

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft_light"
  | "hard_light"
  | "color_dodge"
  | "color_burn"
  | "darken"
  | "lighten"
  | "difference"
  | "exclusion"

export interface EffectStack {
  id: string
  name?: string
  effects: AppliedEffect[]
  groups: EffectGroup[]
  enabled: boolean
  collapsed?: boolean
}

export interface EffectGroup {
  id: string
  name: string
  effectIds: string[]
  enabled: boolean
  collapsed: boolean
  opacity: number
  blendMode: BlendMode
}

export interface EffectCache {
  maxMemoryMB: number
  maxDiskMB: number
  strategy: "memory" | "disk" | "hybrid"
  hits: number
  misses: number
  evictions: number
}

export interface EffectExportData {
  version: string
  effects: BaseEffect[]
  presets: EffectPreset[]
  metadata: {
    exportedAt: Date
    exportedBy?: string
    description?: string
  }
}

export interface EffectImportData {
  version: string
  effects: BaseEffect[]
  presets: EffectPreset[]
  metadata: {
    importedAt: Date
    importedBy?: string
    description?: string
  }
}

export type EffectEventType =
  | "parameter_changed"
  | "effect_applied"
  | "effect_removed"
  | "preset_applied"
  | "keyframe_added"
  | "keyframe_removed"
  | "mask_added"
  | "mask_removed"

export interface EffectEvent {
  type: EffectEventType
  effectId: string
  appliedEffectId?: string
  parameterId?: string
  oldValue?: any
  newValue?: any
  timestamp: Date
}

export type EffectEventCallback = (event: EffectEvent) => void

export interface UserPreset {
  id: string
  effectId: string
  name: string
  description?: string
  params: Record<string, any>
  tags?: string[]
  createdAt: string
  updatedAt: string
  favorite?: boolean
}
