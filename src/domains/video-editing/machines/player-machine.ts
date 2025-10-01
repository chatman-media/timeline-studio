/**
 * Player State Machine - Video Editing Domain
 *
 * Управляет воспроизведением видео и состоянием плеера
 * Перенесено из src/features/video-player/services/player-machine.ts
 */

import { assign, setup } from "xstate"
import type { MediaFile } from "../types"

export interface PlayerContext {
  video: MediaFile | null
  currentTime: number
  duration: number
  volume: number

  isPlaying: boolean
  isSeeking: boolean
  isChangingCamera: boolean
  isRecording: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
  isResizableMode: boolean // Флаг, указывающий, что шаблоны должны быть resizable

  // Speed Ramping
  speedRampingEnabled: boolean
  currentPlaybackRate: number
  basePlaybackRate: number

  // Настройки пререндера
  prerenderEnabled: boolean
  prerenderQuality: number
  prerenderSegmentDuration: number
  prerenderApplyEffects: boolean
  prerenderAutoPrerender: boolean

  // Новые поля для функции "Применить"
  previewMedia: MediaFile | null // Медиа для предпросмотра
  videoSource: "browser" | "timeline" // Источник видео

  // Примененные эффекты и фильтры
  appliedEffects: Array<{ id: string; name: string; params: any }>
  appliedFilters: Array<{ id: string; name: string; params: any }>
  appliedTemplate: {
    id: string
    name: string
    files: MediaFile[]
  } | null
}

// Начальный контекст для машины состояний плеера
const initialContext: PlayerContext = {
  video: null,
  currentTime: 0,
  isPlaying: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isVideoLoading: false,
  isVideoReady: false,
  isResizableMode: false,
  duration: 0,
  volume: 0.5, // Будет заменено значением из настроек
  speedRampingEnabled: false,
  currentPlaybackRate: 1,
  basePlaybackRate: 1,
  prerenderEnabled: false,
  prerenderQuality: 0.8,
  prerenderSegmentDuration: 5,
  prerenderApplyEffects: true,
  prerenderAutoPrerender: false,
  previewMedia: null,
  videoSource: "browser",
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
}

export type PlayerEvent =
  | { type: "LOAD_VIDEO"; video: MediaFile }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SEEK"; time: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_PLAYBACK_RATE"; rate: number }
  | { type: "UPDATE_TIME"; time: number }
  | { type: "VIDEO_LOADED"; duration: number }
  | { type: "VIDEO_ENDED" }
  | { type: "VIDEO_ERROR"; error: string }
  | { type: "TOGGLE_SPEED_RAMPING" }
  | { type: "SET_BASE_PLAYBACK_RATE"; rate: number }
  | { type: "SET_VIDEO_SOURCE"; source: "browser" | "timeline" }
  | { type: "SET_PREVIEW_MEDIA"; media: MediaFile | null }
  | { type: "APPLY_EFFECT"; effect: { id: string; name: string; params: any } }
  | { type: "REMOVE_EFFECT"; effectId: string }
  | { type: "APPLY_FILTER"; filter: { id: string; name: string; params: any } }
  | { type: "REMOVE_FILTER"; filterId: string }
  | { type: "APPLY_TEMPLATE"; template: { id: string; name: string; files: MediaFile[] } }
  | { type: "REMOVE_TEMPLATE" }
  | { type: "SET_RESIZABLE_MODE"; enabled: boolean }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "SET_PRERENDER_ENABLED"; enabled: boolean }
  | { type: "SET_PRERENDER_QUALITY"; quality: number }
  | { type: "SET_PRERENDER_SEGMENT_DURATION"; duration: number }
  | { type: "SET_PRERENDER_APPLY_EFFECTS"; apply: boolean }
  | { type: "SET_PRERENDER_AUTO"; auto: boolean }
  | { type: "SYNC_STATE"; state: any }

