/**
 * Gateway idea-submission router (#330) — submit drives the bot's first-cut
 * workflow via a synthesized plain-text message, scoped to the authenticated
 * user, enqueuing so the mutation returns fast.
 */

import { describe, test, expect } from "bun:test"
import crypto from "node:crypto"
import type { BotEditSession, BotEditSessionStore, BotEditSessionQuery } from "@timeline-studio/core"
import type {
  NodeBotWorkflowService,
  NodeTelegramBotWorkflowQueue,
  NodeTelegramBotWorkflowQueueJob,
} from "@timeline-studio/adapters/node"
import { appRouter } from "../../src/api/root"
import type { Context } from "../../src/api/context"
import { createLogger } from "../../src/utils/logger"

const BOT_TOKEN = "123456:test-bot-token"

function signInitData(userId: number): string {
  const fields = { auth_date: "1700000000", user: JSON.stringify({ id: userId }) }
  const dataCheckString = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n")
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest()
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")
  const params = new URLSearchParams(fields)
  params.set("hash", hash)
  return params.toString()
}

function emptyStore(): BotEditSessionStore {
  const map = new Map<string, BotEditSession>()
  const store: BotEditSessionStore = {
    readSession: async (id) => map.get(id),
    writeSession: async (s) => {
      map.set(s.id, s)
    },
    deleteSession: async (id) => {
      map.delete(id)
    },
    listSessions: async (q: BotEditSessionQuery = {}) =>
      [...map.values()].filter((s) => (!q.userId || s.userId === q.userId) && (!q.chatId || s.chatId === q.chatId)),
    readCurrentSession: async () => undefined,
  }
  return store
}

// A workflow runner whose execution is never reached: with a deferring queue,
// the worker enqueues without invoking run().
const stubWorkflow = {
  runWorkflow: async () => {
    throw new Error("workflow run should not execute synchronously")
  },
  runTelegramLikePayload: async () => {
    throw new Error("workflow run should not execute synchronously")
  },
  cancelRenderJob: async () => false,
} as unknown as NodeBotWorkflowService

/** A queue that records submissions and defers (never runs them). */
function recordingQueue(): { queue: NodeTelegramBotWorkflowQueue; jobs: NodeTelegramBotWorkflowQueueJob[] } {
  const jobs: NodeTelegramBotWorkflowQueueJob[] = []
  const queue: NodeTelegramBotWorkflowQueue = {
    enqueue: async (job) => {
      jobs.push(job)
      return { id: job.id, status: "queued" }
    },
  }
  return { queue, jobs }
}

function ctxFor(userId: number, overrides: Partial<Context> = {}): Context {
  return {
    logger: createLogger("test"),
    botToken: BOT_TOKEN,
    initDataMaxAge: 0,
    initData: signInitData(userId),
    editSessionStore: emptyStore(),
    botWorkflow: stubWorkflow,
    ...overrides,
  } as Context
}

describe("Gateway idea router (#330)", () => {
  test("idea.submit enqueues the idea and returns a queued job id", async () => {
    const { queue, jobs } = recordingQueue()
    const caller = appRouter.createCaller(ctxFor(42, { workflowQueue: queue }))

    const result = await caller.idea.submit({ text: "a punchy promo for our new app" })

    expect(result.queued).toBe(true)
    expect(result.status).toBe("queued")
    expect(typeof result.jobId).toBe("string")
    expect(jobs.length).toBe(1)
    // The synthesized message carries the idea text, scoped to the caller.
    expect(jobs[0]?.update.message?.text).toBe("a punchy promo for our new app")
    expect(jobs[0]?.update.message?.from?.id).toBe("42")
  })

  test("idea.submit is disabled without a workflow (501)", async () => {
    const caller = appRouter.createCaller(ctxFor(42, { botWorkflow: undefined }))
    await expect(caller.idea.submit({ text: "hello" })).rejects.toMatchObject({ code: "NOT_IMPLEMENTED" })
  })

  test("idea.submit fails without an edit-session store (500)", async () => {
    const caller = appRouter.createCaller(ctxFor(42, { editSessionStore: undefined }))
    await expect(caller.idea.submit({ text: "hello" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" })
  })

  test("idea.submit rejects empty text", async () => {
    const caller = appRouter.createCaller(ctxFor(42, { workflowQueue: recordingQueue().queue }))
    await expect(caller.idea.submit({ text: "   " })).rejects.toBeDefined()
  })

  test("idea.submit requires authentication (401)", async () => {
    const caller = appRouter.createCaller({
      logger: createLogger("test"),
      botToken: BOT_TOKEN,
      editSessionStore: emptyStore(),
      botWorkflow: stubWorkflow,
    } as Context)
    await expect(caller.idea.submit({ text: "hello" })).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })
})
