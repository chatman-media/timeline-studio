import fs from "node:fs/promises"
import path from "node:path"
import type { AIProjectEditorResult, IAIProjectEditor, IBotFeedbackTranscriber, IPublishService } from "@timeline-studio/core/ports"
import {
  createBotDestinationCapabilityRegistry,
  createBotEditRevisionId,
  createBotEditSessionId,
  createBotWorkflowDraftId,
  createTelegramLikeBotWorkflow,
  mergeBotEditSessionWorkflow,
  mergeBotWorkflowDraft,
  runAIProjectEdit,
  validateBotDestinationCapability,
} from "@timeline-studio/core/services"
import type {
  BotEditRevision,
  BotEditSession,
  BotEditSessionStore,
  BotPublishResult,
  BotRenderJobArtifact,
  BotRenderJobEventSink,
  BotRenderJobProjectInput,
  BotRenderJobSnapshot,
  BotWorkflowDraft,
  BotWorkflowDraftStore,
  BotWorkflowRequest,
  BotWorkflowRunResult,
  TelegramLikeBotFile,
  TelegramLikeBotPayload,
} from "@timeline-studio/core/types"
import type { ProjectSchema } from "@/types/contracts/project-schema"

import { NodeBotStatusNotifier, type NodeTelegramStatusClient, type NodeTelegramVideoClient } from "./bot-status"
import type { NodeBotWorkflowService, NodeBotWorkflowServiceOptions } from "./bot-workflow"
import { redactSensitiveMetadata } from "./sensitive-metadata"
import type { NodeTelegramBotWorkflowJobRecord, NodeTelegramBotWorkflowJobStore } from "./telegram-bot-job-store"

export interface TelegramBotFile {
  file_id?: string
  file_unique_id?: string
  file_name?: string
  mime_type?: string
  file_size?: number
  file_path?: string
  duration?: number
  width?: number
  height?: number
}

export interface TelegramBotMessage {
  message_id?: string | number
  chat?: {
    id?: string | number
  }
  from?: {
    id?: string | number
  }
  text?: string
  caption?: string
  document?: TelegramBotFile
  video?: TelegramBotFile
  audio?: TelegramBotFile
  voice?: TelegramBotFile
  video_note?: TelegramBotFile
  animation?: TelegramBotFile
  photo?: TelegramBotFile[]
}

export interface TelegramBotUpdate {
  update_id: number
  message?: TelegramBotMessage
  edited_message?: TelegramBotMessage
  channel_post?: TelegramBotMessage
  edited_channel_post?: TelegramBotMessage
}

export interface TelegramBotGetUpdatesOptions {
  offset?: number
  limit?: number
  timeoutSeconds?: number
  allowedUpdates?: string[]
}

export interface TelegramBotFetchResponse {
  ok: boolean
  status: number
  statusText?: string
  json?(): Promise<unknown>
}

export type TelegramBotFetch = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: BodyInit },
) => Promise<TelegramBotFetchResponse>

export interface NodeTelegramBotClient {
  getUpdates(options?: TelegramBotGetUpdatesOptions): Promise<TelegramBotUpdate[]>
}

export interface NodeTelegramBotWorkerOptions {
  workflow: NodeBotWorkflowService
  workflowQueue?: NodeTelegramBotWorkflowQueue
  client?: NodeTelegramBotClient
  accessPolicy?: NodeTelegramBotAccessPolicy
  accessDeniedResponder?: NodeTelegramStatusClient
  accessDeniedFormatter?: NodeTelegramBotAccessDeniedFormatter
  disableAccessDeniedResponses?: boolean
  commandResponder?: NodeTelegramStatusClient
  commandFormatter?: NodeTelegramBotCommandFormatter
  errorResponder?: NodeTelegramStatusClient
  errorFormatter?: NodeTelegramBotUpdateErrorFormatter
  disableErrorResponses?: boolean
  queueResponder?: NodeTelegramStatusClient
  queueFormatter?: NodeTelegramBotQueueFormatter
  queueRejectedFormatter?: NodeTelegramBotQueueRejectedFormatter
  disableQueueResponses?: boolean
  draftStore?: BotWorkflowDraftStore
  draftResponder?: NodeTelegramStatusClient
  draftFormatter?: NodeTelegramBotDraftFormatter
  workflowJobStore?: NodeTelegramBotWorkflowJobStore
  editSessionStore?: BotEditSessionStore
  aiProjectEditor?: IAIProjectEditor
  aiProjectEditMaxRepairAttempts?: number
  feedbackTranscriber?: IBotFeedbackTranscriber
  /**
   * Transcribe a fresh voice/video-note idea into the workflow goal via
   * {@link feedbackTranscriber} before draft/first-cut assembly (#326). When a
   * new (non-review) message has no usable text but carries a voice idea, its
   * transcription becomes the idea text that feeds the script generator.
   * Requires {@link feedbackTranscriber}; off by default to preserve behavior.
   */
  transcribeVoiceIdeas?: boolean
  publishService?: IPublishService
  previewRenderer?: NodeTelegramBotReviewPreviewRenderer
  previewResponder?: NodeTelegramBotReviewPreviewResponder
  reviewResponder?: NodeTelegramStatusClient
  reviewFormatter?: NodeTelegramBotReviewFormatter
  jobStatusFormatter?: NodeTelegramBotJobStatusFormatter
  jobCancelFormatter?: NodeTelegramBotJobCancelFormatter
  jobRetryFormatter?: NodeTelegramBotJobRetryFormatter
  jobStatusLimit?: number
  disableCommandRouting?: boolean
  botToken?: string
  fetch?: TelegramBotFetch
  workflowOptions?: NodeBotWorkflowServiceOptions
  now?: () => string
  onResult?: (result: NodeTelegramBotWorkerUpdateResult) => void | Promise<void>
}

export interface NodeTelegramBotWorkerHandleOptions {
  workflowOptions?: NodeBotWorkflowServiceOptions
}

export type NodeTelegramBotCommand =
  | "start"
  | "help"
  | "status"
  | "cancel"
  | "retry"
  | "approve"
  | "revise"
  | "versions"
  | "discard"
export type NodeTelegramBotDraftCommand = "render" | "cancel"
export type NodeTelegramBotDraftAction = "updated" | "cancelled"
export type NodeTelegramBotReviewAction =
  | "approved"
  | "awaiting_feedback"
  | "cancelled"
  | "discarded"
  | "failed"
  | "feedback_applied"
  | "invalid_state"
  | "not_found"
  | "published"
  | "status"
  | "versions"

export interface NodeTelegramBotAccessPolicy {
  allowedChatIds?: readonly string[]
  allowedUserIds?: readonly string[]
}

export type NodeTelegramBotWorkflowQueueStatus = "queued" | "rejected"

export type NodeTelegramBotWorkflowQueueSubmission =
  | {
      id: string
      status: "queued"
    }
  | {
      id: string
      status: "rejected"
      reason: string
    }

export type NodeTelegramBotWorkflowQueueCancellationStatus = "cancelled" | "not_found" | "not_cancellable"

export interface NodeTelegramBotWorkflowQueueCancellation {
  id: string
  status: NodeTelegramBotWorkflowQueueCancellationStatus
  reason?: string
}

export interface NodeTelegramBotWorkflowQueueJob {
  id: string
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  run(): Promise<BotWorkflowRunResult>
  onComplete?(result: BotWorkflowRunResult): void | Promise<void>
  onError?(error: unknown): void | Promise<void>
  onCancel?(reason: string): void | Promise<void>
}

export interface NodeTelegramBotWorkflowQueue {
  enqueue(job: NodeTelegramBotWorkflowQueueJob): Promise<NodeTelegramBotWorkflowQueueSubmission>
  cancel?(id: string): Promise<NodeTelegramBotWorkflowQueueCancellation>
}

export interface NodeTelegramBotInMemoryWorkflowQueueOptions {
  concurrency?: number
  maxPending?: number
}

export interface NodeTelegramBotCommandFormatterContext {
  command: NodeTelegramBotCommand
  payload: TelegramLikeBotPayload
  update: TelegramBotUpdate
}

export type NodeTelegramBotCommandFormatter = (context: NodeTelegramBotCommandFormatterContext) => string

export interface NodeTelegramBotAccessDeniedFormatterContext {
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  policy: NodeTelegramBotAccessPolicy
}

export type NodeTelegramBotAccessDeniedFormatter = (context: NodeTelegramBotAccessDeniedFormatterContext) => string

export interface NodeTelegramBotUpdateErrorFormatterContext {
  updateId: number
  update: TelegramBotUpdate
  payload?: TelegramLikeBotPayload
  error: string
}

export type NodeTelegramBotUpdateErrorFormatter = (context: NodeTelegramBotUpdateErrorFormatterContext) => string

export interface NodeTelegramBotDraftFormatterContext {
  action: NodeTelegramBotDraftAction
  draftId: string
  draft?: BotWorkflowDraft
  payload: TelegramLikeBotPayload
  update: TelegramBotUpdate
}

export type NodeTelegramBotDraftFormatter = (context: NodeTelegramBotDraftFormatterContext) => string

export interface NodeTelegramBotQueueFormatterContext {
  queueId: string
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  workflow?: BotWorkflowRequest
  draftId?: string
}

export type NodeTelegramBotQueueFormatter = (context: NodeTelegramBotQueueFormatterContext) => string

export interface NodeTelegramBotQueueRejectedFormatterContext {
  queueId: string
  reason: string
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  workflow?: BotWorkflowRequest
  draftId?: string
}

export type NodeTelegramBotQueueRejectedFormatter = (context: NodeTelegramBotQueueRejectedFormatterContext) => string

export interface NodeTelegramBotJobStatusFormatterContext {
  jobs: NodeTelegramBotWorkflowJobRecord[]
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
}

export type NodeTelegramBotJobStatusFormatter = (context: NodeTelegramBotJobStatusFormatterContext) => string

export interface NodeTelegramBotJobCancelFormatterContext {
  queueId: string
  cancellation: NodeTelegramBotWorkflowQueueCancellation
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  job?: NodeTelegramBotWorkflowJobRecord
}

export type NodeTelegramBotJobCancelFormatter = (context: NodeTelegramBotJobCancelFormatterContext) => string

export interface NodeTelegramBotJobRetryFormatterContext {
  queueId: string
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  job?: NodeTelegramBotWorkflowJobRecord
  reason?: string
}

export type NodeTelegramBotJobRetryFormatter = (context: NodeTelegramBotJobRetryFormatterContext) => string

export interface NodeTelegramBotReviewFormatterContext {
  action: NodeTelegramBotReviewAction
  command?: NodeTelegramBotCommand
  session?: BotEditSession
  revision?: BotEditRevision
  instruction?: string
  publishResult?: BotPublishResult
  message?: string
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
}

export type NodeTelegramBotReviewFormatter = (context: NodeTelegramBotReviewFormatterContext) => string

export interface NodeTelegramBotReviewPreviewRendererContext {
  session: BotEditSession
  revision: BotEditRevision
  projectSchema: unknown
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
}

export interface NodeTelegramBotReviewPreviewRenderer {
  renderPreview(context: NodeTelegramBotReviewPreviewRendererContext): Promise<BotRenderJobArtifact>
}

export type NodeTelegramBotReviewPreviewResponder = NodeTelegramStatusClient & Partial<NodeTelegramVideoClient>

export type NodeTelegramBotWorkerUpdateResult =
  | {
      skipped: true
      reason: string
      updateId: number
      update: TelegramBotUpdate
      command?: NodeTelegramBotCommand
      draftAction?: NodeTelegramBotDraftAction
      draftId?: string
      draft?: BotWorkflowDraft
      payload?: TelegramLikeBotPayload
      responseText?: string
      responseError?: string
      queueId?: string
      cancellation?: NodeTelegramBotWorkflowQueueCancellation
      retryOf?: string
      duplicateOf?: string
      workflowJob?: NodeTelegramBotWorkflowJobRecord
      accessDenied?: boolean
      reviewAction?: NodeTelegramBotReviewAction
      editSessionId?: string
      editSession?: BotEditSession
      editRevision?: BotEditRevision
      feedbackText?: string
      publishResult?: BotPublishResult
    }
  | {
      skipped: false
      queued: true
      queueId: string
      reason: string
      updateId: number
      update: TelegramBotUpdate
      payload: TelegramLikeBotPayload
      workflow?: BotWorkflowRequest
      draftId?: string
      responseText?: string
      responseError?: string
      completion?: BotWorkflowRunResult
      error?: string
      retryOf?: string
    }
  | {
      skipped: false
      rejected: true
      queueId: string
      reason: string
      updateId: number
      update: TelegramBotUpdate
      payload: TelegramLikeBotPayload
      workflow?: BotWorkflowRequest
      draftId?: string
      responseText?: string
      responseError?: string
      retryOf?: string
    }
  | {
      skipped: false
      updateId: number
      update: TelegramBotUpdate
      payload: TelegramLikeBotPayload
      result: BotWorkflowRunResult
      retryOf?: string
    }
  | {
      skipped: false
      failed: true
      reason: string
      updateId: number
      update: TelegramBotUpdate
      payload?: TelegramLikeBotPayload
      error: string
      responseText?: string
      responseError?: string
    }

