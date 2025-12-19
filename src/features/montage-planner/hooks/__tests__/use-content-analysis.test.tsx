/**
 * Tests for useContentAnalysis hook
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AudioAnalysis, Fragment, MomentScore, VideoAnalysis } from "../../types"
import { CameraMovement, EmotionalTone, FlowDirection, LightingCondition, MomentCategory, SceneType } from "../../types"

// Mock useMontagePlanner hook
const mockSend = vi.fn()
const mockContext = {
  mediaFiles: new Map(),
  fragments: [] as Fragment[],
  videoIds: [] as string[],
  videoAnalyses: new Map<string, VideoAnalysis>(),
  audioAnalyses: new Map<string, AudioAnalysis>(),
  momentScores: [] as MomentScore[],
  analysisOptions: {},
}

vi.mock("../use-montage-planner", () => ({
  useMontagePlanner: () => ({
    context: mockContext,
    isAnalyzing: false,
    progress: 0,
    progressMessage: "",
    send: mockSend,
  }),
}))

describe("useContentAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext.videoAnalyses.clear()
    mockContext.audioAnalyses.clear()
    mockContext.momentScores = []
    mockContext.fragments = []
    mockContext.videoIds = []
  })

  describe("Initial state", () => {
    it("should provide empty analyses initially", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.videoAnalyses).toBeInstanceOf(Map)
      expect(result.current.audioAnalyses).toBeInstanceOf(Map)
      expect(result.current.momentScores).toEqual([])
      expect(result.current.fragments).toEqual([])
    })

    it("should expose analysis state", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(typeof result.current.isAnalyzing).toBe("boolean")
      expect(typeof result.current.progress).toBe("number")
      expect(typeof result.current.progressMessage).toBe("string")
    })

    it("should provide send function", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.send).toBe(mockSend)
    })
  })

  describe("Video analysis retrieval", () => {
    it("should get video analysis by ID", async () => {
      const mockVideoAnalysis: VideoAnalysis = {
        quality: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          bitrate: 5000000,
          sharpness: 85,
          stability: 90,
          exposure: -5,
          colorGrading: 80,
        },
        content: {
          actionLevel: 70,
          faces: [{ box: [0, 0, 100, 100], confidence: 0.95 }],
          objects: [
            { label: "person", confidence: 0.9, box: [0, 0, 100, 100] },
            { label: "car", confidence: 0.85, box: [100, 100, 200, 200] },
          ],

          sceneType: SceneType.Outdoor,
          lighting: LightingCondition.Bright,
        },
        motion: {
          cameraMovement: CameraMovement.Pan,
          subjectMovement: 70,
          flowDirection: FlowDirection.LeftToRight,
          cutFriendliness: 85,
        },
      }

      mockContext.videoAnalyses.set("video-1", mockVideoAnalysis)

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      const analysis = result.current.getVideoAnalysis("video-1")

      expect(analysis).toEqual(mockVideoAnalysis)
    })

    it("should return undefined for non-existent video", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      const analysis = result.current.getVideoAnalysis("non-existent")

      expect(analysis).toBeUndefined()
    })
  })

  describe("Audio analysis retrieval", () => {
    it("should get audio analysis by ID", async () => {
      const mockAudioAnalysis: AudioAnalysis = {
        quality: {
          sampleRate: 48000,
          bitDepth: 16,
          noiseLevel: 15,
          clarity: 85,
          dynamicRange: 60,
        },
        content: {
          speechPresence: 80,
          musicPresence: 60,
          ambientLevel: 30,
          emotionalTone: EmotionalTone.Energetic,
        },
      }

      mockContext.audioAnalyses.set("video-1", mockAudioAnalysis)

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      const analysis = result.current.getAudioAnalysis("video-1")

      expect(analysis).toEqual(mockAudioAnalysis)
    })

    it("should return undefined for non-existent audio", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      const analysis = result.current.getAudioAnalysis("non-existent")

      expect(analysis).toBeUndefined()
    })
  })

  describe("Average video quality calculation", () => {
    it("should calculate average video quality from analyses", async () => {
      const analysis1: VideoAnalysis = {
        quality: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          bitrate: 5000000,
          sharpness: 80,
          stability: 90,
          exposure: -10, // will be normalized to (100 + (-10)) / 2 = 45
          colorGrading: 70,
        },
        content: {
          actionLevel: 50,
          faces: [],
          objects: [],
          sceneType: SceneType.Indoor,
          lighting: LightingCondition.Normal,
        },
        motion: {
          cameraMovement: CameraMovement.Static,
          subjectMovement: 20,
          flowDirection: FlowDirection.Center,
          cutFriendliness: 75,
        },
      }

      const analysis2: VideoAnalysis = {
        quality: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          bitrate: 5000000,
          sharpness: 90,
          stability: 85,
          exposure: 0, // will be normalized to (100 + 0) / 2 = 50
          colorGrading: 80,
        },
        content: {
          actionLevel: 60,
          faces: [{ box: [0, 0, 100, 100], confidence: 0.9 }],
          objects: [
            { label: "person", confidence: 0.85, box: [0, 0, 100, 100] },
            { label: "car", confidence: 0.8, box: [100, 100, 200, 200] },
            { label: "tree", confidence: 0.75, box: [200, 200, 300, 300] },
          ],

          sceneType: SceneType.Outdoor,
          lighting: LightingCondition.Bright,
        },
        motion: {
          cameraMovement: CameraMovement.Pan,
          subjectMovement: 60,
          flowDirection: FlowDirection.LeftToRight,
          cutFriendliness: 80,
        },
      }

      mockContext.videoAnalyses.set("video-1", analysis1)
      mockContext.videoAnalyses.set("video-2", analysis2)

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      // Quality = (sharpness + stability + (100 + exposure) / 2 + colorGrading) / 4
      // Video 1: (80 + 90 + 45 + 70) / 4 = 71.25
      // Video 2: (90 + 85 + 50 + 80) / 4 = 76.25
      // Average: (71.25 + 76.25) / 2 = 73.75
      expect(result.current.averageVideoQuality).toBeCloseTo(73.75, 1)
    })

    it("should return 0 when no video analyses", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.averageVideoQuality).toBe(0)
    })
  })

  describe("Average audio quality calculation", () => {
    it("should calculate average audio quality from analyses", async () => {
      const analysis1: AudioAnalysis = {
        quality: {
          sampleRate: 48000,
          bitDepth: 16,
          noiseLevel: 20,
          clarity: 80,
          dynamicRange: 50,
        },
        content: {
          speechPresence: 70,
          musicPresence: 50,
          ambientLevel: 20,
          emotionalTone: EmotionalTone.Calm,
        },
      }

      const analysis2: AudioAnalysis = {
        quality: {
          sampleRate: 48000,
          bitDepth: 16,
          noiseLevel: 10,
          clarity: 90,
          dynamicRange: 60,
        },
        content: {
          speechPresence: 80,
          musicPresence: 60,
          ambientLevel: 15,
          emotionalTone: EmotionalTone.Energetic,
        },
      }

      mockContext.audioAnalyses.set("video-1", analysis1)
      mockContext.audioAnalyses.set("video-2", analysis2)

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      // Quality = (clarity + (100 - noiseLevel)) / 2
      // Audio 1: (80 + 80) / 2 = 80
      // Audio 2: (90 + 90) / 2 = 90
      // Average: (80 + 90) / 2 = 85
      expect(result.current.averageAudioQuality).toBe(85)
    })

    it("should return 0 when no audio analyses", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.averageAudioQuality).toBe(0)
    })
  })

  describe("Top moments calculation", () => {
    it("should return top 10 moments from momentScores", async () => {
      const moments: MomentScore[] = Array.from({ length: 15 }, (_, i) => ({
        timestamp: i * 10,
        duration: 5,
        scores: {
          visual: 80 + i,
          technical: 75 + i,
          emotional: 70 + i,
          narrative: 85 + i,
          action: 90 + i,
          composition: 80 + i,
        },
        totalScore: 80 + i,
        category: MomentCategory.Highlight,
      }))

      mockContext.momentScores = moments

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.topMoments).toHaveLength(10)
      expect(result.current.topMoments[0].totalScore).toBe(94) // highest score
      expect(result.current.topMoments[9].totalScore).toBe(85) // 10th highest
    })

    it("should fallback to fragments when no momentScores", async () => {
      const fragments: Fragment[] = [
        {
          id: "f1",
          videoId: "v1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          score: {
            timestamp: 0,
            duration: 10,
            scores: {
              visual: 95,
              technical: 90,
              emotional: 85,
              narrative: 88,
              action: 92,
              composition: 90,
            },
            totalScore: 90,
            category: MomentCategory.Highlight,
          },
          tags: [],
          objects: [],
          people: [],
        },
        {
          id: "f2",
          videoId: "v1",
          startTime: 10,
          endTime: 20,
          duration: 10,
          score: {
            timestamp: 10,
            duration: 10,
            scores: {
              visual: 80,
              technical: 75,
              emotional: 70,
              narrative: 78,
              action: 82,
              composition: 75,
            },
            totalScore: 75,
            category: MomentCategory.Transition,
          },
          tags: [],
          objects: [],
          people: [],
        },
      ]

      mockContext.fragments = fragments

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.topMoments).toHaveLength(2)
      expect(result.current.topMoments[0].totalScore).toBe(90)
      expect(result.current.topMoments[1].totalScore).toBe(75)
    })

    it("should return empty array when no data", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.topMoments).toEqual([])
    })
  })

  describe("Moment category counts", () => {
    it("should count moments by category", async () => {
      const moments: MomentScore[] = [
        {
          timestamp: 0,
          duration: 5,
          scores: {
            visual: 80,
            technical: 75,
            emotional: 70,
            narrative: 85,
            action: 90,
            composition: 80,
          },
          totalScore: 80,
          category: MomentCategory.Highlight,
        },
        {
          timestamp: 10,
          duration: 5,
          scores: {
            visual: 75,
            technical: 70,
            emotional: 65,
            narrative: 80,
            action: 85,
            composition: 75,
          },
          totalScore: 75,
          category: MomentCategory.Highlight,
        },
        {
          timestamp: 20,
          duration: 5,
          scores: {
            visual: 90,
            technical: 85,
            emotional: 80,
            narrative: 88,
            action: 95,
            composition: 88,
          },
          totalScore: 88,
          category: MomentCategory.Action,
        },
        {
          timestamp: 30,
          duration: 5,
          scores: {
            visual: 70,
            technical: 65,
            emotional: 85,
            narrative: 75,
            action: 60,
            composition: 70,
          },
          totalScore: 71,
          category: MomentCategory.Drama,
        },
      ]

      mockContext.momentScores = moments

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.momentCategoryCounts).toEqual({
        [MomentCategory.Highlight]: 2,
        [MomentCategory.Action]: 1,
        [MomentCategory.Drama]: 1,
      })
    })

    it("should return empty object when no moments", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.momentCategoryCounts).toEqual({})
    })
  })

  describe("Fragment categories", () => {
    it("should count fragments by category", async () => {
      const fragments: Fragment[] = [
        {
          id: "f1",
          videoId: "v1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          score: {
            timestamp: 0,
            duration: 10,
            scores: {
              visual: 90,
              technical: 85,
              emotional: 80,
              narrative: 88,
              action: 92,
              composition: 88,
            },
            totalScore: 88,
            category: MomentCategory.Action,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f2",
          videoId: "v1",
          startTime: 10,
          endTime: 20,
          duration: 10,
          score: {
            timestamp: 10,
            duration: 10,
            scores: {
              visual: 85,
              technical: 80,
              emotional: 75,
              narrative: 83,
              action: 87,
              composition: 83,
            },
            totalScore: 82,
            category: MomentCategory.Action,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f3",
          videoId: "v1",
          startTime: 20,
          endTime: 30,
          duration: 10,
          score: {
            timestamp: 20,
            duration: 10,
            scores: {
              visual: 75,
              technical: 70,
              emotional: 85,
              narrative: 78,
              action: 65,
              composition: 75,
            },
            totalScore: 75,
            category: MomentCategory.Drama,
          },
          objects: [],
          people: [],
          tags: [],
        },
      ]

      mockContext.fragments = fragments

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.fragmentCategories).toEqual({
        [MomentCategory.Action]: 2,
        [MomentCategory.Drama]: 1,
      })
    })
  })

  describe("Quality distribution", () => {
    it("should categorize fragments by quality", async () => {
      const fragments: Fragment[] = [
        {
          id: "f1",
          videoId: "v1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          score: {
            timestamp: 0,
            duration: 10,
            scores: {
              visual: 96,
              technical: 95,
              emotional: 94,
              narrative: 95,
              action: 96,
              composition: 95,
            },
            totalScore: 96,
            category: MomentCategory.Highlight,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f2",
          videoId: "v1",
          startTime: 10,
          endTime: 20,
          duration: 10,
          score: {
            timestamp: 10,
            duration: 10,
            scores: {
              visual: 85,
              technical: 82,
              emotional: 80,
              narrative: 84,
              action: 86,
              composition: 83,
            },
            totalScore: 85,
            category: MomentCategory.Action,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f3",
          videoId: "v1",
          startTime: 20,
          endTime: 30,
          duration: 10,
          score: {
            timestamp: 20,
            duration: 10,
            scores: {
              visual: 65,
              technical: 60,
              emotional: 62,
              narrative: 64,
              action: 66,
              composition: 63,
            },
            totalScore: 65,
            category: MomentCategory.Transition,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f4",
          videoId: "v1",
          startTime: 30,
          endTime: 40,
          duration: 10,
          score: {
            timestamp: 30,
            duration: 10,
            scores: {
              visual: 55,
              technical: 50,
              emotional: 52,
              narrative: 54,
              action: 56,
              composition: 53,
            },
            totalScore: 55,
            category: MomentCategory.BRoll,
          },
          objects: [],
          people: [],
          tags: [],
        },
      ]

      mockContext.fragments = fragments

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.qualityDistribution).toEqual({
        excellent: 1, // >= 95
        good: 1, // >= 80
        fair: 1, // >= 60
        poor: 1, // < 60
      })
    })

    it("should return zeros when no fragments", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.qualityDistribution).toEqual({
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      })
    })
  })

  describe("Content statistics", () => {
    it("should calculate comprehensive content stats", async () => {
      mockContext.videoIds = ["video-1", "video-2"]

      const videoAnalyses = new Map<string, VideoAnalysis>([
        [
          "video-1",
          {
            quality: {
              resolution: { width: 1920, height: 1080 },
              frameRate: 30,
              bitrate: 5000000,
              sharpness: 80,
              stability: 85,
              exposure: 0,
              colorGrading: 75,
            },
            content: {
              actionLevel: 70,
              faces: [
                { box: [0, 0, 100, 100], confidence: 0.9 },
                { box: [100, 100, 200, 200], confidence: 0.85 },
              ],

              objects: [
                { label: "person", confidence: 0.9, box: [0, 0, 100, 100] },
                { label: "car", confidence: 0.85, box: [100, 100, 200, 200] },
                { label: "tree", confidence: 0.8, box: [200, 200, 300, 300] },
                {
                  label: "building",
                  confidence: 0.75,
                  box: [300, 300, 400, 400],
                },
                { label: "dog", confidence: 0.7, box: [400, 400, 500, 500] },
              ],

              sceneType: SceneType.Outdoor,
              lighting: LightingCondition.Bright,
            },
            motion: {
              cameraMovement: CameraMovement.Pan,
              subjectMovement: 60,
              flowDirection: FlowDirection.LeftToRight,
              cutFriendliness: 80,
            },
          },
        ],

        [
          "video-2",
          {
            quality: {
              resolution: { width: 1920, height: 1080 },
              frameRate: 30,
              bitrate: 5000000,
              sharpness: 90,
              stability: 80,
              exposure: -5,
              colorGrading: 85,
            },
            content: {
              actionLevel: 80,
              faces: [{ box: [0, 0, 100, 100], confidence: 0.95 }],
              objects: [
                { label: "person", confidence: 0.95, box: [0, 0, 100, 100] },
                { label: "car", confidence: 0.9, box: [100, 100, 200, 200] },
                { label: "bike", confidence: 0.85, box: [200, 200, 300, 300] },
                { label: "tree", confidence: 0.8, box: [300, 300, 400, 400] },
                {
                  label: "building",
                  confidence: 0.75,
                  box: [400, 400, 500, 500],
                },
                { label: "bench", confidence: 0.7, box: [500, 500, 600, 600] },
                { label: "lamp", confidence: 0.65, box: [600, 600, 700, 700] },
                { label: "sign", confidence: 0.6, box: [700, 700, 800, 800] },
              ],

              sceneType: SceneType.Urban,
              lighting: LightingCondition.Bright,
            },
            motion: {
              cameraMovement: CameraMovement.Dolly,
              subjectMovement: 75,
              flowDirection: FlowDirection.RightToLeft,
              cutFriendliness: 85,
            },
          },
        ],
      ])

      const audioAnalyses = new Map<string, AudioAnalysis>([
        [
          "video-1",
          {
            quality: {
              sampleRate: 48000,
              bitDepth: 16,
              noiseLevel: 15,
              clarity: 85,
              dynamicRange: 55,
            },
            content: {
              speechPresence: 70,
              musicPresence: 50,
              ambientLevel: 25,
              emotionalTone: EmotionalTone.Calm,
            },
          },
        ],

        [
          "video-2",
          {
            quality: {
              sampleRate: 48000,
              bitDepth: 16,
              noiseLevel: 10,
              clarity: 90,
              dynamicRange: 60,
            },
            content: {
              speechPresence: 80,
              musicPresence: 60,
              ambientLevel: 20,
              emotionalTone: EmotionalTone.Energetic,
            },
          },
        ],
      ])

      mockContext.videoAnalyses = videoAnalyses
      mockContext.audioAnalyses = audioAnalyses
      mockContext.momentScores = [{}, {}, {}] as MomentScore[]

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.contentStats).toMatchObject({
        totalVideos: 2,
        analyzedVideos: 2,
        totalMoments: 3,
        averageActionLevel: 75, // (70 + 80) / 2
        speechPresence: 75, // (70 + 80) / 2
        musicPresence: 55, // (50 + 60) / 2
      })
    })

    it("should handle empty analyses gracefully", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.contentStats).toMatchObject({
        totalVideos: 0,
        analyzedVideos: 0,
        totalMoments: 0,
        averageActionLevel: 0,
        speechPresence: 0,
        musicPresence: 0,
      })
    })
  })

  describe("Computed values for tests", () => {
    it("should provide analyzedVideos array", async () => {
      const videoAnalyses = new Map<string, VideoAnalysis>([
        [
          "video-1",
          {
            quality: {
              resolution: { width: 1920, height: 1080 },
              frameRate: 30,
              bitrate: 5000000,
              sharpness: 80,
              stability: 85,
              exposure: 0,
              colorGrading: 75,
            },
            content: {
              actionLevel: 70,
              faces: [
                { box: [0, 0, 100, 100], confidence: 0.9 },
                { box: [100, 100, 200, 200], confidence: 0.85 },
              ],

              objects: [
                { label: "person", confidence: 0.9, box: [0, 0, 100, 100] },
                { label: "car", confidence: 0.85, box: [100, 100, 200, 200] },
                { label: "tree", confidence: 0.8, box: [200, 200, 300, 300] },
                {
                  label: "building",
                  confidence: 0.75,
                  box: [300, 300, 400, 400],
                },
                { label: "dog", confidence: 0.7, box: [400, 400, 500, 500] },
              ],

              sceneType: SceneType.Outdoor,
              lighting: LightingCondition.Bright,
            },
            motion: {
              cameraMovement: CameraMovement.Pan,
              subjectMovement: 60,
              flowDirection: FlowDirection.LeftToRight,
              cutFriendliness: 80,
            },
          },
        ],
      ])

      mockContext.videoAnalyses = videoAnalyses

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.analyzedVideos).toHaveLength(1)
      expect(result.current.analyzedVideos[0]).toEqual(videoAnalyses.get("video-1"))
    })

    it("should provide totalFragments count", async () => {
      mockContext.fragments = [
        {
          id: "f1",
          videoId: "v1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          score: {
            timestamp: 0,
            duration: 10,
            scores: {
              visual: 80,
              technical: 75,
              emotional: 70,
              narrative: 85,
              action: 90,
              composition: 80,
            },
            totalScore: 80,
            category: MomentCategory.Highlight,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f2",
          videoId: "v1",
          startTime: 10,
          endTime: 20,
          duration: 10,
          score: {
            timestamp: 10,
            duration: 10,
            scores: {
              visual: 85,
              technical: 80,
              emotional: 75,
              narrative: 83,
              action: 87,
              composition: 83,
            },
            totalScore: 82,
            category: MomentCategory.Action,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f3",
          videoId: "v1",
          startTime: 20,
          endTime: 30,
          duration: 10,
          score: {
            timestamp: 20,
            duration: 10,
            scores: {
              visual: 75,
              technical: 70,
              emotional: 65,
              narrative: 78,
              action: 82,
              composition: 75,
            },
            totalScore: 75,
            category: MomentCategory.Transition,
          },
          objects: [],
          people: [],
          tags: [],
        },
      ] as Fragment[]

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.totalFragments).toBe(3)
    })

    it("should calculate averageQuality from fragments", async () => {
      const fragments: Fragment[] = [
        {
          id: "f1",
          videoId: "v1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          score: {
            timestamp: 0,
            duration: 10,
            scores: {
              visual: 80,
              technical: 75,
              emotional: 70,
              narrative: 85,
              action: 90,
              composition: 80,
            },
            totalScore: 80,
            category: MomentCategory.Highlight,
          },
          objects: [],
          people: [],
          tags: [],
        },
        {
          id: "f2",
          videoId: "v1",
          startTime: 10,
          endTime: 20,
          duration: 10,
          score: {
            timestamp: 10,
            duration: 10,
            scores: {
              visual: 90,
              technical: 85,
              emotional: 80,
              narrative: 88,
              action: 92,
              composition: 88,
            },
            totalScore: 90,
            category: MomentCategory.Action,
          },
          objects: [],
          people: [],
          tags: [],
        },
      ]

      mockContext.fragments = fragments

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.averageQuality).toBe(85) // (80 + 90) / 2
    })

    it("should return 0 averageQuality when no fragments", async () => {
      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.averageQuality).toBe(0)
    })
  })

  describe("Analysis options", () => {
    it("should expose analysisOptions from context", async () => {
      mockContext.analysisOptions = { quality_threshold: 0.8 }

      const { useContentAnalysis } = await import("../use-content-analysis")
      const { result } = renderHook(() => useContentAnalysis())

      expect(result.current.analysisOptions).toEqual({
        quality_threshold: 0.8,
      })
    })
  })
})
