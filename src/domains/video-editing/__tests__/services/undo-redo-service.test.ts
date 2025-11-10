/**
 * Undo/Redo Service Tests
 *
 * Тесты для сервиса управления историей изменений
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { type ActionType, UndoRedoService } from "../../services/undo-redo-service"

describe("UndoRedoService", () => {
  let service: UndoRedoService

  beforeEach(() => {
    // Reset singleton
    ;(UndoRedoService as any).instance = null
    service = UndoRedoService.getInstance()
  })

  describe("Singleton Pattern", () => {
    it("should return same instance on multiple calls", () => {
      const instance1 = UndoRedoService.getInstance()
      const instance2 = UndoRedoService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should initialize only once", () => {
      const initCounter = (UndoRedoService as any).initializationCounter
      UndoRedoService.getInstance()
      UndoRedoService.getInstance()

      expect((UndoRedoService as any).initializationCounter).toBe(initCounter)
    })
  })

  describe("Basic Actions", () => {
    it("should add action to history", () => {
      const actionId = service.addAction({
        type: "ADD_CLIP",
        description: "Add video clip",
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1", trackId: "track-1" },
      })

      expect(actionId).toBeDefined()
      expect(actionId).toMatch(/^action-/)
    })

    it("should undo action", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1" },
      })

      const result = service.undo()

      expect(result.success).toBe(true)
      expect(result.action).toBeDefined()
      expect(result.action?.type).toBe("ADD_CLIP")
    })

    it("should redo action", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1" },
      })

      service.undo()
      const result = service.redo()

      expect(result.success).toBe(true)
      expect(result.action).toBeDefined()
      expect(result.action?.type).toBe("ADD_CLIP")
    })

    it("should fail undo when history is empty", () => {
      const result = service.undo()

      expect(result.success).toBe(false)
      expect(result.error).toBe("No actions to undo")
    })

    it("should fail redo when redo stack is empty", () => {
      const result = service.redo()

      expect(result.success).toBe(false)
      expect(result.error).toBe("No actions to redo")
    })
  })

  describe("Multiple Undo/Redo", () => {
    beforeEach(() => {
      // Add multiple actions
      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip 1",
        undoData: { clipId: "clip-1" },
        redoData: { clipId: "clip-1" },
      })
      service.addAction({
        type: "MOVE_CLIP",
        description: "Move clip 1",
        undoData: { clipId: "clip-1", oldPosition: 0 },
        redoData: { clipId: "clip-1", newPosition: 10 },
      })
      service.addAction({
        type: "TRIM_CLIP",
        description: "Trim clip 1",
        undoData: { clipId: "clip-1", oldDuration: 60 },
        redoData: { clipId: "clip-1", newDuration: 30 },
      })
    })

    it("should undo multiple actions", () => {
      const results = service.undoMultiple(2)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[0].action?.type).toBe("TRIM_CLIP")
      expect(results[1].action?.type).toBe("MOVE_CLIP")
    })

    it("should redo multiple actions", () => {
      service.undoMultiple(2)
      const results = service.redoMultiple(2)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[0].action?.type).toBe("MOVE_CLIP")
      expect(results[1].action?.type).toBe("TRIM_CLIP")
    })

    it("should stop undoing when history is exhausted", () => {
      const results = service.undoMultiple(10)

      expect(results).toHaveLength(3) // Only 3 actions in history
    })
  })

  describe("Action Grouping", () => {
    it("should start grouping", () => {
      const groupId = service.startGrouping("Batch operation")

      expect(groupId).toBeDefined()
      expect(groupId).toMatch(/^group-/)
    })

    it("should end grouping and create batch action", () => {
      service.startGrouping("Batch operation")

      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip 1",
        undoData: {},
        redoData: {},
      })

      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip 2",
        undoData: {},
        redoData: {},
      })

      service.endGrouping()

      const actions = service.getUndoableActions(1)
      expect(actions).toHaveLength(1)
      expect(actions[0].type).toBe("BATCH_OPERATION")
    })

    it("should warn when grouping is already in progress", () => {
      const groupId1 = service.startGrouping()
      const groupId2 = service.startGrouping()

      expect(groupId1).toBe(groupId2)
    })

    it("should warn when ending grouping without starting", () => {
      service.endGrouping() // Should not throw
    })

    it("should not create batch action for empty group", () => {
      service.startGrouping("Empty group")
      service.endGrouping()

      const actions = service.getUndoableActions()
      expect(actions).toHaveLength(0)
    })
  })

  describe("Action Merging", () => {
    it("should merge similar actions within timeout", () => {
      const actionId1 = service.addAction({
        type: "UPDATE_CLIP",
        description: "Update clip volume",
        undoData: { volume: 0.5 },
        redoData: { volume: 0.6 },
        mergeable: true,
      })

      // Add another similar action immediately
      const actionId2 = service.addAction({
        type: "UPDATE_CLIP",
        description: "Update clip volume",
        undoData: { volume: 0.5 },
        redoData: { volume: 0.7 },
        mergeable: true,
      })

      expect(actionId1).toBe(actionId2) // Should merge into same action

      const actions = service.getUndoableActions()
      expect(actions).toHaveLength(1)
    })

    it("should not merge different action types", () => {
      service.addAction({
        type: "UPDATE_CLIP",
        description: "Update volume",
        undoData: {},
        redoData: {},
        mergeable: true,
      })

      service.addAction({
        type: "MOVE_CLIP",
        description: "Move clip",
        undoData: {},
        redoData: {},
        mergeable: true,
      })

      const actions = service.getUndoableActions()
      expect(actions).toHaveLength(2)
    })
  })

  describe("Selective Undo", () => {
    beforeEach(() => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip 1",
        undoData: {},
        redoData: {},
        affectedEntities: { clips: ["clip-1"] },
      })

      service.addAction({
        type: "ADD_TRACK",
        description: "Add track 1",
        undoData: {},
        redoData: {},
        affectedEntities: { tracks: ["track-1"] },
      })

      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip 2",
        undoData: {},
        redoData: {},
        affectedEntities: { clips: ["clip-2"] },
      })
    })

    it("should undo by action type", () => {
      const results = service.undoByType("ADD_CLIP", 10)

      expect(results).toHaveLength(2)
      expect(results[0].action?.description).toBe("Add clip 2")
      expect(results[1].action?.description).toBe("Add clip 1")

      const remaining = service.getUndoableActions()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].type).toBe("ADD_TRACK")
    })

    it("should limit undo by type count", () => {
      const results = service.undoByType("ADD_CLIP", 1)

      expect(results).toHaveLength(1)
    })

    it("should undo by entity", () => {
      const results = service.undoByEntity(["clip-1"], "clips")

      expect(results).toHaveLength(1)
      expect(results[0].action?.description).toBe("Add clip 1")
    })

    it("should undo to specific action", () => {
      const actions = service.getUndoableActions()
      const targetActionId = actions[1].id // "Add track 1"

      const result = service.undoToAction(targetActionId)

      expect(result.success).toBe(true)

      const remaining = service.getUndoableActions()
      expect(remaining).toHaveLength(2) // clip-1 and track-1 remain
    })

    it("should fail when action not found", () => {
      const result = service.undoToAction("non-existent-id")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Action not found")
    })
  })

  describe("History Management", () => {
    it("should check if can undo", () => {
      expect(service.canUndo()).toBe(false)

      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: {},
        redoData: {},
      })

      expect(service.canUndo()).toBe(true)
    })

    it("should check if can redo", () => {
      expect(service.canRedo()).toBe(false)

      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: {},
        redoData: {},
      })

      service.undo()

      expect(service.canRedo()).toBe(true)
    })

    it("should clear redo stack on new action", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Action 1",
        undoData: {},
        redoData: {},
      })

      service.undo()

      service.addAction({
        type: "ADD_TRACK",
        description: "Action 2",
        undoData: {},
        redoData: {},
      })

      expect(service.canRedo()).toBe(false)
    })

    it("should clear history", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: {},
        redoData: {},
      })

      service.clearHistory()

      expect(service.canUndo()).toBe(false)
      expect(service.getUndoableActions()).toHaveLength(0)
    })

    it("should limit history size", () => {
      service.setMaxHistorySize(5)

      for (let i = 0; i < 10; i++) {
        service.addAction({
          type: "ADD_CLIP",
          description: `Clip ${i}`,
          undoData: {},
          redoData: {},
        })
      }

      const actions = service.getUndoableActions(10)
      expect(actions.length).toBeLessThanOrEqual(5)
    })

    it("should get undoable actions with limit", () => {
      for (let i = 0; i < 10; i++) {
        service.addAction({
          type: "ADD_CLIP",
          description: `Clip ${i}`,
          undoData: {},
          redoData: {},
        })
      }

      const actions = service.getUndoableActions(5)
      expect(actions).toHaveLength(5)
      expect(actions[0].description).toBe("Clip 9") // Most recent first
    })

    it("should get redoable actions", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Clip 1",
        undoData: {},
        redoData: {},
      })

      service.addAction({
        type: "ADD_CLIP",
        description: "Clip 2",
        undoData: {},
        redoData: {},
      })

      service.undo()
      service.undo()

      const actions = service.getRedoableActions()
      expect(actions).toHaveLength(2)
      // Redo stack returns most recent first
      expect(actions[0].description).toBe("Clip 1")
      expect(actions[1].description).toBe("Clip 2")
    })
  })

  describe("History Statistics", () => {
    beforeEach(() => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Clip 1",
        undoData: {},
        redoData: {},
      })

      service.addAction({
        type: "ADD_CLIP",
        description: "Clip 2",
        undoData: {},
        redoData: {},
      })

      service.addAction({
        type: "ADD_TRACK",
        description: "Track 1",
        undoData: {},
        redoData: {},
      })
    })

    it("should get history statistics", () => {
      const stats = service.getHistoryStats()

      expect(stats.totalActions).toBe(3)
      expect(stats.undoCount).toBe(3)
      expect(stats.redoableActions).toBe(0)
      expect(stats.actionsByType.ADD_CLIP).toBe(2)
      expect(stats.actionsByType.ADD_TRACK).toBe(1)
    })

    it("should include redo count in stats", () => {
      service.undo()
      const stats = service.getHistoryStats()

      expect(stats.undoCount).toBe(2)
      expect(stats.redoableActions).toBe(1)
      expect(stats.historySize).toBe(3)
    })

    it("should track memory usage", () => {
      const stats = service.getHistoryStats()

      expect(stats.memoryUsage).toBeGreaterThan(0)
    })
  })

  describe("History Optimization", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should optimize history by priority", () => {
      // Add old low priority action
      service.addAction({
        type: "UPDATE_CLIP",
        description: "Low priority old action",
        undoData: {},
        redoData: {},
        priority: "low",
      })

      // Move time forward
      vi.advanceTimersByTime(35 * 60 * 1000) // 35 minutes

      // Add high priority action
      service.addAction({
        type: "ADD_CLIP",
        description: "High priority action",
        undoData: {},
        redoData: {},
        priority: "high",
      })

      service.optimizeHistory()

      const actions = service.getUndoableActions(10)
      expect(actions.length).toBeGreaterThan(0)
      expect(actions.some((a) => a.priority === "high")).toBe(true)
    })

    it("should keep critical actions always", () => {
      service.addAction({
        type: "CREATE_PROJECT",
        description: "Critical action",
        undoData: {},
        redoData: {},
        priority: "critical",
      })

      vi.advanceTimersByTime(60 * 60 * 1000) // 1 hour

      service.optimizeHistory()

      const actions = service.getUndoableActions(10)
      expect(actions.some((a) => a.priority === "critical")).toBe(true)
    })
  })

  describe("Import/Export", () => {
    it("should export history", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Clip 1",
        undoData: {},
        redoData: {},
      })

      const exported = service.exportHistory()

      expect(exported).toHaveLength(1)
      expect(exported[0].type).toBe("ADD_CLIP")
    })

    it("should import history", () => {
      const history = [
        {
          id: "action-1",
          type: "ADD_CLIP" as ActionType,
          description: "Imported action",
          timestamp: Date.now(),
          undoData: {},
          redoData: {},
        },
      ]

      service.importHistory(history)

      const actions = service.getUndoableActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].description).toBe("Imported action")
    })

    it("should clear redo stack on import", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Original",
        undoData: {},
        redoData: {},
      })

      service.undo()

      service.importHistory([])

      expect(service.canRedo()).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle undefined group description", () => {
      const groupId = service.startGrouping()

      expect(groupId).toBeDefined()
    })

    it("should handle empty affected entities", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "No entities",
        undoData: {},
        redoData: {},
        affectedEntities: {},
      })

      const result = service.undoByEntity(["clip-1"], "clips")
      expect(result).toHaveLength(0)
    })

    it("should handle very long history", () => {
      const startTime = performance.now()

      for (let i = 0; i < 10000; i++) {
        service.addAction({
          type: "ADD_CLIP",
          description: `Clip ${i}`,
          undoData: {},
          redoData: {},
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000) // 1 second
    })

    it("should handle concurrent undo/redo", () => {
      service.addAction({
        type: "ADD_CLIP",
        description: "Action 1",
        undoData: {},
        redoData: {},
      })

      service.addAction({
        type: "ADD_CLIP",
        description: "Action 2",
        undoData: {},
        redoData: {},
      })

      service.undo()
      service.redo()
      service.undo()

      const actions = service.getUndoableActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].description).toBe("Action 1")
    })
  })

  describe("Initialization Stats", () => {
    it("should track initialization count", () => {
      const stats = service.getInitializationStats()

      expect(stats.totalInitializations).toBeGreaterThan(0)
      expect(stats.isSingletonInitialized).toBe(true)
    })
  })
})
