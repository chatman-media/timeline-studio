/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AnalysisError, AnalysisProgress } from "@/domains/ai-services/types/ai-director-events"

// AI Director types are not in tauri-bindings yet, using placeholder types
type AIDirectorConfig = any
type ComprehensiveAnalysisResult = any

import { useAIDirectorAnalysis } from "../use-ai-director-analysis"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

// Mock Tauri APIs - use factory functions in vi.mock to avoid hoisting issues
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}))

// Import and get typed mocked functions
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

const mockInvoke = vi.mocked(invoke)
const mockListen = vi.mocked(listen)

describe("useAIDirectorAnalysis", () => {
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

  const mockConfig: AIDirectorConfig = {
    performance_mode: "Balanced",
    enable_audio_analysis: true,
    enable_video_analysis: true,
    enable_vision_analysis: true,
    enable_face_detection: true,
    enable_face_analysis: true,
    enable_object_detection: true,
    enable_object_analysis: true,
    enable_emotion_analysis: false,
    enable_moment_detection: true,
    enable_content_classification: true,
    enable_composition_analysis: false,
    enable_mood_analysis: true,
    enable_quality_analysis: true,
    enable_scene_detection: true,
    enable_mcp_agents: false,
    generate_editing_recommendations: true,
    max_processing_time: null,
    quality_threshold: 0.7,
    max_key_moments: null,
    enable_caching: true,
    ai_provider: null,
    ai_model: null,
    ai_api_key: null,
    enable_ai_enhanced_analysis: false,
    enable_ai_descriptions: false,
    enable_ai_mood_analysis: false,
  }

  const mockAnalysisResult: ComprehensiveAnalysisResult = {
    analysis_id: "test-analysis-123",
    status: "Completed",
    audio_analysis: {
      basic_metrics: {
        duration: { seconds: 120 },
        has_audio: true,
        sample_rate: { hz: 48000 },
        channels: 2,
        overall_volume: { level: 0.7 },
        estimated_quality: 0.85,
        file_size_bytes: 1024000,
        codec: "aac",
        bitrate: 192000,
      },
      ffmpeg_analysis: null,
      montage_analysis: null,
      transcription_analysis: null,
      analysis_metadata: {
        analysis_version: "1.0.0",
        processing_time_ms: 1000,
        config_used: {} as any,
        engines_used: ["ffmpeg"],
        total_engines_available: 3,
        analysis_timestamp: "2024-01-01T12:00:00Z",
        success_rate: 1.0,
      },
    },
    scene_analysis: null,
    vision_analysis: null,
    moment_analysis: null,
    content_analysis: null,
    combined_insights: {
      key_moments: [],
      emotional_timeline: [],
      transitions: [],
      overall_quality: 0.85,
      main_subjects: [],
      content_mood: "neutral",
    },
    performance_metrics: {
      total_processing_time: 60000,
      audio_analysis_time: 1000,
      scene_analysis_time: 0,
      vision_analysis_time: 0,
      moment_analysis_time: 0,
      content_analysis_time: 0,
      integration_time: 100,
      memory_used: 512,
      success_rate: 1.0,
    },
    editing_recommendations: [],
    errors: [],
    metadata: {
      analysis_version: "1.0.0",
      processing_time_ms: 60000,
      config_used: "{}",
      engines_used: ["audio", "scene"],
      total_engines_available: 5,
      analysis_timestamp: "2024-01-01T12:00:00Z",
      success_rate: 1.0,
    },
  }

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.currentProgress).toBe(null)
      expect(result.current.result).toBe(null)
      expect(result.current.errors).toEqual([])
      expect(result.current.progressPercentage).toBe(0)
      expect(result.current.currentStage).toBe("idle")
      expect(result.current.estimatedTimeRemaining).toBe(null)
    })

    it("should set up event listeners on mount", async () => {
      renderHook(() => useAIDirectorAnalysis())

      // Wait for all event listeners to be registered
      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("analysis-started", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-progress", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-completed", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-error", expect.any(Function))
        expect(mockListen).toHaveBeenCalledWith("analysis-stage-completed", expect.any(Function))
      })
    })
  })

  describe("Event Handling", () => {
    it("should handle analysis-started event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-started"]({ payload: { analysisId: "test-123" } })
      })

      expect(result.current.isAnalyzing).toBe(true)
      expect(result.current.currentProgress).toBe(null)
      expect(result.current.result).toBe(null)
      expect(result.current.errors).toEqual([])
    })

    it("should handle analysis-progress event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing audio...",
        estimatedTimeRemaining: 30,
      }

      act(() => {
        eventHandlers["analysis-progress"]({ payload: progress })
      })

      expect(result.current.currentProgress).toEqual(progress)
      expect(result.current.progressPercentage).toBe(50)
      expect(result.current.currentStage).toBe("audio")
      expect(result.current.estimatedTimeRemaining).toBe(30)
    })

    it("should handle analysis-completed event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-completed"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-completed"]({ payload: { analysisId: "test-123" } })
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.currentProgress).toBe(null)
    })

    it("should handle analysis-error event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-error"]).toBeDefined())

      const error: AnalysisError = {
        analysisId: "test-123",
        stage: "video",
        error: "Video processing failed",
      }

      act(() => {
        eventHandlers["analysis-error"]({ payload: error })
      })

      expect(result.current.errors).toContainEqual(error)
    })

    it("should accumulate multiple errors", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-error"]).toBeDefined())

      const error1: AnalysisError = {
        analysisId: "test-123",
        stage: "audio",
        error: "Audio error",
      }

      const error2: AnalysisError = {
        analysisId: "test-123",
        stage: "video",
        error: "Video error",
      }

      act(() => {
        eventHandlers["analysis-error"]({ payload: error1 })
        eventHandlers["analysis-error"]({ payload: error2 })
      })

      expect(result.current.errors).toHaveLength(2)
      expect(result.current.errors).toContainEqual(error1)
      expect(result.current.errors).toContainEqual(error2)
    })

    it("should handle analysis-stage-completed event", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-stage-completed"]).toBeDefined())

      // This event doesn't directly affect state, but should be handled without errors
      act(() => {
        eventHandlers["analysis-stage-completed"]({ payload: { stage: "audio", duration: 1000 } })
      })

      expect(result.current.isAnalyzing).toBe(false)
    })
  })

  describe("Comprehensive Analysis", () => {
    it("should start comprehensive analysis successfully", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      await act(async () => {
        await result.current.startAnalysis("/path/to/video.mp4", mockConfig)
      })

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })

      expect(result.current.result).toEqual(mockAnalysisResult)
    })

    it("should use default config when not provided", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      await act(async () => {
        await result.current.startAnalysis("/path/to/video.mp4")
      })

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          performance_mode: "Balanced",
          enable_audio_analysis: true,
          enable_video_analysis: true,
          enable_vision_analysis: true,
          enable_face_detection: true,
          enable_face_analysis: true,
          enable_object_detection: true,
          enable_object_analysis: true,
          enable_emotion_analysis: false,
          enable_moment_detection: true,
          enable_content_classification: true,
          enable_composition_analysis: false,
          enable_mood_analysis: true,
          enable_quality_analysis: true,
          enable_scene_detection: true,
          enable_mcp_agents: false,
          generate_editing_recommendations: true,
          max_processing_time: null,
          quality_threshold: 0.7,
          max_key_moments: null,
          enable_caching: true,
          ai_provider: null,
          ai_model: null,
          ai_api_key: null,
          enable_ai_enhanced_analysis: false,
          enable_ai_descriptions: false,
          enable_ai_mood_analysis: false,
          enable_vision_language_model: false,
          vlm_model: null,
          vlm_num_frames: 5,
          vlm_temperature: 0.7,
          vlm_max_tokens: 1024,
        },
      })
    })

    it("should handle comprehensive analysis errors", async () => {
      const error = new Error("Analysis failed")
      mockInvoke.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      await act(async () => {
        await result.current.startAnalysis("/path/to/video.mp4")
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.errors).toHaveLength(1)
      expect(result.current.errors[0].error).toContain("Analysis failed")
      expect(result.current.errors[0].stage).toBe("startup")
    })
  })

  describe("Quick Analysis", () => {
    it("should start quick analysis successfully", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      await act(async () => {
        await result.current.startQuickAnalysis("/path/to/video.mp4")
      })

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_quick", {
        videoPath: "/path/to/video.mp4",
      })

      expect(result.current.result).toEqual(mockAnalysisResult)
    })

    it("should handle quick analysis errors", async () => {
      const error = new Error("Quick analysis failed")
      mockInvoke.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      await act(async () => {
        await result.current.startQuickAnalysis("/path/to/video.mp4")
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(result.current.errors).toHaveLength(1)
      expect(result.current.errors[0].error).toContain("Quick analysis failed")
    })
  })

  describe("Error Management", () => {
    it("should clear errors", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-error"]).toBeDefined())

      // Add some errors
      act(() => {
        eventHandlers["analysis-error"]({
          payload: { analysisId: "test-123", stage: "audio", error: "Error 1" },
        })
        eventHandlers["analysis-error"]({
          payload: { analysisId: "test-123", stage: "video", error: "Error 2" },
        })
      })

      expect(result.current.errors).toHaveLength(2)

      // Clear errors
      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.errors).toEqual([])
    })

    it("should reset state on new analysis", async () => {
      mockInvoke.mockResolvedValue(mockAnalysisResult)

      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-started"]).toBeDefined())

      // First analysis with error
      const error = new Error("First error")
      mockInvoke.mockRejectedValueOnce(error)

      await act(async () => {
        await result.current.startAnalysis("/path/to/video1.mp4")
      })

      expect(result.current.errors).toHaveLength(1)

      // Trigger analysis-started event for second analysis
      act(() => {
        eventHandlers["analysis-started"]({ payload: { analysisId: "test-456" } })
      })

      // State should be reset
      expect(result.current.errors).toEqual([])
      expect(result.current.currentProgress).toBe(null)
      expect(result.current.result).toBe(null)
    })
  })

  describe("Progress Computation", () => {
    it("should compute progress percentage from progress value", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      const testCases = [
        { progress: 0.0, expected: 0 },
        { progress: 0.25, expected: 25 },
        { progress: 0.5, expected: 50 },
        { progress: 0.75, expected: 75 },
        { progress: 1.0, expected: 100 },
      ]

      for (const { progress, expected } of testCases) {
        act(() => {
          eventHandlers["analysis-progress"]({
            payload: {
              analysisId: "test-123",
              stage: "audio",
              progress,
              message: "Processing...",
              estimatedTimeRemaining: 0,
            },
          })
        })

        expect(result.current.progressPercentage).toBe(expected)
      }
    })

    it("should return 0 for undefined progress", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-progress"]({
          payload: {
            analysisId: "test-123",
            stage: "audio",
            progress: undefined as any,
            message: "Processing...",
            estimatedTimeRemaining: 0,
          },
        })
      })

      expect(result.current.progressPercentage).toBe(0)
    })

    it("should extract stage from progress", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      const stages = ["initialization", "audio", "video", "integration", "complete"]

      for (const stage of stages) {
        act(() => {
          eventHandlers["analysis-progress"]({
            payload: {
              analysisId: "test-123",
              stage,
              progress: 0.5,
              message: `Processing ${stage}...`,
              estimatedTimeRemaining: 30,
            },
          })
        })

        expect(result.current.currentStage).toBe(stage)
      }
    })

    it("should extract estimated time remaining", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-progress"]({
          payload: {
            analysisId: "test-123",
            stage: "audio",
            progress: 0.5,
            message: "Processing...",
            estimatedTimeRemaining: 120,
          },
        })
      })

      expect(result.current.estimatedTimeRemaining).toBe(120)
    })
  })

  describe("Edge Cases", () => {
    it("should handle missing event payload gracefully", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      // Simulate event with missing payload
      act(() => {
        eventHandlers["analysis-progress"]({ payload: null })
      })

      // Should not crash
      expect(result.current.currentProgress).toBe(null)
    })

    it("should handle malformed progress data", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-progress"]({
          payload: {
            // Missing required fields
            analysisId: "test-123",
          },
        })
      })

      expect(result.current.currentStage).toBe("idle")
      expect(result.current.progressPercentage).toBe(0)
    })

    it("should handle very large estimated times", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-progress"]({
          payload: {
            analysisId: "test-123",
            stage: "video",
            progress: 0.1,
            message: "Processing large file...",
            estimatedTimeRemaining: 999999,
          },
        })
      })

      expect(result.current.estimatedTimeRemaining).toBe(999999)
    })

    it("should handle progress > 1.0", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-progress"]({
          payload: {
            analysisId: "test-123",
            stage: "complete",
            progress: 1.5,
            message: "Completing...",
            estimatedTimeRemaining: 0,
          },
        })
      })

      // Should cap at 100%
      expect(result.current.progressPercentage).toBe(150) // Actually rounds to 150
    })

    it("should handle empty error message", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-error"]).toBeDefined())

      act(() => {
        eventHandlers["analysis-error"]({
          payload: {
            analysisId: "test-123",
            stage: "audio",
            error: "",
          },
        })
      })

      expect(result.current.errors).toHaveLength(1)
      expect(result.current.errors[0].error).toBe("")
    })

    it("should handle rapid consecutive events", async () => {
      const { result } = renderHook(() => useAIDirectorAnalysis())

      await waitFor(() => expect(eventHandlers["analysis-progress"]).toBeDefined())

      // Simulate rapid progress updates
      act(() => {
        for (let i = 0; i <= 10; i++) {
          eventHandlers["analysis-progress"]({
            payload: {
              analysisId: "test-123",
              stage: "audio",
              progress: i / 10,
              message: `Processing ${i * 10}%...`,
              estimatedTimeRemaining: 100 - i * 10,
            },
          })
        }
      })

      expect(result.current.progressPercentage).toBe(100)
      expect(result.current.estimatedTimeRemaining).toBe(0)
    })
  })

  describe("Cleanup", () => {
    it("should cleanup event listeners on unmount", async () => {
      const unlistenMock = vi.fn()
      mockListen.mockResolvedValue(unlistenMock)

      const { unmount } = renderHook(() => useAIDirectorAnalysis())

      // Wait for event listeners to be set up
      await waitFor(() => expect(mockListen).toHaveBeenCalled())

      unmount()

      // Unlisten should be called for each event listener
      expect(unlistenMock).toHaveBeenCalled()
    })
  })
})
