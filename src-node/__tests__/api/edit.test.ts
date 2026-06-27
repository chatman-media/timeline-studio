/**
 * Gateway edit-mutation router (#329) — approve reuses the bot's review logic
 * over the shared edit-session store, scoped to the authenticated user.
 */

import { describe, test, expect } from "bun:test"
import crypto from "node:crypto"
import type {
  BotEditSession,
  BotEditSessionStore,
  BotEditSessionQuery,
  BotEditSessionStatus,
} from "@timeline-studio/core"
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

function makeSession(
  id: string,
  userId: string,
  status: BotEditSessionStatus,
): BotEditSession {
  return {
    id,
    source: "telegram",
    status,
    chatId: userId,
    userId,
    goal: "promo",
    media: [],
    revisionCounter: 1,
    revisions: [
      {
        id: `${id}:rev0`,
        index: 0,
        summary: "preview",
        createdAt: "2026-06-27T08:00:00.000Z",
        updatedAt: "2026-06-27T08:00:00.000Z",
      },
    ],
    createdAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T08:00:00.000Z",
  }
}

function mutableStore(initial: BotEditSession[]): BotEditSessionStore {
  const map = new Map(initial.map((s) => [s.id, s]))
  const store: BotEditSessionStore = {
    readSession: async (id) => map.get(id),
    writeSession: async (s) => {
      map.set(s.id, s)
    },
    deleteSession: async (id) => {
      map.delete(id)
    },
    listSessions: async (q: BotEditSessionQuery = {}) =>
      [...map.values()].filter(
        (s) =>
          (!q.source || s.source === q.source) &&
          (!q.chatId || s.chatId === q.chatId) &&
          (!q.userId || s.userId === q.userId) &&
          (!q.activeOnly || !["cancelled", "done", "failed"].includes(s.status)),
      ),
    readCurrentSession: async (q) => (await store.listSessions({ ...q, activeOnly: q.activeOnly ?? true }))[0],
  }
  return store
}

function ctxFor(userId: number, store?: BotEditSessionStore, publishService?: unknown): Context {
  return {
    logger: createLogger("test"),
    botToken: BOT_TOKEN,
    initDataMaxAge: 0,
    initData: signInitData(userId),
    editSessionStore: store,
    publishService,
  } as Context
}

/** A preview-ready session with a deliverable artifact, for publish-on-approve. */
function publishableSession(id: string, userId: string): BotEditSession {
  return {
    ...makeSession(id, userId, "preview_ready"),
    publishTarget: "telegram",
    currentArtifact: { type: "file", path: "/tmp/out.mp4", destination: "telegram" },
  }
}

describe("Gateway edit router (#329)", () => {
  test("edit.approve marks the caller's preview-ready session approved", async () => {
    const store = mutableStore([makeSession("s1", "42", "preview_ready")])
    const caller = appRouter.createCaller(ctxFor(42, store))

    const result = await caller.edit.approve({ id: "s1" })

    expect(result.status).toBe("approved")
    const persisted = await store.readSession("s1")
    expect(persisted?.status).toBe("approved")
    expect(persisted?.approvedBy).toBe("42")
  })

  test("edit.approve hides another user's session as NOT_FOUND", async () => {
    const store = mutableStore([makeSession("s9", "99", "preview_ready")])
    const caller = appRouter.createCaller(ctxFor(42, store))
    await expect(caller.edit.approve({ id: "s9" })).rejects.toMatchObject({ code: "NOT_FOUND" })
  })

  test("edit.approve conflicts when the session is not preview-ready", async () => {
    const store = mutableStore([makeSession("s2", "42", "draft" as BotEditSessionStatus)])
    const caller = appRouter.createCaller(ctxFor(42, store))
    await expect(caller.edit.approve({ id: "s2" })).rejects.toMatchObject({ code: "CONFLICT" })
  })

  test("edit.approve delivers via the publish service when opted in", async () => {
    const store = mutableStore([publishableSession("p1", "42")])
    const publish = {
      canPublish: () => true,
      publish: async (req: { destination: string }) => ({ destination: req.destination, status: "done" }),
    }
    const publishSpy = publish.publish
    let published = false
    publish.publish = async (req) => {
      published = true
      return publishSpy(req)
    }
    const caller = appRouter.createCaller(ctxFor(42, store, publish))

    const result = await caller.edit.approve({ id: "p1" })

    expect(published).toBe(true)
    expect(result.status).toBe("done")
    expect((await store.readSession("p1"))?.publishedAt).toBeTruthy()
  })

  test("edit.approve surfaces a delivery failure as BAD_GATEWAY", async () => {
    const store = mutableStore([publishableSession("p2", "42")])
    const publish = {
      canPublish: () => true,
      publish: async (req: { destination: string }) => ({
        destination: req.destination,
        status: "failed",
        error: "telegram rejected",
      }),
    }
    const caller = appRouter.createCaller(ctxFor(42, store, publish))
    await expect(caller.edit.approve({ id: "p2" })).rejects.toMatchObject({ code: "BAD_GATEWAY" })
  })

  test("edit.approve is idempotent on an already-approved session", async () => {
    const approved = { ...makeSession("s3", "42", "approved"), approvedRevisionId: "s3:rev0" }
    const caller = appRouter.createCaller(ctxFor(42, mutableStore([approved])))
    const result = await caller.edit.approve({ id: "s3" })
    expect(result.status).toBe("approved")
  })

  test("edit.approve fails when the store is unconfigured (500)", async () => {
    const caller = appRouter.createCaller(ctxFor(42, undefined))
    await expect(caller.edit.approve({ id: "s1" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" })
  })

  test("edit.approve requires authentication (401)", async () => {
    const caller = appRouter.createCaller({
      logger: createLogger("test"),
      botToken: BOT_TOKEN,
      editSessionStore: mutableStore([makeSession("s1", "42", "preview_ready")]),
    } as Context)
    await expect(caller.edit.approve({ id: "s1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })
})
