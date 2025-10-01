import { invoke } from "@tauri-apps/api/core"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { vi } from "vitest"
import { RenderJob } from "@/domains/video-editing/types/video-compiler"
import { RenderJobsDropdown, RenderStatus } from "@/features/video-compiler"
import { setTranslations } from "@/test/mocks/libraries/i18n"

// Mock the Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockJobs: RenderJob[] = [
  {
    id: "job-1",
    project_name: "Test Video 1",
    output_path: "/output/test1.mp4",
    status: RenderStatus.Processing,
    created_at: new Date().toISOString(),
    progress: {
      job_id: "job-1",
      stage: "encoding",
      percentage: 50,
      current_frame: 500,
      total_frames: 1000,
      elapsed_time: 120000,
      status: RenderStatus.Processing,
      message: "Encoding video...",
    },
  },
  {
    id: "job-2",
    project_name: "Test Video 2",
    output_path: "/output/test2.mp4",
    status: RenderStatus.Completed,
    created_at: new Date(Date.now() - 300000).toISOString(),
    progress: {
      job_id: "job-2",
      stage: "completed",
      percentage: 100,
      current_frame: 500,
      total_frames: 500,
      elapsed_time: 300000,
      status: RenderStatus.Completed,
    },
  },
  {
    id: "job-3",
    project_name: "Test Video 3",
    output_path: "/output/test3.mp4",
    status: RenderStatus.Failed,
    created_at: new Date(Date.now() - 600000).toISOString(),
    error_message: "FFmpeg encoding error",
    progress: {
      job_id: "job-3",
      stage: "failed",
      percentage: 25,
      current_frame: 187,
      total_frames: 750,
      elapsed_time: 60000,
      status: RenderStatus.Failed,
      message: "FFmpeg encoding error",
    },
  },
]

describe("RenderJobsDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(invoke).mockResolvedValue(mockJobs)

    // Set up translations for our tests
    setTranslations({
      "videoCompiler.tasks": "Задачи",
      "videoCompiler.renderTasks": "Задачи рендеринга",
      "videoCompiler.noActiveTasks": "Нет активных задач",
      "videoCompiler.errorLoadingTasks": "Ошибка загрузки задач",
      "videoCompiler.cancelTask": "Отменить задачу рендеринга?",
      "videoCompiler.frames": "кадров",
      "videoCompiler.totalTasks": "Всего задач",
      "videoCompiler.activeTasks": "Активных",
      "videoCompiler.completedTasks": "Завершено",
      "videoCompiler.status.pending": "В очереди",
      "videoCompiler.status.processing": "Обработка",
      "videoCompiler.status.completed": "Завершено",
      "videoCompiler.status.failed": "Ошибка",
      "videoCompiler.status.cancelled": "Отменено",
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("should render the dropdown button with correct text", () => {
    render(<RenderJobsDropdown />)

    expect(screen.getByText("Задачи")).toBeInTheDocument()
  })

  it("should show active jobs count badge", async () => {
    render(<RenderJobsDropdown />)

    await waitFor(
      () => {
        expect(screen.getByText("1")).toBeInTheDocument() // 1 active job (Processing)
      },
      { timeout: 3000 },
    )
  })

  it("should open dropdown when clicked", async () => {
    render(<RenderJobsDropdown />)

    const button = screen.getByRole("button", { name: /задачи/i })

    // Wait for initial load
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_active_jobs")
    })

    await act(async () => {
      fireEvent.click(button)
    })

    // Check if dropdown content is rendered
    await waitFor(
      () => {
        const dropdownContent = screen.getByTestId("dropdown-menu-content")
        expect(dropdownContent).toBeInTheDocument()
        expect(within(dropdownContent).getByText("Задачи рендеринга")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it("should display all jobs in the dropdown", async () => {
    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /задачи/i })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    const dropdownContent = await screen.findByTestId("dropdown-menu-content")

    await waitFor(
      () => {
        expect(within(dropdownContent).getByText("Test Video 1")).toBeInTheDocument()
        expect(within(dropdownContent).getByText("Test Video 2")).toBeInTheDocument()
        expect(within(dropdownContent).getByText("Test Video 3")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it("should show progress for processing jobs", async () => {
    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /задачи/i })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    const dropdownContent = await screen.findByTestId("dropdown-menu-content")

    await waitFor(
      () => {
        expect(within(dropdownContent).getByText("Encoding video...")).toBeInTheDocument()
        expect(within(dropdownContent).getByText("500/1000 кадров")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it("should show error message for failed jobs", async () => {
    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /задачи/i })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    const dropdownContent = await screen.findByTestId("dropdown-menu-content")

    await waitFor(
      () => {
        expect(within(dropdownContent).getByText("FFmpeg encoding error")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it("should handle cancel job action", async () => {
    const mockConfirm = vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.mocked(invoke).mockImplementation((cmd) => {
      if (cmd === "cancel_render") return Promise.resolve(true)
      return Promise.resolve(mockJobs)
    })

    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /задачи/i })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      const cancelButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg"))
      expect(cancelButtons.length).toBeGreaterThan(1)
    })

    const cancelButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg"))
    const processingJobCancelButton = cancelButtons[cancelButtons.length - 1]

    await act(async () => {
      fireEvent.click(processingJobCancelButton)
    })

    expect(mockConfirm).toHaveBeenCalledWith("Отменить задачу рендеринга?")
    expect(invoke).toHaveBeenCalledWith("cancel_render", { jobId: "job-1" })

    mockConfirm.mockRestore()
  })

  it("should show empty state when no jobs", async () => {
    vi.mocked(invoke).mockResolvedValue([])

    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /задачи/i })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    const dropdownContent = await screen.findByTestId("dropdown-menu-content")

    await waitFor(
      () => {
        expect(within(dropdownContent).getByText("Нет активных задач")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it("should handle error state", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("Failed to fetch jobs"))

    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /задачи/i })).toBeInTheDocument()
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    const dropdownContent = await screen.findByTestId("dropdown-menu-content")

    await waitFor(
      () => {
        expect(within(dropdownContent).getByText("Ошибка загрузки задач")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it("should refresh jobs periodically", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_active_jobs")
    })

    const initialCallCount = vi.mocked(invoke).mock.calls.length

    // Fast-forward 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Give React time to process the timer
    await act(async () => {
      await Promise.resolve()
    })

    expect(vi.mocked(invoke).mock.calls.length).toBeGreaterThan(initialCallCount)

    vi.useRealTimers()
  })

  it("should display job statistics", async () => {
    render(<RenderJobsDropdown />)

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_active_jobs")
    })

    const button = screen.getByRole("button", { name: /задачи/i })
    await act(async () => {
      fireEvent.click(button)
    })

    const dropdownContent = await screen.findByTestId("dropdown-menu-content")

    // Check that statistics section exists
    const statsSection = within(dropdownContent).getByText("Всего задач:").closest("div")?.parentElement
    expect(statsSection).toBeInTheDocument()

    // Check statistics text content
    expect(within(dropdownContent).getByText("Всего задач:")).toBeInTheDocument()
    expect(within(dropdownContent).getByText("3")).toBeInTheDocument()
    expect(within(dropdownContent).getByText("Активных:")).toBeInTheDocument()
    expect(within(dropdownContent).getByText("Завершено:")).toBeInTheDocument()

    // Verify the statistics section contains the correct numbers
    const statsText = statsSection?.textContent || ""
    expect(statsText).toContain("Всего задач:3")
    expect(statsText).toContain("Активных:1")
    expect(statsText).toContain("Завершено:1")
  })
})