export interface NodeTelegramBotWorkerPollOptions extends TelegramBotGetUpdatesOptions {
  workflowOptions?: NodeBotWorkflowServiceOptions
}

export interface NodeTelegramBotWorkerPollResult {
  updates: NodeTelegramBotWorkerUpdateResult[]
  nextOffset?: number
}

export interface NodeTelegramBotOffsetStore {
  readOffset(): Promise<number | undefined>
  writeOffset(offset: number): Promise<void>
}

export interface NodeTelegramBotFileOffsetStoreState {
  offset: number
  updatedAt: string
}

export interface NodeTelegramBotWorkerRunOptions extends NodeTelegramBotWorkerPollOptions {
  offsetStore?: NodeTelegramBotOffsetStore
  maxBatches?: number
  idleDelayMs?: number
  signal?: AbortSignal
  onBatch?: (batch: NodeTelegramBotWorkerPollResult) => void | Promise<void>
  sleep?: (ms: number) => Promise<void>
}

export interface NodeTelegramBotWorkerRunResult {
  batches: NodeTelegramBotWorkerPollResult[]
  nextOffset?: number
  stoppedReason: "aborted" | "max_batches"
}

interface TelegramGetUpdatesResponse {
  ok?: boolean
  description?: string
  result?: unknown
}

export class NodeTelegramBotInMemoryWorkflowQueue implements NodeTelegramBotWorkflowQueue {
  private readonly concurrency: number
  private readonly maxPending?: number
  private readonly pending: NodeTelegramBotWorkflowQueueJob[] = []
  private readonly activeIds = new Set<string>()
  private readonly idleResolvers: Array<() => void> = []
  private activeCount = 0

  constructor(options: NodeTelegramBotInMemoryWorkflowQueueOptions = {}) {
    this.concurrency = Math.max(1, Math.trunc(options.concurrency ?? 1))
    this.maxPending = options.maxPending === undefined ? undefined : Math.max(0, Math.trunc(options.maxPending))
  }

  async enqueue(job: NodeTelegramBotWorkflowQueueJob): Promise<NodeTelegramBotWorkflowQueueSubmission> {
    if (
      this.maxPending !== undefined &&
      this.activeCount >= this.concurrency &&
      this.pending.length >= this.maxPending
    ) {
      return {
        id: job.id,
        status: "rejected",
        reason: "Telegram bot workflow queue is full",
      }
    }

    this.pending.push(job)
    this.pump()
    return {
      id: job.id,
      status: "queued",
    }
  }

  async cancel(id: string): Promise<NodeTelegramBotWorkflowQueueCancellation> {
    const pendingIndex = this.pending.findIndex((job) => job.id === id)
    if (pendingIndex >= 0) {
      const [job] = this.pending.splice(pendingIndex, 1)
      await job?.onCancel?.("Telegram bot workflow cancelled")
      this.resolveIdleIfNeeded()
      return {
        id,
        status: "cancelled",
      }
    }

    if (this.activeIds.has(id)) {
      return {
        id,
        status: "not_cancellable",
        reason: "Telegram bot workflow is already running",
      }
    }

    return {
      id,
      status: "not_found",
      reason: "Telegram bot workflow is not queued",
    }
  }

  async drain(): Promise<void> {
    if (this.activeCount === 0 && this.pending.length === 0) return
    await new Promise<void>((resolve) => this.idleResolvers.push(resolve))
  }

  private pump(): void {
    while (this.activeCount < this.concurrency && this.pending.length > 0) {
      const job = this.pending.shift()
      if (!job) continue
      this.activeCount += 1
      void this.runJob(job)
    }
  }

  private async runJob(job: NodeTelegramBotWorkflowQueueJob): Promise<void> {
    this.activeIds.add(job.id)
    try {
      const result = await job.run()
      await job.onComplete?.(result)
    } catch (error) {
      await job.onError?.(error)
    } finally {
      this.activeIds.delete(job.id)
      this.activeCount -= 1
      this.pump()
      this.resolveIdleIfNeeded()
    }
  }

  private resolveIdleIfNeeded(): void {
    if (this.activeCount > 0 || this.pending.length > 0) return

    const resolvers = this.idleResolvers.splice(0)
    for (const resolve of resolvers) {
      resolve()
    }
  }
}

export class NodeTelegramBotFileOffsetStore implements NodeTelegramBotOffsetStore {
  constructor(private readonly filePath: string) {}

  async readOffset(): Promise<number | undefined> {
    let content: string
    try {
      content = await fs.readFile(this.filePath, "utf-8")
    } catch (error) {
      if (isNotFoundError(error)) return undefined
      throw error
    }

    const parsed = JSON.parse(content) as Partial<NodeTelegramBotFileOffsetStoreState>
    return typeof parsed.offset === "number" && Number.isFinite(parsed.offset) ? parsed.offset : undefined
  }

  async writeOffset(offset: number): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(
      this.filePath,
      `${JSON.stringify({
        offset,
        updatedAt: new Date().toISOString(),
      } satisfies NodeTelegramBotFileOffsetStoreState)}\n`,
    )
  }
}

export class NodeTelegramBotApiClient implements NodeTelegramBotClient {
  private readonly fetch: TelegramBotFetch

  constructor(
    private readonly botToken: string,
    options: { fetch?: TelegramBotFetch } = {},
  ) {
    this.fetch = options.fetch ?? globalFetch
  }

  async getUpdates(options: TelegramBotGetUpdatesOptions = {}): Promise<TelegramBotUpdate[]> {
    const params = new URLSearchParams()
    if (options.offset !== undefined) params.set("offset", String(options.offset))
    if (options.limit !== undefined) params.set("limit", String(options.limit))
    if (options.timeoutSeconds !== undefined) params.set("timeout", String(options.timeoutSeconds))
    if (options.allowedUpdates?.length) params.set("allowed_updates", JSON.stringify(options.allowedUpdates))

    const query = params.toString()
    const response = await this.fetch(
      `https://api.telegram.org/bot${this.botToken}/getUpdates${query ? `?${query}` : ""}`,
    )
    if (!response.ok) {
      throw new Error(`Telegram getUpdates failed: ${response.status} ${response.statusText ?? ""}`.trim())
    }

    const body = (await response.json?.()) as TelegramGetUpdatesResponse | undefined
    if (!body?.ok || !Array.isArray(body.result)) {
      throw new Error(body?.description ?? "Telegram getUpdates response did not include result")
    }

    return body.result as TelegramBotUpdate[]
  }
}

export class NodeTelegramBotWorker {
  private readonly workflowOptions?: NodeBotWorkflowServiceOptions

  constructor(private readonly options: NodeTelegramBotWorkerOptions) {
    this.workflowOptions = options.workflowOptions
  }

  async handleUpdate(
    update: TelegramBotUpdate,
    options: NodeTelegramBotWorkerHandleOptions = {},
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const payload = createTelegramLikePayloadFromUpdate(update)
    if (!payload) {
      const result: NodeTelegramBotWorkerUpdateResult = {
        skipped: true,
        reason: "Telegram update does not contain a supported message",
        updateId: update.update_id,
        update,
      }
      await this.options.onResult?.(result)
      return result
    }

    if (!isTelegramBotAccessAllowed(payload, this.options.accessPolicy)) {
      return this.createAccessDeniedResult(update, payload, this.options.accessPolicy)
    }

    const reviewCommand = this.options.disableCommandRouting ? null : parseTelegramBotReviewCommand(payload.text)
    if (reviewCommand) {
      const reviewResult = await this.handleReviewCommand(update, payload, reviewCommand)
      if (reviewResult) return reviewResult
    }

    const command = this.options.disableCommandRouting ? null : parseTelegramBotCommand(payload.text)
    if (command === "retry") {
      return this.handleRetryCommand(update, payload, options)
    }

    if (command === "cancel") {
      return this.handleCancelCommand(update, payload)
    }

    if (command === "status") {
      return this.handleStatusCommand(update, payload)
    }

    if (command) {
      const responseText = (this.options.commandFormatter ?? defaultTelegramBotCommandText)({
        command,
        payload,
        update,
      })
      await this.sendCommandResponse(command, payload, responseText)
      const result: NodeTelegramBotWorkerUpdateResult = {
        skipped: true,
        reason: "Telegram bot command handled",
        updateId: update.update_id,
        update,
        command,
        payload,
        responseText,
      }
      await this.options.onResult?.(result)
      return result
    }

    const reviewFeedbackResult = await this.handleReviewFeedbackUpdate(update, payload)
    if (reviewFeedbackResult) return reviewFeedbackResult

    // A fresh voice idea (not review feedback) is transcribed into the goal text
    // so it flows through the draft / first-cut / script generator (#326).
    const ideaPayload = await this.applyVoiceIdeaTranscription(payload)

    const draftResult = await this.handleDraftUpdate(update, ideaPayload, options)
    if (draftResult) return draftResult

    return this.runOrQueueWorkflow(update, ideaPayload, {
      run: (workflowOptions) =>
        this.options.workflow.runTelegramLikePayload(
          ideaPayload,
          this.withReviewApprovalGate(
            mergeWorkflowOptions(mergeWorkflowOptions(this.workflowOptions, options.workflowOptions), workflowOptions),
          ),
        ),
      onComplete: (workflowResult) => this.upsertReviewEditSessionFromWorkflowResult(workflowResult),
    })
  }

  async pollOnce(options: NodeTelegramBotWorkerPollOptions = {}): Promise<NodeTelegramBotWorkerPollResult> {
    const client = this.resolveClient()
    const { workflowOptions, ...getUpdatesOptions } = options
    const updates = await client.getUpdates(getUpdatesOptions)
    const results: NodeTelegramBotWorkerUpdateResult[] = []
    let nextOffset = options.offset

    for (const update of updates) {
      results.push(await this.handlePollingUpdate(update, { workflowOptions }))
      nextOffset = Math.max(nextOffset ?? 0, update.update_id + 1)
    }

    return {
      updates: results,
      ...(nextOffset !== undefined ? { nextOffset } : {}),
    }
  }

  async runPolling(options: NodeTelegramBotWorkerRunOptions = {}): Promise<NodeTelegramBotWorkerRunResult> {
    const batches: NodeTelegramBotWorkerPollResult[] = []
    const sleep = options.sleep ?? delay
    let nextOffset = options.offset ?? (await options.offsetStore?.readOffset())

    while (!options.signal?.aborted) {
      const batch = await this.pollOnce({
        offset: nextOffset,
        limit: options.limit,
        timeoutSeconds: options.timeoutSeconds,
        allowedUpdates: options.allowedUpdates,
        workflowOptions: options.workflowOptions,
      })
      batches.push(batch)

      const previousOffset = nextOffset
      if (batch.nextOffset !== undefined) {
        nextOffset = batch.nextOffset
        if (batch.nextOffset !== previousOffset) {
          await options.offsetStore?.writeOffset(batch.nextOffset)
        }
      }

      await options.onBatch?.(batch)

      if (options.maxBatches !== undefined && batches.length >= options.maxBatches) {
        return {
          batches,
          ...(nextOffset !== undefined ? { nextOffset } : {}),
          stoppedReason: "max_batches",
        }
      }

      if (options.idleDelayMs && options.idleDelayMs > 0 && batch.updates.length === 0) {
        await sleep(options.idleDelayMs)
      }
    }

    return {
      batches,
      ...(nextOffset !== undefined ? { nextOffset } : {}),
      stoppedReason: "aborted",
    }
  }

