import type {
  BotEditRevision,
  BotEditSession,
  BotEditSessionStatus,
  BotMediaAttachment,
  BotRenderJobArtifact,
  BotRenderJobDestination,
  BotRenderJobMediaInput,
  BotWorkflowRequest,
  BotWorkflowSource,
} from "../types"

export const BOT_EDIT_ACTIVE_STATUSES = [
  "collecting",
  "generating",
  "preview_ready",
  "editing",
  "approved",
  "publishing",
] as const satisfies readonly BotEditSessionStatus[]

export interface BotEditSessionCreateOptions {
  id?: string
  now?: () => string
  status?: BotEditSessionStatus
  previewDestination?: BotRenderJobDestination
  publishTarget?: BotRenderJobDestination
  currentProjectSchema?: unknown
  currentArtifact?: BotRenderJobArtifact
  metadata?: Record<string, unknown>
}

export interface BotEditSessionMergeOptions extends BotEditSessionCreateOptions {
  revision?: Omit<BotEditRevision, "id" | "index" | "createdAt" | "updatedAt"> &
    Partial<Pick<BotEditRevision, "id" | "index" | "createdAt" | "updatedAt">>
}

export function createBotEditSessionId(workflow: Pick<BotWorkflowRequest, "source" | "chatId" | "userId">): string {
  return ["edit", workflow.source, workflow.chatId ?? "no-chat", workflow.userId ?? "no-user"].join(":")
}

export function createBotEditRevisionId(sessionId: string, index: number): string {
  return `${sessionId}:revision:${index}`
}

export function isBotEditSessionActive(status: BotEditSessionStatus): boolean {
  return (BOT_EDIT_ACTIVE_STATUSES as readonly BotEditSessionStatus[]).includes(status)
}

export function createBotEditSessionFromWorkflow(
  workflow: BotWorkflowRequest,
  options: BotEditSessionCreateOptions = {},
): BotEditSession {
  const timestamp = options.now?.() ?? new Date().toISOString()
  const media = botWorkflowMediaToRenderInputs(workflow.media)
  const goal = normalizedText(workflow.text)

  return {
    id: options.id ?? createBotEditSessionId(workflow),
    source: workflow.source,
    status: options.status ?? "collecting",
    ...(workflow.chatId ? { chatId: workflow.chatId } : {}),
    ...(workflow.userId ? { userId: workflow.userId } : {}),
    ...(goal ? { goal } : {}),
    media,
    ...(options.currentProjectSchema !== undefined ? { currentProjectSchema: options.currentProjectSchema } : {}),
    ...(options.currentArtifact ? { currentArtifact: options.currentArtifact } : {}),
    ...(options.previewDestination ? { previewDestination: options.previewDestination } : {}),
    ...((options.publishTarget ?? workflow.output?.destination)
      ? { publishTarget: options.publishTarget ?? workflow.output?.destination }
      : {}),
    revisionCounter: 0,
    revisions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(options.metadata ? { metadata: options.metadata } : {}),
  }
}

export function mergeBotEditSessionWorkflow(
  existing: BotEditSession | undefined,
  workflow: BotWorkflowRequest,
  options: BotEditSessionMergeOptions = {},
): BotEditSession {
  const base = existing ?? createBotEditSessionFromWorkflow(workflow, options)
  const timestamp = options.now?.() ?? new Date().toISOString()
  const nextMedia = botWorkflowMediaToRenderInputs(workflow.media)
  const revision = options.revision ? createBotEditRevision(base, options.revision, timestamp) : undefined
  const revisions = revision ? [...base.revisions, revision] : base.revisions

  return {
    ...base,
    source: workflow.source,
    status: options.status ?? base.status,
    chatId: workflow.chatId ?? base.chatId,
    userId: workflow.userId ?? base.userId,
    goal: mergeText(base.goal, workflow.text),
    media: [...base.media, ...nextMedia],
    ...(options.currentProjectSchema !== undefined ? { currentProjectSchema: options.currentProjectSchema } : {}),
    ...(options.currentArtifact ? { currentArtifact: options.currentArtifact } : {}),
    ...(options.previewDestination ? { previewDestination: options.previewDestination } : {}),
    ...((options.publishTarget ?? workflow.output?.destination)
      ? { publishTarget: options.publishTarget ?? workflow.output?.destination }
      : {}),
    revisionCounter: revision ? Math.max(base.revisionCounter, revision.index + 1) : base.revisionCounter,
    revisions,
    updatedAt: timestamp,
    metadata: mergeMetadata(base.metadata, options.metadata),
  }
}

function createBotEditRevision(
  session: BotEditSession,
  revision: NonNullable<BotEditSessionMergeOptions["revision"]>,
  timestamp: string,
): BotEditRevision {
  const index = revision.index ?? session.revisionCounter
  return {
    id: revision.id ?? createBotEditRevisionId(session.id, index),
    index,
    ...(revision.projectSchema !== undefined ? { projectSchema: revision.projectSchema } : {}),
    ...(revision.artifact ? { artifact: revision.artifact } : {}),
    ...(revision.instruction ? { instruction: revision.instruction } : {}),
    ...(revision.summary ? { summary: revision.summary } : {}),
    ...(revision.changedAreas ? { changedAreas: revision.changedAreas } : {}),
    ...(revision.diagnostics ? { diagnostics: revision.diagnostics } : {}),
    ...(revision.sourceMessageId ? { sourceMessageId: revision.sourceMessageId } : {}),
    createdAt: revision.createdAt ?? timestamp,
    updatedAt: revision.updatedAt ?? timestamp,
    ...(revision.metadata ? { metadata: revision.metadata } : {}),
  }
}

function botWorkflowMediaToRenderInputs(media: BotMediaAttachment[] | undefined): BotRenderJobMediaInput[] {
  return (media ?? [])
    .map((attachment) => {
      const value = attachment.value.trim()
      if (!value) return null

      return {
        type: attachment.type,
        value,
        ...(attachment.name ? { name: attachment.name } : {}),
        ...(attachment.mimeType ? { mimeType: attachment.mimeType } : {}),
        ...(attachment.metadata ? { metadata: attachment.metadata } : {}),
      } satisfies BotRenderJobMediaInput
    })
    .filter((input): input is BotRenderJobMediaInput => input !== null)
}

function mergeText(...values: Array<string | undefined>): string | undefined {
  const text = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ")
  return text.length > 0 ? text : undefined
}

function normalizedText(value: string | undefined): string | undefined {
  const text = value?.trim()
  return text ? text : undefined
}

function mergeMetadata(
  base: Record<string, unknown> | undefined,
  next: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const merged = {
    ...(base ?? {}),
    ...(next ?? {}),
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}

export function compareBotEditSessionsByUpdatedAtDesc(
  a: Pick<BotEditSession, "updatedAt">,
  b: Pick<BotEditSession, "updatedAt">,
): number {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
}

export function matchesBotEditSessionQuery(
  session: BotEditSession,
  query: {
    source?: BotWorkflowSource
    chatId?: string
    userId?: string
    status?: BotEditSessionStatus | BotEditSessionStatus[]
    activeOnly?: boolean
  } = {},
): boolean {
  if (query.source && session.source !== query.source) return false
  if (query.chatId && session.chatId !== query.chatId) return false
  if (query.userId && session.userId !== query.userId) return false
  if (query.activeOnly && !isBotEditSessionActive(session.status)) return false

  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status]
    if (!statuses.includes(session.status)) return false
  }

  return true
}
