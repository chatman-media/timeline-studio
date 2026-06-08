import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { IVideoService, RenderJob as VideoRenderJob } from "@/core/ports"
import { NodeRenderJobService } from "../render-job"

function createVideoService(videoJob: VideoRenderJob): IVideoService {
  return {
    renderProject: vi.fn().mockResolvedValue(videoJob.id),
    getRenderJob: vi.fn().mockResolvedValue(videoJob),
    getActiveJobs: vi.fn().mockResolvedValue([videoJob]),
    cancelRender: vi.fn().mockResolvedValue(true),
  } as unknown as IVideoService
}

describe("NodeRenderJobService", () => {
  let tempDir: string
  let nowTick = 0

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "render-job-service-"))
    nowTick = 0
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("runs an inline render job and returns a machine-readable artifact", async () => {
    const videoJob: VideoRenderJob = {
      id: "video-job-1",
      status: "completed",
      progress: 100,
      outputPath: path.join(tempDir, "out.mp4"),
    }
    const video = createVideoService(videoJob)
    const service = new NodeRenderJobService(video, {
      outputDir: tempDir,
      idFactory: () => "bot-job-1",
      now: () => `2026-06-08T00:00:0${nowTick++}.000Z`,
    })

    const result = await service.run(
      {
        source: "bot",
        project: { type: "inline", schema: { clips: [{ path: "/video.mp4" }] } },
        output: { format: "mp4", path: path.join(tempDir, "out.mp4"), destination: "file" },
      },
      { pollIntervalMs: 1, timeoutMs: 100 },
    )

    expect(result.job.id).toBe("bot-job-1")
    expect(result.job.providerJobId).toBe("video-job-1")
    expect(result.job.status).toBe("done")
    expect(result.job.progress).toBe(100)
    expect(result.job.artifact).toEqual({
      type: "file",
      path: path.join(tempDir, "out.mp4"),
      destination: "file",
      mimeType: "video/mp4",
    })
    expect(video.renderProject).toHaveBeenCalledWith({ clips: [{ path: "/video.mp4" }] }, path.join(tempDir, "out.mp4"))
  })

  it("loads a project schema from a job file reference", async () => {
    const projectPath = path.join(tempDir, "project.json")
    await fs.writeFile(projectPath, JSON.stringify({ clips: [{ path: "/clip.mov" }] }))

    const videoJob: VideoRenderJob = {
      id: "video-job-2",
      status: "completed",
      progress: 100,
    }
    const video = createVideoService(videoJob)
    const service = new NodeRenderJobService(video, {
      outputDir: tempDir,
      idFactory: () => "bot-job-2",
    })

    const result = await service.run(
      {
        source: "cli",
        project: { type: "file", path: projectPath },
        output: { format: "mp4", destination: "telegram" },
      },
      { pollIntervalMs: 1, timeoutMs: 100 },
    )

    expect(result.job.status).toBe("done")
    expect(result.job.artifact?.path).toBe(path.join(tempDir, "bot-job-2.mp4"))
    expect(result.job.artifact?.destination).toBe("telegram")
    expect(video.renderProject).toHaveBeenCalledWith(
      { clips: [{ path: "/clip.mov" }] },
      path.join(tempDir, "bot-job-2.mp4"),
    )
  })

  it("returns a failed job when the video render fails", async () => {
    const videoJob: VideoRenderJob = {
      id: "video-job-3",
      status: "failed",
      progress: 20,
      error: "Encoding error",
    }
    const video = createVideoService(videoJob)
    const service = new NodeRenderJobService(video, {
      outputDir: tempDir,
      idFactory: () => "bot-job-3",
    })

    const result = await service.run(
      {
        source: "bot",
        project: { type: "inline", schema: { clips: [{ path: "/video.mp4" }] } },
        output: { format: "mp4", path: path.join(tempDir, "failed.mp4") },
      },
      { pollIntervalMs: 1, timeoutMs: 100 },
    )

    expect(result.job.status).toBe("failed")
    expect(result.job.error).toBe("Encoding error")
    expect(result.events.at(-1)?.status).toBe("failed")
  })

  it("can cancel a provider render job", async () => {
    const videoJob: VideoRenderJob = {
      id: "video-job-4",
      status: "running",
      progress: 50,
    }
    const video = createVideoService(videoJob)
    const service = new NodeRenderJobService(video, {
      outputDir: tempDir,
      idFactory: () => "bot-job-4",
    })

    const runPromise = service.run(
      {
        source: "bot",
        project: { type: "inline", schema: { clips: [{ path: "/video.mp4" }] } },
        output: { format: "mp4" },
      },
      { pollIntervalMs: 10, timeoutMs: 20 },
    )

    await vi.waitFor(async () => {
      await expect(service.getJob("bot-job-4")).resolves.toMatchObject({ providerJobId: "video-job-4" })
    })
    await expect(service.cancelJob("bot-job-4")).resolves.toBe(true)
    expect(video.cancelRender).toHaveBeenCalledWith("video-job-4")
    const result = await runPromise
    expect(result.job.status).toBe("cancelled")
  })
})
