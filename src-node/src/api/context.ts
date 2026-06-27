import type { BotEditSessionStore } from "@timeline-studio/core"
import { NodeBotEditSessionFileStore } from "@timeline-studio/adapters/node"
import type { EnhancedMediaService } from "../services/media-service"
import type { CacheService } from "../services/cache-service"
import type { QueueService } from "../services/queue-service"
import type { Logger } from "../utils/logger"
import { createLogger } from "../utils/logger"
import { config } from "../config"

/**
 * tRPC request context
 */
export interface Context {
  mediaService: EnhancedMediaService
  cacheService: CacheService
  queueService: QueueService
  logger: Logger
  /** Raw Telegram Mini App `initData` from the request, if present (#329). */
  initData?: string
  /** Bot token used to verify `initData` (from config). */
  botToken?: string
  /** Max `initData` age in seconds; 0 disables the freshness check. */
  initDataMaxAge?: number
  /** Edit-session store shared read-only with the bot, when configured (#329). */
  editSessionStore?: BotEditSessionStore
}

// Edit-session store is a process singleton over the bot's shared directory.
let editSessionStore: BotEditSessionStore | undefined
function getEditSessionStore(): BotEditSessionStore | undefined {
  if (!config.TELEGRAM_BOT_EDIT_SESSION_DIR) return undefined
  if (!editSessionStore) {
    editSessionStore = new NodeBotEditSessionFileStore({
      directory: config.TELEGRAM_BOT_EDIT_SESSION_DIR,
    })
  }
  return editSessionStore
}

type ContextServices = Pick<Context, "mediaService" | "cacheService" | "queueService">

/** Options passed by the tRPC fetch adapter for each request. */
export interface CreateContextOptions {
  req?: Request
}

// Global services (initialized in main.ts)
let globalServices: ContextServices | null = null

/**
 * Initialize global services
 */
export function initializeServices(services: ContextServices): void {
  globalServices = services
}

/**
 * Extract the Telegram Mini App `initData` from a request.
 * Accepts `Authorization: tma <initData>` (Telegram convention) or the
 * `X-Telegram-Init-Data` header.
 */
export function extractInitData(req: Request | undefined): string | undefined {
  if (!req) return undefined
  const auth = req.headers.get("authorization")
  if (auth) {
    const match = /^tma\s+(.+)$/i.exec(auth.trim())
    if (match) return match[1]
  }
  return req.headers.get("x-telegram-init-data") ?? undefined
}

/**
 * Create context for each tRPC request
 */
export async function createContext(opts: CreateContextOptions = {}): Promise<Context> {
  if (!globalServices) {
    throw new Error("Services not initialized. Call initializeServices first.")
  }

  return {
    ...globalServices,
    logger: createLogger("tRPC"),
    initData: extractInitData(opts.req),
    botToken: config.TELEGRAM_BOT_TOKEN,
    initDataMaxAge: config.TELEGRAM_INIT_DATA_MAX_AGE,
    editSessionStore: getEditSessionStore(),
  }
}
