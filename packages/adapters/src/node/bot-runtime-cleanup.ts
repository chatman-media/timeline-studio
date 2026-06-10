import fs from "node:fs/promises"
import path from "node:path"

import { type BotEditSession, type BotEditSessionStatus, type BotWorkflowDraft, isBotEditSessionActive } from "@timeline-studio/core"

export type NodeBotRuntimeCleanupCategory =
  | "media"
  | "review_previews"
  | "first_cut"
  | "drafts"
  | "jobs"
  | "edit_sessions"

export type NodeBotRuntimeCleanupAction = "would_delete" | "deleted" | "preserved" | "error"

export interface NodeBotRuntimeCleanupDirectoryPolicy {
  directory: string
  retentionMs: number
}

export interface NodeBotRuntimeCleanupJobStorePolicy {
  filePath: string
  retentionMs: number
}

export interface NodeBotRuntimeCleanupOptions {
  dryRun?: boolean
  now?: Date | string | number
  media?: NodeBotRuntimeCleanupDirectoryPolicy
  reviewPreviews?: NodeBotRuntimeCleanupDirectoryPolicy
  firstCut?: NodeBotRuntimeCleanupDirectoryPolicy
  drafts?: NodeBotRuntimeCleanupDirectoryPolicy
  jobStore?: NodeBotRuntimeCleanupJobStorePolicy
  editSessions?: NodeBotRuntimeCleanupDirectoryPolicy
}

export interface NodeBotRuntimeCleanupItem {
  category: NodeBotRuntimeCleanupCategory
  path: string
  action: NodeBotRuntimeCleanupAction
  reason: string
  id?: string
  status?: string
  observedAt?: string
  cutoffAt?: string
  ageMs?: number
  bytes?: number
  error?: string
}

export interface NodeBotRuntimeCleanupSummary {
  scanned: number
  eligible: number
  deleted: number
  preserved: number
  errors: number
}

export interface NodeBotRuntimeCleanupResult {
  ok: boolean
  dryRun: boolean
  now: string
  summary: NodeBotRuntimeCleanupSummary
  items: NodeBotRuntimeCleanupItem[]
}

type FileEligibilitySource = "mtime" | "updatedAt" | "terminalAt"

interface JobStoreState {
  jobs?: unknown[]
  updatedAt?: unknown
  [key: string]: unknown
}

interface JobRecordLike {
  id: string
  status: string
  updatedAt?: string
  createdAt?: string
}

export async function cleanupNodeBotRuntime(
  options: NodeBotRuntimeCleanupOptions,
): Promise<NodeBotRuntimeCleanupResult> {
  const now = normalizeNow(options.now)
  const dryRun = options.dryRun ?? true
  const result = createResult(now, dryRun)

  if (options.media) {
    await cleanupAgedFiles(result, "media", options.media, now, dryRun)
  }

  if (options.reviewPreviews) {
    await cleanupAgedFiles(result, "review_previews", options.reviewPreviews, now, dryRun)
  }

  if (options.firstCut) {
    await cleanupAgedFiles(result, "first_cut", options.firstCut, now, dryRun)
  }

  if (options.drafts) {
    await cleanupDrafts(result, options.drafts, now, dryRun)
  }

  if (options.jobStore) {
    await cleanupJobStore(result, options.jobStore, now, dryRun)
  }

  if (options.editSessions) {
    await cleanupEditSessions(result, options.editSessions, now, dryRun)
  }

  result.ok = result.summary.errors === 0
  return result
}

async function cleanupAgedFiles(
  result: NodeBotRuntimeCleanupResult,
  category: NodeBotRuntimeCleanupCategory,
  policy: NodeBotRuntimeCleanupDirectoryPolicy,
  now: Date,
  dryRun: boolean,
): Promise<void> {
  for await (const filePath of walkFiles(path.resolve(policy.directory))) {
    try {
      const stats = await fs.stat(filePath)
      await addFileExpirationItem(result, {
        category,
        filePath,
        observedMs: stats.mtimeMs,
        cutoffMs: now.getTime() - policy.retentionMs,
        nowMs: now.getTime(),
        bytes: stats.size,
        source: "mtime",
        dryRun,
      })
    } catch (error) {
      addItem(result, {
        category,
        path: filePath,
        action: "error",
        reason: "stat_failed",
        error: stringifyError(error),
      })
    }
  }
}