  private resolveClient(): NodeTelegramBotClient {
    if (this.options.client) return this.options.client
    if (!this.options.botToken) {
      throw new Error("Telegram bot token or client is required for polling")
    }
    return new NodeTelegramBotApiClient(this.options.botToken, { fetch: this.options.fetch })
  }

  private now(): string {
    return this.options.now?.() ?? new Date().toISOString()
  }

  private withReviewApprovalGate(
    options: NodeBotWorkflowServiceOptions | undefined,
  ): NodeBotWorkflowServiceOptions | undefined {
    if (!this.options.editSessionStore) return options
    const gatedOptions = mergeWorkflowOptions(options, {
      approvalGate: {
        enabled: true,
        previewDestination: "telegram",
      },
    })

    if (!this.options.publishService) return gatedOptions

    return mergeWorkflowOptions(gatedOptions, {
      intake: {
        destinationCapabilities: createBotDestinationCapabilityRegistry({
          publisher: this.options.publishService,
        }),
      },
    })
  }

  private async sendCommandResponse(
    command: NodeTelegramBotCommand,
    payload: TelegramLikeBotPayload,
    text: string,
  ): Promise<void> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    if (!chatId) return

    const responder = this.resolveCommandResponder()
    await responder?.sendMessage({
      chatId,
      text,
      ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
      metadata: {
        command,
        source: "telegram-bot-worker",
      },
    })
  }

  private async createAccessDeniedResult(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    policy: NodeTelegramBotAccessPolicy | undefined,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const responseText = this.options.disableAccessDeniedResponses
      ? undefined
      : (this.options.accessDeniedFormatter ?? defaultTelegramBotAccessDeniedText)({
          update,
          payload,
          policy: policy ?? {},
        })
    let responseError: string | undefined

    if (responseText) {
      try {
        await this.sendAccessDeniedResponse(payload, responseText)
      } catch (error) {
        responseError = formatUnknownError(error)
      }
    }

    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: true,
      reason: "Telegram bot access denied",
      updateId: update.update_id,
      update,
      payload,
      accessDenied: true,
      ...(responseText ? { responseText } : {}),
      ...(responseError ? { responseError } : {}),
    }
    await this.options.onResult?.(result)
    return result
  }

  private async sendAccessDeniedResponse(payload: TelegramLikeBotPayload, text: string): Promise<void> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    if (!chatId) return

    const responder = this.resolveAccessDeniedResponder()
    await responder?.sendMessage({
      chatId,
      text,
      ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
      metadata: {
        accessDenied: true,
        source: "telegram-bot-worker",
      },
    })
  }

  private async handleStatusCommand(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const activeSession = await this.readCurrentEditSession(payload)
    if (activeSession) {
      return this.createReviewSkippedResult({
        action: "status",
        command: "status",
        session: activeSession,
        payload,
        update,
      })
    }

    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    const jobs =
      (await this.options.workflowJobStore?.listJobs({
        ...(chatId ? { chatId } : {}),
        limit: this.options.jobStatusLimit ?? 5,
      })) ?? []
    const responseText = (this.options.jobStatusFormatter ?? defaultTelegramBotJobStatusText)({
      jobs,
      update,
      payload,
    })

    await this.sendCommandResponse("status", payload, responseText)
    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: true,
      reason: "Telegram bot command handled",
      updateId: update.update_id,
      update,
      command: "status",
      payload,
      responseText,
    }
    await this.options.onResult?.(result)
    return result
  }

  private async handleRetryCommand(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    options: NodeTelegramBotWorkerHandleOptions,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const queueId = parseTelegramBotRetryCommandTarget(payload.text)
    const retry = queueId ? await this.resolveRetryWorkflowJob(queueId, payload) : { reason: "Send /retry <queueId>." }

    if (!queueId || "reason" in retry) {
      const job = "job" in retry ? retry.job : undefined
      const responseText = (this.options.jobRetryFormatter ?? defaultTelegramBotJobRetryText)({
        queueId: queueId ?? "",
        update,
        payload,
        ...(job ? { job } : {}),
        reason: "reason" in retry ? retry.reason : "Send /retry <queueId>.",
      })
      await this.sendCommandResponse("retry", payload, responseText)
      const result: NodeTelegramBotWorkerUpdateResult = {
        skipped: true,
        reason: "Telegram bot command handled",
        updateId: update.update_id,
        update,
        command: "retry",
        payload,
        responseText,
        ...(queueId ? { queueId, retryOf: queueId } : {}),
      }
      await this.options.onResult?.(result)
      return result
    }

    const workflowDefaults = mergeWorkflowOptions(this.workflowOptions, options.workflowOptions)
    return this.runOrQueueWorkflow(update, payload, {
      retryOf: queueId,
      sourcePayload: retry.job.sourcePayload,
      sourceWorkflow: retry.job.sourceWorkflow,
      ...(retry.job.sourceWorkflow ? { workflow: retry.job.sourceWorkflow } : {}),
      run: (workflowOptions) =>
        retry.job.sourceWorkflow
          ? this.options.workflow.runWorkflow(
              retry.job.sourceWorkflow,
              this.withReviewApprovalGate(mergeWorkflowOptions(workflowDefaults, workflowOptions)),
            )
          : this.options.workflow.runTelegramLikePayload(
              retry.job.sourcePayload as TelegramLikeBotPayload,
              this.withReviewApprovalGate(mergeWorkflowOptions(workflowDefaults, workflowOptions)),
            ),
      onComplete: (workflowResult) => this.upsertReviewEditSessionFromWorkflowResult(workflowResult),
    })
  }

  private async resolveRetryWorkflowJob(
    queueId: string,
    payload: TelegramLikeBotPayload,
  ): Promise<{ job: NodeTelegramBotWorkflowJobRecord } | { reason: string }> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    const job = await this.options.workflowJobStore?.readJob(queueId)
    if (!job || !job.chatId || !chatId || job.chatId !== chatId) {
      return { reason: "Workflow job was not found for this chat." }
    }

    if (job.status !== "failed" && job.status !== "cancelled") {
      return { job, reason: `Workflow job is ${job.status} and cannot be retried.` }
    }

    if (!job.sourceWorkflow && !job.sourcePayload) {
      return { job, reason: "Workflow job does not include retry source data." }
    }

    return { job }
  }

  private async handleCancelCommand(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const queueId = parseTelegramBotCancelCommandTarget(payload.text)
    const cancellation = queueId
      ? await this.cancelWorkflowJob(queueId, payload)
      : {
          id: "",
          status: "not_found" as const,
          reason: "Send /cancel <queueId> to cancel a queued render job.",
        }
    const job = queueId ? await this.options.workflowJobStore?.readJob(queueId) : undefined
    const responseText = (this.options.jobCancelFormatter ?? defaultTelegramBotJobCancelText)({
      queueId: queueId ?? "",
      cancellation,
      update,
      payload,
      ...(job ? { job } : {}),
    })

    await this.sendCommandResponse("cancel", payload, responseText)
    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: true,
      reason: "Telegram bot command handled",
      updateId: update.update_id,
      update,
      command: "cancel",
      payload,
      responseText,
      ...(queueId ? { queueId } : {}),
      cancellation,
    }
    await this.options.onResult?.(result)
    return result
  }

  private async cancelWorkflowJob(
    queueId: string,
    payload: TelegramLikeBotPayload,
  ): Promise<NodeTelegramBotWorkflowQueueCancellation> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    const job = await this.options.workflowJobStore?.readJob(queueId)
    if (!job || (job.chatId && chatId && job.chatId !== chatId)) {
      return {
        id: queueId,
        status: "not_found",
        reason: "Queued workflow job was not found for this chat.",
      }
    }

    if (job.status === "running") {
      if (!job.renderJobId) {
        return {
          id: queueId,
          status: "not_cancellable",
          reason: "Running render job id is not available yet.",
        }
      }

      const cancelled = await this.options.workflow.cancelRenderJob(job.renderJobId)
      if (!cancelled) {
        return {
          id: queueId,
          status: "not_cancellable",
          reason: "Running render job could not be cancelled.",
        }
      }

      await this.writeWorkflowJobRecord({
        ...job,
        status: "cancelled",
        reason: "Telegram bot running workflow cancelled by user",
        renderJobStatus: "cancelled",
        updatedAt: this.now(),
      })
      return {
        id: queueId,
        status: "cancelled",
      }
    }

    if (job.status !== "queued") {
      return {
        id: queueId,
        status: "not_cancellable",
        reason: `Workflow job is ${job.status}.`,
      }
    }

    if (!this.options.workflowQueue?.cancel) {
      return {
        id: queueId,
        status: "not_cancellable",
        reason: "Workflow queue does not support cancellation.",
      }
    }

    const cancellation = await this.options.workflowQueue.cancel(queueId)
    if (cancellation.status === "cancelled") {
      await this.writeWorkflowJobRecord({
        ...job,
        status: "cancelled",
        reason: "Telegram bot workflow cancelled by user",
        updatedAt: this.now(),
      })
    }
    return cancellation
  }

  private async handleReviewCommand(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    command: NodeTelegramBotCommand,
  ): Promise<NodeTelegramBotWorkerUpdateResult | null> {
    if (!this.options.editSessionStore) return null

    const session = await this.readCurrentEditSession(payload)
    if (!session) {
      if (command === "cancel") return null
      return this.createReviewSkippedResult({
        action: "not_found",
        command,
        payload,
        update,
        message: "No active AI review session was found for this chat.",
      })
    }

    switch (command) {
      case "approve":
        return this.approveEditSession(update, payload, session, command)
      case "revise": {
        const instruction = parseTelegramBotReviseInstruction(payload.text)
        if (instruction) {
          return this.applyReviewFeedback(update, payload, session, instruction)
        }
        return this.createReviewSkippedResult({
          action: session.status === "preview_ready" ? "awaiting_feedback" : "invalid_state",
          command,
          session,
          payload,
          update,
          message:
            session.status === "preview_ready"
              ? "Send the correction after /revise, or send it as a plain text or voice message."
              : `Edit session is ${session.status}; revisions are accepted only after a preview is ready.`,
        })
      }
      case "versions":
        return this.createReviewSkippedResult({
          action: "versions",
          command,
          session,
          payload,
          update,
        })
      case "discard":
        return this.discardLatestEditRevision(update, payload, session, command)
      case "cancel":
        return this.cancelEditSession(update, payload, session, command)
      default:
        return null
    }
  }

  private async handleReviewFeedbackUpdate(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
  ): Promise<NodeTelegramBotWorkerUpdateResult | null> {
    if (!this.options.editSessionStore) return null

    const session = await this.readCurrentEditSession(payload)
    if (!session) return null

    if (session.status === "collecting") {
      return null
    }

    if (!hasTelegramLikePayloadContent(payload)) {
      return null
    }

    if (session.status !== "preview_ready") {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        session,
        payload,
        update,
        message: `Edit session is ${session.status}; feedback is accepted only after a preview is ready.`,
      })
    }

    try {
      const instruction = await this.resolveReviewFeedbackText(payload, session)
      if (!instruction) {
        return this.createReviewSkippedResult({
          action: "invalid_state",
          session,
          payload,
          update,
          message: "Send a text or voice correction for the current preview.",
        })
      }
      return this.applyReviewFeedback(update, payload, session, instruction)
    } catch (error) {
      return this.createReviewSkippedResult({
        action: "failed",
        session,
        payload,
        update,
        message: formatUnknownError(error),
      })
    }
  }

  private async approveEditSession(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    session: BotEditSession,
    command: NodeTelegramBotCommand,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    if (session.status === "approved" && session.approvedRevisionId) {
      return this.createReviewSkippedResult({
        action: "approved",
        command,
        session,
        revision: session.revisions.find((revision) => revision.id === session.approvedRevisionId),
        payload,
        update,
        message: "This edit session is already approved.",
      })
    }

    if (session.status !== "preview_ready") {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        command,
        session,
        payload,
        update,
        message: `Edit session is ${session.status}; approval is available only after a preview is ready.`,
      })
    }

    const revision = latestBotEditRevision(session)
    if (!revision) {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        command,
        session,
        payload,
        update,
        message: "This edit session has no revision to approve.",
      })
    }

    const timestamp = this.now()
    const approvedSession: BotEditSession = {
      ...session,
      status: "approved",
      approvedRevisionId: revision.id,
      approvedAt: timestamp,
      ...(payload.message_id !== undefined ? { approvedMessageId: String(payload.message_id) } : {}),
      updatedAt: timestamp,
    }
    await this.options.editSessionStore?.writeSession(approvedSession)

    const publishTarget = approvedSession.publishTarget
    if (this.options.publishService && publishTarget && approvedSession.currentArtifact) {
      return this.publishApprovedEditSession(update, payload, approvedSession, revision, command)
    }

    return this.createReviewSkippedResult({
      action: "approved",
      command,
      session: approvedSession,
      revision,
      payload,
      update,
    })
  }

  private async publishApprovedEditSession(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    session: BotEditSession,
    revision: BotEditRevision,
    command: NodeTelegramBotCommand,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const publishTarget = session.publishTarget
    if (!publishTarget || !session.currentArtifact) {
      return this.createReviewSkippedResult({
        action: "approved",
        command,
        session,
        revision,
        payload,
        update,
      })
    }

    const capabilityError = validateBotDestinationCapability(
      publishTarget,
      createBotDestinationCapabilityRegistry({
        publisher: this.options.publishService,
      }),
    )
    if (capabilityError) {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        command,
        session,
        revision,
        payload,
        update,
        message: capabilityError.userMessage,
      })
    }

    const publishingTimestamp = this.now()
    const publishingSession: BotEditSession = {
      ...session,
      status: "publishing",
      updatedAt: publishingTimestamp,
    }
    await this.options.editSessionStore?.writeSession(publishingSession)

    let publishResult: BotPublishResult
    try {
      publishResult = await this.options.publishService!.publish({
        destination: publishTarget,
        artifact: session.currentArtifact,
        metadata: {
          ...(session.chatId ? { chatId: session.chatId } : {}),
          ...(session.goal ? { caption: session.goal, title: session.goal } : {}),
        },
        params: {
          sessionId: session.id,
          revisionId: revision.id,
          approvedMessageId: session.approvedMessageId,
        },
      })
    } catch (error) {
      publishResult = {
        destination: publishTarget,
        status: "failed",
        error: formatUnknownError(error),
      }
    }
    const sanitizedPublishResult = redactSensitiveMetadata(publishResult)

    const publishedTimestamp = this.now()
    const publishedSession: BotEditSession = {
      ...publishingSession,
      status: sanitizedPublishResult.status === "done" ? "done" : "failed",
      publishResult: sanitizedPublishResult,
      ...(sanitizedPublishResult.status === "done"
        ? { publishedAt: publishedTimestamp }
        : { failedAt: publishedTimestamp }),
      ...(sanitizedPublishResult.status !== "done"
        ? { failure: sanitizedPublishResult.error ?? "Publishing failed" }
        : {}),
      metadata: mergeMetadataObservability(publishingSession.metadata, {
        lastPublish: createPublishObservability({
          session,
          revision,
          result: sanitizedPublishResult,
          timestamp: publishedTimestamp,
        }),
      }),
      updatedAt: publishedTimestamp,
    }
    await this.options.editSessionStore?.writeSession(publishedSession)

    return this.createReviewSkippedResult({
      action: sanitizedPublishResult.status === "done" ? "published" : "failed",
      command,
      session: publishedSession,
      revision,
      payload,
      update,
      publishResult: sanitizedPublishResult,
      message: sanitizedPublishResult.error,
    })
  }

  private async discardLatestEditRevision(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    session: BotEditSession,
    command: NodeTelegramBotCommand,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    if (session.status !== "preview_ready") {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        command,
        session,
        payload,
        update,
        message: `Edit session is ${session.status}; discard is available only after a preview is ready.`,
      })
    }

    if (session.revisions.length <= 1) {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        command,
        session,
        payload,
        update,
        message: "There is no previous revision to restore.",
      })
    }

    const revisions = session.revisions.slice(0, -1)
    const revision = latestBotEditRevision({ ...session, revisions })
    if (!revision) {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        command,
        session,
        payload,
        update,
        message: "There is no previous revision to restore.",
      })
    }

    const timestamp = this.now()
    const { currentArtifact: _currentArtifact, ...sessionWithoutArtifact } = session
    const discardedSession: BotEditSession = {
      ...sessionWithoutArtifact,
      status: "preview_ready",
      revisions,
      ...(revision.projectSchema !== undefined ? { currentProjectSchema: revision.projectSchema } : {}),
      ...(revision.artifact ? { currentArtifact: revision.artifact } : {}),
      updatedAt: timestamp,
    }
    await this.options.editSessionStore?.writeSession(discardedSession)

    return this.createReviewSkippedResult({
      action: "discarded",
      command,
      session: discardedSession,
      revision,
      payload,
      update,
    })
  }

  private async cancelEditSession(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    session: BotEditSession,
    command: NodeTelegramBotCommand,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const timestamp = this.now()
    const cancelledSession: BotEditSession = {
      ...session,
      status: "cancelled",
      cancelledAt: timestamp,
      updatedAt: timestamp,
    }
    await this.options.editSessionStore?.writeSession(cancelledSession)

    return this.createReviewSkippedResult({
      action: "cancelled",
      command,
      session: cancelledSession,
      payload,
      update,
    })
  }

  private async applyReviewFeedback(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    session: BotEditSession,
    instruction: string,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    if (session.status !== "preview_ready") {
      return this.createReviewSkippedResult({
        action: "invalid_state",
        session,
        payload,
        update,
        instruction,
        message: `Edit session is ${session.status}; revisions are accepted only after a preview is ready.`,
      })
    }

    if (!this.options.aiProjectEditor) {
      return this.createReviewSkippedResult({
        action: "failed",
        session,
        payload,
        update,
        instruction,
        message: "AI project editor is not configured for this bot worker.",
      })
    }

    if (!session.currentProjectSchema) {
      return this.createReviewSkippedResult({
        action: "failed",
        session,
        payload,
        update,
        instruction,
        message: "Current ProjectSchema is missing from this edit session.",
      })
    }

    const timestamp = this.now()
    const editingSession: BotEditSession = {
      ...session,
      status: "editing",
      updatedAt: timestamp,
    }
    await this.options.editSessionStore?.writeSession(editingSession)

    try {
      const edit = await runAIProjectEdit(
        this.options.aiProjectEditor,
        {
          currentProject: session.currentProjectSchema as ProjectSchema,
          sourceMedia: session.media,
          userInstruction: instruction,
          ...((session.publishTarget ?? session.previewDestination)
            ? { targetPlatform: session.publishTarget ?? session.previewDestination }
            : {}),
          revisionHistory: session.revisions.map((revision) => ({
            id: revision.id,
            index: revision.index,
            ...(revision.instruction ? { instruction: revision.instruction } : {}),
            ...(revision.summary ? { summary: revision.summary } : {}),
            createdAt: revision.createdAt,
          })),
          metadata: {
            sessionId: session.id,
            updateId: update.update_id,
            sourceMessageId: payload.message_id,
          },
        },
        {
          maxRepairAttempts: normalizeAIProjectEditMaxRepairAttempts(this.options.aiProjectEditMaxRepairAttempts),
        },
      )

      if (!edit.ok) {
        const failedSession = this.failEditSession(
          editingSession,
          edit.errors.map((error) => error.message).join("; "),
          {
            lastError: {
              stage: "ai_edit_validation",
              sessionId: session.id,
              updateId: update.update_id,
              ...(payload.message_id !== undefined ? { sourceMessageId: String(payload.message_id) } : {}),
              errors: edit.errors.map((error) => ({
                code: error.code,
                field: error.field,
                message: error.message,
              })),
            },
          },
        )
        await this.options.editSessionStore?.writeSession(failedSession)
        return this.createReviewSkippedResult({
          action: "failed",
          session: failedSession,
          payload,
          update,
          instruction,
          message: failedSession.failure,
        })
      }

      let revision = createAppliedEditRevision({
        session,
        instruction,
        result: edit.result,
        attempts: edit.attempts,
        sourceMessageId: payload.message_id,
        timestamp,
      })

      if (this.options.previewRenderer) {
        const artifact = await this.options.previewRenderer.renderPreview({
          session: editingSession,
          revision,
          projectSchema: edit.result.nextProject,
          update,
          payload,
        })
        const previewRenderedAt = this.now()
        revision = {
          ...revision,
          artifact,
          metadata: mergeMetadataObservability(
            revision.metadata,
            {
              renderPreview: createRenderPreviewObservability(artifact, previewRenderedAt),
            },
            {
              previewRenderedAt,
            },
          ),
        }
      }

      const previewReadySession: BotEditSession = {
        ...editingSession,
        status: "preview_ready",
        currentProjectSchema: edit.result.nextProject,
        ...(revision.artifact ? { currentArtifact: revision.artifact } : {}),
        revisionCounter: Math.max(editingSession.revisionCounter, revision.index + 1),
        revisions: [...editingSession.revisions, revision],
        updatedAt: timestamp,
      }

      if (revision.artifact) {
        revision = await this.deliverReviewPreview(previewReadySession, revision, payload)
        previewReadySession.revisions = [...editingSession.revisions, revision]
      }

      await this.options.editSessionStore?.writeSession(previewReadySession)

      return this.createReviewSkippedResult({
        action: "feedback_applied",
        session: previewReadySession,
        revision,
        payload,
        update,
        instruction,
        feedbackText: instruction,
      })
    } catch (error) {
      const failedSession = this.failEditSession(editingSession, formatUnknownError(error), {
        lastError: {
          stage: "ai_edit_exception",
          sessionId: session.id,
          updateId: update.update_id,
          ...(payload.message_id !== undefined ? { sourceMessageId: String(payload.message_id) } : {}),
          error: formatUnknownError(error),
        },
      })
      await this.options.editSessionStore?.writeSession(failedSession)
      return this.createReviewSkippedResult({
        action: "failed",
        session: failedSession,
        payload,
        update,
        instruction,
        message: failedSession.failure,
      })
    }
  }

  private failEditSession(
    session: BotEditSession,
    failure: string,
    observabilityPatch?: Record<string, unknown>,
  ): BotEditSession {
    const timestamp = this.now()
    return {
      ...session,
      status: "failed",
      failedAt: timestamp,
      failure,
      ...(observabilityPatch ? { metadata: mergeMetadataObservability(session.metadata, observabilityPatch) } : {}),
      updatedAt: timestamp,
    }
  }

  /**
   * Return a copy of {@link payload} with its `text` set to the transcription of
   * a voice idea, when {@link NodeTelegramBotWorkerOptions.transcribeVoiceIdeas}
   * is enabled and the message carries a voice/video-note idea without text.
   * Best-effort: a transcription failure leaves the original payload untouched
   * so the user's message is never dropped (#326).
   */
  private async applyVoiceIdeaTranscription(
    payload: TelegramLikeBotPayload,
  ): Promise<TelegramLikeBotPayload> {
    try {
      const ideaText = await this.resolveVoiceIdeaText(payload)
      return ideaText ? { ...payload, text: ideaText } : payload
    } catch {
      return payload
    }
  }

  private async resolveVoiceIdeaText(
    payload: TelegramLikeBotPayload,
  ): Promise<string | undefined> {
    if (!this.options.transcribeVoiceIdeas || !this.options.feedbackTranscriber) {
      return undefined
    }

    // Already has usable, non-command text — nothing to transcribe.
    const text = normalizedTelegramText(payload.text ?? payload.caption)
    if (text && !text.startsWith("/")) {
      return undefined
    }

    const workflow = createTelegramLikeBotWorkflow(payload)
    const media = workflow.media?.find((item) => getFeedbackMediaKind(item) !== undefined)
    if (!media) return undefined

    const kind = getFeedbackMediaKind(media)
    if (!kind) return undefined

    const transcription = await this.options.feedbackTranscriber.transcribeFeedback({
      workflow,
      media,
      kind,
      payload,
      metadata: {
        purpose: "idea",
      },
    })

    return normalizedTelegramText(transcription.text)
  }

  private async resolveReviewFeedbackText(
    payload: TelegramLikeBotPayload,
    session: BotEditSession,
  ): Promise<string | undefined> {
    const text = normalizedTelegramText(payload.text ?? payload.caption)
    if (text && !text.startsWith("/")) {
      return text
    }

    const workflow = createTelegramLikeBotWorkflow(payload)
    const media = workflow.media?.find((item) => getFeedbackMediaKind(item) !== undefined)
    if (!media) return undefined

    if (!this.options.feedbackTranscriber) {
      throw new Error("Feedback transcriber is not configured for voice/video-note review messages")
    }

    const kind = getFeedbackMediaKind(media)
    if (!kind) return undefined

    const transcription = await this.options.feedbackTranscriber.transcribeFeedback({
      workflow,
      media,
      kind,
      payload,
      metadata: {
        sessionId: session.id,
      },
    })

    return transcription.text.trim()
  }

  private async readCurrentEditSession(payload: TelegramLikeBotPayload): Promise<BotEditSession | undefined> {
    const store = this.options.editSessionStore
    if (!store) return undefined

    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    const userId = payload.from?.id === undefined ? undefined : String(payload.from.id)
    if (!chatId && !userId) return undefined

    return store.readCurrentSession({
      source: "telegram",
      ...(chatId ? { chatId } : {}),
      ...(userId ? { userId } : {}),
      activeOnly: true,
    })
  }

  private async createReviewSkippedResult(context: {
    action: NodeTelegramBotReviewAction
    command?: NodeTelegramBotCommand
    session?: BotEditSession
    revision?: BotEditRevision
    instruction?: string
    feedbackText?: string
    publishResult?: BotPublishResult
    message?: string
    payload: TelegramLikeBotPayload
    update: TelegramBotUpdate
  }): Promise<NodeTelegramBotWorkerUpdateResult> {
    const responseText = (this.options.reviewFormatter ?? defaultTelegramBotReviewText)({
      action: context.action,
      ...(context.command ? { command: context.command } : {}),
      ...(context.session ? { session: context.session } : {}),
      ...(context.revision ? { revision: context.revision } : {}),
      ...(context.instruction ? { instruction: context.instruction } : {}),
      ...(context.publishResult ? { publishResult: context.publishResult } : {}),
      ...(context.message ? { message: context.message } : {}),
      payload: context.payload,
      update: context.update,
    })
    let responseError: string | undefined

    try {
      await this.sendReviewResponse(context.payload, responseText, context.command)
    } catch (error) {
      responseError = formatUnknownError(error)
    }

    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: true,
      reason: "Telegram bot edit session handled",
      updateId: context.update.update_id,
      update: context.update,
      payload: context.payload,
      reviewAction: context.action,
      responseText,
      ...(context.command ? { command: context.command } : {}),
      ...(context.session ? { editSessionId: context.session.id, editSession: context.session } : {}),
      ...(context.revision ? { editRevision: context.revision } : {}),
      ...(context.feedbackText ? { feedbackText: context.feedbackText } : {}),
      ...(context.publishResult ? { publishResult: context.publishResult } : {}),
      ...(responseError ? { responseError } : {}),
    }
    await this.options.onResult?.(result)
    return result
  }

  private async sendReviewResponse(
    payload: TelegramLikeBotPayload,
    text: string,
    command?: NodeTelegramBotCommand,
  ): Promise<void> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    if (!chatId) return

    const responder = this.resolveReviewResponder()
    await responder?.sendMessage({
      chatId,
      text,
      ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
      metadata: {
        review: true,
        source: "telegram-bot-worker",
        ...(command ? { command } : {}),
      },
    })
  }

  private async deliverReviewPreview(
    session: BotEditSession,
    revision: BotEditRevision,
    payload: TelegramLikeBotPayload,
  ): Promise<BotEditRevision> {
    const artifact = revision.artifact
    const chatId = session.chatId ?? (payload.chat?.id === undefined ? undefined : String(payload.chat.id))
    if (!artifact || !chatId) return revision

    const responder = this.resolvePreviewResponder()
    const caption = formatReviewPreviewCaption(revision)

    if (artifact.path && responder?.sendVideo) {
      try {
        const sent = await responder.sendVideo({
          chatId,
          path: artifact.path,
          caption,
          mimeType: artifact.mimeType,
          metadata: {
            sessionId: session.id,
            revisionId: revision.id,
          },
        })
        const previewDelivery = {
          status: "sent",
          messageId: sent.messageId,
          artifactPath: artifact.path,
        }
        return {
          ...revision,
          metadata: mergeMetadataObservability(revision.metadata, { previewDelivery }, { previewDelivery }),
        }
      } catch (error) {
        await this.sendReviewPreviewFallback(responder, chatId, payload, revision, formatUnknownError(error))
        const previewDelivery = {
          status: "failed",
          error: formatUnknownError(error),
          artifactPath: artifact.path,
        }
        return {
          ...revision,
          metadata: mergeMetadataObservability(revision.metadata, { previewDelivery }, { previewDelivery }),
        }
      }
    }

    await this.sendReviewPreviewFallback(responder, chatId, payload, revision)
    const previewDelivery = {
      status: "fallback_message",
      artifact: artifact.url ?? artifact.path,
    }
    return {
      ...revision,
      metadata: mergeMetadataObservability(revision.metadata, { previewDelivery }, { previewDelivery }),
    }
  }

  private async sendReviewPreviewFallback(
    responder: NodeTelegramBotReviewPreviewResponder | undefined,
    chatId: string,
    payload: TelegramLikeBotPayload,
    revision: BotEditRevision,
    error?: string,
  ): Promise<void> {
    try {
      await responder?.sendMessage({
        chatId,
        text: formatReviewPreviewFallbackText(revision, error),
        ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
        metadata: {
          preview: true,
          sessionRevisionId: revision.id,
          source: "telegram-bot-worker",
        },
      })
    } catch {
      // Preview fallback delivery is best-effort; revision artifact remains in session history.
    }
  }

  private async handleDraftUpdate(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    options: NodeTelegramBotWorkerHandleOptions,
  ): Promise<NodeTelegramBotWorkerUpdateResult | null> {
    const store = this.options.draftStore
    if (!store) return null

    const workflow = createTelegramLikeBotWorkflow(payload)
    const draftId = createBotWorkflowDraftId(workflow)
    const draftCommand = parseTelegramBotDraftCommand(payload.text)

    if (draftCommand === "cancel") {
      await store.deleteDraft(draftId)
      return this.createDraftSkippedResult({
        action: "cancelled",
        draftId,
        payload,
        update,
      })
    }

    const existingDraft = await store.readDraft(draftId)
    const draft = mergeBotWorkflowDraft(existingDraft, workflow, { now: this.options.now })

    if (draftCommand === "render") {
      return this.runOrQueueWorkflow(update, payload, {
        draftId,
        workflow: draft.workflow,
        run: (workflowOptions) =>
          this.options.workflow.runWorkflow(
            draft.workflow,
            this.withReviewApprovalGate(
              mergeWorkflowOptions(
                mergeWorkflowOptions(this.workflowOptions, options.workflowOptions),
                workflowOptions,
              ),
            ),
          ),
        onComplete: async (workflowResult) => {
          if (workflowResult.ok) {
            await store.deleteDraft(draftId)
          } else {
            await store.writeDraft(draft)
          }
          await this.upsertReviewEditSessionFromWorkflowResult(workflowResult)
        },
      })
    }

    await store.writeDraft(draft)
    return this.createDraftSkippedResult({
      action: "updated",
      draftId,
      draft,
      payload,
      update,
    })
  }

  private async createDraftSkippedResult(context: {
    action: NodeTelegramBotDraftAction
    draftId: string
    draft?: BotWorkflowDraft
    payload: TelegramLikeBotPayload
    update: TelegramBotUpdate
  }): Promise<NodeTelegramBotWorkerUpdateResult> {
    const responseText = (this.options.draftFormatter ?? defaultTelegramBotDraftText)({
      action: context.action,
      draftId: context.draftId,
      ...(context.draft ? { draft: context.draft } : {}),
      payload: context.payload,
      update: context.update,
    })
    let responseError: string | undefined

    try {
      await this.sendDraftResponse(context.draftId, context.payload, responseText)
    } catch (error) {
      responseError = formatUnknownError(error)
    }

    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: true,
      reason: context.action === "updated" ? "Telegram bot draft updated" : "Telegram bot draft cancelled",
      updateId: context.update.update_id,
      update: context.update,
      draftAction: context.action,
      draftId: context.draftId,
      ...(context.draft ? { draft: context.draft } : {}),
      payload: context.payload,
      responseText,
      ...(responseError ? { responseError } : {}),
    }
    await this.options.onResult?.(result)
    return result
  }

  private async upsertReviewEditSessionFromWorkflowResult(workflowResult: BotWorkflowRunResult): Promise<void> {
    const store = this.options.editSessionStore
    if (!store || !workflowResult.ok || !workflowResult.approvalGate?.enabled) return
    if (workflowResult.result.job.status !== "done") return

    const projectSchema = readInlineProjectSchema(workflowResult.renderJob.project)
    const artifact = workflowResult.result.job.artifact
    if (!projectSchema || !artifact) return

    const timestamp = this.now()
    const existing = await store.readCurrentSession({
      source: workflowResult.workflow.source,
      ...(workflowResult.workflow.chatId ? { chatId: workflowResult.workflow.chatId } : {}),
      ...(workflowResult.workflow.userId ? { userId: workflowResult.workflow.userId } : {}),
      activeOnly: true,
    })
    const sessionId = existing?.id ?? createBotEditSessionId(workflowResult.workflow)
    const revisionIndex = existing?.revisionCounter ?? 0
    const revisionId = createBotEditRevisionId(sessionId, revisionIndex)
    const session = mergeBotEditSessionWorkflow(existing, workflowResult.workflow, {
      now: () => timestamp,
      status: "preview_ready",
      currentProjectSchema: projectSchema,
      currentArtifact: artifact,
      previewDestination: workflowResult.approvalGate.previewDestination,
      ...(workflowResult.approvalGate.publishTarget
        ? { publishTarget: workflowResult.approvalGate.publishTarget }
        : {}),
      revision: {
        projectSchema,
        artifact,
        summary: "Initial preview",
        changedAreas: ["renderJob.project"],
        diagnostics: ["info: initial_preview: Initial approval-gated preview rendered."],
        metadata: {
          source: "telegram-bot-worker",
          renderJobId: workflowResult.result.job.id,
          approvalGate: workflowResult.approvalGate,
          observability: {
            sessionId,
            revisionId,
            revisionIndex,
            renderPreview: createRenderPreviewObservability(artifact, timestamp, workflowResult.result.job.id),
          },
        },
      },
      metadata: {
        source: "telegram-bot-worker",
        renderJobId: workflowResult.result.job.id,
        approvalGate: workflowResult.approvalGate,
        observability: {
          sessionId,
          renderPreview: createRenderPreviewObservability(artifact, timestamp, workflowResult.result.job.id),
        },
      },
    })

    await store.writeSession(session)
  }

  private async sendDraftResponse(draftId: string, payload: TelegramLikeBotPayload, text: string): Promise<void> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    if (!chatId) return

    const responder = this.resolveDraftResponder()
    await responder?.sendMessage({
      chatId,
      text,
      ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
      metadata: {
        draftId,
        source: "telegram-bot-worker",
      },
    })
  }

  private async runOrQueueWorkflow(
    update: TelegramBotUpdate,
    payload: TelegramLikeBotPayload,
    options: {
      run: (workflowOptions?: NodeBotWorkflowServiceOptions) => Promise<BotWorkflowRunResult>
      workflow?: BotWorkflowRequest
      draftId?: string
      sourcePayload?: TelegramLikeBotPayload
      sourceWorkflow?: BotWorkflowRequest
      retryOf?: string
      onComplete?: (result: BotWorkflowRunResult) => void | Promise<void>
    },
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const workflowQueue = this.options.workflowQueue
    const queueId = createTelegramBotWorkflowQueueId(update)
    const existingJob = await this.readWorkflowJobRecord(queueId)
    if (existingJob) {
      return this.createDuplicateWorkflowJobResult({
        queueId,
        update,
        payload,
        job: existingJob,
        ...(options.retryOf ? { retryOf: options.retryOf } : {}),
      })
    }

    const jobRecord = this.createWorkflowJobRecord({
      queueId,
      status: workflowQueue ? "queued" : "running",
      reason: workflowQueue ? "Telegram bot workflow queued" : "Telegram bot workflow running",
      update,
      payload,
      ...(options.draftId ? { draftId: options.draftId } : {}),
      sourcePayload: options.sourcePayload ?? payload,
      ...((options.sourceWorkflow ?? options.workflow)
        ? { sourceWorkflow: options.sourceWorkflow ?? options.workflow }
        : {}),
      ...(options.retryOf ? { retryOf: options.retryOf } : {}),
    })
    const trackingOptions = this.createWorkflowJobTrackingOptions(jobRecord)
    if (!workflowQueue) {
      await this.writeWorkflowJobRecord(jobRecord)
      try {
        const workflowResult = await options.run(trackingOptions)
        await this.writeWorkflowJobRecord(this.completeWorkflowJobRecord(jobRecord, workflowResult))
        await options.onComplete?.(workflowResult)
        const result: NodeTelegramBotWorkerUpdateResult = {
          skipped: false,
          updateId: update.update_id,
          update,
          payload,
          result: workflowResult,
          ...(options.retryOf ? { retryOf: options.retryOf } : {}),
        }
        await this.options.onResult?.(result)
        return result
      } catch (error) {
        await this.writeWorkflowJobRecord(this.failWorkflowJobRecord(jobRecord, error))
        throw error
      }
    }

    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: false,
      queued: true,
      queueId,
      reason: "Telegram bot workflow queued",
      updateId: update.update_id,
      update,
      payload,
      ...(options.workflow ? { workflow: options.workflow } : {}),
      ...(options.draftId ? { draftId: options.draftId } : {}),
      ...(options.retryOf ? { retryOf: options.retryOf } : {}),
    }
    await this.writeWorkflowJobRecord(jobRecord)
    const submission = await workflowQueue.enqueue({
      id: queueId,
      update,
      payload,
      run: async () => {
        await this.writeWorkflowJobRecord(
          this.updateWorkflowJobRecord(jobRecord, {
            status: "running",
            reason: "Telegram bot workflow running",
          }),
        )
        return options.run(trackingOptions)
      },
      onComplete: async (workflowResult) => {
        result.completion = workflowResult
        await this.writeWorkflowJobRecord(this.completeWorkflowJobRecord(jobRecord, workflowResult))
        await options.onComplete?.(workflowResult)
        await this.options.onResult?.({
          skipped: false,
          updateId: update.update_id,
          update,
          payload,
          result: workflowResult,
          ...(options.retryOf ? { retryOf: options.retryOf } : {}),
        })
      },
      onError: async (error) => {
        result.error = formatUnknownError(error)
        await this.writeWorkflowJobRecord(this.failWorkflowJobRecord(jobRecord, error))
        await this.createUpdateErrorResult(update, error)
      },
    })

    if (submission.status === "rejected") {
      await this.writeWorkflowJobRecord(
        this.updateWorkflowJobRecord(jobRecord, {
          status: "rejected",
          reason: submission.reason,
        }),
      )
      return this.createQueueRejectedResult({
        queueId: submission.id,
        reason: submission.reason,
        update,
        payload,
        ...(options.workflow ? { workflow: options.workflow } : {}),
        ...(options.draftId ? { draftId: options.draftId } : {}),
        ...(options.retryOf ? { retryOf: options.retryOf } : {}),
      })
    }

    result.queueId = submission.id
    const responseText = this.options.disableQueueResponses
      ? undefined
      : (this.options.queueFormatter ?? defaultTelegramBotQueueText)({
          queueId: submission.id,
          update,
          payload,
          ...(options.workflow ? { workflow: options.workflow } : {}),
          ...(options.draftId ? { draftId: options.draftId } : {}),
        })
    if (responseText) {
      result.responseText = responseText
      try {
        await this.sendQueueResponse(submission.id, payload, responseText)
      } catch (error) {
        result.responseError = formatUnknownError(error)
      }
    }
    await this.options.onResult?.(result)
    return result
  }

  private async createDuplicateWorkflowJobResult(context: {
    queueId: string
    update: TelegramBotUpdate
    payload: TelegramLikeBotPayload
    job: NodeTelegramBotWorkflowJobRecord
    retryOf?: string
  }): Promise<NodeTelegramBotWorkerUpdateResult> {
    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: true,
      reason: "Telegram bot workflow already handled",
      updateId: context.update.update_id,
      update: context.update,
      payload: context.payload,
      queueId: context.queueId,
      duplicateOf: context.queueId,
      workflowJob: context.job,
      ...(context.retryOf ? { retryOf: context.retryOf } : {}),
    }
    await this.options.onResult?.(result)
    return result
  }

  private async createQueueRejectedResult(context: {
    queueId: string
    reason: string
    update: TelegramBotUpdate
    payload: TelegramLikeBotPayload
    workflow?: BotWorkflowRequest
    draftId?: string
  }): Promise<NodeTelegramBotWorkerUpdateResult> {
    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: false,
      rejected: true,
      queueId: context.queueId,
      reason: context.reason,
      updateId: context.update.update_id,
      update: context.update,
      payload: context.payload,
      ...(context.workflow ? { workflow: context.workflow } : {}),
      ...(context.draftId ? { draftId: context.draftId } : {}),
    }
    const responseText = this.options.disableQueueResponses
      ? undefined
      : (this.options.queueRejectedFormatter ?? defaultTelegramBotQueueRejectedText)({
          queueId: context.queueId,
          reason: context.reason,
          update: context.update,
          payload: context.payload,
          ...(context.workflow ? { workflow: context.workflow } : {}),
          ...(context.draftId ? { draftId: context.draftId } : {}),
        })

    if (responseText) {
      result.responseText = responseText
      try {
        await this.sendQueueResponse(context.queueId, context.payload, responseText)
      } catch (error) {
        result.responseError = formatUnknownError(error)
      }
    }

    await this.options.onResult?.(result)
    return result
  }

  private async sendQueueResponse(queueId: string, payload: TelegramLikeBotPayload, text: string): Promise<void> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    if (!chatId) return

    const responder = this.resolveQueueResponder()
    await responder?.sendMessage({
      chatId,
      text,
      ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
      metadata: {
        queueId,
        source: "telegram-bot-worker",
      },
    })
  }

  private createWorkflowJobRecord(context: {
    queueId: string
    status: NodeTelegramBotWorkflowJobRecord["status"]
    reason: string
    update: TelegramBotUpdate
    payload: TelegramLikeBotPayload
    draftId?: string
    sourcePayload?: TelegramLikeBotPayload
    sourceWorkflow?: BotWorkflowRequest
    retryOf?: string
  }): NodeTelegramBotWorkflowJobRecord {
    const timestamp = this.now()
    return {
      id: context.queueId,
      status: context.status,
      updateId: context.update.update_id,
      createdAt: timestamp,
      updatedAt: timestamp,
      reason: context.reason,
      ...(context.payload.chat?.id !== undefined ? { chatId: String(context.payload.chat.id) } : {}),
      ...(context.payload.from?.id !== undefined ? { userId: String(context.payload.from.id) } : {}),
      ...(context.payload.message_id !== undefined ? { messageId: String(context.payload.message_id) } : {}),
      ...(context.draftId ? { draftId: context.draftId } : {}),
      ...(context.sourcePayload ? { sourcePayload: context.sourcePayload } : {}),
      ...(context.sourceWorkflow ? { sourceWorkflow: context.sourceWorkflow } : {}),
      ...(context.retryOf ? { retryOf: context.retryOf } : {}),
    }
  }

  private createWorkflowJobTrackingOptions(
    record: NodeTelegramBotWorkflowJobRecord,
  ): NodeBotWorkflowServiceOptions | undefined {
    if (!this.options.workflowJobStore) return undefined

    const eventSink: BotRenderJobEventSink = {
      publish: async (_event, snapshot) => {
        await this.writeWorkflowJobRecord(this.updateWorkflowJobRecordFromSnapshot(record, snapshot))
      },
      publishSnapshot: async (snapshot) => {
        await this.writeWorkflowJobRecord(this.updateWorkflowJobRecordFromSnapshot(record, snapshot))
      },
    }

    return {
      render: {
        eventSinks: [eventSink],
      },
    }
  }

  private updateWorkflowJobRecord(
    record: NodeTelegramBotWorkflowJobRecord,
    patch: Pick<NodeTelegramBotWorkflowJobRecord, "status" | "reason">,
  ): NodeTelegramBotWorkflowJobRecord {
    return {
      ...record,
      ...patch,
      updatedAt: this.now(),
    }
  }

  private updateWorkflowJobRecordFromSnapshot(
    record: NodeTelegramBotWorkflowJobRecord,
    snapshot: BotRenderJobSnapshot,
  ): NodeTelegramBotWorkflowJobRecord {
    return {
      ...record,
      status: mapRenderJobStatusToWorkflowJobStatus(snapshot.status),
      reason: `Render status: ${snapshot.status}`,
      updatedAt: snapshot.updatedAt,
      renderJobId: snapshot.jobId,
      renderJobStatus: snapshot.status,
      ...(snapshot.artifact ? { artifact: snapshot.artifact } : {}),
      ...(snapshot.error ? { error: snapshot.error } : {}),
    }
  }

  private completeWorkflowJobRecord(
    record: NodeTelegramBotWorkflowJobRecord,
    workflowResult: BotWorkflowRunResult,
  ): NodeTelegramBotWorkflowJobRecord {
    if (!workflowResult.ok) {
      return {
        ...record,
        status: "failed",
        reason: "Bot workflow validation failed",
        error: workflowResult.errors.map((error) => error.userMessage).join("; "),
        updatedAt: this.now(),
      }
    }

    const job = workflowResult.result.job
    const failed = job.status === "failed"
    return {
      ...record,
      status: job.status === "cancelled" ? "cancelled" : failed ? "failed" : "done",
      reason:
        job.status === "cancelled"
          ? "Bot workflow render cancelled"
          : failed
            ? "Bot workflow render failed"
            : "Bot workflow completed",
      updatedAt: this.now(),
      renderJobId: job.id,
      renderJobStatus: job.status,
      ...(job.error ? { error: job.error } : {}),
      ...(job.artifact ? { artifact: job.artifact } : {}),
    }
  }

  private failWorkflowJobRecord(
    record: NodeTelegramBotWorkflowJobRecord,
    error: unknown,
  ): NodeTelegramBotWorkflowJobRecord {
    return {
      ...record,
      status: "failed",
      reason: "Bot workflow execution failed",
      error: formatUnknownError(error),
      updatedAt: this.now(),
    }
  }

  private async writeWorkflowJobRecord(record: NodeTelegramBotWorkflowJobRecord): Promise<void> {
    try {
      await this.options.workflowJobStore?.writeJob(record)
    } catch {
      // Job status persistence is observational and must not fail workflow handling.
    }
  }

  private async readWorkflowJobRecord(id: string): Promise<NodeTelegramBotWorkflowJobRecord | undefined> {
    try {
      return await this.options.workflowJobStore?.readJob(id)
    } catch {
      // Job status persistence is observational and must not fail workflow handling.
      return undefined
    }
  }

  private async handlePollingUpdate(
    update: TelegramBotUpdate,
    options: NodeTelegramBotWorkerHandleOptions,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    try {
      return await this.handleUpdate(update, options)
    } catch (error) {
      return this.createUpdateErrorResult(update, error)
    }
  }

  private async createUpdateErrorResult(
    update: TelegramBotUpdate,
    error: unknown,
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const payload = createTelegramLikePayloadFromUpdate(update) ?? undefined
    const errorMessage = formatUnknownError(error)
    const responseText = this.options.disableErrorResponses
      ? undefined
      : (this.options.errorFormatter ?? defaultTelegramBotUpdateErrorText)({
          updateId: update.update_id,
          update,
          ...(payload ? { payload } : {}),
          error: errorMessage,
        })
    let responseError: string | undefined

    if (responseText && payload) {
      try {
        await this.sendUpdateErrorResponse(update.update_id, payload, responseText)
      } catch (responseErrorValue) {
        responseError = formatUnknownError(responseErrorValue)
      }
    }

    const result: NodeTelegramBotWorkerUpdateResult = {
      skipped: false,
      failed: true,
      reason: "Telegram update handling failed",
      updateId: update.update_id,
      update,
      ...(payload ? { payload } : {}),
      error: errorMessage,
      ...(responseText ? { responseText } : {}),
      ...(responseError ? { responseError } : {}),
    }
    await this.options.onResult?.(result)
    return result
  }

  private async sendUpdateErrorResponse(
    updateId: number,
    payload: TelegramLikeBotPayload,
    text: string,
  ): Promise<void> {
    const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
    if (!chatId) return

    const responder = this.resolveErrorResponder()
    await responder?.sendMessage({
      chatId,
      text,
      ...(payload.message_id !== undefined ? { replyToMessageId: String(payload.message_id) } : {}),
      metadata: {
        error: true,
        source: "telegram-bot-worker",
        updateId,
      },
    })
  }

  private resolveCommandResponder(): NodeTelegramStatusClient | undefined {
    if (this.options.commandResponder) return this.options.commandResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }

  private resolveAccessDeniedResponder(): NodeTelegramStatusClient | undefined {
    if (this.options.accessDeniedResponder) return this.options.accessDeniedResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }

  private resolveDraftResponder(): NodeTelegramStatusClient | undefined {
    if (this.options.draftResponder) return this.options.draftResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }

  private resolveQueueResponder(): NodeTelegramStatusClient | undefined {
    if (this.options.queueResponder) return this.options.queueResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }

  private resolveErrorResponder(): NodeTelegramStatusClient | undefined {
    if (this.options.errorResponder) return this.options.errorResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }

  private resolveReviewResponder(): NodeTelegramStatusClient | undefined {
    if (this.options.reviewResponder) return this.options.reviewResponder
    if (this.options.commandResponder) return this.options.commandResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }

  private resolvePreviewResponder(): NodeTelegramBotReviewPreviewResponder | undefined {
    if (this.options.previewResponder) return this.options.previewResponder
    if (this.options.reviewResponder) return this.options.reviewResponder
    if (!this.options.botToken) return undefined
    return new NodeBotStatusNotifier({
      telegram: {
        botToken: this.options.botToken,
      },
      fetch: this.options.fetch,
    })
  }
}

