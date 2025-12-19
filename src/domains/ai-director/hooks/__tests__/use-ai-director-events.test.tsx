/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для useAIDirectorEvents Hook
 */
import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AnalysisCompleted, AnalysisError, AnalysisProgress, AnalysisStageCompleted } from "../../types"
import type { AIDirectorEventCallbacks } from "../use-ai-director-events"
import { AI_DIRECTOR_EVENTS, useAIDirectorEvents } from "../use-ai-director-events"

// Mock listen function
const mockUnlistenFn = vi.fn()
const mockListen = vi.fn().mockResolvedValue(mockUnlistenFn)

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: any[]) => mockListen(...args),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("useAIDirectorEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initialization", () => {
    it("should initialize and set up event listeners", async () => {
      const { result } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      // Verify all event listeners are registered
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYSIS_STARTED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYSIS_COMPLETED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYSIS_ERROR, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYSIS_STAGE_COMPLETED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.FILE_ANALYSIS_STARTED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.FILE_ANALYSIS_PROGRESS, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.FILE_ANALYSIS_COMPLETED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_STARTED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_PROGRESS, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_COMPLETED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYZER_STARTED, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYZER_PROGRESS, expect.any(Function))
      expect(mockListen).toHaveBeenCalledWith(AI_DIRECTOR_EVENTS.ANALYZER_COMPLETED, expect.any(Function))
    })

    it("should initialize with default state", () => {
      const { result } = renderHook(() => useAIDirectorEvents())

      expect(result.current.isListening).toBe(false)
      expect(result.current.lastProgress).toBeNull()
      expect(result.current.lastError).toBeNull()
      expect(result.current.errors).toEqual([])
    })

    it("should clean up listeners on unmount", async () => {
      const { unmount } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      unmount()

      // Each listener should be cleaned up
      await waitFor(() => {
        expect(mockUnlistenFn).toHaveBeenCalled()
      })
    })
  })

  describe("Analysis Progress Events", () => {
    it("should handle analysis progress events", async () => {
      let progressCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS) {
          progressCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const { result } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing audio",
        estimatedTimeRemaining: 30,
      }

      progressCallback?.({ payload: progress })

      await waitFor(() => {
        expect(result.current.lastProgress).toEqual(progress)
      })
    })

    it("should call onAnalysisProgress callback", async () => {
      let progressCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS) {
          progressCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const onAnalysisProgress = vi.fn()
      const callbacks: AIDirectorEventCallbacks = {
        onAnalysisProgress,
      }

      renderHook(() => useAIDirectorEvents(callbacks))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "video",
        progress: 0.75,
      }

      progressCallback?.({ payload: progress })

      await waitFor(() => {
        expect(onAnalysisProgress).toHaveBeenCalledWith(progress)
      })
    })
  })

  describe("Analysis Error Events", () => {
    it("should handle analysis error events", async () => {
      let errorCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_ERROR) {
          errorCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const { result } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      const error: AnalysisError = {
        analysisId: "test-123",
        stage: "audio",
        error: "Audio processing failed",
      }

      errorCallback?.({ payload: error })

      await waitFor(() => {
        expect(result.current.lastError).toEqual(error)
        expect(result.current.errors).toHaveLength(1)
        expect(result.current.errors[0]).toEqual(error)
      })
    })

    it("should accumulate multiple errors", async () => {
      let errorCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_ERROR) {
          errorCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const { result } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      const error1: AnalysisError = {
        analysisId: "test-1",
        stage: "audio",
        error: "Error 1",
      }

      const error2: AnalysisError = {
        analysisId: "test-2",
        stage: "video",
        error: "Error 2",
      }

      errorCallback?.({ payload: error1 })
      errorCallback?.({ payload: error2 })

      await waitFor(() => {
        expect(result.current.errors).toHaveLength(2)
        expect(result.current.errors[0]).toEqual(error1)
        expect(result.current.errors[1]).toEqual(error2)
      })
    })

    it("should call onAnalysisError callback", async () => {
      let errorCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_ERROR) {
          errorCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const onAnalysisError = vi.fn()
      const callbacks: AIDirectorEventCallbacks = {
        onAnalysisError,
      }

      renderHook(() => useAIDirectorEvents(callbacks))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      const error: AnalysisError = {
        analysisId: "test-123",
        stage: "video",
        error: "Test error",
      }

      errorCallback?.({ payload: error })

      await waitFor(() => {
        expect(onAnalysisError).toHaveBeenCalledWith(error)
      })
    })
  })

  describe("Analysis Completed Events", () => {
    it("should handle analysis completed events", async () => {
      let completedCallback: ((event: any) => void) | undefined
      let progressCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS) {
          progressCallback = callback
        }
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_COMPLETED) {
          completedCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const { result } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "video",
        progress: 0.8,
      }

      progressCallback?.({ payload: progress })

      await waitFor(() => {
        expect(result.current.lastProgress).toEqual(progress)
      })

      const completed: AnalysisCompleted = {
        analysisId: "test-123",
        success: true,
        total_duration_ms: 5000,
        stages_completed: ["audio", "video"],
        errors: [],
      }

      completedCallback?.({ payload: completed })

      await waitFor(() => {
        expect(result.current.lastProgress).toBeNull()
      })
    })

    it("should call onAnalysisCompleted callback", async () => {
      let completedCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_COMPLETED) {
          completedCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const onAnalysisCompleted = vi.fn()
      const callbacks: AIDirectorEventCallbacks = {
        onAnalysisCompleted,
      }

      renderHook(() => useAIDirectorEvents(callbacks))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      const completed: AnalysisCompleted = {
        analysisId: "test-123",
        success: true,
        total_duration_ms: 5000,
        stages_completed: ["audio", "video"],
        errors: [],
      }

      completedCallback?.({ payload: completed })

      await waitFor(() => {
        expect(onAnalysisCompleted).toHaveBeenCalledWith(completed)
      })
    })
  })

  describe("Analysis Stage Completed Events", () => {
    it("should call onAnalysisStageCompleted callback", async () => {
      let stageCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_STAGE_COMPLETED) {
          stageCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const onAnalysisStageCompleted = vi.fn()
      const callbacks: AIDirectorEventCallbacks = {
        onAnalysisStageCompleted,
      }

      renderHook(() => useAIDirectorEvents(callbacks))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      const stage: AnalysisStageCompleted = {
        analysisId: "test-123",
        stage: "audio",
        duration_ms: 2000,
        success: true,
      }

      stageCallback?.({ payload: stage })

      await waitFor(() => {
        expect(onAnalysisStageCompleted).toHaveBeenCalledWith(stage)
      })
    })
  })

  describe("V2 Events", () => {
    it("should handle file analysis started event", async () => {
      let callback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, cb: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.FILE_ANALYSIS_STARTED) {
          callback = cb
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const onFileAnalysisStarted = vi.fn()
      renderHook(() => useAIDirectorEvents({ onFileAnalysisStarted }))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      callback?.({ payload: { file: "/video.mp4" } })

      await waitFor(() => {
        expect(onFileAnalysisStarted).toHaveBeenCalledWith({
          file: "/video.mp4",
        })
      })
    })

    it("should handle batch analysis progress event", async () => {
      let callback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, cb: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_PROGRESS) {
          callback = cb
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const onBatchAnalysisProgress = vi.fn()
      renderHook(() => useAIDirectorEvents({ onBatchAnalysisProgress }))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      const progress = { completed: 5, total: 10 }
      callback?.({ payload: progress })

      await waitFor(() => {
        expect(onBatchAnalysisProgress).toHaveBeenCalledWith(progress)
      })
    })

    it("should handle analyzer events", async () => {
      const callbacks: AIDirectorEventCallbacks = {
        onAnalyzerStarted: vi.fn(),
        onAnalyzerProgress: vi.fn(),
        onAnalyzerCompleted: vi.fn(),
      }

      const eventCallbacks: Record<string, (event: any) => void> = {}

      mockListen.mockImplementation((eventName: string, cb: (event: any) => void) => {
        eventCallbacks[eventName] = cb
        return Promise.resolve(mockUnlistenFn)
      })

      renderHook(() => useAIDirectorEvents(callbacks))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYZER_STARTED]?.({
        payload: { analyzer: "audio" },
      })
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYZER_PROGRESS]?.({
        payload: { progress: 0.5 },
      })
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYZER_COMPLETED]?.({
        payload: { analyzer: "audio" },
      })

      await waitFor(() => {
        expect(callbacks.onAnalyzerStarted).toHaveBeenCalledWith({
          analyzer: "audio",
        })
        expect(callbacks.onAnalyzerProgress).toHaveBeenCalledWith({
          progress: 0.5,
        })
        expect(callbacks.onAnalyzerCompleted).toHaveBeenCalledWith({
          analyzer: "audio",
        })
      })
    })
  })

  describe("clearErrors", () => {
    it("should clear all errors", async () => {
      let errorCallback: ((event: any) => void) | undefined

      mockListen.mockImplementation((eventName: string, callback: (event: any) => void) => {
        if (eventName === AI_DIRECTOR_EVENTS.ANALYSIS_ERROR) {
          errorCallback = callback
        }
        return Promise.resolve(mockUnlistenFn)
      })

      const { result } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(result.current.isListening).toBe(true)
      })

      const error: AnalysisError = {
        analysisId: "test-123",
        stage: "audio",
        error: "Test error",
      }

      errorCallback?.({ payload: error })

      await waitFor(() => {
        expect(result.current.errors).toHaveLength(1)
        expect(result.current.lastError).toEqual(error)
      })

      result.current.clearErrors()

      await waitFor(() => {
        expect(result.current.errors).toHaveLength(0)
        expect(result.current.lastError).toBeNull()
      })
    })
  })

  describe("All Callbacks", () => {
    it("should support all callback types", async () => {
      const callbacks: AIDirectorEventCallbacks = {
        onAnalysisStarted: vi.fn(),
        onAnalysisProgress: vi.fn(),
        onAnalysisCompleted: vi.fn(),
        onAnalysisError: vi.fn(),
        onAnalysisStageCompleted: vi.fn(),
        onFileAnalysisStarted: vi.fn(),
        onFileAnalysisProgress: vi.fn(),
        onFileAnalysisCompleted: vi.fn(),
        onBatchAnalysisStarted: vi.fn(),
        onBatchAnalysisProgress: vi.fn(),
        onBatchAnalysisCompleted: vi.fn(),
        onAnalyzerStarted: vi.fn(),
        onAnalyzerProgress: vi.fn(),
        onAnalyzerCompleted: vi.fn(),
      }

      const eventCallbacks: Record<string, (event: any) => void> = {}

      mockListen.mockImplementation((eventName: string, cb: (event: any) => void) => {
        eventCallbacks[eventName] = cb
        return Promise.resolve(mockUnlistenFn)
      })

      renderHook(() => useAIDirectorEvents(callbacks))

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      // Trigger all events
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYSIS_STARTED]?.({ payload: {} })
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS]?.({
        payload: { analysisId: "test", stage: "audio", progress: 0.5 },
      })
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYSIS_COMPLETED]?.({
        payload: {
          analysisId: "test",
          success: true,
          total_duration_ms: 5000,
          stages_completed: [],
          errors: [],
        },
      })
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYSIS_ERROR]?.({
        payload: { analysisId: "test", stage: "audio", error: "test" },
      })
      eventCallbacks[AI_DIRECTOR_EVENTS.ANALYSIS_STAGE_COMPLETED]?.({
        payload: {
          analysisId: "test",
          stage: "audio",
          duration_ms: 1000,
          success: true,
        },
      })

      await waitFor(() => {
        expect(callbacks.onAnalysisStarted).toHaveBeenCalled()
        expect(callbacks.onAnalysisProgress).toHaveBeenCalled()
        expect(callbacks.onAnalysisCompleted).toHaveBeenCalled()
        expect(callbacks.onAnalysisError).toHaveBeenCalled()
        expect(callbacks.onAnalysisStageCompleted).toHaveBeenCalled()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle listener setup errors gracefully", async () => {
      mockListen.mockRejectedValueOnce(new Error("Setup failed"))

      const { result } = renderHook(() => useAIDirectorEvents())

      // Should not crash
      expect(result.current.isListening).toBe(false)
    })

    it("should handle unlisten errors gracefully", async () => {
      mockUnlistenFn.mockImplementationOnce(() => {
        throw new Error("Unlisten failed")
      })

      const { unmount } = renderHook(() => useAIDirectorEvents())

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalled()
      })

      // Should not crash on unmount
      unmount()
    })
  })
})
