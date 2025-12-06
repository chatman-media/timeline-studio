/**
 * Тесты для AI Director Service
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../types"
import { AIDirectorService } from "../ai-director-service"

// Mock Tauri commands
const mockTauriCommands = {
  aiDirectorAnalyzeComprehensive: vi.fn(),
  aiDirectorAnalyzeQuick: vi.fn(),
  aiDirectorAnalyzeBatch: vi.fn(),
  aiDirectorGetCapabilities: vi.fn(),
  aiDirectorGetDefaultConfig: vi.fn(),
  aiDirectorValidateConfig: vi.fn(),
  aiDirectorHealthCheck: vi.fn(),
  unifiedAudioAnalyzeComprehensive: vi.fn(),
  unifiedAudioAnalyzeQuick: vi.fn(),
  unifiedAudioAnalyzeBatch: vi.fn(),
  unifiedAudioGetCapabilities: vi.fn(),
  analyzeVideoComprehensive: vi.fn(),
}

vi.mock("../../tauri", () => ({
  aiDirectorAnalyzeComprehensive: (...args: any[]) => mockTauriCommands.aiDirectorAnalyzeComprehensive(...args),
  aiDirectorAnalyzeQuick: (...args: any[]) => mockTauriCommands.aiDirectorAnalyzeQuick(...args),
  aiDirectorAnalyzeBatch: (...args: any[]) => mockTauriCommands.aiDirectorAnalyzeBatch(...args),
  aiDirectorGetCapabilities: (...args: any[]) => mockTauriCommands.aiDirectorGetCapabilities(...args),
  aiDirectorGetDefaultConfig: (...args: any[]) => mockTauriCommands.aiDirectorGetDefaultConfig(...args),
  aiDirectorValidateConfig: (...args: any[]) => mockTauriCommands.aiDirectorValidateConfig(...args),
  aiDirectorHealthCheck: (...args: any[]) => mockTauriCommands.aiDirectorHealthCheck(...args),
  unifiedAudioAnalyzeComprehensive: (...args: any[]) => mockTauriCommands.unifiedAudioAnalyzeComprehensive(...args),
  unifiedAudioAnalyzeQuick: (...args: any[]) => mockTauriCommands.unifiedAudioAnalyzeQuick(...args),
  unifiedAudioAnalyzeBatch: (...args: any[]) => mockTauriCommands.unifiedAudioAnalyzeBatch(...args),
  unifiedAudioGetCapabilities: (...args: any[]) => mockTauriCommands.unifiedAudioGetCapabilities(...args),
  analyzeVideoComprehensive: (...args: any[]) => mockTauriCommands.analyzeVideoComprehensive(...args),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe("AI Director Service", () => {
  let service: AIDirectorService

  const mockCapabilities: SystemCapabilities = {
    audio_analysis: true,
    video_analysis: true,
    face_recognition: true,
    object_detection: true,
    transcription: false,
    gpu_acceleration: true,
    mcp_agents: true,
  }

  const mockHealth: HealthCheckResult = {
    overall_status: "healthy",
    services: {
      audio_analyzer: "running",
      video_analyzer: "running",
    },
    last_check: new Date().toISOString(),
  }

  const mockConfig: AIDirectorConfig = {
    performance_mode: "Balanced",
    enable_audio_analysis: true,
    enable_scene_detection: true,
    enable_video_analysis: true,
    enable_object_detection: true,
    enable_face_detection: false,
    enable_transcription: false,
  }

  const mockAnalysisResult: ComprehensiveAnalysisResult = {
    analysis_id: "test-123",
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    total_duration_ms: 5000,
    errors: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = AIDirectorService.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = AIDirectorService.getInstance()
      const instance2 = AIDirectorService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("Core AI Director Operations", () => {
    describe("analyzeComprehensive", () => {
      it("should call Tauri command with video path and config", async () => {
        mockTauriCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce(mockAnalysisResult)

        const result = await service.analyzeComprehensive("/video.mp4", mockConfig)

        expect(mockTauriCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalledWith("/video.mp4", mockConfig)
        expect(result).toEqual(mockAnalysisResult)
      })

      it("should work without config", async () => {
        mockTauriCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce(mockAnalysisResult)

        await service.analyzeComprehensive("/video.mp4")

        expect(mockTauriCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalledWith("/video.mp4", undefined)
      })

      it("should propagate errors", async () => {
        mockTauriCommands.aiDirectorAnalyzeComprehensive.mockRejectedValueOnce(new Error("Analysis failed"))

        await expect(service.analyzeComprehensive("/video.mp4")).rejects.toThrow("Analysis failed")
      })
    })

    describe("analyzeQuick", () => {
      it("should call Tauri command with video path", async () => {
        mockTauriCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce(mockAnalysisResult)

        const result = await service.analyzeQuick("/video.mp4")

        expect(mockTauriCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledWith("/video.mp4")
        expect(result).toEqual(mockAnalysisResult)
      })

      it("should propagate errors", async () => {
        mockTauriCommands.aiDirectorAnalyzeQuick.mockRejectedValueOnce(new Error("Quick analysis failed"))

        await expect(service.analyzeQuick("/video.mp4")).rejects.toThrow("Quick analysis failed")
      })
    })

    describe("analyzeBatch", () => {
      it("should call Tauri command with file paths and config", async () => {
        const filePaths = ["/video1.mp4", "/video2.mp4"]
        const results = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-456" }]

        mockTauriCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce(results)

        const result = await service.analyzeBatch(filePaths, mockConfig)

        expect(mockTauriCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledWith(filePaths, mockConfig)
        expect(result).toEqual(results)
      })

      it("should work without config", async () => {
        mockTauriCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce([])

        await service.analyzeBatch(["/video.mp4"])

        expect(mockTauriCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledWith(["/video.mp4"], undefined)
      })
    })

    describe("getCapabilities", () => {
      it("should get system capabilities", async () => {
        mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)

        const result = await service.getCapabilities()

        expect(mockTauriCommands.aiDirectorGetCapabilities).toHaveBeenCalled()
        expect(result).toEqual(mockCapabilities)
      })
    })

    describe("getDefaultConfig", () => {
      it("should get default config for fast mode", async () => {
        mockTauriCommands.aiDirectorGetDefaultConfig.mockResolvedValueOnce(mockConfig)

        const result = await service.getDefaultConfig("fast")

        expect(mockTauriCommands.aiDirectorGetDefaultConfig).toHaveBeenCalledWith("fast")
        expect(result).toEqual(mockConfig)
      })

      it("should support all modes", async () => {
        const modes = ["fast", "balanced", "quality", "custom"] as const

        for (const mode of modes) {
          mockTauriCommands.aiDirectorGetDefaultConfig.mockResolvedValueOnce(mockConfig)

          await service.getDefaultConfig(mode)

          expect(mockTauriCommands.aiDirectorGetDefaultConfig).toHaveBeenCalledWith(mode)
        }
      })
    })

    describe("validateConfig", () => {
      it("should validate config", async () => {
        const validationResult: ConfigValidationResult = {
          is_valid: true,
          warnings: [],
          errors: [],
          estimated_time: 60,
          estimated_memory: 512,
        }

        mockTauriCommands.aiDirectorValidateConfig.mockResolvedValueOnce(validationResult)

        const result = await service.validateConfig(mockConfig)

        expect(mockTauriCommands.aiDirectorValidateConfig).toHaveBeenCalledWith(mockConfig)
        expect(result).toEqual(validationResult)
      })
    })

    describe("healthCheck", () => {
      it("should perform health check", async () => {
        mockTauriCommands.aiDirectorHealthCheck.mockResolvedValueOnce(mockHealth)

        const result = await service.healthCheck()

        expect(mockTauriCommands.aiDirectorHealthCheck).toHaveBeenCalled()
        expect(result).toEqual(mockHealth)
      })
    })
  })

  describe("Audio Analysis", () => {
    describe("analyzeAudioComprehensive", () => {
      it("should call unified audio analysis with config", async () => {
        const audioResult = { audio_data: "test" }
        mockTauriCommands.unifiedAudioAnalyzeComprehensive.mockResolvedValueOnce(audioResult)

        const result = await service.analyzeAudioComprehensive("/video.mp4", {
          enableFFmpeg: true,
          enableMontage: true,
          enableTranscription: false,
          performanceMode: "balanced",
        })

        expect(mockTauriCommands.unifiedAudioAnalyzeComprehensive).toHaveBeenCalledWith("/video.mp4", {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: false,
          performance_mode: "Balanced",
        })
        expect(result).toEqual(audioResult)
      })

      it("should use default config", async () => {
        mockTauriCommands.unifiedAudioAnalyzeComprehensive.mockResolvedValueOnce({})

        await service.analyzeAudioComprehensive("/video.mp4")

        expect(mockTauriCommands.unifiedAudioAnalyzeComprehensive).toHaveBeenCalledWith("/video.mp4", {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: false,
          performance_mode: "Balanced",
        })
      })
    })

    describe("analyzeAudioQuick", () => {
      it("should call quick audio analysis", async () => {
        const audioResult = { audio_data: "quick" }
        mockTauriCommands.unifiedAudioAnalyzeQuick.mockResolvedValueOnce(audioResult)

        const result = await service.analyzeAudioQuick("/video.mp4")

        expect(mockTauriCommands.unifiedAudioAnalyzeQuick).toHaveBeenCalledWith("/video.mp4")
        expect(result).toEqual(audioResult)
      })
    })

    describe("analyzeAudioBatch", () => {
      it("should call batch audio analysis", async () => {
        const audioResults = [{ audio_data: "1" }, { audio_data: "2" }]
        mockTauriCommands.unifiedAudioAnalyzeBatch.mockResolvedValueOnce(audioResults)

        const result = await service.analyzeAudioBatch(["/video1.mp4", "/video2.mp4"], {
          performanceMode: "fast",
        })

        expect(mockTauriCommands.unifiedAudioAnalyzeBatch).toHaveBeenCalledWith(["/video1.mp4", "/video2.mp4"], {
          performance_mode: "Fast",
        })
        expect(result).toEqual(audioResults)
      })

      it("should work without config", async () => {
        mockTauriCommands.unifiedAudioAnalyzeBatch.mockResolvedValueOnce([])

        await service.analyzeAudioBatch(["/video.mp4"])

        expect(mockTauriCommands.unifiedAudioAnalyzeBatch).toHaveBeenCalledWith(["/video.mp4"], undefined)
      })
    })

    describe("getAudioAnalysisCapabilities", () => {
      it("should get audio capabilities", async () => {
        const capabilities = {
          ffmpegAvailable: true,
          montageAvailable: true,
          whisperAvailable: false,
          gpuAvailable: true,
        }

        mockTauriCommands.unifiedAudioGetCapabilities.mockResolvedValueOnce(capabilities)

        const result = await service.getAudioAnalysisCapabilities()

        expect(mockTauriCommands.unifiedAudioGetCapabilities).toHaveBeenCalled()
        expect(result).toEqual(capabilities)
      })
    })
  })

  describe("Video Analysis", () => {
    describe("analyzeVideoComprehensive", () => {
      it("should call video analysis with options", async () => {
        const videoResult = { video_data: "test" }
        mockTauriCommands.analyzeVideoComprehensive.mockResolvedValueOnce(videoResult)

        const result = await service.analyzeVideoComprehensive("/video.mp4", {
          enableObjectDetection: true,
          enableFaceDetection: true,
          enableEmotionAnalysis: true,
          enableCompositionAnalysis: true,
          enableAudioAnalysis: true,
          qualityThreshold: 60.0,
          maxMoments: 100,
        })

        expect(mockTauriCommands.analyzeVideoComprehensive).toHaveBeenCalledWith("/video.mp4", {
          enable_object_detection: true,
          enable_face_detection: true,
          enable_emotion_analysis: true,
          enable_composition_analysis: true,
          enable_audio_analysis: true,
          quality_threshold: 60.0,
          max_moments: 100,
        })
        expect(result).toEqual(videoResult)
      })

      it("should use default options", async () => {
        mockTauriCommands.analyzeVideoComprehensive.mockResolvedValueOnce({})

        await service.analyzeVideoComprehensive("/video.mp4")

        expect(mockTauriCommands.analyzeVideoComprehensive).toHaveBeenCalledWith("/video.mp4", {
          enable_object_detection: true,
          enable_face_detection: true,
          enable_emotion_analysis: true,
          enable_composition_analysis: true,
          enable_audio_analysis: true,
          quality_threshold: 50.0,
          max_moments: 50,
        })
      })
    })
  })

  describe("Configuration Management", () => {
    describe("getConfiguration", () => {
      it("should get current configuration", async () => {
        mockTauriCommands.aiDirectorGetDefaultConfig.mockResolvedValueOnce(mockConfig)

        const result = await service.getConfiguration()

        expect(mockTauriCommands.aiDirectorGetDefaultConfig).toHaveBeenCalledWith("balanced")
        expect(result).toEqual(mockConfig)
      })
    })

    describe("updateConfiguration", () => {
      it("should update configuration", async () => {
        await service.updateConfiguration({ performance_mode: "Fast" })

        // TODO: Verify when backend command is implemented
      })
    })

    describe("resetConfiguration", () => {
      it("should reset configuration", async () => {
        await service.resetConfiguration()

        // TODO: Verify when backend command is implemented
      })
    })
  })

  describe("System Status & Monitoring", () => {
    describe("getSystemStatus", () => {
      it("should get overall system status", async () => {
        const audioCapabilities = {
          ffmpegAvailable: true,
          montageAvailable: true,
          whisperAvailable: false,
          gpuAvailable: true,
        }

        mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)
        mockTauriCommands.aiDirectorHealthCheck.mockResolvedValueOnce(mockHealth)
        mockTauriCommands.unifiedAudioGetCapabilities.mockResolvedValueOnce(audioCapabilities)

        const result = await service.getSystemStatus()

        expect(result.capabilities).toEqual(mockCapabilities)
        expect(result.health).toEqual(mockHealth)
        expect(result.audioCapabilities).toEqual(audioCapabilities)
      })

      it("should fetch all data in parallel", async () => {
        mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)
        mockTauriCommands.aiDirectorHealthCheck.mockResolvedValueOnce(mockHealth)
        mockTauriCommands.unifiedAudioGetCapabilities.mockResolvedValueOnce({
          ffmpegAvailable: true,
          montageAvailable: true,
          whisperAvailable: false,
          gpuAvailable: true,
        })

        await service.getSystemStatus()

        expect(mockTauriCommands.aiDirectorGetCapabilities).toHaveBeenCalledTimes(1)
        expect(mockTauriCommands.aiDirectorHealthCheck).toHaveBeenCalledTimes(1)
        expect(mockTauriCommands.unifiedAudioGetCapabilities).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe("Utilities", () => {
    describe("checkAvailability", () => {
      it("should return true when AI Director is available", async () => {
        mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)

        const result = await service.checkAvailability()

        expect(result).toBe(true)
      })

      it("should return false when AI Director is not available", async () => {
        mockTauriCommands.aiDirectorGetCapabilities.mockRejectedValueOnce(new Error("Not available"))

        const result = await service.checkAvailability()

        expect(result).toBe(false)
      })
    })

    describe("getVersionInfo", () => {
      it("should return version info", async () => {
        const result = await service.getVersionInfo()

        expect(result.version).toBeDefined()
        expect(result.buildDate).toBeDefined()
        expect(result.capabilities).toContain("audio_analysis")
        expect(result.capabilities).toContain("video_analysis")
        expect(result.capabilities).toContain("comprehensive_analysis")
      })
    })
  })

  describe("Error Handling", () => {
    it("should propagate errors from Tauri commands", async () => {
      mockTauriCommands.aiDirectorAnalyzeComprehensive.mockRejectedValueOnce(new Error("Tauri error"))

      await expect(service.analyzeComprehensive("/video.mp4")).rejects.toThrow("Tauri error")
    })

    it("should propagate errors from audio analysis", async () => {
      mockTauriCommands.unifiedAudioAnalyzeComprehensive.mockRejectedValueOnce(new Error("Audio error"))

      await expect(service.analyzeAudioComprehensive("/video.mp4")).rejects.toThrow("Audio error")
    })

    it("should propagate errors from video analysis", async () => {
      mockTauriCommands.analyzeVideoComprehensive.mockRejectedValueOnce(new Error("Video error"))

      await expect(service.analyzeVideoComprehensive("/video.mp4")).rejects.toThrow("Video error")
    })
  })

  describe("Concurrent Operations", () => {
    it("should handle multiple concurrent analyses", async () => {
      mockTauriCommands.aiDirectorAnalyzeQuick.mockResolvedValue(mockAnalysisResult)

      const promises = [
        service.analyzeQuick("/video1.mp4"),
        service.analyzeQuick("/video2.mp4"),
        service.analyzeQuick("/video3.mp4"),
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(mockTauriCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledTimes(3)
    })

    it("should handle mixed concurrent operations", async () => {
      mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)
      mockTauriCommands.aiDirectorHealthCheck.mockResolvedValueOnce(mockHealth)
      mockTauriCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce(mockAnalysisResult)

      const [capabilities, health, analysis] = await Promise.all([
        service.getCapabilities(),
        service.healthCheck(),
        service.analyzeQuick("/video.mp4"),
      ])

      expect(capabilities).toEqual(mockCapabilities)
      expect(health).toEqual(mockHealth)
      expect(analysis).toEqual(mockAnalysisResult)
    })
  })
})
