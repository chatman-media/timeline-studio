import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NodeBackendService } from "../backend"

describe("NodeBackendService", () => {
  let service: NodeBackendService
  let tempDir: string

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `node-backend-test-${Date.now()}`)
    service = new NodeBackendService({ tempDir, ffmpegPath: "echo" })
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  // ============================================================================
  // Connection
  // ============================================================================

  describe("Connection", () => {
    it("starts disconnected", () => {
      expect(service.connected).toBe(false)
      expect(service.isConnected()).toBe(false)
    })

    it("connects successfully", async () => {
      await service.connect()

      expect(service.connected).toBe(true)
      expect(service.isConnected()).toBe(true)
    })

    it("creates temp directory on connect", async () => {
      await service.connect()

      expect(fs.existsSync(tempDir)).toBe(true)
    })

    it("does not reconnect if already connected", async () => {
      const spy = vi.spyOn(fs, "existsSync")

      await service.connect()
      const firstCallCount = spy.mock.calls.length

      await service.connect()
      const secondCallCount = spy.mock.calls.length

      // Should not call existsSync again on second connect
      expect(secondCallCount).toBe(firstCallCount)

      spy.mockRestore()
    })

    it("disconnects successfully", async () => {
      await service.connect()
      await service.disconnect()

      expect(service.connected).toBe(false)
      expect(service.isConnected()).toBe(false)
    })

    it("clears project state on disconnect", async () => {
      await service.connect()
      service.updateProjectState({ version: 1, project: {}, dirty: false } as any)

      await service.disconnect()

      const state = await service.getProjectState()
      expect(state).toBeNull()
    })
  })

  // ============================================================================
  // Command Execution
  // ============================================================================

  describe("Command Execution", () => {
    beforeEach(async () => {
      await service.connect()
    })

    it("executes commands successfully", async () => {
      const result = await service.executeCommand({ type: "Undo" } as any)

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it("handles Undo command", async () => {
      const result = await service.executeCommand({ type: "Undo" } as any)

      expect(result.success).toBe(true)
    })

    it("handles Redo command", async () => {
      const result = await service.executeCommand({ type: "Redo" } as any)

      expect(result.success).toBe(true)
    })

    it("handles unknown commands", async () => {
      const result = await service.executeCommand({ type: "UnknownCommand" } as any)

      expect(result.success).toBe(true)
    })

    it("returns error when not connected", async () => {
      await service.disconnect()

      const result = await service.executeCommand({ type: "Undo" } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Backend not connected")
    })

    it("emits CommandExecuted event", async () => {
      const eventHandler = vi.fn()
      service.onEvent(eventHandler)

      await service.executeCommand({ type: "Undo" } as any)

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CommandExecuted",
          command: "Undo",
          success: true,
        }),
      )
    })
  })

  // ============================================================================
  // Project State
  // ============================================================================

  describe("Project State", () => {
    it("returns null initially", async () => {
      const state = await service.getProjectState()

      expect(state).toBeNull()
    })

    it("updates project state", async () => {
      const newState = { version: 1, project: { name: "Test" }, dirty: false } as any

      service.updateProjectState(newState)

      const state = await service.getProjectState()
      expect(state).toEqual(newState)
    })

    it("notifies state change handlers", async () => {
      const handler = vi.fn()
      service.onStateChange(handler)

      const newState = { version: 1, project: {}, dirty: false } as any
      service.updateProjectState(newState)

      expect(handler).toHaveBeenCalledWith(newState)
    })
  })

  // ============================================================================
  // Event History
  // ============================================================================

  describe("Event History", () => {
    beforeEach(async () => {
      await service.connect()
    })

    it("returns empty history initially", async () => {
      const history = await service.getEventHistory()

      expect(history).toEqual([])
    })

    it("stores events in history", async () => {
      await service.executeCommand({ type: "Undo" } as any)
      await service.executeCommand({ type: "Redo" } as any)

      const history = await service.getEventHistory()

      expect(history).toHaveLength(2)
    })

    it("filters history by version", async () => {
      await service.executeCommand({ type: "Undo" } as any)
      await service.executeCommand({ type: "Redo" } as any)
      await service.executeCommand({ type: "Undo" } as any)

      const history = await service.getEventHistory(1)

      expect(history).toHaveLength(2)
      expect(history.every((e) => e.metadata.version > 1)).toBe(true)
    })

    it("includes event metadata", async () => {
      await service.executeCommand({ type: "Undo" } as any)

      const history = await service.getEventHistory()
      const event = history[0]

      expect(event.metadata).toHaveProperty("id")
      expect(event.metadata).toHaveProperty("timestamp")
      expect(event.metadata).toHaveProperty("source", "node-backend")
      expect(event.metadata).toHaveProperty("version", 1)
    })
  })

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  describe("Event Subscriptions", () => {
    beforeEach(async () => {
      await service.connect()
    })

    it("subscribes to events", async () => {
      const handler = vi.fn()
      const unsubscribe = service.onEvent(handler)

      await service.executeCommand({ type: "Undo" } as any)

      expect(handler).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe("function")
    })

    it("unsubscribes from events", async () => {
      const handler = vi.fn()
      const unsubscribe = service.onEvent(handler)

      unsubscribe()

      await service.executeCommand({ type: "Undo" } as any)

      expect(handler).not.toHaveBeenCalled()
    })

    it("supports multiple event handlers", async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      service.onEvent(handler1)
      service.onEvent(handler2)

      await service.executeCommand({ type: "Undo" } as any)

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it("subscribes to state changes", () => {
      const handler = vi.fn()
      const unsubscribe = service.onStateChange(handler)

      service.updateProjectState({ version: 1, project: {}, dirty: false } as any)

      expect(handler).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe("function")
    })

    it("unsubscribes from state changes", () => {
      const handler = vi.fn()
      const unsubscribe = service.onStateChange(handler)

      unsubscribe()

      service.updateProjectState({ version: 1, project: {}, dirty: false } as any)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Utility Methods
  // ============================================================================

  describe("Utility Methods", () => {
    it("returns temp directory path", () => {
      expect(service.getTempDir()).toBe(tempDir)
    })

    it("uses default temp directory when not specified", () => {
      const defaultService = new NodeBackendService()
      const tempPath = defaultService.getTempDir()

      expect(tempPath).toContain("timeline-studio")
      expect(tempPath).toContain(os.tmpdir())
    })
  })
})
