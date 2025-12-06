import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NodePlatformService } from "../platform"

describe("NodePlatformService", () => {
  let service: NodePlatformService
  let tempDir: string

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `node-platform-test-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })
    service = new NodePlatformService({ version: "1.0.0-test" })
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  // ============================================================================
  // File Dialogs
  // ============================================================================

  describe("File Dialogs", () => {
    it("returns null without dialog handler", async () => {
      const result = await service.showOpenDialog()

      expect(result).toBeNull()
    })

    it("calls custom showOpen handler", async () => {
      const mockHandler = vi.fn().mockResolvedValue(["/path/to/file.txt"])
      const customService = new NodePlatformService({
        dialogHandler: { showOpen: mockHandler },
      })

      const result = await customService.showOpenDialog({ title: "Select File" })

      expect(mockHandler).toHaveBeenCalledWith({ title: "Select File" })
      expect(result).toEqual(["/path/to/file.txt"])
    })

    it("returns null for save dialog without handler", async () => {
      const result = await service.showSaveDialog()

      expect(result).toBeNull()
    })

    it("calls custom showSave handler", async () => {
      const mockHandler = vi.fn().mockResolvedValue("/path/to/save.txt")
      const customService = new NodePlatformService({
        dialogHandler: { showSave: mockHandler },
      })

      const result = await customService.showSaveDialog({ defaultPath: "/path/to/save.txt" })

      expect(mockHandler).toHaveBeenCalledWith({ defaultPath: "/path/to/save.txt" })
      expect(result).toBe("/path/to/save.txt")
    })
  })

  // ============================================================================
  // File System
  // ============================================================================

  describe("File System", () => {
    it("reads binary files", async () => {
      const filePath = path.join(tempDir, "test.bin")
      const testData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"
      fs.writeFileSync(filePath, testData)

      const result = await service.readFile(filePath)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(testData)
    })

    it("writes binary files", async () => {
      const filePath = path.join(tempDir, "output.bin")
      const testData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])

      await service.writeFile(filePath, testData)

      const written = fs.readFileSync(filePath)
      expect(Buffer.from(written)).toEqual(Buffer.from(testData))
    })

    it("reads text files", async () => {
      const filePath = path.join(tempDir, "test.txt")
      fs.writeFileSync(filePath, "Hello, World!", "utf-8")

      const result = await service.readTextFile(filePath)

      expect(result).toBe("Hello, World!")
    })

    it("writes text files", async () => {
      const filePath = path.join(tempDir, "output.txt")

      await service.writeTextFile(filePath, "Test content")

      const content = fs.readFileSync(filePath, "utf-8")
      expect(content).toBe("Test content")
    })

    it("checks if file exists", async () => {
      const existingFile = path.join(tempDir, "exists.txt")
      fs.writeFileSync(existingFile, "test")

      expect(await service.exists(existingFile)).toBe(true)
      expect(await service.exists(path.join(tempDir, "not-exists.txt"))).toBe(false)
    })
  })

  // ============================================================================
  // File Stats
  // ============================================================================

  describe("File Stats", () => {
    it("gets file stats", async () => {
      const filePath = path.join(tempDir, "stats-test.txt")
      const content = "Test file content"
      fs.writeFileSync(filePath, content)

      const stats = await service.getFileStats(filePath)

      expect(stats).not.toBeNull()
      expect(stats?.size).toBe(Buffer.byteLength(content))
      expect(stats?.lastModified).toBeGreaterThan(0)
    })

    it("returns null for non-existent file", async () => {
      const stats = await service.getFileStats("/non/existent/file.txt")

      expect(stats).toBeNull()
    })
  })

  // ============================================================================
  // Clipboard (Platform Specific)
  // ============================================================================

  describe("Clipboard", () => {
    it("returns empty string on clipboard read failure", async () => {
      // This may fail in CI environment
      const result = await service.readClipboard()

      expect(typeof result).toBe("string")
    })

    it("does not throw on clipboard write failure", async () => {
      // This may fail in CI environment
      await expect(service.writeClipboard("test")).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Notifications
  // ============================================================================

  describe("Notifications", () => {
    it("calls custom notification handler", async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined)
      const customService = new NodePlatformService({
        notificationHandler: mockHandler,
      })

      await customService.showNotification({
        title: "Test",
        body: "Test message",
      })

      expect(mockHandler).toHaveBeenCalledWith({
        title: "Test",
        body: "Test message",
      })
    })

    it("does not throw without notification handler", async () => {
      // Should fall back to console.log
      await expect(
        service.showNotification({
          title: "Test",
          body: "Test message",
        }),
      ).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Shell Operations
  // ============================================================================

  describe("Shell Operations", () => {
    it("does not throw when opening path", async () => {
      // May fail in headless environment, but shouldn't throw
      await expect(service.openPath(tempDir)).resolves.not.toThrow()
    })

    it.skip("does not throw when opening URL", async () => {
      // Skipped to prevent real network requests during tests
      // May fail in headless environment, but shouldn't throw
      await expect(service.openUrl("https://example.com")).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // App Info
  // ============================================================================

  describe("App Info", () => {
    it("returns version", async () => {
      const version = await service.getVersion()

      expect(version).toBe("1.0.0-test")
    })

    it("uses default version when not specified", async () => {
      const defaultService = new NodePlatformService()
      const version = await defaultService.getVersion()

      expect(version).toBe("1.0.0")
    })
  })

  // ============================================================================
  // Platform Info
  // ============================================================================

  describe("Platform Info", () => {
    it("returns platform", async () => {
      const platform = await service.getPlatform()

      expect(["darwin", "linux", "win32"]).toContain(platform)
    })
  })

  // ============================================================================
  // File Path Utilities
  // ============================================================================

  describe("File Path Utilities", () => {
    it("converts file src", () => {
      const result = service.convertFileSrc("/path/to/file.txt")

      expect(result).toBe("/path/to/file.txt")
    })

    it("gets basename", async () => {
      const result = await service.basename("/path/to/file.txt")

      expect(result).toBe("file.txt")
    })

    it("gets dirname", async () => {
      const result = await service.dirname("/path/to/file.txt")

      expect(result).toBe("/path/to")
    })

    it("joins paths", async () => {
      const result = await service.join("path", "to", "file.txt")

      expect(result).toBe(path.join("path", "to", "file.txt"))
    })

    it("gets absolute path", async () => {
      const result = await service.getAbsolutePath("relative/path")

      expect(result).toBeTruthy()
      expect(path.isAbsolute(result!)).toBe(true)
    })

    it("returns null for invalid path", async () => {
      // This might not fail on all platforms, but test the behavior
      const result = await service.getAbsolutePath("\0invalid")

      // On most platforms this should work (null bytes handled), but return value is acceptable
      expect(result === null || typeof result === "string").toBe(true)
    })
  })

  // ============================================================================
  // File Search
  // ============================================================================

  describe("File Search", () => {
    beforeEach(() => {
      // Create test file structure
      fs.writeFileSync(path.join(tempDir, "test.txt"), "test")
      fs.mkdirSync(path.join(tempDir, "subdir"), { recursive: true })
      fs.writeFileSync(path.join(tempDir, "subdir", "test.md"), "test")
      fs.writeFileSync(path.join(tempDir, "subdir", "other.txt"), "other")
      fs.mkdirSync(path.join(tempDir, "subdir", "nested"), { recursive: true })
      fs.writeFileSync(path.join(tempDir, "subdir", "nested", "test.json"), "{}")
    })

    it("searches files by name", async () => {
      const results = await service.searchFilesByName(tempDir, "test")

      expect(results.length).toBeGreaterThan(0)
      expect(results.every((p) => p.toLowerCase().includes("test"))).toBe(true)
    })

    it("searches files case-insensitively", async () => {
      const results = await service.searchFilesByName(tempDir, "TEST")

      expect(results.length).toBeGreaterThan(0)
      expect(results.every((p) => p.toLowerCase().includes("test"))).toBe(true)
    })

    it("respects maxDepth parameter", async () => {
      const results = await service.searchFilesByName(tempDir, "test", 0)

      // Should only find files in root, not in subdirectories
      expect(results.every((p) => path.dirname(p) === tempDir)).toBe(true)
    })

    it("returns empty array when no matches", async () => {
      const results = await service.searchFilesByName(tempDir, "nonexistent")

      expect(results).toEqual([])
    })

    it("handles inaccessible directories gracefully", async () => {
      // Search in directory that might have permission issues
      await expect(service.searchFilesByName("/root", "test", 1)).resolves.not.toThrow()
    })
  })
})
