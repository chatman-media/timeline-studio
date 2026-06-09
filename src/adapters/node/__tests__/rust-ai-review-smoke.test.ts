import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { runRustAIReviewSmoke } from "../rust-ai-review-smoke"

describe("runRustAIReviewSmoke", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rust-ai-review-smoke-test-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("reports skipped diagnostics when local Rust commands are missing", async () => {
    const mediaPath = path.join(tempDir, "input.mp4")
    const missingCommand = path.join(tempDir, "missing-timeline")
    await fs.writeFile(mediaPath, "fixture")

    const result = await runRustAIReviewSmoke({
      repoRoot: process.cwd(),
      workDir: tempDir,
      mediaPath,
      renderCommand: missingCommand,
      publishCommand: missingCommand,
      env: {},
    })

    expect(result.ok).toBe(true)
    expect(result.skipped).toBe(true)
    expect(check(result, "media-fixture")).toMatchObject({
      status: "passed",
    })
    expect(check(result, "rust-preview-render")).toMatchObject({
      status: "skipped",
      message: expect.stringContaining("Configured command is not available"),
    })
    expect(check(result, "rust-publish-telegram-validate")).toMatchObject({
      status: "skipped",
      message: expect.stringContaining("Configured command is not available"),
    })
  })

  it("runs preview render and validate-only publish through Node Rust adapters", async () => {
    const mediaPath = path.join(tempDir, "input.mp4")
    await fs.writeFile(mediaPath, "fixture")
    const publishRunCommand = vi.fn(async (_command: string, args: string[]) => {
      if (args[1] === "telegram") {
        return {
          stdout: JSON.stringify({
            platform: "telegram",
            status: "validated",
            bot: "@timeline_smoke_bot",
          }),
          stderr: "",
        }
      }

      return {
        stdout: JSON.stringify({
          video_id: "channel-smoke",
          url: "https://youtu.be/channel-smoke",
          status: "validated",
        }),
        stderr: "",
      }
    })

    const result = await runRustAIReviewSmoke({
      repoRoot: process.cwd(),
      workDir: tempDir,
      mediaPath,
      telegramBotToken: "telegram-secret",
      youtubeAccessToken: "youtube-secret",
      renderCommandFactory: (projectPath, outputPath) => ({
        command: process.execPath,
        args: [
          "-e",
          [
            "const fs = require('node:fs')",
            "const [projectPath, outputPath] = process.argv.slice(1)",
            "const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'))",
            "if (project.metadata.name !== 'AI review Rust smoke') process.exit(2)",
            "if (project.tracks[0].clips[0].source.File !== process.env.SMOKE_MEDIA_PATH) process.exit(3)",
            "process.stdout.write('..')",
            "fs.writeFileSync(outputPath, 'preview')",
          ].join(";"),
          projectPath,
          outputPath,
        ],
        env: {
          SMOKE_MEDIA_PATH: mediaPath,
        },
      }),
      publishRunCommand,
      env: {},
    })

    expect(result.ok).toBe(true)
    expect(check(result, "rust-preview-render")).toMatchObject({
      status: "passed",
    })
    expect(check(result, "rust-publish-telegram-validate")).toMatchObject({
      status: "passed",
      diagnostics: {
        provider: expect.objectContaining({
          platform: "telegram",
          args: expect.arrayContaining(["--validate-only", "[redacted]"]),
        }),
      },
    })
    expect(check(result, "rust-publish-youtube-validate")).toMatchObject({
      status: "passed",
    })
    expect(result.artifacts.preview).toEqual(
      path.join(tempDir, "previews", "edit-telegram-smoke-chat-smoke-user-r0.mp4"),
    )
    await expect(fs.readFile(result.artifacts.preview ?? "", "utf-8")).resolves.toBe("preview")
    expect(publishRunCommand).toHaveBeenCalledTimes(2)
    expect(publishRunCommand.mock.calls[0]?.[1]).toContain("--validate-only")
    expect(publishRunCommand.mock.calls[1]?.[1]).toContain("--validate-only")
  })
})

function check(result: Awaited<ReturnType<typeof runRustAIReviewSmoke>>, name: string) {
  const smokeCheck = result.checks.find((item) => item.name === name)
  if (!smokeCheck) throw new Error(`Missing smoke check: ${name}`)
  return smokeCheck
}
