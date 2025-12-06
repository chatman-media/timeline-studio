/**
 * Undo/Redo Provider Tests
 *
 * Tests for the undo/redo context provider with backend synchronization
 */

import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  UndoRedoProvider,
  useClipUndoRedo,
  useKeyframeUndoRedo,
  useTrackUndoRedo,
  useUndoRedoContext,
} from "../undo-redo-provider"

// Hoisted mocks
const { mockBackend, mockUndoRedo, mockEventHandlers } = vi.hoisted(() => {
  const mockBackend = {
    connect: vi.fn(async () => undefined),
    executeCommand: vi.fn(async () => ({ success: true, data: null })),
    onEvent: vi.fn(() => vi.fn()),
  }

  const mockUndoRedo = {
    registerAction: vi.fn(() => "action-123"),
    startGrouping: vi.fn(() => "group-123"),
    endGrouping: vi.fn(),
    canUndo: false,
    canRedo: false,
    historyStats: { undoStackSize: 0, redoStackSize: 0, totalActions: 0, memoryUsage: 0 },
    undoableActions: [],
    redoableActions: [],
    undo: vi.fn(),
    redo: vi.fn(),
  }

  const mockEventHandlers = {
    createInitialUndoState: vi.fn(() => ({
      canUndo: false,
      canRedo: false,
      undoHistory: [],
      redoHistory: [],
    })),
    handleHistoryLoaded: vi.fn(() => ({
      canUndo: true,
      undoHistory: [],
    })),
    handleUndoBackendEvent: vi.fn(() => ({})),
  }

  return { mockBackend, mockUndoRedo, mockEventHandlers }
})

// Mock logger
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

// Mock container
vi.mock("@/core/container", () => ({
  container: {
    getBackend: () => mockBackend,
  },
}))

// Mock useUndoRedo hook
vi.mock("../hooks/use-undo-redo", () => ({
  useUndoRedo: () => mockUndoRedo,
  UndoRedoHelpers: {
    createAddClipAction: vi.fn((clipId, trackId, mediaFile, time) => ({
      type: "ADD_CLIP",
      description: `Add clip ${clipId}`,
      undoData: { clipId },
      redoData: { clipId, trackId, mediaFile, time },
    })),
    createRemoveClipAction: vi.fn((clip) => ({
      type: "REMOVE_CLIP",
      description: "Remove clip",
      undoData: clip,
      redoData: { clipId: clip.id },
    })),
    createMoveClipAction: vi.fn((clipId, oldTrackId, oldTime, newTrackId, newTime) => ({
      type: "MOVE_CLIP",
      description: "Move clip",
      undoData: { clipId, oldTrackId, oldTime },
      redoData: { clipId, newTrackId, newTime },
    })),
    createBatchOperationAction: vi.fn((description, originalClips, updatedClips) => ({
      type: "BATCH_OPERATION",
      description,
      undoData: { originalClips },
      redoData: { updatedClips },
    })),
  },
}))

// Mock event handlers
vi.mock("../machines/undo-backend-event-handlers", () => mockEventHandlers)

