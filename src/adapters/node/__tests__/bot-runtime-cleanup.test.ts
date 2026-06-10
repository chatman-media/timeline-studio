import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { cleanupNodeBotRuntime, type NodeBotRuntimeCleanupResult } from "../bot-runtime-cleanup"

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = "2026-06-10T00:00:00.000Z"
const OLD = "2026-05-01T00:00:00.000Z"
const RECENT = "2026-06-09T00:00:00.000Z"

describe("cleanupNodeBotRuntime", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-runtime-cleanup-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("reports expired bot runtime artifacts in dry-run without deleting them", async () => {
    const fixture = await createRuntimeFixture(tempDir)

    const result = await cleanupNodeBotRuntime({
      dryRun: true,
      now: NOW,
      media: { directory: fixture.mediaDir, retentionMs: 7 * DAY_MS },
      drafts: { directory: fixture.draftDir, retentionMs: 14 * DAY_MS },
      jobStore: { filePath: fixture.jobStoreFile, retentionMs: 30 * DAY_MS },
      editSessions: { directory: fixture.editSessionDir, retentionMs: 30 * DAY_MS },
    })

    expect(result.ok).toBe(true)
    expect(result.summary.deleted).toBe(0)
    expect(itemFor(result, "old-media.mp4")?.action).toBe("would_delete")
    expect(itemFor(result, "draft-old")?.action).toBe("would_delete")
    expect(itemFor(result, "session-done")?.action).toBe("would_delete")
    expect(itemFor(result, "job-done")?.action).toBe("would_delete")
    expect(itemFor(result, "session-active")?.reason).toBe("active_edit_session")
    expect(itemFor(result, "job-running")?.reason).toBe("active_job")

    await expectExists(fixture.oldMediaFile, true)
    await expectExists(fixture.oldDraftFile, true)
    await expectExists(fixture.doneSessionFile, true)
    await expectJobIds(fixture.jobStoreFile, ["job-done", "job-running", "job-recent"])
  })

  it("deletes only expired artifacts and preserves active sessions and jobs", async () => {
    const fixture = await createRuntimeFixture(tempDir)

    const result = await cleanupNodeBotRuntime({
      dryRun: false,
      now: NOW,
      media: { directory: fixture.mediaDir, retentionMs: 7 * DAY_MS },
      drafts: { directory: fixture.draftDir, retentionMs: 14 * DAY_MS },
      jobStore: { filePath: fixture.jobStoreFile, retentionMs: 30 * DAY_MS },
      editSessions: { directory: fixture.editSessionDir, retentionMs: 30 * DAY_MS },
    })

    expect(result.ok).toBe(true)
    expect(itemFor(result, "old-media.mp4")?.action).toBe("deleted")
    expect(itemFor(result, "new-media.mp4")?.action).toBe("preserved")
    expect(itemFor(result, "session-active")?.reason).toBe("active_edit_session")
    expect(itemFor(result, "job-running")?.reason).toBe("active_job")

    await expectExists(fixture.oldMediaFile, false)
    await expectExists(fixture.newMediaFile, true)
    await expectExists(fixture.oldDraftFile, false)
    await expectExists(fixture.recentDraftFile, true)
    await expectExists(fixture.doneSessionFile, false)
    await expectExists(fixture.activeSessionFile, true)
    await expectJobIds(fixture.jobStoreFile, ["job-running", "job-recent"])
  })
})

async function createRuntimeFixture(root: string) {
  const mediaDir = path.join(root, "media")
  const draftDir = path.join(root, "drafts")
  const editSessionDir = path.join(root, "edit-sessions")
  const jobStoreFile = path.join(root, "jobs.json")

  const oldMediaFile = path.join(mediaDir, "old-media.mp4")
  const newMediaFile = path.join(mediaDir, "new-media.mp4")
  const oldDraftFile = path.join(draftDir, "old-draft.json")
  const recentDraftFile = path.join(draftDir, "recent-draft.json")
  const doneSessionFile = path.join(editSessionDir, "done-session.json")
  const activeSessionFile = path.join(editSessionDir, "active-session.json")

  await writeFileWithMtime(oldMediaFile, "old media", OLD)
  await writeFileWithMtime(newMediaFile, "new media", RECENT)
  await writeJson(oldDraftFile, {
    id: "draft-old",
    workflow: { source: "telegram" },
    updatedAt: OLD,
  })
  await writeJson(recentDraftFile, {
    id: "draft-recent",
    workflow: { source: "telegram" },
    updatedAt: RECENT,
  })
  await writeJson(doneSessionFile, createEditSession("session-done", "done", OLD, { publishedAt: OLD }))
  await writeJson(activeSessionFile, createEditSession("session-active", "preview_ready", OLD))
  await writeJson(jobStoreFile, {
    jobs: [
      createJob("job-done", "done", OLD),
      createJob("job-running", "running", OLD),
      createJob("job-recent", "failed", RECENT),
    ],
    updatedAt: NOW,
  })

  return {
    mediaDir,
    draftDir,
    editSessionDir,
    jobStoreFile,
    oldMediaFile,
    newMediaFile,
    oldDraftFile,
    recentDraftFile,
    doneSessionFile,
    activeSessionFile,
  }
}

function createEditSession(id: string, status: string, updatedAt: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    source: "telegram",
    status,
    media: [],
    revisionCounter: 0,
    revisions: [],
    createdAt: updatedAt,
    updatedAt,
    ...extra,
  }
}

function createJob(id: string, status: string, updatedAt: string) {
  return {
    id,
    status,
    updateId: Number(id.replace(/\D/g, "")) || 1,
    createdAt: updatedAt,
    updatedAt,
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeFileWithMtime(filePath: string, content: string, mtime: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
  const timestamp = new Date(mtime)
  await fs.utimes(filePath, timestamp, timestamp)
}

function itemFor(result: NodeBotRuntimeCleanupResult, needle: string) {
  return result.items.find((item) => item.id === needle || item.path.includes(needle))
}

async function expectExists(filePath: string, expected: boolean): Promise<void> {
  await expect(
    fs
      .access(filePath)
      .then(() => true)
      .catch(() => false),
  ).resolves.toBe(expected)
}

async function expectJobIds(filePath: string, expectedIds: string[]): Promise<void> {
  const content = await fs.readFile(filePath, "utf-8")
  const state = JSON.parse(content) as { jobs: Array<{ id: string }> }
  expect(state.jobs.map((job) => job.id)).toEqual(expectedIds)
}
