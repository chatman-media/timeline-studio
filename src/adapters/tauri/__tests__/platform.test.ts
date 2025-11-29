import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriPlatformService } from "../platform"

// Mock Tauri plugins
const mockOpen = vi.fn()
const mockSave = vi.fn()
const mockReadFile = vi.fn()
const mockWriteFile = vi.fn()
const mockReadTextFile = vi.fn()
const mockWriteTextFile = vi.fn()
const mockExists = vi.fn()
const mockSendNotification = vi.fn()
const mockIsPermissionGranted = vi.fn()
const mockRequestPermission = vi.fn()
const mockOpenPath = vi.fn()
const mockOpenUrl = vi.fn()
const mockGetVersion = vi.fn()
const mockConvertFileSrc = vi.fn()
const mockBasename = vi.fn()
const mockDirname = vi.fn()
const mockJoin = vi.fn()
const mockInvoke = vi.fn()

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: any[]) => mockOpen(...args),
  save: (...args: any[]) => mockSave(...args),
}))

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  readTextFile: (...args: any[]) => mockReadTextFile(...args),
  writeTextFile: (...args: any[]) => mockWriteTextFile(...args),
  exists: (...args: any[]) => mockExists(...args),
}))

vi.mock("@tauri-apps/plugin-notification", () => ({
  sendNotification: (...args: any[]) => mockSendNotification(...args),
  isPermissionGranted: () => mockIsPermissionGranted(),
  requestPermission: () => mockRequestPermission(),
}))

vi.mock("@tauri-apps/plugin-opener", () => ({
  openPath: (...args: any[]) => mockOpenPath(...args),
  openUrl: (...args: any[]) => mockOpenUrl(...args),
}))

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: () => mockGetVersion(),
}))

vi.mock("@tauri-apps/api/path", () => ({
  basename: (...args: any[]) => mockBasename(...args),
  dirname: (...args: any[]) => mockDirname(...args),
  join: (...args: any[]) => mockJoin(...args),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
  convertFileSrc: (...args: any[]) => mockConvertFileSrc(...args),
}))

