/**
 * Video Editing Domain Events
 *
 * События домена видео редактирования
 */

// Используем базовые типы вместо импорта из timeline
export interface Clip {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  mediaId: string
  [key: string]: any
}

export interface Track {
  id: string
  name: string
  type: string
  clips: Clip[]
  [key: string]: any
}

export interface Section {
  id: string
  name: string
  startTime: number
  endTime: number
  color?: string
  [key: string]: any
}

// === Timeline Events ===

export interface TimelineCreatedEvent {
  timelineId: string
  name: string
  duration: number
  fps: number
}

export interface ClipAddedEvent {
  timelineId: string
  trackId: string
  clip: Clip
}

export interface ClipMovedEvent {
  timelineId: string
  clipId: string
  fromTrack: string
  toTrack: string
  fromTime: number
  toTime: number
}

export interface ClipTrimmedEvent {
  timelineId: string
  clipId: string
  startTime: number
  endTime: number
  duration: number
}

export interface ClipDeletedEvent {
  timelineId: string
  trackId: string
  clipId: string
}

export interface SectionCreatedEvent {
  timelineId: string
  section: Section
}

export interface TrackAddedEvent {
  timelineId: string
  track: Track
  position: number
}

export interface TrackRemovedEvent {
  timelineId: string
  trackId: string
}

export interface TimelineUpdatedEvent {
  projectId: string
  hasUnsavedChanges: boolean
  duration: number
  trackCount: number
}

export interface ClipRemovedEvent {
  timelineId: string
  clipId: string
  trackId: string
}

export interface PlaybackStateChangedEvent {
  isPlaying: boolean
  currentTime: number
  duration: number
  progress: number
}

// === Playback Events ===

export interface PlaybackStartedEvent {
  timelineId: string
  startTime: number
  playbackRate: number
}

export interface PlaybackStoppedEvent {
  timelineId: string
  stopTime: number
  duration: number
}

export interface PlaybackTimeChangedEvent {
  timelineId: string
  currentTime: number
  duration: number
}

export interface PlaybackRateChangedEvent {
  timelineId: string
  oldRate: number
  newRate: number
}

// === Effects & Filters Events ===

export interface EffectAppliedEvent {
  targetId: string // clip or track ID
  targetType: "clip" | "track" | "timeline"
  effectId: string
  effectType: string
  parameters: Record<string, any>
}

export interface EffectRemovedEvent {
  targetId: string
  targetType: "clip" | "track" | "timeline"
  effectId: string
}

export interface FilterAppliedEvent {
  targetId: string
  targetType: "clip" | "track" | "timeline"
  filterId: string
  filterType: string
  intensity: number
}

// === Export Events ===

export interface ExportStartedEvent {
  exportId: string
  timelineId: string
  format: string
  resolution: string
  fps: number
  outputPath: string
}

export interface ExportProgressEvent {
  exportId: string
  progress: number
  currentFrame: number
  totalFrames: number
  estimatedTimeRemaining: number
}

export interface ExportCompletedEvent {
  exportId: string
  outputPath: string
  fileSize: number
  duration: number
  success: boolean
  error?: string
}

// === Player Events ===

export interface MediaLoadedEvent {
  playerId: string
  mediaPath: string
  duration: number
  dimensions: {
    width: number
    height: number
  }
}

export interface FrameCapturedEvent {
  playerId: string
  timestamp: number
  outputPath: string
}

// === Event Type Constants ===

export const VIDEO_EDITING_EVENTS = {
  // Timeline
  TIMELINE_CREATED: "video.timeline.created",
  TIMELINE_UPDATED: "video.timeline.updated",
  CLIP_ADDED: "video.timeline.clip-added",
  CLIP_REMOVED: "video.timeline.clip-removed",
  CLIP_MOVED: "video.timeline.clip-moved",
  CLIP_TRIMMED: "video.timeline.clip-trimmed",
  CLIP_DELETED: "video.timeline.clip-deleted",
  SECTION_CREATED: "video.timeline.section-created",
  TRACK_ADDED: "video.timeline.track-added",
  TRACK_REMOVED: "video.timeline.track-removed",

  // Playback
  PLAYBACK_STARTED: "video.playback.started",
  PLAYBACK_STOPPED: "video.playback.stopped",
  PLAYBACK_TIME_CHANGED: "video.playback.time-changed",
  PLAYBACK_RATE_CHANGED: "video.playback.rate-changed",
  PLAYBACK_STATE_CHANGED: "video.playback.state-changed",

  // Effects
  EFFECT_APPLIED: "video.effect.applied",
  EFFECT_REMOVED: "video.effect.removed",
  FILTER_APPLIED: "video.filter.applied",

  // Export
  EXPORT_STARTED: "video.export.started",
  EXPORT_PROGRESS: "video.export.progress",
  EXPORT_COMPLETED: "video.export.completed",

  // Player
  MEDIA_LOADED: "video.player.media-loaded",
  FRAME_CAPTURED: "video.player.frame-captured",
} as const
