/**
 * Project Transform Utilities for BackendSync Architecture
 *
 * Преобразование состояния из Backend (единственный источник истины) в frontend представления
 * Следует принципам BackendSync:
 * - Backend ProjectState - единственный источник данных
 * - Frontend только отображает backend состояние
 * - Все изменения через ProjectCommand
 * - Реактивная синхронизация через события
 */

import { createLogger } from "@/lib/tauri-logger"
import type { Track as BackendTrack, Project, ProjectState } from "@/types/generated/state-types"
import type { ProjectCommand } from "@/types/generated/tauri-bindings"
import type { MediaFile } from "../types/media"
import type { Timeline, Track } from "../types/timeline"

const logger = createLogger("ProjectTransform")

/**
 * Преобразует ProjectState (backend) в Timeline представление для frontend
 *
 * ВАЖНО: Это только VIEW трансформация - НЕ создает новых данных!
 * Backend ProjectState остается единственным источником истины
 */
export function transformProjectStateToTimeline(projectState: ProjectState | null): Timeline | null {
  const backendProject = projectState?.project
  if (!backendProject || !backendProject.timeline) {
    return null
  }

  const backendTimeline = backendProject.timeline

  // Создаем Timeline структуру с секциями
  const timeline: Timeline = {
    id: backendProject.id,
    name: backendProject.metadata.name,
    duration: backendTimeline.duration,
    fps: backendTimeline.fps,
    sampleRate: backendTimeline.sample_rate,

    // Backend не поддерживает секции, поэтому создаем одну основную секцию
    sections: [
      {
        id: "main-section",
        index: 0,
        name: "Main",
        startTime: 0,
        endTime: backendTimeline.duration || 0,
        duration: backendTimeline.duration || 0,
        tracks: transformBackendTracks(backendTimeline.tracks),
        isCollapsed: false,
      },
    ],

    // Backend не разделяет глобальные треки, поэтому оставляем пустым
    globalTracks: [],

    // Преобразуем ресурсы - только файлы, используемые в timeline
    resources: {
      media: getUsedMediaFiles(backendProject),
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
      subtitleStyles: [],
      music: [],
    },

    // Преобразуем настройки
    settings: {
      resolution: backendProject.settings.resolution,
      fps: backendProject.settings.frame_rate,
      aspectRatio: calculateAspectRatio(backendProject.settings.resolution),
      sampleRate: backendProject.settings.audio_sample_rate,
      channels: backendProject.settings.audio_channels,
      bitDepth: 24, // Backend не хранит это значение
      timeFormat: "timecode",
      snapToGrid: true,
      gridSize: 1,
      autoSave: true,
      autoSaveInterval: 300,
    },

    createdAt: new Date(backendProject.metadata.created_at),
    updatedAt: new Date(backendProject.metadata.modified_at),
    version: backendProject.metadata.version || "1.0.0",
  }

  // Добавляем UI состояние из backend
  if (projectState?.ui_state) {
    timeline.uiState = {
      selectedClipIds: projectState.ui_state.selected_clips,
      selectedTrackIds: projectState.ui_state.selected_tracks,
      zoom: projectState.ui_state.timeline_zoom,
      scroll: projectState.ui_state.timeline_scroll,
      activeTool: projectState.ui_state.active_tool,
    }
  }

  // Добавляем состояние воспроизведения
  if (projectState?.playback_state) {
    timeline.playbackState = {
      isPlaying: projectState.playback_state.is_playing,
      currentTime: projectState.playback_state.current_time,
      playbackRate: projectState.playback_state.playback_rate,
      volume: projectState.playback_state.volume,
      selectedMedia: undefined, // TODO: добавить в backend
      source: undefined, // TODO: добавить в backend
    }
  }

  // Добавляем версию состояния для синхронизации
  timeline.stateVersion = projectState?.version || 0
  timeline.isBackendSync = true // Маркер что это BackendSync timeline

  return timeline
}

/**
 * Получает только медиа файлы, которые используются в timeline
 */
function getUsedMediaFiles(backendProject: Project): MediaFile[] {
  const usedMediaIds = new Set<string>()

  // Собираем все media_id из клипов в треках
  backendProject.timeline.tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      usedMediaIds.add(clip.media_id)
    })
  })

  // Возвращаем только используемые медиа файлы
  const allMedia = Object.values(backendProject.media_pool?.items || {})
  return allMedia
    .filter(Boolean)
    .filter((media): media is any => Boolean(media && typeof media === "object" && "id" in media))
    .filter((media) => usedMediaIds.has(media.id))
    .map((media) => ({
      ...media,
      type: mapMediaTypeToString(media.media_type) || "video", // Преобразуем media_type в type
    })) as MediaFile[]
}

