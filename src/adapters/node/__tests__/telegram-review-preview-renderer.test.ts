import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { IRenderJobService } from "@timeline-studio/core/ports"
import type { BotEditRevision, BotEditSession, BotRenderJobRequest, BotRenderJobRunOptions } from "@timeline-studio/core/types"
import { NodeTelegramRenderJobReviewPreviewRenderer } from "../telegram-review-preview-renderer"

describe("NodeTelegramRenderJobReviewPreviewRenderer", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-review-preview-renderer-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("renders an inline project preview through the render job service", async () => {
    const artifact = {
      type: "file" as const,
      path: path.join(tempDir, "session-1-r1.mp4"),
      destination: "file" as const,
      mimeType: "video/mp4",
    }
    const run = vi.fn(async (_request: BotRenderJobRequest, _options?: BotRenderJobRunOptions) => ({
      job: {
        id: "preview-job-1",
        providerJobId: "rust-preview-job-1",
        status: "done" as const,
        progress: 100,
        request: _request,
        artifact,
        createdAt: "2026-06-09T14:00:00.000Z",
        updatedAt: "2026-06-09T14:00:01.000Z",
        events: [],
      },
      events: [],
    }))
    const renderer = new NodeTelegramRenderJobReviewPreviewRenderer(createRenderJob(run), {
      outputDir: tempDir,
      pollIntervalMs: 250,
      timeoutMs: 5000,
    })
    const projectSchema = { version: "1", timeline: { tracks: [] } }

    await expect(
      renderer.renderPreview({
        session: createSession(),
        revision: createRevision(),
        projectSchema,
        update: { update_id: 10 },
        payload: { message_id: 20, chat: { id: "chat-1" } },
      }),
    ).resolves.toEqual({
      ...artifact,
      metadata: {
        renderJobId: "preview-job-1",
        providerJobId: "rust-preview-job-1",
        renderJobStatus: "done",
        reviewSessionId: "edit:telegram:chat-1:user-1",
        reviewRevisionId: "revision-1",
        artifactPath: path.join(tempDir, "session-1-r1.mp4"),
      },
    })

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "bot",
        media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
        project: { type: "inline", schema: projectSchema },
        output: {
          format: "mp4",
          path: path.join(tempDir, "edit-telegram-chat-1-user-1-r1.mp4"),
          destination: "file",
        },
        params: {
          reviewSessionId: "edit:telegram:chat-1:user-1",
          reviewRevisionId: "revision-1",
          sourceMessageId: 20,
        },
      }),
      {
        pollIntervalMs: 250,
        timeoutMs: 5000,
      },
    )
  })

  it("fails when preview rendering does not produce an artifact", async () => {
    const run = vi.fn(async (request: BotRenderJobRequest) => ({
      job: {
        id: "preview-job-1",
        status: "done" as const,
        progress: 100,
        request,
        createdAt: "2026-06-09T14:00:00.000Z",
        updatedAt: "2026-06-09T14:00:01.000Z",
        events: [],
      },
      events: [],
    }))
    const renderer = new NodeTelegramRenderJobReviewPreviewRenderer(createRenderJob(run), {
      outputDir: tempDir,
    })

    await expect(
      renderer.renderPreview({
        session: createSession(),
        revision: createRevision(),
        projectSchema: { version: "1" },
        update: { update_id: 10 },
        payload: { message_id: 20 },
      }),
    ).rejects.toThrow("Preview render completed without an artifact")
  })

  it("fails with the render job error when preview rendering fails", async () => {
    const run = vi.fn(async (request: BotRenderJobRequest) => ({
      job: {
        id: "preview-job-1",
        status: "failed" as const,
        progress: 35,
        request,
        error: "render failed",
        createdAt: "2026-06-09T14:00:00.000Z",
        updatedAt: "2026-06-09T14:00:01.000Z",
        events: [],
      },
      events: [],
    }))
    const renderer = new NodeTelegramRenderJobReviewPreviewRenderer(createRenderJob(run), {
      outputDir: tempDir,
    })

    await expect(
      renderer.renderPreview({
        session: createSession(),
        revision: createRevision(),
        projectSchema: { version: "1" },
        update: { update_id: 10 },
        payload: { message_id: 20 },
      }),
    ).rejects.toThrow("render failed")
  })
})

function createRenderJob(run: IRenderJobService["run"]): IRenderJobService {
  return {
    run,
    getJob: vi.fn(async () => null),
    cancelJob: vi.fn(async () => false),
  }
}

function createSession(): BotEditSession {
  return {
    id: "edit:telegram:chat-1:user-1",
    source: "telegram",
    status: "editing",
    chatId: "chat-1",
    userId: "user-1",
    media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    revisionCounter: 1,
    revisions: [],
    createdAt: "2026-06-09T14:00:00.000Z",
    updatedAt: "2026-06-09T14:00:00.000Z",
  }
}

function createRevision(): BotEditRevision {
  return {
    id: "revision-1",
    index: 1,
    createdAt: "2026-06-09T14:00:00.000Z",
    updatedAt: "2026-06-09T14:00:00.000Z",
  }
}
