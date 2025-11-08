/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import {
  AIDirectorConfig,
  AnalysisError,
  AnalysisProgress,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../types/ai-director"
import { aiDirectorMachine } from "../ai-director-machine"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("AI Director XState Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockConfig: AIDirectorConfig = {
    performance_mode: "balanced",
    enable_audio_analysis: true,
    enable_video_analysis: true,
    enable_face_recognition: true,
    enable_object_detection: true,
    enable_scene_detection: true,
    enable_transcription: true,
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

  describe("Initial State", () => {
    it("should start in loading state", () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      expect(actor.getSnapshot().value).toBe("loading")
      expect(actor.getSnapshot().context.isLoading).toBe(true) // Set by entry action
    })

    it("should load capabilities on start and transition to idle", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_capabilities")
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })

    it("should handle initialization errors", async () => {
      const error = new Error("Initialization failed")
      mockInvoke.mockRejectedValueOnce(error)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].error).toContain("Initialization failed")
    })
  })

  describe("Comprehensive Analysis", () => {
    it("should perform comprehensive analysis", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockAnalysisResult) // analysis

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("analyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })

      const context = actor.getSnapshot().context
      expect(context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(context.results).toContain(mockAnalysisResult)
    })

    it("should handle comprehensive analysis errors", async () => {
      const error = new Error("Analysis failed")
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockRejectedValueOnce(error) // analysis error

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/path/to/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("analyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.errors).toHaveLength(1)
      expect(context.errors[0].error).toContain("Analysis failed")
      expect(context.errors[0].stage).toBe("comprehensive_analysis")
    })
  })

  describe("Quick Analysis", () => {
    it("should perform quick analysis", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockAnalysisResult) // quick analysis

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/path/to/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("quickAnalyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_quick", {
        videoPath: "/path/to/video.mp4",
      })

      const context = actor.getSnapshot().context
      expect(context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(context.results).toContain(mockAnalysisResult)
    })
  })

  describe("Batch Analysis", () => {
    it("should perform batch analysis", async () => {
      const batchResults = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-2" }]
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(batchResults) // batch analysis

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_BATCH_ANALYSIS",
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("batchAnalyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_batch", {
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: mockConfig,
      })

      const context = actor.getSnapshot().context
      expect(context.results).toEqual(expect.arrayContaining(batchResults))
    })
  })

  describe("Capabilities Management", () => {
    it("should get capabilities on demand", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockCapabilities) // get capabilities

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "GET_CAPABILITIES" })

      await waitFor(actor, (state) => state.matches("gettingCapabilities"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledTimes(2) // Once for init, once for get
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
    })
  })

  describe("Configuration Management", () => {
    it("should get default config", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockConfig) // get default config

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "GET_DEFAULT_CONFIG",
        mode: "balanced",
      })

      await waitFor(actor, (state) => state.matches("gettingConfig"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_default_config", {
        mode: "balanced",
      })
      expect(actor.getSnapshot().context.config).toEqual(mockConfig)
    })

    it("should validate config", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockValidationResult) // validate config

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "VALIDATE_CONFIG",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("validatingConfig"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_validate_config", {
        config: mockConfig,
      })
    })
  })

  describe("Health Monitoring", () => {
    it("should perform health check", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockHealthResult) // health check

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "HEALTH_CHECK" })

      await waitFor(actor, (state) => state.matches("healthChecking"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_health_check")
      expect(actor.getSnapshot().context.health).toEqual(mockHealthResult)
    })
  })

  describe("Progress Tracking", () => {
    it("should handle analysis progress updates", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const progressUpdate: AnalysisProgress = {
        analysisId: "test-123",
        stage: "audio",
        progress: 0.5,
        message: "Processing audio...",
        estimatedTimeRemaining: 30,
      }

      actor.send({
        type: "ANALYSIS_PROGRESS",
        progress: progressUpdate,
      })

      expect(actor.getSnapshot().context.analysisProgress).toEqual(progressUpdate)
    })

    it("should handle analysis completion", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "ANALYSIS_COMPLETED",
        result: mockAnalysisResult,
      })

      const context = actor.getSnapshot().context
      expect(context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(context.results).toContain(mockAnalysisResult)
    })

    it("should handle analysis errors", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const analysisError: AnalysisError = {
        analysisId: "test-123",
        stage: "video",
        error: "Video processing failed",
      }

      actor.send({
        type: "ANALYSIS_ERROR",
        error: analysisError,
      })

      expect(actor.getSnapshot().context.errors).toContain(analysisError)
    })
  })

  describe("State Management", () => {
    it("should clear errors", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // Add an error first
      const analysisError: AnalysisError = {
        analysisId: "test-123",
        stage: "video",
        error: "Test error",
      }

      actor.send({
        type: "ANALYSIS_ERROR",
        error: analysisError,
      })

      expect(actor.getSnapshot().context.errors).toHaveLength(1)

      // Clear errors
      actor.send({ type: "CLEAR_ERRORS" })

      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should clear results", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // Add a result first
      actor.send({
        type: "ANALYSIS_COMPLETED",
        result: mockAnalysisResult,
      })

      expect(actor.getSnapshot().context.results).toHaveLength(1)
      expect(actor.getSnapshot().context.currentAnalysis).toEqual(mockAnalysisResult)

      // Clear results
      actor.send({ type: "CLEAR_RESULTS" })

      expect(actor.getSnapshot().context.results).toHaveLength(0)
      expect(actor.getSnapshot().context.currentAnalysis).toBe(null)
      expect(actor.getSnapshot().context.analysisProgress).toBe(null)
    })

    it("should set auto refresh", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.autoRefresh).toBe(true)

      actor.send({
        type: "SET_AUTO_REFRESH",
        enabled: false,
      })

      expect(actor.getSnapshot().context.autoRefresh).toBe(false)
    })

    it("should refresh status", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockCapabilities) // refresh

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "REFRESH_STATUS" })

      await waitFor(actor, (state) => state.matches("refreshing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })
  })

  describe("Error Recovery", () => {
    it("should recover from error state", async () => {
      const error = new Error("Initialization failed")
      mockInvoke.mockRejectedValueOnce(error)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      // Clear errors and try again
      actor.send({ type: "CLEAR_ERRORS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should retry from error state", async () => {
      const error = new Error("Initialization failed")
      mockInvoke
        .mockRejectedValueOnce(error) // first attempt fails
        .mockResolvedValueOnce(mockCapabilities) // retry succeeds

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      actor.send({ type: "REFRESH_STATUS" })

      await waitFor(actor, (state) => state.matches("loading"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
    })
  })

  describe("Context Updates", () => {
    it("should update lastUpdate timestamp on successful operations", async () => {
      mockInvoke.mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      const initialContext = actor.getSnapshot().context

      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const finalContext = actor.getSnapshot().context
      expect(finalContext.lastUpdate).not.toBe(initialContext.lastUpdate)
      expect(finalContext.lastUpdate).toBeTruthy()
    })

    it("should maintain loading state during operations", async () => {
      let resolveCapabilities: (value: any) => void
      const capabilitiesPromise = new Promise((resolve) => {
        resolveCapabilities = resolve
      })

      mockInvoke.mockReturnValueOnce(capabilitiesPromise)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      // Should be in loading state
      expect(actor.getSnapshot().value).toBe("loading")

      // Resolve the promise
      resolveCapabilities!(mockCapabilities)

      await waitFor(actor, (state) => state.matches("idle"))
      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })
  })
})
