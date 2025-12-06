/**
 * Tests for media file converter utilities
 */

import { describe, expect, it } from "vitest"
import type { MediaFile } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"
import type { Fragment } from "../../types"
import { MomentCategory } from "../../types"
import { convertFragmentForAIServices, convertToAIServicesMediaFile } from "../media-file-converter"

describe("media-file-converter", () => {
  describe("convertToAIServicesMediaFile", () => {
    it("should convert video MediaFile correctly", () => {
      const featureMediaFile: MediaFile = {
        id: "video-1",
        path: "/test/videos/sample.mp4",
        name: "sample.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 10485760, // 10MB
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
        probeData: {
          format: {
            format_name: "mov,mp4,m4a,3gp,3g2,mj2",
            duration: 120,
            size: 10485760,
            bit_rate: 5000000,
          },
          streams: [],
        },
      }

      const result = convertToAIServicesMediaFile(featureMediaFile)

      expect(result).toEqual({
        id: "video-1",
        path: "/test/videos/sample.mp4",
        filename: "sample.mp4",
        size: 10485760,
        type: "video",
        duration: 120,
        format: "mov,mp4,m4a,3gp,3g2,mj2",
      })
    })

    it("should convert audio MediaFile correctly", () => {
      const featureMediaFile: MediaFile = {
        id: "audio-1",
        path: "/test/audio/track.mp3",
        name: "track.mp3",
        type: MediaType.Audio,
        isVideo: false,
        isAudio: true,
        isImage: false,
        size: 5242880, // 5MB
        duration: 180,
        bitrate: 320000,
      }

      const result = convertToAIServicesMediaFile(featureMediaFile)

      expect(result).toEqual({
        id: "audio-1",
        path: "/test/audio/track.mp3",
        filename: "track.mp3",
        size: 5242880,
        type: "audio",
        duration: 180,
        format: undefined,
      })
    })

    it("should convert image MediaFile correctly", () => {
      const featureMediaFile: MediaFile = {
        id: "image-1",
        path: "/test/images/photo.jpg",
        name: "photo.jpg",
        type: MediaType.StillImage,
        isVideo: false,
        isAudio: false,
        isImage: true,
        size: 2097152, // 2MB
        duration: 0,
        width: 4000,
        height: 3000,
      }

      const result = convertToAIServicesMediaFile(featureMediaFile)

      expect(result).toEqual({
        id: "image-1",
        path: "/test/images/photo.jpg",
        filename: "photo.jpg",
        size: 2097152,
        type: "image",
        duration: 0,
        format: undefined,
      })
    })

    it("should handle missing size field", () => {
      const featureMediaFile: MediaFile = {
        id: "video-2",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: undefined as any,
        duration: 60,
        width: 1280,
        height: 720,
        fps: 30,
        bitrate: 2000000,
      }

      const result = convertToAIServicesMediaFile(featureMediaFile)

      expect(result.size).toBe(0)
    })

    it("should prioritize isVideo flag for type determination", () => {
      const featureMediaFile: MediaFile = {
        id: "video-3",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: true, // Both flags set, should choose video
        isImage: false,
        size: 1000000,
        duration: 30,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
      }

      const result = convertToAIServicesMediaFile(featureMediaFile)

      expect(result.type).toBe("video")
    })

    it("should extract format from probeData when available", () => {
      const featureMediaFile: MediaFile = {
        id: "video-4",
        path: "/test/video.mkv",
        name: "video.mkv",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 15000000,
        duration: 90,
        width: 3840,
        height: 2160,
        fps: 60,
        bitrate: 10000000,
        probeData: {
          format: {
            format_name: "matroska,webm",
            duration: 90,
            size: 15000000,
            bit_rate: 10000000,
          },
          streams: [],
        },
      }

      const result = convertToAIServicesMediaFile(featureMediaFile)

      expect(result.format).toBe("matroska,webm")
    })
  })

  describe("convertFragmentForAIServices", () => {
    it("should convert fragment with score to AI services format", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-1",
        videoId: "video-1",
        startTime: 10,
        endTime: 20,
        duration: 10,
        objects: ["person", "car"],
        people: [{ id: "p1", name: "John Doe", confidence: 0.9 }],
        score: {
          timestamp: 10,
          duration: 10,
          scores: {
            visual: 85,
            technical: 90,
            emotional: 75,
            narrative: 80,
            action: 88,
            composition: 82,
          },
          totalScore: 83,
          category: MomentCategory.Action,
        },
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result).toMatchObject({
        id: "fragment-1",
        videoId: "video-1",
        startTime: 10,
        endTime: 20,
        duration: 10,
        objects: ["person", "car"],
        people: [{ id: "p1", name: "John Doe", confidence: 0.9 }],
      })

      expect(result.analysis).toBeDefined()
      expect(result.analysis?.quality).toBeCloseTo(0.9, 1) // technical / 100
      expect(result.analysis?.motion).toBeCloseTo(0.88, 1) // action / 100
      expect(result.analysis?.colorfulness).toBeCloseTo(0.85, 1) // visual / 100
      expect(result.analysis?.sharpness).toBeCloseTo(0.9, 1) // technical / 100
      expect(result.analysis?.visualComplexity).toBeCloseTo(0.82, 1) // composition / 100
      expect(result.analysis?.objectsOfInterest).toEqual(["person", "car"])
    })

    it("should provide default analysis when no score", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-2",
        videoId: "video-1",
        startTime: 0,
        endTime: 5,
        duration: 5,
        objects: [],
        people: [],
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.analysis).toEqual({
        quality: 0.8,
        motion: 0.5,
        faceCount: 0,
        objectsOfInterest: [],
        audioQuality: 0.8,
        duration: 5,
        brightnessVariation: 0.5,
        colorfulness: 0.7,
        sharpness: 0.8,
        contrast: 0.7,
        visualComplexity: 0.6,
        audioLoudness: -20,
        speechPresence: false,
      })
    })

    it("should convert sourceFile when present", () => {
      const sourceFile: MediaFile = {
        id: "source-1",
        path: "/test/source.mp4",
        name: "source.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 5000000,
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
      }

      const featureFragment: Partial<Fragment> = {
        id: "fragment-3",
        videoId: "video-1",
        startTime: 5,
        endTime: 15,
        duration: 10,
        sourceFile: sourceFile as any,
        objects: [],
        people: [],
        score: {
          timestamp: 5,
          duration: 10,
          scores: {
            visual: 80,
            technical: 85,
            emotional: 70,
            narrative: 75,
            action: 82,
            composition: 78,
          },
          totalScore: 78,
          category: MomentCategory.Highlight,
        },
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.sourceFile).toBeDefined()
      expect(result.sourceFile?.id).toBe("source-1")
      expect(result.sourceFile?.path).toBe("/test/source.mp4")
      expect(result.sourceFile?.filename).toBe("source.mp4")
      expect(result.sourceFile?.type).toBe("video")
    })

    it("should handle fragment with minimal data", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-4",
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result).toMatchObject({
        id: "fragment-4",
        videoId: undefined,
        startTime: undefined,
        endTime: undefined,
        duration: undefined,
        objects: [],
        people: [],
      })

      expect(result.analysis).toBeDefined()
      expect(result.analysis?.duration).toBe(0)
    })

    it("should use fragment duration in analysis", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-5",
        duration: 25,
        score: {
          timestamp: 0,
          duration: 25,
          scores: {
            visual: 80,
            technical: 85,
            emotional: 70,
            narrative: 75,
            action: 82,
            composition: 78,
          },
          totalScore: 78,
          category: MomentCategory.Highlight,
        },
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.analysis?.duration).toBe(25)
    })

    it("should handle objects array correctly", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-6",
        objects: ["tree", "building", "sky"],
        people: [],
        score: {
          timestamp: 0,
          duration: 10,
          scores: {
            visual: 80,
            technical: 85,
            emotional: 70,
            narrative: 75,
            action: 82,
            composition: 78,
          },
          totalScore: 78,
          category: MomentCategory.BRoll,
        },
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.objects).toEqual(["tree", "building", "sky"])
      expect(result.analysis?.objectsOfInterest).toEqual(["tree", "building", "sky"])
    })

    it("should set default empty arrays for missing objects and people", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-7",
        videoId: "video-1",
        startTime: 0,
        endTime: 10,
        duration: 10,
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.objects).toEqual([])
      expect(result.people).toEqual([])
    })
  })

  describe("Edge cases", () => {
    it("should handle null/undefined safely in convertToAIServicesMediaFile", () => {
      const mediaFile: MediaFile = {
        id: "test",
        path: "/test.mp4",
        name: "test.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 0,
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        bitrate: 0,
        probeData: undefined,
      }

      const result = convertToAIServicesMediaFile(mediaFile)

      expect(result).toMatchObject({
        id: "test",
        path: "/test.mp4",
        filename: "test.mp4",
        type: "video",
        size: 0,
        duration: 0,
        format: undefined,
      })
    })

    it("should handle empty strings in media file", () => {
      const mediaFile: MediaFile = {
        id: "",
        path: "",
        name: "",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        isImage: false,
        size: 0,
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        bitrate: 0,
      }

      const result = convertToAIServicesMediaFile(mediaFile)

      expect(result.id).toBe("")
      expect(result.path).toBe("")
      expect(result.filename).toBe("")
    })

    it("should handle fragment with all score values at zero", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-zero",
        score: {
          timestamp: 0,
          duration: 10,
          scores: {
            visual: 0,
            technical: 0,
            emotional: 0,
            narrative: 0,
            action: 0,
            composition: 0,
          },
          totalScore: 0,
          category: MomentCategory.Transition,
        },
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.analysis?.quality).toBe(0)
      expect(result.analysis?.motion).toBe(0)
      expect(result.analysis?.colorfulness).toBe(0)
      expect(result.analysis?.visualComplexity).toBe(0)
    })

    it("should handle fragment with max score values", () => {
      const featureFragment: Partial<Fragment> = {
        id: "fragment-max",
        score: {
          timestamp: 0,
          duration: 10,
          scores: {
            visual: 100,
            technical: 100,
            emotional: 100,
            narrative: 100,
            action: 100,
            composition: 100,
          },
          totalScore: 100,
          category: MomentCategory.Highlight,
        },
      }

      const result = convertFragmentForAIServices(featureFragment)

      expect(result.analysis?.quality).toBe(1)
      expect(result.analysis?.motion).toBe(1)
      expect(result.analysis?.colorfulness).toBe(1)
      expect(result.analysis?.visualComplexity).toBe(1)
    })
  })
})