function createTelegramBotWorkflowQueueId(update: TelegramBotUpdate): string {
  return `telegram-update-${update.update_id}`
}

export function createTelegramLikePayloadFromUpdate(update: TelegramBotUpdate): TelegramLikeBotPayload | null {
  const message = update.message ?? update.edited_message ?? update.channel_post ?? update.edited_channel_post
  if (!message) return null

  return {
    ...(message.chat?.id !== undefined ? { chat: { id: message.chat.id } } : {}),
    ...(message.from?.id !== undefined ? { from: { id: message.from.id } } : {}),
    ...(message.message_id !== undefined ? { message_id: message.message_id } : {}),
    ...(message.text ? { text: message.text } : {}),
    ...(message.caption ? { caption: message.caption } : {}),
    ...(message.document ? { document: telegramFile(message.document) } : {}),
    ...(message.video ? { video: telegramFile(message.video) } : {}),
    ...(message.audio ? { audio: telegramFile(message.audio) } : {}),
    ...(message.voice ? { voice: telegramFile(message.voice) } : {}),
    ...(message.video_note ? { video_note: telegramFile(message.video_note) } : {}),
    ...(message.animation ? { animation: telegramFile(message.animation) } : {}),
    ...(message.photo ? { photo: message.photo.map(telegramFile) } : {}),
  }
}

