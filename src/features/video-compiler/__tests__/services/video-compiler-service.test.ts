import { beforeEach, describe, expect, it, vi } from "vitest"
import { RenderJob } from "@/domains/video-editing"
import * as videoCompilerService from "../../services/video-compiler-service"
import { type RenderProgress, RenderStatus } from "../../types/render"

// Типы для API ответов
interface ApiRenderJob {
  job_id: string
  project_name: string
  output_path: string
  status: string
  progress: number
  error: string | null
}

interface ApiPrerenderResult {
  file_path: string
  duration: number
  file_size: number
  render_time_ms: number
}

interface ApiCacheInfo {
  file_count: number
  total_size: number
  files: Array<{
    path: string
    size: number
    created: number
    start_time: number
    end_time: number
  }>
}

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем Tauri events
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
  emit: vi.fn(),
  TauriEvent: {
    WINDOW_CLOSE_REQUESTED: "tauri://close-requested",
  },
}))

describe("videoCompilerService", () => {
  let mockInvoke: any
  let mockListen: any

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

  const mockRenderJob: RenderJob = {
    id: "job-123",
    project_name: "Test Project",
    output_path: "/output/video.mp4",
    status: RenderStatus.Processing,
    created_at: new Date().toISOString(),
    progress: {
      job_id: "job-123",
      stage: "encoding",
      percentage: 0,
      current_frame: 0,
      total_frames: 1800,
      elapsed_time: 0,
      estimated_remaining: 60,
      status: RenderStatus.Processing,
    },
  }

  const mockRenderProgress: RenderProgress = {
    job_id: "job-123",
    stage: "encoding",
    percentage: 50,
    current_frame: 900,
    total_frames: 1800,
    elapsed_time: 30,
    estimated_remaining: 30,
    status: RenderStatus.Processing,
    message: "Encoding video...",
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    const { listen } = await import("@tauri-apps/api/event")
    mockInvoke = vi.mocked(invoke)
    mockListen = vi.mocked(listen)
  })

  describe("renderProject", () => {
    it("should start render successfully", async () => {
      mockInvoke.mockResolvedValueOnce("job-123")

      const result = await videoCompilerService.renderProject(mockProject, "/output/video.mp4")

      expect(result).toBe("job-123")
      expect(mockInvoke).toHaveBeenCalledWith("compile_video", {
        projectSchema: mockProject,
        outputPath: "/output/video.mp4",
      })
    })

    it("should handle render start error", async () => {
      const errorMessage = "Failed to start render"
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

      await expect(videoCompilerService.renderProject(mockProject, "/output/video.mp4")).rejects.toThrow(errorMessage)
    })
  })

  describe("cancelRender", () => {
    it("should cancel render successfully", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await videoCompilerService.cancelRender("job-123")

      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith("cancel_render", { jobId: "job-123" })
    })

    it("should handle cancel error", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Failed to cancel"))

      const result = await videoCompilerService.cancelRender("job-123")

      expect(result).toBe(false)
    })
  })

  describe("trackRenderProgress", () => {
    it("should track render progress", async () => {
      const onProgress = vi.fn()
      mockInvoke.mockResolvedValueOnce(mockRenderProgress)
      mockInvoke.mockResolvedValueOnce(null) // Stop tracking

      await videoCompilerService.trackRenderProgress("job-123", onProgress)

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(onProgress).toHaveBeenCalledWith(mockRenderProgress)
      expect(mockInvoke).toHaveBeenCalledWith("get_render_progress", { jobId: "job-123" })
    })
  })

  describe("getActiveJobs", () => {
    it("should get active jobs", async () => {
      const mockApiJobs: ApiRenderJob[] = [
        {
          job_id: "job-123",
          project_name: "Test Project",
          output_path: "/output/video.mp4",
          status: "processing",
          progress: 45,
          error: null,
        },
      ]
      mockInvoke.mockResolvedValueOnce(mockApiJobs)

      const result = await videoCompilerService.getActiveJobs()

      expect(result).toEqual(mockApiJobs)
      expect(mockInvoke).toHaveBeenCalledWith("get_active_jobs")
    })

    it("should return empty array when no active jobs", async () => {
      mockInvoke.mockResolvedValueOnce([])

      const result = await videoCompilerService.getActiveJobs()

      expect(result).toEqual([])
    })
  })

  describe("getRenderJob", () => {
    it("should get render job by ID", async () => {
      const mockApiJob: ApiRenderJob = {
        job_id: "job-123",
        project_name: "Test Project",
        output_path: "/output/video.mp4",
        status: "processing",
        progress: 45,
        error: null,
      }
      mockInvoke.mockResolvedValueOnce(mockApiJob)

      const result = await videoCompilerService.getRenderJob("job-123")

      expect(result).toEqual(mockApiJob)
      expect(mockInvoke).toHaveBeenCalledWith("get_render_job", { jobId: "job-123" })
    })

    it("should return null for non-existent job", async () => {
      mockInvoke.mockResolvedValueOnce(null)

      const result = await videoCompilerService.getRenderJob("non-existent")

      expect(result).toBeNull()
    })
  })

  describe("generatePreview", () => {
    it("should generate preview successfully", async () => {
      const mockPreviewData = [1, 2, 3, 4, 5]
      mockInvoke.mockResolvedValueOnce(mockPreviewData)

      const result = await videoCompilerService.generatePreview(mockProject, 10.5, 85)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(new Uint8Array(mockPreviewData))
      expect(mockInvoke).toHaveBeenCalledWith("generate_preview", {
        projectSchema: mockProject,
        timestamp: 10.5,
        quality: 85,
      })
    })

    it("should use default quality", async () => {
      const mockPreviewData = [1, 2, 3, 4, 5]
      mockInvoke.mockResolvedValueOnce(mockPreviewData)

      await videoCompilerService.generatePreview(mockProject, 10.5)

      expect(mockInvoke).toHaveBeenCalledWith("generate_preview", {
        projectSchema: mockProject,
        timestamp: 10.5,
        quality: 75,
      })
    })
  })

  describe("prerenderSegment", () => {
    it("should prerender segment successfully", async () => {
      // invoke ожидает PrerenderResult, а не ApiPrerenderResult
      const mockResult = {
        filePath: "/tmp/prerender/segment_001.mp4",
        duration: 10,
        fileSize: 5242880,
        renderTimeMs: 2500,
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await videoCompilerService.prerenderSegment({
        projectSchema: mockProject,
        startTime: 0,
        endTime: 10,
        applyEffects: true,
        quality: 90,
      })

      expect(result).toEqual({
        filePath: "/tmp/prerender/segment_001.mp4",
        duration: 10,
        fileSize: 5242880,
        renderTimeMs: 2500,
      })
      expect(mockInvoke).toHaveBeenCalledWith("prerender_segment", {
        request: {
          project_schema: mockProject,
          start_time: 0,
          end_time: 10,
          apply_effects: true,
          quality: 90,
        },
      })
    })
  })

  describe("getPrerenderCacheInfo", () => {
    it("should get prerender cache info", async () => {
      const mockApiCacheInfo: ApiCacheInfo = {
        file_count: 10,
        total_size: 1024 * 1024 * 100,
        files: [
          {
            path: "/cache/prerender1.mp4",
            size: 5242880,
            created: Date.now(),
            start_time: 0,
            end_time: 5,
          },
        ],
      }

      mockInvoke.mockResolvedValueOnce(mockApiCacheInfo)

      const result = await videoCompilerService.getPrerenderCacheInfo()

      expect(result).toEqual({
        fileCount: 10,
        totalSize: 1024 * 1024 * 100,
        files: [
          {
            path: "/cache/prerender1.mp4",
            startTime: 0,
            endTime: 5,
            size: 5242880,
            created: mockApiCacheInfo.files[0].created,
          },
        ],
      })
      expect(mockInvoke).toHaveBeenCalledWith("get_prerender_cache_info")
    })
  })

  describe("clearPrerenderCache", () => {
    it("should clear prerender cache", async () => {
      const clearedSize = 1024 * 1024 * 50 // 50MB
      mockInvoke.mockResolvedValueOnce(clearedSize)

      const result = await videoCompilerService.clearPrerenderCache()

      expect(result).toBe(clearedSize)
      expect(mockInvoke).toHaveBeenCalledWith("clear_prerender_cache")
    })
  })
})
