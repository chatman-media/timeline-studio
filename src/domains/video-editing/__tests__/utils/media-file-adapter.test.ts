/**
 * Media File Adapter Tests
 *
 * Тесты для адаптера конвертации MediaFile между форматами
 */

import { describe, expect, it } from "vitest"
import type { MediaFile as FeatureMediaFile } from "@/features/media/types/media"
import { MediaType as FeatureMediaType } from "@/features/media/types/media"
import { MediaCodec, MediaType } from "../../types/media"
import { domainToFeatureMediaFile, featureToDomainMediaFile } from "../../utils/media-file-adapter"

describe("MediaFileAdapter", () => {
  describe("featureToDomainMediaFile", () => {
    it("should convert video file", () => {
      const featureFile: FeatureMediaFile = {
        id: "video-1",
        name: "test-video.mp4",
        path: "/test/video.mp4",
        type: FeatureMediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 120,
        size: 1024 * 1024 * 50,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        probeData: {
          streams: [
            {
              codec_type: "video",
              width: 1920,
              height: 1080,
              r_frame_rate: "30/1",
            },
            {
              codec_type: "audio",
            },
          ],
        },
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.id).toBe("video-1")
      expect(domainFile.name).toBe("test-video.mp4")
      expect(domainFile.path).toBe("/test/video.mp4")
      expect(domainFile.type).toBe(MediaType.VideoWithAudio)
      expect(domainFile.duration).toBe(120)
      expect(domainFile.size).toBe(1024 * 1024 * 50)
      expect(domainFile.width).toBe(1920)
      expect(domainFile.height).toBe(1080)
      expect(domainFile.fps).toBe(30)
    })

    it("should convert video without audio", () => {
      const featureFile: FeatureMediaFile = {
        id: "video-2",
        name: "silent-video.mp4",
        path: "/test/silent.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1024 * 1024 * 20,
        probeData: {
          streams: [
            {
              codec_type: "video",
              width: 1280,
              height: 720,
              r_frame_rate: "24/1",
            },
          ],
        },
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.type).toBe(MediaType.Video)
      expect(domainFile.fps).toBe(24)
    })

    it("should convert audio file", () => {
      const featureFile: FeatureMediaFile = {
        id: "audio-1",
        name: "test-audio.mp3",
        path: "/test/audio.mp3",
        type: "audio",
        isVideo: false,
        isAudio: true,
        isImage: false,
        duration: 180,
        size: 1024 * 1024 * 5,
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.type).toBe(MediaType.Audio)
      expect(domainFile.duration).toBe(180)
    })

    it("should convert image file", () => {
      const featureFile: FeatureMediaFile = {
        id: "image-1",
        name: "test-image.jpg",
        path: "/test/image.jpg",
        type: "image",
        isVideo: false,
        isAudio: false,
        isImage: true,
        duration: undefined,
        size: 1024 * 1024 * 2,
        probeData: {
          streams: [
            {
              codec_type: "video",
              width: 3840,
              height: 2160,
            },
          ],
        },
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.type).toBe(MediaType.StillImage)
      expect(domainFile.width).toBe(3840)
      expect(domainFile.height).toBe(2160)
    })

    it("should parse fps from fraction string", () => {
      const featureFile: FeatureMediaFile = {
        id: "video-3",
        name: "fps-test.mp4",
        path: "/test/fps.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 30,
        size: 1024 * 1024,
        probeData: {
          streams: [
            {
              codec_type: "video",
              width: 1920,
              height: 1080,
              r_frame_rate: "60000/1001", // ~59.94 fps
            },
          ],
        },
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.fps).toBeCloseTo(59.94, 2)
    })

    it("should handle proxy data", () => {
      const featureFile: FeatureMediaFile = {
        id: "video-4",
        name: "proxy-test.mp4",
        path: "/test/proxy.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1024 * 1024,
        proxy: {
          path: "/test/proxy-low.mp4",
          width: 1280,
          height: 720,
          bitrate: 5000000,
        },
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.proxy).toBeDefined()
      expect(domainFile.proxy?.path).toBe("/test/proxy-low.mp4")
      expect(domainFile.proxy?.width).toBe(1280)
      expect(domainFile.proxy?.height).toBe(720)
      expect(domainFile.proxy?.bitrate).toBe(5000000)
      expect(domainFile.proxy?.codec).toBe(MediaCodec.Unknown)
    })

    it("should handle timeline integration fields", () => {
      const featureFile: FeatureMediaFile = {
        id: "video-5",
        name: "timeline-test.mp4",
        path: "/test/timeline.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1024 * 1024,
        isAddedToTimeline: true,
        isIncluded: true,
        isUnavailable: false,
        lastCheckedAt: "2024-01-01T00:00:00Z",
        isLoadingMetadata: false,
        source: "browser",
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.isAddedToTimeline).toBe(true)
      expect(domainFile.isIncluded).toBe(true)
      expect(domainFile.isUnavailable).toBe(false)
      expect(domainFile.source).toBe("browser")
    })

    it("should handle missing optional fields", () => {
      const featureFile: FeatureMediaFile = {
        id: "minimal-1",
        name: "minimal.mp4",
        path: "/test/minimal.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1024,
      }

      const domainFile = featureToDomainMediaFile(featureFile)

      expect(domainFile.id).toBe("minimal-1")
      expect(domainFile.width).toBeUndefined()
      expect(domainFile.height).toBeUndefined()
      expect(domainFile.fps).toBeUndefined()
      expect(domainFile.proxy).toBeUndefined()
    })
  })

  describe("domainToFeatureMediaFile", () => {
    it("should convert video with audio", () => {
      const domainFile = {
        id: "video-1",
        name: "test-video.mp4",
        path: "/test/video.mp4",
        type: MediaType.VideoWithAudio,
        duration: 120,
        size: 1024 * 1024 * 50,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        width: 1920,
        height: 1080,
        fps: 30,
      }

      const featureFile = domainToFeatureMediaFile(domainFile)

      expect(featureFile.id).toBe("video-1")
      expect(featureFile.name).toBe("test-video.mp4")
      expect(featureFile.type).toBe(MediaType.VideoWithAudio)
      expect(featureFile.isVideo).toBe(true)
      expect(featureFile.isAudio).toBe(false)
      expect(featureFile.isImage).toBe(false)
    })

    it("should convert audio file", () => {
      const domainFile = {
        id: "audio-1",
        name: "test-audio.mp3",
        path: "/test/audio.mp3",
        type: MediaType.Audio,
        duration: 180,
        size: 1024 * 1024 * 5,
      }

      const featureFile = domainToFeatureMediaFile(domainFile)

      expect(featureFile.isVideo).toBe(false)
      expect(featureFile.isAudio).toBe(true)
      expect(featureFile.isImage).toBe(false)
    })

    it("should convert music file", () => {
      const domainFile = {
        id: "music-1",
        name: "background-music.mp3",
        path: "/test/music.mp3",
        type: MediaType.Music,
        duration: 240,
        size: 1024 * 1024 * 8,
      }

      const featureFile = domainToFeatureMediaFile(domainFile)

      expect(featureFile.isAudio).toBe(true)
      expect(featureFile.type).toBe(MediaType.Music)
    })

    it("should convert image file", () => {
      const domainFile = {
        id: "image-1",
        name: "test-image.jpg",
        path: "/test/image.jpg",
        type: MediaType.StillImage,
        size: 1024 * 1024 * 2,
        width: 3840,
        height: 2160,
      }

      const featureFile = domainToFeatureMediaFile(domainFile)

      expect(featureFile.isImage).toBe(true)
      expect(featureFile.isVideo).toBe(false)
      expect(featureFile.isAudio).toBe(false)
    })

    it("should handle image sequence", () => {
      const domainFile = {
        id: "sequence-1",
        name: "sequence-%04d.png",
        path: "/test/sequence/",
        type: MediaType.ImageSequence,
        size: 1024 * 1024 * 100,
      }

      const featureFile = domainToFeatureMediaFile(domainFile)

      expect(featureFile.isImage).toBe(true)
    })

    it("should convert source field", () => {
      const domainFileBrowser = {
        id: "file-1",
        name: "test.mp4",
        path: "/test/file.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024,
        source: "browser" as const,
      }

      const featureFile1 = domainToFeatureMediaFile(domainFileBrowser)
      expect(featureFile1.source).toBe("browser")

      const domainFileTimeline = {
        ...domainFileBrowser,
        source: "timeline" as const,
      }

      const featureFile2 = domainToFeatureMediaFile(domainFileTimeline)
      expect(featureFile2.source).toBe("timeline")
    })

    it("should handle unknown source", () => {
      const domainFile = {
        id: "file-1",
        name: "test.mp4",
        path: "/test/file.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024,
        source: "other" as any,
      }

      const featureFile = domainToFeatureMediaFile(domainFile)
      expect(featureFile.source).toBeUndefined()
    })

    it("should handle proxy data", () => {
      const domainFile = {
        id: "video-2",
        name: "proxy-test.mp4",
        path: "/test/proxy.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024 * 1024,
        proxy: {
          path: "/test/proxy-low.mp4",
          width: 1280,
          height: 720,
          bitrate: 5000000,
          codec: MediaCodec.H264,
        },
      }

      const featureFile = domainToFeatureMediaFile(domainFile)

      expect(featureFile.proxy).toBeDefined()
      expect(featureFile.proxy?.path).toBe("/test/proxy-low.mp4")
      expect(featureFile.proxy?.width).toBe(1280)
      expect(featureFile.proxy?.height).toBe(720)
      expect(featureFile.proxy?.bitrate).toBe(5000000)
    })

    it("should handle Date objects and strings for timestamps", () => {
      const domainFile1 = {
        id: "file-1",
        name: "test.mp4",
        path: "/test/file.mp4",
        type: MediaType.Video,
        duration: 60,
        size: 1024,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      }

      const featureFile1 = domainToFeatureMediaFile(domainFile1)
      expect(featureFile1.createdAt).toBeInstanceOf(Date)
      expect(featureFile1.updatedAt).toBeInstanceOf(Date)

      const domainFile2 = {
        ...domainFile1,
        createdAt: "2024-01-01T00:00:00Z" as any,
        updatedAt: "2024-01-02T00:00:00Z" as any,
      }

      const featureFile2 = domainToFeatureMediaFile(domainFile2)
      expect(featureFile2.createdAt).toBeInstanceOf(Date)
      expect(featureFile2.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe("Round-trip conversion", () => {
    it("should preserve data in round-trip conversion", () => {
      const originalFeature: FeatureMediaFile = {
        id: "test-1",
        name: "round-trip.mp4",
        path: "/test/round-trip.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 90,
        size: 1024 * 1024 * 30,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        isAddedToTimeline: true,
        isIncluded: true,
        source: "browser",
        probeData: {
          streams: [
            {
              codec_type: "video",
              width: 1920,
              height: 1080,
              r_frame_rate: "30/1",
            },
          ],
        },
      }

      const domain = featureToDomainMediaFile(originalFeature)
      const backToFeature = domainToFeatureMediaFile(domain)

      expect(backToFeature.id).toBe(originalFeature.id)
      expect(backToFeature.name).toBe(originalFeature.name)
      expect(backToFeature.path).toBe(originalFeature.path)
      expect(backToFeature.isVideo).toBe(originalFeature.isVideo)
      expect(backToFeature.duration).toBe(originalFeature.duration)
      expect(backToFeature.size).toBe(originalFeature.size)
      expect(backToFeature.isAddedToTimeline).toBe(originalFeature.isAddedToTimeline)
      expect(backToFeature.source).toBe(originalFeature.source)
    })
  })

  describe("Edge cases", () => {
    it("should handle undefined duration", () => {
      const featureFile: FeatureMediaFile = {
        id: "image-1",
        name: "image.jpg",
        path: "/test/image.jpg",
        type: "image",
        isVideo: false,
        isAudio: false,
        isImage: true,
        duration: undefined,
        size: 1024,
      }

      const domainFile = featureToDomainMediaFile(featureFile)
      expect(domainFile.duration).toBeUndefined()
    })

    it("should handle empty probeData", () => {
      const featureFile: FeatureMediaFile = {
        id: "file-1",
        name: "test.mp4",
        path: "/test/file.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1024,
        probeData: {},
      }

      const domainFile = featureToDomainMediaFile(featureFile)
      expect(domainFile.width).toBeUndefined()
      expect(domainFile.height).toBeUndefined()
    })

    it("should handle missing timestamps", () => {
      const featureFile: FeatureMediaFile = {
        id: "file-1",
        name: "test.mp4",
        path: "/test/file.mp4",
        type: "video",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
        size: 1024,
      }

      const domainFile = featureToDomainMediaFile(featureFile)
      expect(domainFile.createdAt).toBeUndefined()
      expect(domainFile.updatedAt).toBeUndefined()
    })
  })
})
