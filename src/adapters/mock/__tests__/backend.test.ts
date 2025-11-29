import { beforeEach, describe, expect, it, vi } from "vitest"
import { MockBackendService } from "../backend"
import type { ProjectEvent, ProjectState } from "@/core/types"

describe("MockBackendService", () => {
  let service: MockBackendService

  beforeEach(() => {
    service = new MockBackendService()
  })

  describe("Connection Management", () => {
    it("starts disconnected", () => {
      expect(service.connected).toBe(false)
    })

    it("connects successfully", async () => {
      await service.connect()
      expect(service.connected).toBe(true)
    })

    it("disconnects successfully", async () => {
      await service.connect()
      await service.disconnect()
      expect(service.connected).toBe(false)
    })
  })

  describe("Command Execution", () => {
    it("executes command successfully", async () => {
      const result = await service.executeCommand({
        type: "CreateProject",
        payload: { name: "Test" },
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("Project State", () => {
    it("returns null for initial state", async () => {
      const state = await service.getProjectState()
      expect(state).toBeNull()
    })

    it("returns set state", async () => {
      const mockState: ProjectState = {
        version: 1,
        project: { name: "Test", timeline: { tracks: [] } },
      } as any

      service.setState(mockState)

      const state = await service.getProjectState()
      expect(state).toEqual(mockState)
    })

    it("notifies state change handlers", async () => {
      const handler = vi.fn()
      service.onStateChange(handler)

      const mockState: ProjectState = {
        version: 1,
        project: { name: "Test" },
      } as any

      service.setState(mockState)

      expect(handler).toHaveBeenCalledWith(mockState)
    })

    it("does not notify after unsubscribe", async () => {
      const handler = vi.fn()
      const unsubscribe = service.onStateChange(handler)

      unsubscribe()

      service.setState({ version: 1, project: {} } as any)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe("Event History", () => {
    it("returns empty history initially", async () => {
      const events = await service.getEventHistory()
      expect(events).toEqual([])
    })

    it("returns all events without version filter", async () => {
      const event1: ProjectEvent = { type: "ProjectCreated", payload: {} }
      const event2: ProjectEvent = { type: "ClipAdded", payload: {} }

      service.emitEvent(event1)
      service.emitEvent(event2)

      const events = await service.getEventHistory()

      expect(events).toHaveLength(2)
      expect(events[0].event).toEqual(event1)
      expect(events[1].event).toEqual(event2)
    })

    it("returns events since version", async () => {
      service.emitEvent({ type: "ProjectCreated", payload: {} })
      service.emitEvent({ type: "ClipAdded", payload: {} })
      service.emitEvent({ type: "ClipRemoved", payload: {} })

      const events = await service.getEventHistory(1)

      expect(events).toHaveLength(2)
    })

    it("includes proper metadata in events", async () => {
      service.emitEvent({ type: "ProjectCreated", payload: {} })

      const events = await service.getEventHistory()

      expect(events[0].metadata).toMatchObject({
        version: 1,
        source: "mock",
      })
      expect(events[0].metadata.id).toBeTruthy()
      expect(events[0].metadata.timestamp).toBeTruthy()
    })
  })

  describe("Event Subscription", () => {
    it("notifies event handlers", () => {
      const handler = vi.fn()
      service.onEvent(handler)

      const event: ProjectEvent = { type: "ProjectCreated", payload: {} }
      service.emitEvent(event)

      expect(handler).toHaveBeenCalledWith(event)
    })

    it("notifies multiple handlers", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      service.onEvent(handler1)
      service.onEvent(handler2)

      const event: ProjectEvent = { type: "ClipAdded", payload: {} }
      service.emitEvent(event)

      expect(handler1).toHaveBeenCalledWith(event)
      expect(handler2).toHaveBeenCalledWith(event)
    })

    it("unsubscribes from events", () => {
      const handler = vi.fn()
      const unsubscribe = service.onEvent(handler)

      unsubscribe()

      service.emitEvent({ type: "ProjectCreated", payload: {} })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe("Reset", () => {
    it("resets all state", async () => {
      await service.connect()
      service.setState({ version: 1, project: {} } as any)
      service.emitEvent({ type: "ProjectCreated", payload: {} })

      const handler = vi.fn()
      service.onEvent(handler)
      service.onStateChange(handler)

      service.reset()

      expect(service.connected).toBe(false)
      expect(await service.getProjectState()).toBeNull()
      expect(await service.getEventHistory()).toEqual([])

      service.emitEvent({ type: "ClipAdded", payload: {} })
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
