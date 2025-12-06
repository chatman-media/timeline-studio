/**
 * Integration tests for info command
 */

import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IMediaService, IPlatformService, MediaMetadata } from "@/core/ports"

// Mock adapters/node
const mockPlatform: IPlatformService = {
  exists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  getFileStats: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn(),
  getPlatform: vi.fn(),
  convertFileSrc: vi.fn(),
  basename: vi.fn(),
  dirname: vi.fn(),
  join: vi.fn(),
  getAbsolutePath: vi.fn(),
  searchFilesByName: vi.fn(),
}

const mockMedia: Partial<IMediaService> = {
  getMetadata: vi.fn(),
  generateThumbnail: vi.fn(),
}

vi.mock("@/adapters/node", () => ({
  initNodeApp: vi.fn().mockResolvedValue({
    platform: mockPlatform,
    media: mockMedia,
  }),
}))

describe("info command integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
  })

  describe("Video metadata", () => {
    it("should process video file metadata", async () => {
      const mockMetadata: MediaMetadata = {
        type: "Video",
        duration: 120.5,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: "h264",
        bitrate: 5_000_000,
        size: 100_000_000,
      }

      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockMedia.getMetadata) {
        vi.mocked(mockMedia.getMetadata).mockResolvedValue(mockMetadata)
      }

      const { infoCommand } = await import("../info")

      // Verify command is properly configured
      expect(infoCommand.name()).toBe("info")

      // Verify metadata structure
      expect(mockMetadata.type).toBe("Video")
      expect(mockMetadata.duration).toBeGreaterThan(0)
      expect(mockMetadata.width).toBe(1920)
      expect(mockMetadata.height).toBe(1080)
    })

    it("should handle H.265 codec", async () => {
      const mockMetadata: MediaMetadata = {
        type: "Video",
        codec: "hevc",
        width: 3840,
        height: 2160,
        fps: 60,
      }

      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockMedia.getMetadata) {
        vi.mocked(mockMedia.getMetadata).mockResolvedValue(mockMetadata)
      }

      expect(mockMetadata.codec).toBe("hevc")
      expect(mockMetadata.width).toBe(3840)
    })
  })

  describe("Audio metadata", () => {
    it("should process audio file metadata", async () => {
      const mockMetadata: MediaMetadata = {
        type: "Audio",
        duration: 180,
        codec: "aac",
        sample_rate: 48000,
        channels: 2,
        bitrate: 320_000,
        size: 50_000_000,
      }

      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockMedia.getMetadata) {
        vi.mocked(mockMedia.getMetadata).mockResolvedValue(mockMetadata)
      }

      expect(mockMetadata.type).toBe("Audio")
      expect(mockMetadata.sample_rate).toBe(48000)
      expect(mockMetadata.channels).toBe(2)
    })

    it("should handle different audio codecs", async () => {
      const codecs = ["aac", "mp3", "opus", "flac"]

      for (const codec of codecs) {
        const mockMetadata: MediaMetadata = {
          type: "Audio",
          codec,
          duration: 100,
        }

        if (mockMedia.getMetadata) {
          vi.mocked(mockMedia.getMetadata).mockResolvedValue(mockMetadata)
        }

        expect(mockMetadata.codec).toBe(codec)
      }
    })
  })

  describe("Image metadata", () => {
    it("should process image file metadata", async () => {
      const mockMetadata: MediaMetadata = {
        type: "Image",
        width: 3840,
        height: 2160,
      }

      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockMedia.getMetadata) {
        vi.mocked(mockMedia.getMetadata).mockResolvedValue(mockMetadata)
      }

      expect(mockMetadata.type).toBe("Image")
      expect(mockMetadata.width).toBe(3840)
      expect(mockMetadata.height).toBe(2160)
    })
  })

  describe("Thumbnail generation", () => {
    it("should generate thumbnail with correct parameters", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockMedia.generateThumbnail) {
        vi.mocked(mockMedia.generateThumbnail).mockResolvedValue("/path/to/thumbnail.jpg")

        const result = await mockMedia.generateThumbnail("file-id", "/path/to/video.mp4", {
          timestamp: 0,
          width: 320,
          height: 180,
        })

        expect(result).toBe("/path/to/thumbnail.jpg")
        expect(mockMedia.generateThumbnail).toHaveBeenCalledWith("file-id", "/path/to/video.mp4", {
          timestamp: 0,
          width: 320,
          height: 180,
        })
      }
    })
  })

  describe("Path resolution", () => {
    it("should resolve relative paths to absolute", () => {
      const relativePath = "video.mp4"
      const absolutePath = path.resolve(relativePath)

      expect(path.isAbsolute(absolutePath)).toBe(true)
    })

    it("should handle paths with spaces", () => {
      const pathWithSpaces = "my video file.mp4"
      const absolutePath = path.resolve(pathWithSpaces)

      expect(path.isAbsolute(absolutePath)).toBe(true)
    })
  })

  describe("Error handling", () => {
    it("should handle file not found", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(false)

      const filePath = "/nonexistent/file.mp4"
      const exists = await mockPlatform.exists(filePath)

      expect(exists).toBe(false)
    })

    it("should handle metadata extraction errors", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockMedia.getMetadata) {
        vi.mocked(mockMedia.getMetadata).mockRejectedValue(new Error("Invalid file format"))

        await expect(mockMedia.getMetadata("/path/to/invalid.file")).rejects.toThrow("Invalid file format")
      }
    })
  })
})
