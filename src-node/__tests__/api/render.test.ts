/**
 * Gateway render router (#329) — owner-scoped read + SSE stream over the bot's
 * shared workflow job store.
 */

import { describe, test, expect } from "bun:test"
import crypto from "node:crypto"
import type {
  NodeTelegramBotWorkflowJobRecord,
  NodeTelegramBotWorkflowJobStatus,
  NodeTelegramBotWorkflowJobStore,
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

function job(
  id: string,
  userId: string,
  status: NodeTelegramBotWorkflowJobStatus,
): NodeTelegramBotWorkflowJobRecord {
  return {
    id,
    status,
    updateId: 1,
    userId,
    createdAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T08:00:00.000Z",
  }
}

function staticStore(jobs: NodeTelegramBotWorkflowJobRecord[]): NodeTelegramBotWorkflowJobStore {
  return {
    readJob: async (id) => jobs.find((j) => j.id === id),
    writeJob: async () => {},
    listJobs: async () => jobs,
  }
}

function ctxFor(userId: number, store?: NodeTelegramBotWorkflowJobStore): Context {
  return {
    logger: createLogger("test"),
    botToken: BOT_TOKEN,
    initDataMaxAge: 0,
    initData: signInitData(userId),
    workflowJobStore: store,
    renderStreamIntervalMs: 50,
  } as Context
}

async function take<T>(iterable: AsyncIterable<T>, n: number): Promise<T[]> {
  const out: T[] = []
  for await (const value of iterable) {
    out.push(value)
    if (out.length >= n) break
  }
  return out
}

describe("Gateway render router (#329)", () => {
  const jobs = [job("j1", "42", "running"), job("j2", "42", "done"), job("j3", "99", "running")]

  test("render.list returns only the caller's jobs as safe summaries", async () => {
    const caller = appRouter.createCaller(ctxFor(42, staticStore(jobs)))
    const result = await caller.render.list()
    expect(result.map((j) => j.id)).toEqual(["j1", "j2"])
    expect(result[0]).toEqual({
      id: "j1",
      status: "running",
      renderStatus: null,
      hasArtifact: false,
      error: null,
      createdAt: "2026-06-27T08:00:00.000Z",
      updatedAt: "2026-06-27T08:00:00.000Z",
    })
  })

  test("render.get hides another user's job as NOT_FOUND", async () => {
    const caller = appRouter.createCaller(ctxFor(42, staticStore(jobs)))
    await expect(caller.render.get({ id: "j3" })).rejects.toMatchObject({ code: "NOT_FOUND" })
  })

  test("render.list fails when the job store is unconfigured (500)", async () => {
    const caller = appRouter.createCaller(ctxFor(42, undefined))
    await expect(caller.render.list()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" })
  })

  test("render.events streams an initial snapshot then emits on status change", async () => {
    let calls = 0
    const evolving: NodeTelegramBotWorkflowJobStore = {
      readJob: async () => undefined,
      writeJob: async () => {},
      listJobs: async () => {
        calls += 1
        return calls === 1 ? [job("j1", "42", "running")] : [job("j1", "42", "done")]
      },
    }
    const caller = appRouter.createCaller(ctxFor(42, evolving))
    const snapshots = await take(await caller.render.events({ intervalMs: 50 }), 2)
    expect(snapshots[0].jobs[0].status).toBe("running")
    expect(snapshots[1].jobs[0].status).toBe("done")
  })
})
