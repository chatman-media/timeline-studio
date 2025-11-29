import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriEventService } from "../event"

const mockListen = vi.fn()
const mockEmit = vi.fn()

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: any[]) => mockListen(...args),
  emit: (...args: any[]) => mockEmit(...args),
}))

describe("TauriEventService", () => {
  let service: TauriEventService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TauriEventService()
  })

  describe("listen", () => {
    it("subscribes to event with callback", async () => {
      const callback = vi.fn()
      const unlisten = vi.fn()

      mockListen.mockResolvedValueOnce(unlisten)

      const result = await service.listen("test-event", callback)

      expect(mockListen).toHaveBeenCalledWith("test-event", callback)
      expect(result).toBe(unlisten)
    })

    it("supports typed events", async () => {
      interface TestPayload {
        id: string
        value: number
      }

      const callback = vi.fn()
      const unlisten = vi.fn()

      mockListen.mockResolvedValueOnce(unlisten)

      await service.listen<TestPayload>("typed-event", callback)

      expect(mockListen).toHaveBeenCalledWith("typed-event", callback)
    })

    it("returns unlisten function that can be called", async () => {
      const callback = vi.fn()
      const unlisten = vi.fn()

      mockListen.mockResolvedValueOnce(unlisten)

      const result = await service.listen("test-event", callback)

      result()

      expect(unlisten).toHaveBeenCalledTimes(1)
    })
  })

  describe("emit", () => {
    it("emits event with payload", async () => {
      const payload = { data: "test" }

      mockEmit.mockResolvedValueOnce(undefined)

      await service.emit("test-event", payload)

      expect(mockEmit).toHaveBeenCalledWith("test-event", payload)
    })

    it("supports typed payloads", async () => {
      interface TestPayload {
        id: string
        value: number
      }

      const payload: TestPayload = { id: "123", value: 42 }

      mockEmit.mockResolvedValueOnce(undefined)

      await service.emit<TestPayload>("typed-event", payload)

      expect(mockEmit).toHaveBeenCalledWith("typed-event", payload)
    })

    it("handles empty payload", async () => {
      mockEmit.mockResolvedValueOnce(undefined)

      await service.emit("test-event", {})

      expect(mockEmit).toHaveBeenCalledWith("test-event", {})
    })
  })

  describe("error handling", () => {
    it("propagates listen errors", async () => {
      const error = new Error("Listen failed")
      mockListen.mockRejectedValueOnce(error)

      await expect(service.listen("test-event", vi.fn())).rejects.toThrow("Listen failed")
    })

    it("propagates emit errors", async () => {
      const error = new Error("Emit failed")
      mockEmit.mockRejectedValueOnce(error)

      await expect(service.emit("test-event", {})).rejects.toThrow("Emit failed")
    })
  })
})
