/**
 * Timeline Types for Video Editing
 *
 * Типы для Timeline - основные структуры временной шкалы редактирования видео
 */

import type { AppliedFilter, AppliedTransition, EffectType, FilterType, TransitionType } from "./effects"
import type { MediaFile } from "./media"
import type { AppliedEffect } from "./unified-effects"

export interface VideoFadeKeyframe {
  time: number // время в секундах относительно начала клипа
  opacity: number // значение прозрачности (0-1)
  easing?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
}

export interface Timeline {
  id: string
  name: string
  description?: string
  duration: number
  fps: number
  sampleRate: number
  sections: Section[]
  globalTracks: Track[]
  resources: TimelineResources
  settings: TimelineSettings
  createdAt: Date
  updatedAt: Date
  version: string

  // Markers for navigation and export
  markers?: TimelineMarker[]

  // Speed ramping configurations
  speedRampingConfigs?: Record<string, any>

  // BackendSync specific fields
  uiState?: TimelineUiState
  playbackState?: TimelinePlaybackState
  stateVersion?: number
  isBackendSync?: boolean
}

export interface TimelineUiState {
  selectedClipIds: string[]
  selectedTrackIds: string[]
  zoom: number
  scroll: number
  activeTool: string
}

export interface TimelinePlaybackState {
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  volume: number
  selectedMedia?: string
  source?: string
}

export interface TimelineSettings {
  resolution: { width: number; height: number }
  fps: number
  aspectRatio: string
  sampleRate: number
  channels: number
  bitDepth: number
  timeFormat: "timecode" | "frames" | "seconds"
  snapToGrid: boolean
  gridSize: number
  autoSave: boolean
  autoSaveInterval: number
}

export interface Section {
  id: string
  index: number
  name: string
  startTime: number
  endTime: number
  duration: number
  tracks: Track[]
  isCollapsed: boolean
  color?: string
  tags?: string[]
  realStartTime?: Date
  realEndTime?: Date
}

export interface Track {
  id: string
  name: string
  type: TrackType
  order: number
  clips: TimelineClip[]

  // Transitions on track
  transitions: string[]

  // State flags (dual naming for backward compatibility)
  muted?: boolean
  solo?: boolean
  locked?: boolean
  expanded?: boolean
  isLocked: boolean
  isMuted: boolean
  isHidden: boolean
  isSolo: boolean

  // Visual
  height: number
  color?: string

  // Audio
  volume: number
  pan: number

  // Track resources
  trackEffects: AppliedEffect[]
  trackFilters: AppliedFilter[]

  // Hierarchy
  sectionId?: string
  parentTrackId?: string
}

export type TrackType = "video" | "audio" | "image" | "title" | "subtitle" | "music" | "voiceover" | "sfx" | "ambient"

export interface VideoFadeKeyframe {
  time: number // время в секундах относительно начала клипа
  opacity: number // значение прозрачности (0-1)
  easing?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
}

export interface TimelineClip {
  id: string
  name: string
  type?: "video" | "audio" | "image" | "subtitle" | "title"
  mediaId: string
  mediaFile?: MediaFile
  trackId: string
  startTime: number
  duration: number
  sourceIn?: number
  sourceOut?: number

  // Media timing
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  mediaDuration?: number

  // Playback
  playbackRate?: number
  speed: number
  isReversed: boolean
  maintainPitch?: boolean

  // State
  isSelected: boolean
  isLocked: boolean
  isMuted?: boolean

  // Audio
  volume: number

  // Visual
  opacity: number
  position?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    scaleX: number
    scaleY: number
  }

  // Resources
  effects: AppliedEffect[]
  filters: AppliedFilter[]
  transitions: AppliedTransition[]

  // J-Cut / L-Cut support
  audioOffset?: number
  linkedClipId?: string
  isLinked?: boolean

  // Multicam template support
  templateId?: string // ID шаблона для многокамерной раскладки
  templateCell?: number // Индекс ячейки в шаблоне (0-based)
  multicamOrder?: number // Порядок угла в мультикамерной группе (0-based)

  // Video fade эффекты
  fadeIn?: {
    duration: number // Длительность fade-in в секундах
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: VideoFadeKeyframe[]
  }

  fadeOut?: {
    duration: number // Длительность fade-out в секундах
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: VideoFadeKeyframe[]
  }

  // Keyframes для анимации opacity
  opacityKeyframes?: VideoFadeKeyframe[]

  // Keyframe анимации
  keyframes?: TimelineKeyframe[]

  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Базовый тип для переходов на таймлайне
 * Использует generic для parameters для совместимости с feature типами
 */
export interface TimelineTransitionBase<TParams = Record<string, any>> {
  id: string
  transitionId: string
  type: "between" | "in" | "out" | "adjustment"

  // Позиционирование
  position: number // Позиция на таймлайне в секундах
  duration: number // Длительность

  // Связи с клипами
  startClipId?: string // ID начального клипа
  endClipId?: string // ID конечного клипа
  trackId: string // ID трека

  // Параметры - generic для совместимости с feature типами
  parameters: TParams
  keyframes: TimelineKeyframe[]

  // Кривая перехода - опциональна для обратной совместимости
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

  // Состояние
  isEnabled: boolean
  isLocked: boolean
  renderCache?: any

  // Legacy поля для обратной совместимости с feature типом
  name?: string
  createdAt?: Date
  updatedAt?: Date
  startTime?: number
}

/**
 * Default TimelineTransition с Record<string, any> параметрами
 * Для обратной совместимости
 */
export type TimelineTransition = TimelineTransitionBase<Record<string, any>>

export interface TimelineKeyframe {
  id: string
  time: number
  property: string
  value: any
  interpolation: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "bezier" | "step"
}

export interface TimelineMarker {
  id: string
  name: string
  time: number
  color?: string
  type?: "chapter" | "section" | "note" | "export" | "todo" | "sync" | "cue" | "important" | "warning" | "timeline"
  description?: string
  metadata?: Record<string, any>
  projectId?: string
}

export interface TimelineResources {
  effects: any[] // BaseEffect[] - full effect objects (any to avoid circular dependencies)
  filters: any[] // VideoFilter[] - full filter objects
  transitions: any[] // Transition[] - full transition objects
  timelineTransitions?: TimelineTransition[]
  templates?: any[] // MediaTemplate[] - full template objects
  styleTemplates?: any[] // StyleTemplate[] - full style template objects
  subtitleStyles?: SubtitleStyleType[]
  music: any[] // MusicFile[] - full music file objects
  media: MediaFile[]
}

// Additional resource types
export interface TemplateType {
  id: string
  name: string
  category: string
  duration: number
  tracks: Track[]
}

export interface StyleTemplateType {
  id: string
  name: string
  category: string
  effects: EffectType[]
  transitions: TransitionType[]
}

export interface SubtitleStyleType {
  id: string
  name: string
  fontFamily: string
  fontSize: number
  color: string
  backgroundColor?: string
}

export interface MusicType {
  id: string
  name: string
  artist?: string
  duration: number
  genre?: string
  file: MediaFile
}

// Re-export types from unified-effects for compatibility
export type { EffectParameter } from "./unified-effects"

// Note: EffectType, FilterType, TransitionType are deprecated
// Use BaseEffect from unified-effects instead
