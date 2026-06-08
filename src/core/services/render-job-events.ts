import type {
  BotRenderJob,
  BotRenderJobEvent,
  BotRenderJobEventQuery,
  BotRenderJobEventSink,
  BotRenderJobEventStreamOptions,
  BotRenderJobReconnectState,
  BotRenderJobRequest,
  BotRenderJobSnapshot,
  BotRenderJobStatus,
} from "../types"

const TERMINAL_STATUSES = new Set<BotRenderJobStatus>(["done", "failed", "cancelled"])
const RETRYABLE_STATUSES = new Set<BotRenderJobStatus>(["failed", "cancelled"])

export interface BotRenderJobRetryOptions {
  attempt?: number
  outputPath?: string
}

export function createBotRenderJobSnapshot(job: BotRenderJob): BotRenderJobSnapshot {
  return {
    jobId: job.id,
    ...(job.providerJobId ? { providerJobId: job.providerJobId } : {}),
    status: job.status,
    progress: job.progress,
    ...(job.artifact ? { artifact: job.artifact } : {}),
    ...(job.error ? { error: job.error } : {}),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    eventCount: job.events.length,
    ...(job.events.length > 0 ? { lastEvent: job.events.at(-1) } : {}),
    canCancel: canCancelBotRenderJob(job.status),
    canRetry: canRetryBotRenderJob(job.status),
  }
}

export function canCancelBotRenderJob(status: BotRenderJobStatus): boolean {
  return !TERMINAL_STATUSES.has(status)
}

export function canRetryBotRenderJob(status: BotRenderJobStatus): boolean {
  return RETRYABLE_STATUSES.has(status)
}

export function createBotRenderJobRetryRequest(
  job: BotRenderJob,
  options: BotRenderJobRetryOptions = {},
): BotRenderJobRequest {
  if (!canRetryBotRenderJob(job.status)) {
    throw new Error(`Render job ${job.id} cannot be retried from status ${job.status}`)
  }

  const previousAttempt =
    typeof job.request.params?.retryAttempt === "number" ? Number(job.request.params.retryAttempt) : 0
  const retryAttempt = options.attempt ?? previousAttempt + 1

  return {
    ...job.request,
    output: {
      ...job.request.output,
      ...(options.outputPath ? { path: options.outputPath } : {}),
    },
    params: {
      ...job.request.params,
      retryOf: job.id,
      retryAttempt,
    },
  }
}

export class InMemoryBotRenderJobEventStream implements BotRenderJobEventSink {
  private snapshots = new Map<string, BotRenderJobSnapshot>()
  private events = new Map<string, BotRenderJobEvent[]>()
  private maxEventsPerJob: number

  constructor(options: BotRenderJobEventStreamOptions = {}) {
    this.maxEventsPerJob = options.maxEventsPerJob ?? 200
  }

  publish(event: BotRenderJobEvent, snapshot: BotRenderJobSnapshot): void {
    const events = this.events.get(event.jobId) ?? []
    events.push(event)

    if (events.length > this.maxEventsPerJob) {
      events.splice(0, events.length - this.maxEventsPerJob)
    }

    this.events.set(event.jobId, events)
    this.snapshots.set(snapshot.jobId, snapshot)
  }

  publishSnapshot(snapshot: BotRenderJobSnapshot): void {
    this.snapshots.set(snapshot.jobId, snapshot)
  }

  getSnapshot(jobId: string): BotRenderJobSnapshot | null {
    return this.snapshots.get(jobId) ?? null
  }

  getEvents(jobId: string, query: BotRenderJobEventQuery = {}): BotRenderJobEvent[] {
    const events = this.events.get(jobId) ?? []
    const afterSequence = query.afterSequence
    const filtered =
      typeof afterSequence === "number" ? events.filter((event) => event.sequence > afterSequence) : events

    return typeof query.limit === "number" && query.limit >= 0 ? filtered.slice(0, query.limit) : [...filtered]
  }

  getReconnectState(jobId: string, query: BotRenderJobEventQuery = {}): BotRenderJobReconnectState {
    return {
      snapshot: this.getSnapshot(jobId),
      events: this.getEvents(jobId, query),
    }
  }

  clearJob(jobId: string): void {
    this.snapshots.delete(jobId)
    this.events.delete(jobId)
  }
}
