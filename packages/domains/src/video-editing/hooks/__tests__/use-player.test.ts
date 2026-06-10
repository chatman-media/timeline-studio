/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для use-player hook
 *
 * Покрытие:
 * 1. Basic Playback (load, play, pause, stop, seek)
 * 2. Speed Ramping (toggle, set base rate)
 * 3. Effects & Filters management
 * 4. Recording functionality
 * 5. Prerender settings
 * 6. Video source management
 * 7. Edge cases и error handling
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getVideoEditingOrchestrator } from "../../services/video-editing-orchestrator"
import type { MediaFile } from "../../types"
import { MediaType } from "../../types"
import { usePlayer } from "../use-player"

// Mock orchestrator
vi.mock("../../services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    infoSync: vi.fn(),
    errorSync: vi.fn(),
    debugSync: vi.fn(),
    warnSync: vi.fn(),
  }),
}))

describe("usePlayer", () => {
  // Mock data
  const mockVideo: MediaFile = {
    id: "video-1",
    name: "test-video.mp4",
    path: "/test/video.mp4",
    type: MediaType.Video,
    duration: 120,
    size: 1024 * 1024,
    width: 1920,
    height: 1080,
    fps: 30,
  }

  const mockEffect = {
    id: "effect-1",
    name: "Blur",
    params: { intensity: 5 },
  }

  const mockFilter = {
    id: "filter-1",
    name: "Grayscale",
    params: {},
  }

  const mockTemplate = {
    id: "template-1",
    name: "Split Screen",
    files: [mockVideo],
  }

  // Mock orchestrator and actors
  let mockPlayerActor: any
  let mockOrchestrator: any
  let mockStateSubscription: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create mock player actor
    mockPlayerActor = {
      send: vi.fn(),
      getSnapshot: vi.fn(() => ({
        context: {
          video: null,
          currentTime: 0,
          duration: 0,
          volume: 0.5,
          isPlaying: false,
          isSeeking: false,
          isChangingCamera: false,
          isRecording: false,
          isVideoLoading: false,
          isVideoReady: false,
          isResizableMode: false,
          speedRampingEnabled: false,
          currentPlaybackRate: 1,
          basePlaybackRate: 1,
          prerenderEnabled: false,
          prerenderQuality: 0.8,
          prerenderSegmentDuration: 10,
          prerenderApplyEffects: false,
          prerenderAutoPrerender: false,
          previewMedia: null,
          videoSource: "timeline" as const,
          appliedEffects: [],
          appliedFilters: [],
          appliedTemplate: null,
        },
      })),
    }

    // Create mock orchestrator
    mockStateSubscription = {
      unsubscribe: vi.fn(),
    }

    mockOrchestrator = {
      getPlayerState: vi.fn(() => mockPlayerActor.getSnapshot()),
      getActors: vi.fn(() => ({
        player: mockPlayerActor,
      })),
      subscribeToPlayer: vi.fn((callback) => {
        // Immediately call with initial state
        callback(mockPlayerActor.getSnapshot())
        return mockStateSubscription
      }),
      play: vi.fn(),
      pause: vi.fn(),
      stopPlayback: vi.fn(),
      seek: vi.fn(),
    }

    vi.mocked(getVideoEditingOrchestrator).mockReturnValue(mockOrchestrator)
  })

  describe("Initialization", () => {
    it("should initialize with orchestrator state", () => {
      const { result } = renderHook(() => usePlayer())

      expect(result.current.video).toBeNull()
      expect(result.current.currentTime).toBe(0)
      expect(result.current.duration).toBe(0)
      expect(result.current.volume).toBe(0.5)
      expect(result.current.isPlaying).toBe(false)
    })

    it("should subscribe to player state changes", () => {
      renderHook(() => usePlayer())

      expect(mockOrchestrator.subscribeToPlayer).toHaveBeenCalled()
    })

    it("should unsubscribe on unmount", () => {
      const { unmount } = renderHook(() => usePlayer())

      unmount()

      expect(mockStateSubscription.unsubscribe).toHaveBeenCalled()
    })

    it("should compute helper properties correctly", () => {
      const { result } = renderHook(() => usePlayer())

      expect(result.current.hasVideo).toBe(false)
      expect(result.current.canPlay).toBe(false)
      expect(result.current.canPause).toBe(false)
      expect(result.current.hasEffects).toBe(false)
      expect(result.current.hasFilters).toBe(false)
      expect(result.current.hasTemplate).toBe(false)
    })
  })

  describe("Basic Playback", () => {
    it("should load video successfully", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.loadVideo(mockVideo)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "LOAD_VIDEO",
        video: mockVideo,
      })
    })

    it("should play video when play is called", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.play()
      })

      expect(mockOrchestrator.play).toHaveBeenCalled()
    })

    it("should pause video when pause is called", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.pause()
      })

      expect(mockOrchestrator.pause).toHaveBeenCalled()
    })

    it("should stop video when stop is called", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.stop()
      })

      expect(mockOrchestrator.stopPlayback).toHaveBeenCalled()
    })

    it("should seek to specific time", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.seek(30)
      })

      expect(mockOrchestrator.seek).toHaveBeenCalledWith(30)
    })

    it("should update playback rate", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPlaybackRate(2)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        rate: 2,
      })
    })

    it("should set volume", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setVolume(0.8)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_VOLUME",
        volume: 0.8,
      })
    })

    it("should update state when video is loaded", async () => {
      const { result, rerender } = renderHook(() => usePlayer())

      // Simulate video loaded
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          video: mockVideo,
          isVideoReady: true,
          duration: 120,
        },
      })

      // Trigger subscription callback
      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.video).toEqual(mockVideo)
        expect(result.current.isVideoReady).toBe(true)
        expect(result.current.duration).toBe(120)
        expect(result.current.hasVideo).toBe(true)
        expect(result.current.canPlay).toBe(true)
      })
    })
  })

  describe("Speed Ramping", () => {
    it("should toggle speed ramping on/off", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.toggleSpeedRamping()
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "TOGGLE_SPEED_RAMPING",
      })
    })

    it("should set base playback rate", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setBasePlaybackRate(1.5)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_BASE_PLAYBACK_RATE",
        rate: 1.5,
      })
    })

    it("should update speed ramping state", async () => {
      const { result } = renderHook(() => usePlayer())

      // Simulate speed ramping enabled
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          speedRampingEnabled: true,
          basePlaybackRate: 2,
          currentPlaybackRate: 2,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.speedRampingEnabled).toBe(true)
        expect(result.current.basePlaybackRate).toBe(2)
        expect(result.current.currentPlaybackRate).toBe(2)
      })
    })
  })

  describe("Effects Management", () => {
    it("should apply effect to video", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.applyEffect(mockEffect)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "APPLY_EFFECT",
        effect: mockEffect,
      })
    })

    it("should remove effect from video", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.removeEffect("effect-1")
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "REMOVE_EFFECT",
        effectId: "effect-1",
      })
    })

    it("should track hasEffects correctly", async () => {
      const { result } = renderHook(() => usePlayer())

      // Add effect
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          appliedEffects: [mockEffect],
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasEffects).toBe(true)
        expect(result.current.appliedEffects).toEqual([mockEffect])
      })
    })
  })

  describe("Filters Management", () => {
    it("should apply filter to video", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.applyFilter(mockFilter)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "APPLY_FILTER",
        filter: mockFilter,
      })
    })

    it("should remove filter from video", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.removeFilter("filter-1")
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "REMOVE_FILTER",
        filterId: "filter-1",
      })
    })

    it("should track hasFilters correctly", async () => {
      const { result } = renderHook(() => usePlayer())

      // Add filter
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          appliedFilters: [mockFilter],
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasFilters).toBe(true)
        expect(result.current.appliedFilters).toEqual([mockFilter])
      })
    })
  })

  describe("Templates Management", () => {
    it("should apply template", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.applyTemplate(mockTemplate)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "APPLY_TEMPLATE",
        template: mockTemplate,
      })
    })

    it("should remove template", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.removeTemplate()
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "REMOVE_TEMPLATE",
      })
    })

    it("should track hasTemplate correctly", async () => {
      const { result } = renderHook(() => usePlayer())

      // Add template
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          appliedTemplate: mockTemplate,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.hasTemplate).toBe(true)
        expect(result.current.appliedTemplate).toEqual(mockTemplate)
      })
    })
  })

  describe("Recording", () => {
    it("should start recording", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.startRecording()
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "START_RECORDING",
      })
    })

    it("should stop recording", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.stopRecording()
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "STOP_RECORDING",
      })
    })

    it("should update recording state", async () => {
      const { result } = renderHook(() => usePlayer())

      // Start recording
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          isRecording: true,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.isRecording).toBe(true)
      })
    })
  })

  describe("Prerender Settings", () => {
    it("should set prerender enabled", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPrerenderEnabled(true)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PRERENDER_ENABLED",
        enabled: true,
      })
    })

    it("should set prerender quality", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPrerenderQuality(0.9)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PRERENDER_QUALITY",
        quality: 0.9,
      })
    })

    it("should set prerender segment duration", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPrerenderSegmentDuration(15)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PRERENDER_SEGMENT_DURATION",
        duration: 15,
      })
    })

    it("should set prerender apply effects", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPrerenderApplyEffects(true)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PRERENDER_APPLY_EFFECTS",
        apply: true,
      })
    })

    it("should set prerender auto", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPrerenderAuto(true)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PRERENDER_AUTO",
        auto: true,
      })
    })
  })

  describe("Video Source Management", () => {
    it("should set video source to browser", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setVideoSource("browser")
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_VIDEO_SOURCE",
        source: "browser",
      })
    })

    it("should set video source to timeline", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setVideoSource("timeline")
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_VIDEO_SOURCE",
        source: "timeline",
      })
    })

    it("should set preview media", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPreviewMedia(mockVideo)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PREVIEW_MEDIA",
        media: mockVideo,
      })
    })

    it("should clear preview media", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setPreviewMedia(null)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_PREVIEW_MEDIA",
        media: null,
      })
    })

    it("should return previewMedia as currentVideo when source is browser", async () => {
      const { result } = renderHook(() => usePlayer())

      const mockPreviewVideo: MediaFile = {
        id: "preview-video-1",
        name: "preview.mp4",
        path: "/test/preview.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 512 * 1024,
        width: 1280,
        height: 720,
        fps: 30,
      }

      // Set browser source with preview media
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          videoSource: "browser",
          previewMedia: mockPreviewVideo,
          video: mockVideo, // Different main video
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.currentVideo).toEqual(mockPreviewVideo)
        expect(result.current.currentVideo).not.toEqual(mockVideo)
      })
    })

    it("should return video as currentVideo when source is timeline", async () => {
      const { result } = renderHook(() => usePlayer())

      const mockPreviewVideo: MediaFile = {
        id: "preview-video-1",
        name: "preview.mp4",
        path: "/test/preview.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 512 * 1024,
        width: 1280,
        height: 720,
        fps: 30,
      }

      // Set timeline source with both video and preview media
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          videoSource: "timeline",
          previewMedia: mockPreviewVideo,
          video: mockVideo,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.currentVideo).toEqual(mockVideo)
        expect(result.current.currentVideo).not.toEqual(mockPreviewVideo)
      })
    })

    it("should return video as currentVideo when source is browser but no preview media", async () => {
      const { result } = renderHook(() => usePlayer())

      // Set browser source but no preview media
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          videoSource: "browser",
          previewMedia: null,
          video: mockVideo,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.currentVideo).toEqual(mockVideo)
      })
    })
  })

  describe("Resizable Mode", () => {
    it("should enable resizable mode", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setResizableMode(true)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_RESIZABLE_MODE",
        enabled: true,
      })
    })

    it("should disable resizable mode", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.setResizableMode(false)
      })

      expect(mockPlayerActor.send).toHaveBeenCalledWith({
        type: "SET_RESIZABLE_MODE",
        enabled: false,
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle multiple state updates", async () => {
      const { result } = renderHook(() => usePlayer())

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]

      // Update 1
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          currentTime: 10,
        },
      })
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      // Update 2
      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          currentTime: 20,
        },
      })
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.currentTime).toBe(20)
      })
    })

    it("should maintain orchestrator instance across re-renders", () => {
      const { rerender } = renderHook(() => usePlayer())

      const mockedOrchestrator = vi.mocked(getVideoEditingOrchestrator)
      const firstCallCount = mockedOrchestrator.mock.calls.length

      rerender()
      rerender()
      rerender()

      // Should only call once during initialization
      expect(getVideoEditingOrchestrator).toHaveBeenCalledTimes(firstCallCount)
    })

    it("should compute canPlay correctly when video is ready", async () => {
      const { result } = renderHook(() => usePlayer())

      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          video: mockVideo,
          isVideoReady: true,
          isPlaying: false,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.canPlay).toBe(true)
        expect(result.current.canPause).toBe(false)
      })
    })

    it("should compute canPause correctly when playing", async () => {
      const { result } = renderHook(() => usePlayer())

      mockPlayerActor.getSnapshot.mockReturnValue({
        context: {
          ...mockPlayerActor.getSnapshot().context,
          video: mockVideo,
          isVideoReady: true,
          isPlaying: true,
        },
      })

      const subscribeCallback = mockOrchestrator.subscribeToPlayer.mock.calls[0][0]
      act(() => {
        subscribeCallback(mockPlayerActor.getSnapshot())
      })

      await waitFor(() => {
        expect(result.current.canPlay).toBe(false)
        expect(result.current.canPause).toBe(true)
      })
    })

    it("should handle rapid play/pause calls", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.play()
        result.current.pause()
        result.current.play()
        result.current.pause()
      })

      expect(mockOrchestrator.play).toHaveBeenCalledTimes(2)
      expect(mockOrchestrator.pause).toHaveBeenCalledTimes(2)
    })

    it("should handle rapid seek calls", () => {
      const { result } = renderHook(() => usePlayer())

      act(() => {
        result.current.seek(10)
        result.current.seek(20)
        result.current.seek(30)
      })

      expect(mockOrchestrator.seek).toHaveBeenCalledTimes(3)
      expect(mockOrchestrator.seek).toHaveBeenLastCalledWith(30)
    })
  })
})
