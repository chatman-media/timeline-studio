import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NodeRustRenderVideoService } from "../rust-render-video"

describe("NodeRustRenderVideoService", () => {
  let tempDir: string
  let nowTick = 0

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rust-render-video-service-"))
    nowTick = 0
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("runs a ProjectSchema through a Rust render command", async () => {
    const outputPath = path.join(tempDir, "out.mp4")
    const service = new NodeRustRenderVideoService({
      tempDir,
      idFactory: () => "rust-job-1",
      now: () => `2026-06-08T00:00:0${nowTick++}.000Z`,
      renderCommand: (projectPath, outputPath) => ({
        command: process.execPath,
        args: [
          "-e",
          [
            "const fs = require('node:fs')",
            "const [projectPath, outputPath] = process.argv.slice(1)",
            "JSON.parse(fs.readFileSync(projectPath, 'utf8'))",
            "process.stdout.write('..')",
            "fs.writeFileSync(outputPath, 'rendered')",
          ].join(";"),
          projectPath,
          outputPath,
        ],
      }),
    })

    const jobId = await service.renderProject({ name: "project" }, outputPath)

    expect(jobId).toBe("rust-job-1")
    await vi.waitFor(async () => {
      await expect(service.getRenderJob(jobId)).resolves.toMatchObject({
        status: "completed",
        progress: 100,
        outputPath,
      })
    })
    await expect(fs.readFile(outputPath, "utf-8")).resolves.toBe("rendered")
    await expect(fs.access(path.join(tempDir, "rust-job-1.project.json"))).rejects.toThrow()
  })

  it("marks a rust render command failure as a failed render job", async () => {
    const service = new NodeRustRenderVideoService({
      tempDir,
      idFactory: () => "rust-job-2",
      renderCommand: (projectPath, outputPath) => ({
        command: process.execPath,
        args: [
          "-e",
          [
            "const [projectPath, outputPath] = process.argv.slice(1)",
            "void projectPath",
            "void outputPath",
            "process.stderr.write('rust render failed')",
            "process.exit(7)",
          ].join(";"),
          projectPath,
          outputPath,
        ],
      }),
    })

    const jobId = await service.renderProject({ name: "project" }, path.join(tempDir, "failed.mp4"))

    await vi.waitFor(async () => {
      await expect(service.getRenderJob(jobId)).resolves.toMatchObject({
        status: "failed",
        error: "rust render failed",
      })
    })
  })

  it("can cancel a rust render process", async () => {
    const service = new NodeRustRenderVideoService({
      tempDir,
      idFactory: () => "rust-job-3",
      renderCommand: (projectPath, outputPath) => ({
        command: process.execPath,
        args: [
          "-e",
          [
            "const [projectPath, outputPath] = process.argv.slice(1)",
            "void projectPath",
            "void outputPath",
            "setTimeout(() => {}, 10000)",
          ].join(";"),
          projectPath,
          outputPath,
        ],
      }),
    })

    const jobId = await service.renderProject({ name: "project" }, path.join(tempDir, "cancelled.mp4"))

    await expect(service.cancelRender(jobId)).resolves.toBe(true)
    await expect(service.getRenderJob(jobId)).resolves.toMatchObject({
      status: "cancelled",
      progress: 0,
    })
  })
})
