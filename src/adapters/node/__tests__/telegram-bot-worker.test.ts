import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BotWorkflowDraft, BotWorkflowRunResult } from "@/core/types"
import type { NodeBotWorkflowService } from "../bot-workflow"
import { NodeTelegramBotFileWorkflowJobStore, NodeTelegramBotInMemoryWorkflowJobStore } from "../telegram-bot-job-store"
import {
  createTelegramLikePayloadFromUpdate,
  defaultTelegramBotCommandText,
  defaultTelegramBotDraftText,
  defaultTelegramBotJobCancelText,
  defaultTelegramBotJobStatusText,
  defaultTelegramBotQueueRejectedText,
  defaultTelegramBotQueueText,
  defaultTelegramBotUpdateErrorText,
  NodeTelegramBotApiClient,
  NodeTelegramBotFileOffsetStore,
  NodeTelegramBotInMemoryWorkflowQueue,
  NodeTelegramBotWorker,
  parseTelegramBotCancelCommandTarget,
  parseTelegramBotCommand,
  parseTelegramBotDraftCommand,
  type TelegramBotUpdate,
} from "../telegram-bot-worker"

const failedResult: BotWorkflowRunResult = {
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
}

const completedResult: BotWorkflowRunResult = {
  ok: true,
  workflow: { source: "telegram" },
  renderJob: { source: "bot", output: { format: "mp4" } },
  result: {
    job: {
      id: "job-1",
      status: "done",
      progress: 1,
      request: { source: "bot", output: { format: "mp4" } },
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
      events: [],
    },
    events: [],
  },
  warnings: [],
}

const cancelledResult: BotWorkflowRunResult = {
  ok: true,
  workflow: { source: "telegram" },
  renderJob: { source: "bot", output: { format: "mp4" } },
  result: {
    job: {
      id: "job-cancelled-1",
      status: "cancelled",
      progress: 25,
      request: { source: "bot", output: { format: "mp4" } },
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:01.000Z",
      events: [],
    },
    events: [],
  },
  warnings: [],
}

function createWorkflowService(result: BotWorkflowRunResult = failedResult) {
  const runTelegramLikePayload = vi.fn(async () => result)
  const runWorkflow = vi.fn(async () => result)
  const cancelRenderJob = vi.fn(async () => true)

  return {
    service: {
      runWorkflow,
      runTelegramLikePayload,
      cancelRenderJob,
    } as unknown as NodeBotWorkflowService,
    runWorkflow,
    runTelegramLikePayload,
    cancelRenderJob,
  }
}