export function isTelegramBotAccessAllowed(
  payload: TelegramLikeBotPayload,
  policy: NodeTelegramBotAccessPolicy | undefined,
): boolean {
  if (!policy) return true

  const allowedChatIds = new Set((policy.allowedChatIds ?? []).map(String))
  const allowedUserIds = new Set((policy.allowedUserIds ?? []).map(String))
  if (allowedChatIds.size === 0 && allowedUserIds.size === 0) return true

  const chatId = payload.chat?.id === undefined ? undefined : String(payload.chat.id)
  const userId = payload.from?.id === undefined ? undefined : String(payload.from.id)

  return Boolean((chatId && allowedChatIds.has(chatId)) || (userId && allowedUserIds.has(userId)))
}

function telegramFile(file: TelegramBotFile): TelegramLikeBotFile {
  return {
    ...(file.file_id ? { file_id: file.file_id } : {}),
    ...(file.file_unique_id ? { file_unique_id: file.file_unique_id } : {}),
    ...(file.file_name ? { file_name: file.file_name } : {}),
    ...(file.mime_type ? { mime_type: file.mime_type } : {}),
    ...(file.file_size !== undefined ? { file_size: file.file_size } : {}),
    ...(file.file_path ? { file_path: file.file_path } : {}),
    ...(file.duration !== undefined ? { duration: file.duration } : {}),
    ...(file.width !== undefined ? { width: file.width } : {}),
    ...(file.height !== undefined ? { height: file.height } : {}),
  }
}

