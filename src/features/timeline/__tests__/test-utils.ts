import { MediaType } from "@timeline-studio/domains/media-management"
import type { MediaFile, TimelineClip, Track, TrackType } from "@timeline-studio/domains/video-editing/types"

// Test data creation utilities

export const createMockMediaFile = (id = "media-1"): MediaFile => ({
  id,
  name: "test-video.mp4",
  path: "/path/to/test-video.mp4",
  duration: 100,
  size: 1000000,
  createdAt: new Date(),
  updatedAt: new Date(),
  type: MediaType.Video,
})

export const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  type: "video",
  mediaId: "media-1",
  mediaFile: createMockMediaFile("media-1"),
  trackId: "track-1",
  startTime: 10,
  duration: 20,
  sourceIn: 5,
  sourceOut: 25,
  mediaStartTime: 5,
  mediaEndTime: 25,
  offset: 0,
  volume: 1,
  speed: 1,
  playbackRate: 1,
  isReversed: false,
  opacity: 1,
  isMuted: false,
  position: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
  effects: [],
  filters: [],
  transitions: [],
  isSelected: false,
  isLocked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Alias for createMockClip to match test expectations
export const createMockTimelineClip = createMockClip

export const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "track-1",
  type: "video" as TrackType,
  order: 0,
  height: 100,
  name: "Video Track 1",
  clips: [],
  transitions: [],
  muted: false,
  solo: false,
  locked: false,
  expanded: true,
  isHidden: false,
  isLocked: false,
  isMuted: false,
  isSolo: false,
  volume: 1,
  pan: 0,
  trackEffects: [],
  trackFilters: [],
  ...overrides,
})

// Helper to create multiple clips
export const createMockClips = (count: number, overrides: Partial<TimelineClip> = {}): TimelineClip[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockClip({
      id: `clip-${i + 1}`,
      name: `Clip ${i + 1}`,
      startTime: i * 10,
      ...overrides,
    }),
  )
}

// Helper to create multiple tracks
export const createMockTracks = (count: number, type: TrackType = "video"): Track[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockTrack({
      id: `track-${i + 1}`,
      name: `${type} Track ${i + 1}`,
      type,
      order: i,
    }),
  )
}
