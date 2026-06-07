/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { type RenderJob, RenderStatus } from "@/domains/video-editing/types"
import { logError } from "@/lib/tauri-logger"

import { useRenderQueue } from "../../hooks/use-render-queue"

// Mock functions
const mockGetActiveJobs = vi.fn()
const mockCancelRender = vi.fn()
const mockRenderProject = vi.fn()
const mockShowOpenDialog = vi.fn()

// Mock @/core container
vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      showOpenDialog: mockShowOpenDialog,
    })),
  },
}))

// Mock core hook bridge used by the export feature.
vi.mock("@/core/hooks", () => ({
  useProjectLoader: () => ({
    loadProject: vi.fn().mockResolvedValue({
      id: "test-project",
      settings: {
        aspectRatio: { width: 1920, height: 1080 },
        resolution: "1920x1080",
        frameRate: "30",
        colorSpace: "sdr",
      },
    }),
  }),
  useRenderQueue: () => ({
    getActiveJobs: () => mockGetActiveJobs(),
    cancelRender: (jobId: string) => mockCancelRender(jobId),
    renderProject: (schema: any, path: string) => mockRenderProject(schema, path),
  }),
}))

// Get mocked logError
const mockLogError = vi.mocked(logError)

// Mock timeline utils
vi.mock("@/features/timeline/utils/timeline-to-project", () => ({
  timelineToProjectSchema: vi.fn((_timeline) => ({
    version: "1.0.0",
    metadata: { name: "Test Project" },
    timeline: { duration: 60, fps: 30, resolution: [1920, 1080] },
    tracks: [],
    effects: [],
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [],
    settings: {},
  })),
}))

