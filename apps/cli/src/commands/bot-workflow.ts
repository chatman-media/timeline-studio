/**
 * Bot-first workflow command.
 *
 * Reads a Telegram-like payload JSON file, normalizes it into the bot workflow
 * contract, runs the render job, and writes a machine-readable result.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"

import { initNodeApp } from "@timeline-studio/adapters/node"
import type {
  BotRenderJobDestination,
  BotWorkflowRunResult,
  BotWorkflowStatusOptions,
  BotWorkflowStatusPolicy,
  BotWorkflowStatusSink,
  TelegramLikeBotPayload,
} from "@timeline-studio/core/types"

export interface BotWorkflowCommandOptions {
  statusFile?: string
  pretty?: boolean
  pollInterval?: string
  timeout?: string
  telegramBotToken?: string
  sendStatusUpdates?: boolean
  statusChatId?: string
  statusMinInterval?: string
  statusMinProgressDelta?: string
  mediaDir?: string
  downloadRemoteMedia?: boolean
  rustRender?: boolean
  rustRenderCommand?: string
  rustRenderKind?: "timeline" | "timeline-render"
  defaultDestination?: BotRenderJobDestination
  defaultOutput?: string
}

export const botWorkflowCommand = new Command("bot-workflow")
  .description("Run a bot-first workflow from Telegram-like JSON")
  .argument("<payload>", "Path to Telegram-like bot payload JSON")
  .option("--status-file <path>", "Write final workflow result JSON to a file")
  .option("--pretty", "Pretty-print JSON output")
  .option("--poll-interval <ms>", "Render polling interval in milliseconds", "1000")
  .option("--timeout <ms>", "Render timeout in milliseconds", "3600000")
  .option("--telegram-bot-token <token>", "Resolve Telegram file ids through the Telegram Bot API")
  .option("--send-status-updates", "Send workflow status updates through the Telegram Bot API")
  .option("--status-chat-id <id>", "Fallback Telegram chat id for status updates")
  .option("--status-min-interval <ms>", "Minimum interval between repeated rendering status messages")
  .option("--status-min-progress-delta <percent>", "Minimum progress delta between rendering status messages")
  .option("--media-dir <path>", "Directory for resolved bot media downloads")
  .option("--download-remote-media", "Download remote URL media before rendering")
  .option("--rust-render", "Run rendering through the Rust headless ts-render CLI")
  .option("--rust-render-command <path>", "Path/name for timeline or timeline-render command")
  .option("--rust-render-kind <kind>", "Rust render command kind: timeline or timeline-render")
  .option("--default-destination <destination>", "Fallback destination when payload has no destination hint")
  .option("--default-output <path>", "Fallback output path when payload has no output hint")
  .action(async (payloadFile: string, options: BotWorkflowCommandOptions) => {
    try {
      const result = await runBotWorkflowPayloadFile(payloadFile, options)
      const serialized = serializeBotWorkflowRunResult(result, options.pretty)

      if (options.statusFile) {
        await fs.writeFile(path.resolve(options.statusFile), `${serialized}\n`)
      }

      process.stdout.write(`${serialized}\n`)
      if (!result.ok || result.result.job.status === "failed" || result.result.job.status === "cancelled") {
        process.exit(1)
      }
    } catch (error) {
      const failed = createFailedBotWorkflowResult(error)
      const serialized = serializeBotWorkflowRunResult(failed, options.pretty)
      process.stderr.write(`${serialized}\n`)
      process.exit(1)
    }
  })

export async function runBotWorkflowPayloadFile(
  payloadFile: string,
  options: BotWorkflowCommandOptions = {},
): Promise<BotWorkflowRunResult> {
  const payload = await readTelegramLikeBotPayload(payloadFile)
  const botMediaResolver = createBotMediaResolverOptions(options)
  const botStatus = createBotStatusOptions(options)
  const services = await initNodeApp({
    autoConnect: false,
    botMediaResolver,
    botStatus,
    rustRender: options.rustRender
      ? {
          command: options.rustRenderCommand,
          commandKind: options.rustRenderKind,
        }
      : undefined,
  })

  const workflowStatus = createBotWorkflowStatusOptions(services.botStatus, options)
  return services.botWorkflow.runTelegramLikePayload(payload, {
    intake: {
      defaultDestination: options.defaultDestination,
      defaultOutputPath: options.defaultOutput,
    },
    render: {
      pollIntervalMs: parsePositiveInteger(options.pollInterval, 1000),
      timeoutMs: parsePositiveInteger(options.timeout, 3600000),
    },
    ...(workflowStatus ? { status: workflowStatus } : {}),
    includeReconnectState: true,
  })
}

function createBotMediaResolverOptions(options: BotWorkflowCommandOptions) {
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

function createBotStatusOptions(options: BotWorkflowCommandOptions) {
  if (!options.sendStatusUpdates || !options.telegramBotToken) {
    return undefined
  }

  return {
    telegram: {
      botToken: options.telegramBotToken,
      ...(options.statusChatId ? { defaultChatId: options.statusChatId } : {}),
    },
  }
}

function createBotWorkflowStatusOptions(
  sink: BotWorkflowStatusSink | undefined,
  options: BotWorkflowCommandOptions,
): BotWorkflowStatusOptions | undefined {
  if (!sink) return undefined
  const policy = createBotWorkflowStatusPolicy(options)
  return {
    sink,
    ...(policy ? { policy } : {}),
  }
}

function createBotWorkflowStatusPolicy(options: BotWorkflowCommandOptions): BotWorkflowStatusPolicy | undefined {
  const minIntervalMs = parseOptionalNonNegativeNumber(
    firstConfigured(options.statusMinInterval, process.env.TIMELINE_BOT_STATUS_MIN_INTERVAL),
  )
  const minProgressDelta = parseOptionalNonNegativeNumber(
    firstConfigured(options.statusMinProgressDelta, process.env.TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA),
  )

  if (minIntervalMs === undefined && minProgressDelta === undefined) return undefined
  return {
    ...(minIntervalMs !== undefined ? { minIntervalMs } : {}),
    ...(minProgressDelta !== undefined ? { minProgressDelta } : {}),
  }
}

export async function readTelegramLikeBotPayload(payloadFile: string): Promise<TelegramLikeBotPayload> {
  const payloadPath = path.resolve(payloadFile)
  const content = await fs.readFile(payloadPath, "utf-8")
  const parsed = JSON.parse(content) as TelegramLikeBotPayload

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Bot workflow payload JSON must be an object")
  }

  return parsed
}

export function serializeBotWorkflowRunResult(result: BotWorkflowRunResult, pretty = false): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}

function createFailedBotWorkflowResult(error: unknown): BotWorkflowRunResult {
  const message = error instanceof Error ? error.message : String(error)
  return {
    ok: false,
    workflow: {
      source: "telegram",
    },
    errors: [
      {
        code: "missing_input",
        field: "payload",
        message,
        userMessage: "Could not read the bot request. Send the payload again.",
      },
    ],
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseOptionalNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function firstConfigured<T extends string>(...values: Array<T | undefined>): T | undefined {
  return values.find((value): value is T => value !== undefined && value.trim().length > 0)
}
