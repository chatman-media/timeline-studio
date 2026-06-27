/**
 * Gateway session router (#329) — read-only, owner-scoped view over the bot's
 * shared edit-session store.
 */

import { describe, test, expect } from "bun:test"
import crypto from "node:crypto"
import type { BotEditSession, BotEditSessionStore, BotEditSessionQuery } from "@timeline-studio/core"
import { appRouter } from "../../src/api/root"
import type { Context } from "../../src/api/context"
import { createLogger } from "../../src/utils/logger"

const BOT_TOKEN = "123456:test-bot-token"

function signInitData(userId: number): string {
  const fields = { auth_date: "1700000000", user: JSON.stringify({ id: userId, username: `u${userId}` }) }
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

function makeSession(id: string, userId: string, overrides: Partial<BotEditSession> = {}): BotEditSession {
  return {
    id,
    source: "telegram",
    status: "preview_ready",
    userId,
    media: [],
    revisionCounter: 1,
    revisions: [],
    createdAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T08:00:00.000Z",
    ...overrides,
  }
}

function fakeStore(sessions: BotEditSession[]): BotEditSessionStore {
  return {
    readSession: async (id: string) => sessions.find((s) => s.id === id),
    writeSession: async () => {},
    deleteSession: async () => {},
    listSessions: async (query: BotEditSessionQuery = {}) =>
      sessions
        .filter((s) => (!query.source || s.source === query.source) && (!query.userId || s.userId === query.userId))
        .slice(0, query.limit ?? sessions.length),
    readCurrentSession: async (query: BotEditSessionQuery) =>
      sessions.find((s) => (!query.userId || s.userId === query.userId)),
  }
}

function ctxFor(userId: number, store?: BotEditSessionStore): Context {
  return {
    logger: createLogger("test"),
    botToken: BOT_TOKEN,
    initDataMaxAge: 0,
    initData: signInitData(userId),
    editSessionStore: store,
  } as Context
}

async function expectTrpcError(promise: Promise<unknown>, code: string): Promise<void> {
  try {
    await promise
    throw new Error("expected the call to throw")
  } catch (error) {
    expect((error as { code?: string }).code).toBe(code)
  }
}

describe("Gateway session router (#329)", () => {
  const sessions = [
    makeSession("edit:telegram:1:42", "42", { goal: "promo", revisionCounter: 2 }),
    makeSession("edit:telegram:1:42:b", "42", { status: "approved", approvedAt: "2026-06-27T09:00:00.000Z" }),
    makeSession("edit:telegram:2:99", "99", { goal: "other user" }),
  ]

  test("session.list returns only the caller's sessions as safe summaries", async () => {
    const caller = appRouter.createCaller(ctxFor(42, fakeStore(sessions)))
    const result = await caller.session.list()
    expect(result.map((s) => s.id)).toEqual(["edit:telegram:1:42", "edit:telegram:1:42:b"])
    expect(result[0]).toEqual({
      id: "edit:telegram:1:42",
      status: "preview_ready",
      goal: "promo",
      revisionCount: 2,
      approvedRevisionId: null,
      approvedAt: null,
      publishedAt: null,
      failure: null,
      createdAt: "2026-06-27T08:00:00.000Z",
      updatedAt: "2026-06-27T08:00:00.000Z",
    })
  })

  test("session.get returns an owned session", async () => {
    const caller = appRouter.createCaller(ctxFor(42, fakeStore(sessions)))
    const result = await caller.session.get({ id: "edit:telegram:1:42:b" })
    expect(result.status).toBe("approved")
  })

  test("session.get hides another user's session as NOT_FOUND", async () => {
    const caller = appRouter.createCaller(ctxFor(42, fakeStore(sessions)))
    await expectTrpcError(caller.session.get({ id: "edit:telegram:2:99" }), "NOT_FOUND")
  })

  test("fails when the edit-session store is not configured (500)", async () => {
    const caller = appRouter.createCaller(ctxFor(42, undefined))
    await expectTrpcError(caller.session.list(), "INTERNAL_SERVER_ERROR")
  })

  test("still requires authentication (401 without initData)", async () => {
    const caller = appRouter.createCaller({
      logger: createLogger("test"),
      botToken: BOT_TOKEN,
      editSessionStore: fakeStore(sessions),
    } as Context)
    await expectTrpcError(caller.session.list(), "UNAUTHORIZED")
  })
})
