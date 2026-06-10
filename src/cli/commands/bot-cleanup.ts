/**
 * Telegram bot runtime cleanup command.
 *
 * Removes expired bot runtime artifacts after a safe dry-run preview.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"

import {
  cleanupNodeBotRuntime,
  type NodeBotRuntimeCleanupOptions,
  type NodeBotRuntimeCleanupResult,
} from "@/adapters/node"

const DAY_MS = 24 * 60 * 60 * 1000

const DEFAULT_MEDIA_RETENTION_MS = 7 * DAY_MS
const DEFAULT_REVIEW_PREVIEW_RETENTION_MS = 7 * DAY_MS
const DEFAULT_FIRST_CUT_RETENTION_MS = DAY_MS
const DEFAULT_DRAFT_RETENTION_MS = 14 * DAY_MS
const DEFAULT_JOB_RETENTION_MS = 30 * DAY_MS
const DEFAULT_EDIT_SESSION_RETENTION_MS = 30 * DAY_MS

export interface BotCleanupCommandOptions {
  statusFile?: string
  pretty?: boolean
  dryRun?: boolean
  delete?: boolean
  now?: string
  mediaDir?: string
  mediaRetention?: string
  reviewPreviewDir?: string
  reviewPreviewRetention?: string
  firstCutPlannerTempDir?: string
  firstCutRetention?: string
  draftDir?: string
  draftRetention?: string
  jobStoreFile?: string
  jobRetention?: string
  editSessionDir?: string
  editSessionRetention?: string
}

export const botCleanupCommand = new Command("bot-cleanup")
  .description("Clean up expired Telegram bot runtime files and records")
  .option("--status-file <path>", "Write cleanup result JSON to a file")
  .option("--pretty", "Pretty-print JSON output")
  .option("--dry-run", "Only report cleanup candidates without deleting anything")
  .option("--delete", "Delete eligible runtime artifacts; defaults to dry-run without this flag")
  .option("--now <iso>", "Override cleanup timestamp for reproducible dry-runs")
  .option("--media-dir <path>", "Directory for downloaded Telegram/remote media")
  .option("--media-retention <duration>", "Retention for downloaded media, for example 7d or 168h")
  .option("--review-preview-dir <path>", "Directory for rendered Telegram AI review previews")
  .option("--review-preview-retention <duration>", "Retention for review previews")
  .option("--first-cut-planner-temp-dir <path>", "Directory for Rust first-cut planner temp files")
  .option("--first-cut-retention <duration>", "Retention for first-cut planner temp files")
  .option("--draft-dir <path>", "Directory for Telegram bot conversation drafts")
  .option("--draft-retention <duration>", "Retention for inactive drafts")
  .option("--job-store-file <path>", "Telegram workflow job status/history JSON file")
  .option("--job-retention <duration>", "Retention for terminal job records")
  .option("--edit-session-dir <path>", "Directory for Telegram AI review edit sessions")
  .option("--edit-session-retention <duration>", "Retention for terminal edit sessions")
  .action(async (options: BotCleanupCommandOptions) => {
    try {
      const result = await runBotCleanup(options)
      const serialized = serializeBotCleanupResult(result, options.pretty)

      if (options.statusFile) {
        await fs.writeFile(path.resolve(options.statusFile), `${serialized}\n`)
      }

      process.stdout.write(`${serialized}\n`)
      if (!result.ok) {
        process.exit(1)
      }
    } catch (error) {
      const failed = serializeBotCleanupFailure(error, options.pretty)
      process.stderr.write(`${failed}\n`)
      process.exit(1)
    }
  })

export async function runBotCleanup(
  options: BotCleanupCommandOptions = {},
  env: Record<string, string | undefined> = process.env,
): Promise<NodeBotRuntimeCleanupResult> {
  const resolvedOptions = resolveBotCleanupCommandOptions(options, env)
  const cleanupOptions = createBotCleanupOptions(resolvedOptions)

  if (!hasCleanupPolicy(cleanupOptions)) {
    throw new Error("Configure at least one bot runtime cleanup path before running bot-cleanup")
  }

  return cleanupNodeBotRuntime(cleanupOptions)
}

export function resolveBotCleanupCommandOptions(
  options: BotCleanupCommandOptions,
  env: Record<string, string | undefined> = process.env,
): BotCleanupCommandOptions {
  const deleteEnabled = options.delete ?? parseBooleanEnv(env.TIMELINE_BOT_CLEANUP_DELETE)
  if (options.dryRun && deleteEnabled) {
    throw new Error("Use either --dry-run or --delete, not both")
  }

  return {
    ...options,
    dryRun: options.dryRun ?? !deleteEnabled,
    delete: deleteEnabled,
    mediaDir: firstConfigured(options.mediaDir, env.TIMELINE_BOT_MEDIA_DIR),
    mediaRetention: firstConfigured(options.mediaRetention, env.TIMELINE_BOT_CLEANUP_MEDIA_RETENTION),
    reviewPreviewDir: firstConfigured(options.reviewPreviewDir, env.TIMELINE_BOT_REVIEW_PREVIEW_DIR),
    reviewPreviewRetention: firstConfigured(
      options.reviewPreviewRetention,
      env.TIMELINE_BOT_CLEANUP_REVIEW_PREVIEW_RETENTION,
    ),
    firstCutPlannerTempDir: firstConfigured(
      options.firstCutPlannerTempDir,
      env.TIMELINE_BOT_FIRST_CUT_PLANNER_TEMP_DIR,
    ),
    firstCutRetention: firstConfigured(options.firstCutRetention, env.TIMELINE_BOT_CLEANUP_FIRST_CUT_RETENTION),
    draftDir: firstConfigured(options.draftDir, env.TIMELINE_BOT_DRAFT_DIR),
    draftRetention: firstConfigured(options.draftRetention, env.TIMELINE_BOT_CLEANUP_DRAFT_RETENTION),
    jobStoreFile: firstConfigured(options.jobStoreFile, env.TIMELINE_BOT_JOB_STORE_FILE),
    jobRetention: firstConfigured(options.jobRetention, env.TIMELINE_BOT_CLEANUP_JOB_RETENTION),
    editSessionDir: firstConfigured(options.editSessionDir, env.TIMELINE_BOT_EDIT_SESSION_DIR),
    editSessionRetention: firstConfigured(
      options.editSessionRetention,
      env.TIMELINE_BOT_CLEANUP_EDIT_SESSION_RETENTION,
    ),
  }
}

export function serializeBotCleanupResult(result: NodeBotRuntimeCleanupResult, pretty = false): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}

function createBotCleanupOptions(options: BotCleanupCommandOptions): NodeBotRuntimeCleanupOptions {
  return {
    dryRun: options.dryRun ?? true,
    ...(options.now ? { now: options.now } : {}),
    ...(options.mediaDir
      ? {
          media: {
            directory: path.resolve(options.mediaDir),
            retentionMs: parseRetentionMs(options.mediaRetention, DEFAULT_MEDIA_RETENTION_MS),
          },
        }
      : {}),
    ...(options.reviewPreviewDir
      ? {
          reviewPreviews: {
            directory: path.resolve(options.reviewPreviewDir),
            retentionMs: parseRetentionMs(options.reviewPreviewRetention, DEFAULT_REVIEW_PREVIEW_RETENTION_MS),
          },
        }
      : {}),
    ...(options.firstCutPlannerTempDir
      ? {
          firstCut: {
            directory: path.resolve(options.firstCutPlannerTempDir),
            retentionMs: parseRetentionMs(options.firstCutRetention, DEFAULT_FIRST_CUT_RETENTION_MS),
          },
        }
      : {}),
    ...(options.draftDir
      ? {
          drafts: {
            directory: path.resolve(options.draftDir),
            retentionMs: parseRetentionMs(options.draftRetention, DEFAULT_DRAFT_RETENTION_MS),
          },
        }
      : {}),
    ...(options.jobStoreFile
      ? {
          jobStore: {
            filePath: path.resolve(options.jobStoreFile),
            retentionMs: parseRetentionMs(options.jobRetention, DEFAULT_JOB_RETENTION_MS),
          },
        }
      : {}),
    ...(options.editSessionDir
      ? {
          editSessions: {
            directory: path.resolve(options.editSessionDir),
            retentionMs: parseRetentionMs(options.editSessionRetention, DEFAULT_EDIT_SESSION_RETENTION_MS),
          },
        }
      : {}),
  }
}

function hasCleanupPolicy(options: NodeBotRuntimeCleanupOptions): boolean {
  return Boolean(
    options.media ||
      options.reviewPreviews ||
      options.firstCut ||
      options.drafts ||
      options.jobStore ||
      options.editSessions,
  )
}

function parseRetentionMs(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i)
  if (!match) {
    throw new Error(`Invalid retention duration: ${value}`)
  }

  const amount = Number.parseFloat(match[1])
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid retention duration: ${value}`)
  }

  switch ((match[2] ?? "ms").toLowerCase()) {
    case "ms":
      return amount
    case "s":
      return amount * 1000
    case "m":
      return amount * 60 * 1000
    case "h":
      return amount * 60 * 60 * 1000
    case "d":
      return amount * DAY_MS
    default:
      throw new Error(`Invalid retention duration: ${value}`)
  }
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

function serializeBotCleanupFailure(error: unknown, pretty = false): string {
  return JSON.stringify(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    null,
    pretty ? 2 : 0,
  )
}
