import fs from "node:fs/promises"
import path from "node:path"

import { createBotWorkflowDraftId, createTelegramLikeBotWorkflow, mergeBotWorkflowDraft } from "@/core/services"
import type {
  BotWorkflowDraft,
  BotWorkflowDraftStore,
  BotWorkflowRequest,
  BotWorkflowRunResult,
  TelegramLikeBotFile,
  TelegramLikeBotPayload,
} from "@/core/types"

import { NodeBotStatusNotifier, type NodeTelegramStatusClient } from "./bot-status"
import type { NodeBotWorkflowService, NodeBotWorkflowServiceOptions } from "./bot-workflow"

export interface TelegramBotFile {
  file_id?: string
  file_unique_id?: string
  file_name?: string
  mime_type?: string
  file_path?: string
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
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<TelegramBotFetchResponse>

export interface NodeTelegramBotClient {
  getUpdates(options?: TelegramBotGetUpdatesOptions): Promise<TelegramBotUpdate[]>
}

export interface NodeTelegramBotWorkerOptions {
  workflow: NodeBotWorkflowService
  workflowQueue?: NodeTelegramBotWorkflowQueue
  client?: NodeTelegramBotClient
  commandResponder?: NodeTelegramStatusClient
  commandFormatter?: NodeTelegramBotCommandFormatter
  errorResponder?: NodeTelegramStatusClient
  errorFormatter?: NodeTelegramBotUpdateErrorFormatter
  disableErrorResponses?: boolean
  draftStore?: BotWorkflowDraftStore
  draftResponder?: NodeTelegramStatusClient
  draftFormatter?: NodeTelegramBotDraftFormatter
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

export type NodeTelegramBotCommand = "start" | "help"
export type NodeTelegramBotDraftCommand = "render" | "cancel"
export type NodeTelegramBotDraftAction = "updated" | "cancelled"

export type NodeTelegramBotWorkflowQueueStatus = "queued"

export interface NodeTelegramBotWorkflowQueueSubmission {
  id: string
  status: NodeTelegramBotWorkflowQueueStatus
}

export interface NodeTelegramBotWorkflowQueueJob {
  id: string
  update: TelegramBotUpdate
  payload: TelegramLikeBotPayload
  run(): Promise<BotWorkflowRunResult>
  onComplete?(result: BotWorkflowRunResult): void | Promise<void>
  onError?(error: unknown): void | Promise<void>
}

export interface NodeTelegramBotWorkflowQueue {
  enqueue(job: NodeTelegramBotWorkflowQueueJob): Promise<NodeTelegramBotWorkflowQueueSubmission>
}

export interface NodeTelegramBotInMemoryWorkflowQueueOptions {
  concurrency?: number
}

export interface NodeTelegramBotCommandFormatterContext {
  command: NodeTelegramBotCommand
  payload: TelegramLikeBotPayload
  update: TelegramBotUpdate
}

export type NodeTelegramBotCommandFormatter = (context: NodeTelegramBotCommandFormatterContext) => string

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
      completion?: BotWorkflowRunResult
      error?: string
    }
  | {
      skipped: false
      updateId: number
      update: TelegramBotUpdate
      payload: TelegramLikeBotPayload
      result: BotWorkflowRunResult
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
  private readonly pending: NodeTelegramBotWorkflowQueueJob[] = []
  private readonly idleResolvers: Array<() => void> = []
  private activeCount = 0

  constructor(options: NodeTelegramBotInMemoryWorkflowQueueOptions = {}) {
    this.concurrency = Math.max(1, Math.trunc(options.concurrency ?? 1))
  }

  async enqueue(job: NodeTelegramBotWorkflowQueueJob): Promise<NodeTelegramBotWorkflowQueueSubmission> {
    this.pending.push(job)
    this.pump()
    return {
      id: job.id,
      status: "queued",
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
    try {
      const result = await job.run()
      await job.onComplete?.(result)
    } catch (error) {
      await job.onError?.(error)
    } finally {
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

    const command = this.options.disableCommandRouting ? null : parseTelegramBotCommand(payload.text)
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

    const draftResult = await this.handleDraftUpdate(update, payload, options)
    if (draftResult) return draftResult

    return this.runOrQueueWorkflow(update, payload, {
      run: () =>
        this.options.workflow.runTelegramLikePayload(
          payload,
          mergeWorkflowOptions(this.workflowOptions, options.workflowOptions),
        ),
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
        run: () =>
          this.options.workflow.runWorkflow(
            draft.workflow,
            mergeWorkflowOptions(this.workflowOptions, options.workflowOptions),
          ),
        onComplete: async (workflowResult) => {
          if (workflowResult.ok) {
            await store.deleteDraft(draftId)
          } else {
            await store.writeDraft(draft)
          }
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
      run: () => Promise<BotWorkflowRunResult>
      workflow?: BotWorkflowRequest
      draftId?: string
      onComplete?: (result: BotWorkflowRunResult) => void | Promise<void>
    },
  ): Promise<NodeTelegramBotWorkerUpdateResult> {
    const workflowQueue = this.options.workflowQueue
    if (!workflowQueue) {
      const workflowResult = await options.run()
      await options.onComplete?.(workflowResult)
      const result: NodeTelegramBotWorkerUpdateResult = {
        skipped: false,
        updateId: update.update_id,
        update,
        payload,
        result: workflowResult,
      }
      await this.options.onResult?.(result)
      return result
    }

    const queueId = createTelegramBotWorkflowQueueId(update)
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
    }
    const submission = await workflowQueue.enqueue({
      id: queueId,
      update,
      payload,
      run: options.run,
      onComplete: async (workflowResult) => {
        result.completion = workflowResult
        await options.onComplete?.(workflowResult)
        await this.options.onResult?.({
          skipped: false,
          updateId: update.update_id,
          update,
          payload,
          result: workflowResult,
        })
      },
      onError: async (error) => {
        result.error = formatUnknownError(error)
        await this.createUpdateErrorResult(update, error)
      },
    })

    result.queueId = submission.id
    await this.options.onResult?.(result)
    return result
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
    ...(message.animation ? { animation: telegramFile(message.animation) } : {}),
    ...(message.photo ? { photo: message.photo.map(telegramFile) } : {}),
  }
}

function telegramFile(file: TelegramBotFile): TelegramLikeBotFile {
  return {
    ...(file.file_id ? { file_id: file.file_id } : {}),
    ...(file.file_unique_id ? { file_unique_id: file.file_unique_id } : {}),
    ...(file.file_name ? { file_name: file.file_name } : {}),
    ...(file.mime_type ? { mime_type: file.mime_type } : {}),
    ...(file.file_path ? { file_path: file.file_path } : {}),
  }
}

export function parseTelegramBotCommand(text: string | undefined): NodeTelegramBotCommand | null {
  const token = text?.trim().split(/\s+/)[0]?.toLowerCase()
  if (!token?.startsWith("/")) return null

  const command = token.split("@")[0]
  switch (command) {
    case "/start":
      return "start"
    case "/help":
      return "help"
    default:
      return null
  }
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

export function defaultTelegramBotUpdateErrorText(): string {
  return ["Timeline Studio bot", "Could not process this request.", "Try again or send /help."].join("\n")
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
  init?: { method?: string; headers?: Record<string, string>; body?: string },
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