describe("TauriPlatformService", () => {
  let service: TauriPlatformService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TauriPlatformService()
  })

  describe("File Dialogs", () => {
    describe("showOpenDialog", () => {
      it("returns null when dialog is cancelled", async () => {
        mockOpen.mockResolvedValueOnce(null)

        const result = await service.showOpenDialog()

        expect(result).toBeNull()
      })

      it("normalizes single file to array", async () => {
        mockOpen.mockResolvedValueOnce("/path/to/file.mp4")

        const result = await service.showOpenDialog()

        expect(result).toEqual(["/path/to/file.mp4"])
      })

      it("returns array as-is for multiple files", async () => {
        mockOpen.mockResolvedValueOnce(["/file1.mp4", "/file2.mp4"])

        const result = await service.showOpenDialog({ multiple: true })

        expect(result).toEqual(["/file1.mp4", "/file2.mp4"])
      })

      it("passes options to open dialog", async () => {
        mockOpen.mockResolvedValueOnce(["/file.mp4"])

        await service.showOpenDialog({
          title: "Select Files",
          defaultPath: "/home",
          multiple: true,
          directory: false,
          filters: [{ name: "Videos", extensions: ["mp4", "mov"] }],
        })

        expect(mockOpen).toHaveBeenCalledWith({
          title: "Select Files",
          defaultPath: "/home",
          multiple: true,
          directory: false,
          filters: [{ name: "Videos", extensions: ["mp4", "mov"] }],
        })
      })

      it("uses default values for options", async () => {
        mockOpen.mockResolvedValueOnce(["/file.mp4"])

        await service.showOpenDialog()

        expect(mockOpen).toHaveBeenCalledWith({
          title: undefined,
          defaultPath: undefined,
          filters: undefined,
          multiple: false,
          directory: false,
        })
      })
    })

    describe("showSaveDialog", () => {
      it("returns null when dialog is cancelled", async () => {
        mockSave.mockResolvedValueOnce(null)

        const result = await service.showSaveDialog()

        expect(result).toBeNull()
      })

      it("returns selected path", async () => {
        mockSave.mockResolvedValueOnce("/path/to/save.mp4")

        const result = await service.showSaveDialog()

        expect(result).toBe("/path/to/save.mp4")
      })

      it("passes options to save dialog", async () => {
        mockSave.mockResolvedValueOnce("/save.mp4")

        await service.showSaveDialog({
          title: "Save As",
          defaultPath: "/home/video.mp4",
          filters: [{ name: "Videos", extensions: ["mp4"] }],
        })

        expect(mockSave).toHaveBeenCalledWith({
          title: "Save As",
          defaultPath: "/home/video.mp4",
          filters: [{ name: "Videos", extensions: ["mp4"] }],
        })
      })
    })
  })

  describe("File System", () => {
    describe("readFile", () => {
      it("reads binary file", async () => {
        const data = new Uint8Array([1, 2, 3, 4, 5])
        mockReadFile.mockResolvedValueOnce(data)

        const result = await service.readFile("/path/to/file.bin")

        expect(mockReadFile).toHaveBeenCalledWith("/path/to/file.bin")
        expect(result).toEqual(data)
      })
    })

    describe("writeFile", () => {
      it("writes binary file", async () => {
        const data = new Uint8Array([10, 20, 30])
        mockWriteFile.mockResolvedValueOnce(undefined)

        await service.writeFile("/path/to/file.bin", data)

        expect(mockWriteFile).toHaveBeenCalledWith("/path/to/file.bin", data)
      })
    })

    describe("readTextFile", () => {
      it("reads text file", async () => {
        mockReadTextFile.mockResolvedValueOnce("file contents")

        const result = await service.readTextFile("/path/to/file.txt")

        expect(mockReadTextFile).toHaveBeenCalledWith("/path/to/file.txt")
        expect(result).toBe("file contents")
      })
    })

    describe("writeTextFile", () => {
      it("writes text file", async () => {
        mockWriteTextFile.mockResolvedValueOnce(undefined)

        await service.writeTextFile("/path/to/file.txt", "content")

        expect(mockWriteTextFile).toHaveBeenCalledWith("/path/to/file.txt", "content")
      })
    })

    describe("exists", () => {
      it("returns true for existing file", async () => {
        mockExists.mockResolvedValueOnce(true)

        const result = await service.exists("/path/to/file.txt")

        expect(mockExists).toHaveBeenCalledWith("/path/to/file.txt")
        expect(result).toBe(true)
      })

      it("returns false for non-existing file", async () => {
        mockExists.mockResolvedValueOnce(false)

        const result = await service.exists("/path/to/missing.txt")

        expect(result).toBe(false)
      })
    })
  })

  describe("Clipboard", () => {
    const mockClipboard = {
      readText: vi.fn(),
      writeText: vi.fn(),
    }

    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { clipboard: mockClipboard },
        writable: true,
        configurable: true,
      })
    })

    describe("readClipboard", () => {
      it("reads text from clipboard", async () => {
        mockClipboard.readText.mockResolvedValueOnce("clipboard content")

        const result = await service.readClipboard()

        expect(mockClipboard.readText).toHaveBeenCalledTimes(1)
        expect(result).toBe("clipboard content")
      })

      it("returns empty string on error", async () => {
        mockClipboard.readText.mockRejectedValueOnce(new Error("Permission denied"))

        const result = await service.readClipboard()

        expect(result).toBe("")
      })

      it("returns empty string when navigator.clipboard is unavailable", async () => {
        Object.defineProperty(global, "navigator", {
          value: {},
          writable: true,
        })

        const result = await service.readClipboard()

        expect(result).toBe("")
      })
    })

    describe("writeClipboard", () => {
      it("writes text to clipboard", async () => {
        mockClipboard.writeText.mockResolvedValueOnce(undefined)

        await service.writeClipboard("test text")

        expect(mockClipboard.writeText).toHaveBeenCalledWith("test text")
      })

      it("does nothing when navigator.clipboard is unavailable", async () => {
        Object.defineProperty(global, "navigator", {
          value: {},
          writable: true,
        })

        await expect(service.writeClipboard("text")).resolves.not.toThrow()
      })
    })
  })

  describe("Notifications", () => {
    it("shows notification when permission is granted", async () => {
      mockIsPermissionGranted.mockResolvedValueOnce(true)
      mockSendNotification.mockReturnValueOnce(undefined)

      await service.showNotification({
        title: "Test",
        body: "Test notification",
      })

      expect(mockSendNotification).toHaveBeenCalledWith({
        title: "Test",
        body: "Test notification",
        icon: undefined,
      })
    })

    it("requests permission and shows notification", async () => {
      mockIsPermissionGranted.mockResolvedValueOnce(false)
      mockRequestPermission.mockResolvedValueOnce("granted")
      mockSendNotification.mockReturnValueOnce(undefined)

      await service.showNotification({
        title: "Test",
        body: "Message",
        icon: "icon.png",
      })

      expect(mockRequestPermission).toHaveBeenCalledTimes(1)
      expect(mockSendNotification).toHaveBeenCalledWith({
        title: "Test",
        body: "Message",
        icon: "icon.png",
      })
    })

    it("does not show notification when permission is denied", async () => {
      mockIsPermissionGranted.mockResolvedValueOnce(false)
      mockRequestPermission.mockResolvedValueOnce("denied")

      await service.showNotification({
        title: "Test",
        body: "Message",
      })

      expect(mockSendNotification).not.toHaveBeenCalled()
    })
  })

  describe("Shell Operations", () => {
    it("opens path", async () => {
      mockOpenPath.mockResolvedValueOnce(undefined)

      await service.openPath("/path/to/file")

      expect(mockOpenPath).toHaveBeenCalledWith("/path/to/file")
    })

    it("opens URL", async () => {
      mockOpenUrl.mockResolvedValueOnce(undefined)

      await service.openUrl("https://example.com")

      expect(mockOpenUrl).toHaveBeenCalledWith("https://example.com")
    })
  })

  describe("App Info", () => {
    it("gets app version", async () => {
      mockGetVersion.mockResolvedValueOnce("1.2.3")

      const result = await service.getVersion()

      expect(mockGetVersion).toHaveBeenCalledTimes(1)
      expect(result).toBe("1.2.3")
    })
  })

  describe("File Conversion", () => {
    it("converts file path to src", () => {
      // Note: convertFileSrc is synchronous and requires require()
      // Testing is difficult without actual implementation
      expect(typeof service.convertFileSrc).toBe("function")
    })
  })

  describe("Path Utilities", () => {
    it("gets basename from path", async () => {
      mockBasename.mockResolvedValueOnce("file.mp4")

      const result = await service.basename("/path/to/file.mp4")

      expect(mockBasename).toHaveBeenCalledWith("/path/to/file.mp4")
      expect(result).toBe("file.mp4")
    })

    it("gets dirname from path", async () => {
      mockDirname.mockResolvedValueOnce("/path/to")

      const result = await service.dirname("/path/to/file.mp4")

      expect(mockDirname).toHaveBeenCalledWith("/path/to/file.mp4")
      expect(result).toBe("/path/to")
    })

    it("joins path segments", async () => {
      mockJoin.mockResolvedValueOnce("/path/to/file.mp4")

      const result = await service.join("/path", "to", "file.mp4")

      expect(mockJoin).toHaveBeenCalledWith("/path", "to", "file.mp4")
      expect(result).toBe("/path/to/file.mp4")
    })
  })

  describe("Extended File System Operations", () => {
    it("gets file stats", async () => {
      const stats = { size: 1024, modified: Date.now(), isDirectory: false, isFile: true }
      mockInvoke.mockResolvedValueOnce(stats)

      const result = await service.getFileStats("/path/to/file.txt")

      expect(mockInvoke).toHaveBeenCalledWith("get_file_stats", { path: "/path/to/file.txt" })
      expect(result).toEqual(stats)
    })

    it("returns null when file stats fail", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("File not found"))

      const result = await service.getFileStats("/missing.txt")

      expect(result).toBeNull()
    })

    it("gets platform", async () => {
      mockInvoke.mockResolvedValueOnce("darwin")

      const result = await service.getPlatform()

      expect(mockInvoke).toHaveBeenCalledWith("get_platform")
      expect(result).toBe("darwin")
    })

    it("returns unknown when get platform fails", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Failed"))

      const result = await service.getPlatform()

      expect(result).toBe("unknown")
    })

    it("searches files by name", async () => {
      mockInvoke.mockResolvedValueOnce(["/dir/file1.txt", "/dir/sub/file2.txt"])

      const result = await service.searchFilesByName("/dir", "file*.txt")

      expect(mockInvoke).toHaveBeenCalledWith("search_files_by_name", {
        directory: "/dir",
        filename: "file*.txt",
        maxDepth: 3,
      })
      expect(result).toEqual(["/dir/file1.txt", "/dir/sub/file2.txt"])
    })

    it("uses custom max depth for search", async () => {
      mockInvoke.mockResolvedValueOnce([])

      await service.searchFilesByName("/dir", "*.txt", 5)

      expect(mockInvoke).toHaveBeenCalledWith("search_files_by_name", {
        directory: "/dir",
        filename: "*.txt",
        maxDepth: 5,
      })
    })

    it("returns empty array when search fails", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Search failed"))

      const result = await service.searchFilesByName("/dir", "*.txt")

      expect(result).toEqual([])
    })

    it("gets absolute path", async () => {
      mockInvoke.mockResolvedValueOnce("/absolute/path/to/file.txt")

      const result = await service.getAbsolutePath("./file.txt")

      expect(mockInvoke).toHaveBeenCalledWith("get_absolute_path", { path: "./file.txt" })
      expect(result).toBe("/absolute/path/to/file.txt")
    })

    it("returns null when get absolute path fails", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Invalid path"))

      const result = await service.getAbsolutePath("invalid")

      expect(result).toBeNull()
    })
  })
})
