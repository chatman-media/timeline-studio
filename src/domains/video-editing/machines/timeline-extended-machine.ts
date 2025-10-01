/**
 * Extended Timeline State Machine - Video Editing Domain
 *
 * Полноценная машина состояний timeline с поддержкой:
 * - Управления проектом
 * - Операций с клипами
 * - Управления треками
 * - Воспроизведения
 * - Выделения и буфера обмена
 * - Эффектов и переходов
 * - Backend синхронизации
 */

import { assign, fromPromise, setup } from "xstate"
import type { MediaFile, Timeline, TimelineClip, Track, TrackType } from "../types"

// Локальный тип для буфера обмена
interface ClipboardData {
  clips: TimelineClip[]
  tracks: Track[]
  metadata: {
    copiedAt: Date
    originalTimeRange: {
      startTime: number
      endTime: number
    }
    trackIds: string[]
  }
}

// Локальные типы для Tauri bindings
interface Clip {
  id: string
  name: string
  media_id: string
  timeline_in: number
  timeline_out: number
  source_in: number
  source_out: number
  playback_rate: number
  enabled: boolean
}

interface Project {
  id: string
  metadata: {
    name: string
    created_at: string
    version: string
  }
  settings: {
    resolution: { width: number; height: number }
    frame_rate: number
    audio_sample_rate: number
    audio_channels: number
  }
  timeline: {
    tracks: TrackBinding[]
    duration: number
    fps: number
    sample_rate: number
  }
}

interface TrackBinding {
  id: string
  name: string
  track_type: string
  clips: Clip[]
  locked: boolean
  enabled: boolean
  volume: number
  pan: number
  height: number
}

interface ProjectCommand {
  type: string
  params: any
}

interface ProjectState {
  current_project?: Project
}

// Расширенный контекст машины
export interface TimelineExtendedContext {
  // Project state
  project: Timeline | null
  projectState: ProjectState | null
  isLoading: boolean
  hasUnsavedChanges: boolean

  // Playback state
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  duration: number

  // Tracks state
  activeTrackId: string | null

  // Selection state
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]
  clipboard: ClipboardData | null

  // UI state
  timeScale: number
  scrollPosition: { x: number; y: number }
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"

  // Drag state
  isDragging: boolean
  draggedClipId: string | null
  draggedTrackId: string | null
  draggedResourceType: "transition" | "effect" | "filter" | null
  draggedResourceId: string | null

  // UI flags
  isRecording: boolean
  showWaveforms: boolean
  showThumbnails: boolean
  showMarkers: boolean

  // Errors
  error: string | null
}

