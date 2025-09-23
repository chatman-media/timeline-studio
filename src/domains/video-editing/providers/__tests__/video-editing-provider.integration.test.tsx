/**
 * Integration tests for VideoEditingProvider using MockBackendProvider
 *
 * Tests orchestrator integration and backend compliance
 */

import { act, renderHook } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

// Mock backend-sync before importing components that use it
vi.mock("@/features/app-state/services/backend-sync", () => {
  const mockExecuteCommand = vi.fn().mockResolvedValue({ success: true, error: null, data: null })

  return {
    getBackendSync: vi.fn(() => ({
      executeCommand: mockExecuteCommand,
      onStateChange: vi.fn(() => () => {}),
      onEvent: vi.fn(() => () => {}),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getProjectState: vi.fn().mockResolvedValue(null),
      getEventHistory: vi.fn().mockResolvedValue([]),
    })),
  }
})

import { MockBackendProvider, type MockProjectState } from "@/features/app-state/testing/mock-backend-provider"
import { useVideoEditingContext, VideoEditingProvider } from "../video-editing-provider"

// Test wrapper component
const TestWrapper = ({ children, mockState }: { children: React.ReactNode; mockState?: Partial<MockProjectState> }) => (
  <MockBackendProvider initialState={mockState}>
    <VideoEditingProvider>{children}</VideoEditingProvider>
  </MockBackendProvider>
)

