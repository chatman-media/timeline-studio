/**
 * Tests for Telegram bot worker command.
 */

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  botWorkerCommand,
  isFailedWorkerResult,
  readTelegramBotUpdate,
  resolveBotWorkerCommandOptions,
  runBotWorker,
  serializeBotWorkerResult,
} from "../bot-worker"

describe("bot-worker command", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-worker-command-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should have correct command shape", () => {
    expect(botWorkerCommand.name()).toBe("bot-worker")
    expect(botWorkerCommand.description()).toBe("Run a Telegram bot worker for bot-first workflows")
    expect(botWorkerCommand.options.some((option) => option.long === "--update-file")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--poll-once")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--poll")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--telegram-bot-token")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--allowed-chat-ids")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--allowed-user-ids")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--no-status-updates")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--status-chat-id")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--status-min-interval")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--status-min-progress-delta")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--offset-file")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--draft-dir")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--job-store-file")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--recover-stale-jobs")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--async-workflows")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--workflow-concurrency")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--workflow-queue-limit")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--max-batches")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--idle-delay")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--rust-render")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--edit-session-dir")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--ai-editor")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--ai-editor-model")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--review-preview-dir")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--default-destination")).toBe(true)
  })

  it("reads Telegram update JSON", async () => {
    const updatePath = path.join(tempDir, "update.json")
    await fs.writeFile(
      updatePath,
      JSON.stringify({
        update_id: 100,
        message: {
          message_id: 7,
          chat: { id: "chat-1" },
          text: "template=promo",
        },
      }),
    )

    await expect(readTelegramBotUpdate(updatePath)).resolves.toEqual({
      update_id: 100,
      message: {
        message_id: 7,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
  })

  it("rejects invalid Telegram update JSON", async () => {
    const updatePath = path.join(tempDir, "update.json")
    await fs.writeFile(updatePath, JSON.stringify({ message: {} }))

    await expect(readTelegramBotUpdate(updatePath)).rejects.toThrow(
      "Telegram update JSON must include numeric update_id",
    )
  })

  it("requires a job store file when stale job recovery is enabled", async () => {
    await expect(
      runBotWorker({ updateFile: path.join(tempDir, "update.json"), recoverStaleJobs: true }),
    ).rejects.toThrow("--recover-stale-jobs requires --job-store-file")
  })

  it("requires an AI editor key when production AI editing is explicitly enabled", async () => {
    await expect(
      runBotWorker({
        updateFile: path.join(tempDir, "update.json"),
        aiEditor: true,
      }),
    ).rejects.toThrow("--ai-editor requires")
  })

  it("serializes compact and pretty worker results", () => {
    const result = {
      skipped: true as const,
      reason: "Telegram update does not contain a supported message",
      updateId: 1,
      update: { update_id: 1 },
    }

    expect(serializeBotWorkerResult(result)).not.toContain("\n")
    expect(serializeBotWorkerResult(result, true)).toContain("\n")
  })

  it("treats failed polling update results as failed command results", () => {
    expect(
      isFailedWorkerResult({
        updates: [
          {
            skipped: false,
            failed: true,
            reason: "Telegram update handling failed",
            updateId: 1,
            update: { update_id: 1 },
            error: "Workflow failed",
          },
        ],
        nextOffset: 2,
      }),
    ).toBe(true)
  })

  it("does not treat queued polling update results as failed command results", () => {
    expect(
      isFailedWorkerResult({
        updates: [
          {
            skipped: false,
            queued: true,
            queueId: "telegram-update-1",
            reason: "Telegram bot workflow queued",
            updateId: 1,
            update: { update_id: 1 },
            payload: { text: "template=promo" },
          },
        ],
        nextOffset: 2,
      }),
    ).toBe(false)
  })

  it("does not treat duplicate workflow update results as failed command results", () => {
    expect(
      isFailedWorkerResult({
        skipped: true,
        reason: "Telegram bot workflow already handled",
        updateId: 1,
        update: { update_id: 1 },
        payload: { text: "template=promo" },
        queueId: "telegram-update-1",
        duplicateOf: "telegram-update-1",
        workflowJob: {
          id: "telegram-update-1",
          status: "running",
          updateId: 1,
          createdAt: "2026-06-08T08:00:00.000Z",
          updatedAt: "2026-06-08T08:00:00.000Z",
        },
      }),
    ).toBe(false)
  })

  it("treats rejected polling update results as failed command results", () => {
    expect(
      isFailedWorkerResult({
        updates: [
          {
            skipped: false,
            rejected: true,
            queueId: "telegram-update-1",
            reason: "Telegram bot workflow queue is full",
            updateId: 1,
            update: { update_id: 1 },
            payload: { text: "template=promo" },
          },
        ],
        nextOffset: 2,
      }),
    ).toBe(true)
  })

  it("treats queued polling completion failures as failed command results", () => {
    expect(
      isFailedWorkerResult({
        updates: [
          {
            skipped: false,
            queued: true,
            queueId: "telegram-update-1",
            reason: "Telegram bot workflow queued",
            updateId: 1,
            update: { update_id: 1 },
            payload: { text: "template=promo" },
            completion: {
              ok: false,
              workflow: { source: "telegram" },
              errors: [
                {
                  code: "missing_input",
                  field: "workflow",
                  message: "Workflow requires input",
                  userMessage: "Send a video file, link, project, or choose a template.",
                },
              ],
            },
          },
        ],
        nextOffset: 2,
      }),
    ).toBe(true)
  })

  it("resolves bot worker defaults from environment variables", () => {
    const resolved = resolveBotWorkerCommandOptions(
      {},
      {
        TELEGRAM_BOT_TOKEN: "token-from-telegram-env",
        TIMELINE_BOT_TELEGRAM_TOKEN: "token-from-timeline-env",
        TIMELINE_BOT_ALLOWED_CHAT_IDS: "chat-1,chat-2",
        TIMELINE_BOT_ALLOWED_USER_IDS: "user-1 user-2",
        TIMELINE_BOT_STATUS_CHAT_ID: "chat-1",
        TIMELINE_BOT_STATUS_MIN_INTERVAL: "30000",
        TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA: "10",
        TIMELINE_BOT_OFFSET_FILE: ".tmp/bot-offset.json",
        TIMELINE_BOT_DRAFT_DIR: ".tmp/bot-drafts",
        TIMELINE_BOT_JOB_STORE_FILE: ".tmp/bot-jobs.json",
        TIMELINE_BOT_RECOVER_STALE_JOBS: "true",
        TIMELINE_BOT_ASYNC_WORKFLOWS: "true",
        TIMELINE_BOT_WORKFLOW_CONCURRENCY: "2",
        TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT: "10",
        TIMELINE_BOT_MEDIA_DIR: ".tmp/media",
        TIMELINE_BOT_POLL_LIMIT: "10",
        TIMELINE_BOT_POLL_TIMEOUT: "20",
        TIMELINE_BOT_IDLE_DELAY: "30",
        TIMELINE_BOT_MAX_BATCHES: "2",
        TIMELINE_BOT_RENDER_POLL_INTERVAL: "40",
        TIMELINE_BOT_RENDER_TIMEOUT: "50",
        TIMELINE_BOT_DEFAULT_DESTINATION: "telegram",
        TIMELINE_BOT_DEFAULT_OUTPUT: ".tmp/out.mp4",
        TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA: "true",
        TIMELINE_BOT_RUST_RENDER: "1",
        TIMELINE_BOT_RUST_RENDER_COMMAND: "timeline-render",
        TIMELINE_BOT_RUST_RENDER_KIND: "timeline-render",
        TIMELINE_BOT_RUST_PUBLISH: "1",
        TIMELINE_BOT_RUST_PUBLISH_COMMAND: "timeline",
        TIMELINE_BOT_EDIT_SESSION_DIR: ".tmp/edit-sessions",
        TIMELINE_BOT_AI_EDITOR: "true",
        TIMELINE_BOT_AI_EDITOR_API_KEY: "editor-key",
        TIMELINE_BOT_AI_EDITOR_API_URL: "https://llm.example/v1",
        TIMELINE_BOT_AI_EDITOR_PROVIDER: "openai-compatible",
        TIMELINE_BOT_AI_EDITOR_MODEL: "editor-model",
        TIMELINE_BOT_AI_EDITOR_TEMPERATURE: "0.1",
        TIMELINE_BOT_AI_EDITOR_MAX_TOKENS: "2048",
        TIMELINE_BOT_REVIEW_PREVIEW_DIR: ".tmp/review-previews",
      },
    )

    expect(resolved).toMatchObject({
      telegramBotToken: "token-from-timeline-env",
      allowedChatIds: "chat-1,chat-2",
      allowedUserIds: "user-1 user-2",
      statusChatId: "chat-1",
      statusMinInterval: "30000",
      statusMinProgressDelta: "10",
      offsetFile: ".tmp/bot-offset.json",
      draftDir: ".tmp/bot-drafts",
      jobStoreFile: ".tmp/bot-jobs.json",
      recoverStaleJobs: true,
      asyncWorkflows: true,
      workflowConcurrency: "2",
      workflowQueueLimit: "10",
      mediaDir: ".tmp/media",
      pollLimit: "10",
      pollTimeout: "20",
      idleDelay: "30",
      maxBatches: "2",
      pollInterval: "40",
      timeout: "50",
      defaultDestination: "telegram",
      defaultOutput: ".tmp/out.mp4",
      downloadRemoteMedia: true,
      rustRender: true,
      rustRenderCommand: "timeline-render",
      rustRenderKind: "timeline-render",
      rustPublish: true,
      rustPublishCommand: "timeline",
      editSessionDir: ".tmp/edit-sessions",
      aiEditor: true,
      aiEditorApiKey: "editor-key",
      aiEditorApiUrl: "https://llm.example/v1",
      aiEditorProvider: "openai-compatible",
      aiEditorModel: "editor-model",
      aiEditorTemperature: "0.1",
      aiEditorMaxTokens: "2048",
      reviewPreviewDir: ".tmp/review-previews",
    })
  })

  it("keeps explicit bot worker CLI options above environment defaults", () => {
    const resolved = resolveBotWorkerCommandOptions(
      {
        telegramBotToken: "token-from-cli",
        allowedChatIds: "cli-chat",
        allowedUserIds: "cli-user",
        statusMinInterval: "15000",
        statusMinProgressDelta: "5",
        offsetFile: ".tmp/cli-offset.json",
        draftDir: ".tmp/cli-drafts",
        jobStoreFile: ".tmp/cli-jobs.json",
        recoverStaleJobs: false,
        asyncWorkflows: false,
        workflowConcurrency: "3",
        workflowQueueLimit: "5",
        defaultDestination: "file",
        rustRender: false,
        rustPublish: false,
        downloadRemoteMedia: false,
        editSessionDir: ".tmp/cli-edit-sessions",
        aiEditor: true,
        aiEditorApiKey: "cli-editor-key",
        aiEditorModel: "cli-editor-model",
        reviewPreviewDir: ".tmp/cli-review-previews",
      },
      {
        TIMELINE_BOT_TELEGRAM_TOKEN: "token-from-env",
        TIMELINE_BOT_ALLOWED_CHAT_IDS: "env-chat",
        TIMELINE_BOT_ALLOWED_USER_IDS: "env-user",
        TIMELINE_BOT_STATUS_MIN_INTERVAL: "30000",
        TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA: "10",
        TIMELINE_BOT_OFFSET_FILE: ".tmp/env-offset.json",
        TIMELINE_BOT_DRAFT_DIR: ".tmp/env-drafts",
        TIMELINE_BOT_JOB_STORE_FILE: ".tmp/env-jobs.json",
        TIMELINE_BOT_RECOVER_STALE_JOBS: "true",
        TIMELINE_BOT_ASYNC_WORKFLOWS: "true",
        TIMELINE_BOT_WORKFLOW_CONCURRENCY: "1",
        TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT: "10",
        TIMELINE_BOT_DEFAULT_DESTINATION: "telegram",
        TIMELINE_BOT_RUST_RENDER: "true",
        TIMELINE_BOT_RUST_PUBLISH: "true",
        TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA: "true",
        TIMELINE_BOT_EDIT_SESSION_DIR: ".tmp/env-edit-sessions",
        TIMELINE_BOT_AI_EDITOR: "false",
        TIMELINE_BOT_AI_EDITOR_API_KEY: "env-editor-key",
        TIMELINE_BOT_AI_EDITOR_MODEL: "env-editor-model",
        TIMELINE_BOT_REVIEW_PREVIEW_DIR: ".tmp/env-review-previews",
      },
    )

    expect(resolved).toMatchObject({
      telegramBotToken: "token-from-cli",
      allowedChatIds: "cli-chat",
      allowedUserIds: "cli-user",
      statusMinInterval: "15000",
      statusMinProgressDelta: "5",
      offsetFile: ".tmp/cli-offset.json",
      draftDir: ".tmp/cli-drafts",
      jobStoreFile: ".tmp/cli-jobs.json",
      recoverStaleJobs: false,
      asyncWorkflows: false,
      workflowConcurrency: "3",
      workflowQueueLimit: "5",
      defaultDestination: "file",
      rustRender: false,
      rustPublish: false,
      downloadRemoteMedia: false,
      editSessionDir: ".tmp/cli-edit-sessions",
      aiEditor: true,
      aiEditorApiKey: "cli-editor-key",
      aiEditorModel: "cli-editor-model",
      reviewPreviewDir: ".tmp/cli-review-previews",
    })
  })
})
