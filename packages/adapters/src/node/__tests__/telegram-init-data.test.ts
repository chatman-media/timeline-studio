import crypto from "node:crypto"
import { describe, expect, it } from "vitest"
import { verifyTelegramInitData } from "../telegram-init-data"

const BOT_TOKEN = "123456:test-bot-token"

/** Build a signed initData string the way Telegram does, for round-trip tests. */
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

const baseFields = (overrides: Record<string, string> = {}) => ({
  auth_date: "1700000000",
  query_id: "AAabcdef",
  user: JSON.stringify({ id: 42, first_name: "Ada", username: "ada" }),
  ...overrides,
})

describe("verifyTelegramInitData", () => {
  it("accepts authentic initData and extracts userId/user/queryId", () => {
    const result = verifyTelegramInitData(signInitData(baseFields()), BOT_TOKEN)
    expect(result).toMatchObject({
      valid: true,
      data: {
        userId: "42",
        authDate: 1700000000,
        queryId: "AAabcdef",
        user: { id: 42, username: "ada" },
      },
    })
  })

  it("extracts chatId when a chat context is present", () => {
    const initData = signInitData(baseFields({ chat: JSON.stringify({ id: -100123, type: "supergroup" }) }))
    const result = verifyTelegramInitData(initData, BOT_TOKEN)
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.data.chatId).toBe("-100123")
  })

  it("rejects a tampered field (hash mismatch)", () => {
    const initData = signInitData(baseFields())
    // Flip the user id after signing.
    const tampered = initData.replace(/user=[^&]*/, encodeURI('user={"id":99,"first_name":"Mallory"}'))
    const result = verifyTelegramInitData(tampered, BOT_TOKEN)
    expect(result).toEqual({ valid: false, reason: "hash mismatch" })
  })

  it("rejects a wrong bot token", () => {
    const result = verifyTelegramInitData(signInitData(baseFields()), "999999:other-token")
    expect(result).toEqual({ valid: false, reason: "hash mismatch" })
  })

  it("rejects when hash is missing", () => {
    const params = new URLSearchParams(baseFields())
    const result = verifyTelegramInitData(params.toString(), BOT_TOKEN)
    expect(result).toEqual({ valid: false, reason: "missing hash" })
  })

  it("rejects empty initData and missing token", () => {
    expect(verifyTelegramInitData("", BOT_TOKEN)).toEqual({ valid: false, reason: "empty initData" })
    expect(verifyTelegramInitData("x=1", "")).toEqual({ valid: false, reason: "missing bot token" })
  })

  it("rejects expired initData when maxAgeSeconds is set", () => {
    const initData = signInitData(baseFields({ auth_date: "1700000000" }))
    const result = verifyTelegramInitData(initData, BOT_TOKEN, {
      maxAgeSeconds: 3600,
      nowMs: () => 1700000000_000 + 7200_000, // 2h later
    })
    expect(result).toEqual({ valid: false, reason: "initData expired" })
  })

  it("accepts fresh initData within maxAgeSeconds", () => {
    const initData = signInitData(baseFields({ auth_date: "1700000000" }))
    const result = verifyTelegramInitData(initData, BOT_TOKEN, {
      maxAgeSeconds: 3600,
      nowMs: () => 1700000000_000 + 600_000, // 10 min later
    })
    expect(result.valid).toBe(true)
  })

  it("rejects when the user field is absent (no user id)", () => {
    const fields = { auth_date: "1700000000" }
    const result = verifyTelegramInitData(signInitData(fields), BOT_TOKEN)
    expect(result).toEqual({ valid: false, reason: "missing user id" })
  })
})
