/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "@/types/generated/tauri-bindings"
import { useAIDirector } from "../use-ai-director"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

// Mock Tauri commands - use vi.hoisted to ensure proper initialization order
const { mockCommands } = vi.hoisted(() => {
  const mockCommands = {
    aiDirectorAnalyzeComprehensive: vi.fn(),
    aiDirectorAnalyzeQuick: vi.fn(),
    aiDirectorAnalyzeBatch: vi.fn(),
    aiDirectorGetDefaultConfig: vi.fn(),
    aiDirectorValidateConfig: vi.fn(),
    aiDirectorGetCapabilities: vi.fn(),
    aiDirectorHealthCheck: vi.fn(),
  }
  return { mockCommands }
})

vi.mock("@/types/generated/tauri-bindings", () => ({
  commands: mockCommands,
}))

describe("useAIDirector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockConfig: AIDirectorConfig = {
    performance_mode: "Balanced",
    enable_audio_analysis: true,
    enable_scene_detection: true,
    enable_video_analysis: true,
    enable_vision_analysis: true,
    enable_face_detection: true,
    enable_face_analysis: true,
    enable_object_detection: true,
    enable_object_analysis: true,
    enable_emotion_analysis: true,
    enable_moment_detection: true,
    enable_content_classification: true,
    enable_composition_analysis: true,
    enable_mood_analysis: true,
    enable_quality_analysis: true,
    max_processing_time: null,
    quality_threshold: 0.7,
    max_key_moments: null,
    enable_caching: true,
    generate_editing_recommendations: true,
    enable_mcp_agents: false,
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
        sample_rate: { hz: 44100 },
        channels: 2,
        overall_volume: { level: 0.7 },
        estimated_quality: 0.85,
        file_size_bytes: 1024000,
        codec: "aac",
        bitrate: 128000,
      },
      ffmpeg_analysis: null,
      montage_analysis: null,
      transcription_analysis: null,
      analysis_metadata: {
        analysis_version: "1.0.0",
        processing_time_ms: 1000,
        config_used: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: false,
          enable_transcription: false,
          ffmpeg_config: null,
          montage_config: null,
          whisper_config: null,
          performance_mode: "Balanced",
          max_processing_time_seconds: null,
          enable_caching: true,
        },
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
      total_processing_time: 1000,
      audio_analysis_time: 500,
      scene_analysis_time: 0,
      vision_analysis_time: 0,
      moment_analysis_time: 0,
      content_analysis_time: 0,
      integration_time: 100,
      memory_used: 512000,
      success_rate: 1.0,
    },
    editing_recommendations: [],
    errors: [],
    metadata: {
      analysis_version: "1.0.0",
      processing_time_ms: 1000,
      config_used: "balanced",
      engines_used: ["audio"],
      total_engines_available: 5,
      analysis_timestamp: "2024-01-01T12:00:00Z",
      success_rate: 1.0,
    },
  }

  const mockCapabilities: SystemCapabilities = {
    audio_analysis: true,
    video_analysis: true,
    scene_detection: true,
    vision_analysis: true,
    face_recognition: true,
    object_detection: true,
    moment_detection: true,
    content_classification: true,
    transcription: true,
    gpu_acceleration: true,
  }

  const mockHealthResult: HealthCheckResult = {
    overallStatus: "healthy",
    services: {
      audio_service: "healthy",
      video_service: "healthy",
    },
    lastCheck: "2024-01-01T12:00:00Z",
  }

  const mockValidationResult: ConfigValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    estimatedTime: 120,
    estimatedMemory: 512,
  }

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useAIDirector())

      expect(result.current.state.isAnalyzing).toBe(false)
      expect(result.current.state.analysisProgress).toBe(0)
      expect(result.current.state.currentResult).toBe(null)
      expect(result.current.state.error).toBe(null)
      expect(result.current.state.lastAnalyzedPath).toBe(null)
    })

    it("should provide all expected functions", () => {
      const { result } = renderHook(() => useAIDirector())

      expect(typeof result.current.analyzeComprehensive).toBe("function")
      expect(typeof result.current.analyzeQuick).toBe("function")
      expect(typeof result.current.analyzeBatch).toBe("function")
      expect(typeof result.current.getDefaultConfig).toBe("function")
      expect(typeof result.current.validateConfig).toBe("function")
      expect(typeof result.current.getCapabilities).toBe("function")
      expect(typeof result.current.healthCheck).toBe("function")
      expect(typeof result.current.clearAnalysis).toBe("function")
    })
  })

  describe("Comprehensive Analysis", () => {
    it("should perform comprehensive analysis successfully", async () => {
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())

      const promise = result.current.analyzeComprehensive("/path/to/video.mp4", mockConfig)

      const analysisResult = await promise

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.analysisProgress).toBe(100)
        expect(result.current.state.currentResult).toEqual(mockAnalysisResult)
        expect(result.current.state.error).toBe(null)
        expect(result.current.state.lastAnalyzedPath).toBe("/path/to/video.mp4")
      })

      expect(analysisResult).toEqual(mockAnalysisResult)
      expect(mockCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalledWith("/path/to/video.mp4", mockConfig)
    })

    it("should handle comprehensive analysis without config", async () => {
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysisResult = await result.current.analyzeComprehensive("/path/to/video.mp4")

      expect(analysisResult).toEqual(mockAnalysisResult)
      expect(mockCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalledWith("/path/to/video.mp4", null)
    })

    it("should handle comprehensive analysis errors", async () => {
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce({
        status: "error",
        error: "Analysis failed",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeComprehensive("/path/to/video.mp4")).rejects.toThrow("Analysis failed")

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.error).toBe("Analysis failed")
      })
    })

    it("should handle comprehensive analysis exceptions", async () => {
      const error = new Error("Network error")
      mockCommands.aiDirectorAnalyzeComprehensive.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeComprehensive("/path/to/video.mp4")).rejects.toThrow("Network error")

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.error).toBe("Network error")
      })
    })
  })

  describe("Quick Analysis", () => {
    it("should perform quick analysis successfully", async () => {
      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const analysisResult = await result.current.analyzeQuick("/path/to/video.mp4")

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.currentResult).toEqual(mockAnalysisResult)
      })

      expect(analysisResult).toEqual(mockAnalysisResult)
      expect(mockCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledWith("/path/to/video.mp4")
    })

    it("should handle quick analysis errors", async () => {
      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce({
        status: "error",
        error: "Quick analysis failed",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeQuick("/path/to/video.mp4")).rejects.toThrow("Quick analysis failed")

      await waitFor(() => {
        expect(result.current.state.error).toBe("Quick analysis failed")
      })
    })
  })

  describe("Batch Analysis", () => {
    it("should perform batch analysis successfully", async () => {
      const batchResults = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-2" }]

      mockCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce({
        status: "ok",
        data: batchResults,
      })

      const { result } = renderHook(() => useAIDirector())
      const filePaths = ["/path/to/video1.mp4", "/path/to/video2.mp4"]
      const results = await result.current.analyzeBatch(filePaths, mockConfig)

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.currentResult).toEqual(batchResults[1])
      })

      expect(results).toEqual(batchResults)
      expect(mockCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledWith(filePaths, mockConfig)
    })

    it("should handle batch analysis without config", async () => {
      mockCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce({
        status: "ok",
        data: [mockAnalysisResult],
      })

      const { result } = renderHook(() => useAIDirector())
      await result.current.analyzeBatch(["/path/to/video.mp4"])

      expect(mockCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledWith(["/path/to/video.mp4"], null)
    })

    it("should handle empty batch results", async () => {
      mockCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce({
        status: "ok",
        data: [],
      })

      const { result } = renderHook(() => useAIDirector())
      const results = await result.current.analyzeBatch([])

      await waitFor(() => {
        expect(result.current.state.currentResult).toBe(null)
      })

      expect(results).toEqual([])
    })

    it("should handle batch analysis errors", async () => {
      mockCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce({
        status: "error",
        error: "Batch analysis failed",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeBatch(["/path/to/video.mp4"])).rejects.toThrow("Batch analysis failed")

      await waitFor(() => {
        expect(result.current.state.error).toBe("Batch analysis failed")
      })
    })
  })

  describe("Configuration Management", () => {
    it("should get default config", async () => {
      mockCommands.aiDirectorGetDefaultConfig.mockResolvedValueOnce({
        status: "ok",
        data: mockConfig,
      })

      const { result } = renderHook(() => useAIDirector())
      const config = await result.current.getDefaultConfig("Balanced")

      expect(config).toEqual(mockConfig)
      expect(mockCommands.aiDirectorGetDefaultConfig).toHaveBeenCalledWith("Balanced")
    })

    it("should handle all config modes", async () => {
      const modes: Array<"Fast" | "Balanced" | "Quality" | "Custom"> = ["Fast", "Balanced", "Quality", "Custom"]

      mockCommands.aiDirectorGetDefaultConfig.mockResolvedValue({
        status: "ok",
        data: mockConfig,
      })

      const { result } = renderHook(() => useAIDirector())

      for (const mode of modes) {
        await result.current.getDefaultConfig(mode)
        expect(mockCommands.aiDirectorGetDefaultConfig).toHaveBeenCalledWith(mode)
      }
    })

    it("should validate config", async () => {
      mockCommands.aiDirectorValidateConfig.mockResolvedValueOnce({
        status: "ok",
        data: mockValidationResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const validation = await result.current.validateConfig(mockConfig)

      expect(validation).toEqual(mockValidationResult)
      expect(mockCommands.aiDirectorValidateConfig).toHaveBeenCalledWith(mockConfig)
    })

    it("should handle invalid config", async () => {
      const invalidResult: ConfigValidationResult = {
        isValid: false,
        warnings: ["Warning 1"],
        errors: ["Error 1", "Error 2"],
        estimatedTime: 0,
        estimatedMemory: 0,
      }

      mockCommands.aiDirectorValidateConfig.mockResolvedValueOnce({
        status: "ok",
        data: invalidResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const validation = await result.current.validateConfig(mockConfig)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(2)
    })

    it("should handle config validation errors", async () => {
      mockCommands.aiDirectorValidateConfig.mockResolvedValueOnce({
        status: "error",
        error: "Validation failed",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.validateConfig(mockConfig)).rejects.toThrow("Validation failed")
    })
  })

  describe("System Functions", () => {
    it("should get capabilities", async () => {
      mockCommands.aiDirectorGetCapabilities.mockResolvedValueOnce({
        status: "ok",
        data: mockCapabilities,
      })

      const { result } = renderHook(() => useAIDirector())
      const capabilities = await result.current.getCapabilities()

      expect(capabilities).toEqual(mockCapabilities)
      expect(mockCommands.aiDirectorGetCapabilities).toHaveBeenCalled()
    })

    it("should handle capabilities errors", async () => {
      mockCommands.aiDirectorGetCapabilities.mockResolvedValueOnce({
        status: "error",
        error: "Capabilities unavailable",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.getCapabilities()).rejects.toThrow("Capabilities unavailable")
    })

    it("should perform health check", async () => {
      mockCommands.aiDirectorHealthCheck.mockResolvedValueOnce({
        status: "ok",
        data: mockHealthResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const health = await result.current.healthCheck()

      expect(health).toEqual(mockHealthResult)
      expect(mockCommands.aiDirectorHealthCheck).toHaveBeenCalled()
    })

    it("should handle unhealthy status", async () => {
      const unhealthyResult: HealthCheckResult = {
        overallStatus: "unhealthy",
        services: {
          audio_service: "unhealthy",
          video_service: "degraded",
        },
        lastCheck: "2024-01-01T12:00:00Z",
      }

      mockCommands.aiDirectorHealthCheck.mockResolvedValueOnce({
        status: "ok",
        data: unhealthyResult,
      })

      const { result } = renderHook(() => useAIDirector())
      const health = await result.current.healthCheck()

      expect(health.overallStatus).toBe("unhealthy")
    })
  })

  describe("State Management", () => {
    it("should clear analysis state", async () => {
      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())

      // First, perform an analysis
      await result.current.analyzeQuick("/path/to/video.mp4")

      await waitFor(() => {
        expect(result.current.state.currentResult).not.toBe(null)
        expect(result.current.state.analysisProgress).toBe(100)
      })

      // Clear analysis
      result.current.clearAnalysis()

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.analysisProgress).toBe(0)
        expect(result.current.state.currentResult).toBe(null)
        expect(result.current.state.error).toBe(null)
        expect(result.current.state.lastAnalyzedPath).toBe(null)
      })
    })

    it("should handle multiple sequential analyses", async () => {
      mockCommands.aiDirectorAnalyzeQuick
        .mockResolvedValueOnce({
          status: "ok",
          data: mockAnalysisResult,
        })
        .mockResolvedValueOnce({
          status: "ok",
          data: { ...mockAnalysisResult, analysis_id: "test-2" },
        })

      const { result } = renderHook(() => useAIDirector())

      await result.current.analyzeQuick("/path/to/video1.mp4")
      await waitFor(() => expect(result.current.state.currentResult?.analysis_id).toBe("test-analysis-123"))

      await result.current.analyzeQuick("/path/to/video2.mp4")
      await waitFor(() => expect(result.current.state.currentResult?.analysis_id).toBe("test-2"))
    })

    it("should preserve error state until next analysis", async () => {
      mockCommands.aiDirectorAnalyzeQuick
        .mockResolvedValueOnce({
          status: "error",
          error: "First error",
        })
        .mockResolvedValueOnce({
          status: "ok",
          data: mockAnalysisResult,
        })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeQuick("/path/to/video1.mp4")).rejects.toThrow()

      await waitFor(() => expect(result.current.state.error).toBe("First error"))

      await result.current.analyzeQuick("/path/to/video2.mp4")

      await waitFor(() => expect(result.current.state.error).toBe(null))
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty video path", async () => {
      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce({
        status: "error",
        error: "Invalid video path",
      })

      const { result } = renderHook(() => useAIDirector())

      await expect(result.current.analyzeQuick("")).rejects.toThrow("Invalid video path")
    })

    it("should handle very long video paths", async () => {
      const longPath = `${"/very/long/path/".repeat(50)}video.mp4`

      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())
      await result.current.analyzeQuick(longPath)

      expect(mockCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledWith(longPath)
    })

    it("should handle special characters in path", async () => {
      const specialPath = "/path/with spaces/and (parentheses)/видео.mp4"

      mockCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())
      await result.current.analyzeQuick(specialPath)

      expect(mockCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledWith(specialPath)
    })

    it("should handle null config gracefully", async () => {
      mockCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce({
        status: "ok",
        data: mockAnalysisResult,
      })

      const { result } = renderHook(() => useAIDirector())
      await result.current.analyzeComprehensive("/path/to/video.mp4", undefined)

      expect(mockCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalledWith("/path/to/video.mp4", null)
    })

    it("should handle concurrent analysis attempts", async () => {
      mockCommands.aiDirectorAnalyzeQuick.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: "ok",
                  data: mockAnalysisResult,
                }),
              100,
            ),
          ),
      )

      const { result } = renderHook(() => useAIDirector())

      const promise1 = result.current.analyzeQuick("/path/to/video1.mp4")
      const promise2 = result.current.analyzeQuick("/path/to/video2.mp4")

      await Promise.all([promise1, promise2])

      expect(mockCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledTimes(2)
    })
  })
})
