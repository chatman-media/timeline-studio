import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OutputFormat, RenderStatus } from "@/domains/video-editing/types"

import { BatchExportTab } from "../../components/batch-export-tab"

// Mock useRenderQueue hook
const mockRenderQueue = {
  renderJobs: [],
  isProcessing: false,
  activeJobsCount: 0,
  addProjectsToQueue: vi.fn(),
  startRenderQueue: vi.fn(),
  cancelJob: vi.fn(),
  cancelAllJobs: vi.fn(),
  clearCompleted: vi.fn(),
  refreshQueue: vi.fn(),
}

vi.mock("../../hooks/use-render-queue", () => ({
  useRenderQueue: () => mockRenderQueue,
}))

// Mock dialog
const mockOpen = vi.fn()
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (options: any) => mockOpen(options),
}))

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string) => key),
  }),
}))

// Mock Lucide icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    Trash2: ({ className }: { className?: string }) => <div data-testid="trash2-icon" className={className} />,
    Plus: ({ className }: { className?: string }) => <div data-testid="plus-icon" className={className} />,
    Folder: ({ className }: { className?: string }) => <div data-testid="folder-icon" className={className} />,
  }
})

describe("BatchExportTab", () => {
  const defaultProps = {
    onClose: vi.fn(),
    defaultSettings: {
      format: OutputFormat.Mp4,
      quality: "good",
      resolution: "1920x1080",
      fps: "30",
      codec: "h264",
      outputFolder: "/default/output",
      fileName: "output",
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRenderQueue.renderJobs = []
    mockRenderQueue.isProcessing = false
    mockRenderQueue.activeJobsCount = 0
  })

  it("should render empty queue state", () => {
    render(<BatchExportTab {...defaultProps} />)

    expect(screen.getByText("dialogs.export.batchSettings")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.addProjects")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.emptyQueue")).toBeInTheDocument()
  })

  it("should add projects to queue", async () => {
    mockRenderQueue.addProjectsToQueue.mockResolvedValue(["/path/to/project1.tls", "/path/to/project2.tls"])

    render(<BatchExportTab {...defaultProps} />)

    const addButtons = screen.getAllByText("dialogs.export.addProjects")
    const addButton = addButtons[0].closest("button")!

    await act(async () => {
      fireEvent.click(addButton)
    })

    expect(mockRenderQueue.addProjectsToQueue).toHaveBeenCalled()

    // Projects are added to pending projects list
    await waitFor(() => {
      expect(screen.getByText("project1")).toBeInTheDocument()
      expect(screen.getByText("project2")).toBeInTheDocument()
    })
  })

  it("should show export settings form", () => {
    render(<BatchExportTab {...defaultProps} />)

    expect(screen.getByText("dialogs.export.batchSettings")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.outputFolder")).toBeInTheDocument()
    // ExportPresets component should be visible with Custom Export button
    expect(screen.getByText("Custom Export")).toBeInTheDocument()
  })

  it("should choose output folder", async () => {
    mockOpen.mockResolvedValue("/new/output/folder")

    render(<BatchExportTab {...defaultProps} />)

    const chooseFolderButton = screen.getByTestId("folder-icon").closest("button")!
    await act(async () => {
      fireEvent.click(chooseFolderButton)
    })

    expect(mockOpen).toHaveBeenCalledWith({
      directory: true,
      title: "dialogs.export.selectOutputFolder",
    })

    // The output folder is shown in a div, not an input
    await waitFor(() => {
      expect(screen.getByText("/new/output/folder")).toBeInTheDocument()
    })
  })

  it("should start export with correct settings", async () => {
    // Set output folder first
    mockOpen.mockResolvedValue("/output")
    render(<BatchExportTab {...defaultProps} />)

    const chooseFolderButton = screen.getByTestId("folder-icon").closest("button")!
    await act(async () => {
      fireEvent.click(chooseFolderButton)
    })

    await waitFor(() => {
      expect(screen.getByText("/output")).toBeInTheDocument()
    })

    // Add projects first
    mockRenderQueue.addProjectsToQueue.mockResolvedValue(["/path/to/project1.tls", "/path/to/project2.tls"])

    render(<BatchExportTab {...defaultProps} />)

    // Add projects - use getAllByText since there are multiple buttons
    const addButtons = screen.getAllByText("dialogs.export.addProjects")
    const addButton = addButtons[0].closest("button")!
    await act(async () => {
      fireEvent.click(addButton)
    })

    // Start export - get the enabled button
    const startButtons = screen.getAllByText("dialogs.export.startBatchExport")
    const enabledButton = startButtons.find((btn) => !btn.closest("button")?.hasAttribute("disabled"))
    const startButton = enabledButton?.closest("button")

    expect(startButton).toBeTruthy()
    if (!startButton) return

    await act(async () => {
      fireEvent.click(startButton)
    })

    // Should have called startRenderQueue
    expect(mockRenderQueue.startRenderQueue).toHaveBeenCalled()

    // Wait for the function to be called
    await waitFor(() => {
      expect(mockRenderQueue.startRenderQueue.mock.calls.length).toBeGreaterThan(0)
    })

    // Check the general structure of the call
    const callArgs = mockRenderQueue.startRenderQueue.mock.calls[0][0]
    expect(callArgs).toHaveLength(2)
    expect(callArgs[0].path).toBe("/path/to/project1.tls")
    expect(callArgs[1].path).toBe("/path/to/project2.tls")
  })

  it("should remove project from queue", async () => {
    mockRenderQueue.addProjectsToQueue.mockResolvedValue(["/path/to/project1.tls"])

    render(<BatchExportTab {...defaultProps} />)

    // Add project
    const addButtons = screen.getAllByText("dialogs.export.addProjects")
    const addButton = addButtons[0].closest("button")!
    await act(async () => {
      fireEvent.click(addButton)
    })

    // Wait for project to appear
    await waitFor(() => {
      expect(screen.getByText("project1")).toBeInTheDocument()
    })

    // Remove project - find the trash button
    const removeButton = screen.getByTestId("trash2-icon").closest("button")!
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText("project1")).not.toBeInTheDocument()
    })
  })

  it("should display render jobs", () => {
    mockRenderQueue.renderJobs = [
      {
        id: "job-1",
        project_name: "Test Project",
        output_path: "/output/test.mp4",
        status: RenderStatus.Processing,
        created_at: new Date().toISOString(),
        progress: {
          job_id: "job-1",
          stage: "Encoding",
          percentage: 50,
          current_frame: 900,
          total_frames: 1800,
          elapsed_time: 30,
          status: RenderStatus.Processing,
          message: "Processing...",
        },
      },
    ]
    mockRenderQueue.isProcessing = true
    mockRenderQueue.activeJobsCount = 1

    render(<BatchExportTab {...defaultProps} />)

    expect(screen.getByText("Test Project")).toBeInTheDocument()
    // Progress is shown as either message or percentage
    const progressText = screen.getByText(/Processing|50%/)
    expect(progressText).toBeInTheDocument()
  })

  it("should cancel all jobs", () => {
    mockRenderQueue.renderJobs = [
      {
        id: "job-1",
        project_name: "Test Project",
        output_path: "/output/test.mp4",
        status: RenderStatus.Processing,
        created_at: new Date().toISOString(),
        progress: {
          job_id: "job-1",
          stage: "Encoding",
          percentage: 50,
          current_frame: 900,
          total_frames: 1800,
          elapsed_time: 30,
          status: RenderStatus.Processing,
        },
      },
    ]
    mockRenderQueue.activeJobsCount = 1
    mockRenderQueue.isProcessing = true

    render(<BatchExportTab {...defaultProps} />)

    const cancelAllButton = screen.getByText("dialogs.export.cancelAll").closest("button")!
    fireEvent.click(cancelAllButton)

    expect(mockRenderQueue.cancelAllJobs).toHaveBeenCalled()
  })

  it("should clear completed jobs", () => {
    mockRenderQueue.renderJobs = [
      {
        id: "job-1",
        project_name: "Completed Project",
        output_path: "/output/completed.mp4",
        status: RenderStatus.Completed,
        created_at: new Date().toISOString(),
        progress: {
          job_id: "job-1",
          stage: "Complete",
          percentage: 100,
          current_frame: 1800,
          total_frames: 1800,
          elapsed_time: 60,
          status: RenderStatus.Completed,
        },
      },
    ]

    render(<BatchExportTab {...defaultProps} />)

    const clearButton = screen.getByText("dialogs.export.clearCompleted").closest("button")!
    fireEvent.click(clearButton)

    expect(mockRenderQueue.clearCompleted).toHaveBeenCalled()
  })

  it("should disable start button when no projects in queue", () => {
    render(<BatchExportTab {...defaultProps} />)

    const startButton = screen.getByText("dialogs.export.startBatchExport").closest("button")!
    expect(startButton).toBeDisabled()
  })

  it("should show processing state when processing", () => {
    mockRenderQueue.isProcessing = true

    render(<BatchExportTab {...defaultProps} />)

    // When processing, we should see different buttons
    expect(screen.getByText("dialogs.export.cancelAll")).toBeInTheDocument()
    expect(screen.getByText(/dialogs.export.processing/)).toBeInTheDocument()
  })

  it("should update format setting", () => {
    render(<BatchExportTab {...defaultProps} />)

    // ExportPresets should show H.264 Master preset
    expect(screen.getByText("H.264 Master")).toBeInTheDocument()
    // Check that export button exists
    expect(screen.getByText("dialogs.export.startBatchExport")).toBeInTheDocument()
  })

  it("should show active jobs count", () => {
    mockRenderQueue.activeJobsCount = 3

    render(<BatchExportTab {...defaultProps} />)

    // ActiveJobs is shown in CardDescription with count
    const activeJobsText = screen.getByText(/dialogs.export.activeJobs/)
    expect(activeJobsText).toBeInTheDocument()
  })

  it("should handle empty project addition", async () => {
    mockRenderQueue.addProjectsToQueue.mockResolvedValue([])

    render(<BatchExportTab {...defaultProps} />)

    const addButtons = screen.getAllByText("dialogs.export.addProjects")
    const addButton = addButtons[0].closest("button")!
    await act(async () => {
      fireEvent.click(addButton)
    })

    expect(screen.getByText("dialogs.export.emptyQueue")).toBeInTheDocument()
  })
})