describe("VideoEditingProvider Integration Tests", () => {
  it("should provide orchestrator instance", () => {
    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    expect(result.current.orchestrator).toBeDefined()
    expect(result.current.orchestrator).toHaveProperty("executeCommand")
    expect(result.current.orchestrator).toHaveProperty("getTimelineState")
    expect(result.current.orchestrator).toHaveProperty("getPlayerState")
    expect(result.current.orchestrator).toHaveProperty("subscribeToTimeline")
    expect(result.current.orchestrator).toHaveProperty("subscribeToPlayer")
    expect(result.current.orchestrator).toHaveProperty("subscribeToTimelineUI")
  })

  it("should sync with backend state", async () => {
    const mockState: Partial<MockProjectState> = {
      ui_state: {
        selected_clips: ["clip-1", "clip-2"],
        selected_tracks: ["track-1"],
        timeline_zoom: 2.0,
        timeline_scroll: 100,
        active_tool: "cut",
      },
      playback_state: {
        is_playing: false,
        current_time: 5.0,
        playback_rate: 1.0,
        loop_enabled: true,
        loop_start: 0,
        loop_end: 10,
        volume: 0.8,
        current_media_id: "media-123",
        selected_clip_id: "clip-1",
      },
    }

    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => <TestWrapper mockState={mockState}>{children}</TestWrapper>,
    })

    // Test that orchestrator can access backend state
    const timelineState = result.current.orchestrator.getTimelineState()
    const playerState = result.current.orchestrator.getPlayerState()
    expect(timelineState).toBeDefined()
    expect(playerState).toBeDefined()
  })

  it("should execute timeline commands through orchestrator", async () => {
    // Import the mocked backend sync to get the executeCommand mock
    const { getBackendSync } = await import("@/features/app-state/services/backend-sync")
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => (
        <MockBackendProvider>
          <VideoEditingProvider>{children}</VideoEditingProvider>
        </MockBackendProvider>
      ),
    })

    // Test timeline command execution
    await act(async () => {
      await result.current.orchestrator.executeCommand({
        type: "AddTrack",
        params: { track_type: "Video", name: "Test Track", index: null },
      })
    })

    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "AddTrack",
      params: { track_type: "Video", name: "Test Track", index: null },
    })
  })

  it("should handle playback commands through orchestrator", async () => {
    // Import the mocked backend sync to get the executeCommand mock
    const { getBackendSync } = await import("@/features/app-state/services/backend-sync")
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => (
        <MockBackendProvider>
          <VideoEditingProvider>{children}</VideoEditingProvider>
        </MockBackendProvider>
      ),
    })

    // Test playback commands using orchestrator's direct API
    await act(async () => {
      result.current.orchestrator.play()
    })

    // The orchestrator's play() method sends events to actors, not backend commands
    expect(mockBackendSync.executeCommand).not.toHaveBeenCalledWith({
      type: "Play",
    })

    await act(async () => {
      result.current.orchestrator.seek(15.5)
    })

    // The orchestrator's seek() method sends events to actors, not backend commands
    expect(mockBackendSync.executeCommand).not.toHaveBeenCalledWith({
      type: "Seek",
      params: { time: 15.5 },
    })
  })

  it("should handle clip management commands", async () => {
    // Import the mocked backend sync to get the executeCommand mock
    const { getBackendSync } = await import("@/features/app-state/services/backend-sync")
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => (
        <MockBackendProvider>
          <VideoEditingProvider>{children}</VideoEditingProvider>
        </MockBackendProvider>
      ),
    })

    // Test clip management using orchestrator's direct API
    await act(async () => {
      result.current.orchestrator.addClip("track-1", { id: "media-123" }, 10)
    })

    // The orchestrator's addClip() method calls executeCommand internally
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "AddClip",
      params: {
        track_id: "track-1",
        media_id: "media-123",
        time: 10,
      },
    })
  })

  it("should subscribe to state changes", async () => {
    const timelineCallback = vi.fn()
    const playerCallback = vi.fn()

    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => (
        <MockBackendProvider>
          <VideoEditingProvider>{children}</VideoEditingProvider>
        </MockBackendProvider>
      ),
    })

    // Subscribe to state changes
    let unsubscribeTimeline: any
    let unsubscribePlayer: any

    act(() => {
      unsubscribeTimeline = result.current.orchestrator.subscribeToTimeline(timelineCallback)
      unsubscribePlayer = result.current.orchestrator.subscribeToPlayer(playerCallback)
    })

    // Trigger state changes
    await act(async () => {
      result.current.orchestrator.play()
    })

    // Verify callbacks were called
    expect(timelineCallback).toHaveBeenCalled()
    expect(playerCallback).toHaveBeenCalled()

    // Test unsubscribe - the subscribe methods return unsubscribe functions directly
    act(() => {
      if (typeof unsubscribeTimeline === "function") {
        unsubscribeTimeline()
      }
      if (typeof unsubscribePlayer === "function") {
        unsubscribePlayer()
      }
    })
  })

  it("should handle command failures gracefully", async () => {
    const mockExecuteCommand = vi.fn().mockRejectedValue(new Error("Command failed"))

    const { result } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => (
        <MockBackendProvider onCommand={mockExecuteCommand}>
          <VideoEditingProvider>{children}</VideoEditingProvider>
        </MockBackendProvider>
      ),
    })

    // Should handle command failure without throwing
    await act(async () => {
      await expect(
        result.current.orchestrator.executeCommand({
          type: "Chat",
          params: { type: "CreateChatSession", params: { name: "test" } },
        }),
      ).resolves.not.toThrow()
    })
  })

  it("should maintain orchestrator singleton", () => {
    const { result: result1 } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    const { result: result2 } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Both hooks should return the same orchestrator instance
    expect(result1.current.orchestrator).toBe(result2.current.orchestrator)
  })

  it("should handle initialization and cleanup", () => {
    const consoleSpy = vi.spyOn(console, "log")

    const { unmount } = renderHook(() => useVideoEditingContext(), {
      wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    })

    // Check initialization log
    expect(consoleSpy).toHaveBeenCalledWith("[Video Editing Provider] Initialized")

    // Unmount and check cleanup log
    unmount()
    expect(consoleSpy).toHaveBeenCalledWith("[Video Editing Provider] Cleanup")

    consoleSpy.mockRestore()
  })

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      renderHook(() => useVideoEditingContext())
    }).toThrow("useVideoEditingContext must be used within VideoEditingProvider")

    consoleSpy.mockRestore()
  })
})
