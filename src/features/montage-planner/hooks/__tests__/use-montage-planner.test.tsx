/**
 * Tests for useMontagePlanner hook
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"
import { ExportFormat, MONTAGE_STYLES } from "../../types"
import { useMontagePlanner } from "../use-montage-planner"

// Mock the provider context
const mockSend = vi.fn()
const mockContext = {
  mediaFiles: new Map(),
  fragments: [],
  videoIds: [],
  currentPlan: null,
  instructions: "",
  selectedStyle: "dynamic",
  targetDuration: null,
  error: null,
  planValidation: null,
  planStatistics: null,
  videoAnalyses: new Map(),
  audioAnalyses: new Map(),
  momentScores: [],
  analysisOptions: {},
  generationOptions: {},
  planHistory: [],
}

vi.mock("../../services/montage-planner-provider", () => ({
  useMontagePlanner: () => ({
    state: { value: "idle", context: mockContext },
    send: mockSend,
    isAnalyzing: false,
    isGenerating: false,
    isOptimizing: false,
    hasVideos: false,
    hasFragments: false,
    hasPlan: false,
    canGeneratePlan: false,
    canOptimizePlan: false,
    progress: 0,
    progressMessage: "",
  }),
}))

// Mock converters
vi.mock("../../utils/media-file-converter", () => ({
  convertToAIServicesMediaFile: (file: MediaFile) => ({
    id: file.id,
    path: file.path,
    filename: file.name,
    size: file.size || 0,
    type: file.isVideo ? "video" : file.isAudio ? "audio" : "image",
    duration: file.duration,
  }),
  convertFragmentForAIServices: (fragment: any) => fragment,
}))

describe("useMontagePlanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial state", () => {
    it("should return default context", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.context.mediaFiles).toBeInstanceOf(Map)
      expect(result.current.context.fragments).toEqual([])
      expect(result.current.context.videoIds).toEqual([])
      expect(result.current.context.currentPlan).toBeNull()
    })

    it("should provide all status flags", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(typeof result.current.isAnalyzing).toBe("boolean")
      expect(typeof result.current.isGenerating).toBe("boolean")
      expect(typeof result.current.isOptimizing).toBe("boolean")
      expect(typeof result.current.hasVideos).toBe("boolean")
      expect(typeof result.current.hasFragments).toBe("boolean")
      expect(typeof result.current.hasPlan).toBe("boolean")
      expect(typeof result.current.canGeneratePlan).toBe("boolean")
      expect(typeof result.current.canOptimizePlan).toBe("boolean")
    })

    it("should calculate isBusy correctly", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.isBusy).toBe(false)

      // Would be true if any of analyzing/generating/optimizing is true
      expect(result.current.isBusy).toBe(
        result.current.isAnalyzing || result.current.isGenerating || result.current.isOptimizing,
      )
    })

    it("should calculate isReady correctly", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.isReady).toBe(false)

      // Would be true if hasFragments and not busy
      expect(result.current.isReady).toBe(result.current.hasFragments && !result.current.isBusy)
    })
  })

  describe("Video management", () => {
    it("should call send with ADD_VIDEO event", () => {
      const { result } = renderHook(() => useMontagePlanner())

      const testFile: MediaFile = {
        id: "video-1",
        path: "/test/video.mp4",
        name: "video.mp4",
        type: MediaType.Video,
        isVideo: true,
        isAudio: false,
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
      }

      act(() => {
        result.current.addVideo("video-1", testFile)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "ADD_VIDEO",
        videoId: "video-1",
        file: expect.objectContaining({
          id: "video-1",
          path: "/test/video.mp4",
          filename: "video.mp4",
          type: "video",
          duration: 120,
        }),
      })
    })

    it("should call send with REMOVE_VIDEO event", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.removeVideo("video-1")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "REMOVE_VIDEO",
        videoId: "video-1",
      })
    })
  })

  describe("Instructions and settings", () => {
    it("should update instructions", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.updateInstructions("Create dynamic highlights")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_INSTRUCTIONS",
        instructions: "Create dynamic highlights",
      })
    })

    it("should select style", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.selectStyle("cinematic")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SELECT_STYLE",
        styleId: "cinematic",
      })
    })

    it("should set target duration", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.setTargetDuration(120)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "SET_TARGET_DURATION",
        duration: 120,
      })
    })

    it("should update analysis options", () => {
      const { result } = renderHook(() => useMontagePlanner())

      const options = {
        videoAnalysis: { enableSceneDetection: true },
      }

      act(() => {
        result.current.updateAnalysisOptions(options)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_ANALYSIS_OPTIONS",
        options,
      })
    })

    it("should update generation options", () => {
      const { result } = renderHook(() => useMontagePlanner())

      const options = {
        preferences: { minClipDuration: 2, maxClipDuration: 10 },
      }

      act(() => {
        result.current.updateGenerationOptions(options)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_GENERATION_OPTIONS",
        options,
      })
    })
  })

  describe("Analysis and generation", () => {
    it("should start analysis", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.startAnalysis()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "START_ANALYSIS" })
    })

    it("should cancel analysis", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.cancelAnalysis()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "CANCEL_ANALYSIS" })
    })

    it("should generate plan", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.generatePlan()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "GENERATE_PLAN" })
    })

    it("should optimize plan", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.optimizePlan()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "OPTIMIZE_PLAN" })
    })
  })

  describe("Fragment editing", () => {
    it("should edit fragment", () => {
      const { result } = renderHook(() => useMontagePlanner())

      const updates = { duration: 10 }

      act(() => {
        result.current.editFragment("fragment-1", updates)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "EDIT_FRAGMENT",
        fragmentId: "fragment-1",
        updates,
      })
    })

    it("should reorder fragments", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.reorderFragments(0, 2)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "REORDER_FRAGMENTS",
        sourceIndex: 0,
        targetIndex: 2,
      })
    })
  })

  describe("Plan actions", () => {
    it("should apply plan to timeline", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.applyPlanToTimeline()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "APPLY_PLAN_TO_TIMELINE" })
    })

    it("should export plan", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.exportPlan(ExportFormat.JSON)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "EXPORT_PLAN",
        format: ExportFormat.JSON,
      })
    })

    it("should validate plan", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.validatePlan()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "VALIDATE_PLAN" })
    })

    it("should calculate statistics", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.calculateStatistics()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "CALCULATE_STATISTICS" })
    })
  })

  describe("Reset and error handling", () => {
    it("should reset state", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.reset()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "RESET" })
    })

    it("should clear error", () => {
      const { result } = renderHook(() => useMontagePlanner())

      act(() => {
        result.current.clearError()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "CLEAR_ERROR" })
    })
  })

  describe("Computed values", () => {
    it.skip("should calculate total video duration", async () => {
      const mockContextWithFiles = {
        ...mockContext,
        mediaFiles: new Map([
          [
            "video-1",
            {
              id: "video-1",
              path: "/test/video1.mp4",
              filename: "video1.mp4",
              duration: 60,
              type: "video",
              size: 1000,
            },
          ],

          [
            "video-2",
            {
              id: "video-2",
              path: "/test/video2.mp4",
              filename: "video2.mp4",
              duration: 90,
              type: "video",
              size: 1500,
            },
          ],
        ]),
      }

      vi.mocked(await import("../../services/montage-planner-provider")).useMontagePlanner.mockReturnValueOnce({
        state: { value: "idle", context: mockContextWithFiles },
        send: mockSend,
        isAnalyzing: false,
        isGenerating: false,
        isOptimizing: false,
        hasVideos: true,
        hasFragments: false,
        hasPlan: false,
        canGeneratePlan: false,
        canOptimizePlan: false,
        progress: 0,
        progressMessage: "",
      } as any)

      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.totalVideoDuration).toBe(150)
    })

    it.skip("should calculate total fragments duration", async () => {
      const mockContextWithFragments = {
        ...mockContext,
        fragments: [
          { id: "f1", duration: 10 },
          { id: "f2", duration: 15 },
          { id: "f3", duration: 20 },
        ],
      }

      vi.mocked(await import("../../services/montage-planner-provider")).useMontagePlanner.mockReturnValueOnce({
        state: { value: "idle", context: mockContextWithFragments },
        send: mockSend,
        isAnalyzing: false,
        isGenerating: false,
        isOptimizing: false,
        hasVideos: false,
        hasFragments: true,
        hasPlan: false,
        canGeneratePlan: true,
        canOptimizePlan: false,
        progress: 0,
        progressMessage: "",
      } as any)

      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.totalFragmentsDuration).toBe(45)
    })

    it.skip("should calculate utilization rate", async () => {
      const mockContextWithBoth = {
        ...mockContext,
        mediaFiles: new Map([["video-1", { id: "video-1", duration: 100 }]]),
        fragments: [
          { id: "f1", duration: 20 },
          { id: "f2", duration: 30 },
        ],
      }

      vi.mocked(await import("../../services/montage-planner-provider")).useMontagePlanner.mockReturnValueOnce({
        state: { value: "idle", context: mockContextWithBoth },
        send: mockSend,
        isAnalyzing: false,
        isGenerating: false,
        isOptimizing: false,
        hasVideos: true,
        hasFragments: true,
        hasPlan: false,
        canGeneratePlan: true,
        canOptimizePlan: false,
        progress: 0,
        progressMessage: "",
      } as any)

      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.utilizationRate).toBe(50) // (50/100) * 100
    })

    it("should return 0 utilization rate when no videos", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.utilizationRate).toBe(0)
    })
  })

  describe("Helper functions", () => {
    it("should format duration", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.formatDuration(65)).toBe("1:05")
      expect(result.current.formatDuration(3665)).toBe("1:01:05")
    })

    it.skip("should get style name", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.getStyleName("dynamic")).toBe(MONTAGE_STYLES.dynamic.name)
      expect(result.current.getStyleName("cinematic")).toBe(MONTAGE_STYLES.cinematic.name)
    })

    it("should return styleId for unknown styles", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.getStyleName("unknown-style")).toBe("unknown-style")
    })
  })

  describe("Statistics", () => {
    it.skip("should provide video count", async () => {
      const mockContextWithStats = {
        ...mockContext,
        videoIds: ["video-1", "video-2", "video-3"],
      }

      vi.mocked(await import("../../services/montage-planner-provider")).useMontagePlanner.mockReturnValueOnce({
        state: { value: "idle", context: mockContextWithStats },
        send: mockSend,
        isAnalyzing: false,
        isGenerating: false,
        isOptimizing: false,
        hasVideos: true,
        hasFragments: false,
        hasPlan: false,
        canGeneratePlan: false,
        canOptimizePlan: false,
        progress: 0,
        progressMessage: "",
      } as any)

      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.videoCount).toBe(3)
    })

    it.skip("should provide fragment count", async () => {
      const mockContextWithStats = {
        ...mockContext,
        fragments: [{}, {}, {}, {}],
      }

      vi.mocked(await import("../../services/montage-planner-provider")).useMontagePlanner.mockReturnValueOnce({
        state: { value: "idle", context: mockContextWithStats },
        send: mockSend,
        isAnalyzing: false,
        isGenerating: false,
        isOptimizing: false,
        hasVideos: false,
        hasFragments: true,
        hasPlan: false,
        canGeneratePlan: true,
        canOptimizePlan: false,
        progress: 0,
        progressMessage: "",
      } as any)

      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.fragmentCount).toBe(4)
    })

    it.skip("should provide plan duration", async () => {
      const mockContextWithPlan = {
        ...mockContext,
        currentPlan: { totalDuration: 180 },
      }

      vi.mocked(await import("../../services/montage-planner-provider")).useMontagePlanner.mockReturnValueOnce({
        state: { value: "idle", context: mockContextWithPlan },
        send: mockSend,
        isAnalyzing: false,
        isGenerating: false,
        isOptimizing: false,
        hasVideos: false,
        hasFragments: false,
        hasPlan: true,
        canGeneratePlan: false,
        canOptimizePlan: true,
        progress: 0,
        progressMessage: "",
      } as any)

      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.planDuration).toBe(180)
    })
  })

  describe("Available styles", () => {
    it("should provide list of available styles", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.availableStyles).toContain("dynamicAction")
      expect(result.current.availableStyles).toContain("cinematicDrama")
      expect(result.current.availableStyles).toContain("musicVideo")
      expect(result.current.availableStyles.length).toBeGreaterThan(0)
    })
  })

  describe("Progress tracking", () => {
    it("should expose progress value", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.progress).toBe(0)
      expect(typeof result.current.progress).toBe("number")
    })

    it("should expose progress message", () => {
      const { result } = renderHook(() => useMontagePlanner())

      expect(result.current.progressMessage).toBe("")
      expect(typeof result.current.progressMessage).toBe("string")
    })
  })
})
