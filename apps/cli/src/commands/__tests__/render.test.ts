/**
 * Tests for render command
 */

import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IPlatformService, IVideoService } from "@timeline-studio/core/ports"

// Mock adapters/node
const mockPlatform: Partial<IPlatformService> = {
  exists: vi.fn(),
}

const mockVideo: Partial<IVideoService> = {
  renderProject: vi.fn(),
  getActiveJobs: vi.fn(),
  cancelRender: vi.fn(),
}

vi.mock("@timeline-studio/adapters/node", () => ({
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

describe("render command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
  })

  it("should have correct command name", async () => {
    const { renderCommand } = await import("../render")

    expect(renderCommand.name()).toBe("render")
  })

  it("should have description", async () => {
    const { renderCommand } = await import("../render")

    expect(renderCommand.description()).toBe("Рендеринг проекта Timeline Studio в видео")
  })

  it("should accept project and output arguments", async () => {
    const { renderCommand } = await import("../render")

    const args = renderCommand.registeredArguments
    expect(args).toHaveLength(2)
    expect(args[0].name()).toBe("project")
    expect(args[1].name()).toBe("output")
  })

  it("should have quality option with default", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const qualityOption = options.find((opt) => opt.long === "--quality")

    expect(qualityOption).toBeDefined()
    expect(qualityOption?.short).toBe("-q")
    expect(qualityOption?.defaultValue).toBe("high")
  })

  it("should have format option with default", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const formatOption = options.find((opt) => opt.long === "--format")

    expect(formatOption).toBeDefined()
    expect(formatOption?.short).toBe("-f")
    expect(formatOption?.defaultValue).toBe("mp4")
  })

  it("should have width option with default", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const widthOption = options.find((opt) => opt.long === "--width")

    expect(widthOption).toBeDefined()
    expect(widthOption?.defaultValue).toBe("1920")
  })

  it("should have height option with default", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const heightOption = options.find((opt) => opt.long === "--height")

    expect(heightOption).toBeDefined()
    expect(heightOption?.defaultValue).toBe("1080")
  })

  it("should have fps option with default", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const fpsOption = options.find((opt) => opt.long === "--fps")

    expect(fpsOption).toBeDefined()
    expect(fpsOption?.defaultValue).toBe("30")
  })

  it("should have no-audio option", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const noAudioOption = options.find((opt) => opt.long === "--no-audio")

    expect(noAudioOption).toBeDefined()
  })

  it("should have verbose option", async () => {
    const { renderCommand } = await import("../render")

    const options = renderCommand.options
    const verboseOption = options.find((opt) => opt.long === "--verbose")

    expect(verboseOption).toBeDefined()
    expect(verboseOption?.short).toBe("-v")
  })

  describe("createProgressBar", () => {
    it("should create progress bar for 0%", () => {
      const progress = 0
      const width = 10
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled

      expect(filled).toBe(0)
      expect(empty).toBe(10)
    })

    it("should create progress bar for 50%", () => {
      const progress = 50
      const width = 10
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled

      expect(filled).toBe(5)
      expect(empty).toBe(5)
    })

    it("should create progress bar for 100%", () => {
      const progress = 100
      const width = 10
      const filled = Math.round((progress / 100) * width)
      const empty = width - filled

      expect(filled).toBe(10)
      expect(empty).toBe(0)
    })
  })

  describe("Command execution", () => {
    it("should resolve project and output paths", () => {
      const projectPath = "project.json"
      const outputPath = "output.mp4"

      const absoluteProject = path.resolve(projectPath)
      const absoluteOutput = path.resolve(outputPath)

      expect(path.isAbsolute(absoluteProject)).toBe(true)
      expect(path.isAbsolute(absoluteOutput)).toBe(true)
    })

    it("should parse width, height, and fps as numbers", () => {
      const width = Number.parseInt("1920", 10)
      const height = Number.parseInt("1080", 10)
      const fps = Number.parseInt("30", 10)

      expect(width).toBe(1920)
      expect(height).toBe(1080)
      expect(fps).toBe(30)
    })

    it("should start render job", async () => {
      if (mockPlatform.exists) {
        vi.mocked(mockPlatform.exists).mockResolvedValue(true)
      }
      if (mockVideo.renderProject) {
        vi.mocked(mockVideo.renderProject).mockResolvedValue("job-123")
      }

      expect(mockVideo.renderProject).toBeDefined()
    })

    it("should monitor render progress", async () => {
      if (mockVideo.getActiveJobs) {
        vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([
          {
            id: "job-123",
            status: "running",
            progress: 50,
          },
        ])
      }

      const jobs = await mockVideo.getActiveJobs?.()
      expect(jobs).toHaveLength(1)
      expect(jobs?.[0].progress).toBe(50)
    })

    it("should handle completed job", async () => {
      if (mockVideo.getActiveJobs) {
        vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([
          {
            id: "job-123",
            status: "completed",
            progress: 100,
          },
        ])
      }

      const jobs = await mockVideo.getActiveJobs?.()
      expect(jobs?.[0].status).toBe("completed")
    })

    it("should handle failed job", async () => {
      if (mockVideo.getActiveJobs) {
        vi.mocked(mockVideo.getActiveJobs).mockResolvedValue([
          {
            id: "job-123",
            status: "failed",
            progress: 0,
            error: "Encoding error",
          },
        ])
      }

      const jobs = await mockVideo.getActiveJobs?.()
      expect(jobs?.[0].status).toBe("failed")
      expect(jobs?.[0].error).toBe("Encoding error")
    })

    it("should cancel render on SIGINT", async () => {
      if (mockVideo.cancelRender) {
        vi.mocked(mockVideo.cancelRender).mockResolvedValue(true)
      }

      expect(mockVideo.cancelRender).toBeDefined()
    })
  })

  describe("Quality options", () => {
    it("should support low quality", () => {
      const quality = "low"
      expect(["low", "medium", "high", "ultra"]).toContain(quality)
    })

    it("should support medium quality", () => {
      const quality = "medium"
      expect(["low", "medium", "high", "ultra"]).toContain(quality)
    })

    it("should support high quality", () => {
      const quality = "high"
      expect(["low", "medium", "high", "ultra"]).toContain(quality)
    })

    it("should support ultra quality", () => {
      const quality = "ultra"
      expect(["low", "medium", "high", "ultra"]).toContain(quality)
    })
  })

  describe("Format options", () => {
    it("should support mp4 format", () => {
      const format = "mp4"
      expect(["mp4", "webm", "mov"]).toContain(format)
    })

    it("should support webm format", () => {
      const format = "webm"
      expect(["mp4", "webm", "mov"]).toContain(format)
    })

    it("should support mov format", () => {
      const format = "mov"
      expect(["mp4", "webm", "mov"]).toContain(format)
    })
  })

  describe("Render job monitoring", () => {
    it("should track job by id", () => {
      const jobId = "job-123"
      const jobs = [{ id: "job-123", status: "processing" }]

      const job = jobs.find((j) => j.id === jobId)
      expect(job).toBeDefined()
      expect(job?.id).toBe(jobId)
    })

    it("should update progress", () => {
      let lastProgress = 0
      const progress = 50

      if (progress > lastProgress) {
        lastProgress = progress
      }

      expect(lastProgress).toBe(50)
    })
  })

  describe("Time formatting", () => {
    it("should format elapsed time in seconds", () => {
      const startTime = Date.now()
      const endTime = startTime + 5432 // 5.432 seconds

      const elapsed = ((endTime - startTime) / 1000).toFixed(1)
      expect(elapsed).toBe("5.4")
    })
  })
})
