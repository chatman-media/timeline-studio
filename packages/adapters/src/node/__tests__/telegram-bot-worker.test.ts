import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BotEditSession, BotEditSessionQuery, BotEditSessionStore } from "@timeline-studio/core"
import { createBotProjectSchemaFromRenderJob } from "@timeline-studio/core"
import type { IAIProjectEditor, IBotFeedbackTranscriber, IPublishService } from "@timeline-studio/core/ports"
import type { BotWorkflowDraft, BotWorkflowRunResult } from "@timeline-studio/core/types"
import { MockAIProjectEditor } from "../../mock/ai-project-editor"
import type { NodeBotWorkflowService } from "../bot-workflow"
import {
  NodeTelegramBotFileWorkflowJobStore,
  NodeTelegramBotInMemoryWorkflowJobStore,
  recoverStaleTelegramWorkflowJobs,
} from "../telegram-bot-job-store"
import {
  createTelegramLikePayloadFromUpdate,
  defaultTelegramBotAccessDeniedText,
  defaultTelegramBotCommandText,
  defaultTelegramBotDraftText,
  defaultTelegramBotJobCancelText,
  defaultTelegramBotJobRetryText,
  defaultTelegramBotJobStatusText,
  defaultTelegramBotQueueRejectedText,
  defaultTelegramBotQueueText,
  defaultTelegramBotUpdateErrorText,
  isTelegramBotAccessAllowed,
  NodeTelegramBotApiClient,
  NodeTelegramBotFileOffsetStore,
  NodeTelegramBotInMemoryWorkflowQueue,
  NodeTelegramBotWorker,
  parseTelegramBotCancelCommandTarget,
  parseTelegramBotCommand,
  parseTelegramBotDraftCommand,
  parseTelegramBotRetryCommandTarget,
  parseTelegramBotReviewCommand,
  parseTelegramBotReviseInstruction,
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

function createEditSessionStore(sessions: BotEditSession[] = []) {
  const records = new Map(sessions.map((session) => [session.id, session]))
  const store: BotEditSessionStore = {
    readSession: vi.fn(async (id: string) => records.get(id)),
    writeSession: vi.fn(async (session: BotEditSession) => {
      records.set(session.id, session)
    }),
    deleteSession: vi.fn(async (id: string) => {
      records.delete(id)
    }),
    listSessions: vi.fn(async (query: BotEditSessionQuery = {}) =>
      Array.from(records.values())
        .filter((session) => matchesTestEditSessionQuery(session, query))
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, query.limit ?? Number.POSITIVE_INFINITY),
    ),
    readCurrentSession: vi.fn(async (query: BotEditSessionQuery) => {
      const [session] = await store.listSessions({ ...query, activeOnly: query.activeOnly ?? true, limit: 1 })
      return session
    }),
  }
  return { store, records }
}

function matchesTestEditSessionQuery(session: BotEditSession, query: BotEditSessionQuery): boolean {
  if (query.source && session.source !== query.source) return false
  if (query.chatId && session.chatId !== query.chatId) return false
  if (query.userId && session.userId !== query.userId) return false
  if (query.activeOnly && ["cancelled", "done", "failed"].includes(session.status)) return false
  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status]
    if (!statuses.includes(session.status)) return false
  }
  return true
}

