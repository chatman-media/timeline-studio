import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  formatDuration,
  formatFileSize,
  getMediaFiles,
  getMediaMetadata,
  selectMediaDirectory,
  selectMediaFile,
} from "@timeline-studio/domains/media-management/services/media-api"

// Mock media service
const mockMediaService = {
  getMetadata: vi.fn(),
  getMediaFiles: vi.fn(),
}

// Мокаем container
vi.mock("@timeline-studio/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

describe("Media Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaService.getMetadata.mockReset()
    mockMediaService.getMediaFiles.mockReset()
  })

  describe("formatFileSize", () => {
    it("должен форматировать размер файла в байтах", () => {
      expect(formatFileSize(1024)).toBe("1.00 KB")
      expect(formatFileSize(1048576)).toBe("1.00 MB")
      expect(formatFileSize(1073741824)).toBe("1.00 GB")
      expect(formatFileSize(500)).toBe("500.00 B")
    })

    it('должен возвращать "Неизвестно" для undefined', () => {
      expect(formatFileSize(undefined)).toBe("Неизвестно")
    })

    it("должен обрабатывать нулевой размер", () => {
      expect(formatFileSize(0)).toBe("0.00 B")
    })
  })

  describe("formatDuration", () => {
    it("должен форматировать длительность в секундах", () => {
      expect(formatDuration(90)).toBe("1:30")
      expect(formatDuration(3661)).toBe("1:01:01")
      expect(formatDuration(30)).toBe("0:30")
    })

    it('должен возвращать "Неизвестно" для undefined', () => {
      expect(formatDuration(undefined)).toBe("Неизвестно")
    })

    it("должен обрабатывать нулевую длительность", () => {
      expect(formatDuration(0)).toBe("0:00")
    })
  })

  describe("getMediaMetadata", () => {
    it("должен вызывать getMedia().getMetadata() с правильными параметрами", async () => {
      const mockMetadata = { type: "Video", duration: 120 }
      mockMediaService.getMetadata.mockResolvedValue(mockMetadata)

      const result = await getMediaMetadata("/path/to/video.mp4")

      expect(mockMediaService.getMetadata).toHaveBeenCalledWith("/path/to/video.mp4")
      expect(result).toEqual(mockMetadata)
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("File not found")
      mockMediaService.getMetadata.mockRejectedValue(error)

      await expect(getMediaMetadata("/invalid/path")).rejects.toThrow("File not found")
    })
  })

  describe("getMediaFiles", () => {
    it("должен возвращать список медиафайлов", async () => {
      const mockFiles = ["/path/video1.mp4", "/path/video2.avi"]
      mockMediaService.getMediaFiles.mockResolvedValue(mockFiles)

      const result = await getMediaFiles("/path/to/directory")

      expect(mockMediaService.getMediaFiles).toHaveBeenCalledWith("/path/to/directory")
      expect(result).toEqual(mockFiles)
    })
  })

  describe("selectMediaFile", () => {
    it("должен возвращать массив выбранных файлов", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFiles = ["/path/video1.mp4", "/path/video2.mp4"]
      vi.mocked(open).mockResolvedValue(mockFiles)

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
      expect(result).toEqual(mockFiles)
    })

    it("должен возвращать null если выбор отменен", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const result = await selectMediaFile()

      expect(result).toBeNull()
    })

    it("должен обрабатывать одиночный файл как массив", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/path/single-file.mp4")

      const result = await selectMediaFile()

      expect(result).toEqual(["/path/single-file.mp4"])
    })
  })

  describe("selectMediaDirectory", () => {
    it("должен возвращать выбранную директорию", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/path/to/directory")

      const result = await selectMediaDirectory()

      expect(open).toHaveBeenCalledWith({
        directory: true,
        multiple: false,
      })
      expect(result).toBe("/path/to/directory")
    })

    it("должен возвращать null если выбор отменен", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const result = await selectMediaDirectory()

      expect(result).toBeNull()
    })
  })
})
