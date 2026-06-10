import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  botCleanupCommand,
  resolveBotCleanupCommandOptions,
  runBotCleanup,
  serializeBotCleanupResult,
} from "../bot-cleanup"

describe("bot-cleanup command", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-cleanup-command-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should have correct command shape", () => {
    expect(botCleanupCommand.name()).toBe("bot-cleanup")
    expect(botCleanupCommand.description()).toBe("Clean up expired Telegram bot runtime files and records")
    expect(botCleanupCommand.options.some((option) => option.long === "--dry-run")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--delete")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--media-dir")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--media-retention")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--review-preview-dir")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--first-cut-planner-temp-dir")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--draft-dir")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--job-store-file")).toBe(true)
    expect(botCleanupCommand.options.some((option) => option.long === "--edit-session-dir")).toBe(true)
  })

  it("resolves cleanup paths and retention windows from environment variables", () => {
    const resolved = resolveBotCleanupCommandOptions(
      {},
      {
        TIMELINE_BOT_CLEANUP_DELETE: "true",
        TIMELINE_BOT_MEDIA_DIR: "/bot/media",
        TIMELINE_BOT_CLEANUP_MEDIA_RETENTION: "7d",
        TIMELINE_BOT_REVIEW_PREVIEW_DIR: "/bot/previews",
        TIMELINE_BOT_CLEANUP_REVIEW_PREVIEW_RETENTION: "8d",
        TIMELINE_BOT_FIRST_CUT_PLANNER_TEMP_DIR: "/bot/first-cut",
        TIMELINE_BOT_CLEANUP_FIRST_CUT_RETENTION: "1d",
        TIMELINE_BOT_DRAFT_DIR: "/bot/drafts",
        TIMELINE_BOT_CLEANUP_DRAFT_RETENTION: "14d",
        TIMELINE_BOT_JOB_STORE_FILE: "/bot/jobs.json",
        TIMELINE_BOT_CLEANUP_JOB_RETENTION: "30d",
        TIMELINE_BOT_EDIT_SESSION_DIR: "/bot/edit-sessions",
        TIMELINE_BOT_CLEANUP_EDIT_SESSION_RETENTION: "31d",
      },
    )

    expect(resolved).toMatchObject({
      dryRun: false,
      delete: true,
      mediaDir: "/bot/media",
      mediaRetention: "7d",
      reviewPreviewDir: "/bot/previews",
      reviewPreviewRetention: "8d",
      firstCutPlannerTempDir: "/bot/first-cut",
      firstCutRetention: "1d",
      draftDir: "/bot/drafts",
      draftRetention: "14d",
      jobStoreFile: "/bot/jobs.json",
      jobRetention: "30d",
      editSessionDir: "/bot/edit-sessions",
      editSessionRetention: "31d",
    })
  })

  it("keeps dry-run as the default command mode", () => {
    const resolved = resolveBotCleanupCommandOptions({}, {})

    expect(resolved.dryRun).toBe(true)
    expect(resolved.delete).toBeUndefined()
  })

  it("rejects ambiguous dry-run and delete config", () => {
    expect(() => resolveBotCleanupCommandOptions({ dryRun: true }, { TIMELINE_BOT_CLEANUP_DELETE: "true" })).toThrow(
      "Use either --dry-run or --delete, not both",
    )
  })

  it("runs a dry-run cleanup from env configured paths", async () => {
    const mediaDir = path.join(tempDir, "media")
    const oldMedia = path.join(mediaDir, "old.mp4")
    await fs.mkdir(mediaDir, { recursive: true })
    await fs.writeFile(oldMedia, "old")
    await fs.utimes(oldMedia, new Date("2026-05-01T00:00:00.000Z"), new Date("2026-05-01T00:00:00.000Z"))

    const result = await runBotCleanup(
      {
        now: "2026-06-10T00:00:00.000Z",
      },
      {
        TIMELINE_BOT_MEDIA_DIR: mediaDir,
        TIMELINE_BOT_CLEANUP_MEDIA_RETENTION: "7d",
      },
    )

    expect(result.dryRun).toBe(true)
    expect(result.items[0]).toMatchObject({
      action: "would_delete",
      category: "media",
    })
    expect(serializeBotCleanupResult(result)).not.toContain("\n")
    await expect(fs.access(oldMedia).then(() => true)).resolves.toBe(true)
  })
})
