/**
 * Тесты для AI Director Tauri Commands
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../types"
import {
  aiDirectorAnalyzeBatch,
  aiDirectorAnalyzeComprehensive,
  aiDirectorAnalyzeQuick,
  aiDirectorGetCapabilities,
  aiDirectorGetDefaultConfig,
  aiDirectorHealthCheck,
  aiDirectorValidateConfig,
  analyzeVideoComprehensive,
  unifiedAudioAnalyzeBatch,
  unifiedAudioAnalyzeComprehensive,
  unifiedAudioAnalyzeQuick,
  unifiedAudioGetCapabilities,
} from "../ai-director-commands"

// Hoist mock function declaration
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}))

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debugSync: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("AI Director Tauri Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("aiDirectorAnalyzeComprehensive", () => {
    it("should invoke Tauri command with video path and config", async () => {
      const videoPath = "/path/to/video.mp4"
      const config: AIDirectorConfig = {
        performance_mode: "Balanced",
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_video_analysis: true,
        enable_object_detection: true,
        enable_face_recognition: true,
        enable_transcription: false,
      }

      const mockResult: ComprehensiveAnalysisResult = {
        analysis_id: "test-123",
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_duration_ms: 5000,
        errors: [],
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await aiDirectorAnalyzeComprehensive(videoPath, config)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_comprehensive", {
        videoPath,
        config,
      })
      expect(result.analysis_id).toBe("test-123")
      expect(result.status).toBe("completed")
    })

    it("should work without config", async () => {
      const videoPath = "/path/to/video.mp4"

      mockInvoke.mockResolvedValueOnce({
        analysis_id: "test-456",
        status: "completed",
        started_at: new Date().toISOString(),
        errors: [],
      })

      await aiDirectorAnalyzeComprehensive(videoPath)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_comprehensive", {
        videoPath,
        config: undefined,
      })
    })

    it("should handle Tauri errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Analysis failed"))

      await expect(aiDirectorAnalyzeComprehensive("/video.mp4")).rejects.toThrow("Analysis failed")
    })
  })

  describe("aiDirectorAnalyzeQuick", () => {
    it("should invoke quick analysis command", async () => {
      const videoPath = "/path/to/video.mp4"

      const mockResult: ComprehensiveAnalysisResult = {
        analysis_id: "quick-123",
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_duration_ms: 1000,
        errors: [],
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await aiDirectorAnalyzeQuick(videoPath)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_quick", {
        videoPath,
      })
      expect(result.analysis_id).toBe("quick-123")
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Quick analysis failed"))

      await expect(aiDirectorAnalyzeQuick("/video.mp4")).rejects.toThrow("Quick analysis failed")
    })
  })

  describe("aiDirectorAnalyzeBatch", () => {
    it("should invoke batch analysis with multiple files", async () => {
      const filePaths = ["/video1.mp4", "/video2.mp4", "/video3.mp4"]
      const config: AIDirectorConfig = {
        performance_mode: "Fast",
        enable_audio_analysis: true,
        enable_scene_detection: false,
        enable_video_analysis: true,
        enable_object_detection: false,
        enable_face_recognition: false,
        enable_transcription: false,
      }

      const mockResults: ComprehensiveAnalysisResult[] = [
        {
          analysis_id: "batch-1",
          status: "completed",
          started_at: new Date().toISOString(),
          errors: [],
        },
        {
          analysis_id: "batch-2",
          status: "completed",
          started_at: new Date().toISOString(),
          errors: [],
        },
        {
          analysis_id: "batch-3",
          status: "completed",
          started_at: new Date().toISOString(),
          errors: [],
        },
      ]

      mockInvoke.mockResolvedValueOnce(mockResults)

      const results = await aiDirectorAnalyzeBatch(filePaths, config)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_batch", {
        filePaths,
        config,
      })
      expect(results).toHaveLength(3)
      expect(results[0].analysis_id).toBe("batch-1")
    })

    it("should work without config", async () => {
      const filePaths = ["/video1.mp4"]

      mockInvoke.mockResolvedValueOnce([])

      await aiDirectorAnalyzeBatch(filePaths)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_batch", {
        filePaths,
        config: undefined,
      })
    })

    it("should handle empty file list", async () => {
      mockInvoke.mockResolvedValueOnce([])

      const results = await aiDirectorAnalyzeBatch([])

      expect(results).toEqual([])
    })
  })

  describe("aiDirectorGetCapabilities", () => {
    it("should get system capabilities", async () => {
      const mockCapabilities: SystemCapabilities = {
        audio_analysis: true,
        video_analysis: true,
        face_recognition: true,
        object_detection: true,
        transcription: false,
        gpu_acceleration: true,
        mcp_agents: true,
      }

      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const result = await aiDirectorGetCapabilities()

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_capabilities")
      expect(result.audio_analysis).toBe(true)
      expect(result.gpu_acceleration).toBe(true)
    })

    it("should handle errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Capabilities check failed"))

      await expect(aiDirectorGetCapabilities()).rejects.toThrow("Capabilities check failed")
    })
  })

  describe("aiDirectorGetDefaultConfig", () => {
    it("should get default config for fast mode", async () => {
      const mockConfig: AIDirectorConfig = {
        performance_mode: "Fast",
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_video_analysis: false,
        enable_object_detection: false,
        enable_face_recognition: false,
        enable_transcription: false,
      }

      mockInvoke.mockResolvedValueOnce(mockConfig)

      const result = await aiDirectorGetDefaultConfig("fast")

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_default_config", { mode: "fast" })
      expect(result.performance_mode).toBe("Fast")
    })

    it("should get default config for balanced mode", async () => {
      const mockConfig: AIDirectorConfig = {
        performance_mode: "Balanced",
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_video_analysis: true,
        enable_object_detection: true,
        enable_face_recognition: false,
        enable_transcription: false,
      }

      mockInvoke.mockResolvedValueOnce(mockConfig)

      const result = await aiDirectorGetDefaultConfig("balanced")

      expect(result.performance_mode).toBe("Balanced")
    })

    it("should get default config for quality mode", async () => {
      const mockConfig: AIDirectorConfig = {
        performance_mode: "Quality",
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_video_analysis: true,
        enable_object_detection: true,
        enable_face_recognition: true,
        enable_transcription: true,
      }

      mockInvoke.mockResolvedValueOnce(mockConfig)

      const result = await aiDirectorGetDefaultConfig("quality")

      expect(result.performance_mode).toBe("Quality")
    })
  })

  describe("aiDirectorValidateConfig", () => {
    it("should validate valid config", async () => {
      const config: AIDirectorConfig = {
        performance_mode: "Balanced",
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_video_analysis: true,
        enable_object_detection: true,
        enable_face_recognition: true,
        enable_transcription: false,
      }

      const mockValidation: ConfigValidationResult = {
        is_valid: true,
        warnings: [],
        errors: [],
        estimated_time: 60,
        estimated_memory: 512,
      }

      mockInvoke.mockResolvedValueOnce(mockValidation)

      const result = await aiDirectorValidateConfig(config)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_validate_config", { config })
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return warnings for potentially problematic config", async () => {
      const config: AIDirectorConfig = {
        performance_mode: "Quality",
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_video_analysis: true,
        enable_object_detection: true,
        enable_face_recognition: true,
        enable_transcription: true,
        max_parallel_files: 100, // Very low
      }

      const mockValidation: ConfigValidationResult = {
        is_valid: true,
        warnings: ["Low memory limit may cause performance issues"],
        errors: [],
        estimated_time: 120,
        estimated_memory: 2048,
      }

      mockInvoke.mockResolvedValueOnce(mockValidation)

      const result = await aiDirectorValidateConfig(config)

      expect(result.warnings).toHaveLength(1)
    })

    it("should return errors for invalid config", async () => {
      const config: AIDirectorConfig = {
        performance_mode: "Balanced",
        enable_audio_analysis: false,
        enable_scene_detection: false,
        enable_video_analysis: false,
        enable_object_detection: false,
        enable_face_recognition: false,
        enable_transcription: false,
      }

      const mockValidation: ConfigValidationResult = {
        is_valid: false,
        warnings: [],
        errors: ["At least one analysis type must be enabled"],
        estimated_time: 0,
        estimated_memory: 0,
      }

      mockInvoke.mockResolvedValueOnce(mockValidation)

      const result = await aiDirectorValidateConfig(config)

      expect(result.is_valid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe("aiDirectorHealthCheck", () => {
    it("should return healthy status", async () => {
      const mockHealth: HealthCheckResult = {
        overall_status: "healthy",
        services: {
          audio_analyzer: "running",
          video_analyzer: "running",
          scene_detector: "running",
        },
        last_check: new Date().toISOString(),
      }

      mockInvoke.mockResolvedValueOnce(mockHealth)

      const result = await aiDirectorHealthCheck()

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_health_check")
      expect(result.overall_status).toBe("healthy")
    })

    it("should return warning status", async () => {
      const mockHealth: HealthCheckResult = {
        overall_status: "warning",
        services: {
          audio_analyzer: "running",
          video_analyzer: "degraded",
          scene_detector: "running",
        },
        last_check: new Date().toISOString(),
      }

      mockInvoke.mockResolvedValueOnce(mockHealth)

      const result = await aiDirectorHealthCheck()

      expect(result.overall_status).toBe("warning")
    })

    it("should return error status", async () => {
      const mockHealth: HealthCheckResult = {
        overall_status: "error",
        services: {
          audio_analyzer: "stopped",
          video_analyzer: "stopped",
          scene_detector: "stopped",
        },
        last_check: new Date().toISOString(),
      }

      mockInvoke.mockResolvedValueOnce(mockHealth)

      const result = await aiDirectorHealthCheck()

      expect(result.overall_status).toBe("error")
    })
  })

  describe("Unified Audio Analysis", () => {
    describe("unifiedAudioAnalyzeComprehensive", () => {
      it("should invoke comprehensive audio analysis", async () => {
        const videoPath = "/path/to/video.mp4"
        const config = {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: false,
          performance_mode: "Balanced" as const,
        }

        mockInvoke.mockResolvedValueOnce({ audio_data: "test" })

        await unifiedAudioAnalyzeComprehensive(videoPath, config)

        expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
          videoPath,
          config,
        })
      })

      it("should use default config values", async () => {
        const videoPath = "/video.mp4"

        mockInvoke.mockResolvedValueOnce({ audio_data: "test" })

        await unifiedAudioAnalyzeComprehensive(videoPath)

        expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
          videoPath,
          config: {
            enable_ffmpeg_analysis: true,
            enable_montage_analysis: true,
            enable_transcription: false,
            performance_mode: "Balanced",
          },
        })
      })
    })

    describe("unifiedAudioAnalyzeQuick", () => {
      it("should invoke quick audio analysis", async () => {
        const videoPath = "/video.mp4"

        mockInvoke.mockResolvedValueOnce({ audio_data: "quick" })

        await unifiedAudioAnalyzeQuick(videoPath)

        expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_quick", { videoPath })
      })
    })

    describe("unifiedAudioAnalyzeBatch", () => {
      it("should invoke batch audio analysis", async () => {
        const filePaths = ["/video1.mp4", "/video2.mp4"]
        const config = { performance_mode: "Fast" as const }

        mockInvoke.mockResolvedValueOnce([{ audio_data: "1" }, { audio_data: "2" }])

        await unifiedAudioAnalyzeBatch(filePaths, config)

        expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_batch", {
          filePaths,
          config: { performance_mode: "Fast" },
        })
      })

      it("should use default config", async () => {
        const filePaths = ["/video1.mp4"]

        mockInvoke.mockResolvedValueOnce([])

        await unifiedAudioAnalyzeBatch(filePaths)

        expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_batch", {
          filePaths,
          config: { performance_mode: "Fast" },
        })
      })
    })

    describe("unifiedAudioGetCapabilities", () => {
      it("should get audio capabilities", async () => {
        const mockCapabilities = {
          ffmpegAvailable: true,
          montageAvailable: true,
          whisperAvailable: false,
          gpuAvailable: true,
        }

        mockInvoke.mockResolvedValueOnce(mockCapabilities)

        const result = await unifiedAudioGetCapabilities()

        expect(mockInvoke).toHaveBeenCalledWith("unified_audio_get_capabilities")
        expect(result.ffmpegAvailable).toBe(true)
      })
    })
  })

  describe("Video Analysis", () => {
    describe("analyzeVideoComprehensive", () => {
      it("should invoke comprehensive video analysis", async () => {
        const videoPath = "/video.mp4"
        const options = {
          enable_object_detection: true,
          enable_face_detection: true,
          enable_emotion_analysis: true,
          enable_composition_analysis: true,
          enable_audio_analysis: true,
          quality_threshold: 60.0,
          max_moments: 100,
        }

        mockInvoke.mockResolvedValueOnce({ video_data: "test" })

        await analyzeVideoComprehensive(videoPath, options)

        expect(mockInvoke).toHaveBeenCalledWith("analyze_video_comprehensive", {
          videoPath,
          options,
        })
      })

      it("should use default options", async () => {
        const videoPath = "/video.mp4"

        mockInvoke.mockResolvedValueOnce({ video_data: "test" })

        await analyzeVideoComprehensive(videoPath)

        expect(mockInvoke).toHaveBeenCalledWith("analyze_video_comprehensive", {
          videoPath,
          options: {
            enable_object_detection: true,
            enable_face_detection: true,
            enable_emotion_analysis: true,
            enable_composition_analysis: true,
            enable_audio_analysis: true,
            quality_threshold: 50.0,
            max_moments: 50,
          },
        })
      })
    })
  })

  describe("Error Scenarios", () => {
    it("should propagate network errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"))

      await expect(aiDirectorAnalyzeComprehensive("/video.mp4")).rejects.toThrow("Network error")
    })

    it("should propagate timeout errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Request timeout"))

      await expect(aiDirectorGetCapabilities()).rejects.toThrow("Request timeout")
    })

    it("should propagate permission errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Permission denied"))

      await expect(aiDirectorHealthCheck()).rejects.toThrow("Permission denied")
    })
  })

  describe("Concurrent Calls", () => {
    it("should handle concurrent analysis calls", async () => {
      mockInvoke.mockResolvedValue({
        analysis_id: "test",
        status: "completed",
        started_at: new Date().toISOString(),
        errors: [],
      })

      const calls = [
        aiDirectorAnalyzeQuick("/video1.mp4"),
        aiDirectorAnalyzeQuick("/video2.mp4"),
        aiDirectorAnalyzeQuick("/video3.mp4"),
      ]

      const results = await Promise.all(calls)

      expect(results).toHaveLength(3)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent system calls", async () => {
      mockInvoke
        .mockResolvedValueOnce({
          audio_analysis: true,
          video_analysis: true,
          face_recognition: true,
          object_detection: true,
          transcription: false,
          gpu_acceleration: true,
          mcp_agents: true,
        })
        .mockResolvedValueOnce({
          overall_status: "healthy",
          services: {},
          last_check: new Date().toISOString(),
        })

      const [capabilities, health] = await Promise.all([aiDirectorGetCapabilities(), aiDirectorHealthCheck()])

      expect(capabilities.audio_analysis).toBe(true)
      expect(health.overall_status).toBe("healthy")
      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })
  })
})