describe("useRenderQueue", () => {
  const mockJobs: RenderJob[] = [
    {
      id: "job-1",
      project_name: "Project 1",
      output_path: "/path/to/output1.mp4",
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
    {
      id: "job-2",
      project_name: "Project 2",
      output_path: "/path/to/output2.mp4",
      status: RenderStatus.Pending,
      created_at: new Date().toISOString(),
      progress: {
        job_id: "job-2",
        stage: "Waiting",
        percentage: 0,
        current_frame: 0,
        total_frames: 1200,
        elapsed_time: 0,
        status: RenderStatus.Pending,
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetActiveJobs.mockResolvedValue(mockJobs)
    mockCancelRender.mockResolvedValue(true)
    mockRenderProject.mockResolvedValue("job-3")
    mockShowOpenDialog.mockResolvedValue(null)
  })

  it("should load active jobs on mount", async () => {
    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(2)
      expect(result.current.isProcessing).toBe(true)
      expect(result.current.activeJobsCount).toBe(2)
    })

    expect(mockGetActiveJobs).toHaveBeenCalled()
  })

  it("should refresh queue periodically when processing", async () => {
    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(2)
    })

    // Clear the call count after initial load
    mockGetActiveJobs.mockClear()

    // Wait for interval to trigger
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
    })

    // Should have been called at least once by the interval
    expect(mockGetActiveJobs).toHaveBeenCalled()
    expect(mockGetActiveJobs.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it("should add projects to queue", async () => {
    const mockFiles = ["/path/to/project1.tls", "/path/to/project2.tls"]
    mockShowOpenDialog.mockResolvedValue(mockFiles)

    const { result } = renderHook(() => useRenderQueue())

    const selectedPaths = await result.current.addProjectsToQueue()

    expect(mockShowOpenDialog).toHaveBeenCalledWith({
      multiple: true,
      filters: [
        {
          name: "Timeline Studio Projects",
          extensions: ["tls", "json"],
        },
      ],
      title: "Select Projects to Export",
    })

    expect(selectedPaths).toEqual(["/path/to/project1.tls", "/path/to/project2.tls"])
  })

  it("should handle single file selection", async () => {
    mockShowOpenDialog.mockResolvedValue(["/path/to/single.tls"])

    const { result } = renderHook(() => useRenderQueue())

    const selectedPaths = await result.current.addProjectsToQueue()

    expect(selectedPaths).toEqual(["/path/to/single.tls"])
  })

  it("should return empty array when no files selected", async () => {
    mockShowOpenDialog.mockResolvedValue(null)

    const { result } = renderHook(() => useRenderQueue())

    const selectedPaths = await result.current.addProjectsToQueue()

    expect(selectedPaths).toEqual([])
  })

  it("should start render queue for multiple projects", async () => {
    const { result } = renderHook(() => useRenderQueue())

    // Ждём пока хук выполнит начальную загрузку
    await waitFor(() => {
      expect(mockGetActiveJobs).toHaveBeenCalled()
    })

    // Сбрасываем счётчик вызовов после начальной загрузки
    mockGetActiveJobs.mockClear()

    const projects = [
      { path: "/path/to/project1.tls", outputPath: "/output/video1.mp4" },
      { path: "/path/to/project2.tls", outputPath: "/output/video2.mp4" },
    ]

    await act(async () => {
      await result.current.startRenderQueue(projects)
    })

    expect(mockRenderProject).toHaveBeenCalledWith(expect.any(Object), "/output/video1.mp4")

    expect(mockRenderProject).toHaveBeenCalledWith(expect.any(Object), "/output/video2.mp4")

    // Should refresh queue after starting renders
    expect(mockGetActiveJobs).toHaveBeenCalled()
  })

  it("should cancel a specific job", async () => {
    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(2)
    })

    await act(async () => {
      await result.current.cancelJob("job-1")
    })

    expect(mockCancelRender).toHaveBeenCalledWith("job-1")
    // Should refresh queue after canceling
    expect(mockGetActiveJobs).toHaveBeenCalled()
  })

  it("should cancel all active jobs", async () => {
    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(2)
    })

    await act(async () => {
      await result.current.cancelAllJobs()
    })

    expect(mockCancelRender).toHaveBeenCalledWith("job-1")
    expect(mockCancelRender).toHaveBeenCalledWith("job-2")
  })

  it("should clear completed jobs", async () => {
    const jobsWithCompleted = [
      ...mockJobs,
      {
        id: "job-3",
        project_name: "Completed Project",
        output_path: "/output/completed.mp4",
        status: RenderStatus.Completed,
        created_at: new Date().toISOString(),
        progress: {
          job_id: "job-3",
          stage: "Complete",
          percentage: 100,
          current_frame: 1800,
          total_frames: 1800,
          elapsed_time: 120,
          status: RenderStatus.Completed,
        },
      },
    ]

    mockGetActiveJobs.mockResolvedValue(jobsWithCompleted)

    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(3)
    })

    act(() => {
      result.current.clearCompleted()
    })

    expect(result.current.renderJobs).toHaveLength(2)
    expect(result.current.renderJobs.every((job) => job.status !== RenderStatus.Completed)).toBe(true)
  })

  it("should handle errors when refreshing queue", async () => {
    mockGetActiveJobs.mockRejectedValueOnce(new Error("Failed to get jobs"))

    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(0)
      expect(result.current.isProcessing).toBe(false)
    })

    expect(mockLogError).toHaveBeenCalledWith(
      "[useRenderQueue] Ошибка получения задач рендеринга: Error: Failed to get jobs",
    )
  })

  it("should update isProcessing based on job statuses", async () => {
    const completedJobs = mockJobs.map((job) => ({
      ...job,
      status: RenderStatus.Completed,
      progress: { ...job.progress, status: RenderStatus.Completed },
    }))

    mockGetActiveJobs.mockResolvedValue(completedJobs)

    const { result } = renderHook(() => useRenderQueue())

    await waitFor(() => {
      expect(result.current.renderJobs).toHaveLength(2)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.activeJobsCount).toBe(0)
    })
  })
})
