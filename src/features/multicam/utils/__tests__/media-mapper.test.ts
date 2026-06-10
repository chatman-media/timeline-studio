/**
 * Тесты для утилит преобразования медиафайлов
 */

import { describe, expect, it } from "vitest"
import { MediaType } from "@timeline-studio/domains/media-management"
import type { MediaItem } from "@/types/generated/tauri-bindings"
import { mediaItemsToMediaFiles, mediaItemToMediaFile } from "../media-mapper"

// Helper to create mock MediaItem with default metadata
const createMockMediaItem = (overrides: Partial<MediaItem>): MediaItem => ({
  id: "test-id",
  name: "test.mp4",
  path: "/path/to/test.mp4",
  media_type: "Video",
  duration: 120,
  thumbnail: null,
  metadata: {
    format: "mp4",
    codec: "h264",
    resolution: null,
    frame_rate: null,
    bitrate: null,
    audio_channels: null,
    sample_rate: null,
    creation_time: null,
  },
  usage_count: 0,
  ...overrides,
})

describe("media-mapper", () => {
  describe("mediaItemToMediaFile", () => {
    it("should convert video MediaItem to MediaFile", () => {
      const videoItem = createMockMediaItem({
        id: "video-1",
        name: "test-video.mp4",
        path: "/path/to/test-video.mp4",
        media_type: "Video",
        duration: 120.5,
        thumbnail: "/path/to/thumbnail.jpg",
      })

      const result = mediaItemToMediaFile(videoItem)

      expect(result).toEqual({
        id: "video-1",
        name: "test-video.mp4",
        path: "/path/to/test-video.mp4",
        type: MediaType.Video,
        size: 0,
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 120.5,
        width: undefined,
        height: undefined,
        fps: undefined,
        bitrate: undefined,
        probeData: undefined,
        thumbnailPath: "/path/to/thumbnail.jpg",
        createdAt: expect.any(Date),
      })
    })

    it("should convert audio MediaItem to MediaFile", () => {
      const audioItem = createMockMediaItem({
        id: "audio-1",
        name: "test-audio.mp3",
        path: "/path/to/test-audio.mp3",
        media_type: "Audio",
        duration: 180.25,
        thumbnail: null,
      })

      const result = mediaItemToMediaFile(audioItem)

      expect(result).toEqual({
        id: "audio-1",
        name: "test-audio.mp3",
        path: "/path/to/test-audio.mp3",
        type: MediaType.Audio,
        size: 0,
        isVideo: false,
        isAudio: true,
        isImage: false,
        duration: 180.25,
        width: undefined,
        height: undefined,
        fps: undefined,
        bitrate: undefined,
        probeData: undefined,
        thumbnailPath: undefined,
        createdAt: expect.any(Date),
      })
    })

    it("should convert image MediaItem to MediaFile", () => {
      const imageItem = createMockMediaItem({
        id: "image-1",
        name: "test-image.jpg",
        path: "/path/to/test-image.jpg",
        media_type: "Image",
        duration: null,
        thumbnail: "/path/to/test-image.jpg",
      })

      const result = mediaItemToMediaFile(imageItem)

      expect(result).toEqual({
        id: "image-1",
        name: "test-image.jpg",
        path: "/path/to/test-image.jpg",
        type: MediaType.StillImage,
        size: 0,
        isVideo: false,
        isAudio: false,
        isImage: true,
        duration: undefined,
        width: undefined,
        height: undefined,
        fps: undefined,
        bitrate: undefined,
        probeData: undefined,
        thumbnailPath: "/path/to/test-image.jpg",
        createdAt: expect.any(Date),
      })
    })

    it("should handle MediaItem without duration", () => {
      const item = createMockMediaItem({
        id: "video-2",
        name: "no-duration.mp4",
        path: "/path/to/no-duration.mp4",
        media_type: "Video",
        duration: null,
        thumbnail: null,
      })

      const result = mediaItemToMediaFile(item)

      expect(result.duration).toBeUndefined()
    })

    it("should handle MediaItem without thumbnail", () => {
      const item = createMockMediaItem({
        id: "video-3",
        name: "no-thumb.mp4",
        path: "/path/to/no-thumb.mp4",
        media_type: "Video",
        duration: 60,
        thumbnail: null,
      })

      const result = mediaItemToMediaFile(item)

      expect(result.thumbnailPath).toBeUndefined()
    })

    it("should handle all media types correctly", () => {
      const items = [
        { media_type: "Video" as const, expected: MediaType.Video },
        { media_type: "Audio" as const, expected: MediaType.Audio },
        { media_type: "Image" as const, expected: MediaType.StillImage },
      ]

      items.forEach(({ media_type, expected }) => {
        const item = createMockMediaItem({
          id: "test",
          name: "test.file",
          path: "/test.file",
          media_type,
          duration: null,
          thumbnail: null,
        })

        const result = mediaItemToMediaFile(item)
        expect(result.type).toBe(expected)
      })
    })

    it("should handle unknown media type", () => {
      const item = {
        id: "unknown-1",
        name: "unknown.file",
        path: "/path/to/unknown.file",
        media_type: "Unknown",
        duration: null,
        thumbnail: null,
      } as unknown as MediaItem

      const result = mediaItemToMediaFile(item)

      expect(result.type).toBe(MediaType.Unknown)
      expect(result.isVideo).toBe(false)
      expect(result.isAudio).toBe(false)
      expect(result.isImage).toBe(false)
    })

    it("should set all undefined fields correctly", () => {
      const item = createMockMediaItem({
        id: "test-1",
        name: "test.mp4",
        path: "/test.mp4",
        media_type: "Video",
        duration: 100,
        thumbnail: null,
      })

      const result = mediaItemToMediaFile(item)

      expect(result.width).toBeUndefined()
      expect(result.height).toBeUndefined()
      expect(result.fps).toBeUndefined()
      expect(result.bitrate).toBeUndefined()
      expect(result.probeData).toBeUndefined()
    })

    it("should set size to 0 since MediaItem doesn't contain it", () => {
      const item = createMockMediaItem({
        id: "test-2",
        name: "test.mp4",
        path: "/test.mp4",
        media_type: "Video",
        duration: 100,
        thumbnail: null,
      })

      const result = mediaItemToMediaFile(item)

      expect(result.size).toBe(0)
    })

    it("should create a new Date for createdAt", () => {
      const before = new Date()
      const item = createMockMediaItem({
        id: "test-3",
        name: "test.mp4",
        path: "/test.mp4",
        media_type: "Video",
        duration: 100,
        thumbnail: null,
      })

      const result = mediaItemToMediaFile(item)
      const after = new Date()

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAt?.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.createdAt?.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe("mediaItemsToMediaFiles", () => {
    it("should convert empty array", () => {
      const result = mediaItemsToMediaFiles([])

      expect(result).toEqual([])
    })

    it("should convert single item", () => {
      const items: MediaItem[] = [
        {
          id: "video-1",
          name: "test.mp4",
          path: "/test.mp4",
          media_type: "Video",
          duration: 100,
          thumbnail: null,
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
      ]

      const result = mediaItemsToMediaFiles(items)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("video-1")
      expect(result[0].type).toBe(MediaType.Video)
    })

    it("should convert multiple items of different types", () => {
      const items: MediaItem[] = [
        {
          id: "video-1",
          name: "video.mp4",
          path: "/video.mp4",
          media_type: "Video",
          duration: 120,
          thumbnail: "/thumb1.jpg",
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
        {
          id: "audio-1",
          name: "audio.mp3",
          path: "/audio.mp3",
          media_type: "Audio",
          duration: 180,
          thumbnail: null,
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
        {
          id: "image-1",
          name: "image.jpg",
          path: "/image.jpg",
          media_type: "Image",
          duration: null,
          thumbnail: "/image.jpg",
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
      ]

      const result = mediaItemsToMediaFiles(items)

      expect(result).toHaveLength(3)
      expect(result[0].type).toBe(MediaType.Video)
      expect(result[0].isVideo).toBe(true)
      expect(result[1].type).toBe(MediaType.Audio)
      expect(result[1].isAudio).toBe(true)
      expect(result[2].type).toBe(MediaType.StillImage)
      expect(result[2].isImage).toBe(true)
    })

    it("should preserve order of items", () => {
      const items: MediaItem[] = [
        {
          id: "item-3",
          name: "third.mp4",
          path: "/third.mp4",
          media_type: "Video",
          duration: 30,
          thumbnail: null,
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
        {
          id: "item-1",
          name: "first.mp4",
          path: "/first.mp4",
          media_type: "Video",
          duration: 10,
          thumbnail: null,
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
        {
          id: "item-2",
          name: "second.mp4",
          path: "/second.mp4",
          media_type: "Video",
          duration: 20,
          thumbnail: null,
          metadata: {
            format: "mp4",
            codec: null,
            resolution: null,
            frame_rate: null,
            bitrate: null,
            audio_channels: null,
            sample_rate: null,
            creation_time: null,
          },
          usage_count: 0,
        },
      ]

      const result = mediaItemsToMediaFiles(items)

      expect(result[0].id).toBe("item-3")
      expect(result[1].id).toBe("item-1")
      expect(result[2].id).toBe("item-2")
    })

    it("should handle large arrays", () => {
      const items: MediaItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `file-${i}.mp4`,
        path: `/path/file-${i}.mp4`,
        media_type: "Video" as const,
        duration: i * 10,
        thumbnail: null,
        metadata: {
          format: "mp4",
          codec: null,
          resolution: null,
          frame_rate: null,
          bitrate: null,
          audio_channels: null,
          sample_rate: null,
          creation_time: null,
        },
        usage_count: 0,
      }))

      const result = mediaItemsToMediaFiles(items)

      expect(result).toHaveLength(100)
      expect(result[0].id).toBe("item-0")
      expect(result[99].id).toBe("item-99")
      expect(result[50].duration).toBe(500)
    })
  })
})
