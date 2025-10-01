/**
 * Effects and Transitions Types for Video Editing
 *
 * Типы для эффектов, фильтров и переходов в видеоредакторе
 */

export interface AppliedEffect {
  id: string
  effectId: string
  name: string
  enabled: boolean
  parameters: Record<string, any>
  keyframes: TimelineKeyframe[]
}

export interface AppliedFilter {
  id: string
  filterId: string
  name: string
  enabled: boolean
  parameters: Record<string, any>
  keyframes: TimelineKeyframe[]
}

export interface AppliedTransition {
  id: string
  transitionId: string
  name: string
  type: "in" | "out" | "cross"
  duration: number
  parameters: Record<string, any>
  isEnabled: boolean
}

export interface TimelineKeyframe {
  id: string
  time: number
  value: any
  interpolation: "linear" | "ease" | "bezier" | "step"
}

// Effect Types
export interface EffectType {
  id: string
  name: string
  category: string
  parameters: EffectParameter[]
}

export interface VideoEffect {
  id: string
  name: string
  category: string
  type: "filter" | "generator" | "transition"
  parameters: EffectParameter[]
  enabled: boolean
}

export interface EffectParameter {
  id: string
  name: string
  type: "number" | "string" | "boolean" | "color" | "select"
  value: any
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
}

export interface FilterType {
  id: string
  name: string
  category: string
}

export interface TransitionType {
  id: string
  name: string
  category: string
}

export interface TransitionDirection {
  from: "left" | "right" | "top" | "bottom"
  to: "left" | "right" | "top" | "bottom"
}

export interface TransitionEasing {
  type: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
}

export interface TransitionParameters {
  id: string
  type: string
  duration: number
  direction?: TransitionDirection
  easing?: TransitionEasing
}

export interface TransitionConfig {
  duration: number
  easing?: TransitionEasing
  direction?: TransitionDirection
}
