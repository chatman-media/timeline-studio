import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RenderJob } from "@/domains/video-editing/types/video-compiler"
import { useRenderJobs } from "../../hooks/use-render-jobs"
import { RenderStatus } from "../../types/render"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

describe("useRenderJobs", () => {
  let mockInvoke: any

  const mockJobs: RenderJob[] = [
    {
      id: "job-1",
      project_name: "Project 1",
      output_path: "/output/video1.mp4",
      status: RenderStatus.Processing,
      created_at: new Date(Date.now() - 60000).toISOString(),
      progress: {
        job_id: "job-1",
        stage: "encoding",
        percentage: 45,
        current_frame: 810,
        total_frames: 1800,
        elapsed_time: 60000,
        estimated_remaining: 33000,
        status: RenderStatus.Processing,
      },
    },
    {
      id: "job-2",
      project_name: "Project 2",
      output_path: "/output/video2.mp4",
      status: RenderStatus.Completed,
      created_at: new Date(Date.now() - 180000).toISOString(),
      progress: {
        job_id: "job-2",
        stage: "completed",
        percentage: 100,
        current_frame: 3600,
        total_frames: 3600,
        elapsed_time: 120000,
        estimated_remaining: 0,
        status: RenderStatus.Completed,
      },
    },
    {
      id: "job-3",
      project_name: "Project 3",
      output_path: "/output/video3.mp4",
      status: RenderStatus.Failed,
      created_at: new Date(Date.now() - 90000).toISOString(),
      error_message: "Failed to encode frame",
      progress: {
        job_id: "job-3",
        stage: "encoding",
        percentage: 23,
        current_frame: 414,
        total_frames: 1800,
        elapsed_time: 60000,
        estimated_remaining: 0,
        status: RenderStatus.Failed,
        message: "Failed to encode frame",
      },
    },
    {
      id: "job-4",
      project_name: "Project 4",
      output_path: "/output/video4.mp4",
      status: RenderStatus.Pending,
      created_at: new Date().toISOString(),
      progress: {
        job_id: "job-4",
        stage: "pending",
        percentage: 0,
        current_frame: 0,
        total_frames: 2400,
        elapsed_time: 0,
        estimated_remaining: 0,
        status: RenderStatus.Pending,
      },
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    const { invoke } = await import("@tauri-apps/api/core")
    mockInvoke = vi.mocked(invoke)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should initialize with empty jobs", () => {
    // Use fake timers to prevent auto-refresh
    vi.useFakeTimers()
    const { result } = renderHook(() => useRenderJobs())

    expect(result.current.jobs).toEqual([])
    expect(result.current.isLoading).toBe(true) // Loading starts immediately
    expect(result.current.error).toBeNull()
  })

  it("should load jobs on mount", async () => {
    mockInvoke.mockResolvedValueOnce(mockJobs)

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("should refresh jobs", async () => {
    mockInvoke.mockResolvedValueOnce([]).mockResolvedValueOnce(mockJobs)

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual([])
    })

    await act(async () => {
      await result.current.refreshJobs()
    })

    expect(result.current.jobs).toEqual(mockJobs)
  })

  it("should handle error when loading jobs", async () => {
    const errorMessage = "Failed to get jobs"
    mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("should cancel a job", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockJobs) // Initial load
      .mockResolvedValueOnce(true) // Cancel success
      .mockResolvedValueOnce(mockJobs.filter((job) => job.id !== "job-1")) // Refresh after cancel

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
    })

    const success = await result.current.cancelJob("job-1")

    expect(success).toBe(true)
    expect(mockInvoke).toHaveBeenCalledWith("cancel_render", { jobId: "job-1" })

    // Wait for the refresh to complete
    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs.filter((job) => job.id !== "job-1"))
    })
  })

  it("should get job by id", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockJobs) // Initial load
      .mockResolvedValueOnce(mockJobs[0]) // Get specific job

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
    })

    const job = await result.current.getJob("job-1")

    expect(job).toEqual(mockJobs[0])
    expect(mockInvoke).toHaveBeenCalledWith("get_render_job", { jobId: "job-1" })
  })

  it("should return null for non-existent job", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockJobs) // Initial load
      .mockResolvedValueOnce(null) // Job not found

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
    })

    const job = await result.current.getJob("non-existent")

    expect(job).toBeNull()
  })

  it("should handle cancel job failure", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockJobs) // Initial load
      .mockRejectedValueOnce(new Error("Cancel failed")) // Cancel fails

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
    })

    const success = await result.current.cancelJob("job-1")

    expect(success).toBe(false)
  })

  it("should calculate total progress", async () => {
    mockInvoke.mockResolvedValueOnce(mockJobs)

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
    })

    const totalProgress = Math.round(
      result.current.jobs.reduce((sum, job) => Number(sum) + Number(job.progress.percentage), 0) /
        result.current.jobs.length,
    )

    expect(totalProgress).toBe(42) // (45 + 100 + 23 + 0) / 4 = 42
  })

  it("should update jobs automatically with interval", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    mockInvoke
      .mockResolvedValueOnce(mockJobs) // First call
      .mockResolvedValueOnce([...mockJobs, { ...mockJobs[0], id: "job-5" }]) // Second call after interval

    const { result, unmount } = renderHook(() => useRenderJobs())

    // Wait for initial load
    await vi.waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs)
    })

    expect(mockInvoke).toHaveBeenCalledTimes(1)

    // Advance timers by 2 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    // Wait for the update
    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })

    unmount()
  })

  it("should handle multiple jobs with same status", async () => {
    const jobsWithSameStatus: RenderJob[] = [
      ...mockJobs,
      {
        id: "job-5",
        project_name: "Project 5",
        output_path: "/output/video5.mp4",
        status: RenderStatus.Processing,
        created_at: new Date().toISOString(),
        progress: {
          job_id: "job-5",
          stage: "encoding",
          percentage: 60,
          current_frame: 1200,
          total_frames: 2000,
          elapsed_time: 40000,
          estimated_remaining: 30000,
          status: RenderStatus.Processing,
        },
      },
      {
        id: "job-6",
        project_name: "Project 6",
        output_path: "/output/video6.mp4",
        status: RenderStatus.Processing,
        created_at: new Date().toISOString(),
        progress: {
          job_id: "job-6",
          stage: "encoding",
          percentage: 80,
          current_frame: 1600,
          total_frames: 2000,
          elapsed_time: 50000,
          estimated_remaining: 10000,
          status: RenderStatus.Processing,
        },
      },
    ]

    mockInvoke.mockResolvedValueOnce(jobsWithSameStatus)

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(jobsWithSameStatus)
    })

    const processingCount = result.current.jobs.filter((job) => job.status === RenderStatus.Processing).length
    expect(processingCount).toBe(3) // job-1, job-5, job-6
  })

  it("should handle jobs sorted by creation time", async () => {
    const sortedJobs = [...mockJobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    mockInvoke.mockResolvedValueOnce(sortedJobs)

    const { result } = renderHook(() => useRenderJobs())

    await waitFor(() => {
      expect(result.current.jobs).toEqual(sortedJobs)
    })

    // Проверяем, что самая новая задача первая
    expect(result.current.jobs[0].id).toBe("job-4")
  })
})
