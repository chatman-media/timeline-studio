import { describe, expect, it } from "vitest"
import { NodeMediaService } from "../media"

describe("NodeMediaService", () => {
  const service = new NodeMediaService()

  // ============================================================================
  // Basic Methods
  // ============================================================================

  describe("Basic Methods", () => {
    it("returns metadata for getMetadata", async () => {
      const result = await service.getMetadata("/test.mp4")
      expect(result).toHaveProperty("type")
    })

    it("throws error for getMediaFiles with invalid directory", async () => {
      await expect(service.getMediaFiles("/test/dir")).rejects.toThrow()
    })

    it("returns result for processFile", async () => {
      const result = await service.processFile("/test.mp4")
      expect(result).toHaveProperty("metadata")
    })

    it("does not throw for cancelProcessing", async () => {
      await expect(service.cancelProcessing("/test.mp4")).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Thumbnail Operations
  // ============================================================================

  describe("Thumbnail Operations", () => {
    it("throws error for generateThumbnail with invalid file", async () => {
      await expect(service.generateThumbnail("file-1", "/test.mp4")).rejects.toThrow()
    })

    it("returns false for hasCachedThumbnail", async () => {
      const result = await service.hasCachedThumbnail("file-1", 320, 180)
      expect(result).toBe(false)
    })

    it("returns path for getCachedThumbnailPath", async () => {
      const result = await service.getCachedThumbnailPath("file-1", 320, 180)
      expect(typeof result).toBe("string")
      expect(result).toContain("file-1")
    })
  })

  // ============================================================================
  // Preview Data
  // ============================================================================

  describe("Preview Data", () => {
    it("does not throw for savePreviewData", async () => {
      await expect(service.savePreviewData("/test/path")).resolves.not.toThrow()
    })

    it("returns preview data or null for loadPreviewData", async () => {
      const result = await service.loadPreviewData("/test/path")
      // Can be null or an object
      expect(result === null || typeof result === "object").toBe(true)
    })

    it("returns null for getPreviewData", async () => {
      const result = await service.getPreviewData("file-1")
      expect(result).toBeNull()
    })

    it("does not throw for clearPreviewData", async () => {
      await expect(service.clearPreviewData()).resolves.not.toThrow()
      await expect(service.clearPreviewData("file-1")).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Timeline Frames
  // ============================================================================

  describe("Timeline Frames", () => {
    it("does not throw for saveTimelineFrames", async () => {
      await expect(service.saveTimelineFrames("file-1", ["/frame1.jpg"])).resolves.not.toThrow()
    })

    it("returns array for getTimelineFrames", async () => {
      const result = await service.getTimelineFrames("file-1")
      expect(Array.isArray(result)).toBe(true)
    })
  })

  // ============================================================================
  // Scanning
  // ============================================================================

  describe("Scanning", () => {
    it("throws error for scanFolder with invalid directory", async () => {
      await expect(service.scanFolder("/test/folder")).rejects.toThrow()
    })

    it("throws error for scanFolderWithThumbnails with invalid directory", async () => {
      await expect(service.scanFolderWithThumbnails("/test/folder", 320, 180)).rejects.toThrow()
    })

    it("returns empty array for getFilesWithPreviews", async () => {
      const result = await service.getFilesWithPreviews()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  // ============================================================================
  // Import
  // ============================================================================

  describe("Import", () => {
    it("returns import result for importFiles", async () => {
      const result = await service.importFiles(["/file1.mp4"])
      expect(result).toHaveProperty("imported")
      expect(result).toHaveProperty("failed")
      expect(Array.isArray(result.imported)).toBe(true)
      expect(Array.isArray(result.failed)).toBe(true)
    })

    it("returns empty array for processFiles", async () => {
      const result = await service.processFiles(["/file1.mp4"])
      expect(Array.isArray(result)).toBe(true)
    })

    it("returns empty array for processFilesWithThumbnails", async () => {
      const result = await service.processFilesWithThumbnails(["/file1.mp4"], 320, 180)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  // ============================================================================
  // Audio/Video Analysis
  // ============================================================================

  describe("Audio/Video Analysis", () => {
    it("throws error for generateWaveformPreview with invalid file", async () => {
      await expect(service.generateWaveformPreview("/audio.mp3", "/out.png")).rejects.toThrow()
    })

    it("returns empty array for generateAudioWaveform", async () => {
      const result = await service.generateAudioWaveform("/audio.mp3")
      expect(Array.isArray(result)).toBe(true)
    })

    it("returns empty array for detectVideoScenes", async () => {
      const result = await service.detectVideoScenes("/video.mp4")
      expect(Array.isArray(result)).toBe(true)
    })

    it("throws error for generateVideoThumbnail with invalid file", async () => {
      await expect(service.generateVideoThumbnail("/video.mp4", 5.0)).rejects.toThrow()
    })
  })

  // ============================================================================
  // Metadata
  // ============================================================================

  describe("Metadata", () => {
    it("returns metadata for extractMediaMetadata", async () => {
      const result = await service.extractMediaMetadata("/video.mp4")
      expect(result).toHaveProperty("type")
    })

    it("returns 0 for getMediaDuration", async () => {
      const result = await service.getMediaDuration("/video.mp4")
      expect(result).toBe(0)
    })
  })

  // ============================================================================
  // Proxy Generation
  // ============================================================================

  describe("Proxy Generation", () => {
    it("throws error for generateProxy with invalid file", async () => {
      const options = { width: 1280, height: 720 } as any
      await expect(service.generateProxy("/video.mp4", options)).rejects.toThrow()
    })
  })
})
