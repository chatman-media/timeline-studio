/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

// Mock Tauri invoke - use factory function to avoid hoisting issues
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("AI Director XState Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
    it("should start in loading state", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      expect(actor.getSnapshot().value).toBe("loading")
      expect(actor.getSnapshot().context.isLoading).toBe(true) // Set by entry action
    })

    it("should load capabilities on start and transition to idle", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      expect(invoke).toHaveBeenCalledWith("ai_director_get_capabilities")
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })

    it("should handle initialization errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const error = new Error("Initialization failed")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].error).toContain("Initialization failed")
    })
  })

  describe("Comprehensive Analysis", () => {
    it("should perform comprehensive analysis", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
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

      expect(invoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })

      const context = actor.getSnapshot().context
      expect(context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(context.results).toContain(mockAnalysisResult)
    })

    it("should handle comprehensive analysis errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const error = new Error("Analysis failed")
      vi.mocked(invoke)
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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
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

      expect(invoke).toHaveBeenCalledWith("ai_director_analyze_quick", {
        videoPath: "/path/to/video.mp4",
      })

      const context = actor.getSnapshot().context
      expect(context.currentAnalysis).toEqual(mockAnalysisResult)
      expect(context.results).toContain(mockAnalysisResult)
    })
  })

  describe("Batch Analysis", () => {
    it("should perform batch analysis", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const batchResults = [mockAnalysisResult, { ...mockAnalysisResult, analysis_id: "test-2" }]
      vi.mocked(invoke)
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

      expect(invoke).toHaveBeenCalledWith("ai_director_analyze_batch", {
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: mockConfig,
      })

      const context = actor.getSnapshot().context
      expect(context.results).toEqual(expect.arrayContaining(batchResults))
    })
  })

  describe("Capabilities Management", () => {
    it("should get capabilities on demand", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockCapabilities) // get capabilities

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "GET_CAPABILITIES" })

      await waitFor(actor, (state) => state.matches("gettingCapabilities"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(invoke).toHaveBeenCalledTimes(2) // Once for init, once for get
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)
    })
  })

  describe("Configuration Management", () => {
    it("should get default config", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
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

      expect(invoke).toHaveBeenCalledWith("ai_director_get_default_config", {
        mode: "balanced",
      })
      expect(actor.getSnapshot().context.config).toEqual(mockConfig)
    })

    it("should validate config", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
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

      expect(invoke).toHaveBeenCalledWith("ai_director_validate_config", {
        config: mockConfig,
      })
    })
  })

  describe("Health Monitoring", () => {
    it("should perform health check", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockHealthResult) // health check

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "HEALTH_CHECK" })

      await waitFor(actor, (state) => state.matches("healthChecking"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(invoke).toHaveBeenCalledWith("ai_director_health_check")
      expect(actor.getSnapshot().context.health).toEqual(mockHealthResult)
    })
  })

  describe("Progress Tracking", () => {
    it("should handle analysis progress updates", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockCapabilities) // refresh

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "REFRESH_STATUS" })

      await waitFor(actor, (state) => state.matches("refreshing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(invoke).toHaveBeenCalledTimes(2)
    })
  })

  describe("Error Recovery", () => {
    it("should recover from error state", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const error = new Error("Initialization failed")
      vi.mocked(invoke).mockRejectedValueOnce(error)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("error"))

      // Clear errors and try again
      actor.send({ type: "CLEAR_ERRORS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should retry from error state", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const error = new Error("Initialization failed")
      vi.mocked(invoke)
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
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      const initialContext = actor.getSnapshot().context

      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const finalContext = actor.getSnapshot().context
      expect(finalContext.lastUpdate).not.toBe(initialContext.lastUpdate)
      expect(finalContext.lastUpdate).toBeTruthy()
    })

    it("should maintain loading state during operations", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      let resolveCapabilities: (value: any) => void
      const capabilitiesPromise = new Promise((resolve) => {
        resolveCapabilities = resolve
      })

      vi.mocked(invoke).mockReturnValueOnce(capabilitiesPromise)

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

  describe("Edge Cases", () => {
    it("should handle multiple sequential analysis requests", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockCapabilities) // initial load
        .mockResolvedValueOnce(mockAnalysisResult) // first analysis
        .mockResolvedValueOnce({ ...mockAnalysisResult, analysis_id: "test-2" }) // second analysis

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // First analysis
      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/path/to/video1.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle"))

      // Second analysis
      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/path/to/video2.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle"))

      // Should have processed both requests
      expect(invoke).toHaveBeenCalledTimes(3) // capabilities + 2 analyses
    })

    it("should handle empty video path", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockRejectedValueOnce(new Error("Invalid path"))

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "",
      })

      await waitFor(actor, (state) => state.matches("quickAnalyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.errors.length).toBeGreaterThanOrEqual(1)
    })

    it("should handle analysis with all optional fields missing", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const minimalResult: ComprehensiveAnalysisResult = {
        analysis_id: "test-minimal",
        status: "completed",
        started_at: "2024-01-01T12:00:00Z",
        errors: [],
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(minimalResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/path/to/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.currentAnalysis).toEqual(minimalResult)
    })

    it("should handle batch analysis with empty array", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce([])

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_BATCH_ANALYSIS",
        filePaths: [],
      })

      await waitFor(actor, (state) => state.matches("batchAnalyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(Array.isArray(actor.getSnapshot().context.results)).toBe(true)
    })

    it("should handle very large batch analysis", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        ...mockAnalysisResult,
        analysis_id: `test-${i}`,
      }))

      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(largeBatch)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      const filePaths = Array.from({ length: 100 }, (_, i) => `/path/to/video${i}.mp4`)

      actor.send({
        type: "START_BATCH_ANALYSIS",
        filePaths,
      })

      await waitFor(actor, (state) => state.matches("batchAnalyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      expect(actor.getSnapshot().context.results.length).toBeGreaterThanOrEqual(100)
    })

    it("should handle analysis result with errors array", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const resultWithErrors: ComprehensiveAnalysisResult = {
        ...mockAnalysisResult,
        errors: ["Warning: Low audio quality", "Info: Scene detection skipped"],
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(resultWithErrors)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "START_QUICK_ANALYSIS",
        videoPath: "/path/to/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("quickAnalyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      const currentAnalysis = actor.getSnapshot().context.currentAnalysis
      expect(currentAnalysis).toBeDefined()
      expect(currentAnalysis?.errors).toBeDefined()
      expect(currentAnalysis?.errors?.length).toBe(2)
    })

    it("should handle progress updates with 0 progress", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "ANALYSIS_PROGRESS",
        progress: {
          analysisId: "test-123",
          stage: "initialization",
          progress: 0,
          message: "Starting...",
          estimatedTimeRemaining: 0,
        },
      })

      expect(actor.getSnapshot().context.analysisProgress?.progress).toBe(0)
    })

    it("should handle progress updates with 1.0 progress", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "ANALYSIS_PROGRESS",
        progress: {
          analysisId: "test-123",
          stage: "complete",
          progress: 1.0,
          message: "Finished!",
          estimatedTimeRemaining: 0,
        },
      })

      expect(actor.getSnapshot().context.analysisProgress?.progress).toBe(1.0)
    })

    it("should handle invalid event types gracefully", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // Send an invalid event (should be ignored)
      actor.send({ type: "INVALID_EVENT" } as any)

      // Should still be in idle state
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should handle concurrent clear operations", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // Add some data
      actor.send({ type: "ANALYSIS_COMPLETED", result: mockAnalysisResult })
      actor.send({
        type: "ANALYSIS_ERROR",
        error: { analysisId: "test-123", stage: "audio", error: "Test error" },
      })

      expect(actor.getSnapshot().context.results).toHaveLength(1)
      expect(actor.getSnapshot().context.errors).toHaveLength(1)

      // Clear both simultaneously
      actor.send({ type: "CLEAR_RESULTS" })
      actor.send({ type: "CLEAR_ERRORS" })

      expect(actor.getSnapshot().context.results).toHaveLength(0)
      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should handle validation result with warnings but valid config", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const validationWithWarnings: ConfigValidationResult = {
        is_valid: true,
        warnings: ["Performance may be slow on older hardware", "GPU acceleration recommended"],
        errors: [],
        estimated_time: 180,
        estimated_memory: 2048,
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(validationWithWarnings)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({
        type: "VALIDATE_CONFIG",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("idle"))

      // Validation succeeded, no errors should be added
      expect(actor.getSnapshot().context.errors).toHaveLength(0)
    })

    it("should handle health check with degraded services", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const degradedHealth: HealthCheckResult = {
        overall_status: "degraded",
        services: {
          audio_service: "healthy",
          video_service: "degraded",
          ai_service: "unhealthy",
        },
        last_check: "2024-01-01T12:00:00Z",
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(degradedHealth)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "HEALTH_CHECK" })

      await waitFor(actor, (state) => state.matches("healthChecking"))
      await waitFor(actor, (state) => state.matches("idle"))

      const health = actor.getSnapshot().context.health
      expect(health).toBeDefined()
      expect(health?.overall_status).toBe("degraded")
    })

    it("should handle multiple sequential state transitions", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockCapabilities) // initial
        .mockResolvedValueOnce(mockConfig) // get config
        .mockResolvedValueOnce(mockValidationResult) // validate config
        .mockResolvedValueOnce(mockAnalysisResult) // analysis
        .mockResolvedValueOnce(mockHealthResult) // health check

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // Execute multiple operations in sequence
      actor.send({ type: "GET_DEFAULT_CONFIG", mode: "balanced" })
      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "VALIDATE_CONFIG", config: mockConfig })
      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "START_QUICK_ANALYSIS", videoPath: "/path/to/video.mp4" })
      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "HEALTH_CHECK" })
      await waitFor(actor, (state) => state.matches("idle"))

      // All operations should have completed
      expect(actor.getSnapshot().context.config).toBeDefined()
      expect(actor.getSnapshot().context.currentAnalysis).toBeDefined()
      expect(actor.getSnapshot().context.health).toBeDefined()
    })
  })
})
