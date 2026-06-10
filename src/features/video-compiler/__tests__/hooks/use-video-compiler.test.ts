/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useVideoCompiler } from "../../hooks/use-video-compiler"
import type { RenderStatus } from "../../types/render"

// Мокаем notifications service
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()
const mockShowInfo = vi.fn()

vi.mock("@timeline-studio/core/hooks", () => ({
  useNotifications: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showInfo: mockShowInfo,
  }),
}))

// Мокаем video compiler service
vi.mock("@timeline-studio/core/services/video-compiler", () => ({
  renderProject: vi.fn(),
  trackRenderProgress: vi.fn(),
  videoCompilerRenderService: {
    cancelRender: vi.fn(),
    generatePreview: vi.fn(),
    getActiveJobs: vi.fn(),
  },
}))

// Мокаем i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("useVideoCompiler", () => {
  let mockRenderProject: any
  let mockTrackRenderProgress: any
  let mockCancelRender: any
  let mockGeneratePreview: any

  const mockProject: any = {
    version: "1.0.0",
    metadata: {
      name: "Test Project",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    },
    timeline: {
      duration: 60,
      fps: 30,
      resolution: [1920, 1080],
      sample_rate: 48000,
      aspect_ratio: "Ratio16x9",
    },
    tracks: [],
    effects: [],
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [],
    settings: {
      export: {
        format: "MP4",
        quality: 85,
        video_bitrate: 5000,
        audio_bitrate: 192,
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const compilerService = await import("@timeline-studio/core/services/video-compiler")
    mockRenderProject = vi.mocked(compilerService.renderProject)
    mockTrackRenderProgress = vi.mocked(compilerService.trackRenderProgress)
    mockCancelRender = vi.mocked(compilerService.videoCompilerRenderService.cancelRender)
    mockGeneratePreview = vi.mocked(compilerService.videoCompilerRenderService.generatePreview)
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useVideoCompiler())

    expect(result.current.isRendering).toBe(false)
    expect(result.current.renderProgress).toBeNull()
    expect(result.current.activeJobs).toEqual([])
  })

  it("should start render successfully", async () => {
    const mockJobId = "job-123"
    mockRenderProject.mockResolvedValueOnce(mockJobId)
    mockTrackRenderProgress.mockImplementation(
      (
        _jobId: any,
        callback: (arg0: {
          jobId: string
          status: RenderStatus
          percentage: number
          currentFrame: number
          totalFrames: number
          fps: number
          eta: number
        }) => void,
      ) => {
        // Simulate progress update
        setTimeout(() => {
          callback({
            jobId: mockJobId,
            status: "processing" as RenderStatus,
            percentage: 50,
            currentFrame: 900,
            totalFrames: 1800,
            fps: 30,
            eta: 30,
          })
        }, 100)
      },
    )

    const { result } = renderHook(() => useVideoCompiler())

    await act(async () => {
      await result.current.startRender(mockProject, "/output/video.mp4")
    })

    expect(mockRenderProject).toHaveBeenCalledWith(mockProject, "/output/video.mp4")
    expect(result.current.isRendering).toBe(true)

    await waitFor(() => {
      expect(result.current.renderProgress).toEqual({
        jobId: mockJobId,
        status: "processing",
        percentage: 50,
        currentFrame: 900,
        totalFrames: 1800,
        fps: 30,
        eta: 30,
      })
    })
  })

  it("should handle render error", async () => {
    const errorMessage = "Failed to start render"
    mockRenderProject.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useVideoCompiler())

    await expect(result.current.startRender(mockProject, "/output/video.mp4")).rejects.toThrow(errorMessage)

    expect(result.current.isRendering).toBe(false)
  })

  it("should cancel render", async () => {
    const mockJobId = "job-123"
    mockCancelRender.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useVideoCompiler())

    await act(async () => {
      await result.current.cancelRender(mockJobId)
    })

    expect(mockCancelRender).toHaveBeenCalledWith(mockJobId)
    expect(mockShowInfo).toHaveBeenCalled()
  })

  it("should generate preview", async () => {
    const mockPreviewData = [1, 2, 3, 4]
    mockGeneratePreview.mockResolvedValueOnce(mockPreviewData)

    const { result } = renderHook(() => useVideoCompiler())

    const preview = await result.current.generatePreview(mockProject, 10.5)

    expect(mockGeneratePreview).toHaveBeenCalledWith(mockProject, 10.5)

    expect(preview).toBeInstanceOf(Blob)
    expect(preview.type).toBe("image/jpeg")
  })

  it("should refresh active jobs without error", async () => {
    const { result } = renderHook(() => useVideoCompiler())

    // refreshActiveJobs currently just logs, doesn't fetch from backend
    await act(async () => {
      await result.current.refreshActiveJobs()
    })

    // Should complete without throwing
    expect(result.current.activeJobs).toEqual([])
  })
})