export function parseTelegramBotCommand(text: string | undefined): NodeTelegramBotCommand | null {
  const token = text?.trim().split(/\s+/)[0]?.toLowerCase()
  if (!token?.startsWith("/")) return null

  const command = token.split("@")[0]
  switch (command) {
    case "/approve":
      return "approve"
    case "/discard":
      return "discard"
    case "/start":
      return "start"
    case "/help":
      return "help"
    case "/status":
      return "status"
    case "/revise":
      return "revise"
    case "/versions":
      return "versions"
    case "/cancel":
      return parseTelegramBotCancelCommandTarget(text) ? "cancel" : null
    case "/retry":
      return parseTelegramBotRetryCommandTarget(text) ? "retry" : null
    default:
      return null
  }
}

export function parseTelegramBotReviewCommand(text: string | undefined): NodeTelegramBotCommand | null {
  const tokens = text?.trim().split(/\s+/) ?? []
  const command = tokens[0]?.toLowerCase().split("@")[0]
  switch (command) {
    case "/approve":
      return "approve"
    case "/discard":
      return "discard"
    case "/revise":
      return "revise"
    case "/versions":
      return "versions"
    case "/cancel":
      return tokens[1] ? null : "cancel"
    default:
      return null
  }
}

export function parseTelegramBotReviseInstruction(text: string | undefined): string | undefined {
  const raw = text?.trim()
  if (!raw) return undefined

  const [token = "", ...rest] = raw.split(/\s+/)
  const command = token.toLowerCase().split("@")[0]
  if (command !== "/revise") return undefined

  const instruction = rest.join(" ").trim()
  return instruction.length > 0 ? instruction : undefined
}

