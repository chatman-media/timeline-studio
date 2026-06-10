import type { AppliedEffect, AppliedFilter, AppliedTransition } from "./effects"
import type { MediaFile } from "./media"
import type { TimelineTransition } from "./transitions"

export type TrackType = "video" | "audio" | "image" | "title" | "subtitle" | "music" | "voiceover" | "sfx" | "ambient"

export type FadeCurve = "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"

export interface VideoFadeKeyframe {
  time: number
  opacity: number
  easing?: FadeCurve
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
  markers?: TimelineMarker[]
  speedRampingConfigs?: Record<string, any>
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
  transitions: string[]
  muted?: boolean
  solo?: boolean
  locked?: boolean
  expanded?: boolean
  isLocked: boolean
  isMuted: boolean
  isHidden: boolean
  isSolo: boolean
  height: number
  color?: string
  volume: number
  pan: number
  trackEffects: AppliedEffect[]
  trackFilters: AppliedFilter[]
  sectionId?: string
  parentTrackId?: string
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
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  mediaDuration?: number
  playbackRate?: number
  speed: number
  isReversed: boolean
  maintainPitch?: boolean
  isSelected: boolean
  isLocked: boolean
  isMuted?: boolean
  volume: number
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
  effects: AppliedEffect[]
  filters: AppliedFilter[]
  transitions: AppliedTransition[]
  audioOffset?: number
  linkedClipId?: string
  isLinked?: boolean
  templateId?: string
  templateCell?: number
  multicamOrder?: number
  fadeIn?: {
    duration: number
    type?: FadeCurve
    keyframes?: VideoFadeKeyframe[]
  }
  fadeOut?: {
    duration: number
    type?: FadeCurve
    keyframes?: VideoFadeKeyframe[]
  }
  opacityKeyframes?: VideoFadeKeyframe[]
  keyframes?: TimelineKeyframe[]
  createdAt: Date
  updatedAt: Date
  [key: string]: any
}

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
  effects: any[]
  filters: any[]
  transitions: any[]
  timelineTransitions?: TimelineTransition[]
  templates?: any[]
  styleTemplates?: any[]
  subtitleStyles?: SubtitleStyleType[]
  music: any[]
  media: MediaFile[]
}

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
  effects: Array<{
    id: string
    name: string
    category: string
    parameters: any[]
  }>
  transitions: Array<{
    id: string
    name: string
    category: string
  }>
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
