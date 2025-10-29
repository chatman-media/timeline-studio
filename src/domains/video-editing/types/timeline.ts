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
  muted: boolean
  solo: boolean
  locked: boolean
  height: number
  expanded: boolean
  volume: number
  pan: number
  color?: string
}

export type TrackType = "video" | "audio" | "title" | "music" | "voiceover" | "sfx" | "ambient"

export interface TimelineClip {
  id: string
  name: string
  mediaId: string
  mediaFile?: MediaFile
  trackId: string
  startTime: number
  duration: number
  sourceIn: number
  sourceOut: number
  playbackRate: number
  isSelected: boolean
  isLocked: boolean
  isMuted: boolean
  volume: number
  opacity: number
  position: {
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
  timelineTransitions?: TimelineTransition[]
  templates?: TemplateType[]
  styleTemplates?: StyleTemplateType[]
  subtitleStyles?: SubtitleStyleType[]
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
  artist?: string
  duration: number
  genre?: string
  file: MediaFile
}

// Re-export types from effects for compatibility
export type { EffectParameter, EffectType, FilterType, TransitionType } from "./effects"