// Расширенные события машины
export type TimelineExtendedEvent =
  // Project events
  | { type: "CREATE_PROJECT"; name: string; settings?: any }
  | { type: "LOAD_PROJECT"; path: string }
  | { type: "SAVE_PROJECT" }
  | { type: "PROJECT_UPDATED"; project: Project }

  // Playback events
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SEEK"; time: number }
  | { type: "SET_PLAYBACK_RATE"; rate: number }
  | { type: "SYNC_PLAYBACK_STATE"; isPlaying: boolean; currentTime: number }

  // Track events
  | { type: "ADD_TRACK"; trackType: TrackType; name?: string; sectionId?: string }
  | { type: "REMOVE_TRACK"; trackId: string }
  | { type: "UPDATE_TRACK"; trackId: string; updates: Partial<Track> }
  | { type: "REORDER_TRACKS"; sectionId: string; trackIds: string[] }
  | { type: "SET_ACTIVE_TRACK"; trackId: string | null }

  // Clip events
  | { type: "ADD_CLIP"; trackId: string; mediaFile: MediaFile | string; time: number }
  | { type: "REMOVE_CLIP"; clipId: string }
  | { type: "MOVE_CLIP"; clipId: string; trackId: string; time: number }
  | { type: "TRIM_CLIP"; clipId: string; startTime: number; endTime: number }
  | { type: "SPLIT_CLIP"; clipId: string; time: number }
  | { type: "UPDATE_CLIP"; clipId: string; updates: Partial<TimelineClip> }
  | { type: "BATCH_UPDATE_CLIPS"; clips: TimelineClip[] }

  // Selection events
  | { type: "SELECT_CLIPS"; clipIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_TRACKS"; trackIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_SECTIONS"; sectionIds: string[]; addToSelection?: boolean }
  | { type: "CLEAR_SELECTION" }

  // Clipboard events
  | { type: "COPY_CLIPS" }
  | { type: "CUT_CLIPS" }
  | { type: "PASTE_CLIPS"; trackId: string; time: number }
  | { type: "DELETE_SELECTED" }

  // Effects events
  | { type: "APPLY_EFFECT"; clipId: string; effectId: string; params?: any }
  | { type: "REMOVE_EFFECT"; clipId: string; effectId: string }
  | { type: "APPLY_FILTER"; clipId: string; filterId: string; params?: any }
  | { type: "REMOVE_FILTER"; clipId: string; filterId: string }
  | { type: "APPLY_TRANSITION"; clipId: string; transitionId: string; params?: any }
  | { type: "REMOVE_TRANSITION"; clipId: string; transitionId: string }

  // UI events (из оригинальной машины)
  | { type: "SET_TIME_SCALE"; scale: number }
  | { type: "SET_SCROLL_POSITION"; x: number; y: number }
  | { type: "SET_EDIT_MODE"; mode: "select" | "cut" | "trim" | "move" }
  | { type: "SET_SNAP_MODE"; mode: "none" | "grid" | "clips" | "markers" }
  | { type: "START_DRAG_CLIP"; clipId: string }
  | { type: "START_DRAG_TRACK"; trackId: string }
  | { type: "START_DRAG_RESOURCE"; resourceType: "transition" | "effect" | "filter"; resourceId: string }
  | { type: "END_DRAG" }
  | { type: "TOGGLE_RECORDING" }
  | { type: "TOGGLE_WAVEFORMS" }
  | { type: "TOGGLE_THUMBNAILS" }
  | { type: "TOGGLE_MARKERS" }

  // Error events
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }

