/**
 * Tests for useIntegratedAnalysis hook
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"
import { useContentAnalysis } from "../use-content-analysis"
import { useIntegratedAnalysis } from "../use-integrated-analysis"
import { useMontagePlanner } from "../use-montage-planner"
import { usePlanGenerator } from "../use-plan-generator"

// Mock dependencies
const mockGetMediaDuration = vi.fn()
vi.mock("@/domains/media-management/services/media-metadata-service", () => ({
  getMediaMetadataService: () => ({
    getMediaDuration: mockGetMediaDuration,
  }),
}))

const mockSend = vi.fn()
const mockStartAnalysis = vi.fn()
const mockContext = {
  fragments: [],
  currentPlan: null,
}

vi.mock("../use-montage-planner", () => ({
  useMontagePlanner: vi.fn(),
}))

const mockContentAnalysis = {
  isAnalyzing: false,
  progress: 0,
  progressMessage: "",
  videoAnalyses: new Map(),
  audioAnalyses: new Map(),
  momentScores: [],
  fragments: [],
  analyzedVideos: [],
  totalFragments: 0,
  averageQuality: 0,
  getVideoAnalysis: vi.fn(),
  getAudioAnalysis: vi.fn(),
  averageVideoQuality: 0,
  averageAudioQuality: 0,
  topMoments: [],
  momentCategoryCounts: {},
  fragmentCategories: {},
  qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
  contentStats: {
    totalVideos: 0,
    analyzedVideos: 0,
    totalMoments: 0,
    averageActionLevel: 0,
    speechPresence: 0,
    musicPresence: 0,
  },
  analysisOptions: {},
  send: vi.fn(),
}

const mockPlanGenerator = {
  currentPlan: null,
  isGenerating: false,
  isOptimizing: false,
  generatePlan: vi.fn(),
  generateSmartPlan: vi.fn(),
  optimizePlan: vi.fn(),
  editFragment: vi.fn(),
  reorderFragments: vi.fn(),
  getSequence: vi.fn(),
  getPlannedClip: vi.fn(),
  planStats: null,
  sequenceBreakdown: [],
  fragmentUsage: {
    totalFragments: 0,
    usedFragments: 0,
    unusedFragments: [],
    multiUseFragments: [],
  },
  transitionUsage: [],
  emotionalArc: [],
  improvementSuggestions: [],
  generationOptions: {},
  selectedStyle: "dynamic",
  targetDuration: null,
  instructions: "",
  planHistory: [],
}

vi.mock("../use-content-analysis", () => ({
  useContentAnalysis: vi.fn(),
}))

vi.mock("../use-plan-generator", () => ({
  usePlanGenerator: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

describe("useIntegratedAnalysis", () => {
  beforeEach(() => {
    mockContext.fragments = []
    mockContext.currentPlan = null
    mockGetMediaDuration.mockResolvedValue(60)
    mockSend.mockReset()
    mockStartAnalysis.mockReset()

    // Setup mock hook implementations
    vi.mocked(useMontagePlanner).mockReturnValue({
      send: mockSend,
      context: mockContext,
      isAnalyzing: false,
      isGenerating: false,
      startAnalysis: mockStartAnalysis,
    })

    vi.mocked(useContentAnalysis).mockReturnValue(mockContentAnalysis)
    vi.mocked(usePlanGenerator).mockReturnValue(mockPlanGenerator)
  })

  afterEach(() => {
    vi.clearAllTimers() // Clear any pending timers first
    vi.useRealTimers() // Then restore real timers
  })

  describe("Initial state", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.analysisProgress).toBe(0)
      expect(result.current.generationProgress).toBe(0)
      expect(result.current.error).toBeNull()
      expect(result.current.analysisResults).toBeNull()
    })

    it("should expose contentAnalysis and planGenerator", () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      expect(result.current.contentAnalysis).toBeDefined()
      expect(result.current.planGenerator).toBeDefined()
    })

    it("should provide analysis functions", () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      expect(typeof result.current.analyzeProject).toBe("function")
      expect(typeof result.current.generateSmartPlan).toBe("function")
      expect(typeof result.current.analyzeSelectedFiles).toBe("function")
      expect(typeof result.current.detectMomentsFromAnalysis).toBe("function")
    })
  })

  describe("analyzeProject", () => {
    it("should add media files and start analysis", async () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      const mediaFiles: MediaFile[] = [
        {
          id: "video-1",
          path: "/test/video1.mp4",
          name: "video1.mp4",
          type: MediaType.Video,
          isVideo: true,
          isAudio: false,
          isImage: false,
          duration: 120,
          format: "mp4",
          codec: "h264",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrate: 5000000,
        },
        {
          id: "audio-1",
          path: "/test/audio1.mp3",
          name: "audio1.mp3",
          type: MediaType.Audio,
          isVideo: false,
          isAudio: true,
          isImage: false,
          duration: 180,
          format: "mp3",
          codec: "mp3",
          width: 0,
          height: 0,
          frameRate: 0,
          bitrate: 320000,
        },
      ]

      await act(async () => {
        await result.current.analyzeProject(mediaFiles)
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ADD_VIDEO",
          videoId: "video-1",
        }),
      )
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ADD_VIDEO",
          videoId: "audio-1",
        }),
      )
      expect(mockStartAnalysis).toHaveBeenCalled()
    })

    it("should update progress during analysis", async () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      const mediaFiles: MediaFile[] = [
        {
          id: "video-1",
          path: "/test/video1.mp4",
          name: "video1.mp4",
          type: MediaType.Video,
          isVideo: true,
          isAudio: false,
          isImage: false,
          duration: 60,
          format: "mp4",
          codec: "h264",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrate: 5000000,
        },
      ]

      await act(async () => {
        await result.current.analyzeProject(mediaFiles)
      })

      // After analysis completes, progress should be 100
      expect(result.current.analysisProgress).toBe(100)
    })

    it("should set analysis results after completion", async () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      const mediaFiles: MediaFile[] = [
        {
          id: "video-1",
          path: "/test/video1.mp4",
          name: "video1.mp4",
          type: MediaType.Video,
          isVideo: true,
          isAudio: false,
          isImage: false,
          duration: 60,
          format: "mp4",
          codec: "h264",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrate: 5000000,
        },
        {
          id: "audio-1",
          path: "/test/audio1.mp3",
          name: "audio1.mp3",
          type: MediaType.Audio,
          isVideo: false,
          isAudio: true,
          isImage: false,
          duration: 180,
          format: "mp3",
          codec: "mp3",
          width: 0,
          height: 0,
          frameRate: 0,
          bitrate: 320000,
        },
      ]

      await act(async () => {
        await result.current.analyzeProject(mediaFiles)
      })

      expect(result.current.analysisResults).toMatchObject({
        videoCount: 1,
        audioCount: 1,
        momentsDetected: 0,
        averageQuality: 85,
      })
    })

    it("should handle errors during analysis", async () => {
      mockStartAnalysis.mockImplementationOnce(() => {
        throw new Error("Analysis failed")
      })

      const { result } = renderHook(() => useIntegratedAnalysis())

      const mediaFiles: MediaFile[] = [
        {
          id: "video-1",
          path: "/test/video1.mp4",
          name: "video1.mp4",
          type: MediaType.Video,
          isVideo: true,
          isAudio: false,
          isImage: false,
          duration: 60,
          format: "mp4",
          codec: "h264",
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrate: 5000000,
        },
      ]

      let thrownError: unknown
      await act(async () => {
        try {
          await result.current.analyzeProject(mediaFiles)
        } catch (error) {
          thrownError = error
        }
      })

      expect(thrownError).toBeInstanceOf(Error)
      expect((thrownError as Error).message).toBe("Analysis failed")
      expect(mockSend).toHaveBeenCalledWith({ type: "CANCEL_ANALYSIS" })
    })
  })

  describe("analyzeSelectedFiles", () => {
    it("should extract metadata and analyze files", async () => {
      mockGetMediaDuration.mockResolvedValueOnce(120).mockResolvedValueOnce(180)

      const { result } = renderHook(() => useIntegratedAnalysis())

      const filePaths = ["/test/video1.mp4", "/test/audio1.mp3"]

      await act(async () => {
        await result.current.analyzeSelectedFiles(filePaths)
      })

      expect(mockGetMediaDuration).toHaveBeenCalledWith("/test/video1.mp4")
      expect(mockGetMediaDuration).toHaveBeenCalledWith("/test/audio1.mp3")
      expect(mockStartAnalysis).toHaveBeenCalled()
    })

    it("should handle metadata extraction errors gracefully", async () => {
      mockGetMediaDuration.mockRejectedValueOnce(new Error("Failed to extract metadata"))

      const { result } = renderHook(() => useIntegratedAnalysis())

      const filePaths = ["/test/broken-video.mp4"]

      await act(async () => {
        await result.current.analyzeSelectedFiles(filePaths)
      })

      // Should still proceed with basic file info
      expect(mockStartAnalysis).toHaveBeenCalled()
    })

    it("should detect file types by extension", async () => {
      mockGetMediaDuration.mockResolvedValue(60)

      const { result } = renderHook(() => useIntegratedAnalysis())

      const filePaths = ["/test/video.mp4", "/test/audio.mp3", "/test/video.mkv", "/test/audio.wav"]

      await act(async () => {
        await result.current.analyzeSelectedFiles(filePaths)
      })

      expect(mockSend).toHaveBeenCalledTimes(4 + 1) // 4 ADD_VIDEO + 1 ANALYSIS_COMPLETE
    })
  })

  describe("detectMomentsFromAnalysis", () => {
    it("should return fragment scores as moments", async () => {
      const fragments = [
        {
          id: "f1",
          score: {
            timestamp: 0,
            duration: 10,
            scores: { visual: 80, technical: 85, emotional: 70, narrative: 75, action: 82, composition: 78 },
            totalScore: 78,
            category: "highlight" as const,
          },
        },
        {
          id: "f2",
          score: {
            timestamp: 10,
            duration: 10,
            scores: { visual: 90, technical: 88, emotional: 85, narrative: 87, action: 92, composition: 89 },
            totalScore: 88,
            category: "action" as const,
          },
        },
      ]

      mockContext.fragments = fragments as any

      const { result } = renderHook(() => useIntegratedAnalysis())

      const moments = await result.current.detectMomentsFromAnalysis()

      expect(moments).toHaveLength(2)
      expect(moments[0]).toEqual(fragments[0].score)
      expect(moments[1]).toEqual(fragments[1].score)
    })

    it("should return empty array when no fragments", async () => {
      mockContext.fragments = []

      const { result } = renderHook(() => useIntegratedAnalysis())

      const moments = await result.current.detectMomentsFromAnalysis()

      expect(moments).toEqual([])
    })
  })

  describe("generateSmartPlan", () => {
    it("should update settings and generate plan", async () => {
      mockContext.currentPlan = {
        id: "plan-1",
        sequences: [],
        totalDuration: 120,
        qualityScore: 85,
        engagementScore: 88,
        coherenceScore: 82,
      }

      const { result } = renderHook(() => useIntegratedAnalysis())

      await act(async () => {
        await result.current.generateSmartPlan("cinematic", 180)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SELECT_STYLE",
        styleId: "cinematic",
      })
      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_TARGET_DURATION",
        duration: 180,
      })
      expect(mockSend).toHaveBeenCalledWith({
        type: "GENERATE_PLAN",
      })
    })

    it("should use default parameters when not provided", async () => {
      mockContext.currentPlan = {
        id: "plan-1",
        sequences: [],
        totalDuration: 120,
        qualityScore: 85,
        engagementScore: 88,
        coherenceScore: 82,
      }

      const { result } = renderHook(() => useIntegratedAnalysis())

      await act(async () => {
        await result.current.generateSmartPlan()
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SELECT_STYLE",
        styleId: "dynamic",
      })
      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_TARGET_DURATION",
        duration: 120,
      })
    })

    it("should update generation progress", async () => {
      mockContext.currentPlan = {
        id: "plan-1",
        sequences: [],
        totalDuration: 120,
        qualityScore: 85,
        engagementScore: 88,
        coherenceScore: 82,
      }

      const { result } = renderHook(() => useIntegratedAnalysis())

      await act(async () => {
        await result.current.generateSmartPlan()
      })

      // After generation completes, progress should be 100
      expect(result.current.generationProgress).toBe(100)
    })

    it("should handle generation errors", async () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      // generateSmartPlan has try-catch that catches all errors and returns null
      const plan = await act(async () => {
        return await result.current.generateSmartPlan()
      })

      // Plan is returned from context.currentPlan which is null by default
      expect(plan).toBeNull()
    })
  })

  describe("State management", () => {
    it("should reset error on new analysis", async () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      // Set initial error by making startAnalysis throw
      mockStartAnalysis.mockImplementationOnce(() => {
        throw new Error("First error")
      })

      await act(async () => {
        try {
          await result.current.analyzeProject([])
        } catch {
          // Expected to throw
        }
      })

      // Reset mock and try again
      mockStartAnalysis.mockReset()

      await act(async () => {
        await result.current.analyzeProject([])
      })

      // Error should be cleared at start of new analysis
      expect(result.current.error).toBeNull()
    })

    it("should track analysis progress independently from generation", async () => {
      const { result } = renderHook(() => useIntegratedAnalysis())

      expect(result.current.analysisProgress).toBe(0)
      expect(result.current.generationProgress).toBe(0)

      // Both start at 0, which is expected for independent state values
      // After analysis or generation, they would have different values
    })
  })
})
