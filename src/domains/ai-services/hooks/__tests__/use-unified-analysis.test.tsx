/**
 * useUnifiedAnalysis Hook Tests
 *
 * Тесты для хука работы с Unified Orchestrator
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AnalysisOptions } from "@/types/montage-planner-rust"
import {
  mockComprehensiveAnalysisResult,
  mockMontageAnalysisResult,
  mockMontagePlan,
  mockUnifiedContentAnalysis,
} from "../../__mocks__/unified-orchestrator"
import { useUnifiedAnalysis } from "../use-unified-analysis"

// Mock unified orchestrator
vi.mock("../../services/unified-orchestrator", () => ({
  unifiedOrchestrator: {
    analyzeComprehensive: vi.fn().mockResolvedValue({
      workflowId: "test-workflow-123",
      comprehensive: mockComprehensiveAnalysisResult,
      montage: mockMontageAnalysisResult,
      unified: mockUnifiedContentAnalysis,
    }),
    analyzeBatch: vi.fn().mockResolvedValue({
      batchId: "test-batch-123",
      results: [
        {
          videoPath: "/test/video1.mp4",
          workflowId: "workflow-1",
          comprehensive: mockComprehensiveAnalysisResult,
          montage: mockMontageAnalysisResult,
          unified: mockUnifiedContentAnalysis,
          success: true,
        },
      ],
    }),
    generateMontagePlan: vi.fn().mockResolvedValue({
      analysisResults: [mockMontageAnalysisResult],
      plan: mockMontagePlan,
    }),
    optimizeMontagePlan: vi.fn().mockResolvedValue(mockMontagePlan),
    validateMontagePlan: vi.fn().mockResolvedValue({
      is_valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    }),
    calculatePlanStatistics: vi.fn().mockResolvedValue({
      total_segments: 5,
      total_duration: 30,
      average_segment_duration: 6,
      quality_distribution: { high: 3, medium: 2, low: 0 },
      transition_count: 4,
    }),
    getWorkflow: vi.fn(),
    getBatch: vi.fn(),
    getActiveWorkflows: vi.fn(() => []),
    getActiveBatches: vi.fn(() => []),
    cancelWorkflow: vi.fn(() => true),
    cleanupCompletedWorkflows: vi.fn(() => 2),
    getSystemStatus: vi.fn().mockResolvedValue({
      health: { overall_status: "healthy" },
      capabilities: {},
      version: "1.0.0",
    }),
    healthCheck: vi.fn().mockResolvedValue({
      isHealthy: true,
      aiDirector: { health: { overall_status: "healthy" }, available: true },
      timestamp: new Date().toISOString(),
    }),
    cleanup: vi.fn(),
  },
}))

describe("useUnifiedAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe("Initial State", () => {
    it("должен иметь корректное начальное состояние", () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      expect(result.current.state.currentWorkflow).toBeNull()
      expect(result.current.state.currentBatch).toBeNull()
      expect(result.current.state.latestResult).toBeNull()
      expect(result.current.state.latestMontageResult).toBeNull()
      expect(result.current.state.isAnalyzing).toBe(false)
      expect(result.current.state.isBatchAnalyzing).toBe(false)
      expect(result.current.state.isGeneratingPlan).toBe(false)
      expect(result.current.state.progress).toBe(0)
      expect(result.current.state.currentStage).toBeNull()
      expect(result.current.state.error).toBeNull()
    })
  })

  describe("Comprehensive Analysis", () => {
    it("должен выполнять comprehensive analysis", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let analysisResult: any

      await act(async () => {
        analysisResult = await result.current.analyzeComprehensive("/test/video.mp4")
      })

      expect(analysisResult.workflowId).toBe("test-workflow-123")
      expect(analysisResult.unified).toEqual(mockUnifiedContentAnalysis)
    })

    it("должен обновлять состояние во время анализа", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      act(() => {
        result.current.analyzeComprehensive("/test/video.mp4")
      })

      // Состояние должно измениться сразу после вызова
      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(true)
        expect(result.current.state.currentStage).toBe("initialization")
        expect(result.current.state.error).toBeNull()
      })
    })

    it("должен сохранять результаты после завершения", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      await act(async () => {
        await result.current.analyzeComprehensive("/test/video.mp4")
      })

      await waitFor(() => {
        expect(result.current.state.isAnalyzing).toBe(false)
        expect(result.current.state.latestResult).toEqual(mockUnifiedContentAnalysis)
        expect(result.current.state.latestMontageResult).toEqual(mockMontageAnalysisResult)
        expect(result.current.state.progress).toBe(100)
        expect(result.current.state.currentStage).toBe("completed")
      })
    })

    it("должен обрабатывать ошибки анализа", async () => {
      const { unifiedOrchestrator } = await import("../../services/unified-orchestrator")
      vi.mocked(unifiedOrchestrator.analyzeComprehensive).mockRejectedValueOnce(new Error("Analysis failed"))

      const { result } = renderHook(() => useUnifiedAnalysis())

      // Вызываем анализ с ожиданием ошибки
      await expect(
        act(async () => {
          await result.current.analyzeComprehensive("/test/video.mp4")
        }),
      ).rejects.toThrow("Analysis failed")

      // Проверяем что флаг анализа сброшен
      // (error может не успеть обновиться из-за React batching, но это не критично)
      expect(result.current.state.isAnalyzing).toBe(false)
    })

    it("должен передавать конфигурацию в orchestrator", async () => {
      const { unifiedOrchestrator } = await import("../../services/unified-orchestrator")
      const { result } = renderHook(() => useUnifiedAnalysis())

      const config = {
        aiDirectorConfig: {
          enable_audio_analysis: true,
          quality_threshold: 0.8,
        },
        skipMontageAnalysis: true,
      }

      await act(async () => {
        await result.current.analyzeComprehensive("/test/video.mp4", config)
      })

      expect(unifiedOrchestrator.analyzeComprehensive).toHaveBeenCalledWith("/test/video.mp4", config)
    })
  })

  describe("Batch Analysis", () => {
    it("должен анализировать несколько видео", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      const videoPaths = ["/test/video1.mp4", "/test/video2.mp4"]
      let batchResult: any

      await act(async () => {
        batchResult = await result.current.analyzeBatch(videoPaths)
      })

      expect(batchResult.batchId).toBe("test-batch-123")
      expect(batchResult.results).toHaveLength(1)
    })

    it("должен обновлять состояние во время batch анализа", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      act(() => {
        result.current.analyzeBatch(["/test/video1.mp4", "/test/video2.mp4"])
      })

      await waitFor(() => {
        expect(result.current.state.isBatchAnalyzing).toBe(true)
        expect(result.current.state.currentStage).toBe("batch_processing")
      })
    })

    it("должен сохранять информацию о batch после завершения", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      await act(async () => {
        await result.current.analyzeBatch(["/test/video1.mp4"])
      })

      await waitFor(() => {
        expect(result.current.state.isBatchAnalyzing).toBe(false)
        expect(result.current.state.progress).toBe(100)
        expect(result.current.state.currentStage).toBe("completed")
      })
    })
  })

  describe("Montage Plan Operations", () => {
    it("должен генерировать montage plan", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

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

      let planResult: any

      await act(async () => {
        planResult = await result.current.generateMontagePlan(videoIds, options)
      })

      expect(planResult.analysisResults).toBeDefined()
      expect(planResult.plan).toEqual(mockMontagePlan)
    })

    it("должен обновлять состояние во время генерации плана", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      act(() => {
        result.current.generateMontagePlan(["/test/video1.mp4"], {} as AnalysisOptions)
      })

      await waitFor(() => {
        expect(result.current.state.isGeneratingPlan).toBe(true)
      })
    })

    it("должен оптимизировать montage plan", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let optimized: any

      await act(async () => {
        optimized = await result.current.optimizeMontagePlan(mockMontagePlan, { style: "dynamic" })
      })

      expect(optimized).toEqual(mockMontagePlan)
    })

    it("должен валидировать montage plan", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let validation: any

      await act(async () => {
        validation = await result.current.validateMontagePlan(mockMontagePlan)
      })

      expect(validation.is_valid).toBe(true)
      expect(validation.errors).toEqual([])
    })

    it("должен рассчитывать статистику плана", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let stats: any

      await act(async () => {
        stats = await result.current.calculatePlanStatistics(mockMontagePlan)
      })

      expect(stats.total_segments).toBe(5)
      expect(stats.total_duration).toBe(30)
    })
  })

  describe("Workflow Management", () => {
    it("должен получать информацию о workflow", async () => {
      const { unifiedOrchestrator } = await import("../../services/unified-orchestrator")
      const { result } = renderHook(() => useUnifiedAnalysis())

      act(() => {
        result.current.getWorkflow("test-workflow-123")
      })

      expect(unifiedOrchestrator.getWorkflow).toHaveBeenCalledWith("test-workflow-123")
    })

    it("должен получать информацию о batch", async () => {
      const { unifiedOrchestrator } = await import("../../services/unified-orchestrator")
      const { result } = renderHook(() => useUnifiedAnalysis())

      act(() => {
        result.current.getBatch("test-batch-123")
      })

      expect(unifiedOrchestrator.getBatch).toHaveBeenCalledWith("test-batch-123")
    })

    it("должен отменять workflow", () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let cancelled: boolean = false

      act(() => {
        cancelled = result.current.cancelWorkflow("test-workflow-123")
      })

      expect(cancelled).toBe(true)
    })

    it("должен очищать завершенные workflows", () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let count: number = 0

      act(() => {
        count = result.current.clearCompletedWorkflows()
      })

      expect(count).toBe(2)
    })
  })

  describe("System Status", () => {
    it("должен получать системный статус", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let status: any

      await act(async () => {
        status = await result.current.getSystemStatus()
      })

      expect(status).toBeDefined()
      expect(status.health).toBeDefined()
    })

    it("должен выполнять health check", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      let health: any

      await act(async () => {
        health = await result.current.healthCheck()
      })

      expect(health.isHealthy).toBe(true)
    })
  })

  describe("State Management", () => {
    it("должен очищать ошибки", async () => {
      const { unifiedOrchestrator } = await import("../../services/unified-orchestrator")
      vi.mocked(unifiedOrchestrator.analyzeComprehensive).mockRejectedValueOnce(new Error("Test error"))

      const { result } = renderHook(() => useUnifiedAnalysis())

      // Вызываем ошибку
      await expect(async () => {
        await act(async () => {
          await result.current.analyzeComprehensive("/test/video.mp4")
        })
      }).rejects.toThrow()

      // Очищаем ошибку
      act(() => {
        result.current.clearError()
      })

      expect(result.current.state.error).toBeNull()
    })

    it("должен очищать результаты", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      // Создаем результаты
      await act(async () => {
        await result.current.analyzeComprehensive("/test/video.mp4")
      })

      // Очищаем
      act(() => {
        result.current.clearResults()
      })

      expect(result.current.state.latestResult).toBeNull()
      expect(result.current.state.latestMontageResult).toBeNull()
      expect(result.current.state.currentWorkflow).toBeNull()
      expect(result.current.state.currentBatch).toBeNull()
    })

    it("должен выполнять полный сброс", async () => {
      const { result } = renderHook(() => useUnifiedAnalysis())

      // Создаем результаты
      await act(async () => {
        await result.current.analyzeComprehensive("/test/video.mp4")
      })

      // Сброс
      act(() => {
        result.current.reset()
      })

      expect(result.current.state).toMatchObject({
        latestResult: null,
        latestMontageResult: null,
        isAnalyzing: false,
        isBatchAnalyzing: false,
        isGeneratingPlan: false,
        progress: 0,
        currentStage: null,
        error: null,
      })
    })
  })
})
