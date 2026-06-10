export type TransitionCategory =
  | "basic"
  | "advanced"
  | "creative"
  | "3d"
  | "artistic"
  | "cinematic"
  | "dynamic"
  | "glitch"
  | "light"
  | "film"
  | "motion"
  | "seamless"

export type TransitionComplexity = "basic" | "intermediate" | "advanced" | "gpu-required"
export type TransitionDirection = "left" | "right" | "up" | "down" | "center" | "radial"
export type TransitionEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce"

export interface TransitionDuration {
  min: number
  max: number
  default: number
}

export interface TransitionParameter {
  direction?: TransitionDirection
  easing?: TransitionEasing
  intensity?: number
  scale?: number
  smoothness?: number
  blur?: {
    enabled?: boolean
    amount?: number
    type?: "gaussian" | "motion" | "radial"
  }
  color?: {
    enabled?: boolean
    tint?: string
    saturation?: number
    brightness?: number
  }
  perspective?: {
    enabled?: boolean
    rotationX?: number
    rotationY?: number
    rotationZ?: number
  }
}

export interface TransitionPreset {
  id: string
  transitionId: string
  name: string
  parameters: TransitionParameter
}

export type TransitionType = string
export type TransitionTag =
  | "zoom"
  | "scale"
  | "smooth"
  | "fade"
  | "opacity"
  | "classic"
  | "slide"
  | "movement"
  | "direction"
  | "size"
  | "transform"
  | "rotate"
  | "spin"
  | "flip"
  | "mirror"
  | "push"
  | "displacement"
  | "squeeze"
  | "compress"
  | "elastic"
  | "diagonal"
  | "angle"
  | "spiral"
  | "rotation"
  | "3d"
  | "complex"
  | "fallback"
  | "wipe"
  | "horizontal"
  | "vertical"
  | "radial"
  | "circular"
  | "center"
  | "cube"
  | "page"
  | "turn"
  | "book"
  | "creative"
  | "ripple"
  | "water"
  | "wave"
  | "distortion"
  | "pixel"
  | "digital"
  | "retro"
  | "8bit"
  | "dissolve"
  | "noise"
  | "morph"
  | "fluid"
  | "glitch"
  | "modern"
  | "kaleidoscope"
  | "geometric"
  | "artistic"
  | "shatter"
  | "break"
  | "glass"
  | "dramatic"
  | "burn"
  | "fire"
  | "cinematic"
  | "blinds"
  | "stripes"
  | "iris"
  | "camera"
  | "swirl"
  | "twist"
  | "blur"
  | "motion"
  | "speed"
  | "tv"
  | "static"
  | "analog"

export interface Transition {
  id: string
  type: string
  name?: string
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  }
  description: {
    ru: string
    en: string
  }
  category: TransitionCategory
  complexity: TransitionComplexity
  tags: TransitionTag[]
  duration: TransitionDuration
  parameters?: TransitionParameter
  ffmpegCommand: (params: { fps: number; width?: number; height?: number; scale?: number; duration?: number }) => string
  previewPath?: string
  gpuAccelerated?: boolean
  webglShader?: string
}

export interface TimelineKeyframe {
  id: string
  time: number
  property: string
  value: any
  interpolation: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "bezier" | "step"
}

export interface TimelineTransitionBase<TParams = Record<string, any>> {
  id: string
  transitionId: string
  type: "between" | "in" | "out" | "adjustment"
  position: number
  duration: number
  startClipId?: string
  endClipId?: string
  trackId: string
  parameters: TParams
  keyframes: TimelineKeyframe[]
  curve?: {
    type: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "custom" | "bounce"
    points: Array<{
      id: string
      x: number
      y: number
      handleIn?: { x: number; y: number }
      handleOut?: { x: number; y: number }
    }>
    presets?: {
      name: string
      description?: string
    }
  }
  isEnabled: boolean
  isLocked: boolean
  renderCache?: any
  name?: string
  createdAt?: Date
  updatedAt?: Date
  startTime?: number
}

export type TimelineTransition = TimelineTransitionBase<Record<string, any>>
