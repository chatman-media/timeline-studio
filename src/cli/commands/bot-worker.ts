/**
 * Telegram bot worker command.
 *
 * Accepts raw Telegram Update JSON or one getUpdates batch, converts updates to
 * the bot workflow contract, and runs the same headless workflow as bot-workflow.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"
import type {
  NodeTelegramBotWorkerPollResult,
  NodeTelegramBotWorkerRunResult,
  NodeTelegramBotWorkerUpdateResult,
  TelegramBotUpdate,
} from "@/adapters/node"
import {
  initNodeApp,
  NodeBotWorkflowFileDraftStore,
  type NodeTelegramBotAccessPolicy,
  NodeTelegramBotFileOffsetStore,
  NodeTelegramBotFileWorkflowJobStore,
  NodeTelegramBotInMemoryWorkflowQueue,
  NodeTelegramBotWorker,
  recoverStaleTelegramWorkflowJobs,
} from "@/adapters/node"
import type {
  BotRenderJobDestination,
  BotWorkflowRunResult,
  BotWorkflowStatusOptions,
  BotWorkflowStatusPolicy,
  BotWorkflowStatusSink,
} from "@/core/types"

export interface BotWorkerCommandOptions {
  updateFile?: string
  pollOnce?: boolean
  poll?: boolean
  statusFile?: string
  pretty?: boolean
  telegramBotToken?: string
  allowedChatIds?: string
  allowedUserIds?: string
  statusUpdates?: boolean
  statusChatId?: string
  statusMinInterval?: string
  statusMinProgressDelta?: string
  pollOffset?: string
  pollLimit?: string
  pollTimeout?: string
  offsetFile?: string
  draftDir?: string
  jobStoreFile?: string
  recoverStaleJobs?: boolean
  asyncWorkflows?: boolean
  workflowConcurrency?: string
  workflowQueueLimit?: string
  maxBatches?: string
  idleDelay?: string
  mediaDir?: string
  downloadRemoteMedia?: boolean
  pollInterval?: string
  timeout?: string
  rustRender?: boolean
  rustRenderCommand?: string
  rustRenderKind?: "timeline" | "timeline-render"
  defaultDestination?: BotRenderJobDestination
  defaultOutput?: string
}

export type BotWorkerCommandResult =
  | NodeTelegramBotWorkerUpdateResult
  | NodeTelegramBotWorkerPollResult
  | NodeTelegramBotWorkerRunResult

export const botWorkerCommand = new Command("bot-worker")
  .description("Run a Telegram bot worker for bot-first workflows")
  .option("--update-file <path>", "Handle one raw Telegram Update JSON file")
  .option("--poll-once", "Fetch and handle one Telegram getUpdates batch")
  .option("--poll", "Continuously fetch and handle Telegram getUpdates batches")
  .option("--status-file <path>", "Write worker result JSON to a file")
  .option("--pretty", "Pretty-print JSON output")
  .option("--telegram-bot-token <token>", "Telegram Bot API token for polling, media, status, and publishing")
  .option("--allowed-chat-ids <ids>", "Comma/space separated Telegram chat ids allowed to use the bot")
  .option("--allowed-user-ids <ids>", "Comma/space separated Telegram user ids allowed to use the bot")
  .option("--no-status-updates", "Disable Telegram workflow status messages")
  .option("--status-chat-id <id>", "Fallback Telegram chat id for status updates and publishing")
  .option("--status-min-interval <ms>", "Minimum interval between repeated rendering status messages")
  .option("--status-min-progress-delta <percent>", "Minimum progress delta between rendering status messages")
  .option("--poll-offset <id>", "Telegram getUpdates offset")
  .option("--poll-limit <count>", "Telegram getUpdates limit", "100")
  .option("--poll-timeout <seconds>", "Telegram getUpdates long-poll timeout in seconds", "25")
  .option("--offset-file <path>", "Persist Telegram getUpdates offset between polling runs")
  .option("--draft-dir <path>", "Persist Telegram bot conversation drafts in a directory")
  .option("--job-store-file <path>", "Persist Telegram workflow job status/history")
  .option("--recover-stale-jobs", "Mark persisted queued/running workflow jobs as failed before worker handling")
  .option("--async-workflows", "Queue Telegram workflow runs during continuous polling")
  .option("--workflow-concurrency <count>", "Maximum queued workflow runs in parallel", "1")
  .option("--workflow-queue-limit <count>", "Maximum pending queued workflows before rejecting new requests")
  .option("--max-batches <count>", "Stop continuous polling after this many getUpdates batches")
  .option("--idle-delay <ms>", "Delay after an empty continuous polling batch", "1000")
  .option("--media-dir <path>", "Directory for resolved bot media downloads")
  .option("--download-remote-media", "Download remote URL media before rendering")
  .option("--poll-interval <ms>", "Render polling interval in milliseconds", "1000")
  .option("--timeout <ms>", "Render timeout in milliseconds", "3600000")
  .option("--rust-render", "Run rendering through the Rust headless ts-render CLI")
  .option("--rust-render-command <path>", "Path/name for timeline or timeline-render command")
  .option("--rust-render-kind <kind>", "Rust render command kind: timeline or timeline-render")
  .option("--default-destination <destination>", "Fallback destination when update has no destination hint")
  .option("--default-output <path>", "Fallback output path when update has no output hint")
  .action(async (options: BotWorkerCommandOptions) => {
    try {
      const result = await runBotWorker(options)
      const serialized = serializeBotWorkerResult(result, options.pretty)

      if (options.statusFile) {
        await fs.writeFile(path.resolve(options.statusFile), `${serialized}\n`)
      }

      process.stdout.write(`${serialized}\n`)
      if (isFailedWorkerResult(result)) {
        process.exit(1)
      }
    } catch (error) {
      const failed = serializeBotWorkerFailure(error, options.pretty)
      process.stderr.write(`${failed}\n`)
      process.exit(1)
    }
  })

export async function runBotWorker(options: BotWorkerCommandOptions = {}): Promise<BotWorkerCommandResult> {
  const resolvedOptions = resolveBotWorkerCommandOptions(options)

  if (!resolvedOptions.updateFile && !resolvedOptions.pollOnce && !resolvedOptions.poll) {
    throw new Error("Provide --update-file, --poll-once, or --poll")
  }

  if ((resolvedOptions.pollOnce || resolvedOptions.poll) && !resolvedOptions.telegramBotToken) {
    throw new Error("--telegram-bot-token is required with --poll-once or --poll")
  }

  if (resolvedOptions.recoverStaleJobs && !resolvedOptions.jobStoreFile) {
    throw new Error("--recover-stale-jobs requires --job-store-file")
  }

  const services = await initNodeApp({
    autoConnect: false,
    botMediaResolver: createBotMediaResolverOptions(resolvedOptions),
    botStatus: createBotStatusOptions(resolvedOptions),
    publish: createBotPublishOptions(resolvedOptions),
    rustRender: resolvedOptions.rustRender
      ? {
          command: resolvedOptions.rustRenderCommand,
          commandKind: resolvedOptions.rustRenderKind,
        }
      : undefined,
  })
  const workflowJobStore = resolvedOptions.jobStoreFile
    ? new NodeTelegramBotFileWorkflowJobStore(path.resolve(resolvedOptions.jobStoreFile))
    : undefined

  if (resolvedOptions.recoverStaleJobs && workflowJobStore) {
    await recoverStaleTelegramWorkflowJobs(workflowJobStore)
  }

  const workflowStatus = createBotWorkflowStatusOptions(services.botStatus, resolvedOptions)
  const workflowQueue =
    resolvedOptions.poll && resolvedOptions.asyncWorkflows
      ? new NodeTelegramBotInMemoryWorkflowQueue({
          concurrency: parsePositiveInteger(resolvedOptions.workflowConcurrency, 1),
          maxPending: parseOptionalNonNegativeInteger(resolvedOptions.workflowQueueLimit),
        })
      : undefined
  const worker = new NodeTelegramBotWorker({
    workflow: services.botWorkflow,
    workflowQueue,
    accessPolicy: createTelegramBotAccessPolicy(resolvedOptions),
    botToken: resolvedOptions.telegramBotToken,
    workflowOptions: {
      intake: {
        defaultDestination: resolvedOptions.defaultDestination,
        defaultOutputPath: resolvedOptions.defaultOutput,
      },
      render: {
        pollIntervalMs: parsePositiveInteger(resolvedOptions.pollInterval, 1000),
        timeoutMs: parsePositiveInteger(resolvedOptions.timeout, 3600000),
      },
      ...(workflowStatus ? { status: workflowStatus } : {}),
      includeReconnectState: true,
    },
    draftStore: resolvedOptions.draftDir
      ? new NodeBotWorkflowFileDraftStore(path.resolve(resolvedOptions.draftDir))
      : undefined,
    workflowJobStore,
  })

  if (resolvedOptions.updateFile) {
    return worker.handleUpdate(await readTelegramBotUpdate(resolvedOptions.updateFile))
  }

  const offset = parseOptionalPositiveInteger(resolvedOptions.pollOffset)
  const limit = parsePositiveInteger(resolvedOptions.pollLimit, 100)
  const timeoutSeconds = parsePositiveInteger(resolvedOptions.pollTimeout, 25)

  if (resolvedOptions.poll) {
    const result = await worker.runPolling({
      offset,
      limit,
      timeoutSeconds,
      offsetStore: resolvedOptions.offsetFile
        ? new NodeTelegramBotFileOffsetStore(path.resolve(resolvedOptions.offsetFile))
        : undefined,
      maxBatches: parseOptionalPositiveInteger(resolvedOptions.maxBatches),
      idleDelayMs: parsePositiveInteger(resolvedOptions.idleDelay, 1000),
    })
    await workflowQueue?.drain()
    return result
  }

  return worker.pollOnce({
    offset,
    limit,
    timeoutSeconds,
  })
}

export function resolveBotWorkerCommandOptions(
  options: BotWorkerCommandOptions,
  env: Record<string, string | undefined> = process.env,
): BotWorkerCommandOptions {
  return {
    ...options,
    telegramBotToken: firstConfigured(
      options.telegramBotToken,
      env.TIMELINE_BOT_TELEGRAM_TOKEN,
      env.TELEGRAM_BOT_TOKEN,
    ),
    allowedChatIds: firstConfigured(options.allowedChatIds, env.TIMELINE_BOT_ALLOWED_CHAT_IDS),
    allowedUserIds: firstConfigured(options.allowedUserIds, env.TIMELINE_BOT_ALLOWED_USER_IDS),
    statusChatId: firstConfigured(options.statusChatId, env.TIMELINE_BOT_STATUS_CHAT_ID),
    statusMinInterval: firstConfigured(options.statusMinInterval, env.TIMELINE_BOT_STATUS_MIN_INTERVAL),
    statusMinProgressDelta: firstConfigured(options.statusMinProgressDelta, env.TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA),
    pollOffset: firstConfigured(options.pollOffset, env.TIMELINE_BOT_POLL_OFFSET),
    pollLimit: firstConfigured(options.pollLimit, env.TIMELINE_BOT_POLL_LIMIT),
    pollTimeout: firstConfigured(options.pollTimeout, env.TIMELINE_BOT_POLL_TIMEOUT),
    offsetFile: firstConfigured(options.offsetFile, env.TIMELINE_BOT_OFFSET_FILE),
    draftDir: firstConfigured(options.draftDir, env.TIMELINE_BOT_DRAFT_DIR),
    jobStoreFile: firstConfigured(options.jobStoreFile, env.TIMELINE_BOT_JOB_STORE_FILE),
    recoverStaleJobs: options.recoverStaleJobs ?? parseBooleanEnv(env.TIMELINE_BOT_RECOVER_STALE_JOBS),
    workflowConcurrency: firstConfigured(options.workflowConcurrency, env.TIMELINE_BOT_WORKFLOW_CONCURRENCY),
    workflowQueueLimit: firstConfigured(options.workflowQueueLimit, env.TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT),
    maxBatches: firstConfigured(options.maxBatches, env.TIMELINE_BOT_MAX_BATCHES),
    idleDelay: firstConfigured(options.idleDelay, env.TIMELINE_BOT_IDLE_DELAY),
    mediaDir: firstConfigured(options.mediaDir, env.TIMELINE_BOT_MEDIA_DIR),
    pollInterval: firstConfigured(options.pollInterval, env.TIMELINE_BOT_RENDER_POLL_INTERVAL),
    timeout: firstConfigured(options.timeout, env.TIMELINE_BOT_RENDER_TIMEOUT),
    rustRenderCommand: firstConfigured(options.rustRenderCommand, env.TIMELINE_BOT_RUST_RENDER_COMMAND),
    rustRenderKind: firstConfigured(options.rustRenderKind, normalizeRustRenderKind(env.TIMELINE_BOT_RUST_RENDER_KIND)),
    defaultDestination: firstConfigured(
      options.defaultDestination,
      normalizeDestination(env.TIMELINE_BOT_DEFAULT_DESTINATION),
    ),
    defaultOutput: firstConfigured(options.defaultOutput, env.TIMELINE_BOT_DEFAULT_OUTPUT),
    asyncWorkflows: options.asyncWorkflows ?? parseBooleanEnv(env.TIMELINE_BOT_ASYNC_WORKFLOWS),
    downloadRemoteMedia: options.downloadRemoteMedia ?? parseBooleanEnv(env.TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA),
    rustRender: options.rustRender ?? parseBooleanEnv(env.TIMELINE_BOT_RUST_RENDER),
  }
}

export async function readTelegramBotUpdate(updateFile: string): Promise<TelegramBotUpdate> {
  const updatePath = path.resolve(updateFile)
  const content = await fs.readFile(updatePath, "utf-8")
  const parsed = JSON.parse(content) as TelegramBotUpdate

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Telegram update JSON must be an object")
  }

  if (!Number.isFinite(parsed.update_id)) {
    throw new Error("Telegram update JSON must include numeric update_id")
  }

  return parsed
}

export function serializeBotWorkerResult(result: BotWorkerCommandResult, pretty = false): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}

function createBotMediaResolverOptions(options: BotWorkerCommandOptions) {
  if (!options.telegramBotToken && !options.mediaDir && !options.downloadRemoteMedia) {
    return undefined
  }

  return {
    ...(options.mediaDir ? { downloadDir: path.resolve(options.mediaDir) } : {}),
    downloadRemoteUrls: options.downloadRemoteMedia ?? false,
    ...(options.telegramBotToken
      ? {
          telegram: {
            botToken: options.telegramBotToken,
          },
        }
      : {}),
  }
}

function createBotStatusOptions(options: BotWorkerCommandOptions) {
  if (options.statusUpdates === false || !options.telegramBotToken) {
    return undefined
  }

  return {
    telegram: {
      botToken: options.telegramBotToken,
      ...(options.statusChatId ? { defaultChatId: options.statusChatId } : {}),
    },
  }
}

function createTelegramBotAccessPolicy(options: BotWorkerCommandOptions): NodeTelegramBotAccessPolicy | undefined {
  const allowedChatIds = parseIdList(options.allowedChatIds)
  const allowedUserIds = parseIdList(options.allowedUserIds)

  if (allowedChatIds.length === 0 && allowedUserIds.length === 0) return undefined
  return {
    ...(allowedChatIds.length > 0 ? { allowedChatIds } : {}),
    ...(allowedUserIds.length > 0 ? { allowedUserIds } : {}),
  }
}

function createBotWorkflowStatusOptions(
  sink: BotWorkflowStatusSink | undefined,
  options: BotWorkerCommandOptions,
): BotWorkflowStatusOptions | undefined {
  if (!sink) return undefined
  const policy = createBotWorkflowStatusPolicy(options)
  return {
    sink,
    ...(policy ? { policy } : {}),
  }
}

function createBotWorkflowStatusPolicy(options: BotWorkerCommandOptions): BotWorkflowStatusPolicy | undefined {
  const minIntervalMs = parseOptionalNonNegativeNumber(options.statusMinInterval)
  const minProgressDelta = parseOptionalNonNegativeNumber(options.statusMinProgressDelta)

  if (minIntervalMs === undefined && minProgressDelta === undefined) return undefined
  return {
    ...(minIntervalMs !== undefined ? { minIntervalMs } : {}),
    ...(minProgressDelta !== undefined ? { minProgressDelta } : {}),
  }
}

function createBotPublishOptions(options: BotWorkerCommandOptions) {
  if (!options.telegramBotToken) {
    return undefined
  }

  return {
    telegram: {
      botToken: options.telegramBotToken,
      ...(options.statusChatId ? { defaultChatId: options.statusChatId } : {}),
    },
  }
}

export function isFailedWorkerResult(result: BotWorkerCommandResult): boolean {
  if ("batches" in result) {
    return result.batches.some((batch) => batch.updates.some(isFailedUpdateResult))
  }

  if ("updates" in result) {
    return result.updates.some(isFailedUpdateResult)
  }

  return isFailedUpdateResult(result)
}

function isFailedUpdateResult(result: NodeTelegramBotWorkerUpdateResult): boolean {
  if (result.skipped) return false
  if ("failed" in result && result.failed) return true
  if ("rejected" in result && result.rejected) return true
  if ("queued" in result && result.queued) {
    if (result.error) return true
    return result.completion ? isFailedWorkflowRunResult(result.completion) : false
  }
  if (!("result" in result)) return true
  return isFailedWorkflowRunResult(result.result)
}

function isFailedWorkflowRunResult(result: BotWorkflowRunResult): boolean {
  if (!result.ok) return true
  return result.result.job.status === "failed" || result.result.job.status === "cancelled"
}

function serializeBotWorkerFailure(error: unknown, pretty = false): string {
  return JSON.stringify(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    null,
    pretty ? 2 : 0,
  )
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parseOptionalNonNegativeInteger(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parseOptionalNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parseIdList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function firstConfigured<T extends string>(...values: Array<T | undefined>): T | undefined {
  return values.find((value): value is T => value !== undefined && value.trim().length > 0)
}

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true
    case "0":
    case "false":
    case "no":
    case "off":
      return false
    default:
      return undefined
  }
}

function normalizeDestination(value: string | undefined): BotRenderJobDestination | undefined {
  switch (value?.trim()) {
    case "file":
    case "telegram":
    case "youtube":
    case "tiktok":
    case "vimeo":
      return value.trim() as BotRenderJobDestination
    default:
      return undefined
  }
}

function normalizeRustRenderKind(value: string | undefined): BotWorkerCommandOptions["rustRenderKind"] {
  switch (value?.trim()) {
    case "timeline":
    case "timeline-render":
      return value.trim() as BotWorkerCommandOptions["rustRenderKind"]
    default:
      return undefined
  }
}