/**
 * Преобразует MediaType (backend) в строку (frontend)
 */
function mapMediaTypeToString(mediaType: any): string {
  if (typeof mediaType === "string") {
    return mediaType.toLowerCase()
  }

  // Если это объект enum из backend
  if (mediaType && typeof mediaType === "object") {
    if (mediaType === "Video" || mediaType.Video !== undefined) return "video"
    if (mediaType === "Audio" || mediaType.Audio !== undefined) return "audio"
    if (mediaType === "Image" || mediaType.Image !== undefined) return "image"
  }

  return "video" // default fallback
}

/**
 * Преобразует backend треки в frontend формат
 */
function transformBackendTracks(backendTracks: BackendTrack[]): Track[] {
  return backendTracks.map((track, index) => ({
    id: track.id,
    name: track.name,
    type: mapTrackType(track.track_type),
    order: index,
    clips: track.clips.map((clip) => ({
      id: clip.id,
      name: clip.name,
      mediaId: clip.media_id,
      trackId: track.id,
      startTime: clip.timeline_in,
      duration: clip.timeline_out - clip.timeline_in,
      sourceIn: clip.source_in,
      sourceOut: clip.source_out,

      // Media timing (required fields)
      mediaStartTime: clip.source_in,
      mediaEndTime: clip.source_out,
      offset: 0,

      // Playback
      playbackRate: clip.playback_rate,
      speed: clip.playback_rate,
      isReversed: false,

      // State
      isSelected: false,
      isLocked: false,
      isMuted: !clip.enabled,

      // Audio/Visual
      volume: track.volume,
      opacity: 1,
      position: {
        x: 0.5,
        y: 0.5,
        width: 1,
        height: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },

      // Resources
      effects: (clip.effects || []).map((effectId: string) => ({
        id: effectId,
        effectId,
        name: `Effect ${effectId}`, // TODO: получить имя из backend
        enabled: true,
        parameters: {},
        keyframes: [],
      })),
      filters: [],
      transitions: (clip.transitions || []).map((t: any) => ({
        id: t.id,
        transitionId: t.transition_type,
        name: `Transition ${t.transition_type}`,
        type: "cross" as const, // TODO: определить тип из backend
        duration: t.duration,
        parameters: t.params || {},
        isEnabled: true,
      })),

      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
    })),

    // Transitions on track
    transitions: [],

    // State flags (both old and new naming)
    muted: false,
    solo: false,
    locked: track.locked,
    isLocked: track.locked,
    isMuted: false,
    isHidden: false,
    isSolo: false,

    // Visual
    height: track.height,
    expanded: true,
    color: getTrackColor(track.track_type),

    // Audio
    volume: track.volume,
    pan: track.pan,

    // Track resources
    trackEffects: [],
    trackFilters: [],
  }))
}

/**
 * Маппинг типов треков
 */
function mapTrackType(backendType: string): Track["type"] {
  const typeMap: Record<string, Track["type"]> = {
    Video: "video",
    Audio: "audio",
    Title: "title",
    Music: "music",
    Voiceover: "voiceover",
    Sfx: "sfx",
    Ambient: "ambient",
  }
  return typeMap[backendType] || "video"
}

/**
 * Получение цвета трека по типу
 */
function getTrackColor(trackType: string): string {
  const colors: Record<string, string> = {
    Video: "#3B82F6",
    Audio: "#10B981",
    Title: "#F59E0B",
    Music: "#8B5CF6",
    Voiceover: "#EC4899",
    Sfx: "#14B8A6",
    Ambient: "#06B6D4",
  }
  return colors[trackType] || "#6B7280"
}

/**
 * Вычисляет соотношение сторон
 */
function calculateAspectRatio(resolution: { width: number; height: number }): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(resolution.width, resolution.height)
  return `${resolution.width / divisor}:${resolution.height / divisor}`
}

/**
 * УСТАРЕЛО: В BackendSync архитектуре не используется!
 *
 * Вместо этого используйте ProjectCommand для всех изменений:
 * - CreateProject, SaveProject, AddClip, MoveClip, etc.
 *
 * @deprecated Используйте createProjectCommand() для создания команд
 */
