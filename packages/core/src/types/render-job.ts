/**
 * Bot-first render job contracts.
 *
 * These types describe a headless workflow that can be called by a bot, CLI,
 * desktop UI, or future API worker without depending on React/Tauri UI state.
 */

export type BotRenderJobSource = "bot" | "desktop" | "cli"

export type BotRenderJobStatus = "queued" | "preparing" | "rendering" | "publishing" | "done" | "failed" | "cancelled"

export type BotRenderJobDestination = "file" | "telegram" | "youtube" | "tiktok" | "vimeo"

export type BotPublishStatus = "done" | "failed" | "unsupported"

export interface BotRenderJobMediaInput {
  type: "file" | "url"
  value: string
  name?: string
  mimeType?: string
  metadata?: Record<string, unknown>
}

export type BotRenderJobProjectInput =
  | {
      type: "file"
      path: string
    }
  | {
      type: "inline"
      schema: unknown
    }

export interface BotRenderJobOutput {
  format: "mp4"
  path?: string
  resolution?: "720p" | "1080p" | "portrait-1080p" | "4k"
  destination?: BotRenderJobDestination
}

export interface BotRenderJobRequest {
  source: BotRenderJobSource
  templateId?: string
  projectId?: string
  project?: BotRenderJobProjectInput
  media?: BotRenderJobMediaInput[]
  params?: Record<string, unknown>
  output: BotRenderJobOutput
}

export interface BotRenderJobArtifact {
  type: "file" | "url"
  path?: string
  url?: string
  destination: BotRenderJobDestination
  mimeType?: string
  metadata?: Record<string, unknown>
}

export interface BotPublishMetadata {
  title?: string
  description?: string
  caption?: string
  chatId?: string
  tags?: string[]
  visibility?: "private" | "unlisted" | "public"
  provider?: Record<string, unknown>
}

export interface BotPublishRequest {
  jobId?: string
  destination: BotRenderJobDestination
  artifact: BotRenderJobArtifact
  metadata?: BotPublishMetadata
  params?: Record<string, unknown>
}

export interface BotPublishResult {
  destination: BotRenderJobDestination
  status: BotPublishStatus
  artifact?: BotRenderJobArtifact
  providerId?: string
  url?: string
  error?: string
  metadata?: BotPublishMetadata
}

export interface BotRenderJobEvent {
  jobId: string
  sequence: number
  status: BotRenderJobStatus
  progress: number
  message?: string
  timestamp: string
}

export interface BotRenderJobSnapshot {
  jobId: string
  providerJobId?: string
  status: BotRenderJobStatus
  progress: number
  artifact?: BotRenderJobArtifact
  publications?: BotPublishResult[]
  error?: string
  createdAt: string
  updatedAt: string
  eventCount: number
  lastEvent?: BotRenderJobEvent
  canCancel: boolean
  canRetry: boolean
}

export interface BotRenderJobReconnectState {
  snapshot: BotRenderJobSnapshot | null
  events: BotRenderJobEvent[]
}

export interface BotRenderJobEventSink {
  publish(event: BotRenderJobEvent, snapshot: BotRenderJobSnapshot): void | Promise<void>
  publishSnapshot?(snapshot: BotRenderJobSnapshot): void | Promise<void>
}

export interface BotRenderJobEventStreamOptions {
  maxEventsPerJob?: number
}

export interface BotRenderJobEventQuery {
  afterSequence?: number
  limit?: number
}

export interface BotRenderJob {
  id: string
  providerJobId?: string
  status: BotRenderJobStatus
  progress: number
  request: BotRenderJobRequest
  artifact?: BotRenderJobArtifact
  publications?: BotPublishResult[]
  error?: string
  createdAt: string
  updatedAt: string
  events: BotRenderJobEvent[]
}

export interface BotRenderJobRunOptions {
  pollIntervalMs?: number
  timeoutMs?: number
  onEvent?: (event: BotRenderJobEvent, job: BotRenderJob) => void | Promise<void>
  eventSinks?: BotRenderJobEventSink[]
}

export interface BotRenderJobResult {
  job: BotRenderJob
  events: BotRenderJobEvent[]
}
