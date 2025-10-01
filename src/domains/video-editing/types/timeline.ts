/**
 * Timeline Types for Video Editing
 *
 * Типы для Timeline - основные структуры временной шкалы редактирования видео
 */

import type { AppliedEffect, AppliedFilter, AppliedTransition, EffectType, FilterType, TransitionType } from "./effects"
import type { MediaFile } from "./media"

export interface Timeline {
  id: string
  name: string
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
  name: string
  startTime: number
  endTime: number
  tracks: Track[]
  isCollapsed: boolean
  color?: string
}

export interface Track {
  id: string
  name: string
  type: TrackType
  order: number
  clips: TimelineClip[]
  transitions: TimelineTransition[]
  isLocked: boolean
  isMuted: boolean
  isHidden: boolean
  isSolo: boolean
  volume: number
  pan: number
  height: number
  trackEffects: AppliedEffect[]
  trackFilters: AppliedFilter[]
}

export type TrackType = "video" | "audio" | "subtitle" | "music" | "voiceover" | "sfx" | "ambient"

export interface TimelineClip {
  id: string
  name: string
  mediaId: string
  mediaFile?: MediaFile
  trackId: string
  startTime: number
  duration: number
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  mediaDuration: number
  volume: number
  speed: number
  isReversed: boolean
  opacity: number
  effects: AppliedEffect[]
  filters: AppliedFilter[]
  transitions: AppliedTransition[]
  isSelected: boolean
  isLocked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TimelineTransition {
  id: string
  transitionId: string
  name: string
  startTime: number
  duration: number
  parameters: Record<string, any>
  isEnabled: boolean
}

// TimelineKeyframe экспортируется из effects.ts

export interface TimelineMarker {
  id: string
  name: string
  time: number
  color: string
  description?: string
}

export interface TimelineResources {
  effects: EffectType[]
  filters: FilterType[]
  transitions: TransitionType[]
  timelineTransitions: TimelineTransition[]
  templates: TemplateType[]
  styleTemplates: StyleTemplateType[]
  subtitleStyles: SubtitleStyleType[]
  music: MusicType[]
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
  artist: string
  duration: number
  genre: string
  file: MediaFile
}

// Re-export types from effects for compatibility
export type { EffectParameter, EffectType, FilterType, TransitionType } from "./effects"
