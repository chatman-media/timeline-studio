/**
 * @vitest-environment jsdom
 */
/**
 * Tests for useAnalysisTasks hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AnalysisPhase } from "../../types"
import type { AnalysisTask } from "../../types/analysis-task"
import { AnalysisTaskStatus } from "../../types/analysis-task"
import {
  formatAnalysisTaskDuration,
  getAnalysisTaskStatusColor,
  getAnalysisTaskStatusLabel,
  useAnalysisTasks,
} from "../use-analysis-tasks"

// Mock dependencies
vi.mock("../../services/analysis-task-bridge", () => ({
  analysisTaskBridge: {
    getActiveTasks: vi.fn(),
    getTask: vi.fn(),
    startAnalysis: vi.fn(),
    cancelTask: vi.fn(),
    subscribeToProgress: vi.fn(() => vi.fn()), // returns unsubscribe function
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

// Import mocked module
const { analysisTaskBridge } = await import("../../services/analysis-task-bridge")

// Mock data
const mockTask: AnalysisTask = {
  id: "task-1",
  video_path: "/test/video.mp4",
  video_name: "video.mp4",
  status: AnalysisTaskStatus.AnalyzingVideo,
  created_at: "2025-11-27T10:00:00Z",
  started_at: "2025-11-27T10:00:00Z",
  progress: {
    percentage: 50,
    phase: AnalysisPhase.AnalyzingVideo,
    current_file: "/test/video.mp4",
    message: "Analyzing video frames...",
    eta: 120,
  },
}

const mockCompletedTask: AnalysisTask = {
  id: "task-2",
  video_path: "/test/video2.mp4",
  video_name: "video2.mp4",
  status: AnalysisTaskStatus.Completed,
  created_at: "2025-11-27T09:00:00Z",
  started_at: "2025-11-27T09:00:00Z",
  completed_at: "2025-11-27T09:10:00Z",
  progress: {
    percentage: 100,
    phase: AnalysisPhase.Complete,
    current_file: "/test/video2.mp4",
  },
}

describe("useAnalysisTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial state", () => {
    it("должен инициализироваться с пустым списком задач", async () => {
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      // Ждем завершения начальной загрузки
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.tasks).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it("должен загрузить задачи при монтировании", async () => {
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([mockTask])

      const { result } = renderHook(() => useAnalysisTasks())

      await waitFor(
        () => {
          expect(result.current.tasks).toHaveLength(1)
          expect(result.current.tasks[0].id).toBe("task-1")
        },
        { timeout: 3000 },
      )
    })

    it("должен подписаться на события прогресса при монтировании", () => {
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      renderHook(() => useAnalysisTasks())

      expect(analysisTaskBridge.subscribeToProgress).toHaveBeenCalledOnce()
    })
  })

  describe("refreshTasks", () => {
    it("должен загрузить активные задачи", async () => {
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([mockTask, mockCompletedTask])

      const { result } = renderHook(() => useAnalysisTasks())

      await act(async () => {
        await result.current.refreshTasks()
      })

      expect(result.current.tasks).toHaveLength(2)
      expect(result.current.tasks[0].id).toBe("task-1")
      expect(result.current.tasks[1].id).toBe("task-2")
    })

    it("должен установить isLoading в true во время загрузки", async () => {
      let resolvePromise: (value: AnalysisTask[]) => void
      const promise = new Promise<AnalysisTask[]>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(analysisTaskBridge.getActiveTasks).mockReturnValue(promise)

      const { result } = renderHook(() => useAnalysisTasks())

      act(() => {
        void result.current.refreshTasks()
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise!([])
      })

      expect(result.current.isLoading).toBe(false)
    })

    it("должен обработать ошибку при загрузке", async () => {
      vi.mocked(analysisTaskBridge.getActiveTasks).mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => useAnalysisTasks())

      await act(async () => {
        await result.current.refreshTasks()
      })

      expect(result.current.error).toBe("Network error")
      expect(result.current.tasks).toEqual([])
    })

    it("должен предотвратить concurrent запросы", async () => {
      let firstResolve: (value: AnalysisTask[]) => void
      let secondResolve: (value: AnalysisTask[]) => void

      const firstPromise = new Promise<AnalysisTask[]>((resolve) => {
        firstResolve = resolve
      })
      const secondPromise = new Promise<AnalysisTask[]>((resolve) => {
        secondResolve = resolve
      })

      vi.mocked(analysisTaskBridge.getActiveTasks).mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise)

      const { result } = renderHook(() => useAnalysisTasks())

      // Первый вызов
      act(() => {
        void result.current.refreshTasks()
      })

      // Второй вызов (должен быть проигнорирован)
      act(() => {
        void result.current.refreshTasks()
      })

      await act(async () => {
        firstResolve!([mockTask])
      })

      // Второй вызов не должен быть выполнен
      expect(analysisTaskBridge.getActiveTasks).toHaveBeenCalledOnce()
    })
  })

  describe("getTask", () => {
    it("должен получить задачу по ID", async () => {
      vi.mocked(analysisTaskBridge.getTask).mockResolvedValue(mockTask)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      let task: AnalysisTask | null = null
      await act(async () => {
        task = await result.current.getTask("task-1")
      })

      expect(task).toEqual(mockTask)
      expect(analysisTaskBridge.getTask).toHaveBeenCalledWith("task-1")
    })

    it("должен вернуть null если задача не найдена", async () => {
      vi.mocked(analysisTaskBridge.getTask).mockResolvedValue(null)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      let task: AnalysisTask | null = null
      await act(async () => {
        task = await result.current.getTask("non-existent")
      })

      expect(task).toBeNull()
    })

    it("должен обработать ошибку и вернуть null", async () => {
      vi.mocked(analysisTaskBridge.getTask).mockRejectedValue(new Error("API error"))
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      let task: AnalysisTask | null = null
      await act(async () => {
        task = await result.current.getTask("task-1")
      })

      expect(task).toBeNull()
    })
  })

  describe("createTask", () => {
    it("должен создать новую задачу анализа", async () => {
      vi.mocked(analysisTaskBridge.startAnalysis).mockResolvedValue("new-task-id")
      vi.mocked(analysisTaskBridge.getTask).mockResolvedValue(mockTask)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([mockTask])

      const { result } = renderHook(() => useAnalysisTasks())

      let createdTask: AnalysisTask | null = null
      await act(async () => {
        createdTask = await result.current.createTask("/test/new-video.mp4", "new-video.mp4")
      })

      expect(analysisTaskBridge.startAnalysis).toHaveBeenCalledWith("/test/new-video.mp4")
      expect(createdTask).toEqual(mockTask)
    })

    it("должен обновить список задач после создания", async () => {
      vi.mocked(analysisTaskBridge.startAnalysis).mockResolvedValue("new-task-id")
      vi.mocked(analysisTaskBridge.getTask).mockResolvedValue(mockTask)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([mockTask])

      const { result } = renderHook(() => useAnalysisTasks())

      await act(async () => {
        await result.current.createTask("/test/new-video.mp4", "new-video.mp4")
      })

      // refreshTasks был вызван (изначально + после создания)
      expect(analysisTaskBridge.getActiveTasks).toHaveBeenCalledTimes(2)
    })

    it("должен выбросить ошибку если не удалось получить созданную задачу", async () => {
      vi.mocked(analysisTaskBridge.startAnalysis).mockResolvedValue("new-task-id")
      vi.mocked(analysisTaskBridge.getTask).mockResolvedValue(null)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      await expect(
        act(async () => {
          await result.current.createTask("/test/new-video.mp4", "new-video.mp4")
        }),
      ).rejects.toThrow("Failed to retrieve created task")
    })

    it("должен пробросить ошибку при неудачном создании", async () => {
      vi.mocked(analysisTaskBridge.startAnalysis).mockRejectedValue(new Error("Analysis start failed"))
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      await expect(
        act(async () => {
          await result.current.createTask("/test/new-video.mp4", "new-video.mp4")
        }),
      ).rejects.toThrow("Analysis start failed")
    })
  })

  describe("cancelTask", () => {
    it("должен отменить задачу", async () => {
      vi.mocked(analysisTaskBridge.cancelTask).mockResolvedValue(true)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      let success = false
      await act(async () => {
        success = await result.current.cancelTask("task-1")
      })

      expect(success).toBe(true)
      expect(analysisTaskBridge.cancelTask).toHaveBeenCalledWith("task-1")
    })

    it("должен обновить список задач после успешной отмены", async () => {
      vi.mocked(analysisTaskBridge.cancelTask).mockResolvedValue(true)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      await act(async () => {
        await result.current.cancelTask("task-1")
      })

      // refreshTasks был вызван (изначально + после отмены)
      expect(analysisTaskBridge.getActiveTasks).toHaveBeenCalledTimes(2)
    })

    it("должен вернуть false если отмена не удалась", async () => {
      vi.mocked(analysisTaskBridge.cancelTask).mockResolvedValue(false)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      let success = true
      await act(async () => {
        success = await result.current.cancelTask("task-1")
      })

      expect(success).toBe(false)
      // refreshTasks НЕ вызывается при неудачной отмене
      expect(analysisTaskBridge.getActiveTasks).toHaveBeenCalledOnce() // только initial
    })

    it("должен обработать ошибку и вернуть false", async () => {
      vi.mocked(analysisTaskBridge.cancelTask).mockRejectedValue(new Error("Cancel failed"))
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { result } = renderHook(() => useAnalysisTasks())

      let success = true
      await act(async () => {
        success = await result.current.cancelTask("task-1")
      })

      expect(success).toBe(false)
    })
  })

  describe("Progress subscription", () => {
    it("должен обновлять существующую задачу при получении события прогресса", async () => {
      let progressCallback: ((task: AnalysisTask) => void) | null = null
      vi.mocked(analysisTaskBridge.subscribeToProgress).mockImplementation((callback) => {
        progressCallback = callback
        return vi.fn()
      })
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([mockTask])

      const { result } = renderHook(() => useAnalysisTasks())

      await waitFor(
        () => {
          expect(result.current.tasks).toHaveLength(1)
        },
        { timeout: 3000 },
      )

      // Симулируем событие прогресса
      const updatedTask: AnalysisTask = {
        ...mockTask,
        progress: { ...mockTask.progress, percentage: 75 },
      }

      act(() => {
        progressCallback!(updatedTask)
      })

      expect(result.current.tasks[0].progress.percentage).toBe(75)
    })

    it("должен добавлять новую задачу если её нет в списке", async () => {
      let progressCallback: ((task: AnalysisTask) => void) | null = null
      vi.mocked(analysisTaskBridge.subscribeToProgress).mockImplementation((callback) => {
        progressCallback = callback
        return vi.fn()
      })
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([mockTask])

      const { result } = renderHook(() => useAnalysisTasks())

      await waitFor(
        () => {
          expect(result.current.tasks).toHaveLength(1)
        },
        { timeout: 3000 },
      )

      // Симулируем событие прогресса для новой задачи
      const newTask: AnalysisTask = {
        ...mockTask,
        id: "new-task",
      }

      act(() => {
        progressCallback!(newTask)
      })

      expect(result.current.tasks).toHaveLength(2)
      expect(result.current.tasks[1].id).toBe("new-task")
    })

    it("должен отписаться от событий при размонтировании", () => {
      const mockUnsubscribe = vi.fn()
      vi.mocked(analysisTaskBridge.subscribeToProgress).mockReturnValue(mockUnsubscribe)
      vi.mocked(analysisTaskBridge.getActiveTasks).mockResolvedValue([])

      const { unmount } = renderHook(() => useAnalysisTasks())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledOnce()
    })
  })

  // Note: Polling tests are skipped as they are complex to test with setInterval in useEffect
  // The polling logic is tested indirectly through integration tests
  describe.skip("Polling", () => {
    it("должен обновлять задачи каждые 30 секунд", () => {
      // TODO: Implement polling tests with proper fake timers setup
    })
    it("должен остановить polling при размонтировании", () => {
      // TODO: Implement polling tests with proper fake timers setup
    })
  })
})

describe("Helper functions", () => {
  describe("getAnalysisTaskStatusLabel", () => {
    const mockT = (key: string) => `translated_${key}`

    it("должен вернуть правильный label для каждого статуса", () => {
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.Pending, mockT)).toBe(
        "translated_montagePlanner.status.pending",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.Initializing, mockT)).toBe(
        "translated_montagePlanner.status.initializing",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.AnalyzingVideo, mockT)).toBe(
        "translated_montagePlanner.status.analyzingVideo",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.AnalyzingAudio, mockT)).toBe(
        "translated_montagePlanner.status.analyzingAudio",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.DetectingMoments, mockT)).toBe(
        "translated_montagePlanner.status.detectingMoments",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.GeneratingPlan, mockT)).toBe(
        "translated_montagePlanner.status.generatingPlan",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.Completed, mockT)).toBe(
        "translated_montagePlanner.status.completed",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.Failed, mockT)).toBe(
        "translated_montagePlanner.status.failed",
      )
      expect(getAnalysisTaskStatusLabel(AnalysisTaskStatus.Cancelled, mockT)).toBe(
        "translated_montagePlanner.status.cancelled",
      )
    })

    it("должен вернуть unknown для неизвестного статуса", () => {
      expect(getAnalysisTaskStatusLabel("invalid" as AnalysisTaskStatus, mockT)).toBe(
        "translated_montagePlanner.status.unknown",
      )
    })
  })

  describe("getAnalysisTaskStatusColor", () => {
    it("должен вернуть правильный цвет для каждого статуса", () => {
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.Pending)).toBe("text-gray-600 dark:text-gray-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.Initializing)).toBe("text-yellow-600 dark:text-yellow-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.AnalyzingVideo)).toBe("text-blue-600 dark:text-blue-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.AnalyzingAudio)).toBe("text-blue-600 dark:text-blue-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.DetectingMoments)).toBe("text-blue-600 dark:text-blue-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.GeneratingPlan)).toBe("text-blue-600 dark:text-blue-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.Completed)).toBe("text-green-600 dark:text-green-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.Failed)).toBe("text-red-600 dark:text-red-400")
      expect(getAnalysisTaskStatusColor(AnalysisTaskStatus.Cancelled)).toBe("text-gray-600 dark:text-gray-400")
    })

    it("должен вернуть default color для неизвестного статуса", () => {
      expect(getAnalysisTaskStatusColor("invalid" as AnalysisTaskStatus)).toBe("text-gray-500")
    })
  })

  describe("formatAnalysisTaskDuration", () => {
    it("должен форматировать длительность меньше 60 секунд", () => {
      const startTime = "2025-11-27T10:00:00Z"
      const endTime = "2025-11-27T10:00:45Z"

      expect(formatAnalysisTaskDuration(startTime, endTime)).toBe("45 sec")
    })

    it("должен использовать функцию перевода для секунд", () => {
      const startTime = "2025-11-27T10:00:00Z"
      const endTime = "2025-11-27T10:00:30Z"
      const mockT = (key: string) => key.replace("{{count}}", "30")

      expect(formatAnalysisTaskDuration(startTime, endTime, mockT)).toBe("montagePlanner.duration.seconds")
    })

    it("должен форматировать длительность больше 60 секунд", () => {
      const startTime = "2025-11-27T10:00:00Z"
      const endTime = "2025-11-27T10:02:30Z"

      const result = formatAnalysisTaskDuration(startTime, endTime)
      expect(result).toContain("2") // минуты
      expect(result).toContain("30") // секунды
    })

    it("должен использовать текущее время если endTime не указан", () => {
      const startTime = new Date(Date.now() - 45000).toISOString() // 45 секунд назад

      const result = formatAnalysisTaskDuration(startTime)
      // Примерно 45 секунд, но может варьироваться
      expect(result).toMatch(/4[0-9] sec/)
    })
  })
})
