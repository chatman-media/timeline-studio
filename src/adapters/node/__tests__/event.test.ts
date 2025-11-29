import { beforeEach, describe, expect, it, vi } from "vitest"
import { NodeEventService } from "../event"

describe("NodeEventService", () => {
  let service: NodeEventService

  beforeEach(() => {
    service = new NodeEventService()
  })

  // ============================================================================
  // Event Listening
  // ============================================================================

  describe("Event Listening", () => {
    it("listens to events", async () => {
      const callback = vi.fn()
      await service.listen("test-event", callback)

      await service.emit("test-event", { data: "test" })

      expect(callback).toHaveBeenCalledWith({ data: "test" })
    })

    it("returns unlisten function", async () => {
      const callback = vi.fn()
      const unlisten = await service.listen("test-event", callback)

      expect(typeof unlisten).toBe("function")
    })

    it("unlisten removes the listener", async () => {
      const callback = vi.fn()
      const unlisten = await service.listen("test-event", callback)

      unlisten()
      await service.emit("test-event", { data: "test" })

      expect(callback).not.toHaveBeenCalled()
    })

    it("supports multiple listeners for same event", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      await service.listen("test-event", callback1)
      await service.listen("test-event", callback2)

      await service.emit("test-event", { data: "test" })

      expect(callback1).toHaveBeenCalledWith({ data: "test" })
      expect(callback2).toHaveBeenCalledWith({ data: "test" })
    })

    it("supports different events", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      await service.listen("event1", callback1)
      await service.listen("event2", callback2)

      await service.emit("event1", { data: "event1" })
      await service.emit("event2", { data: "event2" })

      expect(callback1).toHaveBeenCalledWith({ data: "event1" })
      expect(callback2).toHaveBeenCalledWith({ data: "event2" })
      expect(callback1).not.toHaveBeenCalledWith({ data: "event2" })
    })
  })

  // ============================================================================
  // Once
  // ============================================================================

  describe("Once", () => {
    it("listens to event once", async () => {
      const promise = service.once<{ data: string }>("test-event")

      await service.emit("test-event", { data: "test" })

      const result = await promise
      expect(result).toEqual({ data: "test" })
    })

    it("does not listen to subsequent events", async () => {
      const promise = service.once<{ data: string }>("test-event")

      await service.emit("test-event", { data: "first" })
      await service.emit("test-event", { data: "second" })

      const result = await promise
      expect(result).toEqual({ data: "first" })
    })
  })

  // ============================================================================
  // Emit
  // ============================================================================

  describe("Emit", () => {
    it("emits events without payload", async () => {
      const callback = vi.fn()
      await service.listen("test-event", callback)

      await service.emit("test-event")

      expect(callback).toHaveBeenCalledWith(undefined)
    })

    it("emits events with payload", async () => {
      const callback = vi.fn()
      await service.listen("test-event", callback)

      await service.emit("test-event", { data: "test", count: 42 })

      expect(callback).toHaveBeenCalledWith({ data: "test", count: 42 })
    })

    it("does not throw if no listeners", async () => {
      await expect(service.emit("non-existent-event", { data: "test" })).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Listener Count
  // ============================================================================

  describe("Listener Count", () => {
    it("returns listener count for specific event", async () => {
      await service.listen("event1", vi.fn())
      await service.listen("event1", vi.fn())
      await service.listen("event2", vi.fn())

      expect(service.getListenerCount("event1")).toBe(2)
      expect(service.getListenerCount("event2")).toBe(1)
    })

    it("returns total listener count", async () => {
      await service.listen("event1", vi.fn())
      await service.listen("event2", vi.fn())
      await service.listen("event3", vi.fn())

      expect(service.getListenerCount()).toBe(3)
    })

    it("decreases count when listeners are removed", async () => {
      const unlisten1 = await service.listen("event1", vi.fn())
      const unlisten2 = await service.listen("event1", vi.fn())

      expect(service.getListenerCount("event1")).toBe(2)

      unlisten1()
      expect(service.getListenerCount("event1")).toBe(1)

      unlisten2()
      expect(service.getListenerCount("event1")).toBe(0)
    })
  })

  // ============================================================================
  // Remove All Listeners
  // ============================================================================

  describe("Remove All Listeners", () => {
    it("removes all listeners for specific event", async () => {
      const callback = vi.fn()
      await service.listen("event1", callback)
      await service.listen("event1", vi.fn())
      await service.listen("event2", vi.fn())

      service.removeAllListeners("event1")

      await service.emit("event1", { data: "test" })
      await service.emit("event2", { data: "test" })

      expect(callback).not.toHaveBeenCalled()
      expect(service.getListenerCount("event1")).toBe(0)
      expect(service.getListenerCount("event2")).toBe(1)
    })

    it("removes all listeners for all events", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      await service.listen("event1", callback1)
      await service.listen("event2", callback2)

      service.removeAllListeners()

      await service.emit("event1", { data: "test" })
      await service.emit("event2", { data: "test" })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
      expect(service.getListenerCount()).toBe(0)
    })
  })
})
