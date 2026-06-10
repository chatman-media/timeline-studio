/**
 * Фабрики для создания тестовых данных
 */

import type { MediaFile, MediaType } from "@timeline-studio/core/types"
import type {
  Section,
  Timeline,
  TimelineClip,
  TimelineResources,
  TimelineSettings,
  Track,
} from "@timeline-studio/core/types/timeline"

/**
 * Создает mock-объект трека со всеми обязательными полями
 */
export function createMockTrack(overrides?: Partial<Track>): Track {
  return {
    id: "track-1",
    name: "Test Track",
    type: "video",
    clips: [],
    transitions: [],
    muted: false,
    solo: false,
    locked: false,
    expanded: true,
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: 120,
    order: 0,
    trackEffects: [],
    trackFilters: [],
    ...overrides,
  }
}

/**
 * Создает mock-объект клипа со всеми обязательными полями
 */
export function createMockClip(overrides?: Partial<TimelineClip>): TimelineClip {
  return {
    id: "clip-1",
    name: "Test Clip",
    type: "video",
    mediaId: "media-1",
    trackId: "track-1",
    startTime: 0,
    duration: 10,
    sourceIn: 0,
    sourceOut: 10,
    mediaStartTime: 0,
    mediaEndTime: 10,
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
  }
}

/**
 * Создает mock-объект медиафайла
 */
export function createMockMediaFile(overrides?: Partial<MediaFile>): MediaFile {
  return {
    id: "media-1",
    path: "/path/to/video.mp4",
    name: "test-video.mp4",
    type: "video_with_audio" as MediaType,
    size: 1000000,
    duration: 60,
    isVideo: true,
    isAudio: true,
    isImage: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Создает mock-объект секции
 */
export function createMockSection(overrides?: Partial<Section>): Section {
  return {
    id: "section-1",
    index: 0,
    name: "Test Section",
    startTime: 0,
    endTime: 60,
    duration: 60,
    isCollapsed: false,
    tracks: [],
    ...overrides,
  }
}

/**
 * Создает mock-объект настроек проекта
 */
export function createMockProjectSettings(overrides?: Partial<TimelineSettings>): TimelineSettings {
  return {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    timeFormat: "timecode",
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    autoSaveInterval: 60,
    ...overrides,
  }
}

/**
 * Создает mock-объект ресурсов проекта
 */
export function createMockProjectResources(overrides?: Partial<TimelineResources>): TimelineResources {
  return {
    effects: [],
    filters: [],
    transitions: [],
    music: [],
    media: [],
    ...overrides,
  }
}

/**
 * Создает mock-объект проекта
 */
export function createMockProject(overrides?: Partial<Timeline>): Timeline {
  const defaultSettings = createMockProjectSettings()
  return {
    id: "project-1",
    name: "Test Project",
    duration: 300,
    fps: defaultSettings.fps,
    sampleRate: defaultSettings.sampleRate,
    settings: defaultSettings,
    resources: createMockProjectResources(),
    sections: [],
    globalTracks: [],
    markers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "1.0.0",
    ...overrides,
  }
}
