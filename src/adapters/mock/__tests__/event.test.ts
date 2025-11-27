import { beforeEach, describe, expect, it, vi } from "vitest"
import { MockEventService } from "../event"

describe("MockEventService", () => {
  let eventService: MockEventService

  beforeEach(() => {
    eventService = new MockEventService()
  })

  describe("listen", () => {
    it("registers event listener", async () => {
      const callback = vi.fn()
      await eventService.listen("test-event", callback)

      expect(eventService.getListenerCount("test-event")).toBe(1)
    })

    it("registers multiple listeners for same event", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      await eventService.listen("test-event", callback1)
      await eventService.listen("test-event", callback2)

      expect(eventService.getListenerCount("test-event")).toBe(2)
    })

    it("registers listeners for different events", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      await eventService.listen("event-1", callback1)
      await eventService.listen("event-2", callback2)

      expect(eventService.getRegisteredEvents()).toHaveLength(2)
      expect(eventService.getRegisteredEvents()).toContain("event-1")
      expect(eventService.getRegisteredEvents()).toContain("event-2")
    })

    it("returns unlisten function", async () => {
      const callback = vi.fn()
      const unlisten = await eventService.listen("test-event", callback)

      expect(typeof unlisten).toBe("function")
    })
  })

  describe("unlisten", () => {
    it("removes listener when unlisten is called", async () => {
      const callback = vi.fn()
      const unlisten = await eventService.listen("test-event", callback)

      expect(eventService.getListenerCount("test-event")).toBe(1)

      unlisten()

      expect(eventService.getListenerCount("test-event")).toBe(0)
    })

    it("removes only specific listener", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unlisten1 = await eventService.listen("test-event", callback1)
      await eventService.listen("test-event", callback2)

      expect(eventService.getListenerCount("test-event")).toBe(2)

      unlisten1()

      expect(eventService.getListenerCount("test-event")).toBe(1)
    })

    it("cleans up event map when last listener removed", async () => {
      const callback = vi.fn()
      const unlisten = await eventService.listen("test-event", callback)

      expect(eventService.getRegisteredEvents()).toContain("test-event")

      unlisten()

      expect(eventService.getRegisteredEvents()).not.toContain("test-event")
    })
  })

  describe("emit", () => {
    it("calls registered listeners with payload", async () => {
      const callback = vi.fn()
      await eventService.listen("test-event", callback)

      await eventService.emit("test-event", { data: "test-data" })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({ payload: { data: "test-data" } })
    })

    it("calls all registered listeners", async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      await eventService.listen("test-event", callback1)
      await eventService.listen("test-event", callback2)

      await eventService.emit("test-event", { value: 42 })

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it("does nothing when no listeners registered", async () => {
      // Should not throw
      await expect(eventService.emit("unknown-event", {})).resolves.not.toThrow()
    })

    it("continues calling listeners even if one throws", async () => {
      const callback1 = vi.fn(() => {
        throw new Error("Callback error")
      })
      const callback2 = vi.fn()

      await eventService.listen("test-event", callback1)
      await eventService.listen("test-event", callback2)

      await eventService.emit("test-event", {})

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it("does not call unsubscribed listeners", async () => {
      const callback = vi.fn()
      const unlisten = await eventService.listen("test-event", callback)

      unlisten()

      await eventService.emit("test-event", {})

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe("typed events", () => {
    interface TestPayload {
      id: string
      value: number
    }

    it("supports typed payloads", async () => {
      const callback = vi.fn()
      await eventService.listen<TestPayload>("typed-event", callback)

      await eventService.emit<TestPayload>("typed-event", { id: "123", value: 42 })

      expect(callback).toHaveBeenCalledWith({
        payload: { id: "123", value: 42 },
      })
    })
  })

  describe("reset", () => {
    it("clears all listeners", async () => {
      await eventService.listen("event-1", vi.fn())
      await eventService.listen("event-2", vi.fn())
      await eventService.listen("event-2", vi.fn())

      expect(eventService.getRegisteredEvents()).toHaveLength(2)

      eventService.reset()

      expect(eventService.getRegisteredEvents()).toHaveLength(0)
    })
  })

  describe("test helpers", () => {
    it("getRegisteredEvents returns all event names", async () => {
      await eventService.listen("event-a", vi.fn())
      await eventService.listen("event-b", vi.fn())
      await eventService.listen("event-c", vi.fn())

      const events = eventService.getRegisteredEvents()

      expect(events).toHaveLength(3)
      expect(events).toEqual(expect.arrayContaining(["event-a", "event-b", "event-c"]))
    })

    it("getListenerCount returns correct count", async () => {
      expect(eventService.getListenerCount("test-event")).toBe(0)

      await eventService.listen("test-event", vi.fn())
      expect(eventService.getListenerCount("test-event")).toBe(1)

      await eventService.listen("test-event", vi.fn())
      expect(eventService.getListenerCount("test-event")).toBe(2)
    })
  })
})
