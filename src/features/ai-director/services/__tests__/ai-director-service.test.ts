/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../types/ai-director"
import { AIDirectorService } from "../ai-director-service"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

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
    enable_face_analysis: true,
    enable_object_analysis: true,
    enable_emotion_analysis: true,
    enable_composition_analysis: true,
    enable_scene_detection: true,
    enable_mcp_agents: false,
    max_processing_time: 3600,
    generate_editing_recommendations: true,
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
    video_path: "/path/to/video.mp4",
    audio_analysis: {
      unified_result: {},
      basic_metrics: {
        has_audio: true,
        duration: 120,
        channels: 2,
        sample_rate: 44100,
        bitrate: 192000,
        file_size_bytes: 5242880,
        codec: "aac",
      },
    },
    video_analysis: {
      basic_info: {
        duration: 120,
        fps: 30,
        resolution: { width: 1920, height: 1080 },
        codec: "h264",
        file_size: 52428800,
      },
    },
    processing_time_ms: 45000,
    created_at: "2024-01-01T12:00:00Z",
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

  describe("Legacy Support", () => {
    it("should create analysis project", async () => {
      const projectResult = { id: "project-123", status: "created" }
      mockInvoke.mockResolvedValueOnce(projectResult)

      const result = await service.createAnalysisProject({
        name: "Test Project",
        description: "Test description",
      })

      expect(result).toEqual(projectResult)
      expect(mockInvoke).toHaveBeenCalledWith("create_analysis_project", {
        projectConfig: JSON.stringify({
          name: "Test Project",
          description: "Test description",
        }),
      })
    })

    it("should get analysis project", async () => {
      const projectResult = { id: "project-123", status: "completed" }
      mockInvoke.mockResolvedValueOnce(projectResult)

      const result = await service.getAnalysisProject("project-123")

      expect(result).toEqual(projectResult)
      expect(mockInvoke).toHaveBeenCalledWith("get_analysis_project", {
        projectId: "project-123",
      })
    })

    it("should get analysis project progress", async () => {
      const progressResult = { progress: 0.75, stage: "video_analysis" }
      mockInvoke.mockResolvedValueOnce(progressResult)

      const result = await service.getAnalysisProjectProgress("project-123")

      expect(result).toEqual(progressResult)
      expect(mockInvoke).toHaveBeenCalledWith("get_analysis_project_progress", {
        projectId: "project-123",
      })
    })

    it("should get project scenes", async () => {
      const scenesResult = [{ id: "scene-1", type: "opening" }]
      mockInvoke.mockResolvedValueOnce(scenesResult)

      const result = await service.getProjectScenes("project-123")

      expect(result).toEqual(scenesResult)
      expect(mockInvoke).toHaveBeenCalledWith("get_project_scenes", {
        projectId: "project-123",
      })
    })

    it("should get project key moments", async () => {
      const momentsResult = [{ id: "moment-1", timestamp: 45.2 }]
      mockInvoke.mockResolvedValueOnce(momentsResult)

      const result = await service.getProjectKeyMoments("project-123")

      expect(result).toEqual(momentsResult)
      expect(mockInvoke).toHaveBeenCalledWith("get_project_key_moments", {
        projectId: "project-123",
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
})