export function parseTelegramBotCancelCommandTarget(text: string | undefined): string | null {
  const tokens = text?.trim().split(/\s+/) ?? []
  const command = tokens[0]?.toLowerCase().split("@")[0]
  if (command !== "/cancel") return null
  return tokens[1]?.trim() || null
}

export function parseTelegramBotRetryCommandTarget(text: string | undefined): string | null {
  const tokens = text?.trim().split(/\s+/) ?? []
  const command = tokens[0]?.toLowerCase().split("@")[0]
  if (command !== "/retry") return null
  return tokens[1]?.trim() || null
}

export function parseTelegramBotDraftCommand(text: string | undefined): NodeTelegramBotDraftCommand | null {
  const token = text?.trim().split(/\s+/)[0]?.toLowerCase()
  if (!token?.startsWith("/")) return null

  const command = token.split("@")[0]
  switch (command) {
    case "/render":
      return "render"
    case "/cancel":
      return "cancel"
    default:
      return null
  }
}

export function defaultTelegramBotCommandText(): string {
  return [
    "Timeline Studio bot",
    "Send a video, link, or project with render hints.",
    "Examples:",
    "https://cdn.example.com/input.mov 1080p telegram",
    "template=promo destination=telegram",
    'project="./project.json" destination=file output="./out.mp4"',
    "Options: template, project, media/url/input/source, destination, output, resolution.",
    "Commands: /status, /render, /approve, /revise, /versions, /discard, /cancel, /cancel <queueId>, /retry <queueId>.",
  ].join("\n")
}

export function defaultTelegramBotAccessDeniedText(): string {
  return ["Timeline Studio bot", "This bot is not enabled for this Telegram chat or user."].join("\n")
}

export function defaultTelegramBotJobStatusText(context: NodeTelegramBotJobStatusFormatterContext): string {
  if (context.jobs.length === 0) {
    return ["Timeline Studio bot", "No recent render jobs for this chat.", "Send a video or link to start one."].join(
      "\n",
    )
  }

  return ["Timeline Studio bot", "Recent render jobs:", ...context.jobs.map(formatTelegramBotJobStatusLine)].join("\n")
}

export function defaultTelegramBotJobCancelText(context: NodeTelegramBotJobCancelFormatterContext): string {
  if (context.cancellation.status === "cancelled") {
    return ["Timeline Studio bot", "Render job cancelled.", `Queue id: ${context.queueId}`].join("\n")
  }

  return [
    "Timeline Studio bot",
    "Could not cancel this render job.",
    context.cancellation.reason ?? "The job is not queued or is no longer available.",
    ...(context.queueId ? [`Queue id: ${context.queueId}`] : []),
  ].join("\n")
}

export function defaultTelegramBotJobRetryText(context: NodeTelegramBotJobRetryFormatterContext): string {
  return [
    "Timeline Studio bot",
    "Could not retry this render job.",
    context.reason ?? "The job is not failed/cancelled or is no longer available.",
    ...(context.queueId ? [`Queue id: ${context.queueId}`] : []),
  ].join("\n")
}

export function defaultTelegramBotDraftText(context: NodeTelegramBotDraftFormatterContext): string {
  if (context.action === "cancelled") {
    return ["Timeline Studio bot", "Draft cleared.", "Send a new video, link, or project when ready."].join("\n")
  }

  return [
    "Timeline Studio bot",
    "Saved this input.",
    "Send more media or hints, then send /render.",
    "Send /cancel to clear the draft.",
  ].join("\n")
}

export function defaultTelegramBotQueueText(context: NodeTelegramBotQueueFormatterContext): string {
  return [
    "Timeline Studio bot",
    "Render request queued.",
    `Queue id: ${context.queueId}`,
    "I will send progress and the result here.",
  ].join("\n")
}

export function defaultTelegramBotQueueRejectedText(context: NodeTelegramBotQueueRejectedFormatterContext): string {
  return [
    "Timeline Studio bot",
    "Render queue is full right now.",
    "Please try again in a few minutes.",
    `Queue id: ${context.queueId}`,
  ].join("\n")
}

export function defaultTelegramBotUpdateErrorText(): string {
  return ["Timeline Studio bot", "Could not process this request.", "Try again or send /help."].join("\n")
}

export function defaultTelegramBotReviewText(context: NodeTelegramBotReviewFormatterContext): string {
  switch (context.action) {
    case "approved":
      return [
        "Timeline Studio bot",
        `Approved revision: ${context.revision?.id ?? context.session?.approvedRevisionId ?? "current"}`,
        "Final publishing is gated and will run from the approved session state.",
      ].join("\n")
    case "awaiting_feedback":
      return [
        "Timeline Studio bot",
        "Send the correction as text or voice.",
        "You can also send /revise followed by the requested change.",
      ].join("\n")
    case "cancelled":
      return ["Timeline Studio bot", "AI review session cancelled.", "Send new media when ready."].join("\n")
    case "discarded":
      return [
        "Timeline Studio bot",
        `Discarded latest revision. Current revision: ${context.revision?.id ?? "previous"}`,
      ].join("\n")
    case "failed":
      return ["Timeline Studio bot", "Could not apply this review action.", context.message ?? "Unknown error."].join(
        "\n",
      )
    case "feedback_applied":
      return [
        "Timeline Studio bot",
        `Applied revision: ${context.revision?.id ?? "new"}`,
        ...(context.revision?.summary ? [context.revision.summary] : []),
        "Review the next preview, then send another correction or /approve.",
      ].join("\n")
    case "invalid_state":
      return [
        "Timeline Studio bot",
        "This review action is not available right now.",
        context.message ?? formatBotEditSessionStatus(context.session),
      ].join("\n")
    case "not_found":
      return ["Timeline Studio bot", context.message ?? "No active AI review session was found for this chat."].join(
        "\n",
      )
    case "published":
      return [
        "Timeline Studio bot",
        `Approved revision: ${context.revision?.id ?? context.session?.approvedRevisionId ?? "current"}`,
        `Published to ${context.publishResult?.destination ?? context.session?.publishTarget ?? "destination"}.`,
        ...(context.publishResult?.url ? [context.publishResult.url] : []),
      ].join("\n")
    case "status":
      return formatBotEditSessionStatusMessage(context.session)
    case "versions":
      return formatBotEditSessionVersionsMessage(context.session)
  }
}

function formatBotEditSessionStatusMessage(session: BotEditSession | undefined): string {
  if (!session) {
    return ["Timeline Studio bot", "No active AI review session for this chat."].join("\n")
  }

  return [
    "Timeline Studio bot",
    formatBotEditSessionStatus(session),
    ...(session.goal ? [`Goal: ${truncateStatusText(session.goal)}`] : []),
    ...(session.publishResult ? [formatBotEditSessionPublishLine(session.publishResult)] : []),
    ...(session.failure ? [`Failure: ${truncateStatusText(session.failure)}`] : []),
    ...(session.revisions.length > 0 ? ["Recent revisions:", ...formatRecentBotEditRevisionLines(session)] : []),
  ].join("\n")
}

