import fs from "node:fs/promises"
import path from "node:path"

import type { BotRenderJobArtifact, BotRenderJobStatus, BotWorkflowRequest, TelegramLikeBotPayload } from "@/core/types"

export type NodeTelegramBotWorkflowJobStatus = "queued" | "running" | "done" | "failed" | "rejected" | "cancelled"

export interface NodeTelegramBotWorkflowJobRecord {
  id: string
  status: NodeTelegramBotWorkflowJobStatus
  updateId: number
  createdAt: string
  updatedAt: string
  chatId?: string
  userId?: string
  messageId?: string
  draftId?: string
  reason?: string
  error?: string
  renderJobId?: string
  renderJobStatus?: BotRenderJobStatus
  artifact?: BotRenderJobArtifact
  sourcePayload?: TelegramLikeBotPayload
  sourceWorkflow?: BotWorkflowRequest
  retryOf?: string
}

export interface NodeTelegramBotWorkflowJobQuery {
  chatId?: string
  limit?: number
}

export interface NodeTelegramBotWorkflowJobStore {
  readJob(id: string): Promise<NodeTelegramBotWorkflowJobRecord | undefined>
  writeJob(record: NodeTelegramBotWorkflowJobRecord): Promise<void>
  listJobs(query?: NodeTelegramBotWorkflowJobQuery): Promise<NodeTelegramBotWorkflowJobRecord[]>
}

export interface RecoverStaleTelegramWorkflowJobsOptions {
  now?: () => string
  reason?: string
  error?: string
}

export interface RecoverStaleTelegramWorkflowJobsResult {
  recoveredJobs: NodeTelegramBotWorkflowJobRecord[]
}

export interface NodeTelegramBotFileWorkflowJobStoreOptions {
  maxJobs?: number
}

export interface NodeTelegramBotFileWorkflowJobStoreState {
  jobs: NodeTelegramBotWorkflowJobRecord[]
  updatedAt: string
}

export class NodeTelegramBotInMemoryWorkflowJobStore implements NodeTelegramBotWorkflowJobStore {
  private readonly jobs = new Map<string, NodeTelegramBotWorkflowJobRecord>()

  async readJob(id: string): Promise<NodeTelegramBotWorkflowJobRecord | undefined> {
    return this.jobs.get(id)
  }

  async writeJob(record: NodeTelegramBotWorkflowJobRecord): Promise<void> {
    this.jobs.set(record.id, record)
  }

  async listJobs(query: NodeTelegramBotWorkflowJobQuery = {}): Promise<NodeTelegramBotWorkflowJobRecord[]> {
    return filterAndLimitJobs([...this.jobs.values()], query)
  }
}

export class NodeTelegramBotFileWorkflowJobStore implements NodeTelegramBotWorkflowJobStore {
  private readonly maxJobs: number
  private writeChain: Promise<void> = Promise.resolve()

  constructor(
    private readonly filePath: string,
    options: NodeTelegramBotFileWorkflowJobStoreOptions = {},
  ) {
    this.maxJobs = Math.max(1, Math.trunc(options.maxJobs ?? 100))
  }

  async readJob(id: string): Promise<NodeTelegramBotWorkflowJobRecord | undefined> {
    await this.writeChain
    const state = await this.readState()
    return state.jobs.find((job) => job.id === id)
  }

  async writeJob(record: NodeTelegramBotWorkflowJobRecord): Promise<void> {
    const nextWrite = this.writeChain.then(() => this.writeJobUnlocked(record))
    this.writeChain = nextWrite.catch(() => undefined)
    await nextWrite
  }

  async listJobs(query: NodeTelegramBotWorkflowJobQuery = {}): Promise<NodeTelegramBotWorkflowJobRecord[]> {
    await this.writeChain
    const state = await this.readState()
    return filterAndLimitJobs(state.jobs, query)
  }

  private async writeJobUnlocked(record: NodeTelegramBotWorkflowJobRecord): Promise<void> {
    const state = await this.readState()
    const jobs = [record, ...state.jobs.filter((job) => job.id !== record.id)]
      .sort(compareJobRecords)
      .slice(0, this.maxJobs)

    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(
      this.filePath,
      `${JSON.stringify(
        {
          jobs,
          updatedAt: new Date().toISOString(),
        } satisfies NodeTelegramBotFileWorkflowJobStoreState,
        null,
        2,
      )}\n`,
    )
  }

  private async readState(): Promise<NodeTelegramBotFileWorkflowJobStoreState> {
    let content: string
    try {
      content = await fs.readFile(this.filePath, "utf-8")
    } catch (error) {
      if (isNotFoundError(error)) {
        return {
          jobs: [],
          updatedAt: new Date(0).toISOString(),
        }
      }
      throw error
    }

    const parsed = JSON.parse(content) as Partial<NodeTelegramBotFileWorkflowJobStoreState>
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs.filter(isWorkflowJobRecord) : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
    }
  }
}

export async function recoverStaleTelegramWorkflowJobs(
  store: NodeTelegramBotWorkflowJobStore,
  options: RecoverStaleTelegramWorkflowJobsOptions = {},
): Promise<RecoverStaleTelegramWorkflowJobsResult> {
  const timestamp = options.now?.() ?? new Date().toISOString()
  const reason = options.reason ?? "Telegram bot workflow recovered after worker restart"
  const error = options.error ?? "Workflow was interrupted before completion. Send /retry <queueId> to run it again."
  const jobs = await store.listJobs()
  const recoveredJobs: NodeTelegramBotWorkflowJobRecord[] = []

  for (const job of jobs) {
    if (!isRecoverableStaleWorkflowJobStatus(job.status)) continue

    const recoveredJob: NodeTelegramBotWorkflowJobRecord = {
      ...job,
      status: "failed",
      reason,
      error,
      updatedAt: timestamp,
    }
    await store.writeJob(recoveredJob)
    recoveredJobs.push(recoveredJob)
  }

  return { recoveredJobs }
}

function filterAndLimitJobs(
  jobs: NodeTelegramBotWorkflowJobRecord[],
  query: NodeTelegramBotWorkflowJobQuery,
): NodeTelegramBotWorkflowJobRecord[] {
  const filtered = query.chatId ? jobs.filter((job) => job.chatId === query.chatId) : jobs
  const limit = query.limit === undefined ? undefined : Math.max(0, Math.trunc(query.limit))
  const sorted = [...filtered].sort(compareJobRecords)
  return limit === undefined ? sorted : sorted.slice(0, limit)
}

function compareJobRecords(a: NodeTelegramBotWorkflowJobRecord, b: NodeTelegramBotWorkflowJobRecord): number {
  const updatedDiff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  if (Number.isFinite(updatedDiff) && updatedDiff !== 0) return updatedDiff
  if (b.updateId !== a.updateId) return b.updateId - a.updateId
  return b.id.localeCompare(a.id)
}

function isWorkflowJobRecord(value: unknown): value is NodeTelegramBotWorkflowJobRecord {
  if (typeof value !== "object" || value === null) return false
  const record = value as Partial<NodeTelegramBotWorkflowJobRecord>
  return (
    typeof record.id === "string" &&
    typeof record.updateId === "number" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    isWorkflowJobStatus(record.status)
  )
}

function isWorkflowJobStatus(value: unknown): value is NodeTelegramBotWorkflowJobStatus {
  return (
    value === "queued" ||
    value === "running" ||
    value === "done" ||
    value === "failed" ||
    value === "rejected" ||
    value === "cancelled"
  )
}

function isRecoverableStaleWorkflowJobStatus(status: NodeTelegramBotWorkflowJobStatus): boolean {
  return status === "queued" || status === "running"
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
