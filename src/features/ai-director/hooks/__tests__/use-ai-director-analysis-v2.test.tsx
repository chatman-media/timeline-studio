/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAIDirectorAnalysisV2 } from "../use-ai-director-analysis-v2"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    trace: vi.fn(),
    traceSync: vi.fn(),
  })),
}))

// Mock domain function
vi.mock("@/domains/ai-director", () => ({
  aiDirectorAnalyzeBatch: vi.fn(),
}))

// Mock Tauri event API
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}))

// Import mocked functions
import { listen } from "@tauri-apps/api/event"
import { aiDirectorAnalyzeBatch } from "@/domains/ai-director"

const mockListen = vi.mocked(listen)
const mockAnalyzeBatch = vi.mocked(aiDirectorAnalyzeBatch)

describe("useAIDirectorAnalysisV2", () => {
  let eventHandlers: Record<string, (event: any) => void> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    eventHandlers = {}

    // Mock listen to capture event handlers
    mockListen.mockImplementation((eventName: string, handler: (event: any) => void) => {
      eventHandlers[eventName] = handler
      return Promise.resolve(() => {})
    })
  })

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.filesProgress).toEqual([])
      expect(result.current.batchProgress).toBe(null)
      expect(result.current.errors).toEqual([])
      expect(result.current.overallProgress).toBe(0)
    })

    it("should set up event listeners on mount", async () => {
      renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("analysis-started", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-progress", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-completed", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-error", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("file-analysis-started", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("file-analysis-progress", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("file-analysis-completed", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("batch-analysis-started", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("batch-analysis-progress", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("batch-analysis-completed", expect.any(Function))
      })
    })
  })

  describe("Batch Analysis", () => {
    it("should start batch analysis with files and analyzers", async () => {
      mockAnalyzeBatch.mockResolvedValueOnce([])

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      const filePaths = ["/path/to/video1.mp4", "/path/to/video2.mp4"]
      const analyzers = new Set(["scene_detection", "audio_quality"] as const)

      await act(async () => {
        await result.current.startBatchAnalysis(filePaths, analyzers as any)
      })

      expect(mockAnalyzeBatch).toHaveBeenCalledWith(
        filePaths,
        expect.objectContaining({
          enable_scene_detection: true,
          enable_audio_analysis: true,
        }),
      )
    })

    it("should initialize file progress for each file", async () => {
      mockAnalyzeBatch.mockResolvedValueOnce([])

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      const filePaths = ["/path/to/video1.mp4", "/path/to/video2.mp4"]
      const analyzers = new Set(["scene_detection"] as const)

      await act(async () => {
        await result.current.startBatchAnalysis(filePaths, analyzers as any)
      })

      expect(result.current.filesProgress).toHaveLength(2)
      expect(result.current.filesProgress[0].filePath).toBe("/path/to/video1.mp4")
      expect(result.current.filesProgress[1].filePath).toBe("/path/to/video2.mp4")
    })

    it("should handle batch analysis errors", async () => {
      const error = new Error("Batch analysis failed")
      mockAnalyzeBatch.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      const filePaths = ["/path/to/video.mp4"]
      const analyzers = new Set(["scene_detection"] as const)

      await act(async () => {
        await result.current.startBatchAnalysis(filePaths, analyzers as any)
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.errors).toHaveLength(1)
      expect(result.current.errors[0].error).toContain("Batch analysis failed")
    })
  })

  describe("Event Handling", () => {
    it("should handle batch-analysis-started event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["batch-analysis-started"]).toBeDefined())

      act(() => {
        eventHandlers["batch-analysis-started"]({
          payload: {
            batch_id: "batch-123",
            total_files: 3,
            config_mode: "balanced",
          },
        })
      })

      expect(result.current.batchProgress).not.toBe(null)
      expect(result.current.batchProgress?.batchId).toBe("batch-123")
      expect(result.current.batchProgress?.totalFiles).toBe(3)
    })

    it("should handle batch-analysis-progress event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["batch-analysis-started"]).toBeDefined())

      // First set up batch progress
      act(() => {
        eventHandlers["batch-analysis-started"]({
          payload: {
            batch_id: "batch-123",
            total_files: 3,
            config_mode: "balanced",
          },
        })
      })

      act(() => {
        eventHandlers["batch-analysis-progress"]({
          payload: {
            completed_files: 1,
            progress: 0.33,
            current_file_path: "/path/to/video2.mp4",
            estimated_time_remaining: 60,
          },
        })
      })

      expect(result.current.batchProgress?.completedFiles).toBe(1)
      expect(result.current.batchProgress?.progress).toBe(33)
      expect(result.current.batchProgress?.estimatedTimeRemaining).toBe(60)
    })

    it("should handle batch-analysis-completed event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["batch-analysis-started"]).toBeDefined())

      // First set up batch progress
      act(() => {
        eventHandlers["batch-analysis-started"]({
          payload: {
            batch_id: "batch-123",
            total_files: 2,
            config_mode: "balanced",
          },
        })
      })

      act(() => {
        eventHandlers["batch-analysis-completed"]({
          payload: {
            total_files: 2,
            successful_files: 2,
            failed_files: 0,
            total_duration_ms: 5000,
          },
        })
      })

      expect(result.current.batchProgress?.progress).toBe(100)
      expect(result.current.batchProgress?.completedFiles).toBe(2)
      expect(result.current.isAnalyzing).toBe(false)
    })

    it("should handle file-analysis-started event", async () => {
      mockAnalyzeBatch.mockResolvedValueOnce([])

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["file-analysis-started"]).toBeDefined())

      // Start analysis to populate filesProgress
      await act(async () => {
        await result.current.startBatchAnalysis(["/path/to/video.mp4"], new Set(["scene_detection"]) as any)
      })

      act(() => {
        eventHandlers["file-analysis-started"]({
          payload: { file_index: 0 },
        })
      })

      expect(result.current.filesProgress[0].status).toBe("analyzing")
    })

    it("should handle analysis-error event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-error"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-error"]({
          payload: {
            analysisId: "test-123",
            stage: "video",
            error: "Video processing failed",
          },
        })
      })

      expect(result.current.errors).toHaveLength(1)
      expect(result.current.errors[0].error).toBe("Video processing failed")
    })
  })

  describe("Cancel Analysis", () => {
    it("should cancel ongoing analysis", async () => {
      mockAnalyzeBatch.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      // Start analysis (won't complete due to mock)
      act(() => {
        void result.current.startBatchAnalysis(["/path/to/video.mp4"], new Set(["scene_detection"]) as any)
      })

      // Cancel immediately
      act(() => {
        result.current.cancelAnalysis()
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.batchProgress?.status).toBe("cancelled")
    })

    it("should mark pending files as cancelled", async () => {
      mockAnalyzeBatch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      // Start analysis
      act(() => {
        void result.current.startBatchAnalysis(
          ["/path/to/video1.mp4", "/path/to/video2.mp4"],
          new Set(["scene_detection"]) as any,
        )
      })

      // Cancel
      act(() => {
        result.current.cancelAnalysis()
      })

      expect(result.current.filesProgress.every((f) => f.status === "cancelled")).toBe(true)
    })
  })

  describe("Reset", () => {
    it("should reset all state", async () => {
      mockAnalyzeBatch.mockResolvedValueOnce([])

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      // Start and complete analysis
      await act(async () => {
        await result.current.startBatchAnalysis(["/path/to/video.mp4"], new Set(["scene_detection"]) as any)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.filesProgress).toEqual([])
      expect(result.current.batchProgress).toBe(null)
      expect(result.current.errors).toEqual([])
      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.overallProgress).toBe(0)
    })
  })

  describe("Clear Errors", () => {
    it("should clear accumulated errors", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-error"]).toBeDefined())

      // Add some errors
      act(() => {
        eventHandlers["analysis-error"]({
          payload: { analysisId: "test-1", stage: "audio", error: "Error 1" },
        })
        eventHandlers["analysis-error"]({
          payload: { analysisId: "test-2", stage: "video", error: "Error 2" },
        })
      })

      expect(result.current.errors).toHaveLength(2)

      // Clear errors
      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.errors).toEqual([])
    })
  })

  describe("Overall Progress Computation", () => {
    it("should compute overall progress from files", async () => {
      mockAnalyzeBatch.mockResolvedValueOnce([])

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      // Start analysis
      await act(async () => {
        await result.current.startBatchAnalysis(
          ["/path/to/video1.mp4", "/path/to/video2.mp4"],
          new Set(["scene_detection"]) as any,
        )
      })

      // After startBatchAnalysis, files have 0% progress each
      // Overall progress is 0%
      expect(result.current.overallProgress).toBe(0)

      // When batch completes, progress updates
      expect(result.current.filesProgress).toHaveLength(2)
    })

    it("should return 0 when no files", () => {
      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      expect(result.current.overallProgress).toBe(0)
    })
  })

  describe("Analyzer to Config Mapping", () => {
    it("should map frontend analyzers to backend config flags", async () => {
      mockAnalyzeBatch.mockResolvedValueOnce([])

      const { result } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      const analyzers = new Set(["scene_detection", "face_detection", "audio_quality", "vlm_analysis"] as const)

      await act(async () => {
        await result.current.startBatchAnalysis(["/test.mp4"], analyzers as any)
      })

      expect(mockAnalyzeBatch).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          enable_scene_detection: true,
          enable_face_detection: true,
          enable_face_analysis: true, // Included with face_detection
          enable_audio_analysis: true,
          enable_vision_language_model: true,
        }),
      )
    })
  })

  describe("Cleanup", () => {
    it("should cleanup event listeners on unmount", async () => {
      const unlistenMock = vi.fn()
      mockListen.mockResolvedValue(unlistenMock)

      const { unmount } = renderHook(() => useAIDirectorAnalysisV2())

      await waitFor(() => expect(mockListen).toHaveBeenCalled())

      unmount()

      expect(unlistenMock).toHaveBeenCalled()
    })
  })
})
