/**
 * Media Metadata Service Tests
 *
 * Тесты для MediaMetadataService
 *
 * ✅ ОБНОВЛЕНО (2025-11-28): Использует mock для container.getMedia()
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockAudioMetadata, mockImageMetadata, mockSceneDetectionResults, mockVideoMetadata } from "../../__mocks__"
import type { MediaMetadata } from "../../types"
import { getMediaMetadataService } from "../media-metadata-service"

// Tauri MediaType is simplified: "Video" | "Audio" | "Image"
type TauriMediaType = "Video" | "Audio" | "Image"

// Mock media service
const mockMediaService = {
  extractMediaMetadata: vi.fn(),
  generateVideoThumbnail: vi.fn(),
  detectVideoScenes: vi.fn(),
  generateAudioWaveform: vi.fn(),
  getMediaDuration: vi.fn(),
}

vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("MediaMetadataService", () => {
  let service: ReturnType<typeof getMediaMetadataService>

  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaService.extractMediaMetadata.mockReset()
    mockMediaService.generateVideoThumbnail.mockReset()
    mockMediaService.detectVideoScenes.mockReset()
    mockMediaService.generateAudioWaveform.mockReset()
    mockMediaService.getMediaDuration.mockReset()
    service = getMediaMetadataService()
  })

  describe("extractMetadata", () => {
    it("should extract metadata from video file", async () => {
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockVideoMetadata)

      const result = await service.extractMetadata("/test/video.mp4")

      expect(mockMediaService.extractMediaMetadata).toHaveBeenCalledWith("/test/video.mp4")
      expect(result).toEqual(mockVideoMetadata)
      expect(result.type).toBe("Video")
    })

    it("should extract metadata from audio file", async () => {
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockAudioMetadata)

      const result = await service.extractMetadata("/test/audio.mp3")

      expect(result).toEqual(mockAudioMetadata)
      expect(result.type).toBe("Audio")
    })

    it("should extract metadata from image file", async () => {
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockImageMetadata)

      const result = await service.extractMetadata("/test/image.jpg")

      expect(result).toEqual(mockImageMetadata)
      expect(result.type).toBe("Image")
    })

    it("should handle extraction errors", async () => {
      mockMediaService.extractMediaMetadata.mockRejectedValue(new Error("File not found"))

      await expect(service.extractMetadata("/invalid/path.mp4")).rejects.toThrow("Failed to extract metadata")
    })
  })

  describe("generateThumbnail", () => {
    it("should generate thumbnail at default time (0)", async () => {
      const thumbnailPath = "/tmp/thumbnail.jpg"
      mockMediaService.generateVideoThumbnail.mockResolvedValue(thumbnailPath)

      const result = await service.generateThumbnail("/test/video.mp4")

      expect(mockMediaService.generateVideoThumbnail).toHaveBeenCalledWith("/test/video.mp4", 0)
      expect(result).toBe(thumbnailPath)
    })

    it("should generate thumbnail at specific time", async () => {
      const thumbnailPath = "/tmp/thumbnail-10s.jpg"
      mockMediaService.generateVideoThumbnail.mockResolvedValue(thumbnailPath)

      const result = await service.generateThumbnail("/test/video.mp4", 10.5)

      expect(mockMediaService.generateVideoThumbnail).toHaveBeenCalledWith("/test/video.mp4", 10.5)
      expect(result).toBe(thumbnailPath)
    })

    it("should handle thumbnail generation errors", async () => {
      mockMediaService.generateVideoThumbnail.mockRejectedValue(new Error("FFmpeg error"))

      await expect(service.generateThumbnail("/test/video.mp4")).rejects.toThrow("Failed to generate thumbnail")
    })
  })

  describe("analyzeMedia", () => {
    it("should analyze video file completely", async () => {
      // Mock metadata extraction
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockVideoMetadata)
      // Mock thumbnail generation
      mockMediaService.generateVideoThumbnail.mockResolvedValue("/tmp/thumbnail.jpg")
      // Mock scene detection
      mockMediaService.detectVideoScenes.mockResolvedValue(mockSceneDetectionResults)

      const result = await service.analyzeMedia("/test/video.mp4")

      expect(result.metadata).toEqual(mockVideoMetadata)
      expect(result.thumbnailPath).toBe("/tmp/thumbnail.jpg")
      expect(result.scenes).toEqual(mockSceneDetectionResults)
      expect(result.quality).toBeDefined()
      expect(result.quality?.qualityScore).toBeGreaterThan(0)
    })

    it("should analyze audio file with waveform", async () => {
      const mockWaveform = [0.1, 0.5, 0.8, 0.3, -0.2, -0.6]

      // Mock metadata extraction
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockAudioMetadata)
      // Mock waveform generation
      mockMediaService.generateAudioWaveform.mockResolvedValue(mockWaveform)

      const result = await service.analyzeMedia("/test/audio.mp3")

      expect(result.metadata).toEqual(mockAudioMetadata)
      expect(result.waveformData).toBeInstanceOf(Float32Array)
      expect(result.waveformData?.length).toBe(mockWaveform.length)
      expect(result.thumbnailPath).toBeUndefined()
      expect(result.scenes).toBeUndefined()
    })

    it("should handle partial analysis failures gracefully", async () => {
      // Mock successful metadata extraction
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockVideoMetadata)
      // Mock failed thumbnail generation
      mockMediaService.generateVideoThumbnail.mockRejectedValue(new Error("Thumbnail failed"))
      // Mock successful scene detection (service continues after thumbnail failure)
      mockMediaService.detectVideoScenes.mockResolvedValue(mockSceneDetectionResults)

      const result = await service.analyzeMedia("/test/video.mp4")

      // Should still return results with metadata and scenes
      expect(result.metadata).toEqual(mockVideoMetadata)
      expect(result.thumbnailPath).toBeUndefined()
      expect(result.scenes).toEqual(mockSceneDetectionResults)
      expect(result.quality).toBeDefined()
    })

    it("should throw error if metadata extraction fails", async () => {
      mockMediaService.extractMediaMetadata.mockRejectedValue(new Error("Invalid file"))

      await expect(service.analyzeMedia("/test/invalid.mp4")).rejects.toThrow("Media analysis failed")
    })
  })

  describe("getMediaDuration", () => {
    it("should get duration for media file", async () => {
      const duration = 120.5
      mockMediaService.getMediaDuration.mockResolvedValue(duration)

      const result = await service.getMediaDuration("/test/video.mp4")

      expect(mockMediaService.getMediaDuration).toHaveBeenCalledWith("/test/video.mp4")
      expect(result).toBe(duration)
    })

    it("should handle duration extraction errors", async () => {
      mockMediaService.getMediaDuration.mockRejectedValue(new Error("Cannot read file"))

      await expect(service.getMediaDuration("/test/invalid.mp4")).rejects.toThrow("Failed to get media duration")
    })
  })

  describe("quality score calculation", () => {
    it("should calculate high quality score for 4K video", async () => {
      const highQualityMetadata: MediaMetadata = {
        type: "Video" as TauriMediaType,
        width: 3840,
        height: 2160,
        fps: 60,
        duration: 100,
        codec: "h265",
        bitrate: 50_000_000,
      }

      mockMediaService.extractMediaMetadata.mockResolvedValue(highQualityMetadata)
      mockMediaService.generateVideoThumbnail.mockResolvedValue("/tmp/thumb.jpg")
      mockMediaService.detectVideoScenes.mockResolvedValue([])

      const result = await service.analyzeMedia("/test/4k-video.mp4")

      expect(result.quality?.qualityScore).toBeGreaterThan(80)
      expect(result.quality?.resolution).toBe("3840x2160")
    })

    it("should calculate lower quality score for SD video", async () => {
      const lowQualityMetadata: MediaMetadata = {
        type: "Video" as TauriMediaType,
        width: 640,
        height: 480,
        fps: 24,
        duration: 100,
        codec: "mpeg4",
        bitrate: 1_000_000,
      }

      mockMediaService.extractMediaMetadata.mockResolvedValue(lowQualityMetadata)
      mockMediaService.generateVideoThumbnail.mockResolvedValue("/tmp/thumb.jpg")
      mockMediaService.detectVideoScenes.mockResolvedValue([])

      const result = await service.analyzeMedia("/test/sd-video.mp4")

      expect(result.quality?.qualityScore).toBeLessThan(50)
    })
  })

  describe("scene detection", () => {
    it("should detect scenes in video", async () => {
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockVideoMetadata)
      mockMediaService.generateVideoThumbnail.mockResolvedValue("/tmp/thumb.jpg")
      mockMediaService.detectVideoScenes.mockResolvedValue(mockSceneDetectionResults)

      const result = await service.analyzeMedia("/test/video.mp4")

      expect(result.scenes).toBeDefined()
      expect(result.scenes?.length).toBe(mockSceneDetectionResults.length)
      expect(result.scenes?.[0].confidence).toBeGreaterThan(0)
    })

    it("should return empty array if scene detection fails", async () => {
      // Successful metadata extraction
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockVideoMetadata)
      // Successful thumbnail generation
      mockMediaService.generateVideoThumbnail.mockResolvedValue("/tmp/thumb.jpg")
      // Failed scene detection - метод detectScenes перехватывает ошибку и возвращает []
      mockMediaService.detectVideoScenes.mockRejectedValue(new Error("Scene detection error"))

      const result = await service.analyzeMedia("/test/video.mp4")

      // Service should handle scene detection failure gracefully
      expect(result.metadata).toEqual(mockVideoMetadata)
      expect(result.thumbnailPath).toBe("/tmp/thumb.jpg")
      // detectScenes внутренне обрабатывает ошибку и возвращает пустой массив
      expect(result.scenes).toEqual([])
      expect(result.quality).toBeDefined()
    })
  })

  describe("waveform generation", () => {
    it("should generate waveform for audio file", async () => {
      const mockWaveform = Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.1))

      mockMediaService.extractMediaMetadata.mockResolvedValue(mockAudioMetadata)
      mockMediaService.generateAudioWaveform.mockResolvedValue(mockWaveform)

      const result = await service.analyzeMedia("/test/audio.mp3")

      expect(result.waveformData).toBeInstanceOf(Float32Array)
      expect(result.waveformData?.length).toBe(mockWaveform.length)
    })

    it("should return empty waveform if generation fails", async () => {
      mockMediaService.extractMediaMetadata.mockResolvedValue(mockAudioMetadata)
      mockMediaService.generateAudioWaveform.mockRejectedValue(new Error("Waveform error"))

      const result = await service.analyzeMedia("/test/audio.mp3")

      expect(result.waveformData).toBeInstanceOf(Float32Array)
      expect(result.waveformData?.length).toBe(0)
    })
  })

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = getMediaMetadataService()
      const instance2 = getMediaMetadataService()

      expect(instance1).toBe(instance2)
    })
  })
})
