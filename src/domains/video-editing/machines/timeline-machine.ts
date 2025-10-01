/**
 * Timeline State Machine - Video Editing Domain
 *
 * Управляет состоянием timeline и операциями редактирования
 * Перенесено из src/features/timeline/services/timeline-ui-machine.ts
 */

import { assign, setup } from "xstate"

// Локальный тип для буфера обмена
interface ClipboardData {
  clips: any[]
  tracks: any[]
  metadata: {
    copiedAt: Date
    originalTimeRange: {
      startTime: number
      endTime: number
    }
    trackIds: string[]
  }
}

// UI состояние timeline
export interface TimelineContext {
  // Состояние воспроизведения (синхронизируется с backend)
  isPlaying: boolean
  currentTime: number
  playbackRate: number

  // UI состояние
  timeScale: number
  scrollPosition: { x: number; y: number }
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"

  // Выделение
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]

  // Операции перетаскивания
  isDragging: boolean
  draggedClipId: string | null
  draggedTrackId: string | null
  draggedResourceType: "transition" | "effect" | "filter" | null
  draggedResourceId: string | null

  // Буфер обмена
  clipboard: ClipboardData | null

  // UI флаги
  isRecording: boolean
  showWaveforms: boolean
  showThumbnails: boolean
  showMarkers: boolean

  // Ошибки UI
  uiError: string | null
}

export type TimelineEvent =
  // Синхронизация с backend
  | { type: "SYNC_PLAYBACK_STATE"; isPlaying: boolean; currentTime: number }
  | { type: "SYNC_CURRENT_TIME"; currentTime: number }
  | { type: "SET_PLAYBACK_RATE"; rate: number }

  // UI управление
  | { type: "SET_TIME_SCALE"; scale: number }
  | { type: "SET_SCROLL_POSITION"; x: number; y: number }
  | { type: "SET_EDIT_MODE"; mode: "select" | "cut" | "trim" | "move" }
  | { type: "SET_SNAP_MODE"; mode: "none" | "grid" | "clips" | "markers" }

  // Выделение
  | { type: "SELECT_CLIP"; clipId: string; multiple?: boolean }
  | { type: "SELECT_TRACK"; trackId: string; multiple?: boolean }
  | { type: "SELECT_SECTION"; sectionId: string; multiple?: boolean }
  | { type: "CLEAR_SELECTION" }

  // Drag & Drop
  | { type: "START_DRAG_CLIP"; clipId: string }
  | { type: "START_DRAG_TRACK"; trackId: string }
  | { type: "START_DRAG_RESOURCE"; resourceType: "transition" | "effect" | "filter"; resourceId: string }
  | { type: "END_DRAG" }

  // Буфер обмена
  | { type: "COPY_TO_CLIPBOARD"; data: ClipboardData }
  | { type: "CLEAR_CLIPBOARD" }

  // UI флаги
  | { type: "TOGGLE_RECORDING" }
  | { type: "TOGGLE_WAVEFORMS" }
  | { type: "TOGGLE_THUMBNAILS" }
  | { type: "TOGGLE_MARKERS" }

  // Ошибки
  | { type: "SET_UI_ERROR"; error: string }
  | { type: "CLEAR_UI_ERROR" }

const initialContext: TimelineContext = {
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
  timeScale: 100,
  scrollPosition: { x: 0, y: 0 },
  editMode: "select",
  snapMode: "clips",
  selectedClipIds: [],
  selectedTrackIds: [],
  selectedSectionIds: [],
  isDragging: false,
  draggedClipId: null,
  draggedTrackId: null,
  draggedResourceType: null,
  draggedResourceId: null,
  clipboard: null,
  isRecording: false,
  showWaveforms: true,
  showThumbnails: true,
  showMarkers: true,
  uiError: null,
}

