/**
 * Media Types Tests
 *
 * Тесты для типов и утилит работы с медиа файлами
 */

import { describe, expect, it } from "vitest"
import type { MediaMetadata } from "../media"
import { metadataToMediaFileFields } from "../media"

describe("Media Types", () => {
  describe("metadataToMediaFileFields", () => {
    it("should convert full metadata to media file fields", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/video.mp4",
        file_size: 1024000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 120.5,
        resolution: [1920, 1080],
        fps: 30,
        bitrate: 5000000,
        video_codec: "h264",
        audio_codec: "aac",
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result).toEqual({
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
        videoCodec: "h264",
        audioCodec: "aac",
      })
    })

    it("should handle metadata without resolution", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/audio.mp3",
        file_size: 512000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 180,
        fps: 0,
        bitrate: 320000,
        audio_codec: "mp3",
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result).toEqual({
        width: undefined,
        height: undefined,
        fps: 0,
        bitrate: 320000,
        videoCodec: undefined,
        audioCodec: "mp3",
      })
    })

    it("should handle partial metadata", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/file.mov",
        file_size: 2048000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 60,
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result).toEqual({
        width: undefined,
        height: undefined,
        fps: undefined,
        bitrate: undefined,
        videoCodec: undefined,
        audioCodec: undefined,
      })
    })

    it("should preserve exact resolution values", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/4k.mp4",
        file_size: 10240000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 300,
        resolution: [3840, 2160],
        fps: 60,
        bitrate: 25000000,
        video_codec: "hevc",
        audio_codec: "aac",
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result.width).toBe(3840)
      expect(result.height).toBe(2160)
    })

    it("should handle uncommon resolutions", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/vertical.mp4",
        file_size: 1024000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 15,
        resolution: [1080, 1920], // Vertical video
        fps: 30,
        bitrate: 8000000,
        video_codec: "h264",
        audio_codec: "aac",
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result.width).toBe(1080)
      expect(result.height).toBe(1920)
    })

    it("should handle different codec formats", () => {
      const testCases = [
        { video_codec: "h264", audio_codec: "aac" },
        { video_codec: "hevc", audio_codec: "opus" },
        { video_codec: "vp9", audio_codec: "vorbis" },
        { video_codec: "av1", audio_codec: "flac" },
      ]

      testCases.forEach(({ video_codec, audio_codec }) => {
        const metadata: MediaMetadata = {
          file_path: "/path/to/video.mp4",
          file_size: 1024000,
          modified_time: "2024-01-01T00:00:00Z",
          duration: 60,
          resolution: [1920, 1080],
          fps: 30,
          bitrate: 5000000,
          video_codec,
          audio_codec,
          cached_at: "2024-01-02T00:00:00Z",
        }

        const result = metadataToMediaFileFields(metadata)

        expect(result.videoCodec).toBe(video_codec)
        expect(result.audioCodec).toBe(audio_codec)
      })
    })

    it("should handle high fps values", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/highfps.mp4",
        file_size: 5120000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 10,
        resolution: [1920, 1080],
        fps: 120,
        bitrate: 50000000,
        video_codec: "h264",
        audio_codec: "aac",
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result.fps).toBe(120)
    })

    it("should handle zero or missing fps", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/image.jpg",
        file_size: 204800,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 0,
        resolution: [1920, 1080],
        fps: 0,
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      expect(result.fps).toBe(0)
    })

    it("should not include fields from MediaMetadata that are not in ExtendedMediaFile", () => {
      const metadata: MediaMetadata = {
        file_path: "/path/to/video.mp4",
        file_size: 1024000,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 60,
        resolution: [1920, 1080],
        fps: 30,
        bitrate: 5000000,
        video_codec: "h264",
        audio_codec: "aac",
        cached_at: "2024-01-02T00:00:00Z",
      }

      const result = metadataToMediaFileFields(metadata)

      // These fields should NOT be in the result
      expect(result).not.toHaveProperty("file_path")
      expect(result).not.toHaveProperty("file_size")
      expect(result).not.toHaveProperty("modified_time")
      expect(result).not.toHaveProperty("duration")
      expect(result).not.toHaveProperty("cached_at")
    })
  })

  describe("MediaMetadata Type", () => {
    it("should allow creation with all fields", () => {
      const metadata: MediaMetadata = {
        file_path: "/test/video.mp4",
        file_size: 1024,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 60,
        resolution: [1920, 1080],
        fps: 30,
        bitrate: 5000000,
        video_codec: "h264",
        audio_codec: "aac",
        cached_at: "2024-01-02T00:00:00Z",
      }

      expect(metadata).toBeDefined()
      expect(metadata.file_path).toBe("/test/video.mp4")
      expect(metadata.duration).toBe(60)
    })

    it("should allow creation with only required fields", () => {
      const metadata: MediaMetadata = {
        file_path: "/test/simple.mp4",
        file_size: 512,
        modified_time: "2024-01-01T00:00:00Z",
        duration: 30,
        cached_at: "2024-01-02T00:00:00Z",
      }

      expect(metadata).toBeDefined()
      expect(metadata.resolution).toBeUndefined()
      expect(metadata.fps).toBeUndefined()
    })
  })
})