describe("UndoRedoProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock returns
    mockBackend.connect.mockResolvedValue(undefined)
    mockBackend.executeCommand.mockResolvedValue({ success: true, data: null })
    mockBackend.onEvent.mockReturnValue(vi.fn())
    mockUndoRedo.registerAction.mockReturnValue("action-123")
    mockEventHandlers.createInitialUndoState.mockReturnValue({
      canUndo: false,
      canRedo: false,
      undoHistory: [],
      redoHistory: [],
    })
  })

  const wrapper = ({ children }: { children: ReactNode }) => <UndoRedoProvider>{children}</UndoRedoProvider>

  describe("Provider Initialization", () => {
    it("should render with children", () => {
      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      expect(result.current).toBeDefined()
    })

    it("should connect to backend on mount", async () => {
      renderHook(() => useUndoRedoContext(), { wrapper })

      await waitFor(() => {
        expect(mockBackend.connect).toHaveBeenCalled()
      })
    })

    it("should load undo history from backend", async () => {
      mockBackend.executeCommand.mockResolvedValue({
        success: true,
        data: { undoHistory: [], redoHistory: [] },
      })

      renderHook(() => useUndoRedoContext(), { wrapper })

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledWith({
          type: "GetUndoHistory",
        })
      })
    })

    it("should provide context to children", () => {
      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      expect(typeof result.current.registerAction).toBe("function")
      expect(typeof result.current.startGrouping).toBe("function")
      expect(typeof result.current.endGrouping).toBe("function")
      expect(typeof result.current.canUndo).toBe("boolean")
      expect(typeof result.current.canRedo).toBe("boolean")
      expect(typeof result.current.isConnected).toBe("boolean")
    })

    it("should handle backend connection errors", async () => {
      mockBackend.connect.mockRejectedValue(new Error("Connection failed"))

      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBe("Connection failed")
        expect(result.current.isConnected).toBe(false)
      })
    })
  })

  describe("useUndoRedoContext", () => {
    it("should provide registerAction method", () => {
      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      expect(typeof result.current.registerAction).toBe("function")

      const actionId = result.current.registerAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: {},
        redoData: {},
      })

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should provide grouping methods", () => {
      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      expect(typeof result.current.startGrouping).toBe("function")
      expect(typeof result.current.endGrouping).toBe("function")

      const groupId = result.current.startGrouping("Test group")
      expect(groupId).toMatch(/^group-/)
      expect(typeof groupId).toBe("string")

      result.current.endGrouping()
      // endGrouping doesn't return a value, just verify it executes
    })

    it("should throw error when used outside provider", () => {
      expect(() => {
        renderHook(() => useUndoRedoContext())
      }).toThrow("useUndoRedoContext must be used within UndoRedoProvider")
    })
  })

  describe("useClipUndoRedo", () => {
    it("should register add clip action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const actionId = result.current.registerAddClip("clip-1", "track-1", { name: "video.mp4" }, 0)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register remove clip action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const clip = {
        id: "clip-1",
        trackId: "track-1",
        startTime: 0,
        endTime: 10,
        duration: 10,
        mediaId: "media-1",
      }

      const actionId = result.current.registerRemoveClip(clip)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register move clip action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const actionId = result.current.registerMoveClip("clip-1", "track-1", 0, "track-2", 5)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register update clip action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const actionId = result.current.registerUpdateClip("clip-1", { volume: 1.0 }, { volume: 0.5 })

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register trim clip action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const actionId = result.current.registerTrimClip("clip-1", 0, 10, 2, 8)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register split clip action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const actionId = result.current.registerSplitClip("clip-1", "clip-2", 5)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register batch operation action", () => {
      const { result } = renderHook(() => useClipUndoRedo(), { wrapper })

      const originalClips = [{ id: "clip-1", trackId: "track-1" } as any]
      const updatedClips = [{ id: "clip-1", trackId: "track-1", volume: 0.5 } as any]

      const actionId = result.current.registerBatchOperation("Batch update", originalClips, updatedClips)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })
  })

  describe("useTrackUndoRedo", () => {
    it("should register add track action", () => {
      const { result } = renderHook(() => useTrackUndoRedo(), { wrapper })

      const actionId = result.current.registerAddTrack("track-1", "video", "Video Track 1")

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register remove track action", () => {
      const { result } = renderHook(() => useTrackUndoRedo(), { wrapper })

      const track = { id: "track-1", name: "Video Track", type: "video" }
      const clips: any[] = []

      const actionId = result.current.registerRemoveTrack(track, clips)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register update track action", () => {
      const { result } = renderHook(() => useTrackUndoRedo(), { wrapper })

      const actionId = result.current.registerUpdateTrack("track-1", { name: "Old Name" }, { name: "New Name" })

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register reorder tracks action", () => {
      const { result } = renderHook(() => useTrackUndoRedo(), { wrapper })

      const oldOrder = ["track-1", "track-2", "track-3"]
      const newOrder = ["track-3", "track-1", "track-2"]

      const actionId = result.current.registerReorderTracks(oldOrder, newOrder)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })
  })

  describe("useKeyframeUndoRedo", () => {
    it("should register add keyframe action", () => {
      const { result } = renderHook(() => useKeyframeUndoRedo(), { wrapper })

      const keyframe = { time: 5, value: 100 }
      const actionId = result.current.registerAddKeyframe("clip-1", "keyframe-1", keyframe)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register remove keyframe action", () => {
      const { result } = renderHook(() => useKeyframeUndoRedo(), { wrapper })

      const keyframe = { time: 5, value: 100 }
      const actionId = result.current.registerRemoveKeyframe("clip-1", "keyframe-1", keyframe)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })

    it("should register update keyframe action", () => {
      const { result } = renderHook(() => useKeyframeUndoRedo(), { wrapper })

      const oldKeyframe = { time: 5, value: 100 }
      const newKeyframe = { time: 5, value: 200 }

      const actionId = result.current.registerUpdateKeyframe("clip-1", "keyframe-1", oldKeyframe, newKeyframe)

      expect(actionId).toMatch(/^action-/)
      expect(typeof actionId).toBe("string")
    })
  })

  describe("Backend Synchronization", () => {
    it("should sync registered action to backend", async () => {
      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      result.current.registerAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: {},
        redoData: {},
      })

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "RegisterUndoAction",
          }),
        )
      })
    })

    it("should subscribe to backend events", async () => {
      renderHook(() => useUndoRedoContext(), { wrapper })

      await waitFor(() => {
        expect(mockBackend.onEvent).toHaveBeenCalled()
      })
    })

    it("should handle backend sync errors gracefully", async () => {
      mockBackend.executeCommand.mockRejectedValueOnce(new Error("Sync failed"))

      const { result } = renderHook(() => useUndoRedoContext(), { wrapper })

      result.current.registerAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: {},
        redoData: {},
      })

      await waitFor(() => {
        expect(result.current.error).toBe("Sync failed")
      })
    })
  })
})