export const timelineMachine = setup({
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  actions: {
    // Синхронизация с backend
    syncPlaybackState: assign({
      isPlaying: ({ event }) => {
        if (event.type !== "SYNC_PLAYBACK_STATE") return false
        console.log(`[Timeline Domain] Syncing playback state: ${event.isPlaying}`)
        return event.isPlaying
      },
      currentTime: ({ event }) => {
        if (event.type !== "SYNC_PLAYBACK_STATE") return 0
        return event.currentTime
      },
    }),

    syncCurrentTime: assign({
      currentTime: ({ event }) => {
        if (event.type !== "SYNC_CURRENT_TIME") return 0
        return event.currentTime
      },
    }),

    setPlaybackRate: assign({
      playbackRate: ({ event }) => {
        if (event.type !== "SET_PLAYBACK_RATE") return 1
        console.log(`[Timeline Domain] Setting playback rate: ${event.rate}`)
        return event.rate
      },
    }),

    // UI управление
    setTimeScale: assign({
      timeScale: ({ event }) => {
        if (event.type !== "SET_TIME_SCALE") return 100
        console.log(`[Timeline Domain] Setting time scale: ${event.scale}`)
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
        console.log(`[Timeline Domain] Setting edit mode: ${event.mode}`)
        return event.mode
      },
    }),

    setSnapMode: assign({
      snapMode: ({ event }) => {
        if (event.type !== "SET_SNAP_MODE") return "clips"
        console.log(`[Timeline Domain] Setting snap mode: ${event.mode}`)
        return event.mode
      },
    }),

    // Выделение
    selectClip: assign({
      selectedClipIds: ({ context, event }) => {
        if (event.type !== "SELECT_CLIP") return context.selectedClipIds

        if (event.multiple) {
          if (context.selectedClipIds.includes(event.clipId)) {
            return context.selectedClipIds.filter((id) => id !== event.clipId)
          }
          return [...context.selectedClipIds, event.clipId]
        }

        console.log(`[Timeline Domain] Selecting clip: ${event.clipId}`)
        return [event.clipId]
      },
    }),

    selectTrack: assign({
      selectedTrackIds: ({ context, event }) => {
        if (event.type !== "SELECT_TRACK") return context.selectedTrackIds

        if (event.multiple) {
          if (context.selectedTrackIds.includes(event.trackId)) {
            return context.selectedTrackIds.filter((id) => id !== event.trackId)
          }
          return [...context.selectedTrackIds, event.trackId]
        }

        console.log(`[Timeline Domain] Selecting track: ${event.trackId}`)
        return [event.trackId]
      },
    }),

    selectSection: assign({
      selectedSectionIds: ({ context, event }) => {
        if (event.type !== "SELECT_SECTION") return context.selectedSectionIds

        if (event.multiple) {
          if (context.selectedSectionIds.includes(event.sectionId)) {
            return context.selectedSectionIds.filter((id) => id !== event.sectionId)
          }
          return [...context.selectedSectionIds, event.sectionId]
        }

        console.log(`[Timeline Domain] Selecting section: ${event.sectionId}`)
        return [event.sectionId]
      },
    }),

    clearSelection: assign({
      selectedClipIds: () => [],
      selectedTrackIds: () => [],
      selectedSectionIds: () => [],
    }),

    // Drag & Drop
    startDragClip: assign({
      isDragging: () => true,
      draggedClipId: ({ event }) => {
        if (event.type !== "START_DRAG_CLIP") return null
        console.log(`[Timeline Domain] Starting drag clip: ${event.clipId}`)
        return event.clipId
      },
    }),

    startDragTrack: assign({
      isDragging: () => true,
      draggedTrackId: ({ event }) => {
        if (event.type !== "START_DRAG_TRACK") return null
        console.log(`[Timeline Domain] Starting drag track: ${event.trackId}`)
        return event.trackId
      },
    }),

    startDragResource: assign({
      isDragging: () => true,
      draggedResourceType: ({ event }) => {
        if (event.type !== "START_DRAG_RESOURCE") return null
        console.log(`[Timeline Domain] Starting drag resource: ${event.resourceType}`)
        return event.resourceType
      },
      draggedResourceId: ({ event }) => {
        if (event.type !== "START_DRAG_RESOURCE") return null
        return event.resourceId
      },
    }),

    endDrag: assign({
      isDragging: () => false,
      draggedClipId: () => null,
      draggedTrackId: () => null,
      draggedResourceType: () => null,
      draggedResourceId: () => null,
    }),

    // Буфер обмена
    copyToClipboard: assign({
      clipboard: ({ event }) => {
        if (event.type !== "COPY_TO_CLIPBOARD") return null
        console.log("[Timeline Domain] Copying to clipboard")
        return event.data
      },
    }),

    clearClipboard: assign({
      clipboard: () => null,
    }),

    // UI флаги
    toggleRecording: assign({
      isRecording: ({ context }) => {
        const newState = !context.isRecording
        console.log(`[Timeline Domain] Recording: ${newState}`)
        return newState
      },
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

    // Ошибки
    setUIError: assign({
      uiError: ({ event }) => {
        if (event.type !== "SET_UI_ERROR") return null
        console.error(`[Timeline Domain] UI Error: ${event.error}`)
        return event.error
      },
    }),

    clearUIError: assign({
      uiError: () => null,
    }),
  },
}).createMachine({
  id: "video-editing-timeline",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        // Синхронизация с backend
        SYNC_PLAYBACK_STATE: {
          actions: ["syncPlaybackState"],
        },
        SYNC_CURRENT_TIME: {
          actions: ["syncCurrentTime"],
        },
        SET_PLAYBACK_RATE: {
          actions: ["setPlaybackRate"],
        },

        // UI управление
        SET_TIME_SCALE: {
          actions: ["setTimeScale"],
        },
        SET_SCROLL_POSITION: {
          actions: ["setScrollPosition"],
        },
        SET_EDIT_MODE: {
          actions: ["setEditMode"],
        },
        SET_SNAP_MODE: {
          actions: ["setSnapMode"],
        },

        // Выделение
        SELECT_CLIP: {
          actions: ["selectClip"],
        },
        SELECT_TRACK: {
          actions: ["selectTrack"],
        },
        SELECT_SECTION: {
          actions: ["selectSection"],
        },
        CLEAR_SELECTION: {
          actions: ["clearSelection"],
        },

        // Drag & Drop
        START_DRAG_CLIP: {
          target: "dragging",
          actions: ["startDragClip"],
        },
        START_DRAG_TRACK: {
          target: "dragging",
          actions: ["startDragTrack"],
        },
        START_DRAG_RESOURCE: {
          target: "dragging",
          actions: ["startDragResource"],
        },

        // Буфер обмена
        COPY_TO_CLIPBOARD: {
          actions: ["copyToClipboard"],
        },
        CLEAR_CLIPBOARD: {
          actions: ["clearClipboard"],
        },

        // UI флаги
        TOGGLE_RECORDING: {
          actions: ["toggleRecording"],
        },
        TOGGLE_WAVEFORMS: {
          actions: ["toggleWaveforms"],
        },
        TOGGLE_THUMBNAILS: {
          actions: ["toggleThumbnails"],
        },
        TOGGLE_MARKERS: {
          actions: ["toggleMarkers"],
        },

        // Ошибки
        SET_UI_ERROR: {
          actions: ["setUIError"],
        },
        CLEAR_UI_ERROR: {
          actions: ["clearUIError"],
        },
      },
    },

    dragging: {
      on: {
        END_DRAG: {
          target: "idle",
          actions: ["endDrag"],
        },

        // Разрешаем обновление времени во время перетаскивания
        SYNC_CURRENT_TIME: {
          actions: ["syncCurrentTime"],
        },
      },
    },
  },
})

export type TimelineMachine = typeof timelineMachine
