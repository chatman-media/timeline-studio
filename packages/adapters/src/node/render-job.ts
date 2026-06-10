import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

import type { IPublishService, IRenderJobService, IVideoService, RenderJob as VideoRenderJob } from "@timeline-studio/core/ports"
import { createBotRenderJobSnapshot } from "@timeline-studio/core/services"
import type {
  BotPublishMetadata,
  BotRenderJob,
  BotRenderJobArtifact,
  BotRenderJobEvent,
  BotRenderJobEventSink,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
  BotRenderJobStatus,
} from "@timeline-studio/core/types"

export interface NodeRenderJobServiceOptions {
  outputDir?: string
  idFactory?: () => string
  now?: () => string
  publisher?: IPublishService
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
  private publisher?: IPublishService

  constructor(
    private readonly video: IVideoService,
    options: NodeRenderJobServiceOptions = {},
  ) {
    this.outputDir = options.outputDir ?? process.cwd()
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => new Date().toISOString())
    this.publisher = options.publisher
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

      const shouldPublish = this.shouldPublish(request)
      await this.waitForVideoJob(job, providerJobId, options, shouldPublish)

      if (job.status === "done" || (shouldPublish && job.status === "rendering")) {
        const artifact = this.createFileArtifact(outputPath)
        if (shouldPublish) {
          await this.publishArtifact(job, artifact, request)
        } else {
          job.artifact = artifact
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
    shouldPublish: boolean,
  ): Promise<void> {
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const startedAt = Date.now()

    while (Date.now() - startedAt <= timeoutMs) {
      if (isCancelled(job)) return

      const videoJob = await this.readVideoJob(providerJobId)

      if (!videoJob) {
        await this.emit(job, shouldPublish ? "rendering" : "done", shouldPublish ? 90 : 100, "Render job completed")
        return
      }

      const status = normalizeVideoStatus(videoJob.status)
      const progress = typeof videoJob.progress === "number" ? videoJob.progress : job.progress
      if (status === "done" && shouldPublish) {
        await this.emit(job, "rendering", 90, "Render job completed")
      } else {
        await this.emit(job, status, status === "done" ? 100 : progress, `Render status: ${status}`)
      }

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

  private shouldPublish(request: BotRenderJobRequest): boolean {
    return Boolean(request.output.destination && request.output.destination !== "file")
  }

  private createFileArtifact(outputPath: string): BotRenderJobArtifact {
    return {
      type: "file",
      path: outputPath,
      destination: "file",
      mimeType: "video/mp4",
    }
  }

  private async publishArtifact(
    job: BotRenderJob,
    artifact: BotRenderJobArtifact,
    request: BotRenderJobRequest,
  ): Promise<void> {
    const destination = request.output.destination
    if (!destination || destination === "file") {
      job.artifact = artifact
      return
    }

    if (!this.publisher) {
      throw new Error(`Publish service is not configured for ${destination}`)
    }

    await this.emit(job, "publishing", 95, `Publishing render artifact to ${destination}`)
    const publication = await this.publisher.publish({
      jobId: job.id,
      destination,
      artifact,
      metadata: this.resolvePublishMetadata(request),
      params: request.params,
    })

    job.publications = [...(job.publications ?? []), publication]

    if (publication.status !== "done" || !publication.artifact) {
      throw new Error(publication.error ?? `Publishing to ${destination} failed`)
    }

    job.artifact = publication.artifact
    await this.emit(job, "done", 100, `Published render artifact to ${destination}`)
  }

  private resolvePublishMetadata(request: BotRenderJobRequest): BotPublishMetadata {
    const params = request.params ?? {}
    const metadata: BotPublishMetadata = {}
    const title = stringParam(params.title)
    const description = stringParam(params.description)
    const caption = stringParam(params.caption)
    const chatId = stringParam(params.chatId) ?? stringParam(params.telegramChatId)
    const tags = stringArrayParam(params.tags)
    const visibility = visibilityParam(params.visibility)

    if (title) metadata.title = title
    if (description) metadata.description = description
    if (caption) metadata.caption = caption
    if (chatId) metadata.chatId = chatId
    if (tags) metadata.tags = tags
    if (visibility) metadata.visibility = visibility

    return metadata
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

function stringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function stringArrayParam(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const tags = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    return tags.length > 0 ? tags.map((item) => item.trim()) : undefined
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return undefined
}

function visibilityParam(value: unknown): "private" | "unlisted" | "public" | undefined {
  return value === "private" || value === "unlisted" || value === "public" ? value : undefined
}
