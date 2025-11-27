import { beforeEach, describe, expect, it } from "vitest"
import { MockPlatformService } from "../platform"

describe("MockPlatformService", () => {
  let platform: MockPlatformService

  beforeEach(() => {
    platform = new MockPlatformService()
  })

  describe("File Dialogs", () => {
    it("showOpenDialog returns null by default", async () => {
      const result = await platform.showOpenDialog()
      expect(result).toBeNull()
    })

    it("showOpenDialog returns configured response", async () => {
      platform.setOpenDialogResponse(["/path/to/file.mp4", "/path/to/file2.mp4"])

      const result = await platform.showOpenDialog({ multiple: true })

      expect(result).toEqual(["/path/to/file.mp4", "/path/to/file2.mp4"])
    })

    it("showSaveDialog returns null by default", async () => {
      const result = await platform.showSaveDialog()
      expect(result).toBeNull()
    })

    it("showSaveDialog returns configured response", async () => {
      platform.setSaveDialogResponse("/path/to/save.mp4")

      const result = await platform.showSaveDialog()

      expect(result).toBe("/path/to/save.mp4")
    })
  })

  describe("File System", () => {
    it("readFile throws for non-existent file", async () => {
      await expect(platform.readFile("/non/existent")).rejects.toThrow("File not found")
    })

    it("writeFile and readFile work together", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      await platform.writeFile("/test/file.bin", data)

      const result = await platform.readFile("/test/file.bin")

      expect(result).toEqual(data)
    })

    it("writeTextFile and readTextFile work together", async () => {
      const content = "Hello, World!"
      await platform.writeTextFile("/test/file.txt", content)

      const result = await platform.readTextFile("/test/file.txt")

      expect(result).toBe(content)
    })

    it("exists returns false for non-existent file", async () => {
      const result = await platform.exists("/non/existent")
      expect(result).toBe(false)
    })

    it("exists returns true for existing file", async () => {
      await platform.writeTextFile("/test/file.txt", "content")

      const result = await platform.exists("/test/file.txt")

      expect(result).toBe(true)
    })

    it("setFile helper works", () => {
      platform.setFile("/test/file.txt", "test content")

      expect(platform.getFiles().has("/test/file.txt")).toBe(true)
    })

    it("setFile accepts Uint8Array", () => {
      const data = new Uint8Array([10, 20, 30])
      platform.setFile("/test/binary.bin", data)

      expect(platform.getFiles().has("/test/binary.bin")).toBe(true)
    })
  })

  describe("Clipboard", () => {
    it("readClipboard returns empty string by default", async () => {
      const result = await platform.readClipboard()
      expect(result).toBe("")
    })

    it("writeClipboard and readClipboard work together", async () => {
      await platform.writeClipboard("copied text")

      const result = await platform.readClipboard()

      expect(result).toBe("copied text")
    })

    it("getClipboard helper returns clipboard content", async () => {
      await platform.writeClipboard("test")

      expect(platform.getClipboard()).toBe("test")
    })
  })

  describe("Notifications", () => {
    it("showNotification stores notification", async () => {
      await platform.showNotification({
        title: "Test Title",
        body: "Test Body",
      })

      const notifications = platform.getNotifications()

      expect(notifications).toHaveLength(1)
      expect(notifications[0]).toEqual({
        title: "Test Title",
        body: "Test Body",
      })
    })

    it("stores multiple notifications", async () => {
      await platform.showNotification({ title: "First", body: "Body 1" })
      await platform.showNotification({ title: "Second", body: "Body 2" })

      expect(platform.getNotifications()).toHaveLength(2)
    })
  })

  describe("Shell Operations", () => {
    it("openPath does not throw", async () => {
      await expect(platform.openPath("/some/path")).resolves.not.toThrow()
    })

    it("openUrl does not throw", async () => {
      await expect(platform.openUrl("https://example.com")).resolves.not.toThrow()
    })
  })

  describe("App Info", () => {
    it("getVersion returns mock version", async () => {
      const version = await platform.getVersion()
      expect(version).toBe("1.0.0-mock")
    })
  })

  describe("File Conversion", () => {
    it("convertFileSrc returns file:// URL for paths", () => {
      const result = platform.convertFileSrc("/path/to/file.mp4")
      expect(result).toBe("file:///path/to/file.mp4")
    })

    it("convertFileSrc returns http URLs unchanged", () => {
      const result = platform.convertFileSrc("http://example.com/video.mp4")
      expect(result).toBe("http://example.com/video.mp4")
    })

    it("convertFileSrc returns https URLs unchanged", () => {
      const result = platform.convertFileSrc("https://example.com/video.mp4")
      expect(result).toBe("https://example.com/video.mp4")
    })

    it("convertFileSrc returns blob URLs unchanged", () => {
      const result = platform.convertFileSrc("blob:http://localhost/uuid")
      expect(result).toBe("blob:http://localhost/uuid")
    })
  })

  describe("Path Utilities", () => {
    describe("basename", () => {
      it("extracts filename from Unix path", async () => {
        const result = await platform.basename("/path/to/file.mp4")
        expect(result).toBe("file.mp4")
      })

      it("extracts filename from Windows path", async () => {
        const result = await platform.basename("C:\\Users\\test\\file.mp4")
        expect(result).toBe("file.mp4")
      })

      it("returns empty string for path ending with slash", async () => {
        const result = await platform.basename("/path/to/dir/")
        expect(result).toBe("")
      })

      it("returns filename for simple filename", async () => {
        const result = await platform.basename("file.mp4")
        expect(result).toBe("file.mp4")
      })
    })

    describe("dirname", () => {
      it("extracts directory from Unix path", async () => {
        const result = await platform.dirname("/path/to/file.mp4")
        expect(result).toBe("/path/to")
      })

      it("extracts directory from Windows path", async () => {
        const result = await platform.dirname("C:\\Users\\test\\file.mp4")
        expect(result).toBe("C:/Users/test")
      })

      it("returns / for root file", async () => {
        const result = await platform.dirname("/file.mp4")
        expect(result).toBe("/")
      })

      it("returns . for simple filename", async () => {
        const result = await platform.dirname("file.mp4")
        expect(result).toBe(".")
      })
    })

    describe("join", () => {
      it("joins path segments", async () => {
        const result = await platform.join("/path", "to", "file.mp4")
        expect(result).toBe("/path/to/file.mp4")
      })

      it("normalizes multiple slashes", async () => {
        const result = await platform.join("/path/", "/to/", "/file.mp4")
        expect(result).toBe("/path/to/file.mp4")
      })

      it("handles empty segments", async () => {
        const result = await platform.join("/path", "", "file.mp4")
        expect(result).toBe("/path/file.mp4")
      })

      it("joins single segment", async () => {
        const result = await platform.join("file.mp4")
        expect(result).toBe("file.mp4")
      })
    })
  })

  describe("Reset", () => {
    it("clears all state", async () => {
      // Set up some state
      platform.setOpenDialogResponse(["/file.mp4"])
      platform.setSaveDialogResponse("/save.mp4")
      await platform.writeClipboard("test")
      await platform.showNotification({ title: "Test", body: "Body" })
      platform.setFile("/test.txt", "content")

      // Reset
      platform.reset()

      // Verify everything is cleared
      expect(await platform.showOpenDialog()).toBeNull()
      expect(await platform.showSaveDialog()).toBeNull()
      expect(platform.getClipboard()).toBe("")
      expect(platform.getNotifications()).toHaveLength(0)
      expect(platform.getFiles().size).toBe(0)
    })
  })
})
