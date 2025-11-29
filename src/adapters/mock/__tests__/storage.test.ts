import { beforeEach, describe, expect, it } from "vitest"
import { MockStorageService } from "../storage"

describe("MockStorageService", () => {
  describe("In-Memory Mode", () => {
    let service: MockStorageService

    beforeEach(() => {
      service = new MockStorageService(false)
    })

    it("stores and retrieves values", async () => {
      await service.set("key", "value")
      const result = await service.get("key")
      expect(result).toBe("value")
    })

    it("returns null for missing keys", async () => {
      const result = await service.get("missing")
      expect(result).toBeNull()
    })

    it("supports typed values", async () => {
      interface TestData {
        id: string
        count: number
      }

      const data: TestData = { id: "123", count: 42 }
      await service.set("typed", data)

      const result = await service.get<TestData>("typed")
      expect(result).toEqual(data)
    })

    it("deletes keys", async () => {
      await service.set("key", "value")
      await service.delete("key")

      const result = await service.get("key")
      expect(result).toBeNull()
    })

    it("checks key existence", async () => {
      await service.set("existing", "value")

      expect(await service.has("existing")).toBe(true)
      expect(await service.has("missing")).toBe(false)
    })

    it("lists all keys", async () => {
      await service.set("key1", "value1")
      await service.set("key2", "value2")
      await service.set("key3", "value3")

      const keys = await service.keys()

      expect(keys).toHaveLength(3)
      expect(keys).toContain("key1")
      expect(keys).toContain("key2")
      expect(keys).toContain("key3")
    })

    it("clears all data", async () => {
      await service.set("key1", "value1")
      await service.set("key2", "value2")

      await service.clear()

      expect(await service.keys()).toEqual([])
    })

    describe("Test Helpers", () => {
      it("gets all data as object", async () => {
        await service.set("key1", "value1")
        await service.set("key2", { nested: true })

        const all = service.getAll()

        expect(all).toEqual({
          key1: "value1",
          key2: { nested: true },
        })
      })

      it("sets multiple values at once", () => {
        service.setData({
          key1: "value1",
          key2: "value2",
          key3: { nested: true },
        })

        expect(service.getAll()).toEqual({
          key1: "value1",
          key2: "value2",
          key3: { nested: true },
        })
      })

      it("replaces existing data when setData is called", () => {
        service.setData({ old: "data" })
        service.setData({ new: "data" })

        expect(service.getAll()).toEqual({ new: "data" })
      })

      it("resets storage", async () => {
        await service.set("key", "value")

        service.reset()

        expect(service.getAll()).toEqual({})
      })
    })
  })
})
