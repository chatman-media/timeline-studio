import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  formatDuration,
  formatFileSize,
  getMediaFiles,
  getMediaMetadata,
  selectAudioFile,
  selectMediaDirectory,
  selectMediaFile,
} from "@timeline-studio/domains/media-management"

// Mock media service
const mockMediaService = vi.hoisted(() => ({
  getMetadata: vi.fn(),
  getMediaFiles: vi.fn(),
}))

// Mock container
vi.mock("@timeline-studio/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Мокаем логгер
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    traceSync: vi.fn(),
    debugSync: vi.fn(),
    infoSync: vi.fn(),
    warnSync: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

describe("media-api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getMediaMetadata", () => {
    it("should get media metadata successfully", async () => {
      const mockMetadata = {
        type: "Video",
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: "h264",
        bitrate: 5000000,
        size: 75000000,
        creation_time: "2023-01-01T00:00:00Z",
      }

      mockMediaService.getMetadata.mockResolvedValue(mockMetadata)

      const result = await getMediaMetadata("/path/to/video.mp4")

      expect(mockMediaService.getMetadata).toHaveBeenCalledWith("/path/to/video.mp4")
      expect(result).toEqual(mockMetadata)
    })

    it("should handle errors when getting metadata", async () => {
      const { createLogger } = await import("@/lib/tauri-logger")
      const error = new Error("Failed to read metadata")
      mockMediaService.getMetadata.mockRejectedValue(error)

      await expect(getMediaMetadata("/path/to/invalid.mp4")).rejects.toThrow("Failed to read metadata")

      // Проверяем, что логгер был вызван
      const loggerInstance = vi.mocked(createLogger).mock.results[0]?.value
      if (loggerInstance) {
        expect(loggerInstance.errorSync).toHaveBeenCalled()
      }
    })
  })

  describe("getMediaFiles", () => {
    it("should get media files from directory successfully", async () => {
      const mockFiles = ["/dir/video1.mp4", "/dir/video2.avi", "/dir/audio1.mp3", "/dir/image1.jpg"]

      mockMediaService.getMediaFiles.mockResolvedValue(mockFiles)

      const result = await getMediaFiles("/dir")

      expect(mockMediaService.getMediaFiles).toHaveBeenCalledWith("/dir")
      expect(result).toEqual(mockFiles)
    })

    it("should handle errors when getting media files", async () => {
      const { createLogger } = await import("@/lib/tauri-logger")
      const error = new Error("Directory not found")
      mockMediaService.getMediaFiles.mockRejectedValue(error)

      await expect(getMediaFiles("/invalid/dir")).rejects.toThrow("Directory not found")

      // Проверяем, что логгер был вызван
      const loggerInstance = vi.mocked(createLogger).mock.results[0]?.value
      if (loggerInstance) {
        expect(loggerInstance.errorSync).toHaveBeenCalled()
      }
    })
  })

  describe("selectMediaFile", () => {
    it("should handle single file selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/path/to/video.mp4")

      const result = await selectMediaFile()

      expect(open).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Media",
            extensions: [
              "mp4",
              "avi",
              "mkv",
              "mov",
              "webm",
              "mp3",
              "wav",
              "ogg",
              "flac",
              "jpg",
              "jpeg",
              "png",
              "gif",
              "webp",
            ],
          },
        ],
      })
      expect(result).toEqual(["/path/to/video.mp4"])
    })

    it("should handle multiple file selection", async () => {
      const mockFiles = ["/path/to/video1.mp4", "/path/to/video2.avi"]
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(mockFiles)

      const result = await selectMediaFile()

      expect(result).toEqual(mockFiles)
    })

    it("should return null when selection is cancelled", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const result = await selectMediaFile()

      expect(result).toBeNull()
    })

    it("should handle errors during file selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { createLogger } = await import("@/lib/tauri-logger")
      const error = new Error("Permission denied")
      vi.mocked(open).mockRejectedValue(error)

      await expect(selectMediaFile()).rejects.toThrow("Permission denied")

      // Проверяем, что логгер был вызван
      const loggerInstance = vi.mocked(createLogger).mock.results[0]?.value
      if (loggerInstance) {
        expect(loggerInstance.errorSync).toHaveBeenCalled()
      }
    })
  })

  describe("selectAudioFile", () => {
    it("should handle single audio file selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/path/to/audio.mp3")

      const result = await selectAudioFile()

      expect(open).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Audio",
            extensions: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"],
          },
        ],
      })
      expect(result).toEqual(["/path/to/audio.mp3"])
    })

    it("should handle multiple audio file selection", async () => {
      const mockFiles = ["/path/to/audio1.mp3", "/path/to/audio2.wav"]
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(mockFiles)

      const result = await selectAudioFile()

      expect(result).toEqual(mockFiles)
    })

    it("should return null when audio selection is cancelled", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const result = await selectAudioFile()

      expect(result).toBeNull()
    })

    it("should handle errors during audio file selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { createLogger } = await import("@/lib/tauri-logger")
      const error = new Error("No audio files found")
      vi.mocked(open).mockRejectedValue(error)

      await expect(selectAudioFile()).rejects.toThrow("No audio files found")

      // Проверяем, что логгер был вызван
      const loggerInstance = vi.mocked(createLogger).mock.results[0]?.value
      if (loggerInstance) {
        expect(loggerInstance.errorSync).toHaveBeenCalled()
      }
    })
  })

  describe("selectMediaDirectory", () => {
    it("should handle directory selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/path/to/media/dir")

      const result = await selectMediaDirectory()

      expect(open).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
      })
      expect(result).toBe("/path/to/media/dir")
    })

    it("should return null when directory selection is cancelled", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const result = await selectMediaDirectory()

      expect(result).toBeNull()
    })

    it("should handle errors during directory selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { createLogger } = await import("@/lib/tauri-logger")
      const error = new Error("Access denied")
      vi.mocked(open).mockRejectedValue(error)

      await expect(selectMediaDirectory()).rejects.toThrow("Access denied")

      // Проверяем, что логгер был вызван
      const loggerInstance = vi.mocked(createLogger).mock.results[0]?.value
      if (loggerInstance) {
        expect(loggerInstance.errorSync).toHaveBeenCalled()
      }
    })
  })

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0.00 B")
      expect(formatFileSize(512)).toBe("512.00 B")
      expect(formatFileSize(1023)).toBe("1023.00 B")
    })

    it("should format kilobytes correctly", () => {
      expect(formatFileSize(1024)).toBe("1.00 KB")
      expect(formatFileSize(1536)).toBe("1.50 KB")
      expect(formatFileSize(1048575)).toBe("1024.00 KB")
    })

    it("should format megabytes correctly", () => {
      expect(formatFileSize(1048576)).toBe("1.00 MB")
      expect(formatFileSize(1572864)).toBe("1.50 MB")
      expect(formatFileSize(1073741823)).toBe("1024.00 MB")
    })

    it("should format gigabytes correctly", () => {
      expect(formatFileSize(1073741824)).toBe("1.00 GB")
      expect(formatFileSize(1610612736)).toBe("1.50 GB")
      expect(formatFileSize(1099511627775)).toBe("1024.00 GB")
    })

    it("should format terabytes correctly", () => {
      expect(formatFileSize(1099511627776)).toBe("1.00 TB")
      expect(formatFileSize(1649267441664)).toBe("1.50 TB")
    })

    it("should handle undefined size", () => {
      expect(formatFileSize(undefined)).toBe("Неизвестно")
    })
  })

  describe("formatDuration", () => {
    it("should format seconds correctly", () => {
      expect(formatDuration(0)).toBe("0:00")
      expect(formatDuration(5)).toBe("0:05")
      expect(formatDuration(30)).toBe("0:30")
      expect(formatDuration(59)).toBe("0:59")
    })

    it("should format minutes correctly", () => {
      expect(formatDuration(60)).toBe("1:00")
      expect(formatDuration(90)).toBe("1:30")
      expect(formatDuration(125)).toBe("2:05")
      expect(formatDuration(599)).toBe("9:59")
    })

    it("should format minutes and seconds with padding", () => {
      expect(formatDuration(61)).toBe("1:01")
      expect(formatDuration(65)).toBe("1:05")
      expect(formatDuration(605)).toBe("10:05")
    })

    it("should format hours correctly", () => {
      expect(formatDuration(3600)).toBe("1:00:00")
      expect(formatDuration(3661)).toBe("1:01:01")
      expect(formatDuration(3665)).toBe("1:01:05")
      expect(formatDuration(7200)).toBe("2:00:00")
      expect(formatDuration(7265)).toBe("2:01:05")
    })

    it("should format hours with proper padding", () => {
      expect(formatDuration(36005)).toBe("10:00:05")
      expect(formatDuration(36065)).toBe("10:01:05")
      expect(formatDuration(39605)).toBe("11:00:05")
    })

    it("should handle undefined duration", () => {
      expect(formatDuration(undefined)).toBe("Неизвестно")
    })

    it("should handle fractional seconds", () => {
      expect(formatDuration(65.5)).toBe("1:05")
      expect(formatDuration(3665.7)).toBe("1:01:05")
    })
  })
})