export const playerMachine = setup({
  types: {
    context: {} as PlayerContext,
    events: {} as PlayerEvent,
  },
  actions: {
    loadVideo: assign({
      video: ({ event }) => {
        if (event.type !== "LOAD_VIDEO") return null
        console.log(`[Player Domain] Loading video: ${event.video.name}`)
        return event.video
      },
      isVideoLoading: () => true,
      isVideoReady: () => false,
      currentTime: () => 0,
      duration: () => 0,
    }),

    setVideoReady: assign({
      isVideoLoading: () => false,
      isVideoReady: () => true,
      duration: ({ event }) => {
        if (event.type !== "VIDEO_LOADED") return 0
        console.log(`[Player Domain] Video loaded, duration: ${event.duration}s`)
        return event.duration
      },
    }),

    setVideoError: assign({
      isVideoLoading: () => false,
      isVideoReady: () => false,
    }),

    play: assign({
      isPlaying: () => {
        console.log("[Player Domain] Playing")
        return true
      },
    }),

    pause: assign({
      isPlaying: () => {
        console.log("[Player Domain] Paused")
        return false
      },
    }),

    stop: assign({
      isPlaying: () => false,
      currentTime: () => 0,
    }),

    seek: assign({
      currentTime: ({ event }) => {
        if (event.type !== "SEEK") return 0
        console.log(`[Player Domain] Seeking to ${event.time}s`)
        return event.time
      },
      isSeeking: () => true,
    }),

    updateTime: assign({
      currentTime: ({ event }) => {
        if (event.type !== "UPDATE_TIME") return 0
        return event.time
      },
      isSeeking: () => false,
    }),

    setVolume: assign({
      volume: ({ event }) => {
        if (event.type !== "SET_VOLUME") return 0.5
        const clampedVolume = Math.max(0, Math.min(1, event.volume))
        console.log(`[Player Domain] Setting volume: ${clampedVolume}`)
        return clampedVolume
      },
    }),

    setPlaybackRate: assign({
      currentPlaybackRate: ({ event }) => {
        if (event.type !== "SET_PLAYBACK_RATE") return 1
        console.log(`[Player Domain] Setting playback rate: ${event.rate}`)
        return event.rate
      },
    }),

    setBasePlaybackRate: assign({
      basePlaybackRate: ({ event }) => {
        if (event.type !== "SET_BASE_PLAYBACK_RATE") return 1
        return event.rate
      },
    }),

    toggleSpeedRamping: assign({
      speedRampingEnabled: ({ context }) => {
        const newState = !context.speedRampingEnabled
        console.log(`[Player Domain] Speed ramping: ${newState}`)
        return newState
      },
    }),

    setVideoSource: assign({
      videoSource: ({ event }) => {
        if (event.type !== "SET_VIDEO_SOURCE") return "browser"
        console.log(`[Player Domain] Video source: ${event.source}`)
        return event.source
      },
    }),

    setPreviewMedia: assign({
      previewMedia: ({ event }) => {
        if (event.type !== "SET_PREVIEW_MEDIA") return null
        return event.media
      },
    }),

    applyEffect: assign({
      appliedEffects: ({ context, event }) => {
        if (event.type !== "APPLY_EFFECT") return context.appliedEffects
        console.log(`[Player Domain] Applying effect: ${event.effect.name}`)
        return [...context.appliedEffects, event.effect]
      },
    }),

    removeEffect: assign({
      appliedEffects: ({ context, event }) => {
        if (event.type !== "REMOVE_EFFECT") return context.appliedEffects
        return context.appliedEffects.filter((e) => e.id !== event.effectId)
      },
    }),

    applyFilter: assign({
      appliedFilters: ({ context, event }) => {
        if (event.type !== "APPLY_FILTER") return context.appliedFilters
        console.log(`[Player Domain] Applying filter: ${event.filter.name}`)
        return [...context.appliedFilters, event.filter]
      },
    }),

    removeFilter: assign({
      appliedFilters: ({ context, event }) => {
        if (event.type !== "REMOVE_FILTER") return context.appliedFilters
        return context.appliedFilters.filter((f) => f.id !== event.filterId)
      },
    }),

    applyTemplate: assign({
      appliedTemplate: ({ event }) => {
        if (event.type !== "APPLY_TEMPLATE") return null
        console.log(`[Player Domain] Applying template: ${event.template.name}`)
        return event.template
      },
    }),

    removeTemplate: assign({
      appliedTemplate: () => null,
    }),

    setResizableMode: assign({
      isResizableMode: ({ event }) => {
        if (event.type !== "SET_RESIZABLE_MODE") return false
        console.log(`[Player Domain] Resizable mode: ${event.enabled}`)
        return event.enabled
      },
    }),

    startRecording: assign({
      isRecording: () => {
        console.log("[Player Domain] Recording started")
        return true
      },
    }),

    stopRecording: assign({
      isRecording: () => {
        console.log("[Player Domain] Recording stopped")
        return false
      },
    }),

    // Prerender settings
    setPrerenderEnabled: assign({
      prerenderEnabled: ({ event }) => {
        if (event.type !== "SET_PRERENDER_ENABLED") return false
        return event.enabled
      },
    }),

    setPrerenderQuality: assign({
      prerenderQuality: ({ event }) => {
        if (event.type !== "SET_PRERENDER_QUALITY") return 0.8
        return Math.max(0.1, Math.min(1, event.quality))
      },
    }),

    setPrerenderSegmentDuration: assign({
      prerenderSegmentDuration: ({ event }) => {
        if (event.type !== "SET_PRERENDER_SEGMENT_DURATION") return 5
        return Math.max(1, Math.min(30, event.duration))
      },
    }),

    setPrerenderApplyEffects: assign({
      prerenderApplyEffects: ({ event }) => {
        if (event.type !== "SET_PRERENDER_APPLY_EFFECTS") return true
        return event.apply
      },
    }),

    setPrerenderAuto: assign({
      prerenderAutoPrerender: ({ event }) => {
        if (event.type !== "SET_PRERENDER_AUTO") return false
        return event.auto
      },
    }),

    resetPlayer: assign(() => ({
      ...initialContext,
    })),
  },
}).createMachine({
  id: "video-editing-player",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        LOAD_VIDEO: {
          target: "loading",
          actions: ["loadVideo"],
        },
        SET_VIDEO_SOURCE: {
          actions: ["setVideoSource"],
        },
        SET_PREVIEW_MEDIA: {
          actions: ["setPreviewMedia"],
        },
        SET_VOLUME: {
          actions: ["setVolume"],
        },
        TOGGLE_SPEED_RAMPING: {
          actions: ["toggleSpeedRamping"],
        },
        SET_BASE_PLAYBACK_RATE: {
          actions: ["setBasePlaybackRate"],
        },
        SET_RESIZABLE_MODE: {
          actions: ["setResizableMode"],
        },
        // Prerender settings
        SET_PRERENDER_ENABLED: {
          actions: ["setPrerenderEnabled"],
        },
        SET_PRERENDER_QUALITY: {
          actions: ["setPrerenderQuality"],
        },
        SET_PRERENDER_SEGMENT_DURATION: {
          actions: ["setPrerenderSegmentDuration"],
        },
        SET_PRERENDER_APPLY_EFFECTS: {
          actions: ["setPrerenderApplyEffects"],
        },
        SET_PRERENDER_AUTO: {
          actions: ["setPrerenderAuto"],
        },
      },
    },

    loading: {
      on: {
        VIDEO_LOADED: {
          target: "ready",
          actions: ["setVideoReady"],
        },
        VIDEO_ERROR: {
          target: "error",
          actions: ["setVideoError"],
        },
      },
    },

    ready: {
      initial: "paused",
      states: {
        playing: {
          entry: ["play"],
          on: {
            PAUSE: {
              target: "paused",
              actions: ["pause"],
            },
            STOP: {
              target: "#video-editing-player.idle",
              actions: ["stop"],
            },
            UPDATE_TIME: {
              actions: ["updateTime"],
            },
            VIDEO_ENDED: {
              target: "paused",
              actions: ["pause"],
            },
            START_RECORDING: {
              actions: ["startRecording"],
            },
          },
        },

        paused: {
          on: {
            PLAY: {
              target: "playing",
            },
            STOP: {
              target: "#video-editing-player.idle",
              actions: ["stop"],
            },
            SEEK: {
              actions: ["seek"],
            },
            STOP_RECORDING: {
              actions: ["stopRecording"],
            },
          },
        },
      },

      on: {
        // Общие события для состояния ready
        LOAD_VIDEO: {
          target: "#video-editing-player.loading",
          actions: ["loadVideo"],
        },
        SET_VOLUME: {
          actions: ["setVolume"],
        },
        SET_PLAYBACK_RATE: {
          actions: ["setPlaybackRate"],
        },
        TOGGLE_SPEED_RAMPING: {
          actions: ["toggleSpeedRamping"],
        },
        SET_BASE_PLAYBACK_RATE: {
          actions: ["setBasePlaybackRate"],
        },
        APPLY_EFFECT: {
          actions: ["applyEffect"],
        },
        REMOVE_EFFECT: {
          actions: ["removeEffect"],
        },
        APPLY_FILTER: {
          actions: ["applyFilter"],
        },
        REMOVE_FILTER: {
          actions: ["removeFilter"],
        },
        APPLY_TEMPLATE: {
          actions: ["applyTemplate"],
        },
        REMOVE_TEMPLATE: {
          actions: ["removeTemplate"],
        },
        SET_RESIZABLE_MODE: {
          actions: ["setResizableMode"],
        },
      },
    },

    error: {
      on: {
        LOAD_VIDEO: {
          target: "loading",
          actions: ["loadVideo"],
        },
      },
    },
  },
})

export type PlayerMachine = typeof playerMachine