// Утилиты преобразования (из провайдеров)
function convertClipToTimelineClip(clip: Clip, trackId: string): TimelineClip {
  return {
    id: clip.id,
    name: clip.name,
    mediaId: clip.media_id,
    trackId,
    startTime: clip.timeline_in,
    duration: clip.timeline_out - clip.timeline_in,
    mediaStartTime: clip.source_in,
    mediaEndTime: clip.source_out,
    offset: 0,
    mediaDuration: clip.source_out - clip.source_in,
    volume: 1.0,
    speed: clip.playback_rate,
    isReversed: false,
    opacity: 1.0,
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: !clip.enabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function convertProjectToTimeline(project: Project): Timeline {
  const tracks: Track[] = project.timeline.tracks.map((track, index) => ({
    id: track.id,
    name: track.name,
    type: track.track_type.toLowerCase() as TrackType,
    order: index,
    clips: track.clips.map((clip) => convertClipToTimelineClip(clip, track.id)),
    transitions: [],
    isLocked: track.locked,
    isMuted: !track.enabled,
    isHidden: false,
    isSolo: false,
    volume: track.volume,
    pan: track.pan,
    height: track.height,
    trackEffects: [],
    trackFilters: [],
  }))

  return {
    id: project.id,
    name: project.metadata.name,
    duration: project.timeline.duration,
    fps: project.timeline.fps,
    sampleRate: project.timeline.sample_rate,
    sections: [],
    globalTracks: tracks,
    resources: {
      effects: [],
      filters: [],
      transitions: [],
      timelineTransitions: [],
      templates: [],
      styleTemplates: [],
      subtitleStyles: [],
      music: [],
      media: [],
    },
    settings: {
      resolution: project.settings.resolution,
      fps: project.settings.frame_rate,
      aspectRatio: "16:9",
      sampleRate: project.settings.audio_sample_rate,
      channels: project.settings.audio_channels,
      bitDepth: 16,
      timeFormat: "timecode" as const,
      snapToGrid: false,
      gridSize: 1,
      autoSave: true,
      autoSaveInterval: 300,
    },
    createdAt: new Date(project.metadata.created_at),
    updatedAt: new Date(),
    version: project.metadata.version,
  }
}

// Actors для backend операций
const executeCommandActor = fromPromise(async ({ input }: { input: { command: ProjectCommand } }) => {
  // Mock implementation - в реальном приложении здесь будет вызов backend API
  console.log("Executing command:", input.command)
  return Promise.resolve({ success: true })
})

// Начальное состояние
const initialContext: TimelineExtendedContext = {
  // Project
  project: null,
  projectState: null,
  isLoading: false,
  hasUnsavedChanges: false,

  // Playback
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
  duration: 0,

  // Tracks
  activeTrackId: null,

  // Selection
  selectedClipIds: [],
  selectedTrackIds: [],
  selectedSectionIds: [],
  clipboard: null,

  // UI
  timeScale: 100,
  scrollPosition: { x: 0, y: 0 },
  editMode: "select",
  snapMode: "clips",

  // Drag
  isDragging: false,
  draggedClipId: null,
  draggedTrackId: null,
  draggedResourceType: null,
  draggedResourceId: null,

  // Flags
  isRecording: false,
  showWaveforms: true,
  showThumbnails: true,
  showMarkers: true,

  // Error
  error: null,
}

export const timelineExtendedMachine = setup({
  types: {
    context: {} as TimelineExtendedContext,
    events: {} as TimelineExtendedEvent,
  },

  actors: {
    executeCommand: executeCommandActor,
  },

  actions: {
    // Project actions
    setProject: assign({
      project: ({ event }) => {
        if (event.type === "PROJECT_UPDATED" && event.project) {
          return convertProjectToTimeline(event.project)
        }
        return null
      },
      duration: ({ event }) => {
        if (event.type === "PROJECT_UPDATED" && event.project) {
          return event.project.timeline.duration
        }
        return 0
      },
    }),

    setLoading: assign({
      isLoading: true,
    }),

    clearLoading: assign({
      isLoading: false,
    }),

    markUnsaved: assign({
      hasUnsavedChanges: true,
    }),

    markSaved: assign({
      hasUnsavedChanges: false,
    }),

    // Playback actions
    setPlaying: assign({
      isPlaying: true,
    }),

    setPaused: assign({
      isPlaying: false,
    }),

    setStopped: assign({
      isPlaying: false,
      currentTime: 0,
    }),

    updateTime: assign({
      currentTime: ({ event }) => {
        if (event.type === "SEEK") return event.time
        if (event.type === "SYNC_PLAYBACK_STATE") return event.currentTime
        return 0
      },
    }),

    setPlaybackRate: assign({
      playbackRate: ({ event }) => {
        if (event.type === "SET_PLAYBACK_RATE") return event.rate
        return 1
      },
    }),

    // Track actions
    setActiveTrack: assign({
      activeTrackId: ({ event }) => {
        if (event.type === "SET_ACTIVE_TRACK") return event.trackId
        return null
      },
    }),

    // Selection actions
    selectClips: assign({
      selectedClipIds: ({ context, event }) => {
        if (event.type !== "SELECT_CLIPS") return context.selectedClipIds

        if (event.addToSelection) {
          const newIds = event.clipIds.filter((id) => !context.selectedClipIds.includes(id))
          return [...context.selectedClipIds, ...newIds]
        }

        return event.clipIds
      },
    }),

    selectTracks: assign({
      selectedTrackIds: ({ context, event }) => {
        if (event.type !== "SELECT_TRACKS") return context.selectedTrackIds

        if (event.addToSelection) {
          const newIds = event.trackIds.filter((id) => !context.selectedTrackIds.includes(id))
          return [...context.selectedTrackIds, ...newIds]
        }

        return event.trackIds
      },
    }),

    clearSelection: assign({
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
    }),

    // UI actions (из оригинальной машины)
    setTimeScale: assign({
      timeScale: ({ event }) => {
        if (event.type !== "SET_TIME_SCALE") return 100
        return Math.max(10, Math.min(1000, event.scale))
      },
    }),

    setScrollPosition: assign({
      scrollPosition: ({ event }) => {
        if (event.type !== "SET_SCROLL_POSITION") return { x: 0, y: 0 }
        return { x: event.x, y: event.y }
      },
    }),

    setEditMode: assign({
      editMode: ({ event }) => {
        if (event.type !== "SET_EDIT_MODE") return "select"
        return event.mode
      },
    }),

    setSnapMode: assign({
      snapMode: ({ event }) => {
        if (event.type !== "SET_SNAP_MODE") return "clips"
        return event.mode
      },
    }),

    // Drag actions
    startDragClip: assign({
      isDragging: true,
      draggedClipId: ({ event }) => {
        if (event.type === "START_DRAG_CLIP") return event.clipId
        return null
      },
    }),

    startDragTrack: assign({
      isDragging: true,
      draggedTrackId: ({ event }) => {
        if (event.type === "START_DRAG_TRACK") return event.trackId
        return null
      },
    }),

    startDragResource: assign({
      isDragging: true,
      draggedResourceType: ({ event }) => {
        if (event.type === "START_DRAG_RESOURCE") return event.resourceType
        return null
      },
      draggedResourceId: ({ event }) => {
        if (event.type === "START_DRAG_RESOURCE") return event.resourceId
        return null
      },
    }),

    endDrag: assign({
      isDragging: false,
      draggedClipId: null,
      draggedTrackId: null,
      draggedResourceType: null,
      draggedResourceId: null,
    }),

    // Toggle actions
    toggleRecording: assign({
      isRecording: ({ context }) => !context.isRecording,
    }),

    toggleWaveforms: assign({
      showWaveforms: ({ context }) => !context.showWaveforms,
    }),

    toggleThumbnails: assign({
      showThumbnails: ({ context }) => !context.showThumbnails,
    }),

    toggleMarkers: assign({
      showMarkers: ({ context }) => !context.showMarkers,
    }),

    // Error actions
    setError: assign({
      error: ({ event }) => {
        if (event.type === "SET_ERROR") return event.error
        return null
      },
    }),

    clearError: assign({
      error: null,
    }),
  },
}).createMachine({
  id: "timeline-extended",
  initial: "idle",
  context: initialContext,

  states: {
    idle: {
      on: {
        CREATE_PROJECT: {
          target: "creatingProject",
        },
        LOAD_PROJECT: {
          target: "loadingProject",
        },
        PROJECT_UPDATED: {
          actions: ["setProject"],
        },
      },
    },

    creatingProject: {
      entry: "setLoading",
      invoke: {
        src: "executeCommand",
        input: ({ event }) => {
          if (event.type !== "CREATE_PROJECT") throw new Error("Invalid event type")
          return {
            command: {
              type: "CreateProject",
              params: {
                name: event.name,
                settings: event.settings || {
                  fps: 30,
                  resolution: "1920x1080",
                },
              },
            },
          }
        },
        onDone: {
          target: "active",
          actions: ["clearLoading", "markUnsaved"],
        },
        onError: {
          target: "idle",
          actions: ["clearLoading", "setError"],
        },
      },
    },

    loadingProject: {
      entry: "setLoading",
      invoke: {
        src: "executeCommand",
        input: ({ event }) => {
          if (event.type !== "LOAD_PROJECT") throw new Error("Invalid event type")
          return {
            command: {
              type: "OpenProject",
              params: { path: event.path },
            },
          }
        },
        onDone: {
          target: "active",
          actions: ["clearLoading", "markSaved"],
        },
        onError: {
          target: "idle",
          actions: ["clearLoading", "setError"],
        },
      },
    },

    active: {
      type: "parallel",

      states: {
        playback: {
          initial: "stopped",
          states: {
            playing: {
              entry: "setPlaying",
              on: {
                PAUSE: "paused",
                STOP: "stopped",
                SEEK: {
                  actions: "updateTime",
                },
                SYNC_PLAYBACK_STATE: {
                  actions: "updateTime",
                },
              },
            },
            paused: {
              entry: "setPaused",
              on: {
                PLAY: "playing",
                STOP: "stopped",
                SEEK: {
                  actions: "updateTime",
                },
              },
            },
            stopped: {
              entry: "setStopped",
              on: {
                PLAY: "playing",
                SEEK: {
                  actions: "updateTime",
                },
              },
            },
          },
          on: {
            SET_PLAYBACK_RATE: {
              actions: "setPlaybackRate",
            },
          },
        },

        editing: {
          initial: "normal",
          states: {
            normal: {
              on: {
                START_DRAG_CLIP: {
                  target: "dragging",
                  actions: "startDragClip",
                },
                START_DRAG_TRACK: {
                  target: "dragging",
                  actions: "startDragTrack",
                },
                START_DRAG_RESOURCE: {
                  target: "dragging",
                  actions: "startDragResource",
                },
              },
            },
            dragging: {
              on: {
                END_DRAG: {
                  target: "normal",
                  actions: "endDrag",
                },
              },
            },
          },
        },
      },

      on: {
        // Project events
        SAVE_PROJECT: {
          target: "savingProject",
        },
        PROJECT_UPDATED: {
          actions: ["setProject"],
        },

        // Track events
        ADD_TRACK: {
          actions: ["markUnsaved"],
        },
        REMOVE_TRACK: {
          actions: ["markUnsaved"],
        },
        UPDATE_TRACK: {
          actions: ["markUnsaved"],
        },
        REORDER_TRACKS: {
          actions: ["markUnsaved"],
        },
        SET_ACTIVE_TRACK: {
          actions: "setActiveTrack",
        },

        // Clip events
        ADD_CLIP: {
          actions: ["markUnsaved"],
        },
        REMOVE_CLIP: {
          actions: ["markUnsaved"],
        },
        MOVE_CLIP: {
          actions: ["markUnsaved"],
        },
        TRIM_CLIP: {
          actions: ["markUnsaved"],
        },
        SPLIT_CLIP: {
          actions: ["markUnsaved"],
        },
        UPDATE_CLIP: {
          actions: ["markUnsaved"],
        },
        BATCH_UPDATE_CLIPS: {
          actions: ["markUnsaved"],
        },

        // Selection events
        SELECT_CLIPS: {
          actions: "selectClips",
        },
        SELECT_TRACKS: {
          actions: "selectTracks",
        },
        CLEAR_SELECTION: {
          actions: "clearSelection",
        },

        // UI events
        SET_TIME_SCALE: {
          actions: "setTimeScale",
        },
        SET_SCROLL_POSITION: {
          actions: "setScrollPosition",
        },
        SET_EDIT_MODE: {
          actions: "setEditMode",
        },
        SET_SNAP_MODE: {
          actions: "setSnapMode",
        },

        // Toggle events
        TOGGLE_RECORDING: {
          actions: "toggleRecording",
        },
        TOGGLE_WAVEFORMS: {
          actions: "toggleWaveforms",
        },
        TOGGLE_THUMBNAILS: {
          actions: "toggleThumbnails",
        },
        TOGGLE_MARKERS: {
          actions: "toggleMarkers",
        },

        // Error events
        CLEAR_ERROR: {
          actions: "clearError",
        },
      },
    },

    savingProject: {
      entry: "setLoading",
      invoke: {
        src: "executeCommand",
        input: () => ({
          command: {
            type: "SaveProject",
            params: { path: null },
          },
        }),
        onDone: {
          target: "active",
          actions: ["clearLoading", "markSaved"],
        },
        onError: {
          target: "active",
          actions: ["clearLoading", "setError"],
        },
      },
    },
  },
})

export type TimelineExtendedMachine = typeof timelineExtendedMachine
