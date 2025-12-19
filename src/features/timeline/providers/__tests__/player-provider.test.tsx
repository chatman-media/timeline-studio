/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/domains/media-management"
import { PlayerProvider, usePlayer } from "../player-provider"

// Mock dependencies
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    debugSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
  }),
}))

// Mock service config
vi.mock("@/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

// Mock backend
const mockExecuteCommand = vi.fn()
const mockOnStateChange = vi.fn()
const mockOnEvent = vi.fn(() => vi.fn())
const mockBackend = {
  executeCommand: mockExecuteCommand,
  onStateChange: mockOnStateChange,
  onEvent: mockOnEvent,
}

vi.mock("@/core/container", () => ({
  container: {
    getBackend: () => mockBackend,
  },
}))

// Mock user settings
const mockUserSettings = {
  playerVolume: 50,
  playerVideoSource: "browser" as const,
  updatePlayerVolume: vi.fn(),
  updatePlayerVideoSource: vi.fn(),
}

vi.mock("@/domains/project-management", () => ({
  useUserSettings: () => mockUserSettings,
}))

// Mock playback time sync hook
const mockUsePlaybackTimeSync = vi.fn()
vi.mock("@/domains/video-editing/hooks", () => ({
  usePlaybackTimeSync: (config: any) => {
    mockUsePlaybackTimeSync(config)
    return config.initialTime
  },
}))

// Mock CommandQueue - define inside vi.mock to avoid hoisting issues
vi.mock("@/features/video-player/services/command-queue", () => {
  class MockCommandQueue {
    enqueue = vi.fn(async (fn: () => Promise<any>) => await fn())
  }

  return {
    CommandQueue: MockCommandQueue,
  }
})

// Mock retry helper
vi.mock("@/features/video-player/utils/retry-helper", () => ({
  retryWithBackoff: vi.fn(async (fn: () => Promise<any>) => await fn()),
  defaultShouldRetry: vi.fn(() => true),
}))

// Mock AppCommands - define inside vi.mock to avoid hoisting issues
vi.mock("@/domains/project-management/machines/app-machine", () => ({
  AppCommands: {
    playerSetMedia: vi.fn((mediaId, startTime) => ({
      type: "PlayerSetMedia",
      params: { mediaId, startTime },
    })),
    playerSetVolume: vi.fn((volume) => ({
      type: "PlayerSetVolume",
      params: { volume },
    })),
    playerSelectClip: vi.fn((clipId) => ({
      type: "PlayerSelectClip",
      params: { clipId },
    })),
    playerClearSelection: vi.fn(() => ({
      type: "PlayerClearSelection",
      params: {},
    })),
    playerSetSource: vi.fn((source) => ({
      type: "PlayerSetSource",
      params: { source },
    })),
    playerApplyEffect: vi.fn((effectId, params) => ({
      type: "PlayerApplyEffect",
      params: { effectId, params },
    })),
    playerApplyFilter: vi.fn((filterId, params) => ({
      type: "PlayerApplyFilter",
      params: { filterId, params },
    })),
    playerApplyTemplate: vi.fn((templateId, mediaIds) => ({
      type: "PlayerApplyTemplate",
      params: { templateId, mediaIds },
    })),
    playerClearEffects: vi.fn(() => ({
      type: "PlayerClearEffects",
      params: {},
    })),
    playerClearFilters: vi.fn(() => ({
      type: "PlayerClearFilters",
      params: {},
    })),
    playerClearTemplate: vi.fn(() => ({
      type: "PlayerClearTemplate",
      params: {},
    })),
  },
}))

// Import after mocks
import { AppCommands } from "@/domains/project-management/machines/app-machine"

describe("PlayerProvider", () => {
  let mockBackendState: any
  let stateChangeCallback: ((state: any) => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()

    // Default backend state
    mockBackendState = {
      playback_state: {
        current_time: 0,
        is_playing: false,
        playback_rate: 1.0,
        volume: 1.0,
        duration: 0,
        video_source: "timeline",
        selected_clip_id: null,
        is_loading: false,
        is_seeking: false,
      },
    }

    mockExecuteCommand.mockResolvedValue({ success: true, data: null })
    mockOnStateChange.mockImplementation((callback) => {
      stateChangeCallback = callback
      callback(mockBackendState)
      return vi.fn()
    })
    mockOnEvent.mockReturnValue(vi.fn())
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlayerProvider data-oid="uz_3.3u">{children}</PlayerProvider>
  )

  describe("Provider Initialization", () => {
    it("initializes with default state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.currentTime).toBe(0)
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.playbackRate).toBe(1.0)
      expect(result.current.volume).toBe(1.0) // Backend volume overrides user settings
      expect(result.current.duration).toBe(0)
      expect(result.current.isVideoLoading).toBe(false)
      expect(result.current.isVideoReady).toBe(false)
      expect(result.current.isSeeking).toBe(false)
      expect(result.current.isChangingCamera).toBe(false)
      expect(result.current.isRecording).toBe(false)
      expect(result.current.isResizableMode).toBe(false)
    })

    it("subscribes to backend state changes on mount", () => {
      renderHook(() => usePlayer(), { wrapper })

      expect(mockOnStateChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it("provides context to children", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current).toBeDefined()
      expect(typeof result.current.play).toBe("function")
      expect(typeof result.current.pause).toBe("function")
      expect(typeof result.current.seek).toBe("function")
    })

    it("initializes playback time sync with backend state", () => {
      renderHook(() => usePlayer(), { wrapper })

      expect(mockUsePlaybackTimeSync).toHaveBeenCalledWith(
        expect.objectContaining({
          isPlaying: false,
          syncInterval: 1000,
          initialTime: 0,
          onBackendSync: expect.any(Function),
        }),
      )
    })
  })

  describe("Backend Sync", () => {
    it("syncs currentTime from backend state", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Create new backend state object (React needs new reference to detect change)
      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          current_time: 42.5,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        // Note: currentTime comes from usePlaybackTimeSync, which returns initialTime in our mock
        expect(mockUsePlaybackTimeSync).toHaveBeenCalledWith(
          expect.objectContaining({
            initialTime: 42.5,
          }),
        )
      })
    })

    it("syncs isPlaying from backend state", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.isPlaying).toBe(false)

      // Create new backend state object
      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          is_playing: true,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true)
      })
    })

    it("syncs playbackRate from backend state", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.playbackRate).toBe(1.0)

      // Create new backend state object
      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          playback_rate: 2.0,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.playbackRate).toBe(2.0)
      })
    })

    it("sends Play command to backend when play() is called", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.play()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Play",
        params: {},
      })
    })

    it("sends Pause command to backend when pause() is called", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.pause()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Pause",
        params: {},
      })
    })

    it("sends Seek command with time when seek() is called", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.seek(30.5)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Seek",
        params: { time: 30.5 },
      })
    })

    it("sends SetPlaybackRate command when setPlaybackRate() is called", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.setPlaybackRate(1.5)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SetPlaybackRate",
        params: { rate: 1.5 },
      })
    })
  })

  describe("Speed Ramping", () => {
    it("setSpeedRampingEnabled toggles locally without backend call", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.speedRampingEnabled).toBe(false)

      act(() => {
        result.current.setSpeedRampingEnabled(true)
      })

      expect(result.current.speedRampingEnabled).toBe(true)
      // Should NOT call backend
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("setBasePlaybackRate updates base rate locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.basePlaybackRate).toBe(1.0)

      act(() => {
        result.current.setBasePlaybackRate(1.25)
      })

      expect(result.current.basePlaybackRate).toBe(1.25)
      // Should NOT call backend
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("updatePlaybackRate updates current rate locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.currentPlaybackRate).toBe(1.0)

      act(() => {
        result.current.updatePlaybackRate(0.5)
      })

      expect(result.current.currentPlaybackRate).toBe(0.5)
      // Should NOT call backend
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("speed ramping state is independent from backend playbackRate", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Set local speed ramping state
      act(() => {
        result.current.setSpeedRampingEnabled(true)
        result.current.setBasePlaybackRate(2.0)
        result.current.updatePlaybackRate(1.5)
      })

      // Create new backend state object
      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          playback_rate: 3.0,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        // Backend rate should sync
        expect(result.current.playbackRate).toBe(3.0)
        // But local speed ramping state should remain
        expect(result.current.speedRampingEnabled).toBe(true)
        expect(result.current.basePlaybackRate).toBe(2.0)
        expect(result.current.currentPlaybackRate).toBe(1.5)
      })
    })
  })

  describe("Preview Media", () => {
    it("setPreviewMedia updates local state without backend call", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const media: MediaFile = {
        id: "media-1",
        name: "test.mp4",
        path: "/path/to/test.mp4",
      } as any

      expect(result.current.previewMedia).toBeNull()

      act(() => {
        result.current.setPreviewMedia(media)
      })

      expect(result.current.previewMedia).toEqual(media)
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("setVideoSource switches between browser and timeline modes", () => {
      // Note: videoSource is overridden by backend state when available
      // So we need to set backend state to null to test local state
      mockBackendState.playback_state = null as any

      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Default is "browser" from userSettings
      expect(result.current.videoSource).toBe("browser")

      act(() => {
        result.current.setVideoSource("timeline")
      })

      expect(result.current.videoSource).toBe("timeline")
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("setCurrentVideo updates current video in local state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const video: MediaFile = {
        id: "video-1",
        name: "movie.mp4",
        path: "/path/to/movie.mp4",
      } as any

      expect(result.current.currentVideo).toBeNull()

      act(() => {
        result.current.setCurrentVideo(video)
      })

      expect(result.current.currentVideo).toEqual(video)
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })
  })

  describe("Local State Management", () => {
    it("setVolume updates local volume and user settings", () => {
      // Note: volume is overridden by backend when playback_state.volume exists
      // Test with backend state null to verify local state
      mockBackendState.playback_state = null as any

      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVolume(0.8)
      })

      expect(result.current.volume).toBe(0.8)
      expect(mockUserSettings.updatePlayerVolume).toHaveBeenCalledWith(80)
    })

    it("setDuration updates duration locally", () => {
      // Note: duration is overridden by backend when available
      mockBackendState.playback_state = null as any

      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setDuration(120)
      })

      expect(result.current.duration).toBe(120)
    })

    it("setVideoLoading updates loading state", () => {
      // Note: isVideoLoading is overridden by backend when available
      mockBackendState.playback_state = null as any

      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVideoLoading(true)
      })

      expect(result.current.isVideoLoading).toBe(true)
    })

    it("setVideoReady updates ready state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVideoReady(true)
      })

      expect(result.current.isVideoReady).toBe(true)
    })

    it("setIsSeeking updates seeking state", () => {
      // Note: isSeeking is overridden by backend when available
      mockBackendState.playback_state = null as any

      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setIsSeeking(true)
      })

      expect(result.current.isSeeking).toBe(true)
    })

    it("setIsChangingCamera updates camera change state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setIsChangingCamera(true)
      })

      expect(result.current.isChangingCamera).toBe(true)
    })

    it("setIsRecording updates recording state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setIsRecording(true)
      })

      expect(result.current.isRecording).toBe(true)
    })

    it("setIsResizableMode updates resizable mode state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setIsResizableMode(true)
      })

      expect(result.current.isResizableMode).toBe(true)
    })
  })

  describe("Effects and Filters", () => {
    it("applyEffect adds effect to local state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const effect = { id: "blur", name: "Blur", params: { intensity: 5 } }

      expect(result.current.appliedEffects).toEqual([])

      act(() => {
        result.current.applyEffect(effect)
      })

      expect(result.current.appliedEffects).toEqual([effect])
    })

    it("applyFilter adds filter to local state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const filter = {
        id: "vintage",
        name: "Vintage",
        params: { saturation: 0.8 },
      }

      expect(result.current.appliedFilters).toEqual([])

      act(() => {
        result.current.applyFilter(filter)
      })

      expect(result.current.appliedFilters).toEqual([filter])
    })

    it("applyTemplate sets template in local state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const template = { id: "split-screen", name: "Split Screen" }
      const files: MediaFile[] = []

      expect(result.current.appliedTemplate).toBeNull()

      act(() => {
        result.current.applyTemplate(template, files)
      })

      expect(result.current.appliedTemplate).toEqual(template)
    })

    it("clearEffects removes all effects", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.applyEffect({ id: "blur", name: "Blur", params: {} })
        result.current.applyEffect({
          id: "sharpen",
          name: "Sharpen",
          params: {},
        })
      })

      expect(result.current.appliedEffects).toHaveLength(2)

      act(() => {
        result.current.clearEffects()
      })

      expect(result.current.appliedEffects).toEqual([])
    })

    it("clearFilters removes all filters", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.applyFilter({
          id: "vintage",
          name: "Vintage",
          params: {},
        })
      })

      expect(result.current.appliedFilters).toHaveLength(1)

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.appliedFilters).toEqual([])
    })

    it("clearTemplate removes template", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.applyTemplate({ id: "template", name: "Template" }, [])
      })

      expect(result.current.appliedTemplate).not.toBeNull()

      act(() => {
        result.current.clearTemplate()
      })

      expect(result.current.appliedTemplate).toBeNull()
    })
  })

  describe("Prerender Settings", () => {
    it("setPrerenderSettings updates prerender configuration", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      expect(result.current.prerenderSettings.prerenderEnabled).toBe(false)
      expect(result.current.prerenderSettings.prerenderQuality).toBe(80)

      act(() => {
        result.current.setPrerenderSettings({
          prerenderEnabled: true,
          prerenderQuality: 90,
        })
      })

      expect(result.current.prerenderSettings.prerenderEnabled).toBe(true)
      expect(result.current.prerenderSettings.prerenderQuality).toBe(90)
      // Other settings should remain unchanged
      expect(result.current.prerenderSettings.prerenderSegmentDuration).toBe(10)
    })

    it("partially updates prerender settings", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setPrerenderSettings({ prerenderEnabled: true })
      })

      expect(result.current.prerenderSettings.prerenderEnabled).toBe(true)
      // Default values should remain
      expect(result.current.prerenderSettings.prerenderQuality).toBe(80)
      expect(result.current.prerenderSettings.prerenderApplyEffects).toBe(true)
    })
  })

  describe("Player Backend Commands", () => {
    it("playerSetMedia sends command with mediaId", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerSetMedia("media-123", 10)

      expect(AppCommands.playerSetMedia).toHaveBeenCalledWith("media-123", 10)
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerSetMedia",
        params: { mediaId: "media-123", startTime: 10 },
      })
    })

    it("playerSetMedia skips empty mediaId", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerSetMedia("", 0)

      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("playerSetVolume sends volume command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerSetVolume(0.7)

      expect(AppCommands.playerSetVolume).toHaveBeenCalledWith(0.7)
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerSetVolume",
        params: { volume: 0.7 },
      })
    })

    it("playerSelectClip sends select clip command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerSelectClip("clip-456")

      expect(AppCommands.playerSelectClip).toHaveBeenCalledWith("clip-456")
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerSelectClip",
        params: { clipId: "clip-456" },
      })
    })

    it("playerClearSelection sends clear selection command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerClearSelection()

      expect(AppCommands.playerClearSelection).toHaveBeenCalled()
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerClearSelection",
        params: {},
      })
    })

    it("playerSetSource sends set source command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerSetSource("browser")

      expect(AppCommands.playerSetSource).toHaveBeenCalledWith("browser")
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerSetSource",
        params: { source: "browser" },
      })
    })

    it("playerApplyEffect sends apply effect command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerApplyEffect("blur-effect", { intensity: 10 })

      expect(AppCommands.playerApplyEffect).toHaveBeenCalledWith("blur-effect", { intensity: 10 })
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerApplyEffect",
        params: { effectId: "blur-effect", params: { intensity: 10 } },
      })
    })

    it("playerApplyFilter sends apply filter command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerApplyFilter("vintage-filter", {
        saturation: 0.8,
      })

      expect(AppCommands.playerApplyFilter).toHaveBeenCalledWith("vintage-filter", { saturation: 0.8 })
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerApplyFilter",
        params: { filterId: "vintage-filter", params: { saturation: 0.8 } },
      })
    })

    it("playerApplyTemplate sends apply template command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerApplyTemplate("split-screen", ["media-1", "media-2"])

      expect(AppCommands.playerApplyTemplate).toHaveBeenCalledWith("split-screen", ["media-1", "media-2"])
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerApplyTemplate",
        params: {
          templateId: "split-screen",
          mediaIds: ["media-1", "media-2"],
        },
      })
    })

    it("playerClearEffects sends clear effects command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerClearEffects()

      expect(AppCommands.playerClearEffects).toHaveBeenCalled()
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerClearEffects",
        params: {},
      })
    })

    it("playerClearFilters sends clear filters command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerClearFilters()

      expect(AppCommands.playerClearFilters).toHaveBeenCalled()
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerClearFilters",
        params: {},
      })
    })

    it("playerClearTemplate sends clear template command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await result.current.playerClearTemplate()

      expect(AppCommands.playerClearTemplate).toHaveBeenCalled()
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "PlayerClearTemplate",
        params: {},
      })
    })
  })

  describe("Cleanup", () => {
    it("unsubscribes from backend on unmount", () => {
      const mockUnsubscribe = vi.fn()
      mockOnStateChange.mockImplementation((callback) => {
        stateChangeCallback = callback
        callback(mockBackendState)
        return mockUnsubscribe
      })

      const { unmount } = renderHook(() => usePlayer(), { wrapper })

      expect(mockOnStateChange).toHaveBeenCalled()

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it("throws error when usePlayer is used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => usePlayer())
      }).toThrow("usePlayer must be used within PlayerProvider")

      console.error = originalError
    })
  })

  describe("Backend State Override", () => {
    it("uses backend volume when available", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Create new backend state object
      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          volume: 0.75,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.volume).toBe(0.75)
      })
    })

    it("uses backend videoSource when available", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          video_source: "browser",
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.videoSource).toBe("browser")
      })
    })

    it("uses backend duration when available", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          duration: 180,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.duration).toBe(180)
      })
    })

    it("uses backend isSeeking when available", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          is_seeking: true,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.isSeeking).toBe(true)
      })
    })

    it("uses backend isVideoLoading when available", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          is_loading: true,
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.isVideoLoading).toBe(true)
      })
    })

    it("uses backend selectedClipId when available", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const newState = {
        ...mockBackendState,
        playback_state: {
          ...mockBackendState.playback_state,
          selected_clip_id: "clip-789",
        },
      }

      act(() => {
        stateChangeCallback?.(newState)
      })

      await waitFor(() => {
        expect(result.current.selectedClipId).toBe("clip-789")
      })
    })
  })
})