async function cleanupDrafts(
  result: NodeBotRuntimeCleanupResult,
  policy: NodeBotRuntimeCleanupDirectoryPolicy,
  now: Date,
  dryRun: boolean,
): Promise<void> {
  for await (const filePath of walkFiles(path.resolve(policy.directory))) {
    if (!filePath.endsWith(".json")) continue

    const draft = await readJsonFile<BotWorkflowDraft>(filePath)
    if (!draft.ok) {
      addItem(result, {
        category: "drafts",
        path: filePath,
        action: "preserved",
        reason: draft.reason,
        error: draft.error,
      })
      continue
    }

    if (!isBotWorkflowDraft(draft.value)) {
      addItem(result, {
        category: "drafts",
        path: filePath,
        action: "preserved",
        reason: "invalid_draft_json",
      })
      continue
    }

    const updatedMs = parseTimestamp(draft.value.updatedAt)
    if (updatedMs === undefined) {
      addItem(result, {
        category: "drafts",
        path: filePath,
        action: "preserved",
        reason: "invalid_draft_updated_at",
        id: draft.value.id,
      })
      continue
    }

    await addFileExpirationItem(result, {
      category: "drafts",
      filePath,
      id: draft.value.id,
      observedMs: updatedMs,
      cutoffMs: now.getTime() - policy.retentionMs,
      nowMs: now.getTime(),
      source: "updatedAt",
      dryRun,
    })
  }
}

async function cleanupEditSessions(
  result: NodeBotRuntimeCleanupResult,
  policy: NodeBotRuntimeCleanupDirectoryPolicy,
  now: Date,
  dryRun: boolean,
): Promise<void> {
  for await (const filePath of walkFiles(path.resolve(policy.directory))) {
    if (!filePath.endsWith(".json")) continue

    const session = await readJsonFile<BotEditSession>(filePath)
    if (!session.ok) {
      addItem(result, {
        category: "edit_sessions",
        path: filePath,
        action: "preserved",
        reason: session.reason,
        error: session.error,
      })
      continue
    }

    if (!isBotEditSession(session.value)) {
      addItem(result, {
        category: "edit_sessions",
        path: filePath,
        action: "preserved",
        reason: "invalid_edit_session_json",
      })
      continue
    }

    const status = session.value.status
    if (isBotEditSessionActive(status as BotEditSessionStatus)) {
      addItem(result, {
        category: "edit_sessions",
        path: filePath,
        action: "preserved",
        reason: "active_edit_session",
        id: session.value.id,
        status,
      })
      continue
    }

    if (!isTerminalEditSessionStatus(status)) {
      addItem(result, {
        category: "edit_sessions",
        path: filePath,
        action: "preserved",
        reason: "unknown_edit_session_status",
        id: session.value.id,
        status,
      })
      continue
    }

    const terminalMs = readTerminalEditSessionTimestamp(session.value)
    if (terminalMs === undefined) {
      addItem(result, {
        category: "edit_sessions",
        path: filePath,
        action: "preserved",
        reason: "invalid_edit_session_terminal_at",
        id: session.value.id,
        status,
      })
      continue
    }

    await addFileExpirationItem(result, {
      category: "edit_sessions",
      filePath,
      id: session.value.id,
      status,
      observedMs: terminalMs,
      cutoffMs: now.getTime() - policy.retentionMs,
      nowMs: now.getTime(),
      source: "terminalAt",
      dryRun,
    })
  }
}

