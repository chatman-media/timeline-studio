/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAnalysisTasks } from "../../hooks"
import { AnalysisPhase } from "../../types"
import type { AnalysisTask } from "../../types/analysis-task"
import { AnalysisTaskStatus } from "../../types/analysis-task"
import { AnalysisTasksDropdown } from "../analysis-tasks-dropdown"

// Mock the hook
vi.mock("../../hooks", () => ({
  useAnalysisTasks: vi.fn(),
  getAnalysisTaskStatusLabel: vi.fn((status: string) => `Status: ${status}`),
  getAnalysisTaskStatusColor: vi.fn(() => "text-blue-600"),
  formatAnalysisTaskDuration: vi.fn(() => "5 min"),
}))

// Mock useAIDirectorAnalysisV2
vi.mock("@/features/ai-director/hooks/use-ai-director-analysis-v2", () => ({
  useAIDirectorAnalysisV2: vi.fn(() => ({
    filesProgress: [],
    isAnalyzing: false,
    cancelAnalysis: vi.fn(),
    errors: [],
    overallProgress: 0,
    availableVlmModels: {},
    startBatchAnalysis: vi.fn(),
    clearErrors: vi.fn(),
    reset: vi.fn(),
    batchProgress: null,
  })),
}))

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockUseAnalysisTasks = vi.mocked(useAnalysisTasks)

