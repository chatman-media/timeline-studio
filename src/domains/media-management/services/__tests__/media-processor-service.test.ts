/**
 * MediaProcessorService Tests
 *
 * Тесты для MediaProcessorService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaProcessorService } from "../media-processor-service"

// Mock media service
const mockMediaService = {
  scanFolder: vi.fn(),
  scanFolderWithThumbnails: vi.fn(),
  processFiles: vi.fn(),
  processFilesWithThumbnails: vi.fn(),
  processFile: vi.fn(),
  cancelProcessing: vi.fn(),
}

vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

describe("MediaProcessorService", () => {
  let service: MediaProcessorService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MediaProcessorService()
  })

  describe("scanFolder", () => {
    it("should scan folder and return media files", async () => {
      const mockFiles = [
        { id: "file-1", path: "/test/video1.mp4", name: "video1.mp4", type: "Video" },
        { id: "file-2", path: "/test/video2.mp4", name: "video2.mp4", type: "Video" },
      ]
      mockMediaService.scanFolder.mockResolvedValue(mockFiles)

      const result = await service.scanFolder("/test")

      expect(result).toEqual(mockFiles)
      expect(mockMediaService.scanFolder).toHaveBeenCalledWith("/test")
    })

    it("should throw error when scan fails", async () => {
      mockMediaService.scanFolder.mockRejectedValue(new Error("Scan failed"))

      await expect(service.scanFolder("/test")).rejects.toThrow("Scan failed")
    })
  })

  describe("scanFolderWithThumbnails", () => {
    it("should scan folder with thumbnails", async () => {
      const mockFiles = [
        { id: "file-1", path: "/test/video1.mp4", thumbnailPath: "/cache/thumb1.jpg" },
      ]
      mockMediaService.scanFolderWithThumbnails.mockResolvedValue(mockFiles)

      const result = await service.scanFolderWithThumbnails("/test", 320, 180)

      expect(result).toEqual(mockFiles)
      expect(mockMediaService.scanFolderWithThumbnails).toHaveBeenCalledWith("/test", 320, 180)
    })

    it("should use default thumbnail dimensions", async () => {
      mockMediaService.scanFolderWithThumbnails.mockResolvedValue([])

      await service.scanFolderWithThumbnails("/test")

      expect(mockMediaService.scanFolderWithThumbnails).toHaveBeenCalledWith("/test", 320, 180)
    })

    it("should throw error when scan with thumbnails fails", async () => {
      mockMediaService.scanFolderWithThumbnails.mockRejectedValue(new Error("Scan failed"))

      await expect(service.scanFolderWithThumbnails("/test")).rejects.toThrow("Scan failed")
    })
  })

  describe("processFiles", () => {
    it("should process multiple files", async () => {
      const filePaths = ["/test/video1.mp4", "/test/video2.mp4"]
      const mockProcessed = [
        { id: "file-1", path: "/test/video1.mp4", metadata: {} },
        { id: "file-2", path: "/test/video2.mp4", metadata: {} },
      ]
      mockMediaService.processFiles.mockResolvedValue(mockProcessed)

      const result = await service.processFiles(filePaths)

      expect(result).toEqual(mockProcessed)
      expect(mockMediaService.processFiles).toHaveBeenCalledWith(filePaths)
    })

    it("should throw error when processing fails", async () => {
      mockMediaService.processFiles.mockRejectedValue(new Error("Processing failed"))

      await expect(service.processFiles(["/test/video.mp4"])).rejects.toThrow("Processing failed")
    })
  })

  describe("processFilesWithThumbnails", () => {
    it("should process files with thumbnails", async () => {
      const filePaths = ["/test/video1.mp4"]
      const mockProcessed = [{ id: "file-1", path: "/test/video1.mp4", thumbnailPath: "/cache/thumb.jpg" }]
      mockMediaService.processFilesWithThumbnails.mockResolvedValue(mockProcessed)

      const result = await service.processFilesWithThumbnails(filePaths, 640, 360)

      expect(result).toEqual(mockProcessed)
      expect(mockMediaService.processFilesWithThumbnails).toHaveBeenCalledWith(filePaths, 640, 360)
    })

    it("should use default thumbnail dimensions", async () => {
      mockMediaService.processFilesWithThumbnails.mockResolvedValue([])

      await service.processFilesWithThumbnails(["/test/video.mp4"])

      expect(mockMediaService.processFilesWithThumbnails).toHaveBeenCalledWith(["/test/video.mp4"], 320, 180)
    })

    it("should throw error when processing with thumbnails fails", async () => {
      mockMediaService.processFilesWithThumbnails.mockRejectedValue(new Error("Thumbnail generation failed"))

      await expect(service.processFilesWithThumbnails(["/test/video.mp4"])).rejects.toThrow(
        "Thumbnail generation failed",
      )
    })
  })

  describe("cancelProcessing", () => {
    it("should cancel processing successfully", async () => {
      mockMediaService.cancelProcessing.mockResolvedValue(undefined)

      await service.cancelProcessing()

      expect(mockMediaService.cancelProcessing).toHaveBeenCalledWith("")
    })

    it("should throw error when cancel fails", async () => {
      mockMediaService.cancelProcessing.mockRejectedValue(new Error("Cancel failed"))

      await expect(service.cancelProcessing()).rejects.toThrow("Cancel failed")
    })
  })

  describe("processFileSimple", () => {
    it("should process file in simple mode without thumbnail", async () => {
      const mockResult = { id: "file-1", path: "/test/video.mp4", metadata: {} }
      mockMediaService.processFile.mockResolvedValue(mockResult)

      const result = await service.processFileSimple("/test/video.mp4", false)

      expect(result).toEqual(mockResult)
      expect(mockMediaService.processFile).toHaveBeenCalledWith("/test/video.mp4", {
        generateThumbnail: false,
        extractAudio: false,
      })
    })

    it("should process file in simple mode with thumbnail", async () => {
      const mockResult = { id: "file-1", path: "/test/video.mp4", thumbnailPath: "/cache/thumb.jpg" }
      mockMediaService.processFile.mockResolvedValue(mockResult)

      const result = await service.processFileSimple("/test/video.mp4", true)

      expect(result).toEqual(mockResult)
      expect(mockMediaService.processFile).toHaveBeenCalledWith("/test/video.mp4", {
        generateThumbnail: true,
        extractAudio: false,
      })
    })

    it("should use false as default for generateThumbnail", async () => {
      mockMediaService.processFile.mockResolvedValue({})

      await service.processFileSimple("/test/video.mp4")

      expect(mockMediaService.processFile).toHaveBeenCalledWith("/test/video.mp4", {
        generateThumbnail: false,
        extractAudio: false,
      })
    })

    it("should throw error when simple processing fails", async () => {
      mockMediaService.processFile.mockRejectedValue(new Error("Simple processing failed"))

      await expect(service.processFileSimple("/test/video.mp4")).rejects.toThrow("Simple processing failed")
    })
  })
})
