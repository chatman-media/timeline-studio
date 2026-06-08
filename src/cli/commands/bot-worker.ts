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
  NodeTelegramBotWorkerUpdateResult,
  TelegramBotUpdate,
} from "@/adapters/node"
import { initNodeApp, NodeTelegramBotWorker } from "@/adapters/node"
import type { BotRenderJobDestination } from "@/core/types"

export interface BotWorkerCommandOptions {
  updateFile?: string
  pollOnce?: boolean
  statusFile?: string
  pretty?: boolean
  telegramBotToken?: string
  statusUpdates?: boolean
  statusChatId?: string
  pollOffset?: string
  pollLimit?: string
  pollTimeout?: string
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

export type BotWorkerCommandResult = NodeTelegramBotWorkerUpdateResult | NodeTelegramBotWorkerPollResult

export const botWorkerCommand = new Command("bot-worker")
  .description("Run a Telegram bot worker for bot-first workflows")
  .option("--update-file <path>", "Handle one raw Telegram Update JSON file")
  .option("--poll-once", "Fetch and handle one Telegram getUpdates batch")
  .option("--status-file <path>", "Write worker result JSON to a file")
  .option("--pretty", "Pretty-print JSON output")
  .option("--telegram-bot-token <token>", "Telegram Bot API token for polling, media, status, and publishing")
  .option("--no-status-updates", "Disable Telegram workflow status messages")
  .option("--status-chat-id <id>", "Fallback Telegram chat id for status updates and publishing")
  .option("--poll-offset <id>", "Telegram getUpdates offset")
  .option("--poll-limit <count>", "Telegram getUpdates limit", "100")
  .option("--poll-timeout <seconds>", "Telegram getUpdates long-poll timeout in seconds", "25")
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
  if (!options.updateFile && !options.pollOnce) {
    throw new Error("Provide --update-file or --poll-once")
  }

  if (options.pollOnce && !options.telegramBotToken) {
    throw new Error("--telegram-bot-token is required with --poll-once")
  }

  const services = await initNodeApp({
    autoConnect: false,
    botMediaResolver: createBotMediaResolverOptions(options),
    botStatus: createBotStatusOptions(options),
    publish: createBotPublishOptions(options),
    rustRender: options.rustRender
      ? {
          command: options.rustRenderCommand,
          commandKind: options.rustRenderKind,
        }
      : undefined,
  })
  const worker = new NodeTelegramBotWorker({
    workflow: services.botWorkflow,
    botToken: options.telegramBotToken,
    workflowOptions: {
      intake: {
        defaultDestination: options.defaultDestination,
        defaultOutputPath: options.defaultOutput,
      },
      render: {
        pollIntervalMs: parsePositiveInteger(options.pollInterval, 1000),
        timeoutMs: parsePositiveInteger(options.timeout, 3600000),
      },
      includeReconnectState: true,
    },
  })

  if (options.updateFile) {
    return worker.handleUpdate(await readTelegramBotUpdate(options.updateFile))
  }

  return worker.pollOnce({
    offset: parseOptionalPositiveInteger(options.pollOffset),
    limit: parsePositiveInteger(options.pollLimit, 100),
    timeoutSeconds: parsePositiveInteger(options.pollTimeout, 25),
  })
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

function isFailedWorkerResult(result: BotWorkerCommandResult): boolean {
  if ("updates" in result) {
    return result.updates.some(isFailedUpdateResult)
  }

  return isFailedUpdateResult(result)
}

function isFailedUpdateResult(result: NodeTelegramBotWorkerUpdateResult): boolean {
  if (result.skipped) return false
  if (!result.result.ok) return true
  return result.result.result.job.status === "failed" || result.result.result.job.status === "cancelled"
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
