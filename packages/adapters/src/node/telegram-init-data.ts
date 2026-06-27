/**
 * Telegram Mini App `initData` verification (#329, Phase 2 gateway auth).
 *
 * The Mini App front-end sends `window.Telegram.WebApp.initData` (a URL-encoded
 * query string) with every gateway request. This module verifies its authenticity
 * against the bot token per the Telegram WebApp spec and extracts the caller's
 * `userId` / `chatId`, so the HTTP/SSE gateway can authenticate the same identities
 * the bot uses — without trusting client-supplied ids.
 *
 * Algorithm (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 *   secret_key   = HMAC_SHA256(key="WebAppData", message=bot_token)
 *   data_check   = sorted "key=value" lines (excluding `hash`), joined by "\n"
 *   computed_hash = HMAC_SHA256(key=secret_key, message=data_check) as hex
 * The request is authentic iff `computed_hash === hash` (timing-safe).
 */

import crypto from "node:crypto"

export interface TelegramInitDataUser {
  id: number
  is_bot?: boolean
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface VerifiedTelegramInitData {
  /** Telegram user id as a string (matches the bot's `from.id` handling). */
  userId: string
  /** Chat id, when the Mini App was opened from a chat context. */
  chatId?: string
  user?: TelegramInitDataUser
  /** `auth_date` as unix seconds. */
  authDate: number
  /** Opaque `query_id`, when present (needed for `answerWebAppQuery`). */
  queryId?: string
  /** All verified fields (excluding `hash`) for downstream use. */
  raw: Record<string, string>
}

export type TelegramInitDataVerification =
  | { valid: true; data: VerifiedTelegramInitData }
  | { valid: false; reason: string }

export interface VerifyTelegramInitDataOptions {
  /**
   * Reject when `auth_date` is older than this many seconds (replay protection).
   * Omit or set `0` to disable the freshness check.
   */
  maxAgeSeconds?: number
  /** Injectable clock (ms since epoch) for deterministic tests. */
  nowMs?: () => number
}

/**
 * Verify a Telegram Mini App `initData` string against the bot token.
 * Never throws: returns a discriminated result so the gateway can map a failure
 * to `401` without try/catch.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options: VerifyTelegramInitDataOptions = {},
): TelegramInitDataVerification {
  if (!initData) return { valid: false, reason: "empty initData" }
  if (!botToken) return { valid: false, reason: "missing bot token" }

  let params: URLSearchParams
  try {
    params = new URLSearchParams(initData)
  } catch {
    return { valid: false, reason: "malformed initData" }
  }

  const hash = params.get("hash")
  if (!hash) return { valid: false, reason: "missing hash" }
  if (!/^[0-9a-f]+$/i.test(hash)) return { valid: false, reason: "malformed hash" }

  const raw: Record<string, string> = {}
  const pairs: string[] = []
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue
    raw[key] = value
    pairs.push(`${key}=${value}`)
  }
  pairs.sort()
  const dataCheckString = pairs.join("\n")

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  const provided = Buffer.from(hash, "hex")
  const expected = Buffer.from(computed, "hex")
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { valid: false, reason: "hash mismatch" }
  }

  const authDate = Number(raw.auth_date)
  if (!Number.isFinite(authDate)) {
    return { valid: false, reason: "missing or invalid auth_date" }
  }
  if (options.maxAgeSeconds && options.maxAgeSeconds > 0) {
    const nowSeconds = Math.floor((options.nowMs?.() ?? Date.now()) / 1000)
    if (nowSeconds - authDate > options.maxAgeSeconds) {
      return { valid: false, reason: "initData expired" }
    }
  }

  let user: TelegramInitDataUser | undefined
  if (raw.user) {
    try {
      user = JSON.parse(raw.user) as TelegramInitDataUser
    } catch {
      return { valid: false, reason: "malformed user field" }
    }
  }

  const userId = user?.id === undefined ? undefined : String(user.id)
  if (!userId) return { valid: false, reason: "missing user id" }

  let chatId: string | undefined
  if (raw.chat) {
    try {
      const chat = JSON.parse(raw.chat) as { id?: number | string }
      if (chat?.id !== undefined) chatId = String(chat.id)
    } catch {
      // A malformed optional chat field does not invalidate an otherwise-authentic request.
    }
  }

  return {
    valid: true,
    data: {
      userId,
      ...(chatId ? { chatId } : {}),
      ...(user ? { user } : {}),
      authDate,
      ...(raw.query_id ? { queryId: raw.query_id } : {}),
      raw,
    },
  }
}