function formatBotEditSessionVersionsMessage(session: BotEditSession | undefined): string {
  if (!session) {
    return ["Timeline Studio bot", "No active AI review session for this chat."].join("\n")
  }

  if (session.revisions.length === 0) {
    return [
      "Timeline Studio bot",
      "This AI review session has no revisions yet.",
      formatBotEditSessionStatus(session),
    ].join("\n")
  }

  return ["Timeline Studio bot", "AI review revisions:", ...session.revisions.map(formatBotEditRevisionLine)].join("\n")
}

function formatBotEditSessionStatus(session: BotEditSession | undefined): string {
  if (!session) return "No active AI review session."
  return `AI review session ${session.id}: ${session.status}, revisions=${session.revisions.length}`
}

function formatRecentBotEditRevisionLines(session: BotEditSession, limit = 5): string[] {
  return session.revisions.slice(-limit).map(formatBotEditRevisionLine)
}

function formatBotEditRevisionLine(revision: BotEditRevision): string {
  const details = [`#${revision.index}`, revision.id]
  if (revision.summary) details.push(truncateStatusText(revision.summary))
  const observability = readRevisionObservability(revision)
  const editor = readRevisionEditorMetadata(revision)
  const editorLine = formatRevisionEditorLine(editor)
  if (editorLine) details.push(editorLine)
  const attempts = readNumericMetadataValue(observability?.attempts ?? revision.metadata?.attempts)
  if (attempts !== undefined) details.push(`attempts=${attempts}`)
  const renderJobId = readStringMetadataValue(observability?.renderPreview, "renderJobId")
  if (renderJobId) details.push(`render=${renderJobId}`)
  if (revision.artifact?.url) details.push(revision.artifact.url)
  else if (revision.artifact?.path) details.push(revision.artifact.path)
  if (revision.diagnostics?.[0]) details.push(`diag=${truncateStatusText(revision.diagnostics[0])}`)
  return details.join(": ")
}

function createAppliedEditRevision(context: {
  session: BotEditSession
  instruction: string
  result: AIProjectEditorResult
  attempts: number
  sourceMessageId?: string | number
  timestamp: string
}): BotEditRevision {
  const index = context.session.revisionCounter
  const id = createBotEditRevisionId(context.session.id, index)
  const editorMetadata = context.result.metadata ? redactSensitiveMetadata(context.result.metadata) : undefined
  return {
    id,
    index,
    projectSchema: context.result.nextProject,
    instruction: context.instruction,
    summary: context.result.summary,
    changedAreas: context.result.changedAreas,
    diagnostics: context.result.diagnostics.map(formatAIProjectEditDiagnostic),
    ...(context.sourceMessageId !== undefined ? { sourceMessageId: String(context.sourceMessageId) } : {}),
    createdAt: context.timestamp,
    updatedAt: context.timestamp,
    metadata: {
      commands: redactSensitiveMetadata(context.result.commands),
      attempts: context.attempts,
      ...(editorMetadata ? { editor: editorMetadata } : {}),
      observability: createAIEditObservability({
        session: context.session,
        revisionId: id,
        revisionIndex: index,
        result: context.result,
        attempts: context.attempts,
        sourceMessageId: context.sourceMessageId,
      }),
    },
  }
}

function formatReviewPreviewCaption(revision: BotEditRevision): string {
  return [
    `Preview ${revision.id}`,
    ...(revision.summary ? [truncateStatusText(revision.summary)] : []),
    "Send another correction or /approve.",
  ].join("\n")
}

function formatReviewPreviewFallbackText(revision: BotEditRevision, error?: string): string {
  return [
    "Timeline Studio bot",
    `Preview artifact for ${revision.id}: ${revision.artifact?.url ?? revision.artifact?.path ?? "not available"}`,
    ...(error ? [`Telegram video delivery failed: ${error}`] : []),
  ].join("\n")
}

function mergeRevisionMetadata(
  base: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(base ?? {}),
    ...patch,
  }
}

function mergeMetadataObservability(
  base: Record<string, unknown> | undefined,
  observabilityPatch: Record<string, unknown>,
  patch: Record<string, unknown> = {},
): Record<string, unknown> {
  return mergeRevisionMetadata(base, {
    ...patch,
    observability: {
      ...asRecord(base?.observability),
      ...redactSensitiveMetadata(observabilityPatch),
    },
  })
}

function createAIEditObservability(context: {
  session: BotEditSession
  revisionId: string
  revisionIndex: number
  result: AIProjectEditorResult
  attempts: number
  sourceMessageId?: string | number
}): Record<string, unknown> {
  return redactSensitiveMetadata({
    sessionId: context.session.id,
    revisionId: context.revisionId,
    revisionIndex: context.revisionIndex,
    stage: "ai_edit",
    ...(context.sourceMessageId !== undefined ? { sourceMessageId: String(context.sourceMessageId) } : {}),
    ...(context.result.metadata ? { aiEditor: context.result.metadata } : {}),
    attempts: context.attempts,
    commandTypes: context.result.commands.map((command) => command.type),
    changedAreas: context.result.changedAreas,
    diagnostics: context.result.diagnostics.map((diagnostic) => ({
      level: diagnostic.level,
      message: diagnostic.message,
      ...(diagnostic.code ? { code: diagnostic.code } : {}),
      ...(diagnostic.path ? { path: diagnostic.path } : {}),
    })),
  })
}

function createRenderPreviewObservability(
  artifact: BotRenderJobArtifact,
  renderedAt: string,
  renderJobId?: string,
): Record<string, unknown> {
  const artifactMetadata = asRecord(artifact.metadata)
  return redactSensitiveMetadata({
    ...(readStringMetadataValue(artifactMetadata, "renderJobId") || renderJobId
      ? { renderJobId: readStringMetadataValue(artifactMetadata, "renderJobId") ?? renderJobId }
      : {}),
    ...(readStringMetadataValue(artifactMetadata, "providerJobId")
      ? { providerJobId: readStringMetadataValue(artifactMetadata, "providerJobId") }
      : {}),
    ...(readStringMetadataValue(artifactMetadata, "renderJobStatus")
      ? { renderJobStatus: readStringMetadataValue(artifactMetadata, "renderJobStatus") }
      : {}),
    renderedAt,
    destination: artifact.destination,
    ...(artifact.path ? { artifactPath: artifact.path } : {}),
    ...(artifact.url ? { artifactUrl: artifact.url } : {}),
    ...(artifact.mimeType ? { mimeType: artifact.mimeType } : {}),
  })
}

function createPublishObservability(context: {
  session: BotEditSession
  revision: BotEditRevision
  result: BotPublishResult
  timestamp: string
}): Record<string, unknown> {
  return redactSensitiveMetadata({
    sessionId: context.session.id,
    revisionId: context.revision.id,
    destination: context.result.destination,
    status: context.result.status,
    publishedAt: context.timestamp,
    ...(context.result.providerId ? { providerId: context.result.providerId } : {}),
    ...(context.result.url ? { url: context.result.url } : {}),
    ...(context.result.error ? { error: context.result.error } : {}),
    ...(context.result.artifact?.path ? { artifactPath: context.result.artifact.path } : {}),
    ...(context.result.artifact?.url ? { artifactUrl: context.result.artifact.url } : {}),
  })
}

function readRevisionObservability(revision: BotEditRevision): Record<string, unknown> | undefined {
  return asRecord(revision.metadata?.observability)
}

function readRevisionEditorMetadata(revision: BotEditRevision): Record<string, unknown> | undefined {
  const observabilityEditor = asRecord(readRevisionObservability(revision)?.aiEditor)
  if (observabilityEditor) return observabilityEditor
  return asRecord(revision.metadata?.editor)
}

function formatRevisionEditorLine(editor: Record<string, unknown> | undefined): string | undefined {
  if (!editor) return undefined
  const provider = readStringMetadataValue(editor, "provider")
  const model = readStringMetadataValue(editor, "model")
  const promptId = readStringMetadataValue(editor, "promptId")
  const details: string[] = []
  if (provider || model) details.push(`editor=${[provider, model].filter(Boolean).join("/")}`)
  if (promptId) details.push(`prompt=${promptId}`)
  return details.length > 0 ? details.join(" ") : undefined
}

function formatBotEditSessionPublishLine(result: BotPublishResult): string {
  const details = [`Publish: ${result.status} to ${result.destination}`]
  if (result.providerId) details.push(`provider=${result.providerId}`)
  if (result.url) details.push(result.url)
  if (result.error) details.push(`error=${truncateStatusText(result.error)}`)
  return details.join(", ")
}

function readStringMetadataValue(value: unknown, key: string): string | undefined {
  const record = asRecord(value)
  const field = record?.[key]
  return typeof field === "string" && field.length > 0 ? field : undefined
}

function readNumericMetadataValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function readInlineProjectSchema(project: BotRenderJobProjectInput | undefined): unknown | undefined {
  return project?.type === "inline" ? project.schema : undefined
}

function formatAIProjectEditDiagnostic(diagnostic: AIProjectEditorResult["diagnostics"][number]): string {
  return [diagnostic.level, diagnostic.code, diagnostic.message].filter(Boolean).join(": ")
}

function latestBotEditRevision(session: Pick<BotEditSession, "revisions">): BotEditRevision | undefined {
  return session.revisions.at(-1)
}

function getFeedbackMediaKind(media: { metadata?: Record<string, unknown> }): "voice" | "video_note" | undefined {
  const kind = media.metadata?.telegramMediaKind
  return kind === "voice" || kind === "video_note" ? kind : undefined
}

function hasTelegramLikePayloadContent(payload: TelegramLikeBotPayload): boolean {
  return Boolean(
    normalizedTelegramText(payload.text ?? payload.caption) ||
      payload.document ||
      payload.video ||
      payload.audio ||
      payload.voice ||
      payload.video_note ||
      payload.animation ||
      payload.photo ||
      payload.media?.length ||
      payload.attachments?.length,
  )
}

function normalizedTelegramText(text: string | undefined): string | undefined {
  const normalized = text?.trim()
  return normalized ? normalized : undefined
}

function normalizeAIProjectEditMaxRepairAttempts(value: number | undefined): number {
  return Math.max(0, Math.trunc(value ?? 1))
}

function formatTelegramBotJobStatusLine(record: NodeTelegramBotWorkflowJobRecord): string {
  const details: string[] = [record.status]
  if (record.renderJobStatus && record.renderJobStatus !== record.status) {
    details.push(`render=${record.renderJobStatus}`)
  }
  if (record.artifact?.url) {
    details.push(record.artifact.url)
  } else if (record.artifact?.path) {
    details.push(record.artifact.path)
  } else if (record.error) {
    details.push(truncateStatusText(record.error))
  }

  return `${record.id}: ${details.join(", ")}`
}

function truncateStatusText(value: string): string {
  return value.length <= 96 ? value : `${value.slice(0, 93)}...`
}

function mapRenderJobStatusToWorkflowJobStatus(
  status: BotRenderJobSnapshot["status"],
): NodeTelegramBotWorkflowJobRecord["status"] {
  switch (status) {
    case "done":
      return "done"
    case "failed":
      return "failed"
    case "cancelled":
      return "cancelled"
    case "queued":
    case "preparing":
    case "rendering":
    case "publishing":
      return "running"
  }
}

function mergeWorkflowOptions(
  defaults: NodeBotWorkflowServiceOptions | undefined,
  overrides: NodeBotWorkflowServiceOptions | undefined,
): NodeBotWorkflowServiceOptions | undefined {
  if (!defaults && !overrides) return undefined
  return {
    ...defaults,
    ...overrides,
    intake: mergeObject(defaults?.intake, overrides?.intake),
    render: mergeObject(defaults?.render, overrides?.render),
  }
}

function mergeObject<T extends object>(defaults: T | undefined, overrides: T | undefined): T | undefined {
  if (!defaults && !overrides) return undefined
  return { ...defaults, ...overrides } as T
}

function globalFetch(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: BodyInit },
): Promise<TelegramBotFetchResponse> {
  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for Telegram bot polling")
  }
  return fetch(url, init) as Promise<TelegramBotFetchResponse>
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
