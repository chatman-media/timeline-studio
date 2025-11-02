/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import { aiDirectorMachine } from "../../services/ai-director-machine"
import { AIDirectorService } from "../../services/ai-director-service"
import {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  HealthCheckResult,
  SystemCapabilities,
} from "../../types/ai-director"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("AI Director Workflow Integration", () => {
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

  const mockHealthResult: HealthCheckResult = {
    overall_status: "healthy",
    services: {
      audio_service: "healthy",
      video_service: "healthy",
      ai_service: "healthy",
      unified_audio_service: "healthy",
    },
    last_check: "2024-01-01T12:00:00Z",
  }

  const mockAnalysisResult: ComprehensiveAnalysisResult = {
    analysis_id: "test-analysis-123",
    status: "completed",
    video_path: "/path/to/video.mp4",
    audio_analysis: {
      unified_result: {
        overall_quality: 0.85,
        audio_present: true,
        processing_time_ms: 15000,
      },
      basic_metrics: {
        has_audio: true,
        duration: 120,
        channels: 2,
        sample_rate: 44100,
        bitrate: 192000,
        file_size_bytes: 5242880,
        codec: "aac",
      },
      ffmpeg_analysis: {
        volume_analysis: [0.5, 0.6, 0.7, 0.8],
        frequency_analysis: { low: 0.3, mid: 0.6, high: 0.4 },
        spectral_analysis: { centroid: 2500, rolloff: 8000 },
        quality_issues: [],
      },
      montage_analysis: {
        speech_segments: [
          { start: 10.5, end: 45.2, confidence: 0.92 },
          { start: 60.1, end: 85.7, confidence: 0.88 },
        ],
        music_segments: [{ start: 0.0, end: 10.0, genre: "ambient" }],
        emotional_tone: "positive",
        energy_level: 0.75,
        tempo_analysis: { bpm: 120, confidence: 0.85 },
      },
      whisper_transcription: {
        full_text: "Hello world, this is a test video.",
        segments: [
          { start: 10.5, end: 15.2, text: "Hello world", confidence: 0.95 },
          { start: 15.5, end: 20.1, text: "this is a test video", confidence: 0.9 },
        ],
        detected_language: "en",
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
      scene_analysis: [
        {
          start_time: 0.0,
          end_time: 30.0,
          scene_type: "opening",
          confidence: 0.92,
          description: "Opening scene with titles",
        },
        {
          start_time: 30.0,
          end_time: 90.0,
          scene_type: "content",
          confidence: 0.88,
          description: "Main content section",
        },
      ],
      object_detection: [
        {
          timestamp: 15.0,
          objects: [
            { class_name: "person", confidence: 0.95, bbox: [100, 50, 200, 300] },
            { class_name: "chair", confidence: 0.82, bbox: [300, 200, 150, 180] },
          ],
        },
      ],
      face_analysis: [
        {
          timestamp: 20.0,
          faces: [
            {
              confidence: 0.98,
              emotion: "happy",
              age: 25,
              gender: "female",
              bbox: [120, 80, 80, 100],
              embedding: [0.1, 0.2, 0.3, 0.4],
            },
          ],
        },
      ],
      composition_analysis: {
        overall_quality: 0.87,
        aesthetic_score: 0.82,
        rule_of_thirds: true,
        symmetry_score: 0.65,
        brightness_histogram: [10, 20, 50, 80, 60, 30, 15],
        color_analysis: { dominant_colors: ["#FF5733", "#33FF57"] },
      },
    },
    editing_recommendations: [
      {
        type: "cut",
        description: "Consider cutting silent section",
        confidence: 0.85,
        suggested_action: "Remove segment from 5.0s to 8.5s",
        time_range: { start: 5.0, end: 8.5 },
      },
      {
        type: "enhance",
        description: "Audio levels could be improved",
        confidence: 0.78,
        suggested_action: "Increase volume by 3dB in speech segments",
      },
    ],
    processing_time_ms: 125000,
    created_at: "2024-01-01T12:00:00Z",
    metadata: {
      analysis_version: "1.0.0",
      engines_used: ["unified_audio", "video_analysis", "ai_director"],
      config_used: mockConfig,
      system_info: { gpu_used: true, cpu_cores: 8 },
    },
  }

  describe("End-to-End Workflow Coordination", () => {
    it("should orchestrate complete analysis workflow with unified audio", async () => {
      // Setup comprehensive mock responses
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // get_capabilities
        .mockResolvedValueOnce(mockHealthResult) // health_check
        .mockResolvedValueOnce(mockConfig) // get_default_config
        .mockResolvedValueOnce({ is_valid: true, warnings: [], errors: [], estimated_time: 120, estimated_memory: 512 }) // validate_config
        .mockResolvedValueOnce(mockAnalysisResult) // comprehensive analysis

      // Step 1: Initialize AI Director
      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))
      expect(actor.getSnapshot().context.capabilities).toEqual(mockCapabilities)

      // Step 2: Health check
      actor.send({ type: "HEALTH_CHECK" })
      await waitFor(actor, (state) => state.matches("idle"))
      expect(actor.getSnapshot().context.health).toEqual(mockHealthResult)

      // Step 3: Get and validate configuration
      actor.send({ type: "GET_DEFAULT_CONFIG", mode: "balanced" })
      await waitFor(actor, (state) => state.matches("idle"))
      expect(actor.getSnapshot().context.config).toEqual(mockConfig)

      actor.send({ type: "VALIDATE_CONFIG", config: mockConfig })
      await waitFor(actor, (state) => state.matches("idle"))

      // Step 4: Start comprehensive analysis
      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("analyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      // Verify final state
      const finalContext = actor.getSnapshot().context
      expect(finalContext.currentAnalysis).toEqual(mockAnalysisResult)
      expect(finalContext.results).toContain(mockAnalysisResult)
      expect(finalContext.errors).toHaveLength(0)

      // Verify all commands were called in correct order
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_capabilities")
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_health_check")
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_default_config", { mode: "balanced" })
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_validate_config", { config: mockConfig })
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })
    })

    it("should handle unified audio analysis integration in workflow", async () => {
      const audioCapabilities = {
        ffmpegAvailable: true,
        montageAvailable: true,
        whisperAvailable: true,
        gpuAvailable: true,
      }

      const audioAnalysisResult = {
        success: true,
        unified_result: mockAnalysisResult.audio_analysis?.unified_result,
        basic_metrics: mockAnalysisResult.audio_analysis?.basic_metrics,
        processing_time_ms: 15000,
      }

      mockInvoke
        .mockResolvedValueOnce(audioCapabilities) // get audio capabilities
        .mockResolvedValueOnce(audioAnalysisResult) // comprehensive audio analysis

      // Test unified audio analysis through service
      const capabilities = await service.getAudioAnalysisCapabilities()
      expect(capabilities).toEqual(audioCapabilities)

      const audioResult = await service.analyzeAudioComprehensive("/path/to/video.mp4", {
        enableFFmpeg: true,
        enableMontage: true,
        enableTranscription: true,
        performanceMode: "balanced",
      })

      expect(audioResult).toEqual(audioAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: true,
          performance_mode: "balanced",
        },
      })
    })

    it("should coordinate video analysis with object detection and face recognition", async () => {
      const videoAnalysisResult = {
        success: true,
        scenes: mockAnalysisResult.video_analysis?.scene_analysis,
        objects: mockAnalysisResult.video_analysis?.object_detection,
        faces: mockAnalysisResult.video_analysis?.face_analysis,
        composition: mockAnalysisResult.video_analysis?.composition_analysis,
      }

      mockInvoke.mockResolvedValueOnce(videoAnalysisResult)

      const result = await service.analyzeVideoComprehensive("/path/to/video.mp4", {
        enableObjectDetection: true,
        enableFaceDetection: true,
        enableEmotionAnalysis: true,
        enableCompositionAnalysis: true,
        enableAudioAnalysis: true,
        qualityThreshold: 75.0,
        maxMoments: 50,
      })

      expect(result).toEqual(videoAnalysisResult)
      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_comprehensive", {
        videoPath: "/path/to/video.mp4",
        options: {
          enable_object_detection: true,
          enable_face_detection: true,
          enable_emotion_analysis: true,
          enable_composition_analysis: true,
          enable_audio_analysis: true,
          quality_threshold: 75.0,
          max_moments: 50,
        },
      })
    })

    it("should generate editing recommendations based on analysis results", async () => {
      mockInvoke.mockResolvedValueOnce(mockAnalysisResult)

      const result = await service.analyzeComprehensive("/path/to/video.mp4", {
        ...mockConfig,
        generate_editing_recommendations: true,
      })

      expect(result.editing_recommendations).toBeDefined()
      expect(result.editing_recommendations).toHaveLength(2)

      const recommendations = result.editing_recommendations!
      expect(recommendations[0]).toMatchObject({
        type: "cut",
        description: "Consider cutting silent section",
        confidence: 0.85,
        suggested_action: "Remove segment from 5.0s to 8.5s",
        time_range: { start: 5.0, end: 8.5 },
      })

      expect(recommendations[1]).toMatchObject({
        type: "enhance",
        description: "Audio levels could be improved",
        confidence: 0.78,
        suggested_action: "Increase volume by 3dB in speech segments",
      })
    })
  })

  describe("Batch Processing Workflows", () => {
    it("should handle batch analysis with multiple video files", async () => {
      const file1Result = { ...mockAnalysisResult, analysis_id: "batch-1", video_path: "/path/to/video1.mp4" }
      const file2Result = { ...mockAnalysisResult, analysis_id: "batch-2", video_path: "/path/to/video2.mp4" }
      const batchResults = [file1Result, file2Result]

      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // get_capabilities
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

      const finalContext = actor.getSnapshot().context
      expect(finalContext.results).toEqual(batchResults)

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_batch", {
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: mockConfig,
      })
    })

    it("should handle batch audio analysis", async () => {
      const batchAudioResults = [
        { success: true, analysis_id: "audio-1", processing_time_ms: 5000 },
        { success: true, analysis_id: "audio-2", processing_time_ms: 7000 },
      ]

      mockInvoke.mockResolvedValueOnce(batchAudioResults)

      const result = await service.analyzeAudioBatch(["/path/to/video1.mp4", "/path/to/video2.mp4"], {
        performanceMode: "fast",
      })

      expect(result).toEqual(batchAudioResults)
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_batch", {
        filePaths: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        config: { performance_mode: "fast" },
      })
    })
  })

  describe("Error Recovery and Resilience", () => {
    it("should recover from individual component failures", async () => {
      mockInvoke
        .mockResolvedValueOnce(mockCapabilities) // get_capabilities
        .mockRejectedValueOnce(new Error("Audio analysis failed")) // audio analysis error
        .mockResolvedValueOnce({
          // fallback comprehensive analysis without audio
          ...mockAnalysisResult,
          audio_analysis: undefined,
          status: "partially_completed",
        })

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      // First attempt fails
      actor.send({
        type: "START_COMPREHENSIVE_ANALYSIS",
        videoPath: "/path/to/video.mp4",
        config: mockConfig,
      })

      await waitFor(actor, (state) => state.matches("analyzing"))
      await waitFor(actor, (state) => state.matches("idle"))

      // Should have error in context
      expect(actor.getSnapshot().context.errors).toHaveLength(1)
      expect(actor.getSnapshot().context.errors[0].error).toContain("Audio analysis failed")
    })

    it("should validate system readiness before analysis", async () => {
      const unhealthySystem: HealthCheckResult = {
        overall_status: "error",
        services: {
          audio_service: "error",
          video_service: "healthy",
          ai_service: "warning",
        },
        last_check: "2024-01-01T12:00:00Z",
      }

      mockInvoke.mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(unhealthySystem)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "HEALTH_CHECK" })
      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.health).toEqual(unhealthySystem)
      expect(context.health?.overall_status).toBe("error")
    })

    it("should handle configuration validation failures", async () => {
      const invalidConfig = { ...mockConfig, max_processing_time: -1 }
      const validationResult = {
        is_valid: false,
        warnings: ["Performance mode may be too aggressive"],
        errors: ["max_processing_time must be positive"],
        estimated_time: 0,
        estimated_memory: 0,
      }

      mockInvoke.mockResolvedValueOnce(mockCapabilities).mockResolvedValueOnce(validationResult)

      const actor = createActor(aiDirectorMachine)
      actor.start()

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "VALIDATE_CONFIG", config: invalidConfig })
      await waitFor(actor, (state) => state.matches("idle"))

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_validate_config", {
        config: invalidConfig,
      })
    })
  })

  describe("Performance Mode Optimization", () => {
    it("should adapt workflow based on performance mode", async () => {
      const fastConfig: AIDirectorConfig = {
        ...mockConfig,
        performance_mode: "fast",
        enable_emotion_analysis: false,
        enable_composition_analysis: false,
      }

      const qualityConfig: AIDirectorConfig = {
        ...mockConfig,
        performance_mode: "quality",
        enable_emotion_analysis: true,
        enable_composition_analysis: true,
        max_processing_time: 7200,
      }

      // Test fast mode
      mockInvoke.mockResolvedValueOnce(fastConfig)
      const fastConfigResult = await service.getDefaultConfig("fast")
      expect(fastConfigResult.performance_mode).toBe("fast")

      // Test quality mode
      mockInvoke.mockResolvedValueOnce(qualityConfig)
      const qualityConfigResult = await service.getDefaultConfig("quality")
      expect(qualityConfigResult.performance_mode).toBe("quality")
      expect(qualityConfigResult.max_processing_time).toBe(7200)
    })

    it("should optimize unified audio analysis based on performance mode", async () => {
      // Fast mode - minimal analysis
      mockInvoke.mockResolvedValueOnce({ success: true, basic_analysis_only: true })

      await service.analyzeAudioComprehensive("/path/to/video.mp4", {
        performanceMode: "fast",
        enableFFmpeg: true,
        enableMontage: false,
        enableTranscription: false,
      })

      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
        videoPath: "/path/to/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: false,
          enable_transcription: false,
          performance_mode: "fast",
        },
      })

      // Quality mode - full analysis
      mockInvoke.mockResolvedValueOnce({ success: true, comprehensive_analysis: true })

      await service.analyzeAudioComprehensive("/path/to/video.mp4", {
        performanceMode: "quality",
        enableFFmpeg: true,
        enableMontage: true,
        enableTranscription: true,
      })

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
  })

  describe("System Status Integration", () => {
    it("should provide comprehensive system status", async () => {
      const audioCapabilities = {
        ffmpegAvailable: true,
        montageAvailable: true,
        whisperAvailable: false,
        gpuAvailable: true,
      }

      mockInvoke
        .mockResolvedValueOnce(mockCapabilities)
        .mockResolvedValueOnce(mockHealthResult)
        .mockResolvedValueOnce(audioCapabilities)

      const systemStatus = await service.getSystemStatus()

      expect(systemStatus).toEqual({
        capabilities: mockCapabilities,
        health: mockHealthResult,
        audioCapabilities,
      })

      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_capabilities")
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_health_check")
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_get_capabilities")
    })

    it("should check availability across all components", async () => {
      // Test when all systems are available
      mockInvoke.mockResolvedValueOnce(mockCapabilities)
      expect(await service.checkAvailability()).toBe(true)

      // Test when AI Director is unavailable
      mockInvoke.mockRejectedValueOnce(new Error("Service unavailable"))
      expect(await service.checkAvailability()).toBe(false)
    })
  })
})
