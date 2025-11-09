/**
 * @vitest-environment jsdom
 */

import type { Mock } from "vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../../../domains/ai-services/types/ai-director-events"
import type { AIDirectorConfig, ComprehensiveAnalysisResult } from "../../types/ai-director"
import { AIDirectorService } from "../ai-director-service"

// Mock Tauri invoke - use factory function to avoid hoisting issues
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Get mocked invoke for use in tests
import { invoke } from "@tauri-apps/api/core"

const mockInvoke = invoke as Mock

describe("AIDirectorService", () => {
  let service: AIDirectorService

  beforeEach(() => {
    vi.clearAllMocks()
    service = AIDirectorService.getInstance()
  })

  const mockConfig: AIDirectorConfig = {
    performance_mode: "balanced",
    enable_audio_analysis: true,
    enable_video_analysis: true,
    enable_face_recognition: true,
    enable_object_detection: true,
    enable_transcription: true,
    enable_scene_detection: true,
  }

  const mockCapabilities: SystemCapabilities = {
    audio_analysis: true,
    video_analysis: true,
    face_recognition: true,
    object_detection: true,
    transcription: true,
    gpu_acceleration: true,
    mcp_agents: false,
  }

  const mockAnalysisResult: ComprehensiveAnalysisResult = {
    analysis_id: "test-analysis-123",
    status: "completed",
    audio_analysis: {
      duration: 120,
      loudness: -14.5,
      tempo: 120,
      silence_percentage: 5,
    },
    video_analysis: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 120,
      codec: "h264",
    },
    started_at: "2024-01-01T12:00:00Z",
    completed_at: "2024-01-01T12:01:00Z",
    total_duration_ms: 60000,
    errors: [],
  }

  const mockHealthResult: HealthCheckResult = {
    overall_status: "healthy",
    services: {
      audio_service: "healthy",
      video_service: "healthy",
      ai_service: "healthy",
    },
    last_check: "2024-01-01T12:00:00Z",
  }

  const mockValidationResult: ConfigValidationResult = {
    is_valid: true,
    warnings: [],
    errors: [],
    estimated_time: 120,
    estimated_memory: 512,
  }

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const instance1 = AIDirectorService.getInstance()
      const instance2 = AIDirectorService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("Core AI Director Operations", () => {
    it("should perform comprehensive analysis", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeComprehensive("/path/to/video.mp4", mockConfig)

      expect(result).toEqual(mockAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })
    })

    it("should perform comprehensive analysis without config", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeComprehensive("/path/to/video.mp4")

      expect(result).toEqual(mockAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: undefined,
      })
    })

    it("should perform quick analysis", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeQuick("/path/to/video.mp4")

      expect(result).toEqual(mockAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_quick", {
        videoPath: "/path/to/video.mp4",
      })
    })

    it("should perform batch analysis", async () => {
      const batchResults = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-2" }]
      mockInvoke.mockResolvedValueOnce(batchResults)

      const result = await service.analyzeBatch(["/path/to/video1.mp4", "/path/to/video2.mp4"], mockConfig)

      expect(result).toEqual(batchResults)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_batch", {
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: mockConfig,
      })
    })

    it("should get system capabilities", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const result = await service.getCapabilities()

      expect(result).toEqual(mockCapabilities)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_capabilities")
    })

    it("should get default config", async () => {
      mockInvoke.mockResolvedValueOnce(mockConfig)

      const result = await service.getDefaultConfig("balanced")

      expect(result).toEqual(mockConfig)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_default_config", {
        mode: "balanced",
      })
    })

    it("should validate config", async () => {
      mockInvoke.mockResolvedValueOnce(mockValidationResult)

      const result = await service.validateConfig(mockConfig)

      expect(result).toEqual(mockValidationResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_validate_config", {
        config: mockConfig,
      })
    })

    it("should perform health check", async () => {
      mockInvoke.mockResolvedValueOnce(mockHealthResult)

      const result = await service.healthCheck()

      expect(result).toEqual(mockHealthResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_health_check")
    })
  })

  describe("Audio Analysis Integration", () => {
    it("should perform comprehensive audio analysis with config", async () => {
      const audioResult = { success: true, data: {} }
      mockInvoke.mockResolvedValueOnce(audioResult)

      const result = await service.analyzeAudioComprehensive("/path/to/video.mp4", {
        enableFFmpeg: true,
        enableMontage: true,
        enableTranscription: true,
        performanceMode: "quality",
      })

      expect(result).toEqual(audioResult)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: true,
          performance_mode: "quality",
        },
      })
    })

    it("should perform comprehensive audio analysis with defaults", async () => {
      const audioResult = { success: true, data: {} }
      mockInvoke.mockResolvedValueOnce(audioResult)

      const result = await service.analyzeAudioComprehensive("/path/to/video.mp4")

      expect(result).toEqual(audioResult)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: false,
          performance_mode: "balanced",
        },
      })
    })

    it("should perform quick audio analysis", async () => {
      const audioResult = { success: true, data: {} }
      mockInvoke.mockResolvedValueOnce(audioResult)

      const result = await service.analyzeAudioQuick("/path/to/video.mp4")

      expect(result).toEqual(audioResult)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_quick", {
        videoPath: "/path/to/video.mp4",
      })
    })

    it("should perform batch audio analysis", async () => {
      const batchResults = [{ success: true }, { success: true }]
      mockInvoke.mockResolvedValueOnce(batchResults)

      const result = await service.analyzeAudioBatch(["/path/to/video1.mp4", "/path/to/video2.mp4"], {
        performanceMode: "fast",
      })

      expect(result).toEqual(batchResults)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_batch", {
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: {
          performance_mode: "fast",
        },
      })
    })

    it("should get audio analysis capabilities", async () => {
      const audioCapabilities = {
        ffmpegAvailable: true,
        montageAvailable: true,
        whisperAvailable: false,
        gpuAvailable: true,
      }
      mockInvoke.mockResolvedValueOnce(audioCapabilities)

      const result = await service.getAudioAnalysisCapabilities()

      expect(result).toEqual(audioCapabilities)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_get_capabilities")
    })
  })

  describe("Video Analysis Integration", () => {
    it("should perform comprehensive video analysis", async () => {
      const videoResult = { success: true, data: {} }
      mockInvoke.mockResolvedValueOnce(videoResult)

      const result = await service.analyzeVideoComprehensive("/path/to/video.mp4", {
        enableObjectDetection: true,
        enableFaceDetection: true,
        enableEmotionAnalysis: true,
        enableCompositionAnalysis: true,
        enableAudioAnalysis: true,
        qualityThreshold: 70.0,
        maxMoments: 100,
      })

      expect(result).toEqual(videoResult)
      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_comprehensive", {
        videoPath: "/path/to/video.mp4",
        options: {
          enable_object_detection: true,
          enable_face_detection: true,
          enable_emotion_analysis: true,
          enable_composition_analysis: true,
          enable_audio_analysis: true,
          quality_threshold: 70.0,
          max_moments: 100,
        },
      })
    })

    it("should use default video analysis options", async () => {
      const videoResult = { success: true, data: {} }
      mockInvoke.mockResolvedValueOnce(videoResult)

      const result = await service.analyzeVideoComprehensive("/path/to/video.mp4")

      expect(result).toEqual(videoResult)
      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_comprehensive", {
        videoPath: "/path/to/video.mp4",
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

  describe("Configuration Management", () => {
    it("should get current configuration", async () => {
      mockInvoke.mockResolvedValueOnce(mockConfig)

      const result = await service.getConfiguration()

      expect(result).toEqual(mockConfig)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_default_config", {
        mode: "balanced",
      })
    })

    it("should update configuration", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      const partialConfig = { enable_audio_analysis: false }
      await service.updateConfiguration(partialConfig)

      expect(consoleSpy).toHaveBeenCalledWith("Updating AI Director config:", partialConfig)

      consoleSpy.mockRestore()
    })

    it("should reset configuration", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await service.resetConfiguration()

      expect(consoleSpy).toHaveBeenCalledWith("Resetting AI Director config to defaults")

      consoleSpy.mockRestore()
    })
  })

  describe("System Status & Monitoring", () => {
    it("should get complete system status", async () => {
      const audioCapabilities = {
        ffmpegAvailable: true,
        montageAvailable: true,
        whisperAvailable: false,
        gpuAvailable: true,
      }

      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // getCapabilities
        .mockResolvedValueOnce(mockHealthResult) // healthCheck
        .mockResolvedValueOnce(audioCapabilities) // getAudioAnalysisCapabilities

      const result = await service.getSystemStatus()

      expect(result).toEqual({
        capabilities: mockCapabilities,
        health: mockHealthResult,
        audioCapabilities,
      })
    })
  })


  describe("Error Handling & Utilities", () => {
    it("should check availability when API is working", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const result = await service.checkAvailability()

      expect(result).toBe(true)
    })

    it("should check availability when API fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockInvoke.mockRejectedValueOnce(new Error("API Error"))

      const result = await service.checkAvailability()

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith("AI Director not available:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should get version info", async () => {
      const result = await service.getVersionInfo()

      expect(result).toEqual({
        version: "1.0.0",
        buildDate: expect.any(String),
        capabilities: ["audio_analysis", "video_analysis", "comprehensive_analysis"],
      })
    })
  })

  describe("Error Propagation", () => {
    it("should propagate errors from Tauri commands", async () => {
      const error = new Error("Tauri command failed")
      mockInvoke.mockRejectedValueOnce(error)

      await expect(service.analyzeComprehensive("/path/to/video.mp4")).rejects.toThrow("Tauri command failed")
    })

    it("should propagate errors from audio analysis", async () => {
      const error = new Error("Audio analysis failed")
      mockInvoke.mockRejectedValueOnce(error)

      await expect(service.analyzeAudioComprehensive("/path/to/video.mp4")).rejects.toThrow("Audio analysis failed")
    })

    it("should propagate errors from video analysis", async () => {
      const error = new Error("Video analysis failed")
      mockInvoke.mockRejectedValueOnce(error)

      await expect(service.analyzeVideoComprehensive("/path/to/video.mp4")).rejects.toThrow("Video analysis failed")
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty video path", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Invalid path"))

      await expect(service.analyzeQuick("")).rejects.toThrow("Invalid path")
    })

    it("should handle very long video paths", async () => {
      const longPath = `${"/very/long/path/".repeat(100)}video.mp4`
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeQuick(longPath)

      expect(result).toEqual(mockAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_quick", {
        videoPath: longPath,
      })
    })

    it("should handle paths with special characters", async () => {
      const specialPath = "/path/with spaces/and (parentheses)/видео файл.mp4"
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeQuick(specialPath)

      expect(result).toEqual(mockAnalysisResult)
    })

    it("should handle batch analysis with single file", async () => {
      mockInvoke.mockResolvedValueOnce([mockAnalysisResult])

      const result = await service.analyzeBatch(["/path/to/video.mp4"])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockAnalysisResult)
    })

    it("should handle batch analysis with empty array", async () => {
      mockInvoke.mockResolvedValueOnce([])

      const result = await service.analyzeBatch([])

      expect(result).toEqual([])
    })

    it("should handle batch analysis with very large array", async () => {
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        ...mockAnalysisResult,
        analysis_id: `test-${i}`,
      }))
      mockInvoke.mockResolvedValueOnce(largeBatch)

      const filePaths = Array.from({ length: 100 }, (_, i) => `/path/to/video${i}.mp4`)
      const result = await service.analyzeBatch(filePaths)

      expect(result).toHaveLength(100)
    })

    it("should handle partial batch analysis failures", async () => {
      const mixedResults = [
        mockAnalysisResult,
        { ...mockAnalysisResult, status: "failed" as const, errors: ["Failed to process"] },
      ]
      mockInvoke.mockResolvedValueOnce(mixedResults)

      const result = await service.analyzeBatch(["/path/to/video1.mp4", "/path/to/video2.mp4"])

      expect(result).toHaveLength(2)
      expect(result[1].status).toBe("failed")
    })

    it("should handle config with all boolean flags false", async () => {
      const minimalConfig: AIDirectorConfig = {
        performance_mode: "fast",
        enable_audio_analysis: false,
        enable_video_analysis: false,
        enable_face_recognition: false,
        enable_object_detection: false,
        enable_transcription: false,
        enable_scene_detection: false,
      }

      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeComprehensive("/path/to/video.mp4", minimalConfig)

      expect(result).toEqual(mockAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: minimalConfig,
      })
    })

    it("should handle config with optional fields", async () => {
      const configWithOptionals: AIDirectorConfig = {
        ...mockConfig,
        timeout_seconds: 300,
        max_memory_mb: 4096,
      }

      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeComprehensive("/path/to/video.mp4", configWithOptionals)

      expect(result).toEqual(mockAnalysisResult)
    })

    it("should handle capabilities with all features disabled", async () => {
      const noCapabilities: SystemCapabilities = {
        audio_analysis: false,
        video_analysis: false,
        face_recognition: false,
        object_detection: false,
        transcription: false,
        gpu_acceleration: false,
        mcp_agents: false,
      }

      mockInvoke.mockResolvedValueOnce(noCapabilities)

      const result = await service.getCapabilities()

      expect(result).toEqual(noCapabilities)
    })

    it("should handle health check with all services unhealthy", async () => {
      const unhealthyResult: HealthCheckResult = {
        overall_status: "unhealthy",
        services: {
          audio_service: "unhealthy",
          video_service: "unhealthy",
          ai_service: "unhealthy",
        },
        last_check: "2024-01-01T12:00:00Z",
      }

      mockInvoke.mockResolvedValueOnce(unhealthyResult)

      const result = await service.healthCheck()

      expect(result.overall_status).toBe("unhealthy")
    })

    it("should handle validation with multiple errors", async () => {
      const invalidConfig: ConfigValidationResult = {
        is_valid: false,
        warnings: [],
        errors: ["Error 1", "Error 2", "Error 3"],
        estimated_time: 0,
        estimated_memory: 0,
      }

      mockInvoke.mockResolvedValueOnce(invalidConfig)

      const result = await service.validateConfig(mockConfig)

      expect(result.is_valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })

    it("should handle analysis result with minimal fields", async () => {
      const minimalResult: ComprehensiveAnalysisResult = {
        analysis_id: "test-minimal",
        status: "completed",
        started_at: "2024-01-01T12:00:00Z",
        errors: [],
      }

      mockInvoke.mockResolvedValueOnce(minimalResult)

      const result = await service.analyzeQuick("/path/to/video.mp4")

      expect(result).toEqual(minimalResult)
    })

    it("should handle analysis result with all optional fields populated", async () => {
      const fullResult: ComprehensiveAnalysisResult = {
        analysis_id: "test-full",
        status: "completed",
        audio_analysis: {
          duration: 120,
          loudness: -14.5,
          tempo: 120,
          silence_percentage: 5,
          transcription: "Full transcription text",
          metrics: {
            clarity: 0.9,
            quality: 0.85,
          },
        },
        scene_analysis: {
          scenes: [
            {
              start_time: 0,
              end_time: 10,
              confidence: 0.95,
              description: "Opening scene",
            },
          ],
          scene_count: 1,
        },
        video_analysis: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 120,
          bitrate: 5000000,
          codec: "h264",
        },
        object_detection: {
          objects: [
            {
              label: "person",
              confidence: 0.95,
              bbox: [10, 10, 100, 100],
              timestamp: 5.5,
            },
          ],
          total_objects: 1,
        },
        face_recognition: {
          faces: [
            {
              person_id: "person-123",
              confidence: 0.9,
              bbox: [50, 50, 150, 150],
              timestamp: 10.5,
            },
          ],
          total_faces: 1,
        },
        started_at: "2024-01-01T12:00:00Z",
        completed_at: "2024-01-01T12:02:00Z",
        total_duration_ms: 120000,
        errors: [],
      }

      mockInvoke.mockResolvedValueOnce(fullResult)

      const result = await service.analyzeComprehensive("/path/to/video.mp4")

      expect(result).toEqual(fullResult)
    })

    it("should handle concurrent API calls", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities)
        .mockResolvedValueOnce(mockHealthResult)
        .mockResolvedValueOnce(mockConfig)

      const [capabilities, health, config] = await Promise.all([
        service.getCapabilities(),
        service.healthCheck(),
        service.getDefaultConfig("balanced"),
      ])

      expect(capabilities).toEqual(mockCapabilities)
      expect(health).toEqual(mockHealthResult)
      expect(config).toEqual(mockConfig)
    })

    it("should handle timeout errors", async () => {
      const timeoutError = new Error("Request timeout")
      mockInvoke.mockRejectedValueOnce(timeoutError)

      await expect(service.analyzeComprehensive("/path/to/video.mp4")).rejects.toThrow("Request timeout")
    })

    it("should handle network errors", async () => {
      const networkError = new Error("Network unavailable")
      mockInvoke.mockRejectedValueOnce(networkError)

      await expect(service.getCapabilities()).rejects.toThrow("Network unavailable")
    })

    it("should handle malformed JSON responses", async () => {
      const parseError = new Error("Failed to parse response")
      mockInvoke.mockRejectedValueOnce(parseError)

      await expect(service.getSystemStatus()).rejects.toThrow()
    })

    it("should handle audio analysis with all options enabled", async () => {
      const audioResult = { success: true, data: { comprehensive: true } }
      mockInvoke.mockResolvedValueOnce(audioResult)

      const result = await service.analyzeAudioComprehensive("/path/to/video.mp4", {
        enableFFmpeg: true,
        enableMontage: true,
        enableTranscription: true,
        performanceMode: "quality",
      })

      expect(result).toEqual(audioResult)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: true,
          performance_mode: "quality",
        },
      })
    })

    it("should handle video analysis with all options disabled", async () => {
      const videoResult = { success: true, data: {} }
      mockInvoke.mockResolvedValueOnce(videoResult)

      const result = await service.analyzeVideoComprehensive("/path/to/video.mp4", {
        enableObjectDetection: false,
        enableFaceDetection: false,
        enableEmotionAnalysis: false,
        enableCompositionAnalysis: false,
        enableAudioAnalysis: false,
        qualityThreshold: 0,
        maxMoments: 0,
      })

      expect(result).toEqual(videoResult)
    })

    it("should maintain singleton instance across multiple getInstance calls", () => {
      const instance1 = AIDirectorService.getInstance()
      const instance2 = AIDirectorService.getInstance()
      const instance3 = AIDirectorService.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
      expect(instance1).toBe(service)
    })

    it("should handle getSystemStatus with partial failures", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // getCapabilities succeeds
        .mockRejectedValueOnce(new Error("Health check failed")) // healthCheck fails

      await expect(service.getSystemStatus()).rejects.toThrow("Health check failed")
    })

    it("should handle version info for future versions", async () => {
      const version = await service.getVersionInfo()

      expect(version).toHaveProperty("version")
      expect(version).toHaveProperty("buildDate")
      expect(version).toHaveProperty("capabilities")
      expect(Array.isArray(version.capabilities)).toBe(true)
    })
  })
})
