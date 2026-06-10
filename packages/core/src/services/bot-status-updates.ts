import type {
  BotRenderJobEvent,
  BotRenderJobEventSink,
  BotRenderJobSnapshot,
  BotWorkflowRequest,
  BotWorkflowStatusFormatterContext,
  BotWorkflowStatusMessage,
  BotWorkflowStatusOptions,
  BotWorkflowStatusPolicy,
  BotWorkflowValidationError,
} from "../types"

export class BotWorkflowStatusEventSink implements BotRenderJobEventSink {
  private lastSentMessage?: BotWorkflowStatusMessage

  constructor(
    private readonly workflow: BotWorkflowRequest,
    private readonly options: BotWorkflowStatusOptions,
  ) {}

  async publish(event: BotRenderJobEvent, snapshot: BotRenderJobSnapshot): Promise<void> {
    const message = createBotWorkflowStatusMessage({
      workflow: this.workflow,
      event,
      snapshot,
      formatter: this.options.formatter,
      now: this.options.now,
    })

    if (!shouldSendBotWorkflowStatusMessage(message, this.lastSentMessage, this.options.policy)) return

    await safeSendStatus(this.options, message)
    this.lastSentMessage = message
  }
}

export function createBotWorkflowStatusEventSink(
  workflow: BotWorkflowRequest,
  options: BotWorkflowStatusOptions,
): BotRenderJobEventSink {
  return new BotWorkflowStatusEventSink(workflow, options)
}

export async function sendBotWorkflowValidationStatus(
  workflow: BotWorkflowRequest,
  errors: BotWorkflowValidationError[],
  options: BotWorkflowStatusOptions | undefined,
): Promise<void> {
  if (!options || errors.length === 0) return

  await safeSendStatus(
    options,
    createBotWorkflowStatusMessage({
      workflow,
      errors,
      formatter: options.formatter,
      now: options.now,
    }),
  )
}

export function createBotWorkflowStatusMessage(options: {
  workflow: BotWorkflowRequest
  event?: BotRenderJobEvent
  snapshot?: BotRenderJobSnapshot
  errors?: BotWorkflowValidationError[]
  formatter?: BotWorkflowStatusOptions["formatter"]
  now?: () => string
}): BotWorkflowStatusMessage {
  const { workflow, event, snapshot, errors = [], formatter, now } = options
  const context: BotWorkflowStatusFormatterContext = {
    workflow,
    ...(event ? { event } : {}),
    ...(snapshot ? { snapshot } : {}),
    ...(errors.length > 0 ? { errors } : {}),
  }
  const text = formatter?.(context) ?? defaultBotWorkflowStatusText(context)

  return {
    kind: event?.status ?? "validation_error",
    text,
    timestamp: event?.timestamp ?? now?.() ?? new Date().toISOString(),
    ...(workflow.chatId ? { chatId: workflow.chatId } : {}),
    ...(workflow.userId ? { userId: workflow.userId } : {}),
    ...(workflow.messageId ? { messageId: workflow.messageId } : {}),
    ...(event ? { event } : {}),
    ...(snapshot ? { snapshot } : {}),
    ...(event ? { jobId: event.jobId, status: event.status, progress: event.progress } : {}),
    ...(snapshot?.artifact ? { artifact: snapshot.artifact } : {}),
    ...(snapshot?.error ? { error: snapshot.error } : {}),
    ...(errors.length > 0 ? { validationErrors: errors } : {}),
  }
}

export function defaultBotWorkflowStatusText(context: BotWorkflowStatusFormatterContext): string {
  if (context.errors?.length) {
    const [firstError] = context.errors
    return firstError?.userMessage ?? "Could not start the render job."
  }

  const event = context.event
  if (!event) {
    return "Workflow status updated."
  }

  switch (event.status) {
    case "queued":
      return "Render job queued."
    case "preparing":
      return "Preparing render job."
    case "rendering":
      return `Rendering video: ${Math.round(event.progress)}%.`
    case "publishing":
      return "Publishing video."
    case "done":
      return doneText(context.snapshot)
    case "failed":
      return context.snapshot?.error ? `Render failed: ${context.snapshot.error}` : "Render failed."
    case "cancelled":
      return "Render job cancelled."
  }
}

async function safeSendStatus(options: BotWorkflowStatusOptions, message: BotWorkflowStatusMessage): Promise<void> {
  try {
    await options.sink.sendStatus(message)
  } catch (error) {
    if (options.throwOnError) {
      throw error
    }
  }
}

function doneText(snapshot?: BotRenderJobSnapshot): string {
  if (snapshot?.artifact?.url) {
    return `Video is ready: ${snapshot.artifact.url}`
  }

  if (snapshot?.artifact?.path) {
    return `Video is ready: ${snapshot.artifact.path}`
  }

  return "Video is ready."
}

function shouldSendBotWorkflowStatusMessage(
  message: BotWorkflowStatusMessage,
  lastSentMessage: BotWorkflowStatusMessage | undefined,
  policy: BotWorkflowStatusPolicy | undefined,
): boolean {
  if (!policy) return true
  if (!lastSentMessage) return true
  if (message.status !== lastSentMessage.status) return true
  if (isTerminalStatus(message.status)) return false
  if (message.status !== "rendering") return false

  const hasProgressPolicy = typeof policy.minProgressDelta === "number" && Number.isFinite(policy.minProgressDelta)
  const hasIntervalPolicy = typeof policy.minIntervalMs === "number" && Number.isFinite(policy.minIntervalMs)
  if (!hasProgressPolicy && !hasIntervalPolicy) return true

  const progressDelta =
    typeof message.progress === "number" && typeof lastSentMessage.progress === "number"
      ? Math.abs(message.progress - lastSentMessage.progress)
      : 0
  const progressReached = hasProgressPolicy && progressDelta >= Math.max(0, policy.minProgressDelta ?? 0)
  const intervalReached =
    hasIntervalPolicy &&
    timestampDeltaMs(message.timestamp, lastSentMessage.timestamp) >= Math.max(0, policy.minIntervalMs ?? 0)

  return progressReached || intervalReached
}

function isTerminalStatus(status: BotWorkflowStatusMessage["status"]): boolean {
  return status === "done" || status === "failed" || status === "cancelled"
}

function timestampDeltaMs(current: string, previous: string): number {
  const currentMs = Date.parse(current)
  const previousMs = Date.parse(previous)
  if (!Number.isFinite(currentMs) || !Number.isFinite(previousMs)) return 0
  return currentMs - previousMs
}