describe("AnalysisTasksDropdown", () => {
  const mockTask: AnalysisTask = {
    id: "task-1",
    video_path: "/path/to/video.mp4",
    video_name: "video.mp4",
    status: AnalysisTaskStatus.AnalyzingVideo,
    created_at: "2025-01-27T10:00:00Z",
    started_at: "2025-01-27T10:00:00Z",
    progress: {
      percentage: 45,
      phase: AnalysisPhase.AnalyzingVideo,
      current_file: "/path/to/video.mp4",
      message: "Analyzing video content",
      eta: 300,
    },
  }

  const mockCompletedTask: AnalysisTask = {
    id: "task-2",
    video_path: "/path/to/completed.mp4",
    video_name: "completed.mp4",
    status: AnalysisTaskStatus.Completed,
    created_at: "2025-01-27T09:00:00Z",
    started_at: "2025-01-27T09:00:00Z",
    completed_at: "2025-01-27T09:30:00Z",
    progress: {
      percentage: 100,
      phase: AnalysisPhase.Complete,
      current_file: "/path/to/completed.mp4",
    },
    results: {
      videoAnalysis: {} as any,
      audioAnalysis: {} as any,
      momentScores: [{ timestamp: 10, score: 0.9 } as any],
      montagePlan: {
        sequences: [{ clips: [] } as any],
      } as any,
    },
  }

  const mockFailedTask: AnalysisTask = {
    id: "task-3",
    video_path: "/path/to/failed.mp4",
    video_name: "failed.mp4",
    status: AnalysisTaskStatus.Failed,
    created_at: "2025-01-27T08:00:00Z",
    started_at: "2025-01-27T08:00:00Z",
    completed_at: "2025-01-27T08:05:00Z",
    progress: {
      percentage: 20,
      phase: AnalysisPhase.Initializing,
      current_file: "/path/to/failed.mp4",
    },
    error_message: "Failed to load video file",
  }

  const defaultHookReturn = {
    tasks: [],
    isLoading: false,
    error: null,
    refreshTasks: vi.fn(),
    getTask: vi.fn(),
    cancelTask: vi.fn(),
    createTask: vi.fn(),
    clearHistory: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAnalysisTasks.mockReturnValue(defaultHookReturn)
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  describe("Rendering", () => {
    it("должен отрендерить триггер кнопку с иконкой Brain", () => {
      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      expect(trigger).toBeInTheDocument()
      // Brain иконка должна быть в кнопке
      expect(trigger.querySelector("svg")).toBeInTheDocument()
    })

    it("должен отображать badge с количеством активных задач", () => {
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      render(<AnalysisTasksDropdown />)

      expect(screen.getByText("1")).toBeInTheDocument()
    })

    it("не должен отображать badge когда нет активных задач", () => {
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockCompletedTask],
      })

      render(<AnalysisTasksDropdown />)

      expect(screen.queryByText("1")).not.toBeInTheDocument()
    })

    it("должен отображать анимацию pulse для задач в процессе", () => {
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const pulseIndicator = container.querySelector(".animate-pulse")
      expect(pulseIndicator).toBeInTheDocument()
    })

    it("не должен отображать анимацию pulse когда нет задач в процессе", () => {
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockCompletedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const pulseIndicator = container.querySelector(".animate-pulse")
      expect(pulseIndicator).not.toBeInTheDocument()
    })
  })

  describe("Dropdown Menu Content", () => {
    it("должен открывать dropdown при клике на триггер", async () => {
      const user = userEvent.setup()
      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("montagePlanner.analysisTasks")).toBeInTheDocument()
      })
    })

    it("должен отображать loader при загрузке", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const loader = screen.getByText("montagePlanner.analysisTasks").parentElement?.querySelector(".animate-spin")
        expect(loader).toBeInTheDocument()
      })
    })

    it("должен отображать ошибку при наличии error", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        error: "Failed to load tasks",
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("montagePlanner.errorLoadingTasks")).toBeInTheDocument()
        expect(screen.getByText("Failed to load tasks")).toBeInTheDocument()
      })
    })

    it("должен отображать пустое состояние когда нет задач", async () => {
      const user = userEvent.setup()
      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("montagePlanner.noActiveTasks")).toBeInTheDocument()
      })
    })
  })

  describe("Task Display", () => {
    it("должен отображать задачу с корректной информацией", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
        expect(screen.getByText("/path/to/video.mp4")).toBeInTheDocument()
        expect(screen.getByText("Status: analyzing_video")).toBeInTheDocument()
      })
    })

    it("должен отображать progress bar для задач в процессе", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("45%")).toBeInTheDocument()
        expect(screen.getByText("analyzing_video")).toBeInTheDocument()
      })
    })

    it("должен отображать сообщение прогресса", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Analyzing video content")).toBeInTheDocument()
      })
    })

    it("должен отображать ETA для задач в процессе", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const text = container.textContent || ""
        expect(text).toContain("montagePlanner.eta")
        expect(text).toContain("5") // 300 / 60 = 5
        expect(text).toContain("montagePlanner.minutes")
      })
    })

    it("должен отображать кнопку отмены для активных задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const cancelButtons = screen.getAllByRole("button").filter((btn) => {
          const svg = btn.querySelector("svg")
          return svg !== null && btn !== trigger
        })
        expect(cancelButtons.length).toBeGreaterThan(0)
      })
    })

    it("не должен отображать кнопку отмены для завершенных задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockCompletedTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const buttons = screen.getAllByRole("button")
        // Должна быть только trigger кнопка
        expect(buttons).toHaveLength(1)
      })
    })

    it("должен отображать сообщение об ошибке для failed задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockFailedTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("Failed to load video file")).toBeInTheDocument()
      })
    })

    it("должен отображать результаты для completed задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockCompletedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const text = container.textContent || ""
        expect(text).toContain("montagePlanner.momentsDetected")
        expect(text).toContain("1")
        expect(text).toContain("montagePlanner.planGenerated")
      })
    })
  })

  describe("Task Interaction", () => {
    it("должен вызывать cancelTask при клике на кнопку отмены", async () => {
      const user = userEvent.setup()
      const mockCancelTask = vi.fn().mockResolvedValue(true)
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
        cancelTask: mockCancelTask,
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole("button")
      const cancelButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg")
        return svg !== null && btn !== trigger
      })

      expect(cancelButton).toBeDefined()
      await user.click(cancelButton!)

      expect(window.confirm).toHaveBeenCalledWith("montagePlanner.cancelTask")
      expect(mockCancelTask).toHaveBeenCalledWith("task-1")
    })

    it("не должен вызывать cancelTask если пользователь отменил подтверждение", async () => {
      const user = userEvent.setup()
      const mockCancelTask = vi.fn().mockResolvedValue(true)
      vi.spyOn(window, "confirm").mockReturnValue(false)
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
        cancelTask: mockCancelTask,
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole("button")
      const cancelButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg")
        return svg !== null && btn !== trigger
      })

      await user.click(cancelButton!)

      expect(window.confirm).toHaveBeenCalledWith("montagePlanner.cancelTask")
      expect(mockCancelTask).not.toHaveBeenCalled()
    })
  })

  describe("Statistics", () => {
    it("должен отображать статистику когда есть задачи", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask, mockCompletedTask, mockFailedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const text = container.textContent || ""
        expect(text).toContain("montagePlanner.totalTasks")
        expect(text).toContain("montagePlanner.activeTasks")
        expect(text).toContain("montagePlanner.completedTasks")
      })
    })

    it("должен правильно подсчитывать общее количество задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask, mockCompletedTask, mockFailedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const text = container.textContent || ""
        expect(text).toContain("montagePlanner.totalTasks")
        expect(text).toContain("3")
      })
    })

    it("должен правильно подсчитывать активные задачи", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask, mockCompletedTask, mockFailedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const text = container.textContent || ""
        expect(text).toContain("montagePlanner.activeTasks")
        expect(text).toContain("1")
      })
    })

    it("должен правильно подсчитывать завершенные задачи", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask, mockCompletedTask, mockFailedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const text = container.textContent || ""
        expect(text).toContain("montagePlanner.completedTasks")
        expect(text).toContain("1")
      })
    })

    it("не должен отображать статистику когда нет задач", async () => {
      const user = userEvent.setup()
      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.queryByText("montagePlanner.totalTasks")).not.toBeInTheDocument()
      })
    })
  })

  describe("Multiple Tasks", () => {
    it("должен отображать несколько задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask, mockCompletedTask, mockFailedTask],
      })

      render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
        expect(screen.getByText("completed.mp4")).toBeInTheDocument()
        expect(screen.getByText("failed.mp4")).toBeInTheDocument()
      })
    })

    it("должен отображать badge с количеством всех активных задач", () => {
      const pendingTask: AnalysisTask = {
        ...mockTask,
        id: "task-4",
        status: AnalysisTaskStatus.Pending,
      }

      const initializingTask: AnalysisTask = {
        ...mockTask,
        id: "task-5",
        status: AnalysisTaskStatus.Initializing,
      }

      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask, pendingTask, initializingTask, mockCompletedTask],
      })

      render(<AnalysisTasksDropdown />)

      expect(screen.getByText("3")).toBeInTheDocument()
    })
  })

  describe("Status Icons", () => {
    it("должен отображать Clock иконку для pending задач", async () => {
      const user = userEvent.setup()
      const pendingTask: AnalysisTask = {
        ...mockTask,
        status: AnalysisTaskStatus.Pending,
      }

      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [pendingTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        // Clock иконка должна быть в dropdown content
        const taskCard = container.querySelector(".rounded-lg.border")
        expect(taskCard).toBeInTheDocument()
      })
    })

    it("должен отображать анимированную Loader иконку для задач в процессе", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const taskCard = container.querySelector(".rounded-lg.border")
        const spinningIcon = taskCard?.querySelector(".animate-spin")
        expect(spinningIcon).toBeInTheDocument()
      })
    })

    it("должен отображать CheckCircle иконку для completed задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockCompletedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const taskCard = container.querySelector(".rounded-lg.border")
        expect(taskCard).toBeInTheDocument()
      })
    })

    it("должен отображать XCircle иконку для failed задач", async () => {
      const user = userEvent.setup()
      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [mockFailedTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const taskCard = container.querySelector(".rounded-lg.border")
        expect(taskCard).toBeInTheDocument()
      })
    })

    it("должен отображать StopCircle иконку для cancelled задач", async () => {
      const user = userEvent.setup()
      const cancelledTask: AnalysisTask = {
        ...mockTask,
        status: AnalysisTaskStatus.Cancelled,
      }

      mockUseAnalysisTasks.mockReturnValue({
        ...defaultHookReturn,
        tasks: [cancelledTask],
      })

      const { container } = render(<AnalysisTasksDropdown />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        const taskCard = container.querySelector(".rounded-lg.border")
        expect(taskCard).toBeInTheDocument()
      })
    })
  })
})
