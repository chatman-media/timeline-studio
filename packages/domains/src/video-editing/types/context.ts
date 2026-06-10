/**
 * Video Editing Context and Service Types
 *
 * Типы для контекста редактирования видео и сервисов
 */

import type { EffectParameter, TransitionParameters, VideoEffect } from "./effects"
import type { Section, Timeline, Track } from "./timeline"

// Video editing orchestrator context
export interface VideoEditingContext {
  // Timeline state
  timeline: Timeline | null
  selectedTrack: string | null
  selectedSection: string | null

  // Player state
  currentTime: number
  duration: number
  isPlaying: boolean
  playbackRate: number
  volume: number

  // Effects state
  activeEffects: VideoEffect[]
  previewingEffect: VideoEffect | null

  // Transitions state
  activeTransitions: Map<string, TransitionParameters>

  // Rendering state
  isRendering: boolean
  renderProgress: number
  renderError: string | null

  // Selection and editing
  selectedRange: { start: number; end: number } | null
  clipboard: Section[] | null
  undoStack: Timeline[]
  redoStack: Timeline[]
}

// Video editing events
export type VideoEditingEvent =
  // Timeline events
  | { type: "LOAD_TIMELINE"; timeline: Timeline }
  | { type: "UPDATE_TIMELINE"; updates: Partial<Timeline> }
  | { type: "ADD_TRACK"; track: Track }
  | { type: "REMOVE_TRACK"; trackId: string }
  | { type: "ADD_SECTION"; trackId: string; section: Section }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "UPDATE_SECTION"; sectionId: string; updates: Partial<Section> }
  | { type: "MOVE_SECTION"; sectionId: string; newTrackId: string; newStartTime: number }

  // Player events
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SEEK"; time: number }
  | { type: "SET_PLAYBACK_RATE"; rate: number }
  | { type: "SET_VOLUME"; volume: number }

  // Effect events
  | { type: "APPLY_EFFECT"; sectionId: string; effect: VideoEffect }
  | { type: "REMOVE_EFFECT"; sectionId: string; effectId: string }
  | { type: "UPDATE_EFFECT"; sectionId: string; effectId: string; parameters: EffectParameter[] }
  | { type: "PREVIEW_EFFECT"; effect: VideoEffect }
  | { type: "STOP_EFFECT_PREVIEW" }

  // Transition events
  | { type: "ADD_TRANSITION"; fromSectionId: string; toSectionId: string; transition: TransitionParameters }
  | { type: "REMOVE_TRANSITION"; transitionId: string }
  | { type: "UPDATE_TRANSITION"; transitionId: string; parameters: TransitionParameters }

  // Rendering events
  | { type: "START_RENDER"; settings: RenderSettings }
  | { type: "CANCEL_RENDER" }
  | { type: "RENDER_PROGRESS"; progress: number }
  | { type: "RENDER_COMPLETE"; outputPath: string }
  | { type: "RENDER_ERROR"; error: string }

  // Selection events
  | { type: "SELECT_TRACK"; trackId: string }
  | { type: "SELECT_SECTION"; sectionId: string }
  | { type: "SELECT_RANGE"; start: number; end: number }
  | { type: "CLEAR_SELECTION" }

  // Edit operations
  | { type: "CUT" }
  | { type: "COPY" }
  | { type: "PASTE" }
  | { type: "DELETE" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SPLIT_SECTION"; sectionId: string; time: number }
  | { type: "TRIM_SECTION"; sectionId: string; start?: number; end?: number }

// Render settings
export interface RenderSettings {
  outputPath: string
  format: "mp4" | "webm" | "mov" | "avi"
  resolution: { width: number; height: number }
  fps: number
  bitrate: number
  codec: string
  quality: "low" | "medium" | "high" | "ultra"
  includeAudio: boolean
  audioCodec?: string
  audioBitrate?: number
}

// Video editing service interface
export interface VideoEditingService {
  // Timeline operations
  loadTimeline(timeline: Timeline): void
  saveTimeline(): Promise<void>
  addTrack(track: Track): void
  removeTrack(trackId: string): void
  addSection(trackId: string, section: Section): void
  removeSection(sectionId: string): void
  updateSection(sectionId: string, updates: Partial<Section>): void
  moveSection(sectionId: string, newTrackId: string, newStartTime: number): void

  // Playback control
  play(): void
  pause(): void
  stop(): void
  seek(time: number): void
  setPlaybackRate(rate: number): void
  setVolume(volume: number): void

  // Effects
  applyEffect(sectionId: string, effect: VideoEffect): void
  removeEffect(sectionId: string, effectId: string): void
  updateEffect(sectionId: string, effectId: string, parameters: EffectParameter[]): void

  // Transitions
  addTransition(fromSectionId: string, toSectionId: string, transition: TransitionParameters): void
  removeTransition(transitionId: string): void
  updateTransition(transitionId: string, parameters: TransitionParameters): void

  // Rendering
  startRender(settings: RenderSettings): Promise<string>
  cancelRender(): void

  // Edit operations
  cut(): void
  copy(): void
  paste(): void
  delete(): void
  undo(): void
  redo(): void
  splitSection(sectionId: string, time: number): void
  trimSection(sectionId: string, start?: number, end?: number): void
}
