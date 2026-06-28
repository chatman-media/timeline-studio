import type { BotEditSessionStore, IAIProjectEditor, IPublishService } from "@timeline-studio/core"
import {
  createNodeServices,
  NodeAIProjectEditor,
  NodeBotEditSessionFileStore,
  type NodeBotWorkflowService,
  NodePublishService,
  NodeTelegramBotFileWorkflowJobStore,
  NodeTelegramBotInMemoryWorkflowQueue,
  type NodeTelegramBotWorkflowJobStore,
  type NodeTelegramBotWorkflowQueue,
} from "@timeline-studio/adapters/node"
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
  /** Workflow job store shared read-only with the bot, when configured (#329). */
  workflowJobStore?: NodeTelegramBotWorkflowJobStore
  /** Default poll interval (ms) for the render-status SSE stream. */
  renderStreamIntervalMs?: number
  /** Publish service for delivery on approve, when opted in (#329). */
  publishService?: IPublishService
  /** AI project editor for edit.revise, when configured (#329). */
  aiProjectEditor?: IAIProjectEditor
  /** Bot workflow runner for idea.submit (first cut), when configured (#330). */
  botWorkflow?: NodeBotWorkflowService
  /** In-process queue so idea.submit returns fast and renders async (#330). */
  workflowQueue?: NodeTelegramBotWorkflowQueue
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

// Workflow job store is a process singleton over the bot's shared job file.
let workflowJobStore: NodeTelegramBotWorkflowJobStore | undefined
function getWorkflowJobStore(): NodeTelegramBotWorkflowJobStore | undefined {
  if (!config.TELEGRAM_BOT_JOB_STORE_FILE) return undefined
  if (!workflowJobStore) {
    workflowJobStore = new NodeTelegramBotFileWorkflowJobStore(config.TELEGRAM_BOT_JOB_STORE_FILE)
  }
  return workflowJobStore
}

// Publish service is built only when delivery-on-approve is opted in (#329),
// reusing the bot token. Off → the gateway never publishes (no side effects).
let publishService: IPublishService | undefined
function getPublishService(): IPublishService | undefined {
  if (!config.TELEGRAM_GATEWAY_PUBLISH_ON_APPROVE || !config.TELEGRAM_BOT_TOKEN) return undefined
  if (!publishService) {
    publishService = new NodePublishService({ telegram: { botToken: config.TELEGRAM_BOT_TOKEN } })
  }
  return publishService
}

// AI project editor is built only when an API key is configured (#329) —
// otherwise edit.revise stays disabled and the gateway makes no LLM calls.
let aiProjectEditor: IAIProjectEditor | undefined
function getAIProjectEditor(): IAIProjectEditor | undefined {
  if (!config.GATEWAY_AI_EDITOR_API_KEY) return undefined
  if (!aiProjectEditor) {
    aiProjectEditor = new NodeAIProjectEditor({
      apiKey: config.GATEWAY_AI_EDITOR_API_KEY,
      ...(config.GATEWAY_AI_EDITOR_API_URL ? { apiUrl: config.GATEWAY_AI_EDITOR_API_URL } : {}),
      ...(config.GATEWAY_AI_EDITOR_PROVIDER ? { provider: config.GATEWAY_AI_EDITOR_PROVIDER } : {}),
      ...(config.GATEWAY_AI_EDITOR_MODEL ? { model: config.GATEWAY_AI_EDITOR_MODEL } : {}),
    })
  }
  return aiProjectEditor
}

// Bot workflow runner is built only when a script-generator API key is present
// (#330). It pulls in the full node service stack (video/render/first-cut) via
// createNodeServices; lazy + gated so the gateway stays thin unless opted in.
let botWorkflow: NodeBotWorkflowService | undefined
let botWorkflowResolved = false
function getBotWorkflow(): NodeBotWorkflowService | undefined {
  if (botWorkflowResolved) return botWorkflow
  botWorkflowResolved = true
  if (!config.GATEWAY_SCRIPT_GENERATOR_API_KEY) return undefined
  botWorkflow = createNodeServices({
    botScriptGenerator: {
      apiKey: config.GATEWAY_SCRIPT_GENERATOR_API_KEY,
      ...(config.GATEWAY_SCRIPT_GENERATOR_API_URL ? { apiUrl: config.GATEWAY_SCRIPT_GENERATOR_API_URL } : {}),
      ...(config.GATEWAY_SCRIPT_GENERATOR_PROVIDER ? { provider: config.GATEWAY_SCRIPT_GENERATOR_PROVIDER } : {}),
      ...(config.GATEWAY_SCRIPT_GENERATOR_MODEL ? { model: config.GATEWAY_SCRIPT_GENERATOR_MODEL } : {}),
    },
    rustRender: config.GATEWAY_RUST_RENDER,
    video: { ffmpegPath: config.FFMPEG_PATH, ffprobePath: config.FFPROBE_PATH },
  }).botWorkflow
  return botWorkflow
}

// In-process workflow queue so idea.submit enqueues and returns immediately,
// rendering the first cut in the background. Only built alongside the workflow.
let workflowQueue: NodeTelegramBotWorkflowQueue | undefined
function getWorkflowQueue(): NodeTelegramBotWorkflowQueue | undefined {
  if (!getBotWorkflow()) return undefined
  if (!workflowQueue) {
    workflowQueue = new NodeTelegramBotInMemoryWorkflowQueue({
      concurrency: config.GATEWAY_WORKFLOW_CONCURRENCY,
    })
  }
  return workflowQueue
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
  const header = req.headers.get("x-telegram-init-data")
  if (header) return header
  // EventSource (SSE subscriptions) can't send custom headers, so also accept
  // initData via the `initData` query param (#330).
  try {
    const fromQuery = new URL(req.url).searchParams.get("initData")
    if (fromQuery) return fromQuery
  } catch {
    // req.url may be relative/unparseable in some adapters — ignore.
  }
  return undefined
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
    workflowJobStore: getWorkflowJobStore(),
    renderStreamIntervalMs: config.TELEGRAM_RENDER_STREAM_INTERVAL_MS,
    publishService: getPublishService(),
    aiProjectEditor: getAIProjectEditor(),
    botWorkflow: getBotWorkflow(),
    workflowQueue: getWorkflowQueue(),
  }
}