function createReviewSession(overrides: Partial<BotEditSession> = {}): BotEditSession {
  const project = createProjectSchema()
  const timestamp = "2026-06-08T08:00:00.000Z"
  const session: BotEditSession = {
    id: "edit:telegram:chat-1:user-1",
    source: "telegram",
    status: "preview_ready",
    chatId: "chat-1",
    userId: "user-1",
    goal: "make a promo",
    media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    currentProjectSchema: project,
    revisionCounter: 1,
    revisions: [
      {
        id: "edit:telegram:chat-1:user-1:revision:0",
        index: 0,
        projectSchema: project,
        instruction: "make a promo",
        summary: "Initial preview",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  return {
    ...session,
    ...overrides,
  }
}

function createProjectSchema() {
  const project = createBotProjectSchemaFromRenderJob({
    source: "bot",
    media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
    output: { format: "mp4", destination: "telegram" },
  })
  if (!project) throw new Error("Expected ProjectSchema")
  return project
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

  it("converts Telegram voice and video-note updates into workflow payloads", () => {
    const payload = createTelegramLikePayloadFromUpdate({
      update_id: 12,
      message: {
        message_id: 8,
        chat: { id: 42 },
        from: { id: "user-1" },
        voice: {
          file_id: "voice-file-id",
          file_unique_id: "unique-voice-1",
          mime_type: "audio/ogg",
          file_size: 4096,
          duration: 12,
        },
        video_note: {
          file_id: "video-note-file-id",
          file_unique_id: "unique-video-note-1",
          mime_type: "video/mp4",
          file_size: 8192,
          duration: 7,
          width: 384,
          height: 384,
        },
      },
    })

    expect(payload).toEqual({
      chat: { id: 42 },
      from: { id: "user-1" },
      message_id: 8,
      voice: {
        file_id: "voice-file-id",
        file_unique_id: "unique-voice-1",
        mime_type: "audio/ogg",
        file_size: 4096,
        duration: 12,
      },
      video_note: {
        file_id: "video-note-file-id",
        file_unique_id: "unique-video-note-1",
        mime_type: "video/mp4",
        file_size: 8192,
        duration: 7,
        width: 384,
        height: 384,
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

  const voiceIdeaUpdate = (): TelegramBotUpdate => ({
    update_id: 21,
    message: {
      message_id: "voice-idea-1",
      chat: { id: "chat-1" },
      from: { id: "user-1" },
      voice: {
        file_id: "voice-file-id",
        file_unique_id: "unique-voice-1",
        mime_type: "audio/ogg",
        file_size: 4096,
        duration: 9,
      },
    },
  })

  it("transcribes a fresh voice idea into the workflow goal when enabled (#326)", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const transcribeFeedback = vi.fn(async () => ({ text: "make a 30s promo about my cafe" }))
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      feedbackTranscriber: { transcribeFeedback } as unknown as IBotFeedbackTranscriber,
      transcribeVoiceIdeas: true,
    })

    const result = await worker.handleUpdate(voiceIdeaUpdate())

    expect(transcribeFeedback).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ skipped: false })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
    const [payloadArg] = runTelegramLikePayload.mock.calls[0]
    expect(payloadArg).toMatchObject({ text: "make a 30s promo about my cafe" })
  })

  it("does not transcribe voice ideas when the flag is off", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const transcribeFeedback = vi.fn(async () => ({ text: "should not run" }))
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      feedbackTranscriber: { transcribeFeedback } as unknown as IBotFeedbackTranscriber,
    })

    await worker.handleUpdate(voiceIdeaUpdate())

    expect(transcribeFeedback).not.toHaveBeenCalled()
    const [payloadArg] = runTelegramLikePayload.mock.calls[0]
    expect(payloadArg.text).toBeUndefined()
  })

  it("keeps the original message when voice-idea transcription fails", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const transcribeFeedback = vi.fn(async () => {
      throw new Error("whisper down")
    })
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      feedbackTranscriber: { transcribeFeedback } as unknown as IBotFeedbackTranscriber,
      transcribeVoiceIdeas: true,
    })

    const result = await worker.handleUpdate(voiceIdeaUpdate())

    expect(transcribeFeedback).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ skipped: false })
    const [payloadArg] = runTelegramLikePayload.mock.calls[0]
    expect(payloadArg.text).toBeUndefined()
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

  it("does not start duplicate workflow updates when a job record already exists", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    await workflowJobStore.writeJob({
      id: "telegram-update-23",
      status: "running",
      updateId: 23,
      chatId: "chat-1",
      messageId: "19",
      sourcePayload: { text: "template=promo" },
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, workflowJobStore, onResult })

    const update = {
      update_id: 23,
      message: {
        message_id: 19,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    }
    const result = await worker.handleUpdate(update)

    expect(result).toMatchObject({
      skipped: true,
      reason: "Telegram bot workflow already handled",
      updateId: 23,
      queueId: "telegram-update-23",
      duplicateOf: "telegram-update-23",
      workflowJob: {
        id: "telegram-update-23",
        status: "running",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
    expect(onResult).toHaveBeenCalledWith(result)
    await expect(workflowJobStore.readJob("telegram-update-23")).resolves.toMatchObject({
      id: "telegram-update-23",
      status: "running",
    })
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

  it("denies updates outside the configured Telegram access policy", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const accessDeniedResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "access-denied-message-1" })),
    }
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      accessPolicy: {
        allowedChatIds: ["chat-2"],
        allowedUserIds: ["user-2"],
      },
      accessDeniedResponder,
      onResult,
    })

    const result = await worker.handleUpdate({
      update_id: 45,
      message: {
        message_id: 31,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/help",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reason: "Telegram bot access denied",
      updateId: 45,
      accessDenied: true,
      responseText: defaultTelegramBotAccessDeniedText(),
    })
    expect(accessDeniedResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: defaultTelegramBotAccessDeniedText(),
      replyToMessageId: "31",
      metadata: {
        accessDenied: true,
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
    expect(onResult).toHaveBeenCalledWith(result)
  })

  it("allows updates from configured Telegram users", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      accessPolicy: {
        allowedUserIds: ["user-1"],
      },
    })

    const result = await worker.handleUpdate({
      update_id: 46,
      message: {
        message_id: 32,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "template=promo",
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      updateId: 46,
    })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
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

  it("routes preview-ready text feedback through the AI project editor", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession()
    const { store, records } = createEditSessionStore([session])
    const reviewResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "review-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      aiProjectEditor: new MockAIProjectEditor({ now: () => "2026-06-08T08:00:02.000Z" }),
      reviewResponder,
      now: () => "2026-06-08T08:00:02.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 47,
      message: {
        message_id: 33,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "make it shorter and add captions",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      editSessionId: session.id,
      feedbackText: "make it shorter and add captions",
      editRevision: {
        id: "edit:telegram:chat-1:user-1:revision:1",
        index: 1,
        instruction: "make it shorter and add captions",
        sourceMessageId: "33",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
    expect(records.get(session.id)).toMatchObject({
      status: "preview_ready",
      revisionCounter: 2,
      revisions: [
        expect.objectContaining({ index: 0 }),
        expect.objectContaining({
          index: 1,
          summary: "Applied instruction: make it shorter and add captions",
        }),
      ],
    })
    expect(reviewResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: expect.stringContaining("Applied revision"),
      replyToMessageId: "33",
      metadata: {
        review: true,
        source: "telegram-bot-worker",
      },
    })
  })

  it("records structured observability when AI edit validation fails", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession()
    const { store, records } = createEditSessionStore([session])
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      aiProjectEditor: new MockAIProjectEditor({
        edit: () => ({
          nextProject: { invalid: true } as never,
          summary: "",
          changedAreas: [],
          commands: [],
          diagnostics: [],
          metadata: {
            apiKey: "editor-secret",
          },
        }),
      }),
      now: () => "2026-06-08T08:00:11.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 63,
      message: {
        message_id: 49,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "make it shorter",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "failed",
      editSession: {
        status: "failed",
        failure: expect.stringContaining("version must be a non-empty string"),
        metadata: {
          observability: {
            lastError: {
              stage: "ai_edit_validation",
              sessionId: session.id,
              updateId: 63,
              sourceMessageId: "49",
              errors: expect.arrayContaining([
                expect.objectContaining({
                  code: "invalid_project",
                  field: "nextProject",
                  message: "version must be a non-empty string",
                }),
              ]),
            },
          },
        },
      },
    })
    expect(records.get(session.id)?.revisions).toHaveLength(1)
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
    expect(JSON.stringify(records.get(session.id))).not.toContain("editor-secret")
  })

  it("repairs invalid AI edit output before accepting a review revision", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession()
    const { store, records } = createEditSessionStore([session])
    const repairedProject = createProjectSchema()
    repairedProject.metadata.modified_at = "2026-06-08T08:00:12.000Z"
    const aiProjectEditor: IAIProjectEditor = {
      editProject: vi.fn(async () => ({
        nextProject: session.currentProjectSchema as never,
        summary: "",
        changedAreas: [],
        commands: [],
        diagnostics: [],
        metadata: {
          provider: "test-provider",
          model: "broken-model",
          promptId: "ai-project-editor/v1",
        },
      })),
      repairProjectEdit: vi.fn(async (context) => ({
        nextProject: repairedProject,
        summary: "Repaired title card edit.",
        changedAreas: ["project.metadata"],
        commands: [
          {
            type: "custom" as const,
            params: { instruction: context.request.userInstruction },
            rationale: "Repair produced a valid ProjectSchema after validation failed.",
          },
        ],
        diagnostics: [
          {
            level: "warning" as const,
            code: "repair_applied",
            message: "AI edit output was repaired after validation failed.",
          },
        ],
        metadata: {
          provider: "test-provider",
          model: "repair-model",
          promptId: "ai-project-editor/v1",
          repairAttempt: context.attempt,
        },
      })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      aiProjectEditor,
      aiProjectEditMaxRepairAttempts: 1,
      now: () => "2026-06-08T08:00:12.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 64,
      message: {
        message_id: 50,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "add a title card",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      editRevision: {
        index: 1,
        summary: "Repaired title card edit.",
        diagnostics: ["warning: repair_applied: AI edit output was repaired after validation failed."],
        metadata: {
          attempts: 2,
          editor: {
            provider: "test-provider",
            model: "repair-model",
            promptId: "ai-project-editor/v1",
            repairAttempt: 1,
          },
          observability: {
            attempts: 2,
            aiEditor: {
              provider: "test-provider",
              model: "repair-model",
              promptId: "ai-project-editor/v1",
              repairAttempt: 1,
            },
          },
        },
      },
    })
    expect(aiProjectEditor.repairProjectEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "missing_summary" }),
          expect.objectContaining({ code: "missing_commands" }),
        ]),
      }),
    )
    expect(records.get(session.id)).toMatchObject({
      status: "preview_ready",
      revisionCounter: 2,
      currentProjectSchema: repairedProject,
      revisions: [
        expect.objectContaining({ index: 0 }),
        expect.objectContaining({ index: 1, projectSchema: repairedProject }),
      ],
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("transcribes voice feedback before applying a preview-ready edit", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession()
    const { store, records } = createEditSessionStore([session])
    const feedbackTranscriber: IBotFeedbackTranscriber = {
      transcribeFeedback: vi.fn(async (request) => ({
        text: "add upbeat music",
        language: "en",
        provider: "openai" as const,
        kind: request.kind,
        media: request.media,
        segments: [],
        processingTime: 12,
      })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      aiProjectEditor: new MockAIProjectEditor(),
      feedbackTranscriber,
      now: () => "2026-06-08T08:00:03.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 48,
      message: {
        message_id: 34,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        voice: {
          file_id: "voice-file-1",
          file_unique_id: "voice-unique-1",
          mime_type: "audio/ogg",
          duration: 8,
        },
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      feedbackText: "add upbeat music",
    })
    expect(feedbackTranscriber.transcribeFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "voice",
        metadata: { sessionId: session.id },
      }),
    )
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
    expect(records.get(session.id)?.revisions.at(-1)).toMatchObject({
      instruction: "add upbeat music",
      sourceMessageId: "34",
    })
  })

  it("stores and sends preview artifacts for applied edit revisions", async () => {
    const { service } = createWorkflowService(completedResult)
    const session = createReviewSession()
    const { store, records } = createEditSessionStore([session])
    const previewRenderer = {
      renderPreview: vi.fn(async () => ({
        type: "file" as const,
        path: "/tmp/revision-1.mp4",
        destination: "file" as const,
        mimeType: "video/mp4",
        metadata: {
          renderJobId: "preview-job-1",
          providerJobId: "rust-preview-job-1",
          renderJobStatus: "done",
        },
      })),
    }
    const previewResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "fallback-message-1" })),
      sendVideo: vi.fn(async () => ({ messageId: "preview-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      aiProjectEditor: new MockAIProjectEditor(),
      previewRenderer,
      previewResponder,
      now: () => "2026-06-08T08:00:09.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 61,
      message: {
        message_id: 47,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "add title card",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      editRevision: {
        artifact: {
          path: "/tmp/revision-1.mp4",
        },
        metadata: {
          previewDelivery: {
            status: "sent",
            messageId: "preview-message-1",
            artifactPath: "/tmp/revision-1.mp4",
          },
          observability: {
            renderPreview: {
              renderJobId: "preview-job-1",
              providerJobId: "rust-preview-job-1",
              renderJobStatus: "done",
              artifactPath: "/tmp/revision-1.mp4",
            },
            previewDelivery: {
              status: "sent",
              messageId: "preview-message-1",
              artifactPath: "/tmp/revision-1.mp4",
            },
          },
        },
      },
    })
    expect(previewRenderer.renderPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({ id: session.id, status: "editing" }),
        revision: expect.objectContaining({ index: 1 }),
      }),
    )
    expect(previewResponder.sendVideo).toHaveBeenCalledWith({
      chatId: "chat-1",
      path: "/tmp/revision-1.mp4",
      caption: expect.stringContaining("Preview edit:telegram:chat-1:user-1:revision:1"),
      mimeType: "video/mp4",
      metadata: {
        sessionId: session.id,
        revisionId: "edit:telegram:chat-1:user-1:revision:1",
      },
    })
    const storedSession = records.get(session.id)
    expect(storedSession?.currentArtifact).toMatchObject({
      path: "/tmp/revision-1.mp4",
    })
    expect(storedSession?.revisions[0]).toMatchObject({ index: 0 })
    expect(storedSession?.revisions.at(-1)).toMatchObject({
      index: 1,
      artifact: {
        path: "/tmp/revision-1.mp4",
      },
      metadata: {
        previewDelivery: {
          status: "sent",
          messageId: "preview-message-1",
          artifactPath: "/tmp/revision-1.mp4",
        },
        observability: {
          renderPreview: {
            renderJobId: "preview-job-1",
            providerJobId: "rust-preview-job-1",
            renderJobStatus: "done",
            artifactPath: "/tmp/revision-1.mp4",
          },
          previewDelivery: {
            status: "sent",
            messageId: "preview-message-1",
            artifactPath: "/tmp/revision-1.mp4",
          },
        },
      },
    })
  })

  it("preserves preview artifacts when Telegram delivery falls back to a message", async () => {
    const { service } = createWorkflowService(completedResult)
    const session = createReviewSession()
    const { store, records } = createEditSessionStore([session])
    const previewResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "fallback-message-2" })),
      sendVideo: vi.fn(async () => {
        throw new Error("Telegram file too large")
      }),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      aiProjectEditor: new MockAIProjectEditor(),
      previewRenderer: {
        renderPreview: vi.fn(async () => ({
          type: "file" as const,
          path: "/tmp/revision-1-large.mp4",
          destination: "file" as const,
          mimeType: "video/mp4",
        })),
      },
      previewResponder,
      now: () => "2026-06-08T08:00:10.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 62,
      message: {
        message_id: 48,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "make it cinematic",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "feedback_applied",
      editRevision: {
        artifact: {
          path: "/tmp/revision-1-large.mp4",
        },
        metadata: {
          previewDelivery: {
            status: "failed",
            error: "Telegram file too large",
            artifactPath: "/tmp/revision-1-large.mp4",
          },
        },
      },
    })
    expect(previewResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: expect.stringContaining("/tmp/revision-1-large.mp4"),
      replyToMessageId: "48",
      metadata: {
        preview: true,
        sessionRevisionId: "edit:telegram:chat-1:user-1:revision:1",
        source: "telegram-bot-worker",
      },
    })
    expect(records.get(session.id)?.revisions.at(-1)).toMatchObject({
      artifact: {
        path: "/tmp/revision-1-large.mp4",
      },
    })
  })

  it("shows active edit session status and versions", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession()
    session.publishResult = {
      destination: "telegram",
      status: "failed",
      error: "missing auth",
      metadata: {
        provider: {
          apiKey: "publish-secret",
        },
      },
    }
    session.revisions = [
      {
        ...session.revisions[0],
        artifact: {
          type: "file",
          path: "/tmp/revision-0.mp4",
          destination: "file",
          metadata: {
            apiKey: "artifact-secret",
          },
        },
        metadata: {
          attempts: 2,
          editor: {
            provider: "openai-compatible",
            model: "gpt-4o-mini",
            promptId: "ai-project-editor/v1",
            apiKey: "editor-secret",
          },
          observability: {
            attempts: 2,
            aiEditor: {
              provider: "openai-compatible",
              model: "gpt-4o-mini",
              promptId: "ai-project-editor/v1",
              apiKey: "[redacted]",
            },
            renderPreview: {
              renderJobId: "preview-job-0",
              providerJobId: "rust-preview-job-0",
              artifactPath: "/tmp/revision-0.mp4",
            },
          },
        },
      },
    ]
    const { store } = createEditSessionStore([session])
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "status-message-2" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      commandResponder,
    })

    const status = await worker.handleUpdate({
      update_id: 49,
      message: {
        message_id: 35,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/status",
      },
    })
    const versions = await worker.handleUpdate({
      update_id: 50,
      message: {
        message_id: 36,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/versions",
      },
    })

    expect(status).toMatchObject({
      skipped: true,
      command: "status",
      reviewAction: "status",
      editSessionId: session.id,
    })
    expect(versions).toMatchObject({
      skipped: true,
      command: "versions",
      reviewAction: "versions",
      editSessionId: session.id,
    })
    expect(commandResponder.sendMessage).toHaveBeenNthCalledWith(1, {
      chatId: "chat-1",
      text: expect.stringContaining(`AI review session ${session.id}: preview_ready`),
      replyToMessageId: "35",
      metadata: {
        review: true,
        source: "telegram-bot-worker",
        command: "status",
      },
    })
    expect(commandResponder.sendMessage).toHaveBeenNthCalledWith(2, {
      chatId: "chat-1",
      text: expect.stringContaining("AI review revisions"),
      replyToMessageId: "36",
      metadata: {
        review: true,
        source: "telegram-bot-worker",
        command: "versions",
      },
    })
    const sendMessageCalls = commandResponder.sendMessage.mock.calls as unknown as Array<[{ text: string }]>
    const statusText = String(sendMessageCalls[0]?.[0].text)
    const versionsText = String(sendMessageCalls[1]?.[0].text)
    expect(statusText).toContain("Publish: failed to telegram")
    expect(statusText).toContain("editor=openai-compatible/gpt-4o-mini")
    expect(statusText).toContain("prompt=ai-project-editor/v1")
    expect(statusText).toContain("attempts=2")
    expect(statusText).toContain("render=preview-job-0")
    expect(versionsText).toContain("editor=openai-compatible/gpt-4o-mini")
    expect(versionsText).toContain("render=preview-job-0")
    expect(`${statusText}\n${versionsText}`).not.toContain("editor-secret")
    expect(`${statusText}\n${versionsText}`).not.toContain("artifact-secret")
    expect(`${statusText}\n${versionsText}`).not.toContain("publish-secret")
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("enables approval-gated preview rendering when edit sessions are configured", async () => {
    const project = createProjectSchema()
    const approvalResult: BotWorkflowRunResult = {
      ...completedResult,
      workflow: {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        text: "template=promo destination=youtube",
        media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
        output: { destination: "youtube" },
      },
      renderJob: {
        source: "bot",
        media: [{ type: "file", value: "/tmp/input.mp4", name: "input.mp4" }],
        project: { type: "inline", schema: project },
        output: { format: "mp4", destination: "file" },
      },
      result: {
        job: {
          ...completedResult.result.job,
          artifact: {
            type: "file",
            path: "/tmp/preview.mp4",
            destination: "file",
            mimeType: "video/mp4",
          },
        },
        events: [],
      },
      approvalGate: {
        enabled: true,
        previewDestination: "telegram",
        publishTarget: "youtube",
      },
    }
    const runTelegramLikePayload = vi.fn(async () => approvalResult)
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
      cancelRenderJob: vi.fn(),
    } as unknown as NodeBotWorkflowService
    const { store: editSessionStore, records } = createEditSessionStore()
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore,
    })

    await worker.handleUpdate({
      update_id: 56,
      message: {
        message_id: 42,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "template=promo destination=youtube",
      },
    })

    expect(runTelegramLikePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "template=promo destination=youtube",
      }),
      expect.objectContaining({
        approvalGate: {
          enabled: true,
          previewDestination: "telegram",
        },
      }),
    )
    expect(records.get("edit:telegram:chat-1:user-1")).toMatchObject({
      status: "preview_ready",
      currentProjectSchema: project,
      currentArtifact: {
        type: "file",
        path: "/tmp/preview.mp4",
        destination: "file",
      },
      previewDestination: "telegram",
      publishTarget: "youtube",
      revisionCounter: 1,
      revisions: [
        expect.objectContaining({
          index: 0,
          summary: "Initial preview",
          projectSchema: project,
        }),
      ],
    })
  })

  it("publishes an approved edit session once", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession({
      currentArtifact: {
        type: "file",
        path: "/tmp/revision-0.mp4",
        destination: "file",
        mimeType: "video/mp4",
      },
      publishTarget: "telegram",
    })
    const { store, records } = createEditSessionStore([session])
    const publishService: IPublishService = {
      canPublish: vi.fn(() => true),
      publish: vi.fn(async (request) => ({
        destination: request.destination,
        status: "done" as const,
        artifact: {
          ...request.artifact,
          destination: request.destination,
        },
        providerId: "telegram-message-1",
        url: "https://t.me/c/1/2",
        metadata: request.metadata,
      })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      publishService,
      now: () => "2026-06-08T08:00:06.000Z",
    })

    const approved = await worker.handleUpdate({
      update_id: 57,
      message: {
        message_id: 43,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/approve",
      },
    })
    const duplicate = await worker.handleUpdate({
      update_id: 58,
      message: {
        message_id: 44,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/approve",
      },
    })

    expect(approved).toMatchObject({
      skipped: true,
      command: "approve",
      reviewAction: "published",
      publishResult: {
        destination: "telegram",
        status: "done",
        providerId: "telegram-message-1",
      },
      editSession: {
        status: "done",
        approvedRevisionId: "edit:telegram:chat-1:user-1:revision:0",
        approvedMessageId: "43",
        publishedAt: "2026-06-08T08:00:06.000Z",
      },
    })
    expect(duplicate).toMatchObject({
      skipped: true,
      command: "approve",
      reviewAction: "not_found",
    })
    expect(publishService.publish).toHaveBeenCalledOnce()
    expect(publishService.publish).toHaveBeenCalledWith({
      destination: "telegram",
      artifact: {
        type: "file",
        path: "/tmp/revision-0.mp4",
        destination: "file",
        mimeType: "video/mp4",
      },
      metadata: {
        chatId: "chat-1",
        caption: "make a promo",
        title: "make a promo",
      },
      params: {
        sessionId: session.id,
        revisionId: "edit:telegram:chat-1:user-1:revision:0",
        approvedMessageId: "43",
      },
    })
    expect(records.get(session.id)).toMatchObject({
      status: "done",
      publishResult: {
        destination: "telegram",
        status: "done",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("keeps approved sessions without a publish target downloadable", async () => {
    const { service } = createWorkflowService(completedResult)
    const session = createReviewSession({
      currentArtifact: {
        type: "file",
        path: "/tmp/revision-0.mp4",
        destination: "file",
        mimeType: "video/mp4",
      },
    })
    const { store, records } = createEditSessionStore([session])
    const publishService: IPublishService = {
      canPublish: vi.fn(() => true),
      publish: vi.fn(),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      publishService,
      now: () => "2026-06-08T08:00:07.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 59,
      message: {
        message_id: 45,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/approve",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "approve",
      reviewAction: "approved",
      editSession: {
        status: "approved",
        approvedMessageId: "45",
      },
    })
    expect(publishService.publish).not.toHaveBeenCalled()
    expect(records.get(session.id)).toMatchObject({
      status: "approved",
      approvedRevisionId: "edit:telegram:chat-1:user-1:revision:0",
    })
  })

  it("reports missing publish auth on approval before calling publish", async () => {
    const { service } = createWorkflowService(completedResult)
    const session = createReviewSession({
      currentArtifact: {
        type: "file",
        path: "/tmp/revision-0.mp4",
        destination: "file",
        mimeType: "video/mp4",
      },
      publishTarget: "telegram",
    })
    const { store } = createEditSessionStore([session])
    const publishService: IPublishService = {
      canPublish: vi.fn(() => false),
      publish: vi.fn(),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      publishService,
      now: () => "2026-06-08T08:00:08.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 60,
      message: {
        message_id: 46,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/approve",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "approve",
      reviewAction: "invalid_state",
      responseText: expect.stringContaining("Publishing to telegram is not configured"),
    })
    expect(publishService.publish).not.toHaveBeenCalled()
  })

  it("approves and cancels active edit sessions without a queue id", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const approveSession = createReviewSession()
    const cancelSession = createReviewSession({ updatedAt: "2026-06-08T08:00:01.000Z" })
    const { store, records } = createEditSessionStore([approveSession])
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      now: () => "2026-06-08T08:00:04.000Z",
    })

    const approved = await worker.handleUpdate({
      update_id: 51,
      message: {
        message_id: 37,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/approve",
      },
    })
    records.set(cancelSession.id, cancelSession)
    const cancelled = await worker.handleUpdate({
      update_id: 52,
      message: {
        message_id: 38,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/cancel",
      },
    })

    expect(approved).toMatchObject({
      skipped: true,
      command: "approve",
      reviewAction: "approved",
      editSession: {
        status: "approved",
        approvedRevisionId: "edit:telegram:chat-1:user-1:revision:0",
      },
    })
    expect(records.get(approveSession.id)).toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-06-08T08:00:04.000Z",
    })
    expect(cancelled).toMatchObject({
      skipped: true,
      command: "cancel",
      reviewAction: "cancelled",
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("discards the latest edit revision and restores the previous one", async () => {
    const { service } = createWorkflowService(completedResult)
    const project = createProjectSchema()
    const session = createReviewSession({
      revisionCounter: 2,
      revisions: [
        {
          id: "edit:telegram:chat-1:user-1:revision:0",
          index: 0,
          projectSchema: project,
          summary: "Initial preview",
          createdAt: "2026-06-08T08:00:00.000Z",
          updatedAt: "2026-06-08T08:00:00.000Z",
        },
        {
          id: "edit:telegram:chat-1:user-1:revision:1",
          index: 1,
          projectSchema: project,
          summary: "Second preview",
          createdAt: "2026-06-08T08:00:01.000Z",
          updatedAt: "2026-06-08T08:00:01.000Z",
        },
      ],
    })
    const { store, records } = createEditSessionStore([session])
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
      now: () => "2026-06-08T08:00:05.000Z",
    })

    const discarded = await worker.handleUpdate({
      update_id: 53,
      message: {
        message_id: 39,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/discard",
      },
    })

    expect(discarded).toMatchObject({
      skipped: true,
      command: "discard",
      reviewAction: "discarded",
      editRevision: {
        id: "edit:telegram:chat-1:user-1:revision:0",
        index: 0,
      },
    })
    expect(records.get(session.id)).toMatchObject({
      status: "preview_ready",
      revisionCounter: 2,
      revisions: [expect.objectContaining({ index: 0 })],
      updatedAt: "2026-06-08T08:00:05.000Z",
    })
  })

  it("lets collecting edit sessions continue through draft intake", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession({ status: "collecting", revisions: [], revisionCounter: 0 })
    const { store: editSessionStore } = createEditSessionStore([session])
    const draftStore = new Map<string, BotWorkflowDraft>()
    const draftStoreAdapter = {
      readDraft: vi.fn(async (id: string) => draftStore.get(id)),
      writeDraft: vi.fn(async (draft: BotWorkflowDraft) => {
        draftStore.set(draft.id, draft)
      }),
      deleteDraft: vi.fn(async (id: string) => {
        draftStore.delete(id)
      }),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore,
      draftStore: draftStoreAdapter,
    })

    const result = await worker.handleUpdate({
      update_id: 54,
      message: {
        message_id: 40,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "make this energetic",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reason: "Telegram bot draft updated",
      draftAction: "updated",
      draftId: "telegram:chat-1:user-1",
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("blocks plain feedback while an edit session is busy", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const session = createReviewSession({ status: "editing" })
    const { store } = createEditSessionStore([session])
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      editSessionStore: store,
    })

    const result = await worker.handleUpdate({
      update_id: 55,
      message: {
        message_id: 41,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "make it faster",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      reviewAction: "invalid_state",
      editSessionId: session.id,
      responseText: expect.stringContaining("feedback is accepted only after a preview is ready"),
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
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

  it("retries failed workflow jobs from stored Telegram-like payloads", async () => {
    let resolveWorkflow!: () => void
    const sourcePayload = {
      chat: { id: "chat-1" },
      from: { id: "user-1" },
      message_id: 20,
      text: "template=promo",
    }
    const runTelegramLikePayload = vi.fn(
      async () =>
        new Promise<BotWorkflowRunResult>((resolve) => {
          resolveWorkflow = () => resolve(completedResult)
        }),
    )
    const service = {
      runWorkflow: vi.fn(),
      runTelegramLikePayload,
      cancelRenderJob: vi.fn(),
    } as unknown as NodeBotWorkflowService
    const workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue()
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    await workflowJobStore.writeJob({
      id: "telegram-update-39",
      status: "failed",
      updateId: 39,
      chatId: "chat-1",
      userId: "user-1",
      error: "Render failed",
      sourcePayload,
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    const queueResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "queue-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowQueue,
      workflowJobStore,
      queueResponder,
      now: () => "2026-06-08T08:00:01.000Z",
    })

    const result = await worker.handleUpdate({
      update_id: 40,
      message: {
        message_id: 28,
        chat: { id: "chat-1" },
        from: { id: "user-1" },
        text: "/retry telegram-update-39",
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      queued: true,
      queueId: "telegram-update-40",
      retryOf: "telegram-update-39",
      responseText: defaultTelegramBotQueueText({
        queueId: "telegram-update-40",
        update: {
          update_id: 40,
          message: {
            message_id: 28,
            chat: { id: "chat-1" },
            from: { id: "user-1" },
            text: "/retry telegram-update-39",
          },
        },
        payload: {
          chat: { id: "chat-1" },
          from: { id: "user-1" },
          message_id: 28,
          text: "/retry telegram-update-39",
        },
      }),
    })
    expect(runTelegramLikePayload).toHaveBeenCalledWith(sourcePayload, expect.any(Object))
    await expect(workflowJobStore.readJob("telegram-update-40")).resolves.toMatchObject({
      id: "telegram-update-40",
      status: "running",
      retryOf: "telegram-update-39",
      sourcePayload,
    })

    resolveWorkflow()
    await workflowQueue.drain()

    await expect(workflowJobStore.readJob("telegram-update-40")).resolves.toMatchObject({
      id: "telegram-update-40",
      status: "done",
      retryOf: "telegram-update-39",
      renderJobId: "job-1",
    })
  })

  it("does not retry non-terminal workflow jobs", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    await workflowJobStore.writeJob({
      id: "telegram-update-41",
      status: "running",
      updateId: 41,
      chatId: "chat-1",
      sourcePayload: { text: "template=promo" },
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "retry-message-1" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowJobStore,
      commandResponder,
    })
    const update = {
      update_id: 42,
      message: {
        message_id: 29,
        chat: { id: "chat-1" },
        text: "/retry telegram-update-41",
      },
    }
    const payload = {
      chat: { id: "chat-1" },
      message_id: 29,
      text: "/retry telegram-update-41",
    }
    const responseText = defaultTelegramBotJobRetryText({
      queueId: "telegram-update-41",
      update,
      payload,
      job: await workflowJobStore.readJob("telegram-update-41"),
      reason: "Workflow job is running and cannot be retried.",
    })

    const result = await worker.handleUpdate(update)

    expect(result).toMatchObject({
      skipped: true,
      command: "retry",
      queueId: "telegram-update-41",
      retryOf: "telegram-update-41",
      responseText,
    })
    expect(commandResponder.sendMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      text: responseText,
      replyToMessageId: "29",
      metadata: {
        command: "retry",
        source: "telegram-bot-worker",
      },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("does not expose workflow jobs across Telegram chats when retrying", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService(completedResult)
    const workflowJobStore = new NodeTelegramBotInMemoryWorkflowJobStore()
    await workflowJobStore.writeJob({
      id: "telegram-update-43",
      status: "failed",
      updateId: 43,
      chatId: "chat-2",
      sourcePayload: { text: "template=promo" },
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    const jobRetryFormatter = vi.fn((_context: Parameters<typeof defaultTelegramBotJobRetryText>[0]) => "retry denied")
    const commandResponder = {
      sendMessage: vi.fn(async () => ({ messageId: "retry-message-2" })),
    }
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowJobStore,
      commandResponder,
      jobRetryFormatter,
    })

    const result = await worker.handleUpdate({
      update_id: 44,
      message: {
        message_id: 30,
        chat: { id: "chat-1" },
        text: "/retry telegram-update-43",
      },
    })

    expect(result).toMatchObject({
      skipped: true,
      command: "retry",
      queueId: "telegram-update-43",
      retryOf: "telegram-update-43",
      responseText: "retry denied",
    })
    expect(jobRetryFormatter).toHaveBeenCalledOnce()
    const formatterContext = jobRetryFormatter.mock.calls[0]?.[0]
    expect(formatterContext).toMatchObject({
      queueId: "telegram-update-43",
      reason: "Workflow job was not found for this chat.",
    })
    expect(formatterContext).not.toHaveProperty("job")
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
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
    expect(parseTelegramBotCommand("/approve")).toBe("approve")
    expect(parseTelegramBotCommand("/revise make it shorter")).toBe("revise")
    expect(parseTelegramBotCommand("/versions")).toBe("versions")
    expect(parseTelegramBotCommand("/discard")).toBe("discard")
    expect(parseTelegramBotCommand("/cancel telegram-update-1")).toBe("cancel")
    expect(parseTelegramBotCancelCommandTarget("/cancel@TimelineStudioBot telegram-update-1")).toBe("telegram-update-1")
    expect(parseTelegramBotCommand("/retry telegram-update-1")).toBe("retry")
    expect(parseTelegramBotRetryCommandTarget("/retry@TimelineStudioBot telegram-update-1")).toBe("telegram-update-1")
    expect(parseTelegramBotReviewCommand("/approve@TimelineStudioBot")).toBe("approve")
    expect(parseTelegramBotReviewCommand("/cancel")).toBe("cancel")
    expect(parseTelegramBotReviewCommand("/cancel telegram-update-1")).toBeNull()
    expect(parseTelegramBotReviseInstruction("/revise@TimelineStudioBot make it punchier")).toBe("make it punchier")
    expect(parseTelegramBotCommand("/render")).toBeNull()
    expect(parseTelegramBotCommand("/cancel")).toBeNull()
    expect(parseTelegramBotCommand("/retry")).toBeNull()
    expect(parseTelegramBotCommand("template=promo")).toBeNull()
    expect(parseTelegramBotDraftCommand("/render@TimelineStudioBot")).toBe("render")
    expect(parseTelegramBotDraftCommand("/cancel")).toBe("cancel")
  })

  it("matches Telegram access policies by chat or user id", () => {
    expect(isTelegramBotAccessAllowed({ chat: { id: "chat-1" } }, undefined)).toBe(true)
    expect(isTelegramBotAccessAllowed({ chat: { id: "chat-1" } }, { allowedChatIds: ["chat-1"] })).toBe(true)
    expect(isTelegramBotAccessAllowed({ from: { id: "user-1" } }, { allowedUserIds: ["user-1"] })).toBe(true)
    expect(
      isTelegramBotAccessAllowed(
        { chat: { id: "chat-2" }, from: { id: "user-1" } },
        { allowedChatIds: ["chat-1"], allowedUserIds: ["user-1"] },
      ),
    ).toBe(true)
    expect(isTelegramBotAccessAllowed({ chat: { id: "chat-2" } }, { allowedChatIds: ["chat-1"] })).toBe(false)
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
      retryOf: "telegram-update-1",
      sourcePayload: { text: "template=promo destination=telegram" },
      createdAt: "2026-06-08T08:00:02.000Z",
      updatedAt: "2026-06-08T08:00:02.000Z",
    })

    await expect(store.listJobs({ chatId: "chat-1" })).resolves.toEqual([
      expect.objectContaining({
        id: "telegram-update-3",
        status: "failed",
        error: "Render failed",
        retryOf: "telegram-update-1",
        sourcePayload: { text: "template=promo destination=telegram" },
      }),
    ])
    const reloaded = new NodeTelegramBotFileWorkflowJobStore(storePath)
    await expect(reloaded.readJob("telegram-update-3")).resolves.toMatchObject({
      id: "telegram-update-3",
      status: "failed",
      retryOf: "telegram-update-1",
      sourcePayload: { text: "template=promo destination=telegram" },
    })
  })

  it("recovers stale Telegram workflow jobs from a file store", async () => {
    const storePath = path.join(tempDir, "state", "stale-jobs.json")
    const store = new NodeTelegramBotFileWorkflowJobStore(storePath)

    await store.writeJob({
      id: "telegram-update-4",
      status: "queued",
      updateId: 4,
      chatId: "chat-1",
      sourcePayload: { text: "template=promo" },
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: "2026-06-08T08:00:00.000Z",
    })
    await store.writeJob({
      id: "telegram-update-5",
      status: "running",
      updateId: 5,
      chatId: "chat-1",
      renderJobId: "job-5",
      sourceWorkflow: { source: "telegram", template: { id: "promo" } },
      createdAt: "2026-06-08T08:00:01.000Z",
      updatedAt: "2026-06-08T08:00:01.000Z",
    })
    await store.writeJob({
      id: "telegram-update-6",
      status: "done",
      updateId: 6,
      chatId: "chat-1",
      createdAt: "2026-06-08T08:00:02.000Z",
      updatedAt: "2026-06-08T08:00:02.000Z",
    })

    const result = await recoverStaleTelegramWorkflowJobs(store, {
      now: () => "2026-06-08T09:00:00.000Z",
    })

    expect(result.recoveredJobs.map((job) => job.id).sort()).toEqual(["telegram-update-4", "telegram-update-5"])
    await expect(store.readJob("telegram-update-4")).resolves.toMatchObject({
      id: "telegram-update-4",
      status: "failed",
      reason: "Telegram bot workflow recovered after worker restart",
      error: "Workflow was interrupted before completion. Send /retry <queueId> to run it again.",
      updatedAt: "2026-06-08T09:00:00.000Z",
      sourcePayload: { text: "template=promo" },
    })
    await expect(store.readJob("telegram-update-5")).resolves.toMatchObject({
      id: "telegram-update-5",
      status: "failed",
      renderJobId: "job-5",
      sourceWorkflow: { source: "telegram", template: { id: "promo" } },
    })
    await expect(store.readJob("telegram-update-6")).resolves.toMatchObject({
      id: "telegram-update-6",
      status: "done",
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
