/**
 * Integration tests for PlayerProvider using MockBackendProvider
 *
 * Tests backend integration compliance and local state management
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock service configuration to enable video player service
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: (serviceName: string) => {
    console.log("isServiceEnabled called with:", serviceName)
    if (serviceName === "VIDEO_PLAYER" || serviceName === "TIMELINE_PLAYER") {
      return true
    }
    return false
  },
}))

// Mock user settings to include handlePlayerVolumeChange
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
    playerVolume: 50,
    updateSettings: vi.fn(),
    handlePlayerVolumeChange: vi.fn(),
    settings: {
      timelineVirtualizationEnabled: false,
      language: "en",
      theme: "light",
      quality: "medium",
      audioLanguage: "en",
      subtitleLanguage: "en",
      showSubtitles: false,
      autoSave: true,
      autoSaveInterval: 5,
    },
  }),
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Create a more sophisticated mock that can simulate state changes
let stateChangeCallback: ((state: any) => void) | null = null

const mockBackendSync = {
  getProjectState: vi.fn(() => ({
    playback_state: {
      is_playing: false,
      current_time: 0,
      playback_rate: 1,
      loop_enabled: false,
      loop_start: null,
      loop_end: null,
      volume: 1,
      current_media_id: null,
      selected_clip_id: null,
    },
    video_filters: [],
    video_effects: [],
    audio_filters: [],
    audio_effects: [],
    prerender_settings: {
      prerenderEnabled: false,
      prerenderQuality: 85,
      prerenderSegmentDuration: 10,
      prerenderApplyEffects: false,
      prerenderAutoPrerender: false,
    },
    speed_ramping: {
      speedRampingEnabled: false,
      speedRampPoints: [],
    },
  })),
  updateProjectState: vi.fn(),
  executeCommand: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onStateChange: vi.fn((callback) => {
    stateChangeCallback = callback
    // Return unsubscribe function
    return vi.fn(() => {
      stateChangeCallback = null
    })
  }),
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn(() => false),
  // Helper method to simulate state changes
  _triggerStateChange: (state: any) => {
    if (stateChangeCallback) {
      stateChangeCallback(state)
    }
  },
}

vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => mockBackendSync),
  BackendSync: vi.fn().mockImplementation(() => mockBackendSync),
}))

// Import after mocks are set up
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { MockBackendProvider, type MockProjectState } from "@/features/app-state/testing/mock-backend-provider"

// Import the real PlayerProvider implementation (bypass global mocks in setup)
let PlayerProvider: any
let usePlayer: any

beforeEach(async () => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Reset the mock implementation with proper success response
  mockBackendSync.executeCommand.mockResolvedValue({ success: true })

  const mod = await vi.importActual<typeof import("../player-provider")>("../player-provider")
  PlayerProvider = mod.PlayerProvider
  usePlayer = mod.usePlayer
})

// Test wrapper component
const TestWrapper = ({ children, mockState }: { children: React.ReactNode; mockState?: Partial<MockProjectState> }) => {
  if (!PlayerProvider) {
    throw new Error("PlayerProvider not initialized")
  }
  return (
    <MockBackendProvider initialState={mockState}>
      <PlayerProvider>{children}</PlayerProvider>
    </MockBackendProvider>
  )
}

describe("PlayerProvider Integration Tests", () => {
  it("should sync backend playback state", async () => {
    const mockBackendSync = getBackendSync()
    const mockState: Partial<MockProjectState> = {
      playback_state: {
        is_playing: true,
        current_time: 10.5,
        playback_rate: 1.5,
        loop_enabled: false,
        loop_start: null,
        loop_end: null,
        volume: 0.7,
        current_media_id: "media-123",
        selected_clip_id: "clip-456",
      },
    }

    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper mockState={mockState}>{children}</TestWrapper>,
    })

    // Manually trigger the state change since MockBackendProvider doesn't connect to backendSync
    act(() => {
      ;(mockBackendSync as any)._triggerStateChange(mockState)
    })

    // Wait for the state to be reflected
    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true)
      expect(result.current.currentTime).toBe(10.5)
      expect(result.current.playbackRate).toBe(1.5)
      expect(result.current.volume).toBe(0.7)
    })
  })

  it("should execute backend commands for play/pause", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Test play command
    await act(async () => {
      await result.current.play()
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Play",
      params: {},
    })

    // Test pause command
    await act(async () => {
      await result.current.pause()
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Pause",
      params: {},
    })
  })

  it("should execute seek command", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    const seekTime = 25.7
    await act(async () => {
      await result.current.seek(seekTime)
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Seek",
      params: { time: seekTime },
    })
  })

  it("should manage local state independently", async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Test local volume state
    const newVolume = 0.8
    act(() => {
      result.current.setVolume(newVolume)
    })

    expect(result.current.volume).toBe(newVolume)

    // Test local video loading state
    act(() => {
      result.current.setVideoLoading(true)
    })

    expect(result.current.isVideoLoading).toBe(true)

    // Test local video ready state
    act(() => {
      result.current.setVideoReady(true)
    })

    expect(result.current.isVideoReady).toBe(true)
  })

  it("should handle player-specific backend commands", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Test playerSetMedia
    const mediaId = "test-media-123"
    const startTime = 5.0
    await act(async () => {
      await result.current.playerSetMedia(mediaId, startTime)
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "PlayerSetMedia",
      params: { media_id: mediaId, start_time: startTime },
    })

    // Test playerSetVolume
    const volume = 0.9
    await act(async () => {
      await result.current.playerSetVolume(volume)
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "PlayerSetVolume",
      params: { volume },
    })

    // Test playerSelectClip
    const clipId = "test-clip-456"
    await act(async () => {
      await result.current.playerSelectClip(clipId)
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "PlayerSelectClip",
      params: { clip_id: clipId },
    })
  })

  it("should handle effect and filter commands locally", async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Test applying effects
    const testEffect = { id: "effect-1", name: "Blur", params: { radius: 5 } }
    act(() => {
      result.current.applyEffect(testEffect)
    })

    expect(result.current.appliedEffects).toContainEqual(testEffect)

    // Test applying filters
    const testFilter = { id: "filter-1", name: "Brightness", params: { value: 1.2 } }
    act(() => {
      result.current.applyFilter(testFilter)
    })

    expect(result.current.appliedFilters).toContainEqual(testFilter)

    // Test clearing effects
    act(() => {
      result.current.clearEffects()
    })

    expect(result.current.appliedEffects).toHaveLength(0)

    // Test clearing filters
    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.appliedFilters).toHaveLength(0)
  })

  it("should handle speed ramping locally", async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Test speed ramping functionality
    act(() => {
      result.current.setSpeedRampingEnabled(true)
    })

    expect(result.current.speedRampingEnabled).toBe(true)

    // Test updating playback rate
    act(() => {
      result.current.updatePlaybackRate(1.5)
    })

    expect(result.current.currentPlaybackRate).toBe(1.5)

    // Test setting base playback rate
    act(() => {
      result.current.setBasePlaybackRate(2.0)
    })

    expect(result.current.basePlaybackRate).toBe(2.0)
  })

  it("should handle prerender settings locally", async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    const prerenderSettings = {
      prerenderEnabled: true,
      prerenderQuality: 90,
      prerenderSegmentDuration: 15,
      prerenderApplyEffects: true,
      prerenderAutoPrerender: true,
    }

    act(() => {
      result.current.setPrerenderSettings(prerenderSettings)
    })

    expect(result.current.prerenderSettings).toEqual(prerenderSettings)
  })

  it("should handle backend command failures gracefully", async () => {
    const mockBackendSync = getBackendSync()
    ;(mockBackendSync.executeCommand as any).mockRejectedValueOnce(new Error("Backend command failed"))

    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Should not throw when command fails
    await act(async () => {
      await expect(result.current.play()).resolves.not.toThrow()
    })
  })
})
