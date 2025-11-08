/**
 * Тесты для SimpleEventBus - браузерной замены Node.js EventEmitter
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { SimpleEventBus } from "../simple-event-bus"

// Типы событий для тестирования
interface TestEvents extends Record<string, (...args: any) => void> {
  "test-event": (value: string) => void
  "number-event": (num: number) => void
  "multi-arg-event": (str: string, num: number, bool: boolean) => void
  "no-arg-event": () => void
}

describe("SimpleEventBus", () => {
  let eventBus: SimpleEventBus<TestEvents>

  beforeEach(() => {
    eventBus = new SimpleEventBus<TestEvents>()
  })

  describe("Basic Event Handling", () => {
    it("should register and emit events", () => {
      const handler = vi.fn()
      eventBus.on("test-event", handler)

      eventBus.emit("test-event", "hello")

      expect(handler).toHaveBeenCalledWith("hello")
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("should support multiple handlers for same event", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)
      eventBus.on("test-event", handler3)

      eventBus.emit("test-event", "test")

      expect(handler1).toHaveBeenCalledWith("test")
      expect(handler2).toHaveBeenCalledWith("test")
      expect(handler3).toHaveBeenCalledWith("test")
    })

    it("should handle multiple arguments", () => {
      const handler = vi.fn()
      eventBus.on("multi-arg-event", handler)

      eventBus.emit("multi-arg-event", "text", 42, true)

      expect(handler).toHaveBeenCalledWith("text", 42, true)
    })

    it("should handle events with no arguments", () => {
      const handler = vi.fn()
      eventBus.on("no-arg-event", handler)

      eventBus.emit("no-arg-event")

      expect(handler).toHaveBeenCalled()
      expect(handler).toHaveBeenCalledWith()
    })

    it("should return false when emitting event with no listeners", () => {
      const result = eventBus.emit("test-event", "value")

      expect(result).toBe(false)
    })

    it("should return true when emitting event with listeners", () => {
      eventBus.on("test-event", vi.fn())

      const result = eventBus.emit("test-event", "value")

      expect(result).toBe(true)
    })
  })

  describe("Removing Listeners", () => {
    it("should remove specific listener", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)

      eventBus.off("test-event", handler1)
      eventBus.emit("test-event", "test")

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it("should support removeListener alias", () => {
      const handler = vi.fn()

      eventBus.on("test-event", handler)
      eventBus.removeListener("test-event", handler)
      eventBus.emit("test-event", "test")

      expect(handler).not.toHaveBeenCalled()
    })

    it("should remove all listeners for event", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)

      eventBus.removeAllListeners("test-event")
      eventBus.emit("test-event", "test")

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it("should remove all listeners for all events", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("number-event", handler2)

      eventBus.removeAllListeners()
      eventBus.emit("test-event", "test")
      eventBus.emit("number-event", 42)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it("should handle removing non-existent listener gracefully", () => {
      const handler = vi.fn()

      expect(() => {
        eventBus.off("test-event", handler)
      }).not.toThrow()
    })

    it("should support method chaining for on/off", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const result = eventBus.on("test-event", handler1).on("number-event", handler2).off("test-event", handler1)

      expect(result).toBe(eventBus)
    })
  })

  describe("Once Listeners", () => {
    it("should call once listener only one time", () => {
      const handler = vi.fn()

      eventBus.once("test-event", handler)

      eventBus.emit("test-event", "first")
      eventBus.emit("test-event", "second")

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith("first")
    })

    it("should remove once listener after first call", () => {
      const handler = vi.fn()

      eventBus.once("test-event", handler)
      eventBus.emit("test-event", "test")

      expect(eventBus.listenerCount("test-event")).toBe(0)
    })

    it("should support multiple once listeners", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.once("test-event", handler1)
      eventBus.once("test-event", handler2)

      eventBus.emit("test-event", "test")

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(eventBus.listenerCount("test-event")).toBe(0)
    })
  })

  describe("Error Handling", () => {
    it("should catch errors in handlers and continue processing other handlers", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const handler1 = vi.fn(() => {
        throw new Error("Handler 1 error")
      })
      const handler2 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)

      eventBus.emit("test-event", "test")

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it("should log error details to console", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const testError = new Error("Test error")
      const handler = vi.fn(() => {
        throw testError
      })

      eventBus.on("test-event", handler)
      eventBus.emit("test-event", "test")

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event handler for "test-event"'),
        testError,
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe("Listener Management", () => {
    it("should return correct listener count", () => {
      expect(eventBus.listenerCount("test-event")).toBe(0)

      eventBus.on("test-event", vi.fn())
      expect(eventBus.listenerCount("test-event")).toBe(1)

      eventBus.on("test-event", vi.fn())
      expect(eventBus.listenerCount("test-event")).toBe(2)
    })

    it("should return event names with listeners", () => {
      eventBus.on("test-event", vi.fn())
      eventBus.on("number-event", vi.fn())

      const names = eventBus.eventNames()

      expect(names).toContain("test-event")
      expect(names).toContain("number-event")
      expect(names).toHaveLength(2)
    })

    it("should return empty array for event names with no listeners", () => {
      const names = eventBus.eventNames()

      expect(names).toEqual([])
    })

    it("should return listeners for event", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)

      const listeners = eventBus.getListeners("test-event")

      expect(listeners).toHaveLength(2)
      expect(listeners).toContain(handler1)
      expect(listeners).toContain(handler2)
    })

    it("should return empty array for event with no listeners", () => {
      const listeners = eventBus.getListeners("test-event")

      expect(listeners).toEqual([])
    })
  })

  describe("Edge Cases", () => {
    it("should handle adding same handler multiple times", () => {
      const handler = vi.fn()

      eventBus.on("test-event", handler)
      eventBus.on("test-event", handler)

      eventBus.emit("test-event", "test")

      // Set semantics - handler should only be registered once
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("should handle removing handler during emit", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn(() => {
        eventBus.off("test-event", handler1)
      })

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)

      // This should not cause issues due to array copying in emit
      eventBus.emit("test-event", "test")

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it("should handle adding handler during emit", () => {
      const handler3 = vi.fn()
      const handler2 = vi.fn(() => {
        eventBus.on("test-event", handler3)
      })
      const handler1 = vi.fn()

      eventBus.on("test-event", handler1)
      eventBus.on("test-event", handler2)

      eventBus.emit("test-event", "test")

      // handler3 should not be called in the same emit
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(handler3).not.toHaveBeenCalled()

      // But should be called in next emit
      eventBus.emit("test-event", "test2")
      expect(handler3).toHaveBeenCalledWith("test2")
    })

    it("should clean up empty listener sets", () => {
      const handler = vi.fn()

      eventBus.on("test-event", handler)
      eventBus.off("test-event", handler)

      const names = eventBus.eventNames()
      expect(names).not.toContain("test-event")
    })
  })

  describe("Type Safety", () => {
    it("should enforce event types at compile time", () => {
      // These should compile without errors
      eventBus.on("test-event", (value: string) => {
        expect(typeof value).toBe("string")
      })

      eventBus.on("number-event", (num: number) => {
        expect(typeof num).toBe("number")
      })

      eventBus.emit("test-event", "hello")
      eventBus.emit("number-event", 42)

      // TypeScript should prevent these at compile time:
      // eventBus.emit("test-event", 42) // ❌ number instead of string
      // eventBus.emit("number-event", "text") // ❌ string instead of number
    })
  })
})
