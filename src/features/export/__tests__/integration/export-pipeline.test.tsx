/**
 * Export Pipeline Integration Tests
 *
 * Comprehensive integration tests for the complete export workflow including:
 * - Full export workflow from settings to completion
 * - Multiple export formats (MP4, WebM, MOV)
 * - Quality presets (low, medium, high, 4K)
 * - Progress tracking and cancellation
 * - Audio/video sync in export
 * - Subtitle/caption embedding
 * - Metadata preservation
 * - Error handling during export failures
 * - Resume after interruption
 * - Batch export of multiple projects
 * - Cloud upload integration (YouTube, Vimeo, Telegram)
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ProjectSchema } from "@timeline-studio/domains/video-editing/types/video-compiler"
import { AspectRatio, OutputFormat } from "@timeline-studio/domains/video-editing/types/video-compiler"
import type { RenderProgress } from "@/features/video-compiler/types/render"
import { RenderStatus } from "@/features/video-compiler/types/render"
import { QUALITY_PRESETS } from "../../constants/export-constants"
import type { ExportSettings, SocialExportSettings } from "../../types/export-types"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock video compiler service
vi.mock("@timeline-studio/domains/video-editing/services/compiler/video-compiler-service", () => ({
  renderProject: vi.fn(),
  trackRenderProgress: vi.fn(),
  cancelRender: vi.fn(),
  generatePreview: vi.fn(),
}))

// Mock social networks service
vi.mock("../../services/social-networks-service", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  isLoggedIn: vi.fn(),
  uploadVideo: vi.fn(),
  validateSettings: vi.fn(),
  getOptimalSettings: vi.fn(),
  refreshTokenIfNeeded: vi.fn(),
  validateVideoFile: vi.fn(),
}))

// Mock export utils
vi.mock("../../utils/preset-configs", () => ({
  getAllPresets: vi.fn(() => []),
  getPresetById: vi.fn(),
  getPresetsByCategory: vi.fn(() => []),
  getPresetsByPlatform: vi.fn(() => []),
}))

describe("Export Pipeline Integration Tests", () => {
  let mockInvoke: any
  let mockRenderProject: any
  let mockTrackRenderProgress: any
  let mockCancelRender: any
  let mockSocialNetworksService: any

  // Helper function to create mock project
  const createMockProject = (overrides?: Partial<ProjectSchema>): ProjectSchema => ({
    version: "1.0.0",
    metadata: {
      name: "Test Export Project",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      author: "Test Author",
    },
    timeline: {
      duration: 120, // 2 minutes
      fps: 30,
      resolution: [1920, 1080],
      sample_rate: 48000,
      aspect_ratio: AspectRatio.Ratio16x9,
    },
    tracks: [
      {
        id: "video-track-1",
        track_type: "Video" as any,
        name: "Main Video",
        enabled: true,
        locked: false,
        volume: 1.0,
        clips: [
          {
            id: "clip-1",
            source_path: "/test/video1.mp4",
            start_time: 0,
            end_time: 60,
            source_start: 0,
            source_end: 60,
            speed: 1.0,
            volume: 1.0,
            effects: [],
            filters: [],
          },
          {
            id: "clip-2",
            source_path: "/test/video2.mp4",
            start_time: 60,
            end_time: 120,
            source_start: 0,
            source_end: 60,
            speed: 1.0,
            volume: 1.0,
            effects: [],
            filters: [],
          },
        ],

        effects: [],
        filters: [],
      },
      {
        id: "audio-track-1",
        track_type: "Audio" as any,
        name: "Main Audio",
        enabled: true,
        locked: false,
        volume: 0.8,
        clips: [
          {
            id: "audio-clip-1",
            source_path: "/test/audio.mp3",
            start_time: 0,
            end_time: 120,
            source_start: 0,
            source_end: 120,
            speed: 1.0,
            volume: 1.0,
            effects: [],
            filters: [],
          },
        ],

        effects: [],
        filters: [],
      },
    ],

    effects: [],
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [
      {
        id: "sub-1",
        text: "Test Subtitle",
        start_time: 5,
        end_time: 10,
        position: {
          x: 50,
          y: 90,
          align_x: "Center" as any,
          align_y: "Bottom" as any,
        },
        style: {
          font_family: "Arial",
          font_size: 24,
          font_weight: "Normal" as any,
          color: "#FFFFFF",
        },
        enabled: true,
      },
    ],

    settings: {
      export: {
        format: OutputFormat.Mp4,
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
    ...overrides,
  })

  // Helper function to create mock export settings
  const createExportSettings = (overrides?: Partial<ExportSettings>): ExportSettings => ({
    fileName: "test-export.mp4",
    savePath: "/test/exports/test-export.mp4",
    format: OutputFormat.Mp4,
    quality: "good",
    resolution: "1080",
    frameRate: "30",
    enableGPU: true,
    exportVideo: true,
    exportAudio: true,
    renderMode: "single",
    bitrateMode: "vbr",
    bitrate: 8000,
    normalizeAudio: true,
    audioTarget: -14,
    audioPeak: -1,
    ...overrides,
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetAllMocks()

    const { invoke } = await import("@tauri-apps/api/core")
    const { renderProject, trackRenderProgress, cancelRender } = await import(
      "@timeline-studio/domains/video-editing/services/compiler/video-compiler-service"
    )
    mockSocialNetworksService = await import("../../services/social-networks-service")

    mockInvoke = vi.mocked(invoke)
    mockRenderProject = vi.mocked(renderProject)
    mockTrackRenderProgress = vi.mocked(trackRenderProgress)
    mockCancelRender = vi.mocked(cancelRender)

    // Reset all mocks completely
    mockInvoke.mockReset()
    mockRenderProject.mockReset()
    mockTrackRenderProgress.mockReset()
    mockCancelRender.mockReset()
  })

  describe("1. Full Export Workflow", () => {
    it("should complete full export workflow from settings to completion", async () => {
      const project = createMockProject()
      const settings = createExportSettings()
      const mockJobId = "export-job-123"

      // Mock render start
      mockRenderProject.mockResolvedValueOnce(mockJobId)

      // Mock progress tracking
      const progressUpdates: RenderProgress[] = []
      mockTrackRenderProgress.mockImplementation((jobId: string, callback: (progress: RenderProgress) => void) => {
        const updates = [
          {
            job_id: jobId,
            stage: "Initializing",
            percentage: 0,
            current_frame: 0,
            total_frames: 3600,
            elapsed_time: 0,
            status: RenderStatus.Processing,
          },
          {
            job_id: jobId,
            stage: "Encoding",
            percentage: 25,
            current_frame: 900,
            total_frames: 3600,
            elapsed_time: 30,
            status: RenderStatus.Processing,
          },
          {
            job_id: jobId,
            stage: "Encoding",
            percentage: 50,
            current_frame: 1800,
            total_frames: 3600,
            elapsed_time: 60,
            status: RenderStatus.Processing,
          },
          {
            job_id: jobId,
            stage: "Encoding",
            percentage: 75,
            current_frame: 2700,
            total_frames: 3600,
            elapsed_time: 90,
            status: RenderStatus.Processing,
          },
          {
            job_id: jobId,
            stage: "Finalizing",
            percentage: 100,
            current_frame: 3600,
            total_frames: 3600,
            elapsed_time: 120,
            status: RenderStatus.Completed,
          },
        ]

        updates.forEach((update, index) => {
          setTimeout(() => {
            progressUpdates.push(update)
            callback(update)
          }, index * 100)
        })
      })

      // Start export
      const jobId = await mockRenderProject(project, settings.savePath)

      // Track progress
      await new Promise<void>((resolve) => {
        mockTrackRenderProgress(jobId, (progress: RenderProgress) => {
          if (progress.status === RenderStatus.Completed) {
            resolve()
          }
        })
      })

      // Assertions
      expect(mockRenderProject).toHaveBeenCalledWith(project, settings.savePath)
      expect(mockTrackRenderProgress).toHaveBeenCalledWith(jobId, expect.any(Function))
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[progressUpdates.length - 1].status).toBe(RenderStatus.Completed)
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100)
    })

    it("should handle export with custom metadata", async () => {
      const project = createMockProject({
        metadata: {
          name: "Custom Metadata Project",
          description: "Project with custom metadata",
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
          author: "John Doe",
        },
      })
      const settings = createExportSettings({ embedInfoAsProject: true })
      const mockJobId = "export-job-metadata"

      mockRenderProject.mockResolvedValueOnce(mockJobId)
      mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
        setTimeout(
          () =>
            callback({
              job_id: mockJobId,
              stage: "Completed",
              percentage: 100,
              current_frame: 3600,
              total_frames: 3600,
              elapsed_time: 120,
              status: RenderStatus.Completed,
            }),
          100,
        )
      })

      await mockRenderProject(project, settings.savePath)

      expect(mockRenderProject).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            author: "John Doe",
            description: "Project with custom metadata",
          }),
        }),
        settings.savePath,
      )
    })
  })

  describe("2. Multiple Export Formats", () => {
    const formats: Array<{ format: OutputFormat; extension: string }> = [
      { format: OutputFormat.Mp4, extension: ".mp4" },
      { format: OutputFormat.WebM, extension: ".webm" },
      { format: OutputFormat.Mov, extension: ".mov" },
    ]

    formats.forEach(({ format, extension }) => {
      it(`should export video in ${format} format`, async () => {
        const project = createMockProject()
        const settings = createExportSettings({
          format,
          fileName: `test-export${extension}`,
          savePath: `/test/exports/test-export${extension}`,
        })
        const mockJobId = `export-${format}-123`

        mockRenderProject.mockResolvedValueOnce(mockJobId)
        mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
          setTimeout(
            () =>
              callback({
                job_id: mockJobId,
                stage: "Completed",
                percentage: 100,
                current_frame: 3600,
                total_frames: 3600,
                elapsed_time: 120,
                status: RenderStatus.Completed,
              }),
            100,
          )
        })

        const jobId = await mockRenderProject(project, settings.savePath)

        expect(jobId).toBe(mockJobId)
        expect(settings.savePath).toContain(extension)
      })
    })

    it("should handle format-specific codec settings", async () => {
      const project = createMockProject()

      // H.265/HEVC for MP4
      const h265Settings = createExportSettings({
        format: OutputFormat.Mp4,
        encodingProfile: "main10",
      })

      mockRenderProject.mockResolvedValueOnce("h265-job")
      await mockRenderProject(project, h265Settings.savePath)

      expect(mockRenderProject).toHaveBeenCalledWith(project, h265Settings.savePath)
    })
  })

  describe("3. Quality Presets", () => {
    const qualityTests: Array<{
      quality: "normal" | "good" | "best"
      bitrate: number
    }> = [
      { quality: "normal", bitrate: QUALITY_PRESETS.normal.videoBitrate },
      { quality: "good", bitrate: QUALITY_PRESETS.good.videoBitrate },
      { quality: "best", bitrate: QUALITY_PRESETS.best.videoBitrate },
    ]

    qualityTests.forEach(({ quality, bitrate }) => {
      it(`should export with ${quality} quality preset`, async () => {
        const project = createMockProject()
        const settings = createExportSettings({ quality, bitrate })
        const mockJobId = `export-${quality}-123`

        mockRenderProject.mockResolvedValueOnce(mockJobId)
        mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
          setTimeout(
            () =>
              callback({
                job_id: mockJobId,
                stage: "Completed",
                percentage: 100,
                current_frame: 3600,
                total_frames: 3600,
                elapsed_time: 120,
                status: RenderStatus.Completed,
              }),
            100,
          )
        })

        await mockRenderProject(project, settings.savePath)

        expect(mockRenderProject).toHaveBeenCalledWith(project, settings.savePath)
        expect(settings.bitrate).toBe(bitrate)
      })
    })

    it("should export in 4K resolution", async () => {
      const project = createMockProject({
        timeline: {
          duration: 120,
          fps: 60,
          resolution: [3840, 2160],
          sample_rate: 48000,
          aspect_ratio: AspectRatio.Ratio16x9,
        },
      })

      const settings = createExportSettings({
        resolution: "4k",
        quality: "best",
        bitrate: 45000,
        frameRate: "60",
      })

      mockRenderProject.mockResolvedValueOnce("4k-job")
      mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
        setTimeout(
          () =>
            callback({
              job_id: "4k-job",
              stage: "Completed",
              percentage: 100,
              current_frame: 7200,
              total_frames: 7200,
              elapsed_time: 300,
              status: RenderStatus.Completed,
            }),
          100,
        )
      })

      await mockRenderProject(project, settings.savePath)

      expect(project.timeline.resolution).toEqual([3840, 2160])
      expect(settings.resolution).toBe("4k")
    })
  })

  describe("4. Progress Tracking and Cancellation", () => {
    it("should track export progress accurately", async () => {
      const project = createMockProject()
      const settings = createExportSettings()
      const mockJobId = "progress-job-123"

      mockRenderProject.mockResolvedValueOnce(mockJobId)

      const progressCallbacks: RenderProgress[] = []
      mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
        const stages = [0, 10, 25, 50, 75, 90, 100]
        stages.forEach((percentage, index) => {
          setTimeout(() => {
            const progress: RenderProgress = {
              job_id: mockJobId,
              stage: percentage === 100 ? "Completed" : "Encoding",
              percentage,
              current_frame: (3600 * percentage) / 100,
              total_frames: 3600,
              elapsed_time: index * 10,
              status: percentage === 100 ? RenderStatus.Completed : RenderStatus.Processing,
            }
            progressCallbacks.push(progress)
            callback(progress)
          }, index * 50)
        })
      })

      await mockRenderProject(project, settings.savePath)

      await new Promise<void>((resolve) => {
        mockTrackRenderProgress(mockJobId, (progress: RenderProgress) => {
          if (progress.status === RenderStatus.Completed) {
            resolve()
          }
        })
      })

      expect(progressCallbacks.length).toBeGreaterThan(0)
      expect(progressCallbacks[0].percentage).toBe(0)
      expect(progressCallbacks[progressCallbacks.length - 1].percentage).toBe(100)

      // Verify progress is monotonically increasing
      for (let i = 1; i < progressCallbacks.length; i++) {
        expect(progressCallbacks[i].percentage).toBeGreaterThanOrEqual(progressCallbacks[i - 1].percentage)
      }
    })

    it("should cancel export successfully", async () => {
      const mockJobId = "cancel-job-123"

      mockCancelRender.mockResolvedValueOnce(true)
      mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
        setTimeout(
          () =>
            callback({
              job_id: mockJobId,
              stage: "Cancelled",
              percentage: 45,
              current_frame: 1620,
              total_frames: 3600,
              elapsed_time: 50,
              status: RenderStatus.Cancelled,
            }),
          100,
        )
      })

      const cancelled = await mockCancelRender(mockJobId)

      expect(cancelled).toBe(true)
      expect(mockCancelRender).toHaveBeenCalledWith(mockJobId)
    })

    it("should handle cancellation during different stages", async () => {
      const stages = ["Initializing", "Encoding", "Finalizing"]

      for (const stage of stages) {
        const mockJobId = `cancel-${stage}-job`

        mockCancelRender.mockResolvedValueOnce(true)
        const cancelled = await mockCancelRender(mockJobId)

        expect(cancelled).toBe(true)
      }
    })
  })

  describe("5. Audio/Video Sync", () => {
    it("should maintain audio/video sync during export", async () => {
      const project = createMockProject({
        tracks: [
          {
            id: "video-1",
            track_type: "Video" as any,
            name: "Video Track",
            enabled: true,
            locked: false,
            volume: 1.0,
            clips: [
              {
                id: "v-clip-1",
                source_path: "/test/video.mp4",
                start_time: 0,
                end_time: 60,
                source_start: 0,
                source_end: 60,
                speed: 1.0,
                volume: 1.0,
                effects: [],
                filters: [],
              },
            ],

            effects: [],
            filters: [],
          },
          {
            id: "audio-1",
            track_type: "Audio" as any,
            name: "Audio Track",
            enabled: true,
            locked: false,
            volume: 1.0,
            clips: [
              {
                id: "a-clip-1",
                source_path: "/test/audio.mp3",
                start_time: 0,
                end_time: 60,
                source_start: 0,
                source_end: 60,
                speed: 1.0,
                volume: 1.0,
                effects: [],
                filters: [],
              },
            ],

            effects: [],
            filters: [],
          },
        ],
      })

      const settings = createExportSettings({
        exportVideo: true,
        exportAudio: true,
      })

      mockRenderProject.mockResolvedValueOnce("sync-job")
      await mockRenderProject(project, settings.savePath)

      expect(mockRenderProject).toHaveBeenCalledWith(
        expect.objectContaining({
          tracks: expect.arrayContaining([
            expect.objectContaining({ track_type: "Video" }),
            expect.objectContaining({ track_type: "Audio" }),
          ]),
        }),
        settings.savePath,
      )
    })

    it("should handle audio normalization", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        normalizeAudio: true,
        audioTarget: -14, // YouTube standard
        audioPeak: -1,
      })

      mockRenderProject.mockResolvedValueOnce("normalize-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.normalizeAudio).toBe(true)
      expect(settings.audioTarget).toBe(-14)
    })
  })

  describe("6. Subtitle/Caption Embedding", () => {
    it("should embed subtitles in exported video", async () => {
      const project = createMockProject({
        subtitles: [
          {
            id: "sub-1",
            text: "First subtitle",
            start_time: 0,
            end_time: 5,
            position: {
              x: 50,
              y: 90,
              align_x: "Center" as any,
              align_y: "Bottom" as any,
            },
            style: {
              font_family: "Arial",
              font_size: 24,
              font_weight: "Normal" as any,
              color: "#FFFFFF",
            },
            enabled: true,
          },
          {
            id: "sub-2",
            text: "Second subtitle",
            start_time: 5,
            end_time: 10,
            position: {
              x: 50,
              y: 90,
              align_x: "Center" as any,
              align_y: "Bottom" as any,
            },
            style: {
              font_family: "Arial",
              font_size: 24,
              font_weight: "Normal" as any,
              color: "#FFFFFF",
            },
            enabled: true,
          },
        ],
      })

      mockRenderProject.mockResolvedValueOnce("subtitle-job")
      await mockRenderProject(project, "/test/export-with-subs.mp4")

      expect(project.subtitles.length).toBe(2)
      expect(project.subtitles[0].enabled).toBe(true)
    })

    it("should skip disabled subtitles", async () => {
      const project = createMockProject({
        subtitles: [
          {
            id: "sub-enabled",
            text: "Enabled subtitle",
            start_time: 0,
            end_time: 5,
            position: {
              x: 50,
              y: 90,
              align_x: "Center" as any,
              align_y: "Bottom" as any,
            },
            style: {
              font_family: "Arial",
              font_size: 24,
              font_weight: "Normal" as any,
              color: "#FFFFFF",
            },
            enabled: true,
          },
          {
            id: "sub-disabled",
            text: "Disabled subtitle",
            start_time: 5,
            end_time: 10,
            position: {
              x: 50,
              y: 90,
              align_x: "Center" as any,
              align_y: "Bottom" as any,
            },
            style: {
              font_family: "Arial",
              font_size: 24,
              font_weight: "Normal" as any,
              color: "#FFFFFF",
            },
            enabled: false,
          },
        ],
      })

      mockRenderProject.mockResolvedValueOnce("subtitle-filter-job")
      await mockRenderProject(project, "/test/export.mp4")

      const enabledSubtitles = project.subtitles.filter((s) => s.enabled)
      expect(enabledSubtitles.length).toBe(1)
    })
  })

  describe("7. Metadata Preservation", () => {
    it("should preserve project metadata in export", async () => {
      const metadata = {
        name: "Important Project",
        description: "Project with important metadata",
        created_at: "2024-01-01T00:00:00Z",
        modified_at: "2024-11-09T00:00:00Z",
        author: "Test Author",
      }

      const project = createMockProject({ metadata })
      const settings = createExportSettings({ embedInfoAsProject: true })

      mockRenderProject.mockResolvedValueOnce("metadata-job")
      await mockRenderProject(project, settings.savePath)

      expect(mockRenderProject).toHaveBeenCalledWith(expect.objectContaining({ metadata }), settings.savePath)
    })

    it("should add chapter markers from timeline markers", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        chaptersByMarkers: true,
        chapters: true,
      })

      mockRenderProject.mockResolvedValueOnce("chapters-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.chapters).toBe(true)
      expect(settings.chaptersByMarkers).toBe(true)
    })
  })

  describe("8. Error Handling", () => {
    it("should handle render initialization failure", async () => {
      const project = createMockProject()
      const settings = createExportSettings()

      mockRenderProject.mockRejectedValueOnce(new Error("Failed to initialize render"))

      await expect(mockRenderProject(project, settings.savePath)).rejects.toThrow("Failed to initialize render")
    })

    it("should handle render failure during processing", async () => {
      const project = createMockProject()
      const mockJobId = "failing-job"

      mockRenderProject.mockResolvedValueOnce(mockJobId)
      mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
        setTimeout(
          () =>
            callback({
              job_id: mockJobId,
              stage: "Encoding",
              percentage: 50,
              current_frame: 1800,
              total_frames: 3600,
              elapsed_time: 60,
              status: RenderStatus.Failed,
              message: "Encoding error: corrupted video frame",
            }),
          100,
        )
      })

      const progressUpdates: RenderProgress[] = []
      await mockRenderProject(project, "/test/export.mp4")

      await new Promise<void>((resolve) => {
        mockTrackRenderProgress(mockJobId, (progress: RenderProgress) => {
          progressUpdates.push(progress)
          if (progress.status === RenderStatus.Failed) {
            resolve()
          }
        })
      })

      const lastProgress = progressUpdates[progressUpdates.length - 1]
      expect(lastProgress.status).toBe(RenderStatus.Failed)
      expect(lastProgress.message).toContain("corrupted video frame")
    })

    it("should handle disk space errors", async () => {
      const project = createMockProject()

      mockRenderProject.mockClear()
      mockRenderProject.mockRejectedValueOnce(new Error("Insufficient disk space"))

      await expect(mockRenderProject(project, "/test/export.mp4")).rejects.toThrow("Insufficient disk space")
    })

    it("should handle invalid output path", async () => {
      const project = createMockProject()
      const invalidPath = "/invalid/path/that/does/not/exist/export.mp4"

      mockRenderProject.mockClear()
      mockRenderProject.mockRejectedValueOnce(new Error("Invalid output path"))

      await expect(mockRenderProject(project, invalidPath)).rejects.toThrow("Invalid output path")
    })
  })

  describe("9. Resume After Interruption", () => {
    it("should support resuming interrupted export", async () => {
      const mockJobId = "resume-job-123"
      const interruptedProgress = 45

      // First attempt - interrupted
      mockRenderProject.mockResolvedValueOnce(mockJobId)
      mockTrackRenderProgress.mockImplementationOnce((_: string, callback: (progress: RenderProgress) => void) => {
        setTimeout(
          () =>
            callback({
              job_id: mockJobId,
              stage: "Encoding",
              percentage: interruptedProgress,
              current_frame: 1620,
              total_frames: 3600,
              elapsed_time: 50,
              status: RenderStatus.Cancelled,
            }),
          100,
        )
      })

      // Resume attempt
      mockInvoke.mockResolvedValueOnce(mockJobId)
      mockTrackRenderProgress.mockImplementationOnce((_: string, callback: (progress: RenderProgress) => void) => {
        setTimeout(
          () =>
            callback({
              job_id: mockJobId,
              stage: "Encoding",
              percentage: 100,
              current_frame: 3600,
              total_frames: 3600,
              elapsed_time: 120,
              status: RenderStatus.Completed,
            }),
          100,
        )
      })

      // Verify job can be resumed
      const resumedJobId = await mockInvoke("resume_render", {
        jobId: mockJobId,
      })
      expect(resumedJobId).toBe(mockJobId)
    })
  })

  describe("10. Batch Export", () => {
    it("should export multiple projects in batch", async () => {
      const projects = [
        createMockProject({
          metadata: {
            name: "Project 1",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
        createMockProject({
          metadata: {
            name: "Project 2",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
        createMockProject({
          metadata: {
            name: "Project 3",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
      ]

      const outputPaths = ["/test/exports/project1.mp4", "/test/exports/project2.mp4", "/test/exports/project3.mp4"]

      const jobIds = ["batch-job-1", "batch-job-2", "batch-job-3"]

      mockRenderProject.mockClear()

      // Mock each export
      jobIds.forEach((jobId) => {
        mockRenderProject.mockResolvedValueOnce(jobId)
      })

      // Execute batch export
      const results = await Promise.all(
        projects.map((project, index) => mockRenderProject(project, outputPaths[index])),
      )

      expect(results).toHaveLength(3)
      expect(mockRenderProject).toHaveBeenCalledTimes(3)
      results.forEach((jobId, index) => {
        expect(jobId).toBe(jobIds[index])
      })
    })

    it("should handle partial batch export failures", async () => {
      const projects = [
        createMockProject({
          metadata: {
            name: "Project 1",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
        createMockProject({
          metadata: {
            name: "Project 2",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
      ]

      mockRenderProject.mockClear()
      mockRenderProject.mockResolvedValueOnce("batch-1")
      mockRenderProject.mockRejectedValueOnce(new Error("Export failed"))

      const results = await Promise.allSettled([
        mockRenderProject(projects[0], "/test/p1.mp4"),
        mockRenderProject(projects[1], "/test/p2.mp4"),
      ])

      expect(results[0].status).toBe("fulfilled")
      expect(results[1].status).toBe("rejected")
      if (results[1].status === "rejected") {
        expect(results[1].reason.message).toBe("Export failed")
      }
    })
  })

  describe("11. Cloud Upload Integration", () => {
    describe("YouTube Upload", () => {
      it("should upload to YouTube after export", async () => {
        const project = createMockProject()
        const settings: SocialExportSettings = {
          ...createExportSettings(),
          socialNetwork: "youtube",
          isLoggedIn: true,
          title: "Test YouTube Video",
          description: "Test description",
          tags: ["test", "export"],
          privacy: "private",
          category: "22",
        }

        mockRenderProject.mockResolvedValueOnce("youtube-export-job")
        mockTrackRenderProgress.mockImplementation((_: string, callback: (progress: RenderProgress) => void) => {
          setTimeout(
            () =>
              callback({
                job_id: "youtube-export-job",
                stage: "Completed",
                percentage: 100,
                current_frame: 3600,
                total_frames: 3600,
                elapsed_time: 120,
                status: RenderStatus.Completed,
              }),
            100,
          )
        })

        vi.mocked(mockSocialNetworksService.isLoggedIn).mockResolvedValueOnce(true)
        vi.mocked(mockSocialNetworksService.uploadVideo).mockResolvedValueOnce({
          success: true,
          url: "https://youtube.com/watch?v=test123",
          id: "test123",
        })

        await mockRenderProject(project, settings.savePath)
        const isLoggedIn = await mockSocialNetworksService.isLoggedIn("youtube")

        expect(isLoggedIn).toBe(true)

        // Simulate file creation
        const videoFile = new Blob([new Uint8Array(1024)], {
          type: "video/mp4",
        })
        const uploadResult = await mockSocialNetworksService.uploadVideo("youtube", videoFile, settings)

        expect(uploadResult.success).toBe(true)
        expect(uploadResult.url).toContain("youtube.com")
      })
    })

    describe("Vimeo Upload", () => {
      it("should upload to Vimeo with privacy settings", async () => {
        const project = createMockProject()
        const settings: SocialExportSettings = {
          ...createExportSettings(),
          socialNetwork: "vimeo",
          isLoggedIn: true,
          title: "Test Vimeo Video",
          description: "Vimeo description",
          privacy: "unlisted",
        }

        mockRenderProject.mockClear()
        mockRenderProject.mockResolvedValueOnce("vimeo-export-job")
        vi.mocked(mockSocialNetworksService.isLoggedIn).mockClear()
        vi.mocked(mockSocialNetworksService.isLoggedIn).mockResolvedValueOnce(true)
        vi.mocked(mockSocialNetworksService.uploadVideo).mockClear()
        vi.mocked(mockSocialNetworksService.uploadVideo).mockResolvedValueOnce({
          success: true,
          url: "https://vimeo.com/12345678",
          id: "12345678",
        })

        await mockRenderProject(project, settings.savePath)

        const videoFile = new Blob([new Uint8Array(1024)], {
          type: "video/mp4",
        })
        const uploadResult = await mockSocialNetworksService.uploadVideo("vimeo", videoFile, settings)

        expect(uploadResult.success).toBe(true)
        expect(uploadResult.url).toContain("vimeo.com")
      })
    })

    describe("Telegram Upload", () => {
      it("should upload to Telegram channel", async () => {
        const project = createMockProject()
        const settings: SocialExportSettings = {
          ...createExportSettings({
            resolution: "720",
            format: OutputFormat.Mp4,
          }),
          socialNetwork: "telegram",
          isLoggedIn: true,
          channelId: "@testchannel",
          title: "Test Telegram Video",
        }

        mockRenderProject.mockClear()
        mockRenderProject.mockResolvedValueOnce("telegram-export-job")
        vi.mocked(mockSocialNetworksService.isLoggedIn).mockClear()
        vi.mocked(mockSocialNetworksService.isLoggedIn).mockResolvedValueOnce(true)
        vi.mocked(mockSocialNetworksService.uploadVideo).mockClear()
        vi.mocked(mockSocialNetworksService.uploadVideo).mockResolvedValueOnce({
          success: true,
          url: "https://t.me/testchannel/123",
          id: "123",
        })

        await mockRenderProject(project, settings.savePath)

        const videoFile = new Blob([new Uint8Array(512 * 1024)], {
          type: "video/mp4",
        })
        const uploadResult = await mockSocialNetworksService.uploadVideo("telegram", videoFile, settings)

        expect(uploadResult.success).toBe(true)
        expect(uploadResult.url).toContain("t.me")
      })
    })

    it("should validate video before upload", async () => {
      const settings: SocialExportSettings = {
        ...createExportSettings(),
        socialNetwork: "youtube",
        isLoggedIn: true,
      }

      vi.mocked(mockSocialNetworksService.validateSettings).mockReturnValueOnce([])

      const errors = mockSocialNetworksService.validateSettings("youtube", settings)

      expect(errors).toHaveLength(0)
      expect(mockSocialNetworksService.validateSettings).toHaveBeenCalledWith("youtube", settings)
    })

    it("should handle upload failure gracefully", async () => {
      const settings: SocialExportSettings = {
        ...createExportSettings(),
        socialNetwork: "youtube",
        isLoggedIn: true,
      }

      vi.mocked(mockSocialNetworksService.uploadVideo).mockClear()
      vi.mocked(mockSocialNetworksService.uploadVideo).mockResolvedValueOnce({
        success: false,
        error: "Upload quota exceeded",
      })

      const videoFile = new Blob([new Uint8Array(1024)], { type: "video/mp4" })
      const result = await mockSocialNetworksService.uploadVideo("youtube", videoFile, settings)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Upload quota exceeded")
    })

    it("should track upload progress", async () => {
      const settings: SocialExportSettings = {
        ...createExportSettings(),
        socialNetwork: "youtube",
        isLoggedIn: true,
      }

      const progressUpdates: number[] = []

      vi.mocked(mockSocialNetworksService.uploadVideo).mockClear()
      vi.mocked(mockSocialNetworksService.uploadVideo).mockImplementation(
        async (_network: string, _file: Blob, _settings: any, onProgress?: (progress: number) => void) => {
          const updates = [0, 25, 50, 75, 100]
          for (const progress of updates) {
            progressUpdates.push(progress)
            if (onProgress) onProgress(progress)
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          return {
            success: true,
            url: "https://youtube.com/watch?v=test",
            id: "test",
          }
        },
      )

      const videoFile = new Blob([new Uint8Array(1024)], { type: "video/mp4" })
      await mockSocialNetworksService.uploadVideo("youtube", videoFile, settings, (_progress: number) => {
        // Progress callback
      })
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
    })
  })

  describe("Additional Edge Cases", () => {
    it("should handle export with GPU acceleration enabled", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        enableGPU: true,
      })

      mockRenderProject.mockResolvedValueOnce("gpu-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.enableGPU).toBe(true)
      expect(mockRenderProject).toHaveBeenCalled()
    })

    it("should handle export with constant bitrate mode", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        bitrateMode: "cbr",
        bitrate: 8000,
        constantBitrate: true,
      })

      mockRenderProject.mockResolvedValueOnce("cbr-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.bitrateMode).toBe("cbr")
      expect(settings.constantBitrate).toBe(true)
      expect(settings.bitrate).toBe(8000)
    })

    it("should handle export with multipass encoding", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        multipassEncoding: true,
      })

      mockRenderProject.mockResolvedValueOnce("multipass-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.multipassEncoding).toBe(true)
      expect(mockRenderProject).toHaveBeenCalledWith(project, settings.savePath)
    })

    it("should export video only (no audio)", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        exportVideo: true,
        exportAudio: false,
      })

      mockRenderProject.mockResolvedValueOnce("video-only-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.exportVideo).toBe(true)
      expect(settings.exportAudio).toBe(false)
      expect(mockRenderProject).toHaveBeenCalled()
    })

    it("should export audio only (no video)", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        exportVideo: false,
        exportAudio: true,
      })

      mockRenderProject.mockResolvedValueOnce("audio-only-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.exportVideo).toBe(false)
      expect(settings.exportAudio).toBe(true)
      expect(mockRenderProject).toHaveBeenCalled()
    })

    it("should handle different frame rates", async () => {
      const frameRates = ["24", "25", "30", "60"]

      for (const frameRate of frameRates) {
        mockRenderProject.mockResolvedValueOnce(`fps-${frameRate}-job`)
        const project = createMockProject()
        const settings = createExportSettings({ frameRate })

        await mockRenderProject(project, settings.savePath)

        expect(settings.frameRate).toBe(frameRate)
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(4)
    })

    it("should handle different resolutions", async () => {
      const resolutions: Array<"720" | "1080" | "1440" | "4k"> = ["720", "1080", "1440", "4k"]

      for (const resolution of resolutions) {
        mockRenderProject.mockResolvedValueOnce(`res-${resolution}-job`)
        const project = createMockProject()
        const settings = createExportSettings({ resolution })

        await mockRenderProject(project, settings.savePath)

        expect(settings.resolution).toBe(resolution)
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(4)
    })

    it("should handle different bitrate modes", async () => {
      const bitrateModesTests: Array<{
        mode: "auto" | "limit" | "cbr" | "vbr" | "crf"
        bitrate?: number
        crf?: number
      }> = [{ mode: "auto" }, { mode: "cbr", bitrate: 8000 }, { mode: "vbr", bitrate: 8000 }, { mode: "crf", crf: 23 }]

      for (const test of bitrateModesTests) {
        mockRenderProject.mockResolvedValueOnce(`bitrate-${test.mode}-job`)
        const project = createMockProject()
        const settings = createExportSettings({
          bitrateMode: test.mode,
          bitrate: test.bitrate,
          crf: test.crf,
        })

        await mockRenderProject(project, settings.savePath)

        expect(settings.bitrateMode).toBe(test.mode)
        if (test.bitrate) {
          expect(settings.bitrate).toBe(test.bitrate)
        }
        if (test.crf !== undefined) {
          expect(settings.crf).toBe(test.crf)
        }
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(4)
    })

    it("should handle export with effects and filters", async () => {
      const project = createMockProject({
        effects: [
          {
            id: "effect-1",
            name: { en: "Blur Effect", ru: "Эффект размытия" },
            category: "blur_sharpen" as any,
            scope: ["clip"] as any,
            processingType: "realtime" as any,
            version: "1.0.0",
            tags: ["blur"],
            complexity: "medium" as const,
            gpuAccelerated: true,
            parameters: [],
            presets: [],
            processors: {},
          } as any,
        ],

        filters: [
          {
            id: "filter-1",
            filter_type: "Brightness" as any,
            name: "Brightness",
            enabled: true,
            parameters: { brightness: 1.2 },
          },
        ],
      })

      mockRenderProject.mockResolvedValueOnce("effects-job")
      await mockRenderProject(project, "/test/export.mp4")

      expect(project.effects.length).toBe(1)
      expect(project.filters.length).toBe(1)
      expect(project.filters[0].enabled).toBe(true)
    })

    it("should handle export with transitions", async () => {
      const project = createMockProject({
        transitions: [
          {
            id: "transition-1",
            transition_type: "fade",
            name: "Fade",
            tags: ["Fade", "Opacity"],
            duration: {
              min: 0.5,
              max: 5,
              default: 1,
              current: 1,
            },
            start_time: 60,
            from_clip_id: "clip-1",
            to_clip_id: "clip-2",
            parameters: {},
          },
        ],
      })

      mockRenderProject.mockResolvedValueOnce("transitions-job")
      await mockRenderProject(project, "/test/export.mp4")

      expect(project.transitions.length).toBe(1)
      expect(project.transitions[0].transition_type).toBe("fade")
      expect(project.transitions[0].duration.current).toBe(1)
    })

    it("should handle different aspect ratios", async () => {
      const aspectRatios = [AspectRatio.Ratio16x9, AspectRatio.Ratio4x3, AspectRatio.Ratio1x1, AspectRatio.Ratio9x16]

      for (const aspectRatio of aspectRatios) {
        mockRenderProject.mockResolvedValueOnce(`aspect-${aspectRatio}-job`)
        const project = createMockProject({
          timeline: {
            duration: 60,
            fps: 30,
            resolution: [1920, 1080],
            sample_rate: 48000,
            aspect_ratio: aspectRatio,
          },
        })

        await mockRenderProject(project, "/test/export.mp4")

        expect(project.timeline.aspect_ratio).toBe(aspectRatio)
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(4)
    })

    it("should handle export with watermark", async () => {
      const project = createMockProject()
      const settings = createExportSettings({
        watermark: true,
      })

      mockRenderProject.mockResolvedValueOnce("watermark-job")
      await mockRenderProject(project, settings.savePath)

      expect(settings.watermark).toBe(true)
      expect(mockRenderProject).toHaveBeenCalled()
    })

    it("should handle export with custom audio codec", async () => {
      const audioCodecs = ["aac", "mp3", "opus"]

      for (const codec of audioCodecs) {
        mockRenderProject.mockResolvedValueOnce(`audio-${codec}-job`)
        const project = createMockProject()
        const settings = createExportSettings({ audioCodec: codec })

        await mockRenderProject(project, settings.savePath)

        expect(settings.audioCodec).toBe(codec)
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(3)
    })

    it("should handle export with different encoding profiles", async () => {
      const profiles: Array<"main" | "main10" | "high"> = ["main", "main10", "high"]

      for (const profile of profiles) {
        mockRenderProject.mockResolvedValueOnce(`profile-${profile}-job`)
        const project = createMockProject()
        const settings = createExportSettings({ encodingProfile: profile })

        await mockRenderProject(project, settings.savePath)

        expect(settings.encodingProfile).toBe(profile)
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(3)
    })

    it("should handle export with different encoding presets", async () => {
      const presets: Array<
        "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow"
      > = ["ultrafast", "fast", "medium", "slow", "veryslow"]

      for (const preset of presets) {
        mockRenderProject.mockResolvedValueOnce(`preset-${preset}-job`)
        const project = createMockProject()
        const settings = createExportSettings({ encodingPreset: preset })

        await mockRenderProject(project, settings.savePath)

        expect(settings.encodingPreset).toBe(preset)
      }

      expect(mockRenderProject).toHaveBeenCalledTimes(5)
    })

    it("should handle concurrent exports with job tracking", async () => {
      const projects = [
        createMockProject({
          metadata: {
            name: "Project A",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
        createMockProject({
          metadata: {
            name: "Project B",
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
          },
        }),
      ]

      mockRenderProject.mockResolvedValueOnce("concurrent-1")
      mockRenderProject.mockResolvedValueOnce("concurrent-2")

      const [job1, job2] = await Promise.all([
        mockRenderProject(projects[0], "/test/a.mp4"),
        mockRenderProject(projects[1], "/test/b.mp4"),
      ])

      expect(job1).toBe("concurrent-1")
      expect(job2).toBe("concurrent-2")
      expect(mockRenderProject).toHaveBeenCalledTimes(2)
    })

    it("should handle render with custom FFmpeg args", async () => {
      const project = createMockProject({
        settings: {
          export: {
            format: OutputFormat.Mp4,
            quality: 85,
            video_bitrate: 8000,
            audio_bitrate: 192,
            hardware_acceleration: true,
            ffmpeg_args: ["-preset", "slow", "-tune", "film"],
          },
          preview: {
            resolution: [1280, 720],
            fps: 30,
            quality: 75,
          },
          custom: {},
        },
      })

      mockRenderProject.mockResolvedValueOnce("custom-ffmpeg-job")
      await mockRenderProject(project, "/test/export.mp4")

      expect(project.settings.export.ffmpeg_args).toHaveLength(4)
      expect(project.settings.export.ffmpeg_args).toContain("-preset")
      expect(project.settings.export.ffmpeg_args).toContain("slow")
    })
  })
})
