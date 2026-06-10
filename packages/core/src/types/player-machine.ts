import type { MediaFile } from "./media"

export interface PlayerMachineContext {
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
  isResizableMode: boolean
  speedRampingEnabled: boolean
  currentPlaybackRate: number
  basePlaybackRate: number
  prerenderEnabled: boolean
  prerenderQuality: number
  prerenderSegmentDuration: number
  prerenderApplyEffects: boolean
  prerenderAutoPrerender: boolean
  previewMedia: MediaFile | null
  videoSource: "browser" | "timeline"
  appliedEffects: Array<{ id: string; name: string; params: any }>
  appliedFilters: Array<{ id: string; name: string; params: any }>
  appliedTemplate: {
    id: string
    name: string
    files: MediaFile[]
  } | null
}

export type PlayerContext = PlayerMachineContext

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

export type PlayerMachine = never
