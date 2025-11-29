import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriStorageService } from "../storage"

const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  clear: vi.fn(),
  save: vi.fn(),
}

const mockLoad = vi.fn()

vi.mock("@tauri-apps/plugin-store", () => ({
  load: (...args: any[]) => mockLoad(...args),
}))

describe("TauriStorageService", () => {
  let service: TauriStorageService

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoad.mockResolvedValue(mockStore)
    service = new TauriStorageService()
  })

  describe("constructor", () => {
    it("uses default store name", () => {
      const service = new TauriStorageService()
      expect(service).toBeDefined()
    })

    it("uses custom store name", () => {
      const service = new TauriStorageService("custom.json")
      expect(service).toBeDefined()
    })
  })

  describe("lazy initialization", () => {
    it("loads store on first operation", async () => {
      mockStore.get.mockResolvedValueOnce("value")

      await service.get("key")

      expect(mockLoad).toHaveBeenCalledWith("settings.json")
      expect(mockLoad).toHaveBeenCalledTimes(1)
    })

    it("reuses store instance on subsequent operations", async () => {
      mockStore.get.mockResolvedValue("value")

      await service.get("key1")
      await service.get("key2")
      await service.get("key3")

      expect(mockLoad).toHaveBeenCalledTimes(1)
    })

    it("handles concurrent initialization correctly", async () => {
      mockStore.get.mockResolvedValue("value")

      await Promise.all([service.get("key1"), service.get("key2"), service.get("key3")])

      expect(mockLoad).toHaveBeenCalledTimes(1)
    })

    it("uses custom store name during initialization", async () => {
      const customService = new TauriStorageService("custom.json")
      mockStore.get.mockResolvedValueOnce("value")

      await customService.get("key")

      expect(mockLoad).toHaveBeenCalledWith("custom.json")
    })
  })

  describe("get", () => {
    it("retrieves value from store", async () => {
      mockStore.get.mockResolvedValueOnce("test-value")

      const result = await service.get("test-key")

      expect(mockStore.get).toHaveBeenCalledWith("test-key")
      expect(result).toBe("test-value")
    })

    it("returns null when value is undefined", async () => {
      mockStore.get.mockResolvedValueOnce(undefined)

      const result = await service.get("missing-key")

      expect(result).toBeNull()
    })

    it("returns null when value is null", async () => {
      mockStore.get.mockResolvedValueOnce(null)

      const result = await service.get("null-key")

      expect(result).toBeNull()
    })

    it("supports typed values", async () => {
      interface TestValue {
        id: string
        count: number
      }

      const value: TestValue = { id: "123", count: 42 }
      mockStore.get.mockResolvedValueOnce(value)

      const result = await service.get<TestValue>("typed-key")

      expect(result).toEqual(value)
    })
  })

  describe("set", () => {
    it("sets value in store and saves", async () => {
      mockStore.set.mockResolvedValueOnce(undefined)
      mockStore.save.mockResolvedValueOnce(undefined)

      await service.set("test-key", "test-value")

      expect(mockStore.set).toHaveBeenCalledWith("test-key", "test-value")
      expect(mockStore.save).toHaveBeenCalledTimes(1)
    })

    it("supports complex values", async () => {
      const value = { nested: { data: [1, 2, 3] } }
      mockStore.set.mockResolvedValueOnce(undefined)
      mockStore.save.mockResolvedValueOnce(undefined)

      await service.set("complex-key", value)

      expect(mockStore.set).toHaveBeenCalledWith("complex-key", value)
    })

    it("handles null values", async () => {
      mockStore.set.mockResolvedValueOnce(undefined)
      mockStore.save.mockResolvedValueOnce(undefined)

      await service.set("null-key", null)

      expect(mockStore.set).toHaveBeenCalledWith("null-key", null)
    })
  })

  describe("delete", () => {
    it("deletes key from store and saves", async () => {
      mockStore.delete.mockResolvedValueOnce(true)
      mockStore.save.mockResolvedValueOnce(undefined)

      await service.delete("test-key")

      expect(mockStore.delete).toHaveBeenCalledWith("test-key")
      expect(mockStore.save).toHaveBeenCalledTimes(1)
    })
  })

  describe("has", () => {
    it("returns true when key exists", async () => {
      mockStore.has.mockResolvedValueOnce(true)

      const result = await service.has("existing-key")

      expect(mockStore.has).toHaveBeenCalledWith("existing-key")
      expect(result).toBe(true)
    })

    it("returns false when key does not exist", async () => {
      mockStore.has.mockResolvedValueOnce(false)

      const result = await service.has("missing-key")

      expect(result).toBe(false)
    })
  })

  describe("keys", () => {
    it("returns all keys from store", async () => {
      const keys = ["key1", "key2", "key3"]
      mockStore.keys.mockResolvedValueOnce(keys)

      const result = await service.keys()

      expect(mockStore.keys).toHaveBeenCalledTimes(1)
      expect(result).toEqual(keys)
    })

    it("returns empty array when no keys", async () => {
      mockStore.keys.mockResolvedValueOnce([])

      const result = await service.keys()

      expect(result).toEqual([])
    })
  })

  describe("clear", () => {
    it("clears store and saves", async () => {
      mockStore.clear.mockResolvedValueOnce(undefined)
      mockStore.save.mockResolvedValueOnce(undefined)

      await service.clear()

      expect(mockStore.clear).toHaveBeenCalledTimes(1)
      expect(mockStore.save).toHaveBeenCalledTimes(1)
    })
  })

  describe("error handling", () => {
    it("propagates store initialization errors", async () => {
      const error = new Error("Store load failed")
      mockLoad.mockRejectedValueOnce(error)

      const failService = new TauriStorageService()

      await expect(failService.get("key")).rejects.toThrow("Store load failed")
    })

    it("propagates get errors", async () => {
      const error = new Error("Get failed")
      mockStore.get.mockRejectedValueOnce(error)

      await expect(service.get("key")).rejects.toThrow("Get failed")
    })

    it("propagates set errors", async () => {
      const error = new Error("Set failed")
      mockStore.set.mockRejectedValueOnce(error)

      await expect(service.set("key", "value")).rejects.toThrow("Set failed")
    })
  })
})
