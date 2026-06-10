import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { NodeStorageService } from "../storage"

describe("NodeStorageService", () => {
  let service: NodeStorageService
  let tempDir: string
  let filePath: string

  beforeEach(() => {
    // Create temp directory for tests
    tempDir = path.join(os.tmpdir(), `node-storage-test-${Date.now()}`)
    filePath = path.join(tempDir, "test-settings.json")
    service = new NodeStorageService({ filePath })
  })

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  // ============================================================================
  // Basic Operations
  // ============================================================================

  describe("Basic Operations", () => {
    it("sets and gets values", async () => {
      await service.set("test-key", "test-value")
      const value = await service.get<string>("test-key")

      expect(value).toBe("test-value")
    })

    it("returns null for non-existent keys", async () => {
      const value = await service.get("non-existent")

      expect(value).toBeNull()
    })

    it("stores different types", async () => {
      await service.set("string", "hello")
      await service.set("number", 42)
      await service.set("boolean", true)
      await service.set("object", { name: "test", count: 10 })
      await service.set("array", [1, 2, 3])

      expect(await service.get<string>("string")).toBe("hello")
      expect(await service.get<number>("number")).toBe(42)
      expect(await service.get<boolean>("boolean")).toBe(true)
      expect(await service.get<object>("object")).toEqual({ name: "test", count: 10 })
      expect(await service.get<number[]>("array")).toEqual([1, 2, 3])
    })

    it("overwrites existing values", async () => {
      await service.set("key", "old-value")
      await service.set("key", "new-value")

      const value = await service.get<string>("key")
      expect(value).toBe("new-value")
    })
  })

  // ============================================================================
  // Delete
  // ============================================================================

  describe("Delete", () => {
    it("deletes existing keys", async () => {
      await service.set("key", "value")
      await service.delete("key")

      const value = await service.get("key")
      expect(value).toBeNull()
    })

    it("does not throw when deleting non-existent keys", async () => {
      await expect(service.delete("non-existent")).resolves.not.toThrow()
    })

    it("persists deletion to file", async () => {
      await service.set("key1", "value1")
      await service.set("key2", "value2")
      await service.delete("key1")

      // Create new instance to verify persistence
      const newService = new NodeStorageService({ filePath })
      expect(await newService.get("key1")).toBeNull()
      expect(await newService.get("key2")).toBe("value2")
    })
  })

  // ============================================================================
  // Has
  // ============================================================================

  describe("Has", () => {
    it("returns true for existing keys", async () => {
      await service.set("key", "value")

      expect(await service.has("key")).toBe(true)
    })

    it("returns false for non-existent keys", async () => {
      expect(await service.has("non-existent")).toBe(false)
    })

    it("returns false after deletion", async () => {
      await service.set("key", "value")
      await service.delete("key")

      expect(await service.has("key")).toBe(false)
    })
  })

  // ============================================================================
  // Clear
  // ============================================================================

  describe("Clear", () => {
    it("removes all keys", async () => {
      await service.set("key1", "value1")
      await service.set("key2", "value2")
      await service.set("key3", "value3")

      await service.clear()

      expect(await service.get("key1")).toBeNull()
      expect(await service.get("key2")).toBeNull()
      expect(await service.get("key3")).toBeNull()
    })

    it("creates empty storage file", async () => {
      await service.set("key", "value")
      await service.clear()

      expect(fs.existsSync(filePath)).toBe(true)
      const content = fs.readFileSync(filePath, "utf-8")
      expect(JSON.parse(content)).toEqual({})
    })
  })

  // ============================================================================
  // Keys
  // ============================================================================

  describe("Keys", () => {
    it("returns all keys", async () => {
      await service.set("key1", "value1")
      await service.set("key2", "value2")
      await service.set("key3", "value3")

      const keys = await service.keys()

      expect(keys).toEqual(["key1", "key2", "key3"])
    })

    it("returns empty array when no keys", async () => {
      const keys = await service.keys()

      expect(keys).toEqual([])
    })

    it("updates after set and delete", async () => {
      await service.set("key1", "value1")
      await service.set("key2", "value2")
      expect(await service.keys()).toEqual(["key1", "key2"])

      await service.delete("key1")
      expect(await service.keys()).toEqual(["key2"])
    })
  })

  // ============================================================================
  // Entries
  // ============================================================================

  describe("Entries", () => {
    it("returns all entries", async () => {
      await service.set("key1", "value1")
      await service.set("key2", 42)
      await service.set("key3", { data: "test" })

      const entries = await service.entries()

      expect(entries).toEqual([
        ["key1", "value1"],
        ["key2", 42],
        ["key3", { data: "test" }],
      ])
    })

    it("returns empty array when no entries", async () => {
      const entries = await service.entries()

      expect(entries).toEqual([])
    })
  })

  // ============================================================================
  // Persistence
  // ============================================================================

  describe("Persistence", () => {
    it("creates storage file on first write", async () => {
      await service.set("key", "value")

      expect(fs.existsSync(filePath)).toBe(true)
    })

    it("persists data to file", async () => {
      await service.set("key", "value")

      const content = fs.readFileSync(filePath, "utf-8")
      const data = JSON.parse(content)

      expect(data).toEqual({ key: "value" })
    })

    it("loads existing data from file", async () => {
      // Create file with existing data
      fs.mkdirSync(tempDir, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify({ existing: "data" }), "utf-8")

      const newService = new NodeStorageService({ filePath })
      const value = await newService.get<string>("existing")

      expect(value).toBe("data")
    })

    it("handles corrupted file gracefully", async () => {
      // Create corrupted file
      fs.mkdirSync(tempDir, { recursive: true })
      fs.writeFileSync(filePath, "{ invalid json", "utf-8")

      const newService = new NodeStorageService({ filePath })
      const value = await newService.get("key")

      expect(value).toBeNull()
    })

    it("creates directory if it does not exist", async () => {
      const deepPath = path.join(tempDir, "nested", "deep", "path", "settings.json")
      const deepService = new NodeStorageService({ filePath: deepPath })

      await deepService.set("key", "value")

      expect(fs.existsSync(deepPath)).toBe(true)
      expect(fs.existsSync(path.dirname(deepPath))).toBe(true)
    })
  })

  // ============================================================================
  // Constructor Options
  // ============================================================================

  describe("Constructor Options", () => {
    it("uses default path when no options", async () => {
      const defaultService = new NodeStorageService()
      await defaultService.set("key", "value")

      // Should create file in ~/.timeline-studio/settings.json
      const defaultPath = path.join(process.env.HOME || "~", ".timeline-studio", "settings.json")
      expect(await defaultService.get("key")).toBe("value")

      // Clean up
      if (fs.existsSync(defaultPath)) {
        fs.unlinkSync(defaultPath)
        const dir = path.dirname(defaultPath)
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
          fs.rmdirSync(dir)
        }
      }
    })

    it("uses custom configDir and fileName", async () => {
      const customDir = path.join(tempDir, "custom-config")
      const customService = new NodeStorageService({
        configDir: customDir,
        fileName: "custom.json",
      })

      await customService.set("key", "value")

      const customPath = path.join(customDir, "custom.json")
      expect(fs.existsSync(customPath)).toBe(true)
    })

    it("prioritizes filePath over configDir/fileName", async () => {
      const specificPath = path.join(tempDir, "specific.json")
      const conflictService = new NodeStorageService({
        filePath: specificPath,
        configDir: path.join(tempDir, "other"),
        fileName: "other.json",
      })

      await conflictService.set("key", "value")

      expect(fs.existsSync(specificPath)).toBe(true)
      expect(fs.existsSync(path.join(tempDir, "other", "other.json"))).toBe(false)
    })
  })
})
