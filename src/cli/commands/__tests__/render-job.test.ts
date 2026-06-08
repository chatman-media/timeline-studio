/**
 * Tests for bot-first render-job command.
 */

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { readRenderJobRequest, renderJobCommand, serializeRenderJobResult } from "../render-job"

describe("render-job command", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "render-job-command-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should have correct command shape", () => {
    expect(renderJobCommand.name()).toBe("render-job")
    expect(renderJobCommand.description()).toBe("Run a bot-first render job from JSON")
    expect(renderJobCommand.registeredArguments[0].name()).toBe("job")
    expect(renderJobCommand.options.some((option) => option.long === "--status-file")).toBe(true)
    expect(renderJobCommand.options.some((option) => option.long === "--pretty")).toBe(true)
  })

  it("reads render job JSON and defaults source to cli", async () => {
    const jobPath = path.join(tempDir, "job.json")
    await fs.writeFile(
      jobPath,
      JSON.stringify({
        project: { type: "inline", schema: { clips: [] } },
        output: { format: "mp4" },
      }),
    )

    const request = await readRenderJobRequest(jobPath)

    expect(request.source).toBe("cli")
    expect(request.output.format).toBe("mp4")
  })

  it("rejects render job JSON without output format", async () => {
    const jobPath = path.join(tempDir, "job.json")
    await fs.writeFile(jobPath, JSON.stringify({ source: "bot" }))

    await expect(readRenderJobRequest(jobPath)).rejects.toThrow("Render job JSON must include output.format")
  })

  it("serializes compact and pretty JSON results", () => {
    const result = {
      job: {
        id: "job-1",
        status: "done" as const,
        progress: 100,
        request: { source: "bot" as const, output: { format: "mp4" as const } },
        createdAt: "2026-06-08T00:00:00.000Z",
        updatedAt: "2026-06-08T00:00:01.000Z",
        events: [],
      },
      events: [],
    }

    expect(serializeRenderJobResult(result)).not.toContain("\n")
    expect(serializeRenderJobResult(result, true)).toContain("\n")
  })
})
