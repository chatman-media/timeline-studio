/**
 * Tests for Undo Backend Event Handlers
 *
 * Tests for undo/redo event handling from Rust backend
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import {
  createInitialUndoState,
  handleHistoryLoaded,
  handleUndoBackendEvent,
  type UndoAction,
  type UndoHistoryResult,
  type UndoRedoState,
} from "../undo-backend-event-handlers"

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

describe("Undo Backend Event Handlers", () => {
  let initialState: UndoRedoState

  beforeEach(() => {
    initialState = createInitialUndoState()
  })

  describe("createInitialUndoState", () => {
    it("should create initial undo state", () => {
      const state = createInitialUndoState()

      expect(state.canUndo).toBe(false)
      expect(state.canRedo).toBe(false)
      expect(state.undoHistory).toEqual([])
      expect(state.redoHistory).toEqual([])
      expect(state.lastActionId).toBeNull()
    })
  })

  describe("Undo Events", () => {
    it("should handle UndoPerformed event", () => {
      const event: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-123",
          description: "Undo add clip",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-123")
      expect(updates.canRedo).toBe(true)
    })

    it("should update lastActionId on undo", () => {
      const event: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-456",
          description: "Undo remove track",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-456")
    })

    it("should enable redo after undo", () => {
      const stateWithUndoDisabled = {
        ...initialState,
        canUndo: true,
        canRedo: false,
      }

      const event: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-789",
          description: "Undo action",
        },
      }

      const updates = handleUndoBackendEvent(stateWithUndoDisabled, event)

      expect(updates.canRedo).toBe(true)
    })

    it("should handle multiple undo events", () => {
      const event1: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-1",
          description: "First undo",
        },
      }

      const event2: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-2",
          description: "Second undo",
        },
      }

      const updates1 = handleUndoBackendEvent(initialState, event1)
      const state2 = { ...initialState, ...updates1 }
      const updates2 = handleUndoBackendEvent(state2, event2)

      expect(updates2.lastActionId).toBe("action-2")
      expect(updates2.canRedo).toBe(true)
    })

    it("should preserve undo event description in lastActionId", () => {
      const event: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-complex-op",
          description: "Undo complex operation with multiple steps",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-complex-op")
    })
  })

  describe("Redo Events", () => {
    it("should handle RedoPerformed event", () => {
      const event: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-123",
          description: "Redo add clip",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-123")
      expect(updates.canUndo).toBe(true)
    })

    it("should update lastActionId on redo", () => {
      const event: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-456",
          description: "Redo remove track",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-456")
    })

    it("should enable undo after redo", () => {
      const stateWithRedoEnabled = {
        ...initialState,
        canUndo: false,
        canRedo: true,
      }

      const event: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-789",
          description: "Redo action",
        },
      }

      const updates = handleUndoBackendEvent(stateWithRedoEnabled, event)

      expect(updates.canUndo).toBe(true)
    })

    it("should handle multiple redo events", () => {
      const event1: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-1",
          description: "First redo",
        },
      }

      const event2: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-2",
          description: "Second redo",
        },
      }

      const updates1 = handleUndoBackendEvent(initialState, event1)
      const state2 = { ...initialState, ...updates1 }
      const updates2 = handleUndoBackendEvent(state2, event2)

      expect(updates2.lastActionId).toBe("action-2")
      expect(updates2.canUndo).toBe(true)
    })

    it("should preserve redo event description", () => {
      const event: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-complex-redo",
          description: "Redo complex operation",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-complex-redo")
    })
  })

  describe("Action Registration Events", () => {
    it("should handle ActionRegistered event", () => {
      const event: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-123",
          action_type: "ADD_CLIP",
          description: "Add clip to timeline",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-123")
      expect(updates.canUndo).toBe(true)
      expect(updates.canRedo).toBe(false)
    })

    it("should enable undo and disable redo on new action", () => {
      const stateWithRedoAvailable = {
        ...initialState,
        canUndo: true,
        canRedo: true,
      }

      const event: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-456",
          action_type: "REMOVE_TRACK",
          description: "Remove track",
        },
      }

      const updates = handleUndoBackendEvent(stateWithRedoAvailable, event)

      expect(updates.canUndo).toBe(true)
      expect(updates.canRedo).toBe(false)
    })

    it("should track action type in registration", () => {
      const event: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-789",
          action_type: "MOVE_CLIP",
          description: "Move clip to new position",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-789")
    })

    it("should handle rapid action registrations", () => {
      const event1: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-1",
          action_type: "ADD_CLIP",
          description: "Action 1",
        },
      }

      const event2: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-2",
          action_type: "ADD_CLIP",
          description: "Action 2",
        },
      }

      const updates1 = handleUndoBackendEvent(initialState, event1)
      const state2 = { ...initialState, ...updates1 }
      const updates2 = handleUndoBackendEvent(state2, event2)

      expect(updates2.lastActionId).toBe("action-2")
      expect(updates2.canUndo).toBe(true)
      expect(updates2.canRedo).toBe(false)
    })
  })

  describe("History Events", () => {
    it("should handle UndoHistoryCleared event", () => {
      const stateWithHistory = {
        ...initialState,
        canUndo: true,
        canRedo: true,
        undoHistory: [{ id: "action-1" } as UndoAction],
        redoHistory: [{ id: "action-2" } as UndoAction],
        lastActionId: "action-1",
      }

      const event: Extract<ProjectEvent, { type: "UndoHistoryCleared" }> = {
        type: "UndoHistoryCleared",
        payload: {},
      }

      const updates = handleUndoBackendEvent(stateWithHistory, event)

      expect(updates.canUndo).toBe(false)
      expect(updates.canRedo).toBe(false)
      expect(updates.undoHistory).toEqual([])
      expect(updates.redoHistory).toEqual([])
      expect(updates.lastActionId).toBeNull()
    })

    it("should reset all state on history clear", () => {
      const stateWithData = {
        ...initialState,
        canUndo: true,
        canRedo: true,
        undoHistory: [
          { id: "action-1" } as UndoAction,
          { id: "action-2" } as UndoAction,
          { id: "action-3" } as UndoAction,
        ],
        redoHistory: [{ id: "action-4" } as UndoAction],
        lastActionId: "action-3",
      }

      const event: Extract<ProjectEvent, { type: "UndoHistoryCleared" }> = {
        type: "UndoHistoryCleared",
        payload: {},
      }

      const updates = handleUndoBackendEvent(stateWithData, event)

      expect(updates).toEqual({
        canUndo: false,
        canRedo: false,
        undoHistory: [],
        redoHistory: [],
        lastActionId: null,
      })
    })

    it("should handle history loaded result", () => {
      const historyResult: UndoHistoryResult = {
        undo_history: [
          {
            id: "action-1",
            action_type: "ADD_CLIP",
            description: "Add clip",
            timestamp: "2025-01-01T00:00:00Z",
            undo_data: {},
            redo_data: {},
          },
        ],
        redo_history: [
          {
            id: "action-2",
            action_type: "REMOVE_CLIP",
            description: "Remove clip",
            timestamp: "2025-01-01T00:01:00Z",
            undo_data: {},
            redo_data: {},
          },
        ],
        can_undo: true,
        can_redo: true,
      }

      const updates = handleHistoryLoaded(initialState, historyResult)

      expect(updates.undoHistory).toHaveLength(1)
      expect(updates.redoHistory).toHaveLength(1)
      expect(updates.canUndo).toBe(true)
      expect(updates.canRedo).toBe(true)
    })

    it("should handle empty history result", () => {
      const historyResult: UndoHistoryResult = {
        undo_history: [],
        redo_history: [],
        can_undo: false,
        can_redo: false,
      }

      const updates = handleHistoryLoaded(initialState, historyResult)

      expect(updates.undoHistory).toEqual([])
      expect(updates.redoHistory).toEqual([])
      expect(updates.canUndo).toBe(false)
      expect(updates.canRedo).toBe(false)
    })

    it("should handle large history result", () => {
      const largeUndoHistory: UndoAction[] = Array.from({ length: 100 }, (_, i) => ({
        id: `action-${i}`,
        action_type: "ADD_CLIP",
        description: `Action ${i}`,
        timestamp: new Date().toISOString(),
        undo_data: {},
        redo_data: {},
      }))

      const historyResult: UndoHistoryResult = {
        undo_history: largeUndoHistory,
        redo_history: [],
        can_undo: true,
        can_redo: false,
      }

      const updates = handleHistoryLoaded(initialState, historyResult)

      expect(updates.undoHistory).toHaveLength(100)
      expect(updates.canUndo).toBe(true)
      expect(updates.canRedo).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle unknown event type", () => {
      const unknownEvent = {
        type: "UnknownEventType",
        payload: {},
      } as any

      const updates = handleUndoBackendEvent(initialState, unknownEvent)

      expect(updates).toEqual({})
    })

    it("should not modify original state", () => {
      const originalState = createInitialUndoState()
      const stateCopy = { ...originalState }

      const event: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-123",
          action_type: "ADD_CLIP",
          description: "Test action",
        },
      }

      handleUndoBackendEvent(originalState, event)

      expect(originalState).toEqual(stateCopy)
    })

    it("should handle events with empty action IDs", () => {
      const event: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "",
          description: "Empty action ID",
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("")
      expect(updates.canRedo).toBe(true)
    })

    it("should handle events with very long descriptions", () => {
      const longDescription = "A".repeat(1000)
      const event: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-123",
          action_type: "ADD_CLIP",
          description: longDescription,
        },
      }

      const updates = handleUndoBackendEvent(initialState, event)

      expect(updates.lastActionId).toBe("action-123")
      expect(updates.canUndo).toBe(true)
    })
  })

  describe("State Transitions", () => {
    it("should transition through action lifecycle", () => {
      // Start with empty state
      let state = createInitialUndoState()
      expect(state.canUndo).toBe(false)
      expect(state.canRedo).toBe(false)

      // Register an action
      const registerEvent: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-1",
          action_type: "ADD_CLIP",
          description: "Add clip",
        },
      }

      const updates1 = handleUndoBackendEvent(state, registerEvent)
      state = { ...state, ...updates1 }
      expect(state.canUndo).toBe(true)
      expect(state.canRedo).toBe(false)

      // Undo the action
      const undoEvent: Extract<ProjectEvent, { type: "UndoPerformed" }> = {
        type: "UndoPerformed",
        payload: {
          action_id: "action-1",
          description: "Undo add clip",
        },
      }

      const updates2 = handleUndoBackendEvent(state, undoEvent)
      state = { ...state, ...updates2 }
      expect(state.canRedo).toBe(true)

      // Redo the action
      const redoEvent: Extract<ProjectEvent, { type: "RedoPerformed" }> = {
        type: "RedoPerformed",
        payload: {
          action_id: "action-1",
          description: "Redo add clip",
        },
      }

      const updates3 = handleUndoBackendEvent(state, redoEvent)
      state = { ...state, ...updates3 }
      expect(state.canUndo).toBe(true)
    })

    it("should handle action registration clearing redo stack", () => {
      // Start with undo and redo available
      let state: UndoRedoState = {
        ...initialState,
        canUndo: true,
        canRedo: true,
      }

      // Register new action - should clear redo
      const registerEvent: Extract<ProjectEvent, { type: "ActionRegistered" }> = {
        type: "ActionRegistered",
        payload: {
          action_id: "action-new",
          action_type: "ADD_TRACK",
          description: "Add new track",
        },
      }

      const updates = handleUndoBackendEvent(state, registerEvent)
      state = { ...state, ...updates }

      expect(state.canUndo).toBe(true)
      expect(state.canRedo).toBe(false)
    })
  })
})
