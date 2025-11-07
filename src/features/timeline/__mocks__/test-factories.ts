/**
 * Фабрики для создания тестовых данных
 */

import type { MediaFile } from "@/features/media/types/media"

import type {
  ProjectResources,
  TimelineClip,
  TimelineProject,
  TimelineProjectSettings,
  TimelineSection,
  TimelineTrack,
} from "../types"

/**
 * Создает mock-объект трека со всеми обязательными полями
 */
export function createMockTrack(overrides?: Partial<TimelineTrack>): TimelineTrack {
  return {
    id: "track-1",
    name: "Test Track",
    type: "video",
    clips: [],
    transitions: [],
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
    mediaStartTime: 0,
    mediaEndTime: 10,
    offset: 0,
    volume: 1,
    speed: 1,
    isReversed: false,
    opacity: 1,
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
    size: 1000000,
    duration: 60,
    width: 1920,
    height: 1080,
    lastModified: Date.now(),
    codec: "h264",
    bitrate: 5000000,
    hasAudio: true,
    hasVideo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Создает mock-объект секции
 */
export function createMockSection(overrides?: Partial<TimelineSection>): TimelineSection {
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
export function createMockProjectSettings(overrides?: Partial<TimelineProjectSettings>): TimelineProjectSettings {
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
export function createMockProjectResources(overrides?: Partial<ProjectResources>): ProjectResources {
  return {
    effects: [],
    filters: [],
    transitions: [],
    timelineTransitions: [],
    templates: [],
    styleTemplates: [],
    subtitleStyles: [],
    music: [],
    media: [],
    ...overrides,
  }
}

/**
 * Создает mock-объект проекта
 */
export function createMockProject(overrides?: Partial<TimelineProject>): TimelineProject {
  return {
    id: "project-1",
    name: "Test Project",
    duration: 300,
    fps: 30,
    sampleRate: 48000,
    settings: createMockProjectSettings(),
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