describe("Telegram bot worker", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-bot-worker-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("converts Telegram updates into Telegram-like workflow payloads", () => {
    const payload = createTelegramLikePayloadFromUpdate({
      update_id: 10,
      message: {
        message_id: 7,
        chat: { id: 42 },
        from: { id: "user-1" },
        caption: "template=promo",
        video: {
          file_id: "telegram-file-id",
          file_unique_id: "unique-file-id",
          file_name: "clip.mp4",
          mime_type: "video/mp4",
        },
      },
    })

    expect(payload).toEqual({
      chat: { id: 42 },
      from: { id: "user-1" },
      message_id: 7,
      caption: "template=promo",
      video: {
        file_id: "telegram-file-id",
        file_unique_id: "unique-file-id",
        file_name: "clip.mp4",
        mime_type: "video/mp4",
      },
    })
  })

  it("handles supported updates through the bot workflow service", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowOptions: {
        intake: { defaultDestination: "telegram" },
      },
      onResult,
    })
    const update: TelegramBotUpdate = {
      update_id: 11,
      message: {
        message_id: "message-1",
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    }

    const result = await worker.handleUpdate(update, {
      workflowOptions: {
        render: { timeoutMs: 10 },
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      updateId: 11,
      result: failedResult,
    })
    expect(runTelegramLikePayload).toHaveBeenCalledWith(
      {
        chat: { id: "chat-1" },
        message_id: "message-1",
        text: "template=promo",
      },
      {
        intake: { defaultDestination: "telegram" },
        render: { timeoutMs: 10 },
      },
    )
    expect(onResult).toHaveBeenCalledWith(result)
  })

  it("queues workflow runs without waiting for render completion", async () => {
    let resolveWorkflow!: () => void
    const runTelegramLikePayload = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const queueResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "queue-message-1" })),
    }
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowQueue, queueResponder, onResult })

    const update = {
      update_id: 16,
      message: {
        message_id: 12,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    }
    const result = await worker.handleUpdate(update)
    const responseText = defaultTelegramBotQueueText({
      queueId: "telegram-update-16",
      update,
      payload: {
        chat: { id: "chat-1" },
        message_id: 12,
        text: "template=promo",
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      queued: true,
      queueId: "telegram-update-16",
      reason: "Telegram bot workflow queued",
      updateId: 16,
      responseText,
    })
    expect(queueResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: responseText,
      replyToMessageId: "12",
      metadata: {
        queueId: "telegram-update-16",
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
    expect(onResult).toHaveBeenCalledWith(result)

    resolveWorkflow()
    await workflowQueue.drain()

    expect(result).toMatchObject({
      completion: completedResult,
    })
    expect(onResult).toHaveBeenLastCalledWith({
      skipped: false,
      updateId: 16,
      update: {
        update_id: 16,
        message: {
          message_id: 12,
          chat: { id: "chat-1" },
          text: "template=promo",
        },
      },
      payload: {
        chat: { id: "chat-1" },
        message_id: 12,
        text: "template=promo",
      },
      result: completedResult,
    })
  })

  it("does not let queued acknowledgement failures abort workflow queueing", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const queueResponder = {
      sendMessage: vi.fn(async () => {
        throw new Error("Telegram queue ack failed")
      }),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowQueue, queueResponder })

    const result = await worker.handleUpdate({
      update_id: 18,
      message: {
        message_id: 14,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
    await workflowQueue.drain()

    expect(result).toMatchObject({
      skipped: false,
      queued: true,
      queueId: "telegram-update-18",
      responseError: "Telegram queue ack failed",
      completion: completedResult,
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
  })

  it("rejects queued workflows when the pending queue is full", async () => {
    let resolveWorkflow!: () => void
    const runTelegramLikePayload = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue({ maxPending: 0 })
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    const queueResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "queue-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowQueue, workflowJobStore, queueResponder })

    const first = await worker.handleUpdate({
      update_id: 19,
      message: {
        message_id: 15,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
    const secondUpdate = {
      update_id: 20,
      message: {
        message_id: 16,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    }
    const second = await worker.handleUpdate(secondUpdate)
    const responseText = defaultTelegramBotQueueRejectedText({
      queueId: "telegram-update-20",
      reason: "Telegram bot workflow queue is full",
      update: secondUpdate,
      payload: {
        chat: { id: "chat-1" },
        message_id: 16,
        text: "template=promo",
      },
    })

    expect(first).toMatchObject({
      skipped: false,
      queued: true,
      queueId: "telegram-update-19",
    })
    expect(second).toMatchObject({
      skipped: false,
      rejected: true,
      queueId: "telegram-update-20",
      reason: "Telegram bot workflow queue is full",
      responseText,
    })
    expect(queueResponder.sendMessage).toHaveBeenLastCalledWith({
      chatId: "chat-1",
      text: responseText,
      replyToMessageId: "16",
      metadata: {
        queueId: "telegram-update-20",
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
    await expect(workflowJobStore.readJob("telegram-update-20")).resolves.toMatchObject({
      id: "telegram-update-20",
      status: "rejected",
      reason: "Telegram bot workflow queue is full",
    })

    resolveWorkflow()
    await workflowQueue.drain()
  })

  it("does not let queue rejection response failures abort rejection handling", async () => {
    let resolveWorkflow!: () => void
    const runTelegramLikePayload = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue({ maxPending: 0 })
    const queueResponder = {
      sendMessage: vi
        .fn()
        .mockResolvedValueOnce({ messageId: "queue-message-1" })
        .mockRejectedValueOnce(new Error("Telegram busy response failed")),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowQueue, queueResponder })

    await worker.handleUpdate({
      update_id: 26,
      message: {
        message_id: 17,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
    const rejected = await worker.handleUpdate({
      update_id: 27,
      message: {
        message_id: 18,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })

    expect(rejected).toMatchObject({
      skipped: false,
      rejected: true,
      queueId: "telegram-update-27",
      responseError: "Telegram busy response failed",
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()

    resolveWorkflow()
    await workflowQueue.drain()
  })

  it("turns queued workflow failures into update error results", async () => {
    const runTelegramLikePayload = vi.fn(async () => {
      throw new Error("Queued render failed")
    })
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const errorResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "error-message-1" })),
    }
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowQueue, errorResponder, onResult })

    const result = await worker.handleUpdate({
      update_id: 17,
      message: {
        message_id: 13,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
    await workflowQueue.drain()

    expect(result).toMatchObject({
      skipped: false,
      queued: true,
      queueId: "telegram-update-17",
      error: "Queued render failed",
    })
    expect(errorResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: defaultTelegramBotUpdateErrorText(),
      replyToMessageId: "13",
      metadata: {
        error: true,
        source: "telegram-bot-worker",
        updateId: 17,
      },
    })
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({
        skipped: false,
        failed: true,
        updateId: 17,
        error: "Queued render failed",
      }),
    )
  })

  it("routes help commands to a command responder without running workflow", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "help-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      commandResponder,
      commandFormatter: ({ command }) => `Handled ${command}`,
    })
    const update: TelegramBotUpdate = {
      update_id: 13,
      message: {
        message_id: 9,
        chat: { id: "chat-1" },
        text: "/help",
      },
    }

    const result = await worker.handleUpdate(update)

    expect(result).toMatchObject({
      skipped: true,
      reason: "Telegram bot command handled",
      command: "help",
      responseText: "Handled help",
    })
    expect(commandResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: "Handled help",
      replyToMessageId: "9",
      metadata: {
        command: "help",
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("routes start commands through Bot API when a bot token is configured", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { ok: true, result: { message_id: 10 } }
      },
    }))
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      botToken: "token-1",
      fetch: fetchMock,
    })

    const result = await worker.handleUpdate({
      update_id: 14,
      message: {
        message_id: 10,
        chat: { id: 42 },
        text: "/start@TimelineStudioBot",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "start",
      responseText: defaultTelegramBotCommandText(),
    })
    expect(fetchMock).toHaveBeenCalledWith("https://api.telegram.org/bottoken-1/sendMessage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: "42",
        text: defaultTelegramBotCommandText(),
        reply_to_message_id: 10,
      }),
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("routes status commands from persisted workflow job state", async () => {
    let resolveWorkflow!: () => void
    const runTelegramLikePayload = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    const queueResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "queue-message-1" })),
    }
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "status-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowQueue,
      workflowJobStore,
      queueResponder,
      commandResponder,
      now: () => "2026-06-08T08:00:00.000Z",
    })

    await worker.handleUpdate({
      update_id: 28,
      message: {
        message_id: 19,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })

    await vi.waitFor(async () => {
      expect((await workflowJobStore.readJob("telegram-update-28"))?.status).toBe("running")
    })

    const statusUpdate = {
      update_id: 29,
      message: {
        message_id: 20,
        chat: { id: "chat-1" },
        text: "/status",
      },
    }
    const runningRecord = await workflowJobStore.readJob("telegram-update-28")
    if (!runningRecord) throw new Error("Expected workflow job record")
    const runningText = defaultTelegramBotJobStatusText({
      jobs: [runningRecord],
      update: statusUpdate,
      payload: {
        chat: { id: "chat-1" },
        message_id: 20,
        text: "/status",
      },
    })
    const status = await worker.handleUpdate(statusUpdate)

    expect(status).toMatchObject({
      skipped: true,
      command: "status",
      responseText: runningText,
    })
    expect(commandResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: runningText,
      replyToMessageId: "20",
      metadata: {
        command: "status",
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()

    resolveWorkflow()
    await workflowQueue.drain()

    await expect(workflowJobStore.readJob("telegram-update-28")).resolves.toMatchObject({
      id: "telegram-update-28",
      status: "done",
      renderJobId: "job-1",
      renderJobStatus: "done",
    })
  })

  it("cancels pending queued workflows by queue id", async () => {
    let resolveWorkflow!: () => void
    const runTelegramLikePayload = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    const queueResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "queue-message-1" })),
    }
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "cancel-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowQueue,
      workflowJobStore,
      queueResponder,
      commandResponder,
      now: () => "2026-06-08T08:00:00.000Z",
    })

    await worker.handleUpdate({
      update_id: 30,
      message: {
        message_id: 21,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
    await worker.handleUpdate({
      update_id: 31,
      message: {
        message_id: 22,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()

    const cancelUpdate = {
      update_id: 32,
      message: {
        message_id: 23,
        chat: { id: "chat-1" },
        text: "/cancel telegram-update-31",
      },
    }
    const responseText = defaultTelegramBotJobCancelText({
      queueId: "telegram-update-31",
      cancellation: { id: "telegram-update-31", status: "cancelled" },
      update: cancelUpdate,
      payload: {
        chat: { id: "chat-1" },
        message_id: 23,
        text: "/cancel telegram-update-31",
      },
    })
    const cancelled = await worker.handleUpdate(cancelUpdate)

    expect(cancelled).toMatchObject({
      skipped: true,
      command: "cancel",
      queueId: "telegram-update-31",
      cancellation: {
        id: "telegram-update-31",
        status: "cancelled",
      },
      responseText,
    })
    expect(commandResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: responseText,
      replyToMessageId: "23",
      metadata: {
        command: "cancel",
        source: "telegram-bot-worker",
      },
    })
    await expect(workflowJobStore.readJob("telegram-update-31")).resolves.toMatchObject({
      id: "telegram-update-31",
      status: "cancelled",
      reason: "Telegram bot workflow cancelled by user",
    })

    resolveWorkflow()
    await workflowQueue.drain()

    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
  })

  it("does not cancel queued workflows from another chat", async () => {
    const { service } = createWorkflowService(completedResult)
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    await workflowJobStore.writeJob({
      id: "telegram-update-33",
      status: "queued",
      updateId: 33,
      chatId: "chat-1",
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    const workflowQueue = {
      enqueue: vi.fn(),
      cancel: vi.fn(async () => ({ id: "telegram-update-33", status: "cancelled" as const })),
    }
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "cancel-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowQueue,
      workflowJobStore,
      commandResponder,
    })

    const result = await worker.handleUpdate({
      update_id: 34,
      message: {
        message_id: 24,
        chat: { id: "chat-2" },
        text: "/cancel telegram-update-33",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "cancel",
      queueId: "telegram-update-33",
      cancellation: {
        id: "telegram-update-33",
        status: "not_found",
        reason: "Queued workflow job was not found for this chat.",
      },
    })
    expect(workflowQueue.cancel).not.toHaveBeenCalled()
    await expect(workflowJobStore.readJob("telegram-update-33")).resolves.toMatchObject({
      id: "telegram-update-33",
      status: "queued",
    })
  })

  it("cancels running workflow jobs when render job id is tracked", async () => {
    let resolveWorkflow!: () => void
    const cancelRenderJob = vi.fn(async () => true)
    const runTelegramLikePayload = vi.fn(async (_payload, options) => {
      await options?.render?.eventSinks?.[0]?.publish(
        {
          jobId: "render-job-35",
          sequence: 0,
          status: "rendering",
          progress: 25,
          timestamp: "2026-06-08T08:00:01.000Z",
        },
        {
          jobId: "render-job-35",
          status: "rendering",
          progress: 25,
          createdAt: "2026-06-08T08:00:00.000Z",
          updatedAt: "2026-06-08T08:00:01.000Z",
          eventCount: 1,
          canCancel: true,
          canRetry: false,
        },
      )
      return new Promise<BotWorkflowRunResult>((resolve) => {
        resolveWorkflow = () => resolve(cancelledResult)
      })
    })
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
      cancelRenderJob,
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "cancel-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowQueue,
      workflowJobStore,
      commandResponder,
      now: () => "2026-06-08T08:00:00.000Z",
    })

    await worker.handleUpdate({
      update_id: 35,
      message: {
        message_id: 25,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })

    await vi.waitFor(async () => {
      await expect(workflowJobStore.readJob("telegram-update-35")).resolves.toMatchObject({
        id: "telegram-update-35",
        status: "running",
        renderJobId: "render-job-35",
        renderJobStatus: "rendering",
      })
    })

    const result = await worker.handleUpdate({
      update_id: 36,
      message: {
        message_id: 26,
        chat: { id: "chat-1" },
        text: "/cancel telegram-update-35",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "cancel",
      queueId: "telegram-update-35",
      cancellation: {
        id: "telegram-update-35",
        status: "cancelled",
      },
    })
    expect(cancelRenderJob).toHaveBeenCalledWith("render-job-35")
    await expect(workflowJobStore.readJob("telegram-update-35")).resolves.toMatchObject({
      id: "telegram-update-35",
      status: "cancelled",
      reason: "Telegram bot running workflow cancelled by user",
      renderJobId: "render-job-35",
      renderJobStatus: "cancelled",
    })

    resolveWorkflow()
    await workflowQueue.drain()

    await expect(workflowJobStore.readJob("telegram-update-35")).resolves.toMatchObject({
      id: "telegram-update-35",
      status: "cancelled",
      reason: "Bot workflow render cancelled",
      renderJobId: "job-cancelled-1",
      renderJobStatus: "cancelled",
    })
  })

  it("does not cancel running workflow jobs before render job id is tracked", async () => {
    const { service } = createWorkflowService(completedResult)
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    await workflowJobStore.writeJob({
      id: "telegram-update-37",
      status: "running",
      updateId: 37,
      chatId: "chat-1",
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    const workflowQueue = {
      enqueue: vi.fn(),
      cancel: vi.fn(async () => ({ id: "telegram-update-37", status: "cancelled" as const })),
    }
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "cancel-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowQueue,
      workflowJobStore,
      commandResponder,
    })

    const result = await worker.handleUpdate({
      update_id: 38,
      message: {
        message_id: 27,
        chat: { id: "chat-1" },
        text: "/cancel telegram-update-37",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "cancel",
      queueId: "telegram-update-37",
      cancellation: {
        id: "telegram-update-37",
        status: "not_cancellable",
        reason: "Running render job id is not available yet.",
      },
    })
    expect(workflowQueue.cancel).not.toHaveBeenCalled()
    await expect(workflowJobStore.readJob("telegram-update-37")).resolves.toMatchObject({
      id: "telegram-update-37",
      status: "running",
    })
  })

  it("can disable command routing for command-like workflow messages", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      disableCommandRouting: true,
    })

    const result = await worker.handleUpdate({
      update_id: 15,
      message: {
        message_id: 11,
        chat: { id: "chat-1" },
        text: "/help template=promo",
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      updateId: 15,
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
  })

  it("skips updates without supported message payloads", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const worker = new NodeTelegramBotWorker({ workflow: service })

    const result = await worker.handleUpdate({ update_id: 12 })

    expect(result).toEqual({
      skipped: true,
      reason: "Telegram update does not contain a supported message",
      updateId: 12,
      update: { update_id: 12 },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("fetches Telegram updates through Bot API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          result: [{ update_id: 20, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } }],
        }
      },
    }))
    const client = new NodeTelegramBotApiClient("token-1", { fetch: fetchMock })

    await expect(
      client.getUpdates({
        offset: 19,
        limit: 10,
        timeoutSeconds: 25,
        allowedUpdates: ["message"],
      }),
    ).resolves.toEqual([{ update_id: 20, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } }])
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottoken-1/getUpdates?offset=19&limit=10&timeout=25&allowed_updates=%5B%22message%22%5D",
    )
  })

  it("parses supported Telegram bot commands", () => {
    expect(parseTelegramBotCommand("/start")).toBe("start")
    expect(parseTelegramBotCommand("/help@TimelineStudioBot more")).toBe("help")
    expect(parseTelegramBotCommand("/status")).toBe("status")
    expect(parseTelegramBotCommand("/cancel telegram-update-1")).toBe("cancel")
    expect(parseTelegramBotCancelCommandTarget("/cancel@TimelineStudioBot telegram-update-1")).toBe("telegram-update-1")
    expect(parseTelegramBotCommand("/render")).toBeNull()
    expect(parseTelegramBotCommand("/cancel")).toBeNull()
    expect(parseTelegramBotCommand("template=promo")).toBeNull()
    expect(parseTelegramBotDraftCommand("/render@TimelineStudioBot")).toBe("render")
    expect(parseTelegramBotDraftCommand("/cancel")).toBe("cancel")
  })

  it("stores Telegram updates as conversation drafts until render is requested", async () => {
    const { service, runWorkflow, runTelegramLikePayload } = createWorkflowService(completedResult)
    const draftStore = new Map<string, BotWorkflowDraft>()
    const store = {
      readDraft: vi.fn(async (id: string) => draftStore.get(id)),
      writeDraft: vi.fn(async (draft: BotWorkflowDraft) => {
        draftStore.set(draft.id, draft)
      }),
      deleteDraft: vi.fn(async (id: string) => {
        draftStore.delete(id)
      }),
    }
    const draftResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "draft-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      draftStore: store,
      draftResponder,
      now: () => "2026-06-08T08:00:00.000Z",
    })

    const stored = await worker.handleUpdate({
      update_id: 21,
      message: {
        message_id: 1,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        video: {
          file_id: "telegram-file-1",
          file_unique_id: "unique-file-1",
          file_name: "clip.mp4",
        },
      },
    })

    expect(stored).toMatchObject({
      skipped: true,
      reason: "Telegram bot draft updated",
      draftAction: "updated",
      draftId: "telegram:chat-1:user-1",
      responseText: defaultTelegramBotDraftText({
        action: "updated",
        draftId: "telegram:chat-1:user-1",
        payload: {},
        update: { update_id: 21 },
      }),
    })
    expect(draftResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: defaultTelegramBotDraftText({
        action: "updated",
        draftId: "telegram:chat-1:user-1",
        payload: {},
        update: { update_id: 21 },
      }),
      replyToMessageId: "1",
      metadata: {
        draftId: "telegram:chat-1:user-1",
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()

    const rendered = await worker.handleUpdate(
      {
        update_id: 22,
        message: {
          message_id: 2,
          chat: { id: "chat-1" },
          from: { id: "user-1" },
          text: "/render template=promo destination=telegram",
        },
      },
      {
        workflowOptions: {
          render: { timeoutMs: 10 },
        },
      },
    )

    expect(rendered).toMatchObject({
      skipped: false,
      updateId: 22,
      result: completedResult,
    })
    expect(runWorkflow).toHaveBeenCalledWith(
      {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        messageId: "2",
        text: "/render template=promo destination=telegram",
        media: [
          {
            id: "unique-file-1",
            type: "file",
            value: "telegram-file-1",
            name: "clip.mp4",
            metadata: {
              telegramFileId: "telegram-file-1",
              telegramFileUniqueId: "unique-file-1",
            },
          },
        ],
        raw: {
          chat: { id: "chat-1" },
          from: { id: "user-1" },
          message_id: 2,
          text: "/render template=promo destination=telegram",
        },
      },
      {
        render: { timeoutMs: 10 },
      },
    )
    expect(store.deleteDraft).toHaveBeenCalledWith("telegram:chat-1:user-1")
  })

  it("clears Telegram conversation drafts on cancel", async () => {
    const { service, runWorkflow } = createWorkflowService()
    const store = {
      readDraft: vi.fn(),
      writeDraft: vi.fn(),
      deleteDraft: vi.fn(async () => undefined),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, draftStore: store })

    const result = await worker.handleUpdate({
      update_id: 23,
      message: {
        message_id: 3,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/cancel",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reason: "Telegram bot draft cancelled",
      draftAction: "cancelled",
      draftId: "telegram:chat-1:user-1",
      responseText: defaultTelegramBotDraftText({
        action: "cancelled",
        draftId: "telegram:chat-1:user-1",
        payload: {},
        update: { update_id: 23 },
      }),
    })
    expect(store.deleteDraft).toHaveBeenCalledWith("telegram:chat-1:user-1")
    expect(store.writeDraft).not.toHaveBeenCalled()
    expect(runWorkflow).not.toHaveBeenCalled()
  })

  it("keeps Telegram conversation drafts when render validation fails", async () => {
    const { service, runWorkflow } = createWorkflowService(failedResult)
    const existingDraft = {
      id: "telegram:chat-1:user-1",
      updatedAt: "2026-06-08T08:00:00.000Z",
      workflow: {
        source: "telegram" as const,
        chatId: "chat-1",
        userId: "user-1",
        media: [{ type: "file" as const, value: "telegram-file-1" }],
      },
    }
    const store = {
      readDraft: vi.fn(async () => existingDraft),
      writeDraft: vi.fn(async () => undefined),
      deleteDraft: vi.fn(async () => undefined),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, draftStore: store })

    const result = await worker.handleUpdate({
      update_id: 24,
      message: {
        message_id: 4,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/render destination=instagram",
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      updateId: 24,
      result: failedResult,
    })
    expect(runWorkflow).toHaveBeenCalledOnce()
    expect(store.deleteDraft).not.toHaveBeenCalled()
    expect(store.writeDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "telegram:chat-1:user-1",
        workflow: expect.objectContaining({
          text: "/render destination=instagram",
          media: [{ type: "file", value: "telegram-file-1" }],
        }),
      }),
    )
  })

  it("clears queued Telegram conversation drafts after successful render completion", async () => {
    let resolveWorkflow!: () => void
    const runWorkflow = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow,
      runTelegramLikePayload: vi.fn(),
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const existingDraft = {
      id: "telegram:chat-1:user-1",
      updatedAt: "2026-06-08T08:00:00.000Z",
      workflow: {
        source: "telegram" as const,
        chatId: "chat-1",
        userId: "user-1",
        media: [{ type: "file" as const, value: "telegram-file-1" }],
      },
    }
    const store = {
      readDraft: vi.fn(async () => existingDraft),
      writeDraft: vi.fn(async () => undefined),
      deleteDraft: vi.fn(async () => undefined),
    }
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowQueue, draftStore: store, onResult })

    const result = await worker.handleUpdate({
      update_id: 25,
      message: {
        message_id: 5,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/render template=promo",
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      queued: true,
      queueId: "telegram-update-25",
      draftId: "telegram:chat-1:user-1",
    })
    expect(store.deleteDraft).not.toHaveBeenCalled()

    resolveWorkflow()
    await workflowQueue.drain()

    expect(result).toMatchObject({
      completion: completedResult,
    })
    expect(store.deleteDraft).toHaveBeenCalledWith("telegram:chat-1:user-1")
    expect(onResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        skipped: false,
        updateId: 25,
        result: completedResult,
      }),
    )
  })

  it("polls one update batch and returns the next offset", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const client = {
      getUpdates: vi.fn(async () => [
        { update_id: 30, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } },
        { update_id: 32 },
      ]),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, client })

    const result = await worker.pollOnce({ offset: 30, timeoutSeconds: 1 })

    expect(client.getUpdates).toHaveBeenCalledWith({ offset: 30, timeoutSeconds: 1 })
    expect(result.nextOffset).toBe(33)
    expect(result.updates).toHaveLength(2)
    expect(result.updates[0]).toMatchObject({ skipped: false, updateId: 30 })
    expect(result.updates[1]).toMatchObject({ skipped: true, updateId: 32 })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
  })

  it("isolates per-update polling errors, replies, and continues the batch", async () => {
    const runTelegramLikePayload = vi.fn(async (payload: { text?: string }) => {
      if (payload.text === "bad") {
        throw new Error("Media resolver failed")
      }

      return failedResult
    })
    const service = { runTelegramLikePayload } as unknown as NodeBotWorkflowService
    const client = {
      getUpdates: vi.fn(async () => [
        { update_id: 50, message: { message_id: 1, chat: { id: "chat-1" }, text: "bad" } },
        { update_id: 52, message: { message_id: 2, chat: { id: "chat-1" }, text: "template=promo" } },
      ]),
    }
    const errorResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "error-message-1" })),
    }
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, client, errorResponder, onResult })

    const result = await worker.pollOnce({ offset: 50, timeoutSeconds: 1 })

    expect(result.nextOffset).toBe(53)
    expect(result.updates).toHaveLength(2)
    expect(result.updates[0]).toMatchObject({
      skipped: false,
      failed: true,
      reason: "Telegram update handling failed",
      updateId: 50,
      error: "Media resolver failed",
      responseText: defaultTelegramBotUpdateErrorText(),
    })
    expect(result.updates[1]).toMatchObject({
      skipped: false,
      updateId: 52,
      result: failedResult,
    })
    expect(errorResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: defaultTelegramBotUpdateErrorText(),
      replyToMessageId: "1",
      metadata: {
        error: true,
        source: "telegram-bot-worker",
        updateId: 50,
      },
    })
    expect(runTelegramLikePayload).toHaveBeenCalledTimes(2)
    expect(onResult).toHaveBeenNthCalledWith(1, result.updates[0])
    expect(onResult).toHaveBeenNthCalledWith(2, result.updates[1])
  })

  it("does not let update error response failures abort polling", async () => {
    const runTelegramLikePayload = vi.fn(async () => {
      throw new Error("Workflow failed")
    })
    const service = { runTelegramLikePayload } as unknown as NodeBotWorkflowService
    const client = {
      getUpdates: vi.fn(async () => [
        { update_id: 60, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } },
      ]),
    }
    const errorResponder = {
      sendMessage: vi.fn(async () => {
        throw new Error("Telegram send failed")
      }),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, client, errorResponder })

    const result = await worker.pollOnce({ offset: 60 })

    expect(result.nextOffset).toBe(61)
    expect(result.updates[0]).toMatchObject({
      skipped: false,
      failed: true,
      updateId: 60,
      error: "Workflow failed",
      responseError: "Telegram send failed",
    })
  })

  it("does not hide Telegram getUpdates failures", async () => {
    const { service } = createWorkflowService()
    const client = {
      getUpdates: vi.fn(async () => {
        throw new Error("Telegram getUpdates failed")
      }),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, client })

    await expect(worker.pollOnce({ offset: 70 })).rejects.toThrow("Telegram getUpdates failed")
  })

  it("persists Telegram polling offsets in a file store", async () => {
    const store = new NodeTelegramBotFileOffsetStore(path.join(tempDir, "state", "offset.json"))

    await expect(store.readOffset()).resolves.toBeUndefined()
    await store.writeOffset(42)

    await expect(store.readOffset()).resolves.toBe(42)
    await expect(fs.readFile(path.join(tempDir, "state", "offset.json"), "utf-8")).resolves.toContain('"offset":42')
  })

  it("persists and filters Telegram workflow job status records in a file store", async () => {
    const storePath = path.join(tempDir, "state", "jobs.json")
    const store = new NodeTelegramBotFileWorkflowJobStore(storePath, { maxJobs: 2 })

    await store.writeJob({
      id: "telegram-update-1",
      status: "done",
      updateId: 1,
      chatId: "chat-1",
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    await store.writeJob({
      id: "telegram-update-2",
      status: "running",
      updateId: 2,
      chatId: "chat-2",
      createdAt: "2026-06-08T08:00:01.000Z",
      updatedAt: "2026-06-08T08:00:01.000Z",
    })
    await store.writeJob({
      id: "telegram-update-3",
      status: "failed",
      updateId: 3,
      chatId: "chat-1",
      error: "Render failed",
      createdAt: "2026-06-08T08:00:02.000Z",
      updatedAt: "2026-06-08T08:00:02.000Z",
    })

    await expect(store.listJobs({ chatId: "chat-1" })).resolves.toEqual([
      expect.objectContaining({
        id: "telegram-update-3",
        status: "failed",
        error: "Render failed",
      }),
    ])
    const reloaded = new NodeTelegramBotFileWorkflowJobStore(storePath)
    await expect(reloaded.readJob("telegram-update-3")).resolves.toMatchObject({
      id: "telegram-update-3",
      status: "failed",
    })
  })

  it("runs bounded polling batches from stored offset and writes the next offset", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const offsetStore = {
      readOffset: vi.fn(async () => 40),
      writeOffset: vi.fn(async () => undefined),
    }
    const client = {
      getUpdates: vi.fn(async (options) =>
        options?.offset === 40
          ? [{ update_id: 40, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } }]
          : [],
      ),
    }
    const sleep = vi.fn(async () => undefined)
    const onBatch = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, client })

    const result = await worker.runPolling({
      offsetStore,
      maxBatches: 3,
      timeoutSeconds: 1,
      idleDelayMs: 5,
      sleep,
      onBatch,
    })

    expect(offsetStore.readOffset).toHaveBeenCalledOnce()
    expect(client.getUpdates).toHaveBeenNthCalledWith(1, { offset: 40, timeoutSeconds: 1 })
    expect(client.getUpdates).toHaveBeenNthCalledWith(2, { offset: 41, timeoutSeconds: 1 })
    expect(client.getUpdates).toHaveBeenNthCalledWith(3, { offset: 41, timeoutSeconds: 1 })
    expect(offsetStore.writeOffset).toHaveBeenCalledWith(41)
    expect(offsetStore.writeOffset).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(5)
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledTimes(3)
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
    expect(result).toMatchObject({
      nextOffset: 41,
      stoppedReason: "max_batches",
      batches: [{ nextOffset: 41 }, { nextOffset: 41 }, { nextOffset: 41 }],
    })
  })
})