async function cleanupJobStore(
  result: NodeBotRuntimeCleanupResult,
  policy: NodeBotRuntimeCleanupJobStorePolicy,
  now: Date,
  dryRun: boolean,
): Promise<void> {
  const filePath = path.resolve(policy.filePath)
  let content: string
  try {
    content = await fs.readFile(filePath, "utf-8")
  } catch (error) {
    if (isNotFoundError(error)) return
    addItem(result, {
      category: "jobs",
      path: filePath,
      action: "error",
      reason: "job_store_read_failed",
      error: stringifyError(error),
    })
    return
  }

  let state: JobStoreState
  try {
    state = JSON.parse(content) as JobStoreState
  } catch (error) {
    addItem(result, {
      category: "jobs",
      path: filePath,
      action: "error",
      reason: "invalid_job_store_json",
      error: stringifyError(error),
    })
    return
  }

  if (!Array.isArray(state.jobs)) {
    addItem(result, {
      category: "jobs",
      path: filePath,
      action: "error",
      reason: "invalid_job_store_jobs",
    })
    return
  }

  const retainedJobs: unknown[] = []
  let removed = false

  for (const job of state.jobs) {
    if (!isJobRecordLike(job)) {
      retainedJobs.push(job)
      addItem(result, {
        category: "jobs",
        path: filePath,
        action: "preserved",
        reason: "invalid_job_record",
      })
      continue
    }

    if (isActiveJobStatus(job.status)) {
      retainedJobs.push(job)
      addItem(result, {
        category: "jobs",
        path: filePath,
        action: "preserved",
        reason: "active_job",
        id: job.id,
        status: job.status,
      })
      continue
    }

    if (!isTerminalJobStatus(job.status)) {
      retainedJobs.push(job)
      addItem(result, {
        category: "jobs",
        path: filePath,
        action: "preserved",
        reason: "unknown_job_status",
        id: job.id,
        status: job.status,
      })
      continue
    }

    const observedMs = parseTimestamp(job.updatedAt) ?? parseTimestamp(job.createdAt)
    if (observedMs === undefined) {
      retainedJobs.push(job)
      addItem(result, {
        category: "jobs",
        path: filePath,
        action: "preserved",
        reason: "invalid_job_updated_at",
        id: job.id,
        status: job.status,
      })
      continue
    }

    const eligible = observedMs < now.getTime() - policy.retentionMs
    if (!eligible) {
      retainedJobs.push(job)
      addItem(result, {
        category: "jobs",
        path: filePath,
        action: "preserved",
        reason: "job_within_retention",
        id: job.id,
        status: job.status,
        observedAt: new Date(observedMs).toISOString(),
        cutoffAt: new Date(now.getTime() - policy.retentionMs).toISOString(),
        ageMs: Math.max(0, now.getTime() - observedMs),
      })
      continue
    }

    if (dryRun) {
      retainedJobs.push(job)
    } else {
      removed = true
    }

    addItem(result, {
      category: "jobs",
      path: filePath,
      action: dryRun ? "would_delete" : "deleted",
      reason: "job_expired",
      id: job.id,
      status: job.status,
      observedAt: new Date(observedMs).toISOString(),
      cutoffAt: new Date(now.getTime() - policy.retentionMs).toISOString(),
      ageMs: Math.max(0, now.getTime() - observedMs),
    })
  }

  if (!dryRun && removed) {
    await fs.writeFile(
      filePath,
      `${JSON.stringify(
        {
          ...state,
          jobs: retainedJobs,
          updatedAt: now.toISOString(),
        },
        null,
        2,
      )}\n`,
    )
  }
}