export function transformTimelineToBackendProject(timeline: Timeline, existingProject?: Project): Partial<Project> {
  logger.warn("Warning", {
    data:
      "transformTimelineToBackendProject is deprecated in BackendSync architecture. " +
      "Use ProjectCommand instead for all state changes.",
  })
  // Собираем все треки из секций и глобальных треков
  const allTracks = [...timeline.sections.flatMap((section) => section.tracks), ...timeline.globalTracks]

  return {
    id: timeline.id,
    metadata: {
      name: timeline.name,
      created_at: timeline.createdAt.toISOString(),
      modified_at: timeline.updatedAt.toISOString(),
      file_path: existingProject?.metadata.file_path || null,
      is_dirty: true,
      version: timeline.version,
    },
    timeline: {
      duration: timeline.duration,
      fps: timeline.fps,
      sample_rate: timeline.sampleRate,
      tracks: allTracks.map((track) => ({
        id: track.id,
        name: track.name,
        track_type: reverseMapTrackType(track.type) as any, // TODO: исправить типы
        enabled: !track.muted,
        locked: track.locked,
        height: track.height,
        clips: track.clips.map((clip) => ({
          id: clip.id,
          media_id: clip.mediaId,
          name: clip.name,
          timeline_in: clip.startTime,
          timeline_out: clip.startTime + clip.duration,
          source_in: clip.sourceIn,
          source_out: clip.sourceOut,
          playback_rate: clip.playbackRate,
          enabled: !clip.isMuted,
          effects: clip.effects.map((e) => e.effectId),
          transitions: clip.transitions.map((t) => ({
            id: t.id,
            transition_type: t.transitionId,
            duration: t.duration,
            params: t.parameters,
          })),
        })),
        effects: [],
        volume: track.volume,
        pan: track.pan,
      })),
    },
    media_pool: {
      items: timeline.resources.media.reduce(
        (acc, media) => {
          acc[media.id] = media
          return acc
        },
        {} as Record<string, any>,
      ),
    },
    settings: {
      resolution: timeline.settings.resolution,
      frame_rate: timeline.settings.fps,
      audio_sample_rate: timeline.settings.sampleRate,
      audio_channels: timeline.settings.channels,
    },
  }
}

/**
 * Обратный маппинг типов треков
 */
function reverseMapTrackType(frontendType: Track["type"]): string {
  const typeMap: Record<Track["type"], string> = {
    video: "Video",
    audio: "Audio",
    image: "Image",
    title: "Title",
    music: "Music",
    voiceover: "Voiceover",
    sfx: "Sfx",
    ambient: "Ambient",
  }
  return typeMap[frontendType] || "Video"
}

// ===========================
// NEW: BackendSync Command Helpers
// ===========================

/**
 * Создает команду для добавления клипа через BackendSync
 */
export function createAddClipCommand(trackId: string, mediaId: string, time: number): ProjectCommand {
  return {
    type: "AddClip",
    params: {
      track_id: trackId,
      media_id: mediaId,
      time,
    },
  }
}

/**
 * Создает команду для перемещения клипа
 */
export function createMoveClipCommand(clipId: string, trackId: string, time: number): ProjectCommand {
  return {
    type: "MoveClip",
    params: {
      clip_id: clipId,
      track_id: trackId,
      time,
    },
  }
}

/**
 * Создает команду для обрезки клипа
 */
export function createTrimClipCommand(clipId: string, start: number, end: number): ProjectCommand {
  return {
    type: "TrimClip",
    params: {
      clip_id: clipId,
      start,
      end,
    },
  }
}

/**
 * Создает команду для выбора клипов
 */
export function createSelectClipsCommand(clipIds: string[], addToSelection = false): ProjectCommand {
  return {
    type: "SelectClips",
    params: {
      clip_ids: clipIds,
      add_to_selection: addToSelection,
    },
  }
}

/**
 * Создает команду для создания проекта
 */
export function createProjectCommand(name: string, settings: any): ProjectCommand {
  return {
    type: "CreateProject",
    params: {
      name,
      settings,
    },
  }
}

/**
 * Создает команду для сохранения проекта
 */
export function createSaveProjectCommand(path?: string): ProjectCommand {
  return {
    type: "SaveProject",
    params: {
      path: path || null,
    },
  }
}

// ===========================
// NEW: State Validation Helpers
// ===========================

/**
 * Проверяет, является ли timeline синхронизированным с backend
 */
export function isBackendSyncTimeline(timeline: Timeline): boolean {
  return timeline.isBackendSync === true
}

/**
 * Проверяет актуальность timeline относительно backend состояния
 */
export function isTimelineStale(timeline: Timeline, currentVersion: number): boolean {
  return timeline.stateVersion !== currentVersion
}

/**
 * Получает статистику синхронизации
 */
export function getTimelineSyncStats(timeline: Timeline, projectState: ProjectState | null) {
  return {
    isBackendSync: isBackendSyncTimeline(timeline),
    timelineVersion: timeline.stateVersion || 0,
    backendVersion: projectState?.version || 0,
    isStale: projectState ? isTimelineStale(timeline, projectState.version || 0) : true,
    hasProject: !!projectState?.project,
    lastSync: timeline.updatedAt,
  }
}
