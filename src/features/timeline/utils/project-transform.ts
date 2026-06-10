import type { MediaFile } from "@/core/types/media"
import type { Timeline, Track } from "@/core/types/timeline"
import type { Project, ProjectState, Track as BackendTrack } from "@/types/generated/tauri-bindings"

export function transformProjectStateToTimeline(projectState: ProjectState | null): Timeline | null {
  const backendProject = projectState?.project
  if (!backendProject || !backendProject.timeline) {
    return null
  }

  const backendTimeline = backendProject.timeline

  const timeline: Timeline = {
    id: backendProject.id,
    name: backendProject.metadata.name,
    duration: backendTimeline.duration,
    fps: backendTimeline.fps,
    sampleRate: backendTimeline.sample_rate,
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
    globalTracks: [],
    resources: {
      media: getUsedMediaFiles(backendProject),
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
      subtitleStyles: [],
      music: [],
    },
    settings: {
      resolution: backendProject.settings.resolution,
      fps: backendProject.settings.frame_rate,
      aspectRatio: calculateAspectRatio(backendProject.settings.resolution),
      sampleRate: backendProject.settings.audio_sample_rate,
      channels: backendProject.settings.audio_channels,
      bitDepth: 24,
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

  if (projectState.ui_state) {
    timeline.uiState = {
      selectedClipIds: projectState.ui_state.selected_clips,
      selectedTrackIds: projectState.ui_state.selected_tracks,
      zoom: projectState.ui_state.timeline_zoom,
      scroll: projectState.ui_state.timeline_scroll,
      activeTool: projectState.ui_state.active_tool,
    }
  }

  if (projectState.playback_state) {
    timeline.playbackState = {
      isPlaying: projectState.playback_state.is_playing,
      currentTime: projectState.playback_state.current_time,
      playbackRate: projectState.playback_state.playback_rate,
      volume: projectState.playback_state.volume,
      selectedMedia: undefined,
      source: undefined,
    }
  }

  timeline.stateVersion = projectState.version || 0
  timeline.isBackendSync = true

  return timeline
}

function getUsedMediaFiles(backendProject: Project): MediaFile[] {
  const usedMediaIds = new Set<string>()

  backendProject.timeline.tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      usedMediaIds.add(clip.media_id)
    })
  })

  const allMedia = Object.values(backendProject.media_pool?.items || {})
  return allMedia
    .filter(Boolean)
    .filter((media): media is any => Boolean(media && typeof media === "object" && "id" in media))
    .filter((media) => usedMediaIds.has(media.id))
    .map((media) => ({
      ...media,
      type: mapMediaTypeToString(media.media_type) || "video",
    })) as MediaFile[]
}

function mapMediaTypeToString(mediaType: any): string {
  if (typeof mediaType === "string") {
    return mediaType.toLowerCase()
  }

  if (mediaType && typeof mediaType === "object") {
    if (mediaType === "Video" || mediaType.Video !== undefined) return "video"
    if (mediaType === "Audio" || mediaType.Audio !== undefined) return "audio"
    if (mediaType === "Image" || mediaType.Image !== undefined) return "image"
  }

  return "video"
}

function transformBackendTracks(backendTracks: BackendTrack[]): Track[] {
  return backendTracks.map(
    (track, index): Track => ({
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
        mediaStartTime: clip.source_in,
        mediaEndTime: clip.source_out,
        offset: 0,
        playbackRate: clip.playback_rate,
        speed: clip.playback_rate,
        isReversed: false,
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
        effects: (clip.effects || []).map((effectId: string, order: number) => ({
          id: effectId,
          effectId,
          enabled: true,
          order,
          startTime: clip.timeline_in,
          duration: clip.timeline_out - clip.timeline_in,
          parameters: {},
          keyframes: {},
          masks: [],
          blendMode: "normal" as const,
          opacity: 1,
          effectVersion: "1.0.0",
          createdAt: new Date(),
          modifiedAt: new Date(),
        })),
        filters: [],
        transitions: (clip.transitions || []).map((transition: any) => ({
          id: transition.id,
          transitionId: transition.transition_type,
          type: "cross" as const,
          duration: transition.duration,
          isEnabled: true,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      transitions: [],
      muted: false,
      solo: false,
      locked: track.locked,
      isLocked: track.locked,
      isMuted: false,
      isHidden: false,
      isSolo: false,
      height: track.height || 100,
      expanded: true,
      color: getTrackColor(track.track_type),
      volume: track.volume || 1,
      pan: track.pan || 0,
      trackEffects: [],
      trackFilters: [],
    }),
  )
}

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

function calculateAspectRatio(resolution: { width: number; height: number }): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(resolution.width, resolution.height)
  return `${resolution.width / divisor}:${resolution.height / divisor}`
}
