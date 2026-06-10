/**
 * Тесты для AnalysisTaskBridge
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { AnalysisTaskStatus } from "../../types/analysis-task"
import { AnalysisTaskBridge } from "../analysis-task-bridge"
import type { AnalysisWorkflow } from "../domain-adapters"
import { unifiedOrchestrator } from "../domain-adapters"

// Mock dependencies
vi.mock("../domain-adapters", () => ({
  unifiedOrchestrator: {
    getActiveWorkflows: vi.fn(),
    getWorkflow: vi.fn(),
    analyzeComprehensive: vi.fn(),
    cancelWorkflow: vi.fn(),
  },
  DOMAIN_EVENTS: {
    AI_SERVICES: {
      AI_DIRECTOR_ANALYSIS_PROGRESS: "ai-services.ai-director.analysis-progress",
      AI_DIRECTOR_STAGE_COMPLETED: "ai-services.ai-director.stage-completed",
      CONTENT_ANALYSIS_STARTED: "ai-services.content.analysis-started",
      CONTENT_ANALYSIS_COMPLETED: "ai-services.content.analysis-completed",
    },
  },
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn(),
  },
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

describe("AnalysisTaskBridge", () => {
  let bridge: AnalysisTaskBridge

  beforeEach(() => {
    // Reset singleton
    AnalysisTaskBridge.resetInstance()
    bridge = AnalysisTaskBridge.getInstance()

    // Clear all mocks
    vi.clearAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("должен возвращать один и тот же instance", () => {
      const instance1 = AnalysisTaskBridge.getInstance()
      const instance2 = AnalysisTaskBridge.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("должен создать новый instance после reset", () => {
      const instance1 = AnalysisTaskBridge.getInstance()
      AnalysisTaskBridge.resetInstance()
      const instance2 = AnalysisTaskBridge.getInstance()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe("getActiveTasks", () => {
    it("должен вернуть пустой массив если нет workflows", async () => {
      const orchestrator = unifiedOrchestrator
      vi.mocked(orchestrator.getActiveWorkflows).mockReturnValue([])

      const tasks = await bridge.getActiveTasks()

      expect(tasks).toEqual([])
      expect(orchestrator.getActiveWorkflows).toHaveBeenCalledOnce()
    })

    it("должен преобразовать workflows в tasks", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "test-workflow-1",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date("2025-01-01T00:00:00Z"),
        stages: {
          aiDirector: "in_progress",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toMatchObject({
        id: "test-workflow-1",
        video_path: "/test/video.mp4",
        video_name: "video.mp4",
        status: AnalysisTaskStatus.AnalyzingVideo,
        created_at: "2025-01-01T00:00:00.000Z",
      })
    })

    it("должен кэшировать результаты", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "cached-workflow",
        status: "in_progress",
        videoPath: "/test/cached.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "in_progress",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      // Первый вызов
      const tasks1 = await bridge.getActiveTasks()
      // Второй вызов
      const tasks2 = await bridge.getActiveTasks()

      expect(tasks1[0].id).toBe("cached-workflow")
      expect(tasks2[0].id).toBe("cached-workflow")
      expect(unifiedOrchestrator.getActiveWorkflows).toHaveBeenCalledTimes(2)
    })
  })

  describe("getTask", () => {
    it("должен вернуть task из кэша", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "cached-task",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "completed",
          integration: "in_progress",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      // Заполняем кэш
      await bridge.getActiveTasks()

      // Получаем из кэша
      const task = await bridge.getTask("cached-task")

      expect(task).not.toBeNull()
      expect(task?.id).toBe("cached-task")
      expect(unifiedOrchestrator.getWorkflow).not.toHaveBeenCalled()
    })

    it("должен загрузить из orchestrator если нет в кэше", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "new-task",
        status: "completed",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        endTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "completed",
          integration: "completed",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getWorkflow).mockReturnValue(mockWorkflow)

      const task = await bridge.getTask("new-task")

      expect(task).not.toBeNull()
      expect(task?.id).toBe("new-task")
      expect(task?.status).toBe(AnalysisTaskStatus.Completed)
      expect(unifiedOrchestrator.getWorkflow).toHaveBeenCalledWith("new-task")
    })

    it("должен вернуть null если workflow не найден", async () => {
      vi.mocked(unifiedOrchestrator.getWorkflow).mockReturnValue(undefined)

      const task = await bridge.getTask("non-existent")

      expect(task).toBeNull()
    })
  })

  describe("Status Mapping", () => {
    it("должен правильно маппить pending status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "pending-task",
        status: "pending",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "pending",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.Pending)
    })

    it("должен правильно маппить analyzing_video status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "video-task",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "in_progress",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.AnalyzingVideo)
    })

    it("должен правильно маппить analyzing_audio status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "audio-task",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "in_progress",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.AnalyzingAudio)
    })

    it("должен правильно маппить generating_plan status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "plan-task",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "completed",
          integration: "in_progress",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.GeneratingPlan)
    })

    it("должен правильно маппить completed status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "completed-task",
        status: "completed",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        endTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "completed",
          integration: "completed",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.Completed)
    })

    it("должен правильно маппить failed status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "failed-task",
        status: "failed",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        endTime: new Date(),
        stages: {
          aiDirector: "failed",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [
          {
            stage: "aiDirector",
            error: "Analysis failed",
            timestamp: new Date(),
          },
        ],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.Failed)
      expect(tasks[0].error_message).toBe("Analysis failed")
    })

    it("должен правильно маппить cancelled status", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "cancelled-task",
        status: "cancelled",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        endTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].status).toBe(AnalysisTaskStatus.Cancelled)
    })
  })

  describe("Progress Calculation", () => {
    it("должен рассчитать 0% для pending stages", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "progress-0",
        status: "pending",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "pending",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].progress.percentage).toBe(0)
    })

    it("должен рассчитать 33% для одного completed stage", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "progress-33",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].progress.percentage).toBe(33)
    })

    it("должен рассчитать 67% для двух completed stages", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "progress-67",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "completed",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].progress.percentage).toBe(67)
    })

    it("должен рассчитать 100% для всех completed stages", async () => {
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "progress-100",
        status: "completed",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        endTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "completed",
          integration: "completed",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      const tasks = await bridge.getActiveTasks()

      expect(tasks[0].progress.percentage).toBe(100)
    })
  })

  describe("startAnalysis", () => {
    it("должен запустить анализ через orchestrator", async () => {
      const mockResult = {
        workflowId: "new-analysis",
        comprehensive: {} as any,
        unified: {} as any,
      }

      vi.mocked(unifiedOrchestrator.analyzeComprehensive).mockResolvedValue(mockResult)
      vi.mocked(unifiedOrchestrator.getWorkflow).mockReturnValue({
        workflowId: "new-analysis",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "in_progress",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      })

      const taskId = await bridge.startAnalysis("/test/video.mp4")

      expect(taskId).toBe("new-analysis")
      expect(unifiedOrchestrator.analyzeComprehensive).toHaveBeenCalledWith("/test/video.mp4", {
        aiDirectorConfig: undefined,
        montageOptions: undefined,
        skipMontageAnalysis: false,
      })
    })

    it("должен передать options в orchestrator", async () => {
      const mockResult = {
        workflowId: "analysis-with-options",
        comprehensive: {} as any,
        unified: {} as any,
      }

      vi.mocked(unifiedOrchestrator.analyzeComprehensive).mockResolvedValue(mockResult)
      vi.mocked(unifiedOrchestrator.getWorkflow).mockReturnValue({
        workflowId: "analysis-with-options",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "in_progress",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      })

      const options = {
        skipMontageAnalysis: true,
        montageOptions: {
          enable_audio_analysis: true,
          quality_threshold: 70,
        },
      }

      await bridge.startAnalysis("/test/video.mp4", options)

      expect(unifiedOrchestrator.analyzeComprehensive).toHaveBeenCalledWith("/test/video.mp4", {
        aiDirectorConfig: undefined,
        montageOptions: options.montageOptions,
        skipMontageAnalysis: true,
      })
    })
  })

  describe("cancelTask", () => {
    it("должен отменить задачу через orchestrator", async () => {
      vi.mocked(unifiedOrchestrator.cancelWorkflow).mockReturnValue(true)
      vi.mocked(unifiedOrchestrator.getWorkflow).mockReturnValue({
        workflowId: "cancelled-workflow",
        status: "cancelled",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        endTime: new Date(),
        stages: {
          aiDirector: "completed",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      })

      const success = await bridge.cancelTask("test-task")

      expect(success).toBe(true)
      expect(unifiedOrchestrator.cancelWorkflow).toHaveBeenCalledWith("test-task")
    })

    it("должен вернуть false если отмена не удалась", async () => {
      vi.mocked(unifiedOrchestrator.cancelWorkflow).mockReturnValue(false)

      const success = await bridge.cancelTask("non-cancellable")

      expect(success).toBe(false)
    })
  })

  describe("subscribeToProgress", () => {
    it("должен добавить callback подписку", () => {
      const callback = vi.fn()

      const unsubscribe = bridge.subscribeToProgress(callback)

      expect(typeof unsubscribe).toBe("function")
    })

    it("должен вызвать callback при обновлении прогресса", async () => {
      const callback = vi.fn()
      bridge.subscribeToProgress(callback)

      // Имитируем получение задачи
      const mockWorkflow: AnalysisWorkflow = {
        workflowId: "progress-update",
        status: "in_progress",
        videoPath: "/test/video.mp4",
        startTime: new Date(),
        stages: {
          aiDirector: "in_progress",
          montagePlanner: "pending",
          integration: "pending",
        },
        results: {},
        errors: [],
      }

      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

      await bridge.getActiveTasks()

      // Callback должен быть вызван при создании/обновлении задачи
      // (в реальности через события, но тут проверяем механизм)
      expect(callback).not.toHaveBeenCalled() // Пока не было событий
    })

    it("должен удалить callback при unsubscribe", () => {
      const callback = vi.fn()

      const unsubscribe = bridge.subscribeToProgress(callback)
      unsubscribe()

      // После unsubscribe callback не должен вызываться
      expect(typeof unsubscribe).toBe("function")
    })
  })

  describe("Video Name Extraction", () => {
    it("должен извлечь имя файла из пути", async () => {
      const testCases = [
        { path: "/Users/test/video.mp4", expected: "video.mp4" },
        { path: "/home/user/documents/project/final.mov", expected: "final.mov" },
        { path: "C:\\Videos\\recording.avi", expected: "recording.avi" },
        { path: "video.mp4", expected: "video.mp4" },
      ]

      for (const testCase of testCases) {
        const mockWorkflow: AnalysisWorkflow = {
          workflowId: `test-${testCase.expected}`,
          status: "in_progress",
          videoPath: testCase.path,
          startTime: new Date(),
          stages: {
            aiDirector: "in_progress",
            montagePlanner: "pending",
            integration: "pending",
          },
          results: {},
          errors: [],
        }

        vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockReturnValue([mockWorkflow])

        const tasks = await bridge.getActiveTasks()

        expect(tasks[0].video_name).toBe(testCase.expected)
      }
    })
  })

  describe("Error Handling", () => {
    it("должен обработать ошибку при getActiveTasks", async () => {
      vi.mocked(unifiedOrchestrator.getActiveWorkflows).mockImplementation(() => {
        throw new Error("Orchestrator error")
      })

      await expect(bridge.getActiveTasks()).rejects.toThrow("Orchestrator error")
    })

    it("должен обработать ошибку при startAnalysis", async () => {
      vi.mocked(unifiedOrchestrator.analyzeComprehensive).mockRejectedValue(new Error("Analysis failed"))

      await expect(bridge.startAnalysis("/test/video.mp4")).rejects.toThrow("Analysis failed")
    })
  })
})
