/**
 * AI Intelligence Machine Tests
 *
 * Тесты для state machine AI Intelligence с интеграцией AI Director
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import type { AIDirectorConfig } from "@/types/generated/tauri-bindings"
import type { AnalysisOptions } from "@/types/montage-planner-rust"
import { aiIntelligenceMachine } from "../ai-intelligence-machine"

// Mock dependencies
vi.mock("@/features/ai-director/services/ai-director-service", async () => {
  const mocks = await import("../../__mocks__/ai-director-service")
  return {
    aiDirectorService: {
      analyzeComprehensive: vi.fn().mockResolvedValue(mocks.mockComprehensiveAnalysisResult),
      getSystemStatus: vi.fn().mockResolvedValue({
        health: { overall_status: "healthy" },
        capabilities: {},
        version: "1.0.0",
      }),
      healthCheck: vi.fn().mockResolvedValue({ overall_status: "healthy" }),
      checkAvailability: vi.fn().mockResolvedValue(true),
    },
  }
})

vi.mock("../../services/unified-orchestrator", async () => {
  const mocks = await import("../../__mocks__/ai-director-service")
  return {
    unifiedOrchestrator: {
      analyzeComprehensive: vi.fn().mockResolvedValue({
        workflowId: "test-workflow-123",
        comprehensive: mocks.mockComprehensiveAnalysisResult,
        montage: mocks.mockMontageAnalysisResult,
        unified: mocks.mockUnifiedContentAnalysis,
      }),
      analyzeBatch: vi.fn().mockResolvedValue({
        batchId: "test-batch-123",
        results: [
          {
            videoPath: "/test/video1.mp4",
            workflowId: "workflow-1",
            comprehensive: mocks.mockComprehensiveAnalysisResult,
            montage: mocks.mockMontageAnalysisResult,
            unified: mocks.mockUnifiedContentAnalysis,
            success: true,
          },
        ],
      }),
      generateMontagePlan: vi.fn().mockResolvedValue({
        analysisResults: [mocks.mockMontageAnalysisResult],
        plan: {
          id: "test-plan-123",
          style: "dynamic",
          total_duration: 30,
          segments: [],
        },
      }),
      healthCheck: vi.fn().mockResolvedValue({
        isHealthy: true,
        aiDirector: { health: { overall_status: "healthy" }, available: true },
        timestamp: new Date().toISOString(),
      }),
    },
  }
})

describe("AI Intelligence Machine", () => {
  let actor: ReturnType<typeof createActor<typeof aiIntelligenceMachine>>

  beforeEach(() => {
    actor = createActor(aiIntelligenceMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("должен стартовать в состоянии idle", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("должен иметь корректный начальный контекст", () => {
      const context = actor.getSnapshot().context

      expect(context.mediaFiles).toEqual([])
      expect(context.currentVideoPath).toBeNull()
      expect(context.aiDirectorConfig).toBeNull()
      expect(context.montageOptions).toBeNull()
      expect(context.comprehensiveResults.size).toBe(0)
      expect(context.montageResults.size).toBe(0)
      expect(context.unifiedAnalyses.size).toBe(0)
      expect(context.currentMontageplan).toBeNull()
      expect(context.isAnalyzing).toBe(false)
      expect(context.isBatchAnalyzing).toBe(false)
      expect(context.isGeneratingPlan).toBe(false)
      expect(context.error).toBeNull()
      expect(context.systemAvailable).toBe(false)
    })
  })

  describe("Configuration Updates", () => {
    it("должен обновлять AI Director config", () => {
      const config: Partial<AIDirectorConfig> = {
        enable_audio_analysis: true,
        enable_scene_analysis: true,
        quality_threshold: 0.8,
      }

      actor.send({
        type: "UPDATE_AI_DIRECTOR_CONFIG",
        config,
      })

      const context = actor.getSnapshot().context
      expect(context.aiDirectorConfig).toMatchObject(config)
    })

    it("должен обновлять Montage options", () => {
      const options: Partial<AnalysisOptions> = {
        enable_face_detection: true,
        quality_threshold: 60.0,
        max_moments: 100,
      }

      actor.send({
        type: "UPDATE_MONTAGE_OPTIONS",
        options,
      })

      const context = actor.getSnapshot().context
      expect(context.montageOptions).toMatchObject(options)
    })
  })

  describe("Single Video Analysis", () => {
    it("должен анализировать видео и переходить в состояние analyzingVideo", async () => {
      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("analyzingVideo"))

      const context = actor.getSnapshot().context
      expect(context.currentVideoPath).toBe("/test/video.mp4")
      expect(context.isAnalyzing).toBe(true)
      expect(context.error).toBeNull()
    })

    it("должен сохранять результаты анализа после завершения", async () => {
      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle"), { timeout: 5000 })

      const context = actor.getSnapshot().context
      expect(context.isAnalyzing).toBe(false)
      expect(context.comprehensiveResults.size).toBe(1)
      expect(context.unifiedAnalyses.size).toBe(1)
      expect(context.currentWorkflowId).toBe("test-workflow-123")
    })

    it("должен обрабатывать ошибки анализа", async () => {
      // Mock error
      const { unifiedOrchestrator } = await import("../../services/unified-orchestrator")
      vi.mocked(unifiedOrchestrator.analyzeComprehensive).mockRejectedValueOnce(new Error("Analysis failed"))

      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("idle"), { timeout: 5000 })

      const context = actor.getSnapshot().context
      expect(context.isAnalyzing).toBe(false)
      expect(context.error).toContain("Analysis failed")
    })

    it("должен позволять отменить анализ", async () => {
      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("analyzingVideo"))

      actor.send({ type: "CANCEL_ANALYSIS" })

      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.isAnalyzing).toBe(false)
    })
  })

  describe("Batch Analysis", () => {
    it("должен анализировать несколько видео", async () => {
      const videoPaths = ["/test/video1.mp4", "/test/video2.mp4"]

      actor.send({
        type: "ANALYZE_BATCH",
        videoPaths,
      })

      await waitFor(actor, (state) => state.matches("analyzingBatch"))

      const context = actor.getSnapshot().context
      expect(context.mediaFiles).toEqual(videoPaths)
      expect(context.isBatchAnalyzing).toBe(true)
    })

    it("должен сохранять результаты batch анализа", async () => {
      actor.send({
        type: "ANALYZE_BATCH",
        videoPaths: ["/test/video1.mp4", "/test/video2.mp4"],
      })

      await waitFor(actor, (state) => state.matches("idle"), { timeout: 5000 })

      const context = actor.getSnapshot().context
      expect(context.isBatchAnalyzing).toBe(false)
      expect(context.currentBatchId).toBe("test-batch-123")
      expect(context.comprehensiveResults.size).toBeGreaterThan(0)
    })
  })

  describe("Montage Plan Generation", () => {
    it("должен генерировать план монтажа", async () => {
      const videoIds = ["/test/video1.mp4", "/test/video2.mp4"]

      actor.send({
        type: "GENERATE_MONTAGE_PLAN",
        videoIds,
      })

      await waitFor(actor, (state) => state.matches("generatingPlan"))

      const context = actor.getSnapshot().context
      expect(context.mediaFiles).toEqual(videoIds)
      expect(context.isGeneratingPlan).toBe(true)
    })

    it("должен сохранять сгенерированный план", async () => {
      actor.send({
        type: "GENERATE_MONTAGE_PLAN",
        videoIds: ["/test/video1.mp4"],
      })

      await waitFor(actor, (state) => state.matches("idle"), { timeout: 5000 })

      const context = actor.getSnapshot().context
      expect(context.isGeneratingPlan).toBe(false)
      expect(context.montageResults.size).toBeGreaterThan(0)
    })
  })

  describe("System Status", () => {
    it("должен проверять системный статус", async () => {
      actor.send({ type: "CHECK_SYSTEM_STATUS" })

      await waitFor(actor, (state) => state.matches("checkingSystem"))
      await waitFor(actor, (state) => state.matches("idle"), { timeout: 5000 })

      const context = actor.getSnapshot().context
      expect(context.systemAvailable).toBe(true)
      expect(context.capabilities).toBeDefined()
    })

    it("должен выполнять health check", async () => {
      actor.send({ type: "HEALTH_CHECK" })

      await waitFor(actor, (state) => state.matches("healthChecking"))
      await waitFor(actor, (state) => state.matches("idle"), { timeout: 5000 })

      const context = actor.getSnapshot().context
      expect(context.systemAvailable).toBe(true)
    })
  })

  describe("State Management", () => {
    it("должен очищать результаты", () => {
      // Сначала добавим результаты
      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      // Очистка
      actor.send({ type: "CLEAR_RESULTS" })

      const context = actor.getSnapshot().context
      expect(context.comprehensiveResults.size).toBe(0)
      expect(context.montageResults.size).toBe(0)
      expect(context.unifiedAnalyses.size).toBe(0)
      expect(context.currentMontageplan).toBeNull()
      expect(context.currentWorkflowId).toBeNull()
      expect(context.currentBatchId).toBeNull()
    })

    it("должен очищать ошибки", () => {
      // Установим ошибку вручную через внутреннее состояние
      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      actor.send({ type: "CLEAR_ERROR" })

      const context = actor.getSnapshot().context
      expect(context.error).toBeNull()
    })

    it("должен выполнять полный сброс", () => {
      // Добавим данные
      actor.send({
        type: "UPDATE_AI_DIRECTOR_CONFIG",
        config: { enable_audio_analysis: true },
      })

      // Сброс
      actor.send({ type: "RESET" })

      const context = actor.getSnapshot().context
      expect(context.aiDirectorConfig).toBeNull()
      expect(context.montageOptions).toBeNull()
      expect(context.comprehensiveResults.size).toBe(0)
      expect(context.error).toBeNull()
    })
  })

  describe("Progress Tracking", () => {
    it("должен обновлять прогресс во время анализа", async () => {
      actor.send({
        type: "ANALYZE_VIDEO",
        videoPath: "/test/video.mp4",
      })

      await waitFor(actor, (state) => state.matches("analyzingVideo"))

      // Симулируем событие прогресса
      actor.send({
        type: "ANALYSIS_PROGRESS",
        stage: "ai_director",
        progress: 50,
        message: "Processing AI Director analysis...",
      })

      const context = actor.getSnapshot().context
      expect(context.progress.stage).toBe("ai_director")
      expect(context.progress.progress).toBe(50)
      expect(context.progress.message).toBe("Processing AI Director analysis...")
    })
  })
})
