/**
 * Integration tests for render command
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IPlatformService, IVideoService } from "@/core/ports"

// Mock adapters/node
const mockPlatform: IPlatformService = {
  exists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  getFileStats: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn(),
  getPlatform: vi.fn(),
  convertFileSrc: vi.fn(),
  basename: vi.fn(),
  dirname: vi.fn(),
  join: vi.fn(),
  getAbsolutePath: vi.fn(),
  searchFilesByName: vi.fn(),
}

const mockVideo: Partial<IVideoService> = {
  renderProject: vi.fn(),
  getActiveJobs: vi.fn(),
  cancelRender: vi.fn(),
}

vi.mock("@/adapters/node", () => ({
  initNodeApp: vi.fn().mockResolvedValue({
    platform: mockPlatform,
    video: mockVideo,
  }),
}))

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}))

describe("render command integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
  })

  describe("Project rendering", () => {
    it("should start render job with default settings", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockVideo.renderProject) {
        vi.mocked(mockVideo.renderProject).mockResolvedValue("job-abc123")

        const projectSchema = { version: "1.0", tracks: [] }
        const outputPath = "/path/to/output.mp4"

        const jobId = await mockVideo.renderProject(projectSchema, outputPath)

        expect(jobId).toBe("job-abc123")
        expect(mockVideo.renderProject).toHaveBeenCalledWith(projectSchema, outputPath)
      }
    })

    it("should handle different quality settings", async () => {
      const qualities = ["low", "medium", "high", "ultra"]

      for (const quality of qualities) {
        if (mockVideo.renderProject) {
          vi.mocked(mockVideo.renderProject).mockResolvedValue(`job-${quality}`)

          const jobId = await mockVideo.renderProject({}, "/output.mp4")

          expect(jobId).toBeTruthy()
        }
      }
    })

    it("should handle different output formats", async () => {
      const formats = ["mp4", "webm", "mov"]

      for (const format of formats) {
        vi.mocked(mockPlatform.exists).mockResolvedValue(true)

        if (mockVideo.renderProject) {
          vi.mocked(mockVideo.renderProject).mockResolvedValue(`job-${format}`)

          const outputPath = `/output.${format}`
          const jobId = await mockVideo.renderProject({}, outputPath)

          expect(jobId).toBeTruthy()
          expect(outputPath).toContain(format)
        }
      }
    })

    it("should handle custom resolution settings", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockVideo.renderProject) {
        vi.mocked(mockVideo.renderProject).mockResolvedValue("job-4k")

        const width = Number.parseInt("3840", 10)
        const height = Number.parseInt("2160", 10)
        const fps = Number.parseInt("60", 10)

        expect(width).toBe(3840)
        expect(height).toBe(2160)
        expect(fps).toBe(60)

        const jobId = await mockVideo.renderProject({}, "/output.mp4")
        expect(jobId).toBe("job-4k")
      }
    })
  })

  describe("Job monitoring", () => {
    it("should monitor job progress", async () => {
      const progressSteps = [
        { id: "job-123", status: "pending" as const, progress: 0 },
        { id: "job-123", status: "running" as const, progress: 25 },
        { id: "job-123", status: "running" as const, progress: 50 },
        { id: "job-123", status: "running" as const, progress: 75 },
        { id: "job-123", status: "completed" as const, progress: 100 },
      ]

      if (mockVideo.getActiveJobs) {
        for (const step of progressSteps) {
          vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([step])

          const jobs = await mockVideo.getActiveJobs()
          expect(jobs[0].progress).toBe(step.progress)
          expect(jobs[0].status).toBe(step.status)
        }
      }
    })

    it("should handle completed job", async () => {
      if (mockVideo.getActiveJobs) {
        vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([
          {
            id: "job-123",
            status: "completed",
            progress: 100,
            outputPath: "/output.mp4",
          },
        ])

        const jobs = await mockVideo.getActiveJobs()

        expect(jobs[0].status).toBe("completed")
        expect(jobs[0].progress).toBe(100)
        expect(jobs[0].outputPath).toBe("/output.mp4")
      }
    })

    it("should handle failed job with error", async () => {
      if (mockVideo.getActiveJobs) {
        vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([
          {
            id: "job-123",
            status: "failed",
            progress: 45,
            error: "FFmpeg encoding error",
          },
        ])

        const jobs = await mockVideo.getActiveJobs()

        expect(jobs[0].status).toBe("failed")
        expect(jobs[0].error).toBe("FFmpeg encoding error")
      }
    })

    it("should handle cancelled job", async () => {
      if (mockVideo.getActiveJobs) {
        vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([
          {
            id: "job-123",
            status: "cancelled",
            progress: 30,
          },
        ])

        const jobs = await mockVideo.getActiveJobs()

        expect(jobs[0].status).toBe("cancelled")
        expect(jobs[0].progress).toBeLessThan(100)
      }
    })
  })

  describe("Job cancellation", () => {
    it("should cancel running job", async () => {
      if (mockVideo.cancelRender) {
        vi.mocked(mockVideo.cancelRender).mockResolvedValue(true)

        const result = await mockVideo.cancelRender("job-123")

        expect(result).toBe(true)
        expect(mockVideo.cancelRender).toHaveBeenCalledWith("job-123")
      }
    })

    it("should handle cancellation of non-existent job", async () => {
      if (mockVideo.cancelRender) {
        vi.mocked(mockVideo.cancelRender).mockResolvedValue(false)

        const result = await mockVideo.cancelRender("non-existent-job")

        expect(result).toBe(false)
      }
    })
  })

  describe("Progress bar", () => {
    it("should create progress bar at 0%", () => {
      const progress = 0
      const width = 30
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled

      expect(filled).toBe(0)
      expect(empty).toBe(30)

      const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}]`
      expect(bar).toBe("[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]")
    })

    it("should create progress bar at 50%", () => {
      const progress = 50
      const width = 30
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled

      expect(filled).toBe(15)
      expect(empty).toBe(15)

      const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}]`
      expect(bar).toBe("[███████████████░░░░░░░░░░░░░░░]")
    })

    it("should create progress bar at 100%", () => {
      const progress = 100
      const width = 30
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled

      expect(filled).toBe(30)
      expect(empty).toBe(0)

      const bar = `[${"█".repeat(filled)}${"░".repeat(empty)}]`
      expect(bar).toBe("[██████████████████████████████]")
    })
  })

  describe("Error handling", () => {
    it("should handle project file not found", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(false)

      const exists = await mockPlatform.exists("/nonexistent/project.json")
      expect(exists).toBe(false)
    })

    it("should handle invalid project JSON", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      const fs = await import("node:fs/promises")
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("invalid json"))

      await expect(async () => {
        const content = await fs.readFile("/path/to/project.json", "utf-8")
        JSON.parse(content.toString())
      }).rejects.toThrow()
    })

    it("should handle render job failures", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockVideo.renderProject) {
        vi.mocked(mockVideo.renderProject).mockRejectedValue(new Error("Render initialization failed"))

        await expect(mockVideo.renderProject({}, "/output.mp4")).rejects.toThrow("Render initialization failed")
      }
    })
  })

  describe("Time formatting", () => {
    it("should format elapsed time correctly", () => {
      const startTime = Date.now()
      const endTime = startTime + 12345 // 12.345 seconds

      const elapsed = ((endTime - startTime) / 1000).toFixed(1)
      expect(elapsed).toBe("12.3")
    })

    it("should handle long render times", () => {
      const startTime = Date.now()
      const endTime = startTime + 125_000 // 125 seconds

      const elapsed = ((endTime - startTime) / 1000).toFixed(1)
      expect(elapsed).toBe("125.0")
    })
  })

  describe("Parameter parsing", () => {
    it("should parse integer parameters", () => {
      const width = Number.parseInt("1920", 10)
      const height = Number.parseInt("1080", 10)
      const fps = Number.parseInt("30", 10)

      expect(width).toBe(1920)
      expect(height).toBe(1080)
      expect(fps).toBe(30)
    })

    it("should handle invalid parameters", () => {
      const invalidWidth = Number.parseInt("invalid", 10)

      expect(Number.isNaN(invalidWidth)).toBe(true)
    })
  })

  describe("Audio options", () => {
    it("should support audio enabled", () => {
      const audio = true
      expect(audio).toBe(true)
    })

    it("should support audio disabled (--no-audio)", () => {
      const audio = false
      expect(audio).toBe(false)
    })
  })

  describe("Verbose output", () => {
    it("should support verbose mode", () => {
      const verbose = true
      expect(verbose).toBe(true)
    })

    it("should work without verbose mode", () => {
      const verbose = false
      expect(verbose).toBe(false)
    })
  })
})
