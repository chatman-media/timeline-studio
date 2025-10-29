/**
 * Project Transform Utilities
 * 
 * Преобразование между структурами backend (Tauri) и frontend
 */

import type { Project, Timeline as BackendTimeline, Track as BackendTrack } from "@/types/generated/tauri-bindings"
import type { Timeline, Track, Section } from "../types/timeline"

/**
 * Преобразует backend Project в frontend Timeline структуру
 */
export function transformBackendProjectToTimeline(backendProject: Project | null | undefined): Timeline | null {
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
    sections: [{
      id: "main-section",
      name: "Main",
      startTime: 0,
      endTime: backendTimeline.duration || 0,
      tracks: transformBackendTracks(backendTimeline.tracks),
      isCollapsed: false,
    }],
    
    // Backend не разделяет глобальные треки, поэтому оставляем пустым
    globalTracks: [],
    
    // Преобразуем ресурсы (в backend они хранятся в media_pool)
    resources: {
      media: Object.values(backendProject.media_pool.items || {}),
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

  return timeline
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
    clips: track.clips.map(clip => ({
      id: clip.id,
      name: clip.name,
      mediaId: clip.media_id,
      trackId: track.id,
      startTime: clip.timeline_in,
      duration: clip.timeline_out - clip.timeline_in,
      sourceIn: clip.source_in,
      sourceOut: clip.source_out,
      playbackRate: clip.playback_rate,
      isSelected: false,
      isLocked: false,
      isMuted: !clip.enabled,
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
      effects: clip.effects.map(effectId => ({
        id: effectId,
        type: "effect" as const,
        effectId,
        params: {},
        isEnabled: true,
      })),
      filters: [],
      transitions: clip.transitions.map(t => ({
        id: t.id,
        type: "transition" as const,
        transitionId: t.transition_type,
        params: t.params,
        duration: t.duration,
        isEnabled: true,
      })),
    })),
    muted: false,
    solo: false,
    locked: track.locked,
    height: track.height,
    expanded: true,
    volume: track.volume,
    pan: track.pan,
    color: getTrackColor(track.track_type),
  }))
}

/**
 * Маппинг типов треков
 */
function mapTrackType(backendType: string): Track["type"] {
  const typeMap: Record<string, Track["type"]> = {
    "Video": "video",
    "Audio": "audio", 
    "Title": "title",
    "Music": "music",
    "Voiceover": "voiceover",
    "Sfx": "sfx",
    "Ambient": "ambient",
  }
  return typeMap[backendType] || "video"
}

/**
 * Получение цвета трека по типу
 */
function getTrackColor(trackType: string): string {
  const colors: Record<string, string> = {
    "Video": "#3B82F6",
    "Audio": "#10B981",
    "Title": "#F59E0B",
    "Music": "#8B5CF6",
    "Voiceover": "#EC4899",
    "Sfx": "#14B8A6",
    "Ambient": "#06B6D4",
  }
  return colors[trackType] || "#6B7280"
}

/**
 * Вычисляет соотношение сторон
 */
function calculateAspectRatio(resolution: { width: number; height: number }): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(resolution.width, resolution.height)
  return `${resolution.width / divisor}:${resolution.height / divisor}`
}

/**
 * Преобразует frontend Timeline обратно в backend Project для сохранения
 */
export function transformTimelineToBackendProject(timeline: Timeline, existingProject?: Project): Partial<Project> {
  // Собираем все треки из секций и глобальных треков
  const allTracks = [
    ...timeline.sections.flatMap(section => section.tracks),
    ...timeline.globalTracks,
  ]

  return {
    id: timeline.id,
    metadata: {
      name: timeline.name,
      description: null,
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
      tracks: allTracks.map(track => ({
        id: track.id,
        name: track.name,
        track_type: reverseMapTrackType(track.type),
        enabled: !track.muted,
        locked: track.locked,
        height: track.height,
        clips: track.clips.map(clip => ({
          id: clip.id,
          media_id: clip.mediaId,
          name: clip.name,
          timeline_in: clip.startTime,
          timeline_out: clip.startTime + clip.duration,
          source_in: clip.sourceIn,
          source_out: clip.sourceOut,
          playback_rate: clip.playbackRate,
          enabled: !clip.isMuted,
          effects: clip.effects.map(e => e.effectId),
          transitions: clip.transitions.map(t => ({
            id: t.id,
            transition_type: t.transitionId,
            duration: t.duration,
            params: t.params,
          })),
        })),
        effects: [],
        volume: track.volume,
        pan: track.pan,
      })),
      markers: [],
    },
    media_pool: {
      items: timeline.resources.media.reduce((acc, media) => {
        acc[media.id] = media
        return acc
      }, {} as Record<string, any>),
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
    "video": "Video",
    "audio": "Audio",
    "title": "Title",
    "music": "Music",
    "voiceover": "Voiceover",
    "sfx": "Sfx",
    "ambient": "Ambient",
  }
  return typeMap[frontendType] || "Video"
}