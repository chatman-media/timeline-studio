/**
 * Тесты для AI Director XState Machine
 */
import { createActor, waitFor } from "xstate"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { aiDirectorMachine } from "../ai-director-machine"
import type {
  AIDirectorConfig,
  AnalysisError,
  AnalysisProgress,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../types"

// Mock Tauri commands
const mockTauriCommands = {
  aiDirectorGetCapabilities: vi.fn(),
  aiDirectorHealthCheck: vi.fn(),
  aiDirectorGetDefaultConfig: vi.fn(),
  aiDirectorValidateConfig: vi.fn(),
  aiDirectorAnalyzeComprehensive: vi.fn(),
  aiDirectorAnalyzeQuick: vi.fn(),
  aiDirectorAnalyzeBatch: vi.fn(),
}

vi.mock("../../tauri", () => ({
  aiDirectorGetCapabilities: (...args: any[]) => mockTauriCommands.aiDirectorGetCapabilities(...args),
  aiDirectorHealthCheck: (...args: any[]) => mockTauriCommands.aiDirectorHealthCheck(...args),
  aiDirectorGetDefaultConfig: (...args: any[]) => mockTauriCommands.aiDirectorGetDefaultConfig(...args),
  aiDirectorValidateConfig: (...args: any[]) => mockTauriCommands.aiDirectorValidateConfig(...args),
  aiDirectorAnalyzeComprehensive: (...args: any[]) => mockTauriCommands.aiDirectorAnalyzeComprehensive(...args),
  aiDirectorAnalyzeQuick: (...args: any[]) => mockTauriCommands.aiDirectorAnalyzeQuick(...args),
  aiDirectorAnalyzeBatch: (...args: any[]) => mockTauriCommands.aiDirectorAnalyzeBatch(...args),
}))

describe("AI Director Machine", () => {
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
    performance_mode: "balanced",
    enable_audio_analysis: true,
    enable_scene_detection: true,
    enable_video_analysis: true,
    enable_object_detection: true,
    enable_face_recognition: false,
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
    mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValue(mockCapabilities)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial State", () => {
    it("should start in loading state", () => {
      const actor = createActor(aiDirectorMachine)
      expect(actor.getSnapshot().value).toBe("loading")
    })

    it("should load capabilities on start", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockTauriCommands.aiDirectorGetCapabilities).toHaveBeenCalled()
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })

    it("should transition to error state on initialization failure", async () => {
      mockTauriCommands.aiDirectorGetCapabilities.mockRejectedValueOnce(new Error("Init failed"))

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].stage).toBe("initialization")
    })
  })

  describe("Comprehensive Analysis", () => {
    it("should start comprehensive analysis", async () => {
      mockTauriCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce(mockAnalysisResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/video.mp4",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("analyzing"))

      expect(actor.getSnapshot().context.isLoading).toBe(true)
    })

    it("should complete comprehensive analysis successfully", async () => {
      mockTauriCommands.aiDirectorAnalyzeComprehensive.mockResolvedValueOnce(mockAnalysisResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/video.mp4",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.currentAnalysis !== null)

      expect(mockTauriCommands.aiDirectorAnalyzeComprehensive).toHaveBeenCalledWith("/video.mp4", mockConfig)
      expect(actor.getSnapshot().context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(actor.getSnapshot().context.results).toHaveLength(1)
      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })

    it("should handle analysis errors", async () => {
      mockTauriCommands.aiDirectorAnalyzeComprehensive.mockRejectedValueOnce(new Error("Analysis failed"))

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.errors.length > 0)

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].stage).toBe("comprehensive_analysis")
    })
  })

  describe("Quick Analysis", () => {
    it("should start quick analysis", async () => {
      mockTauriCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce(mockAnalysisResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("quickAnalyzing"))

      expect(actor.getSnapshot().context.isLoading).toBe(true)
    })

    it("should complete quick analysis successfully", async () => {
      mockTauriCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce(mockAnalysisResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.currentAnalysis !== null)

      expect(mockTauriCommands.aiDirectorAnalyzeQuick).toHaveBeenCalledWith("/video.mp4")
      expect(actor.getSnapshot().context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(actor.getSnapshot().context.results).toHaveLength(1)
    })

    it("should handle quick analysis errors", async () => {
      mockTauriCommands.aiDirectorAnalyzeQuick.mockRejectedValueOnce(new Error("Quick analysis failed"))

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.errors.length > 0)

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].stage).toBe("quick_analysis")
    })
  })

  describe("Batch Analysis", () => {
    it("should start batch analysis", async () => {
      const batchResults = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-456" }]
      mockTauriCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce(batchResults)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_BATCH_ANALYSIS",
        filePaths: ["/video1.mp4", "/video2.mp4"],
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("batchAnalyzing"))

      expect(actor.getSnapshot().context.isLoading).toBe(true)
    })

    it("should complete batch analysis successfully", async () => {
      const batchResults = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-456" }]
      mockTauriCommands.aiDirectorAnalyzeBatch.mockResolvedValueOnce(batchResults)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_BATCH_ANALYSIS",
        filePaths: ["/video1.mp4", "/video2.mp4"],
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.results.length === 2)

      expect(mockTauriCommands.aiDirectorAnalyzeBatch).toHaveBeenCalledWith(
        ["/video1.mp4", "/video2.mp4"],
        mockConfig,
      )
      expect(actor.getSnapshot().context.results).toHaveLength(2)
    })

    it("should handle batch analysis errors", async () => {
      mockTauriCommands.aiDirectorAnalyzeBatch.mockRejectedValueOnce(new Error("Batch analysis failed"))

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_BATCH_ANALYSIS",
        filePaths: ["/video1.mp4"],
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.errors.length > 0)

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].stage).toBe("batch_analysis")
    })
  })

  describe("System Operations", () => {
    it("should get capabilities on demand", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      vi.clearAllMocks()
      mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)

      actor.send({ type: "GET_CAPABILITIES" })

      await waitFor(actor, (state) => state.matches("gettingCapabilities"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockTauriCommands.aiDirectorGetCapabilities).toHaveBeenCalled()
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
    })

    it("should get default config", async () => {
      mockTauriCommands.aiDirectorGetDefaultConfig.mockResolvedValueOnce(mockConfig)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "GET_DEFAULT_CONFIG",
        mode: "balanced",
      })

      await waitFor(actor, (state) => state.matches("gettingConfig"))
      await waitFor(actor, (state) => state.matches("idle") && state.context.config !== null)

      expect(mockTauriCommands.aiDirectorGetDefaultConfig).toHaveBeenCalledWith("balanced")
      expect(actor.getSnapshot().context.config).toEqual(mockConfig)
    })

    it("should validate config", async () => {
      const validationResult: ConfigValidationResult = {
        is_valid: true,
        warnings: [],
        errors: [],
        estimated_time: 60,
        estimated_memory: 512,
      }

      mockTauriCommands.aiDirectorValidateConfig.mockResolvedValueOnce(validationResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "VALIDATE_CONFIG",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("validatingConfig"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockTauriCommands.aiDirectorValidateConfig).toHaveBeenCalledWith(mockConfig)
    })

    it("should perform health check", async () => {
      mockTauriCommands.aiDirectorHealthCheck.mockResolvedValueOnce(mockHealth)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "HEALTH_CHECK" })

      await waitFor(actor, (state) => state.matches("healthChecking"))
      await waitFor(actor, (state) => state.matches("idle") && state.context.health !== null)

      expect(mockTauriCommands.aiDirectorHealthCheck).toHaveBeenCalled()
      expect(actor.getSnapshot().context.health).toEqual(mockHealth)
    })
  })

  describe("Progress and Error Handling", () => {
    it("should update analysis progress", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const progress: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing audio",
        estimatedTimeRemaining: 30,
      }

      actor.send({
        type: "ANALYSIS_PROGRESS",
        progress,
      })

      expect(actor.getSnapshot().context.analysisProgress).toEqual(progress)
    })

    it("should add analysis error", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const error: AnalysisError = {
        analysisId: "test-123",
        stage: "video",
        error: "Video processing failed",
      }

      actor.send({
        type: "ANALYSIS_ERROR",
        error,
      })

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0]).toEqual(error)
    })

    it("should clear errors", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const error: AnalysisError = {
        analysisId: "test-123",
        stage: "audio",
        error: "Test error",
      }

      actor.send({
        type: "ANALYSIS_ERROR",
        error,
      })

      expect(actor.getSnapshot().context.errors).toHaveLength(1)

      actor.send({ type: "CLEAR_ERRORS" })

      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should clear results", async () => {
      mockTauriCommands.aiDirectorAnalyzeQuick.mockResolvedValueOnce(mockAnalysisResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle") && state.context.results.length > 0)

      expect(actor.getSnapshot().context.results).toHaveLength(1)

      actor.send({ type: "CLEAR_RESULTS" })

      expect(actor.getSnapshot().context.results).toHaveLength(0)
      expect(actor.getSnapshot().context.currentAnalysis).toBeNull()
      expect(actor.getSnapshot().context.analysisProgress).toBeNull()
    })
  })

  describe("UI State Management", () => {
    it("should set auto refresh", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.autoRefresh).toBe(true)

      actor.send({
        type: "SET_AUTO_REFRESH",
        enabled: false,
      })

      expect(actor.getSnapshot().context.autoRefresh).toBe(false)

      actor.send({
        type: "SET_AUTO_REFRESH",
        enabled: true,
      })

      expect(actor.getSnapshot().context.autoRefresh).toBe(true)
    })

    it("should refresh status", async () => {
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      vi.clearAllMocks()
      mockTauriCommands.aiDirectorGetCapabilities.mockResolvedValueOnce(mockCapabilities)

      actor.send({ type: "REFRESH_STATUS" })

      await waitFor(actor, (state) => state.matches("refreshing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockTauriCommands.aiDirectorGetCapabilities).toHaveBeenCalled()
    })

    it("should update lastUpdate timestamp", async () => {
      const actor = createActor(aiDirectorMachine)
      const beforeStart = Date.now()
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const lastUpdate = actor.getSnapshot().context.lastUpdate
      expect(lastUpdate).toBeTruthy()

      const timestamp = new Date(lastUpdate!).getTime()
      expect(timestamp).toBeGreaterThanOrEqual(beforeStart)
    })
  })

  describe("Error State Recovery", () => {
    it("should recover from error state by clearing errors", async () => {
      mockTauriCommands.aiDirectorGetCapabilities.mockRejectedValueOnce(new Error("Init failed"))

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      expect(actor.getSnapshot().context.errors).toHaveLength(1)

      actor.send({ type: "CLEAR_ERRORS" })

      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should retry initialization from error state", async () => {
      mockTauriCommands.aiDirectorGetCapabilities
        .mockRejectedValueOnce(new Error("Init failed"))
        .mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      actor.send({ type: "REFRESH_STATUS" })

      await waitFor(actor, (state) => state.matches("loading"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
    })
  })

  describe("Multiple Analysis Results", () => {
    it("should accumulate analysis results", async () => {
      const result1 = { ...mockAnalysisResult, analysis_id: "test-1" }
      const result2 = { ...mockAnalysisResult, analysis_id: "test-2" }
      const result3 = { ...mockAnalysisResult, analysis_id: "test-3" }

      mockTauriCommands.aiDirectorAnalyzeQuick
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2)
        .mockResolvedValueOnce(result3)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "START_QUICK_ANALYSIS", videoPath: "/video1.mp4" })
      await waitFor(actor, (state) => state.matches("idle") && state.context.results.length === 1)

      actor.send({ type: "START_QUICK_ANALYSIS", videoPath: "/video2.mp4" })
      await waitFor(actor, (state) => state.matches("idle") && state.context.results.length === 2)

      actor.send({ type: "START_QUICK_ANALYSIS", videoPath: "/video3.mp4" })
      await waitFor(actor, (state) => state.matches("idle") && state.context.results.length === 3)

      const results = actor.getSnapshot().context.results
      expect(results).toHaveLength(3)
      expect(results[0].analysis_id).toBe("test-1")
      expect(results[1].analysis_id).toBe("test-2")
      expect(results[2].analysis_id).toBe("test-3")
    })
  })
})
