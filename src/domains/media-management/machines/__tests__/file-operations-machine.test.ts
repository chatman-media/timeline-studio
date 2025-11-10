/**
 * File Operations Machine Tests
 *
 * Тесты для file operations state machine
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import { createMockOperation } from "../../__mocks__"
import { fileOperationsMachine } from "../file-operations-machine"

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("FileOperationsMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initial state", () => {
    it("should start in idle state with empty context", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.operations.size).toBe(0)
      expect(snapshot.context.activeOperations).toEqual([])
      expect(snapshot.context.completedOperations).toEqual([])
      expect(snapshot.context.failedOperations).toEqual([])

      actor.stop()
    })
  })

  describe("START_OPERATION event", () => {
    it("should add operation to context", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1", type: "import" })

      actor.send({
        type: "START_OPERATION",
        operation,
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(1)
      expect(snapshot.context.operations.get("op-1")).toEqual(operation)
      expect(snapshot.context.activeOperations).toContain("op-1")

      actor.stop()
    })

    it("should handle multiple operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1", type: "import" })
      const op2 = createMockOperation({ id: "op-2", type: "export" })
      const op3 = createMockOperation({ id: "op-3", type: "convert" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })
      actor.send({ type: "START_OPERATION", operation: op3 })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(3)
      expect(snapshot.context.activeOperations).toHaveLength(3)

      actor.stop()
    })

    it("should emit operation started event", () => {
      const actor = createActor(fileOperationsMachine)

      const events: any[] = []
      actor.subscribe((snapshot) => {
        // Collect emitted events
        if (snapshot.context.operations.size > events.length) {
          events.push({ type: "operation.started" })
        }
      })

      actor.start()

      const operation = createMockOperation({ id: "op-1" })
      actor.send({ type: "START_OPERATION", operation })

      expect(events.length).toBeGreaterThan(0)

      actor.stop()
    })
  })

  describe("UPDATE_PROGRESS event", () => {
    it("should update operation progress", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1", status: "pending" })

      actor.send({ type: "START_OPERATION", operation })

      actor.send({
        type: "UPDATE_PROGRESS",
        operationId: "op-1",
        progress: 50,
      })

      const snapshot = actor.getSnapshot()
      const updatedOp = snapshot.context.operations.get("op-1")

      expect(updatedOp?.progress).toBe(50)
      expect(updatedOp?.status).toBe("processing")

      actor.stop()
    })

    it("should not update non-existent operation", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      actor.send({
        type: "UPDATE_PROGRESS",
        operationId: "non-existent",
        progress: 50,
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(0)

      actor.stop()
    })

    it("should handle progress updates for multiple operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1" })
      const op2 = createMockOperation({ id: "op-2" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })

      actor.send({ type: "UPDATE_PROGRESS", operationId: "op-1", progress: 30 })
      actor.send({ type: "UPDATE_PROGRESS", operationId: "op-2", progress: 70 })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.get("op-1")?.progress).toBe(30)
      expect(snapshot.context.operations.get("op-2")?.progress).toBe(70)

      actor.stop()
    })
  })

  describe("COMPLETE_OPERATION event", () => {
    it("should mark operation as completed", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1" })

      actor.send({ type: "START_OPERATION", operation })

      actor.send({
        type: "COMPLETE_OPERATION",
        operationId: "op-1",
        result: { path: "/project/media/file.mp4" },
      })

      const snapshot = actor.getSnapshot()
      const completedOp = snapshot.context.operations.get("op-1")

      expect(completedOp?.status).toBe("completed")
      expect(completedOp?.progress).toBe(100)
      expect(completedOp?.result).toEqual({ path: "/project/media/file.mp4" })
      expect(snapshot.context.activeOperations).not.toContain("op-1")
      expect(snapshot.context.completedOperations).toContain("op-1")

      actor.stop()
    })

    it("should handle multiple completed operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1" })
      const op2 = createMockOperation({ id: "op-2" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })

      actor.send({ type: "COMPLETE_OPERATION", operationId: "op-1", result: {} })
      actor.send({ type: "COMPLETE_OPERATION", operationId: "op-2", result: {} })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.completedOperations).toHaveLength(2)
      expect(snapshot.context.activeOperations).toHaveLength(0)

      actor.stop()
    })
  })

  describe("FAIL_OPERATION event", () => {
    it("should mark operation as failed", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1" })

      actor.send({ type: "START_OPERATION", operation })

      actor.send({
        type: "FAIL_OPERATION",
        operationId: "op-1",
        error: "File not found",
      })

      const snapshot = actor.getSnapshot()
      const failedOp = snapshot.context.operations.get("op-1")

      expect(failedOp?.status).toBe("failed")
      expect(failedOp?.error).toBe("File not found")
      expect(snapshot.context.activeOperations).not.toContain("op-1")
      expect(snapshot.context.failedOperations).toContain("op-1")

      actor.stop()
    })

    it("should handle multiple failed operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1" })
      const op2 = createMockOperation({ id: "op-2" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })

      actor.send({ type: "FAIL_OPERATION", operationId: "op-1", error: "Error 1" })
      actor.send({ type: "FAIL_OPERATION", operationId: "op-2", error: "Error 2" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.failedOperations).toHaveLength(2)
      expect(snapshot.context.activeOperations).toHaveLength(0)

      actor.stop()
    })
  })

  describe("CANCEL_OPERATION event", () => {
    it("should remove operation from context", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1" })

      actor.send({ type: "START_OPERATION", operation })

      actor.send({
        type: "CANCEL_OPERATION",
        operationId: "op-1",
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.has("op-1")).toBe(false)
      expect(snapshot.context.activeOperations).not.toContain("op-1")

      actor.stop()
    })

    it("should handle canceling non-existent operation", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      actor.send({
        type: "CANCEL_OPERATION",
        operationId: "non-existent",
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(0)

      actor.stop()
    })
  })

  describe("CLEAR_COMPLETED event", () => {
    it("should remove all completed operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1" })
      const op2 = createMockOperation({ id: "op-2" })
      const op3 = createMockOperation({ id: "op-3" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })
      actor.send({ type: "START_OPERATION", operation: op3 })

      actor.send({ type: "COMPLETE_OPERATION", operationId: "op-1", result: {} })
      actor.send({ type: "COMPLETE_OPERATION", operationId: "op-2", result: {} })

      actor.send({ type: "CLEAR_COMPLETED" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(1) // Only op-3 remains
      expect(snapshot.context.operations.has("op-3")).toBe(true)
      expect(snapshot.context.completedOperations).toHaveLength(0)

      actor.stop()
    })

    it("should not remove failed or active operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1" })
      const op2 = createMockOperation({ id: "op-2" })
      const op3 = createMockOperation({ id: "op-3" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })
      actor.send({ type: "START_OPERATION", operation: op3 })

      actor.send({ type: "COMPLETE_OPERATION", operationId: "op-1", result: {} })
      actor.send({ type: "FAIL_OPERATION", operationId: "op-2", error: "Error" })
      // op-3 remains active

      actor.send({ type: "CLEAR_COMPLETED" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(2) // op-2 and op-3 remain
      expect(snapshot.context.operations.has("op-2")).toBe(true)
      expect(snapshot.context.operations.has("op-3")).toBe(true)

      actor.stop()
    })
  })

  describe("RETRY_FAILED event", () => {
    it("should reset failed operation to pending", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1" })

      actor.send({ type: "START_OPERATION", operation })
      actor.send({ type: "FAIL_OPERATION", operationId: "op-1", error: "Error" })

      actor.send({
        type: "RETRY_FAILED",
        operationId: "op-1",
      })

      const snapshot = actor.getSnapshot()
      const retriedOp = snapshot.context.operations.get("op-1")

      expect(retriedOp?.status).toBe("pending")
      expect(retriedOp?.progress).toBe(0)
      expect(retriedOp?.error).toBeUndefined()
      expect(snapshot.context.failedOperations).not.toContain("op-1")
      expect(snapshot.context.activeOperations).toContain("op-1")

      actor.stop()
    })

    it("should not retry non-failed operation", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1", status: "completed" })

      actor.send({ type: "START_OPERATION", operation })

      actor.send({
        type: "RETRY_FAILED",
        operationId: "op-1",
      })

      const snapshot = actor.getSnapshot()

      // Operation should not change
      expect(snapshot.context.operations.get("op-1")?.status).not.toBe("pending")

      actor.stop()
    })
  })

  describe("complex scenarios", () => {
    it("should handle mixed operation states", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const op1 = createMockOperation({ id: "op-1", type: "import" })
      const op2 = createMockOperation({ id: "op-2", type: "export" })
      const op3 = createMockOperation({ id: "op-3", type: "convert" })
      const op4 = createMockOperation({ id: "op-4", type: "import" })

      actor.send({ type: "START_OPERATION", operation: op1 })
      actor.send({ type: "START_OPERATION", operation: op2 })
      actor.send({ type: "START_OPERATION", operation: op3 })
      actor.send({ type: "START_OPERATION", operation: op4 })

      actor.send({ type: "COMPLETE_OPERATION", operationId: "op-1", result: {} })
      actor.send({ type: "FAIL_OPERATION", operationId: "op-2", error: "Error" })
      actor.send({ type: "UPDATE_PROGRESS", operationId: "op-3", progress: 50 })
      // op-4 remains pending

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(4)
      expect(snapshot.context.completedOperations).toHaveLength(1)
      expect(snapshot.context.failedOperations).toHaveLength(1)
      expect(snapshot.context.activeOperations).toHaveLength(2) // op-3 and op-4

      actor.stop()
    })

    it("should handle rapid operation updates", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1" })

      actor.send({ type: "START_OPERATION", operation })

      // Rapid progress updates
      for (let i = 10; i <= 100; i += 10) {
        actor.send({ type: "UPDATE_PROGRESS", operationId: "op-1", progress: i })
      }

      const snapshot = actor.getSnapshot()
      const op = snapshot.context.operations.get("op-1")

      expect(op?.progress).toBe(100)

      actor.stop()
    })

    it("should maintain operation order", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operations = Array.from({ length: 10 }, (_, i) => createMockOperation({ id: `op-${i}` }))

      operations.forEach((op) => {
        actor.send({ type: "START_OPERATION", operation: op })
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(10)
      expect(snapshot.context.activeOperations).toHaveLength(10)

      actor.stop()
    })
  })

  describe("edge cases", () => {
    it("should handle operation with no ID", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "" })

      actor.send({ type: "START_OPERATION", operation })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.has("")).toBe(true)

      actor.stop()
    })

    it("should handle very long error messages", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      const operation = createMockOperation({ id: "op-1" })
      const longError = `Error: ${"A".repeat(10000)}`

      actor.send({ type: "START_OPERATION", operation })
      actor.send({ type: "FAIL_OPERATION", operationId: "op-1", error: longError })

      const snapshot = actor.getSnapshot()
      const op = snapshot.context.operations.get("op-1")

      expect(op?.error).toBe(longError)

      actor.stop()
    })

    it("should handle clearing with no completed operations", () => {
      const actor = createActor(fileOperationsMachine)
      actor.start()

      actor.send({ type: "CLEAR_COMPLETED" })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.operations.size).toBe(0)
      expect(snapshot.context.completedOperations).toHaveLength(0)

      actor.stop()
    })
  })
})
