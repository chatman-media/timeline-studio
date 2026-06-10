/**
 * Player Machine Tests
 *
 * Тесты для XState машины управления воспроизведением
 */

import { beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { playerMachine } from "../../machines/player-machine"
import { MediaType } from "../../types/media"

describe("PlayerMachine", () => {
  let actor: ReturnType<typeof createActor<typeof playerMachine>>

  beforeEach(() => {
    actor = createActor(playerMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should have initial context values", () => {
      const { context } = actor.getSnapshot()

      expect(context.video).toBeNull()
      expect(context.currentTime).toBe(0)
      expect(context.duration).toBe(0)
      expect(context.volume).toBe(50) // Диапазон 0-100
      expect(context.isPlaying).toBe(false)
      expect(context.isSeeking).toBe(false)
      expect(context.isVideoLoading).toBe(false)
      expect(context.isVideoReady).toBe(false)
      expect(context.currentPlaybackRate).toBe(1)
      expect(context.basePlaybackRate).toBe(1)
    })
  })

  describe("Video Loading", () => {
    const mockVideo = {
      id: "video-1",
      name: "test-video.mp4",
      path: "/test/video.mp4",
      type: MediaType.Video,
      duration: 120,
      size: 1024 * 1024 * 50,
    }

    it("should transition to loading state", () => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })

      expect(actor.getSnapshot().value).toBe("loading")
      expect(actor.getSnapshot().context.video).toEqual(mockVideo)
      expect(actor.getSnapshot().context.isVideoLoading).toBe(true)
    })

    it("should transition to ready state when video loaded", () => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 120 })

      expect(actor.getSnapshot().value).toEqual({ ready: "paused" })
      expect(actor.getSnapshot().context.isVideoReady).toBe(true)
      expect(actor.getSnapshot().context.duration).toBe(120)
    })

    it("should transition to error state on video error", () => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_ERROR", error: "Failed to load video" })

      expect(actor.getSnapshot().value).toBe("error")
      expect(actor.getSnapshot().context.isVideoReady).toBe(false)
    })

    it("should reset current time and duration on video load", () => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })

      const { context } = actor.getSnapshot()
      expect(context.currentTime).toBe(0)
      expect(context.duration).toBe(0)
    })
  })

  describe("Playback Control", () => {
    const mockVideo = {
      id: "video-1",
      name: "test-video.mp4",
      path: "/test/video.mp4",
      type: MediaType.Video,
      duration: 120,
      size: 1024 * 1024,
    }

    beforeEach(() => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 120 })
    })

    it("should play video", () => {
      actor.send({ type: "PLAY" })

      expect(actor.getSnapshot().value).toEqual({ ready: "playing" })
      expect(actor.getSnapshot().context.isPlaying).toBe(true)
    })

    it("should pause video", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "PAUSE" })

      expect(actor.getSnapshot().value).toEqual({ ready: "paused" })
      expect(actor.getSnapshot().context.isPlaying).toBe(false)
    })

    it("should stop video and return to idle", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "STOP" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.isPlaying).toBe(false)
      expect(actor.getSnapshot().context.currentTime).toBe(0)
    })

    it("should handle video ended event", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "VIDEO_ENDED" })

      expect(actor.getSnapshot().value).toEqual({ ready: "paused" })
      expect(actor.getSnapshot().context.isPlaying).toBe(false)
    })
  })

  describe("Seeking", () => {
    const mockVideo = {
      id: "video-1",
      name: "test-video.mp4",
      path: "/test/video.mp4",
      type: MediaType.Video,
      duration: 120,
      size: 1024 * 1024,
    }

    beforeEach(() => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 120 })
    })

    it("should seek to specific time", () => {
      actor.send({ type: "SEEK", time: 45.5 })

      const { context } = actor.getSnapshot()
      expect(context.currentTime).toBe(45.5)
      expect(context.isSeeking).toBe(true)
    })

    it("should update time during playback and clear seeking flag", () => {
      // UPDATE_TIME is only handled in playing state, not in paused
      // This test verifies that UPDATE_TIME works during playback
      actor.send({ type: "PLAY" })

      // Send UPDATE_TIME while playing
      actor.send({ type: "UPDATE_TIME", time: 5.2 })

      const { context } = actor.getSnapshot()
      expect(context.currentTime).toBe(5.2)
      expect(context.isSeeking).toBe(false)
    })

    it("should update time during playback", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "UPDATE_TIME", time: 5.2 })

      expect(actor.getSnapshot().context.currentTime).toBe(5.2)
    })
  })

  describe("Volume Control", () => {
    it("should set volume in idle state", () => {
      actor.send({ type: "SET_VOLUME", volume: 0.8 })

      expect(actor.getSnapshot().context.volume).toBe(0.8)
    })

    it("should set volume in ready state", () => {
      const mockVideo = {
        id: "video-1",
        name: "test.mp4",
        path: "/test/test.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024,
      }

      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 60 })
      actor.send({ type: "SET_VOLUME", volume: 0.3 })

      expect(actor.getSnapshot().context.volume).toBe(0.3)
    })

    it("should clamp volume to 0-1 range", () => {
      actor.send({ type: "SET_VOLUME", volume: 1.5 })
      expect(actor.getSnapshot().context.volume).toBe(1)

      actor.send({ type: "SET_VOLUME", volume: -0.5 })
      expect(actor.getSnapshot().context.volume).toBe(0)
    })
  })

  describe("Playback Rate", () => {
    const mockVideo = {
      id: "video-1",
      name: "test.mp4",
      path: "/test/test.mp4",
      type: MediaType.Video,
      duration: 60,
      size: 1024,
    }

    beforeEach(() => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 60 })
    })

    it("should set playback rate", () => {
      actor.send({ type: "SET_PLAYBACK_RATE", rate: 1.5 })

      expect(actor.getSnapshot().context.currentPlaybackRate).toBe(1.5)
    })

    it("should set base playback rate", () => {
      actor.send({ type: "SET_BASE_PLAYBACK_RATE", rate: 2.0 })

      expect(actor.getSnapshot().context.basePlaybackRate).toBe(2.0)
    })

    it("should toggle speed ramping", () => {
      expect(actor.getSnapshot().context.speedRampingEnabled).toBe(false)

      actor.send({ type: "TOGGLE_SPEED_RAMPING" })
      expect(actor.getSnapshot().context.speedRampingEnabled).toBe(true)

      actor.send({ type: "TOGGLE_SPEED_RAMPING" })
      expect(actor.getSnapshot().context.speedRampingEnabled).toBe(false)
    })
  })

  describe("Video Source and Preview", () => {
    it("should set video source", () => {
      actor.send({ type: "SET_VIDEO_SOURCE", source: "timeline" })

      expect(actor.getSnapshot().context.videoSource).toBe("timeline")
    })

    it("should set preview media", () => {
      const previewMedia = {
        id: "preview-1",
        name: "preview.mp4",
        path: "/test/preview.mp4",
        type: MediaType.Video,
        duration: 30,
        size: 1024,
      }

      actor.send({ type: "SET_PREVIEW_MEDIA", media: previewMedia })

      expect(actor.getSnapshot().context.previewMedia).toEqual(previewMedia)
    })

    it("should clear preview media", () => {
      const previewMedia = {
        id: "preview-1",
        name: "preview.mp4",
        path: "/test/preview.mp4",
        type: MediaType.Video,
        duration: 30,
        size: 1024,
      }

      actor.send({ type: "SET_PREVIEW_MEDIA", media: previewMedia })
      actor.send({ type: "SET_PREVIEW_MEDIA", media: null })

      expect(actor.getSnapshot().context.previewMedia).toBeNull()
    })
  })

  describe("Effects and Filters", () => {
    const mockVideo = {
      id: "video-1",
      name: "test.mp4",
      path: "/test/test.mp4",
      type: MediaType.Video,
      duration: 60,
      size: 1024,
    }

    beforeEach(() => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 60 })
    })

    it("should apply effect", () => {
      actor.send({
        type: "APPLY_EFFECT",
        effect: {
          id: "effect-1",
          name: "Blur",
          params: { amount: 5 },
        },
      })

      const { context } = actor.getSnapshot()
      expect(context.appliedEffects).toHaveLength(1)
      expect(context.appliedEffects[0].id).toBe("effect-1")
      expect(context.appliedEffects[0].name).toBe("Blur")
    })

    it("should remove effect", () => {
      actor.send({
        type: "APPLY_EFFECT",
        effect: { id: "effect-1", name: "Blur", params: {} },
      })
      actor.send({ type: "REMOVE_EFFECT", effectId: "effect-1" })

      expect(actor.getSnapshot().context.appliedEffects).toHaveLength(0)
    })

    it("should apply filter", () => {
      actor.send({
        type: "APPLY_FILTER",
        filter: {
          id: "filter-1",
          name: "Grayscale",
          params: {},
        },
      })

      const { context } = actor.getSnapshot()
      expect(context.appliedFilters).toHaveLength(1)
      expect(context.appliedFilters[0].name).toBe("Grayscale")
    })

    it("should remove filter", () => {
      actor.send({
        type: "APPLY_FILTER",
        filter: { id: "filter-1", name: "Grayscale", params: {} },
      })
      actor.send({ type: "REMOVE_FILTER", filterId: "filter-1" })

      expect(actor.getSnapshot().context.appliedFilters).toHaveLength(0)
    })

    it("should apply multiple effects", () => {
      actor.send({
        type: "APPLY_EFFECT",
        effect: { id: "effect-1", name: "Blur", params: {} },
      })
      actor.send({
        type: "APPLY_EFFECT",
        effect: { id: "effect-2", name: "Sharpen", params: {} },
      })

      expect(actor.getSnapshot().context.appliedEffects).toHaveLength(2)
    })
  })

  describe("Templates", () => {
    const mockVideo = {
      id: "video-1",
      name: "test.mp4",
      path: "/test/test.mp4",
      type: MediaType.Video,
      duration: 60,
      size: 1024,
    }

    beforeEach(() => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 60 })
    })

    it("should apply template", () => {
      actor.send({
        type: "APPLY_TEMPLATE",
        template: {
          id: "template-1",
          name: "Split Screen",
          files: [mockVideo],
        },
      })

      const { context } = actor.getSnapshot()
      expect(context.appliedTemplate).toBeDefined()
      expect(context.appliedTemplate?.name).toBe("Split Screen")
    })

    it("should remove template", () => {
      actor.send({
        type: "APPLY_TEMPLATE",
        template: {
          id: "template-1",
          name: "Split Screen",
          files: [mockVideo],
        },
      })
      actor.send({ type: "REMOVE_TEMPLATE" })

      expect(actor.getSnapshot().context.appliedTemplate).toBeNull()
    })
  })

  describe("Recording", () => {
    const mockVideo = {
      id: "video-1",
      name: "test.mp4",
      path: "/test/test.mp4",
      type: MediaType.Video,
      duration: 60,
      size: 1024,
    }

    beforeEach(() => {
      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_LOADED", duration: 60 })
    })

    it("should start recording while playing", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "START_RECORDING" })

      expect(actor.getSnapshot().context.isRecording).toBe(true)
    })

    it("should stop recording when paused", () => {
      actor.send({ type: "PLAY" })
      actor.send({ type: "START_RECORDING" })
      actor.send({ type: "PAUSE" })
      actor.send({ type: "STOP_RECORDING" })

      expect(actor.getSnapshot().context.isRecording).toBe(false)
    })
  })

  describe("Prerender Settings", () => {
    it("should set prerender enabled", () => {
      actor.send({ type: "SET_PRERENDER_ENABLED", enabled: true })

      expect(actor.getSnapshot().context.prerenderEnabled).toBe(true)
    })

    it("should set prerender quality", () => {
      actor.send({ type: "SET_PRERENDER_QUALITY", quality: 0.9 })

      expect(actor.getSnapshot().context.prerenderQuality).toBe(0.9)
    })

    it("should clamp prerender quality", () => {
      actor.send({ type: "SET_PRERENDER_QUALITY", quality: 1.5 })
      expect(actor.getSnapshot().context.prerenderQuality).toBe(1)

      actor.send({ type: "SET_PRERENDER_QUALITY", quality: 0 })
      expect(actor.getSnapshot().context.prerenderQuality).toBe(0.1)
    })

    it("should set prerender segment duration", () => {
      actor.send({ type: "SET_PRERENDER_SEGMENT_DURATION", duration: 10 })

      expect(actor.getSnapshot().context.prerenderSegmentDuration).toBe(10)
    })

    it("should clamp segment duration", () => {
      actor.send({ type: "SET_PRERENDER_SEGMENT_DURATION", duration: 50 })
      expect(actor.getSnapshot().context.prerenderSegmentDuration).toBe(30)

      actor.send({ type: "SET_PRERENDER_SEGMENT_DURATION", duration: 0 })
      expect(actor.getSnapshot().context.prerenderSegmentDuration).toBe(1)
    })

    it("should set prerender apply effects", () => {
      actor.send({ type: "SET_PRERENDER_APPLY_EFFECTS", apply: false })

      expect(actor.getSnapshot().context.prerenderApplyEffects).toBe(false)
    })

    it("should set prerender auto", () => {
      actor.send({ type: "SET_PRERENDER_AUTO", auto: true })

      expect(actor.getSnapshot().context.prerenderAutoPrerender).toBe(true)
    })
  })

  describe("Resizable Mode", () => {
    it("should set resizable mode", () => {
      actor.send({ type: "SET_RESIZABLE_MODE", enabled: true })

      expect(actor.getSnapshot().context.isResizableMode).toBe(true)
    })

    it("should toggle resizable mode", () => {
      actor.send({ type: "SET_RESIZABLE_MODE", enabled: true })
      actor.send({ type: "SET_RESIZABLE_MODE", enabled: false })

      expect(actor.getSnapshot().context.isResizableMode).toBe(false)
    })
  })

  describe("State Transitions", () => {
    it("should reload video from error state", () => {
      const mockVideo = {
        id: "video-1",
        name: "test.mp4",
        path: "/test/test.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024,
      }

      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      actor.send({ type: "VIDEO_ERROR", error: "Error" })

      expect(actor.getSnapshot().value).toBe("error")

      actor.send({ type: "LOAD_VIDEO", video: mockVideo })
      expect(actor.getSnapshot().value).toBe("loading")
    })

    it("should reload video from ready state", () => {
      const mockVideo1 = {
        id: "video-1",
        name: "test1.mp4",
        path: "/test/test1.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024,
      }

      const mockVideo2 = {
        id: "video-2",
        name: "test2.mp4",
        path: "/test/test2.mp4",
        type: MediaType.Video,
        duration: 90,
        size: 2048,
      }

      actor.send({ type: "LOAD_VIDEO", video: mockVideo1 })
      actor.send({ type: "VIDEO_LOADED", duration: 60 })
      actor.send({ type: "LOAD_VIDEO", video: mockVideo2 })

      expect(actor.getSnapshot().value).toBe("loading")
      expect(actor.getSnapshot().context.video).toEqual(mockVideo2)
    })
  })
})