async function addFileExpirationItem(
  result: NodeBotRuntimeCleanupResult,
  options: {
    category: NodeBotRuntimeCleanupCategory
    filePath: string
    observedMs: number
    cutoffMs: number
    nowMs: number
    source: FileEligibilitySource
    dryRun: boolean
    id?: string
    status?: string
    bytes?: number
  },
): Promise<void> {
  const eligible = options.observedMs < options.cutoffMs
  if (eligible && !options.dryRun) {
    try {
      await fs.rm(options.filePath, { force: true })
    } catch (error) {
      addItem(result, {
        category: options.category,
        path: options.filePath,
        action: "error",
        reason: "delete_failed",
        ...(options.id ? { id: options.id } : {}),
        ...(options.status ? { status: options.status } : {}),
        observedAt: new Date(options.observedMs).toISOString(),
        cutoffAt: new Date(options.cutoffMs).toISOString(),
        ageMs: Math.max(0, options.nowMs - options.observedMs),
        ...(options.bytes !== undefined ? { bytes: options.bytes } : {}),
        error: stringifyError(error),
      })
      return
    }
  }

  addItem(result, {
    category: options.category,
    path: options.filePath,
    action: eligible ? (options.dryRun ? "would_delete" : "deleted") : "preserved",
    reason: eligible ? `${options.source}_expired` : `${options.source}_within_retention`,
    ...(options.id ? { id: options.id } : {}),
    ...(options.status ? { status: options.status } : {}),
    observedAt: new Date(options.observedMs).toISOString(),
    cutoffAt: new Date(options.cutoffMs).toISOString(),
    ageMs: Math.max(0, options.nowMs - options.observedMs),
    ...(options.bytes !== undefined ? { bytes: options.bytes } : {}),
  })
}

function addItem(result: NodeBotRuntimeCleanupResult, item: NodeBotRuntimeCleanupItem): void {
  result.items.push(item)
  result.summary.scanned += 1

  switch (item.action) {
    case "would_delete":
      result.summary.eligible += 1
      return
    case "deleted":
      result.summary.eligible += 1
      result.summary.deleted += 1
      return
    case "preserved":
      result.summary.preserved += 1
      return
    case "error":
      result.summary.errors += 1
      return
  }
}

async function* walkFiles(directory: string): AsyncGenerator<string> {
  let entries: Array<import("node:fs").Dirent>
  try {
    entries = await fs.readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (isNotFoundError(error)) return
    throw error
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath)
      continue
    }

    if (entry.isFile()) {
      yield fullPath
    }
  }
}

async function readJsonFile<T>(
  filePath: string,
): Promise<{ ok: true; value: T } | { ok: false; reason: string; error?: string }> {
  let content: string
  try {
    content = await fs.readFile(filePath, "utf-8")
  } catch (error) {
    return {
      ok: false,
      reason: "json_read_failed",
      error: stringifyError(error),
    }
  }

  try {
    return {
      ok: true,
      value: JSON.parse(content) as T,
    }
  } catch (error) {
    return {
      ok: false,
      reason: "invalid_json",
      error: stringifyError(error),
    }
  }
}

function createResult(now: Date, dryRun: boolean): NodeBotRuntimeCleanupResult {
  return {
    ok: true,
    dryRun,
    now: now.toISOString(),
    summary: {
      scanned: 0,
      eligible: 0,
      deleted: 0,
      preserved: 0,
      errors: 0,
    },
    items: [],
  }
}

function normalizeNow(value: Date | string | number | undefined): Date {
  const date = value === undefined ? new Date() : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid cleanup timestamp: ${String(value)}`)
  }
  return date
}

function parseTimestamp(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function readTerminalEditSessionTimestamp(session: BotEditSession): number | undefined {
  switch (session.status) {
    case "done":
      return parseTimestamp(session.publishedAt) ?? parseTimestamp(session.updatedAt)
    case "cancelled":
      return parseTimestamp(session.cancelledAt) ?? parseTimestamp(session.updatedAt)
    case "failed":
      return parseTimestamp(session.failedAt) ?? parseTimestamp(session.updatedAt)
    default:
      return undefined
  }
}

function isBotWorkflowDraft(value: unknown): value is BotWorkflowDraft {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "workflow" in value &&
    typeof value.workflow === "object" &&
    value.workflow !== null &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  )
}

function isBotEditSession(value: unknown): value is BotEditSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  )
}

function isJobRecordLike(value: unknown): value is JobRecordLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "status" in value &&
    typeof value.status === "string"
  )
}

function isActiveJobStatus(value: string): boolean {
  return value === "queued" || value === "running"
}

function isTerminalJobStatus(value: string): boolean {
  return value === "done" || value === "failed" || value === "rejected" || value === "cancelled"
}

function isTerminalEditSessionStatus(value: string): value is "done" | "cancelled" | "failed" {
  return value === "done" || value === "cancelled" || value === "failed"
}

function stringifyError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
