/**
 * Media Metadata Service Tests
 *
 * Тесты для MediaMetadataService
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  mockAudioMetadata,
  mockImageMetadata,
  mockSceneDetectionResults,
  mockVideoMetadata,
} from "../../__mocks__"
import { getMediaMetadataService } from "../media-metadata-service"
import type { MediaMetadata, SceneDetectionResult } from "../../types"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
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
    service = getMediaMetadataService()
  })

  describe("extractMetadata", () => {
    it("should extract metadata from video file", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue(mockVideoMetadata)

      const result = await service.extractMetadata("/test/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("extract_media_metadata", {
        path: "/test/video.mp4",
      })
      expect(result).toEqual(mockVideoMetadata)
      expect(result.type).toBe("Video")
    })

    it("should extract metadata from audio file", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue(mockAudioMetadata)

      const result = await service.extractMetadata("/test/audio.mp3")

      expect(result).toEqual(mockAudioMetadata)
      expect(result.type).toBe("Audio")
    })

    it("should extract metadata from image file", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValue(mockImageMetadata)

      const result = await service.extractMetadata("/test/image.jpg")

      expect(result).toEqual(mockImageMetadata)
      expect(result.type).toBe("Image")
    })

    it("should handle extraction errors", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockRejectedValue(new Error("File not found"))

      await expect(service.extractMetadata("/invalid/path.mp4")).rejects.toThrow(
        "Failed to extract metadata",
      )
    })
  })

  describe("generateThumbnail", () => {
    it("should generate thumbnail at default time (0)", async () => {
      const mockInvoke = vi.mocked(invoke)
      const thumbnailPath = "/tmp/thumbnail.jpg"
      mockInvoke.mockResolvedValue(thumbnailPath)

      const result = await service.generateThumbnail("/test/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("generate_video_thumbnail", {
        videoPath: "/test/video.mp4",
        time: 0,
      })
      expect(result).toBe(thumbnailPath)
    })

    it("should generate thumbnail at specific time", async () => {
      const mockInvoke = vi.mocked(invoke)
      const thumbnailPath = "/tmp/thumbnail-10s.jpg"
      mockInvoke.mockResolvedValue(thumbnailPath)

      const result = await service.generateThumbnail("/test/video.mp4", 10.5)

      expect(mockInvoke).toHaveBeenCalledWith("generate_video_thumbnail", {
        videoPath: "/test/video.mp4",
        time: 10.5,
      })
      expect(result).toBe(thumbnailPath)
    })

    it("should handle thumbnail generation errors", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockRejectedValue(new Error("FFmpeg error"))

      await expect(service.generateThumbnail("/test/video.mp4")).rejects.toThrow(
        "Failed to generate thumbnail",
      )
    })
  })

  describe("analyzeMedia", () => {
    it("should analyze video file completely", async () => {
      const mockInvoke = vi.mocked(invoke)

      // Mock metadata extraction
      mockInvoke.mockResolvedValueOnce(mockVideoMetadata)

      // Mock thumbnail generation
      mockInvoke.mockResolvedValueOnce("/tmp/thumbnail.jpg")

      // Mock scene detection
      mockInvoke.mockResolvedValueOnce(mockSceneDetectionResults)

      const result = await service.analyzeMedia("/test/video.mp4")

      expect(result.metadata).toEqual(mockVideoMetadata)
      expect(result.thumbnailPath).toBe("/tmp/thumbnail.jpg")
      expect(result.scenes).toEqual(mockSceneDetectionResults)
      expect(result.quality).toBeDefined()
      expect(result.quality?.qualityScore).toBeGreaterThan(0)
    })

    it("should analyze audio file with waveform", async () => {
      const mockInvoke = vi.mocked(invoke)
      const mockWaveform = [0.1, 0.5, 0.8, 0.3, -0.2, -0.6]

      // Mock metadata extraction
      mockInvoke.mockResolvedValueOnce(mockAudioMetadata)

      // Mock waveform generation
      mockInvoke.mockResolvedValueOnce(mockWaveform)

      const result = await service.analyzeMedia("/test/audio.mp3")

      expect(result.metadata).toEqual(mockAudioMetadata)
      expect(result.waveformData).toBeInstanceOf(Float32Array)
      expect(result.waveformData?.length).toBe(mockWaveform.length)
      expect(result.thumbnailPath).toBeUndefined()
      expect(result.scenes).toBeUndefined()
    })

    it("should handle partial analysis failures gracefully", async () => {
      const mockInvoke = vi.mocked(invoke)

      // Mock successful metadata extraction
      mockInvoke.mockResolvedValueOnce(mockVideoMetadata)

      // Mock failed thumbnail generation
      mockInvoke.mockRejectedValueOnce(new Error("Thumbnail failed"))

      // Mock failed scene detection
      mockInvoke.mockRejectedValueOnce(new Error("Scene detection failed"))

      const result = await service.analyzeMedia("/test/video.mp4")

      // Should still return results with metadata
      expect(result.metadata).toEqual(mockVideoMetadata)
      expect(result.thumbnailPath).toBeUndefined()
      expect(result.scenes).toBeUndefined()
      expect(result.quality).toBeDefined()
    })

    it("should throw error if metadata extraction fails", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockRejectedValue(new Error("Invalid file"))

      await expect(service.analyzeMedia("/test/invalid.mp4")).rejects.toThrow("Media analysis failed")
    })
  })

  describe("getMediaDuration", () => {
    it("should get duration for media file", async () => {
      const mockInvoke = vi.mocked(invoke)
      const duration = 120.5
      mockInvoke.mockResolvedValue(duration)

      const result = await service.getMediaDuration("/test/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("get_media_duration", {
        path: "/test/video.mp4",
      })
      expect(result).toBe(duration)
    })

    it("should handle duration extraction errors", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockRejectedValue(new Error("Cannot read file"))

      await expect(service.getMediaDuration("/test/invalid.mp4")).rejects.toThrow(
        "Failed to get media duration",
      )
    })
  })

  describe("quality score calculation", () => {
    it("should calculate high quality score for 4K video", async () => {
      const mockInvoke = vi.mocked(invoke)
      const highQualityMetadata: MediaMetadata = {
        type: "Video",
        width: 3840,
        height: 2160,
        fps: 60,
        duration: 100,
        codec: "h265",
        bitrate: 50_000_000,
        hasAudio: true,
      }

      mockInvoke.mockResolvedValue(highQualityMetadata)

      const result = await service.analyzeMedia("/test/4k-video.mp4")

      expect(result.quality?.qualityScore).toBeGreaterThan(80)
      expect(result.quality?.resolution).toBe("3840x2160")
    })

    it("should calculate lower quality score for SD video", async () => {
      const mockInvoke = vi.mocked(invoke)
      const lowQualityMetadata: MediaMetadata = {
        type: "Video",
        width: 640,
        height: 480,
        fps: 24,
        duration: 100,
        codec: "mpeg4",
        bitrate: 1_000_000,
        hasAudio: true,
      }

      mockInvoke.mockResolvedValue(lowQualityMetadata)

      const result = await service.analyzeMedia("/test/sd-video.mp4")

      expect(result.quality?.qualityScore).toBeLessThan(50)
    })
  })

  describe("scene detection", () => {
    it("should detect scenes in video", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValueOnce(mockVideoMetadata)
      mockInvoke.mockResolvedValueOnce("/tmp/thumb.jpg")
      mockInvoke.mockResolvedValueOnce(mockSceneDetectionResults)

      const result = await service.analyzeMedia("/test/video.mp4")

      expect(result.scenes).toBeDefined()
      expect(result.scenes?.length).toBe(mockSceneDetectionResults.length)
      expect(result.scenes?.[0].confidence).toBeGreaterThan(0)
    })

    it("should return empty array if scene detection fails", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValueOnce(mockVideoMetadata)
      mockInvoke.mockResolvedValueOnce("/tmp/thumb.jpg")
      mockInvoke.mockRejectedValueOnce(new Error("Scene detection error"))

      const result = await service.analyzeMedia("/test/video.mp4")

      expect(result.scenes).toBeUndefined()
    })
  })

  describe("waveform generation", () => {
    it("should generate waveform for audio file", async () => {
      const mockInvoke = vi.mocked(invoke)
      const mockWaveform = Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.1))

      mockInvoke.mockResolvedValueOnce(mockAudioMetadata)
      mockInvoke.mockResolvedValueOnce(mockWaveform)

      const result = await service.analyzeMedia("/test/audio.mp3")

      expect(result.waveformData).toBeInstanceOf(Float32Array)
      expect(result.waveformData?.length).toBe(mockWaveform.length)
    })

    it("should return empty waveform if generation fails", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockResolvedValueOnce(mockAudioMetadata)
      mockInvoke.mockRejectedValueOnce(new Error("Waveform error"))

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
