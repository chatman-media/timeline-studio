/**
 * Unified Orchestrator Tests
 *
 * Тесты для UnifiedOrchestrator - координатор AI Director + Montage Planner
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AIDirectorConfig } from "@/types/generated/tauri-bindings"
import type { AnalysisOptions } from "@/types/montage-planner-rust"
import { mockMontageAnalysisResult, mockMontagePlan } from "../../__mocks__/unified-orchestrator"
import { UnifiedOrchestrator } from "../unified-orchestrator"

// Mock dependencies
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/features/ai-director/services/ai-director-service", () => ({
  aiDirectorService: {
    analyzeComprehensive: vi.fn().mockResolvedValue({
      analysis_id: "test-analysis-123",
      status: "Completed",
      audio_analysis: {
        basic_metrics: {
          duration: { seconds: 60 },
          has_audio: true,
          sample_rate: { hz: 48000 },
          channels: 2,
          overall_volume: { level: 0.7 },
          estimated_quality: 0.85,
          file_size_bytes: 1024 * 1024 * 10,
          codec: "aac",
          bitrate: 320000,
        },
        ffmpeg_analysis: {
          volume_analysis: {
            peak_volume: { level: 0.95 },
            average_volume: { level: 0.7 },
            rms_volume: { level: 0.75 },
            dynamic_range: 0.8,
            loudness_lufs: -14.0,
            volume_histogram: [],
          },
          frequency_analysis: {
            dominant_frequencies: [],
            frequency_distribution: {
              bass_energy: 0.3,
              mid_energy: 0.5,
              treble_energy: 0.2,
              total_energy: 1.0,
            },
            spectral_centroid: { hz: 2000 },
            spectral_rolloff: { hz: 8000 },
            zero_crossing_rate: 0.1,
          },
          dynamics_analysis: {
            crest_factor: 1.5,
            dynamic_range: 0.8,
            compression_ratio: 2.0,
            attack_time: { seconds: 0.01 },
            release_time: { seconds: 0.1 },
          },
          quality_metrics: {
            overall_score: 0.85,
            noise_level: 0.1,
            clipping_detected: false,
            distortion_level: 0.05,
            signal_to_noise_ratio: 40.0,
            issues: [],
          },
        },
        montage_analysis: {
          dynamic_range: 0.8,
          speech_probability: 0.9,
          music_probability: 0.1,
          overall_quality_score: 0.85,
          content_segments: [],
          silence_segments: [],
          beat_detection: null,
          tempo_analysis: null,
          key_detection: null,
          emotional_tone: null,
          energy_level: 0.7,
          valence: 0.6,
          sync_analysis: null,
        },
        transcription_analysis: {
          engine_name: "whisper",
          full_text: "Test transcription",
          detected_language: "en",
          total_duration: { seconds: 60 },
          segments: [],
          words: [],
          confidence_score: 0.9,
          processing_time: { seconds: 2.5 },
          transcription_text: "Test",
          language_detected: "en",
          overall_confidence: 0.9,
          word_segments: [],
          sentence_segments: [],
          speaker_segments: [],
          speech_rate: null,
          pause_analysis: null,
          pronunciation_quality: null,
          model_used: "base",
          provider_used: "local",
        },
        analysis_metadata: {
          analysis_version: "2.0-unified",
          processing_time_ms: 1000,
          config_used: {
            enable_ffmpeg_analysis: true,
            enable_montage_analysis: true,
            enable_transcription: true,
            ffmpeg_config: null,
            montage_config: null,
            whisper_config: null,
            performance_mode: "Balanced",
            max_processing_time_seconds: 300,
            enable_caching: true,
          },
          engines_used: ["ffmpeg", "montage", "whisper"],
          total_engines_available: 3,
          analysis_timestamp: new Date().toISOString(),
          success_rate: 1.0,
        },
      },
      scene_analysis: {
        scenes: [
          {
            startTime: 0,
            endTime: 10,
            sceneType: "dialog",
            confidence: 0.9,
            description: "Test",
            audioCharacteristics: null,
            visualCharacteristics: null,
            contentTags: [],
            actionIntensity: 0.5,
            emotionalTone: "neutral",
          },
        ],
        total_scenes: 1,
        avg_scene_duration: 10,
        scene_types_distribution: { dialog: 1 },
      },
      vision_analysis: {
        objects_detected: [],
        faces_count: 0,
        avg_composition_score: 0.85,
        visual_quality_avg: 0.9,
      },
      moment_analysis: {
        key_moments: [],
        total_moments: 0,
        moment_types_distribution: {},
        avg_importance: 0,
      },
      content_analysis: {
        classification: {
          primaryCategory: "video",
          categories: ["entertainment"],
          genre: "general",
          themes: ["test"],
          tags: [],
          confidence: 0.9,
        },
        mood: {
          primary_mood: "positive",
          mood_scores: {},
          emotional_arc: [],
          overall_sentiment: 0.7,
        },
        quality: {
          overall: 0.85,
          technicalQuality: 0.9,
          contentQuality: 0.8,
          productionValue: 0.85,
        },
        avg_composition: {
          overall: 0.85,
          ruleOfThirds: 0.8,
          balance: 0.9,
          focusClarity: 0.85,
          symmetry: 0.75,
        },
      },
      combined_insights: {
        key_moments: [],
        emotional_timeline: [],
        transitions: [],
        overall_quality: 0.85,
        main_subjects: [],
        content_mood: "positive",
      },
      performance_metrics: {
        total_processing_time: 1000,
        audio_analysis_time: 200,
        scene_analysis_time: 200,
        vision_analysis_time: 200,
        moment_analysis_time: 200,
        content_analysis_time: 100,
        integration_time: 100,
        memory_used: 1024 * 1024 * 100,
        success_rate: 1.0,
      },
      editing_recommendations: [],
      errors: [],
      metadata: {
        analysis_version: "1.0.0",
        processing_time_ms: 1000,
        config_used: "default",
        engines_used: ["audio", "vision"],
        total_engines_available: 5,
        analysis_timestamp: new Date().toISOString(),
        success_rate: 1.0,
      },
    }),
    getSystemStatus: vi.fn().mockResolvedValue({
      health: { overall_status: "healthy" },
      capabilities: {
        audio_analysis: true,
        vision_analysis: true,
        scene_analysis: true,
      },
      version: "1.0.0",
    }),
    healthCheck: vi.fn().mockResolvedValue({ overall_status: "healthy" }),
    checkAvailability: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock("@/domains/shared/events", () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
  },
  DOMAIN_EVENTS: {
    AI_SERVICES: {
      CONTENT_ANALYSIS_STARTED: "ai-services:content-analysis-started",
      CONTENT_ANALYSIS_COMPLETED: "ai-services:content-analysis-completed",
      MONTAGE_PLAN_GENERATED: "ai-services:montage-plan-generated",
    },
    MEDIA: {
      FILES_IMPORTED: "media:files-imported",
    },
    VIDEO: {
      TIMELINE_CREATED: "video:timeline-created",
    },
  },
}))

describe("UnifiedOrchestrator", () => {
  let orchestrator: UnifiedOrchestrator

  beforeEach(() => {
    UnifiedOrchestrator.resetInstance()
    orchestrator = UnifiedOrchestrator.getInstance()
  })

  afterEach(() => {
    orchestrator.cleanup()
    vi.clearAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("должен возвращать один и тот же экземпляр", () => {
      const instance1 = UnifiedOrchestrator.getInstance()
      const instance2 = UnifiedOrchestrator.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("должен создавать новый экземпляр после reset", () => {
      const instance1 = UnifiedOrchestrator.getInstance()
      UnifiedOrchestrator.resetInstance()
      const instance2 = UnifiedOrchestrator.getInstance()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe("Comprehensive Analysis", () => {
    it("должен выполнять comprehensive analysis для видео", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce([mockMontageAnalysisResult])

      const result = await orchestrator.analyzeComprehensive("/test/video.mp4")

      expect(result.workflowId).toBeDefined()
      expect(result.comprehensive).toBeDefined()
      expect(result.unified).toBeDefined()
      expect(result.comprehensive.analysis_id).toBe("test-analysis-123")
    })

    it("должен пропускать montage analysis если указано", async () => {
      const result = await orchestrator.analyzeComprehensive("/test/video.mp4", {
        skipMontageAnalysis: true,
      })

      expect(result.montage).toBeUndefined()
      expect(result.comprehensive).toBeDefined()
      expect(result.unified).toBeDefined()
    })

    it("должен использовать переданную конфигурацию AI Director", async () => {
      const { aiDirectorService } = await import("@/features/ai-director/services/ai-director-service")

      const config: AIDirectorConfig = {
        enable_audio_analysis: true,
        enable_scene_analysis: false,
        enable_vision_analysis: true,
        enable_moment_analysis: true,
        enable_content_analysis: false,
        quality_threshold: 0.7,
        max_processing_time: 30000,
      }

      await orchestrator.analyzeComprehensive("/test/video.mp4", {
        aiDirectorConfig: config,
      })

      expect(aiDirectorService.analyzeComprehensive).toHaveBeenCalledWith("/test/video.mp4", expect.any(Object))
    })

    it("должен создавать workflow для анализа", async () => {
      const result = await orchestrator.analyzeComprehensive("/test/video.mp4")

      const workflow = orchestrator.getWorkflow(result.workflowId)

      expect(workflow).toBeDefined()
      expect(workflow?.status).toBe("completed")
      expect(workflow?.videoPath).toBe("/test/video.mp4")
      expect(workflow?.stages.aiDirector).toBe("completed")
    })

    it("должен обрабатывать ошибки AI Director", async () => {
      const { aiDirectorService } = await import("@/features/ai-director/services/ai-director-service")
      vi.mocked(aiDirectorService.analyzeComprehensive).mockRejectedValueOnce(new Error("AI Director failed"))

      await expect(orchestrator.analyzeComprehensive("/test/video.mp4")).rejects.toThrow(
        "Comprehensive analysis failed",
      )
    })

    it("должен продолжать работу если montage analysis не удался", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Montage analysis failed"))

      const result = await orchestrator.analyzeComprehensive("/test/video.mp4", {
        skipMontageAnalysis: false,
      })

      // Comprehensive analysis должен завершиться успешно
      expect(result.comprehensive).toBeDefined()
      expect(result.unified).toBeDefined()

      // Montage analysis должен быть undefined
      expect(result.montage).toBeUndefined()

      // Workflow должен содержать ошибку
      const workflow = orchestrator.getWorkflow(result.workflowId)
      expect(workflow?.errors).toHaveLength(1)
      expect(workflow?.stages.montagePlanner).toBe("failed")
    })
  })

  describe("Batch Analysis", () => {
    it("должен анализировать несколько видео", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue([mockMontageAnalysisResult])

      const videoPaths = ["/test/video1.mp4", "/test/video2.mp4"]
      const result = await orchestrator.analyzeBatch(videoPaths)

      expect(result.batchId).toBeDefined()
      expect(result.results).toHaveLength(2)
      expect(result.results.every((r) => r.success)).toBe(true)
    })

    it("должен отслеживать прогресс batch анализа", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValue([mockMontageAnalysisResult])

      const videoPaths = ["/test/video1.mp4", "/test/video2.mp4", "/test/video3.mp4"]
      const result = await orchestrator.analyzeBatch(videoPaths)

      const batch = orchestrator.getBatch(result.batchId)

      expect(batch).toBeDefined()
      expect(batch?.status).toBe("completed")
      expect(batch?.completedCount).toBe(3)
      expect(batch?.failedCount).toBe(0)
    })

    it("должен обрабатывать частичные ошибки в batch", async () => {
      const { aiDirectorService } = await import("@/features/ai-director/services/ai-director-service")
      const { mockComprehensiveAnalysisResult } = await import("../../__mocks__/ai-director-service")

      // Первый вызов успешный, второй с ошибкой
      vi.mocked(aiDirectorService.analyzeComprehensive)
        .mockResolvedValueOnce(mockComprehensiveAnalysisResult as any)
        .mockRejectedValueOnce(new Error("Analysis failed"))

      const videoPaths = ["/test/video1.mp4", "/test/video2.mp4"]
      const result = await orchestrator.analyzeBatch(videoPaths)

      expect(result.results).toHaveLength(2)
      expect(result.results[0].success).toBe(true)
      expect(result.results[1].success).toBe(false)
      expect(result.results[1].error).toBeDefined()

      const batch = orchestrator.getBatch(result.batchId)
      expect(batch?.completedCount).toBe(1)
      expect(batch?.failedCount).toBe(1)
    })
  })

  describe("Montage Plan Operations", () => {
    it("должен генерировать plan монтажа", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce([mockMontageAnalysisResult])

      const videoIds = ["/test/video1.mp4", "/test/video2.mp4"]
      const options: AnalysisOptions = {
        enable_object_detection: true,
        enable_face_detection: true,
        enable_emotion_analysis: true,
        enable_composition_analysis: true,
        enable_audio_analysis: true,
        frame_sample_rate: 1.0,
        quality_threshold: 50.0,
        max_moments: 50,
        frame_sampling_rate: 1.0,
      }

      const result = await orchestrator.generateMontagePlan(videoIds, options)

      expect(result.analysisResults).toBeDefined()
      expect(result.analysisResults).toHaveLength(1)
      expect(invoke).toHaveBeenCalledWith("analyze_montage_videos", {
        videoIds,
        options,
      })
    })

    it("должен оптимизировать существующий plan", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce(mockMontagePlan)

      const optimized = await orchestrator.optimizeMontagePlan(mockMontagePlan, {
        style: "cinematic",
      })

      expect(optimized).toBeDefined()
      expect(invoke).toHaveBeenCalledWith("optimize_montage_plan", {
        plan: mockMontagePlan,
        preferences: { style: "cinematic" },
      })
    })

    it("должен валидировать plan монтажа", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce({
        is_valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      })

      const validation = await orchestrator.validateMontagePlan(mockMontagePlan)

      expect(validation.is_valid).toBe(true)
      expect(validation.errors).toEqual([])
      expect(invoke).toHaveBeenCalledWith("validate_montage_plan", {
        plan: mockMontagePlan,
      })
    })

    it("должен рассчитывать статистику плана", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      vi.mocked(invoke).mockResolvedValueOnce({
        total_segments: 5,
        total_duration: 30,
        average_segment_duration: 6,
        quality_distribution: { high: 3, medium: 2, low: 0 },
        transition_count: 4,
      })

      const stats = await orchestrator.calculatePlanStatistics(mockMontagePlan)

      expect(stats.total_segments).toBe(5)
      expect(stats.total_duration).toBe(30)
      expect(invoke).toHaveBeenCalledWith("calculate_plan_statistics", {
        plan: mockMontagePlan,
      })
    })
  })

  describe("Workflow Management", () => {
    it("должен получать информацию о workflow", async () => {
      const result = await orchestrator.analyzeComprehensive("/test/video.mp4")
      const workflow = orchestrator.getWorkflow(result.workflowId)

      expect(workflow).toBeDefined()
      expect(workflow?.workflowId).toBe(result.workflowId)
    })

    it("должен получать список активных workflows", async () => {
      const workflows = orchestrator.getActiveWorkflows()
      expect(Array.isArray(workflows)).toBe(true)
    })

    it("должен получать список активных batches", async () => {
      const batches = orchestrator.getActiveBatches()
      expect(Array.isArray(batches)).toBe(true)
    })

    it("должен отменять workflow", async () => {
      // Создаем workflow (он будет в состоянии completed)
      const result = await orchestrator.analyzeComprehensive("/test/video.mp4")

      // Попытка отменить завершенный workflow должна вернуть false
      const cancelled = orchestrator.cancelWorkflow(result.workflowId)
      expect(cancelled).toBe(false)
    })

    it("должен очищать завершенные workflows", async () => {
      await orchestrator.analyzeComprehensive("/test/video1.mp4")
      await orchestrator.analyzeComprehensive("/test/video2.mp4")

      const cleanedCount = orchestrator.cleanupCompletedWorkflows()

      expect(cleanedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe("System Status", () => {
    it("должен получать системный статус", async () => {
      const status = await orchestrator.getSystemStatus()

      expect(status).toBeDefined()
      expect(status.health).toBeDefined()
      expect(status.capabilities).toBeDefined()
      expect(status.version).toBe("1.0.0")
    })

    it("должен выполнять health check", async () => {
      const health = await orchestrator.healthCheck()

      expect(health).toBeDefined()
      expect(health.isHealthy).toBe(true)
      expect(health.aiDirector).toBeDefined()
      expect(health.timestamp).toBeDefined()
    })
  })

  describe("Event Publishing", () => {
    it("должен публиковать события начала анализа", async () => {
      const { eventBus } = await import("@/domains/shared/events")

      await orchestrator.analyzeComprehensive("/test/video.mp4")

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.stringContaining("content-analysis-started"),
        "ai-services",
        expect.objectContaining({
          analysisId: expect.any(String),
          mediaFiles: expect.any(Array),
        }),
      )
    })

    it("должен публиковать события завершения анализа", async () => {
      const { eventBus } = await import("@/domains/shared/events")

      await orchestrator.analyzeComprehensive("/test/video.mp4")

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.stringContaining("content-analysis-completed"),
        "ai-services",
        expect.objectContaining({
          analysisId: expect.any(String),
          results: expect.any(Object),
        }),
      )
    })
  })

  describe("Cleanup", () => {
    it("должен очищать все данные", async () => {
      await orchestrator.analyzeComprehensive("/test/video1.mp4")
      await orchestrator.analyzeBatch(["/test/video2.mp4", "/test/video3.mp4"])

      orchestrator.cleanup()

      const workflows = orchestrator.getActiveWorkflows()
      const batches = orchestrator.getActiveBatches()

      expect(workflows).toHaveLength(0)
      expect(batches).toHaveLength(0)
    })
  })
})
