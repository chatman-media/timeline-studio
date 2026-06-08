import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import type { IRenderJobService, IVideoService, RenderJob as VideoRenderJob } from "@/core/ports"
import { createBotRenderJobSnapshot } from "@/core/services"
import type {
  BotRenderJob,
  BotRenderJobEvent,
  BotRenderJobEventSink,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
  BotRenderJobStatus,
} from "@/core/types"

export interface NodeRenderJobServiceOptions {
  outputDir?: string
  idFactory?: () => string
  now?: () => string
}

const DEFAULT_POLL_INTERVAL_MS = 1000
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000

function normalizeVideoStatus(status?: string): BotRenderJobStatus {
  switch (status) {
    case "pending":
      return "queued"
    case "running":
      return "rendering"
    case "completed":
      return "done"
    case "failed":
      return "failed"
    case "cancelled":
      return "cancelled"
    default:
      return "rendering"
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isCancelled(job: BotRenderJob): boolean {
  return job.status === "cancelled"
}

export class NodeRenderJobService implements IRenderJobService {
  private jobs = new Map<string, BotRenderJob>()
  private jobEventHandlers = new Map<
    string,
    {
      onEvent?: BotRenderJobRunOptions["onEvent"]
      eventSinks: BotRenderJobEventSink[]
    }
  >()
  private outputDir: string
  private idFactory: () => string
  private now: () => string

  constructor(
    private readonly video: IVideoService,
    options: NodeRenderJobServiceOptions = {},
  ) {
    this.outputDir = options.outputDir ?? process.cwd()
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => new Date().toISOString())
  }

  async run(request: BotRenderJobRequest, options: BotRenderJobRunOptions = {}): Promise<BotRenderJobResult> {
    const job = this.createJob(request)
    this.jobEventHandlers.set(job.id, {
      onEvent: options.onEvent,
      eventSinks: options.eventSinks ?? [],
    })
    const queuedEvent = job.events.at(-1)
    if (queuedEvent) {
      await this.dispatch(job, queuedEvent)
    }

    try {
      await this.emit(job, "preparing", 5, "Preparing render job")
      const projectSchema = await this.resolveProjectSchema(request)
      const outputPath = this.resolveOutputPath(request, job.id)

      if (isCancelled(job)) {
        return { job, events: [...job.events] }
      }

      await this.emit(job, "rendering", 10, "Starting video render")
      const providerJobId = await this.video.renderProject(projectSchema, outputPath)
      job.providerJobId = providerJobId

      if (isCancelled(job)) {
        await this.video.cancelRender(providerJobId)
        return { job, events: [...job.events] }
      }

      await this.waitForVideoJob(job, providerJobId, options)

      if (job.status === "done") {
        job.artifact = {
          type: "file",
          path: outputPath,
          destination: request.output.destination ?? "file",
          mimeType: "video/mp4",
        }
        await this.publishSnapshot(job)
      }
    } catch (error) {
      job.error = errorMessage(error)
      await this.emit(job, "failed", job.progress, job.error)
    }

    return {
      job,
      events: [...job.events],
    }
  }

  async getJob(jobId: string): Promise<BotRenderJob | null> {
    return this.jobs.get(jobId) ?? null
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    const cancelled = job.providerJobId ? await this.video.cancelRender(job.providerJobId) : true
    if (cancelled) {
      const timestamp = this.now()
      job.status = "cancelled"
      job.updatedAt = timestamp
      job.progress = Math.min(job.progress, 99)
      const event = this.createEvent(job, "cancelled", job.progress, "Render job cancelled", timestamp)
      await this.dispatch(job, event)
    }
    return cancelled
  }

  private createJob(request: BotRenderJobRequest): BotRenderJob {
    const now = this.now()
    const job: BotRenderJob = {
      id: this.idFactory(),
      status: "queued",
      progress: 0,
      request,
      createdAt: now,
      updatedAt: now,
      events: [],
    }

    this.jobs.set(job.id, job)
    this.createEvent(job, "queued", 0, "Render job queued", now)

    return job
  }

  private async resolveProjectSchema(request: BotRenderJobRequest): Promise<unknown> {
    if (request.project?.type === "inline") {
      return request.project.schema
    }

    if (request.project?.type === "file") {
      const projectContent = await fs.readFile(path.resolve(request.project.path), "utf-8")
      return JSON.parse(projectContent)
    }

    throw new Error("Render job requires project.type=file or project.type=inline")
  }

  private resolveOutputPath(request: BotRenderJobRequest, jobId: string): string {
    if (request.output.destination && request.output.destination !== "file" && !request.output.path) {
      return path.resolve(this.outputDir, `${jobId}.${request.output.format}`)
    }

    return path.resolve(request.output.path ?? path.join(this.outputDir, `${jobId}.${request.output.format}`))
  }

  private async waitForVideoJob(
    job: BotRenderJob,
    providerJobId: string,
    options: BotRenderJobRunOptions,
  ): Promise<void> {
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const startedAt = Date.now()

    while (Date.now() - startedAt <= timeoutMs) {
      if (isCancelled(job)) return

      const videoJob = await this.readVideoJob(providerJobId)

      if (!videoJob) {
        await this.emit(job, "done", 100, "Render job completed")
        return
      }

      const status = normalizeVideoStatus(videoJob.status)
      const progress = typeof videoJob.progress === "number" ? videoJob.progress : job.progress
      await this.emit(job, status, status === "done" ? 100 : progress, `Render status: ${status}`)

      if (status === "done") return
      if (status === "cancelled") return
      if (status === "failed") {
        throw new Error(videoJob.error ?? "Render job failed")
      }

      await delay(pollIntervalMs)
    }

    throw new Error(`Render job timed out after ${timeoutMs}ms`)
  }

  private async readVideoJob(providerJobId: string): Promise<VideoRenderJob | null> {
    try {
      return await this.video.getRenderJob(providerJobId)
    } catch {
      const activeJobs = await this.video.getActiveJobs()
      return activeJobs.find((job) => job.id === providerJobId) ?? null
    }
  }

  private async emit(job: BotRenderJob, status: BotRenderJobStatus, progress: number, message: string): Promise<void> {
    const timestamp = this.now()
    job.status = status
    job.progress = Math.max(0, Math.min(100, progress))
    job.updatedAt = timestamp
    const event = this.createEvent(job, status, job.progress, message, timestamp)
    await this.dispatch(job, event)
  }

  private createEvent(
    job: BotRenderJob,
    status: BotRenderJobStatus,
    progress: number,
    message: string,
    timestamp: string,
  ): BotRenderJobEvent {
    const event: BotRenderJobEvent = {
      jobId: job.id,
      sequence: job.events.length,
      status,
      progress,
      message,
      timestamp,
    }
    job.events.push(event)
    return event
  }

  private async dispatch(job: BotRenderJob, event: BotRenderJobEvent): Promise<void> {
    const handlers = this.jobEventHandlers.get(job.id)
    const snapshot = createBotRenderJobSnapshot(job)

    await handlers?.onEvent?.(event, job)

    for (const sink of handlers?.eventSinks ?? []) {
      await sink.publish(event, snapshot)
    }
  }

  private async publishSnapshot(job: BotRenderJob): Promise<void> {
    const handlers = this.jobEventHandlers.get(job.id)
    const snapshot = createBotRenderJobSnapshot(job)

    for (const sink of handlers?.eventSinks ?? []) {
      await sink.publishSnapshot?.(snapshot)
    }
  }
}
