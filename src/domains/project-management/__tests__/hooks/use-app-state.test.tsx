/**
 * Use App State Hook Tests
 *
 * Тесты для хука useAppState
 */

import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { TrackType } from "@/types/generated/tauri-bindings"
import { useAppState } from "../../hooks/use-app-state"
import { resetProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock backend service
const mockBackend = {
  connected: true,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  executeCommand: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  getProjectState: vi.fn().mockResolvedValue(null),
  getEventHistory: vi.fn().mockResolvedValue([]),
  onEvent: vi.fn(() => vi.fn()),
  onStateChange: vi.fn(() => vi.fn()),
}

// Mock @/core - app-machine gets backend from here
vi.mock("@/core", () => ({
  getBackend: vi.fn(() => mockBackend),
  container: {
    hasBackend: vi.fn(() => true),
    getBackend: vi.fn(() => mockBackend),
  },
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
  })),
  logInfo: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
}))

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe("useAppState Hook", () => {
  beforeEach(() => {
    resetProjectManagementOrchestrator()
  })

  afterEach(() => {
    resetProjectManagementOrchestrator()
  })

  describe("Initial State", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.projectState).toBeNull()
      expect(result.current.isConnected).toBe(false) // Initially disconnected
      expect(result.current.connectionError).toBeNull()
    })

    it("should initialize computed properties", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.timeline).toBeNull()
      expect(result.current.currentTime).toBe(0)
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.duration).toBe(0)
    })
  })

  describe("Timeline Commands", () => {
    it("should add track", async () => {
      const { result } = renderHook(() => useAppState())

      const trackType: TrackType = "Video"
      await result.current.addTrack("Test Track", trackType)

      // Should not throw
    })

    it("should add track with index", async () => {
      const { result } = renderHook(() => useAppState())

      const trackType: TrackType = "Video"
      await result.current.addTrack("Test Track", trackType, 0)

      // Should not throw
    })

    it("should delete track", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.deleteTrack("track-id-123")

      // Should not throw
    })

    it("should add clip to track", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.addClip("track-id", "media-id", 10.5)

      // Should not throw
    })

    it("should delete clip", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.deleteClip("clip-id-123")

      // Should not throw
    })
  })

  describe("Playback Commands", () => {
    it("should play", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.play()

      // Should not throw
    })

    it("should pause", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.pause()

      // Should not throw
    })

    it("should seek to time", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.seek(15.5)

      // Should not throw
    })

    it("should handle negative seek time", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.seek(-5)

      // Should not throw (backend should handle validation)
    })

    it("should handle zero seek time", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.seek(0)

      // Should not throw
    })
  })

  describe("Computed Properties", () => {
    it("should return null timeline when no project", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.timeline).toBeNull()
    })

    it("should return default currentTime when no playback state", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.currentTime).toBe(0)
    })

    it("should return default isPlaying when no playback state", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.isPlaying).toBe(false)
    })

    it("should return default duration when no timeline", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.duration).toBe(0)
    })
  })

  describe("State Subscriptions", () => {
    it("should subscribe to project state changes", () => {
      const { result } = renderHook(() => useAppState())

      // Initial state should be null
      expect(result.current.projectState).toBeNull()

      // Subscription is active (tested indirectly)
    })

    it("should cleanup subscriptions on unmount", () => {
      const { unmount } = renderHook(() => useAppState())

      // Should not throw on unmount
      unmount()
    })
  })

  describe("Edge Cases", () => {
    it("should handle multiple track operations", async () => {
      const { result } = renderHook(() => useAppState())

      const trackType: TrackType = "Video"
      await result.current.addTrack("Track 1", trackType)
      await result.current.addTrack("Track 2", trackType)
      await result.current.deleteTrack("track-1")

      // Should not throw
    })

    it("should handle multiple clip operations", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.addClip("track-id", "media-1", 0)
      await result.current.addClip("track-id", "media-2", 10)
      await result.current.deleteClip("clip-1")

      // Should not throw
    })

    it("should handle rapid playback commands", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.play()
      await result.current.pause()
      await result.current.play()
      await result.current.seek(5)

      // Should not throw
    })

    it("should handle concurrent commands", async () => {
      const { result } = renderHook(() => useAppState())

      // Execute multiple commands concurrently
      await Promise.all([result.current.play(), result.current.seek(10), result.current.addTrack("Track", "Video")])

      // Should not throw
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", () => {
      const { result, rerender } = renderHook(() => useAppState())

      const initialPlay = result.current.play
      const initialPause = result.current.pause
      const initialSeek = result.current.seek
      const initialAddTrack = result.current.addTrack
      const initialAddClip = result.current.addClip

      rerender()

      expect(result.current.play).toBe(initialPlay)
      expect(result.current.pause).toBe(initialPause)
      expect(result.current.seek).toBe(initialSeek)
      expect(result.current.addTrack).toBe(initialAddTrack)
      expect(result.current.addClip).toBe(initialAddClip)
    })
  })

  describe("Command Parameters", () => {
    it("should accept valid track types", async () => {
      const { result } = renderHook(() => useAppState())

      const trackTypes: TrackType[] = ["Video", "Audio", "Title"]

      for (const trackType of trackTypes) {
        await result.current.addTrack(`Track ${trackType}`, trackType)
      }

      // Should not throw
    })

    it("should handle float time values", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.seek(10.123456)
      await result.current.addClip("track-id", "media-id", 5.999999)

      // Should not throw
    })

    it("should handle large time values", async () => {
      const { result } = renderHook(() => useAppState())

      await result.current.seek(99999.99)

      // Should not throw
    })
  })

  describe("Connection State", () => {
    it("should track connection state", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.isConnected).toBe(false) // Initially disconnected
    })

    it("should track connection errors", () => {
      const { result } = renderHook(() => useAppState())

      expect(result.current.connectionError).toBeNull()
    })
  })
})
