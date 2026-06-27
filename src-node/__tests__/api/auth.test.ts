/**
 * Gateway auth (#329) — initData-protected tRPC procedures.
 */

import { describe, test, expect } from "bun:test"
import crypto from "node:crypto"
import { appRouter } from "../../src/api/root"
import { extractInitData } from "../../src/api/context"
import type { Context } from "../../src/api/context"
import { createLogger } from "../../src/utils/logger"

const BOT_TOKEN = "123456:test-bot-token"

function signInitData(fields: Record<string, string>, botToken = BOT_TOKEN): string {
  const dataCheckString = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n")
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")
  const params = new URLSearchParams(fields)
  params.set("hash", hash)
  return params.toString()
}

const signedInitData = () =>
  signInitData({
    auth_date: "1700000000",
    user: JSON.stringify({ id: 42, first_name: "Ada", username: "ada" }),
  })

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    logger: createLogger("test"),
    botToken: BOT_TOKEN,
    initDataMaxAge: 0,
    ...overrides,
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

describe("Gateway auth router (#329)", () => {
  test("auth.me returns the verified identity for valid initData", async () => {
    const caller = appRouter.createCaller(makeContext({ initData: signedInitData() }))
    const me = await caller.auth.me()
    expect(me).toEqual({ userId: "42", chatId: null, username: "ada" })
  })

  test("rejects a request without initData (401)", async () => {
    const caller = appRouter.createCaller(makeContext())
    await expectTrpcError(caller.auth.me(), "UNAUTHORIZED")
  })

  test("rejects initData signed with a different token (401)", async () => {
    const caller = appRouter.createCaller(
      makeContext({ initData: signInitData({ auth_date: "1700000000", user: '{"id":1}' }, "999:other") }),
    )
    await expectTrpcError(caller.auth.me(), "UNAUTHORIZED")
  })

  test("fails when the gateway has no bot token configured (500)", async () => {
    const caller = appRouter.createCaller(makeContext({ initData: signedInitData(), botToken: undefined }))
    await expectTrpcError(caller.auth.me(), "INTERNAL_SERVER_ERROR")
  })

  test("enforces initData freshness when initDataMaxAge is set", async () => {
    const caller = appRouter.createCaller(makeContext({ initData: signedInitData(), initDataMaxAge: 1 }))
    // auth_date 1700000000 is far in the past relative to the real clock.
    await expectTrpcError(caller.auth.me(), "UNAUTHORIZED")
  })
})

describe("extractInitData", () => {
  test("reads the Authorization: tma <data> header", () => {
    const req = new Request("http://x", { headers: { authorization: "tma abc.def" } })
    expect(extractInitData(req)).toBe("abc.def")
  })

  test("reads the X-Telegram-Init-Data header", () => {
    const req = new Request("http://x", { headers: { "x-telegram-init-data": "raw-init" } })
    expect(extractInitData(req)).toBe("raw-init")
  })

  test("reads the initData query param (for EventSource/SSE)", () => {
    const req = new Request("http://x/trpc/render.events?initData=sse-init&batch=1")
    expect(extractInitData(req)).toBe("sse-init")
  })

  test("prefers the Authorization header over the query param", () => {
    const req = new Request("http://x/trpc?initData=from-query", {
      headers: { authorization: "tma from-header" },
    })
    expect(extractInitData(req)).toBe("from-header")
  })

  test("returns undefined when no init data header is present", () => {
    expect(extractInitData(new Request("http://x"))).toBeUndefined()
    expect(extractInitData(undefined)).toBeUndefined()
  })
})
