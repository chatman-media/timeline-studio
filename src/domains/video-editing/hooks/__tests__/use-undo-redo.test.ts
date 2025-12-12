/**
 * Use Undo/Redo Hook Tests
 *
 * Comprehensive tests for the undo/redo system hook
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { type ActionType, UndoRedoService } from "../../services/undo-redo-service"
import { useUndoRedo } from '../use-undo-redo'

// Hoisted mocks
const { mockOrchestrator, mockTimelineActor, mockService } = vi.hoisted(() => {
  const mockTimelineActor = {
    send: vi.fn(),
    getSnapshot: vi.fn(() => ({
      context: {
        clips: [],
        tracks: [],
      },
    })),
  }

  const mockOrchestrator = {
    getActors: vi.fn(() => ({
      timeline: mockTimelineActor,
    })),
    executeCommand: vi.fn(async () => ({ success: true })),
    addClip: vi.fn(),
    addTrack: vi.fn(),
  }

  const mockService = {
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    getHistoryStats: vi.fn(() => ({
      totalActions: 0,
      undoCount: 0,
      redoableActions: 0,
      redoCount: 0,
      historySize: 0,
      currentIndex: 0,
      actionsByType: {},
      memoryUsage: 0,
      maxHistorySize: 1000,
    })),
    getUndoableActions: vi.fn<any>(() => []),
    getRedoableActions: vi.fn<any>(() => []),
    undo: vi.fn<any>(() => ({ success: false })),
    redo: vi.fn<any>(() => ({ success: false })),
    undoMultiple: vi.fn<any>(() => []),
    redoMultiple: vi.fn<any>(() => []),
    undoToAction: vi.fn<any>(() => ({
      success: false,
    })),
    undoByType: vi.fn<any>(() => []),
    undoByEntity: vi.fn<any>(() => []),
    startGrouping: vi.fn(() => "group-1"),
    endGrouping: vi.fn(),
    undoGroup: vi.fn<any>(() => ({
      success: false,
    })),
    addAction: vi.fn(() => "action-1"),
    clearHistory: vi.fn(),
    optimizeHistory: vi.fn(),
    setMaxHistorySize: vi.fn(),
  }

  return { mockOrchestrator, mockTimelineActor, mockService }
})

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

// Mock orchestrator
vi.mock("../../services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: () => mockOrchestrator,
}))

// Mock UndoRedoService
vi.mock("../../services/undo-redo-service", () => ({
  UndoRedoService: {
    getInstance: vi.fn(() => mockService),
  },
  ActionType: {},
}))

describe("useUndoRedo", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset default mock returns
    mockService.canUndo.mockReturnValue(false)
    mockService.canRedo.mockReturnValue(false)
    mockService.getHistoryStats.mockReturnValue({
      totalActions: 0,
      undoCount: 0,
      redoableActions: 0,
      redoCount: 0,
      historySize: 0,
      currentIndex: 0,
      actionsByType: {},
      memoryUsage: 0,
      maxHistorySize: 1000,
    })
    mockService.getUndoableActions.mockReturnValue([])
    mockService.getRedoableActions.mockReturnValue([])
    mockOrchestrator.executeCommand.mockResolvedValue({ success: true })
  })

  describe("Hook Initialization", () => {
    it("should initialize with service singleton", () => {
      const { result } = renderHook(() => useUndoRedo())

      expect(result.current).toBeDefined()
      expect(UndoRedoService.getInstance).toHaveBeenCalled()
    })

    it("should provide all required interface methods", () => {
      const { result } = renderHook(() => useUndoRedo())

      // Basic operations
      expect(typeof result.current.undo).toBe("function")
      expect(typeof result.current.redo).toBe("function")

      // Multiple operations
      expect(typeof result.current.undoMultiple).toBe("function")
      expect(typeof result.current.redoMultiple).toBe("function")

      // Selective undo
      expect(typeof result.current.undoToAction).toBe("function")
      expect(typeof result.current.undoByType).toBe("function")
      expect(typeof result.current.undoByEntity).toBe("function")

      // Grouping
      expect(typeof result.current.startGrouping).toBe("function")
      expect(typeof result.current.endGrouping).toBe("function")
      expect(typeof result.current.undoGroup).toBe("function")

      // Management
      expect(typeof result.current.clearHistory).toBe("function")
      expect(typeof result.current.optimizeHistory).toBe("function")
      expect(typeof result.current.setMaxHistorySize).toBe("function")
      expect(typeof result.current.registerAction).toBe("function")
    })

    it("should initialize with correct initial state", () => {
      const { result } = renderHook(() => useUndoRedo())

      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
      expect(result.current.historyStats.totalActions).toBe(0)
      expect(result.current.undoableActions).toEqual([])
      expect(result.current.redoableActions).toEqual([])
    })
  })

  describe("Basic Undo/Redo", () => {
    it("should undo last action", async () => {
      const mockAction = {
        id: "action-1",
        type: "ADD_CLIP" as ActionType,
        description: "Add clip",
        timestamp: Date.now(),
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1", trackId: "track-1" },
      }

      mockService.undo.mockReturnValue({ success: true, action: mockAction })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undo()
      })

      expect(mockService.undo).toHaveBeenCalled()
      expect(mockOrchestrator.executeCommand).toHaveBeenCalledWith({
        type: "DeleteClip",
        params: { clip_id: "clip-1" },
      })
      expect(success).toBe(true)
    })

    it("should redo undone action", async () => {
      const mockAction = {
        id: "action-1",
        type: "ADD_CLIP" as ActionType,
        description: "Add clip",
        timestamp: Date.now(),
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1", trackId: "track-1", mediaFile: {}, time: 0 },
      }

      mockService.redo.mockReturnValue({ success: true, action: mockAction })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.redo()
      })

      expect(mockService.redo).toHaveBeenCalled()
      expect(mockOrchestrator.addClip).toHaveBeenCalled()
      expect(success).toBe(true)
    })

    it("should update canUndo state", () => {
      mockService.canUndo.mockReturnValue(true)

      const { result } = renderHook(() => useUndoRedo())

      expect(result.current.canUndo).toBe(true)
    })

    it("should update canRedo state", () => {
      mockService.canRedo.mockReturnValue(true)

      const { result } = renderHook(() => useUndoRedo())

      expect(result.current.canRedo).toBe(true)
    })

    it("should return false when nothing to undo", async () => {
      mockService.undo.mockReturnValue({ success: false })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undo()
      })

      expect(success).toBe(false)
    })

    it("should return false when nothing to redo", async () => {
      mockService.redo.mockReturnValue({ success: false })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.redo()
      })

      expect(success).toBe(false)
    })
  })

  describe("Multiple Operations", () => {
    it("should undo multiple actions", async () => {
      const mockActions = [
        {
          id: "action-1",
          type: "ADD_CLIP" as ActionType,
          description: "Add clip 1",
          timestamp: Date.now(),
          undoData: { clipId: "clip-1" },
          redoData: {},
        },
        {
          id: "action-2",
          type: "ADD_CLIP" as ActionType,
          description: "Add clip 2",
          timestamp: Date.now(),
          undoData: { clipId: "clip-2" },
          redoData: {},
        },
      ]

      mockService.undoMultiple.mockReturnValue([
        { success: true, action: mockActions[0] },
        { success: true, action: mockActions[1] },
      ])

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoMultiple(2)
      })

      expect(mockService.undoMultiple).toHaveBeenCalledWith(2)
      expect(mockOrchestrator.executeCommand).toHaveBeenCalledTimes(2)
      expect(success).toBe(true)
    })

    it("should redo multiple actions", async () => {
      const mockActions = [
        {
          id: "action-1",
          type: "ADD_CLIP" as ActionType,
          description: "Add clip 1",
          timestamp: Date.now(),
          undoData: {},
          redoData: { clipId: "clip-1", trackId: "track-1", mediaFile: {}, time: 0 },
        },
        {
          id: "action-2",
          type: "ADD_CLIP" as ActionType,
          description: "Add clip 2",
          timestamp: Date.now(),
          undoData: {},
          redoData: { clipId: "clip-2", trackId: "track-1", mediaFile: {}, time: 1 },
        },
      ]

      mockService.redoMultiple.mockReturnValue([
        { success: true, action: mockActions[0] },
        { success: true, action: mockActions[1] },
      ])

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.redoMultiple(2)
      })

      expect(mockService.redoMultiple).toHaveBeenCalledWith(2)
      expect(mockOrchestrator.addClip).toHaveBeenCalledTimes(2)
      expect(success).toBe(true)
    })

    it("should handle undoMultiple with count parameter", async () => {
      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.undoMultiple(5)
      })

      expect(mockService.undoMultiple).toHaveBeenCalledWith(5)
    })

    it("should handle redoMultiple with count parameter", async () => {
      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.redoMultiple(3)
      })

      expect(mockService.redoMultiple).toHaveBeenCalledWith(3)
    })
  })

  describe("Selective Undo", () => {
    it("should undo to specific action", async () => {
      mockService.undoToAction.mockReturnValue({ success: true })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoToAction("action-5")
      })

      expect(mockService.undoToAction).toHaveBeenCalledWith("action-5")
      expect(success).toBe(true)
    })

    it("should undo by type", async () => {
      mockService.undoByType.mockReturnValue([{ success: true }])

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoByType("ADD_CLIP" as ActionType)
      })

      expect(mockService.undoByType).toHaveBeenCalledWith("ADD_CLIP", 10)
      expect(success).toBe(true)
    })

    it("should undo by entity clips", async () => {
      mockService.undoByEntity.mockReturnValue([{ success: true }])

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoByEntity(["clip-1", "clip-2"], "clips")
      })

      expect(mockService.undoByEntity).toHaveBeenCalledWith(["clip-1", "clip-2"], "clips")
      expect(success).toBe(true)
    })

    it("should undo by entity tracks", async () => {
      mockService.undoByEntity.mockReturnValue([{ success: true }])

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoByEntity(["track-1"], "tracks")
      })

      expect(mockService.undoByEntity).toHaveBeenCalledWith(["track-1"], "tracks")
      expect(success).toBe(true)
    })

    it("should undo by entity keyframes", async () => {
      mockService.undoByEntity.mockReturnValue([{ success: true }])

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoByEntity(["keyframe-1"], "keyframes")
      })

      expect(mockService.undoByEntity).toHaveBeenCalledWith(["keyframe-1"], "keyframes")
      expect(success).toBe(true)
    })

    it("should limit undo by type with maxCount", async () => {
      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.undoByType("MOVE_CLIP" as ActionType, 5)
      })

      expect(mockService.undoByType).toHaveBeenCalledWith("MOVE_CLIP", 5)
    })
  })

  describe("Grouping", () => {
    it("should start grouping with description", () => {
      const { result } = renderHook(() => useUndoRedo())

      act(() => {
        result.current.startGrouping("Batch update clips")
      })

      expect(mockService.startGrouping).toHaveBeenCalledWith("Batch update clips")
    })

    it("should end grouping", () => {
      const { result } = renderHook(() => useUndoRedo())

      act(() => {
        result.current.endGrouping()
      })

      expect(mockService.endGrouping).toHaveBeenCalled()
    })

    it("should undo entire group", async () => {
      mockService.undoGroup.mockReturnValue({ success: true })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoGroup("group-1")
      })

      expect(mockService.undoGroup).toHaveBeenCalledWith("group-1")
      expect(success).toBe(true)
    })

    it("should return group ID from startGrouping", () => {
      mockService.startGrouping.mockReturnValue("group-123")

      const { result } = renderHook(() => useUndoRedo())

      let groupId: string
      act(() => {
        groupId = result.current.startGrouping("Test group")
      })

      expect(groupId!).toBe("group-123")
    })

    it("should handle ungrouped actions", async () => {
      mockService.undoGroup.mockReturnValue({ success: false })

      const { result } = renderHook(() => useUndoRedo())

      const success = await act(async () => {
        return await result.current.undoGroup("non-existent")
      })

      expect(success).toBe(false)
    })
  })

  describe("Action Registration", () => {
    it("should register action", () => {
      const { result } = renderHook(() => useUndoRedo())

      let actionId: string
      act(() => {
        actionId = result.current.registerAction({
          type: "ADD_CLIP" as ActionType,
          description: "Add clip",
          undoData: { clipId: "clip-1" },
          redoData: { clipId: "clip-1" },
        })
      })

      expect(mockService.addAction).toHaveBeenCalled()
      expect(actionId!).toBeDefined()
    })

    it("should return action ID from registerAction", () => {
      mockService.addAction.mockReturnValue("action-abc")

      const { result } = renderHook(() => useUndoRedo())

      let actionId: string
      act(() => {
        actionId = result.current.registerAction({
          type: "MOVE_CLIP" as ActionType,
          description: "Move clip",
          undoData: {},
          redoData: {},
        })
      })

      expect(actionId!).toBe("action-abc")
    })

    it("should add action to history via registerAction", () => {
      const { result } = renderHook(() => useUndoRedo())

      const actionData = {
        type: "UPDATE_CLIP" as ActionType,
        description: "Update clip properties",
        undoData: { clipId: "clip-1", oldProperties: { volume: 1.0 } },
        redoData: { clipId: "clip-1", newProperties: { volume: 0.5 } },
      }

      act(() => {
        result.current.registerAction(actionData)
      })

      expect(mockService.addAction).toHaveBeenCalledWith(actionData)
    })
  })

  describe("History Management", () => {
    it("should clear history", () => {
      const { result } = renderHook(() => useUndoRedo())

      act(() => {
        result.current.clearHistory()
      })

      expect(mockService.clearHistory).toHaveBeenCalled()
    })

    it("should optimize history", () => {
      const { result } = renderHook(() => useUndoRedo())

      act(() => {
        result.current.optimizeHistory()
      })

      expect(mockService.optimizeHistory).toHaveBeenCalled()
    })

    it("should set max history size", () => {
      const { result } = renderHook(() => useUndoRedo())

      act(() => {
        result.current.setMaxHistorySize(100)
      })

      expect(mockService.setMaxHistorySize).toHaveBeenCalledWith(100)
    })

    it("should get history stats", () => {
      const mockStats = {
        totalActions: 8,
        undoCount: 5,
        redoableActions: 3,
        redoCount: 3,
        historySize: 8,
        currentIndex: 5,
        actionsByType: { ADD_CLIP: 3, REMOVE_CLIP: 2 },
        memoryUsage: 1024,
        maxHistorySize: 1000,
      }

      mockService.getHistoryStats.mockReturnValue(mockStats)

      const { result } = renderHook(() => useUndoRedo())

      expect(result.current.historyStats).toEqual(mockStats)
      expect(mockService.getHistoryStats).toHaveBeenCalled()
    })

    it("should get undoable actions list", () => {
      const mockActions = [
        {
          id: "action-1",
          type: "ADD_CLIP" as ActionType,
          description: "Add clip",
          timestamp: Date.now(),
          undoData: {},
          redoData: {},
        },
      ]

      mockService.getUndoableActions.mockReturnValue(mockActions)

      const { result } = renderHook(() => useUndoRedo())

      expect(result.current.undoableActions).toEqual(mockActions)
      expect(mockService.getUndoableActions).toHaveBeenCalledWith(10)
    })
  })

  describe("State Queries", () => {
    it("should track canUndo state changes", () => {
      mockService.canUndo.mockReturnValue(false)

      const { result, rerender } = renderHook(() => useUndoRedo())

      expect(result.current.canUndo).toBe(false)

      // Simulate state change
      mockService.canUndo.mockReturnValue(true)
      rerender()

      expect(result.current.canUndo).toBe(true)
    })

    it("should track canRedo state changes", () => {
      mockService.canRedo.mockReturnValue(false)

      const { result, rerender } = renderHook(() => useUndoRedo())

      expect(result.current.canRedo).toBe(false)

      mockService.canRedo.mockReturnValue(true)
      rerender()

      expect(result.current.canRedo).toBe(true)
    })

    it("should provide current history stats", () => {
      const stats = {
        totalActions: 15,
        undoCount: 10,
        redoableActions: 5,
        redoCount: 5,
        historySize: 15,
        currentIndex: 10,
        actionsByType: {},
        memoryUsage: 2048,
        maxHistorySize: 1000,
      }

      mockService.getHistoryStats.mockReturnValue(stats)

      const { result } = renderHook(() => useUndoRedo())

      expect(result.current.historyStats.undoCount).toBe(10)
      expect(result.current.historyStats.redoableActions).toBe(5)
      expect(result.current.historyStats.totalActions).toBe(15)
      expect(result.current.historyStats.memoryUsage).toBe(2048)
    })
  })

  describe("Action Application", () => {
    it("should apply ADD_CLIP action on undo", async () => {
      const mockAction = {
        id: "action-1",
        type: "ADD_CLIP" as ActionType,
        description: "Add clip",
        timestamp: Date.now(),
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1", trackId: "track-1", mediaFile: {}, time: 0 },
      }

      mockService.undo.mockReturnValue({ success: true, action: mockAction })

      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.undo()
      })

      expect(mockOrchestrator.executeCommand).toHaveBeenCalledWith({
        type: "DeleteClip",
        params: { clip_id: "clip-1" },
      })
    })

    it("should apply REMOVE_CLIP action on undo", async () => {
      const mockAction = {
        id: "action-1",
        type: "REMOVE_CLIP" as ActionType,
        description: "Remove clip",
        timestamp: Date.now(),
        undoData: {
          clipId: "clip-1",
          trackId: "track-1",
          mediaFile: {},
          time: 0,
          clipProperties: { volume: 1.0 },
        },
        redoData: { clipId: "clip-1" },
      }

      mockService.undo.mockReturnValue({ success: true, action: mockAction })

      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.undo()
      })

      expect(mockOrchestrator.addClip).toHaveBeenCalled()
    })

    it("should apply MOVE_CLIP action on undo", async () => {
      const mockAction = {
        id: "action-1",
        type: "MOVE_CLIP" as ActionType,
        description: "Move clip",
        timestamp: Date.now(),
        undoData: { clipId: "clip-1", oldTrackId: "track-1", oldTime: 0 },
        redoData: { clipId: "clip-1", newTrackId: "track-2", newTime: 5 },
      }

      mockService.undo.mockReturnValue({ success: true, action: mockAction })

      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.undo()
      })

      expect(mockOrchestrator.executeCommand).toHaveBeenCalledWith({
        type: "MoveClip",
        params: {
          clip_id: "clip-1",
          track_id: "track-1",
          time: 0,
        },
      })
    })

    it("should apply UPDATE_CLIP action on redo", async () => {
      const mockAction = {
        id: "action-1",
        type: "UPDATE_CLIP" as ActionType,
        description: "Update clip",
        timestamp: Date.now(),
        undoData: { clipId: "clip-1", oldProperties: { volume: 1.0 } },
        redoData: { clipId: "clip-1", newProperties: { volume: 0.5 } },
      }

      mockService.redo.mockReturnValue({ success: true, action: mockAction })

      const { result } = renderHook(() => useUndoRedo())

      await act(async () => {
        await result.current.redo()
      })

      expect(mockOrchestrator.executeCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: { volume: 0.5 },
        },
      })
    })
  })
})
