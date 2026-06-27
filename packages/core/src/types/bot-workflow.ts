/**
 * Bot-first intake contracts.
 *
 * These types describe the payload after a chat/bot adapter has collected
 * message text, attachments, template hints, and output preferences.
 */

import type { IBotFirstCutGenerator } from "../ports/bot-first-cut-generator.port"
import type { ScriptDraft } from "../ports/script-generator.port"
import type {
  BotPublishResult,
  BotRenderJobArtifact,
  BotRenderJobDestination,
  BotRenderJobEvent,
  BotRenderJobMediaInput,
  BotRenderJobOutput,
  BotRenderJobProjectInput,
  BotRenderJobReconnectState,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
  BotRenderJobSnapshot,
  BotRenderJobStatus,
} from "./render-job"

export type BotWorkflowSource = "telegram" | "api" | "cli" | "desktop"

export type BotMediaAttachmentType = "file" | "url"

export type BotDestinationCapabilityStatus = "available" | "missing_auth" | "unsupported"

export interface BotDestinationCapability {
  destination: BotRenderJobDestination
  status: BotDestinationCapabilityStatus
  supported: boolean
  configured: boolean
  userMessage: string
}

export type BotDestinationCapabilityRegistry = Record<BotRenderJobDestination, BotDestinationCapability>

export type BotWorkflowValidationCode =
  | "missing_input"
  | "invalid_media"
  | "invalid_template"
  | "invalid_output"
  | "unsupported_destination"
  | "unsupported_resolution"

export interface BotMediaAttachment {
  id?: string
  type: BotMediaAttachmentType
  value: string
  name?: string
  mimeType?: string
  caption?: string
  metadata?: Record<string, unknown>
}

export interface BotTemplateSelection {
  id: string
  version?: string
  params?: Record<string, unknown>
  project?: BotRenderJobProjectInput
}

export interface BotWorkflowOutput {
  format?: BotRenderJobOutput["format"]
  path?: string
  resolution?: BotRenderJobOutput["resolution"]
  destination?: BotRenderJobDestination
}

export interface BotWorkflowRequest {
  source: BotWorkflowSource
  chatId?: string
  userId?: string
  messageId?: string
  text?: string
  template?: BotTemplateSelection
  project?: BotRenderJobProjectInput
  media?: BotMediaAttachment[]
  params?: Record<string, unknown>
  output?: BotWorkflowOutput
  raw?: unknown
}

export interface BotWorkflowDraft {
  id: string
  workflow: BotWorkflowRequest
  updatedAt: string
}

export interface BotWorkflowDraftStore {
  readDraft(id: string): Promise<BotWorkflowDraft | undefined>
  writeDraft(draft: BotWorkflowDraft): Promise<void>
  deleteDraft(id: string): Promise<void>
}

export type BotEditSessionStatus =
  | "collecting"
  | "generating"
  | "preview_ready"
  | "editing"
  | "approved"
  | "publishing"
  | "done"
  | "cancelled"
  | "failed"

export interface BotEditRevision {
  id: string
  index: number
  projectSchema?: unknown
  artifact?: BotRenderJobArtifact
  instruction?: string
  summary?: string
  changedAreas?: string[]
  diagnostics?: string[]
  sourceMessageId?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

export interface BotEditSession {
  id: string
  source: BotWorkflowSource
  status: BotEditSessionStatus
  chatId?: string
  userId?: string
  goal?: string
  media: BotRenderJobMediaInput[]
  currentProjectSchema?: unknown
  currentArtifact?: BotRenderJobArtifact
  previewDestination?: BotRenderJobDestination
  publishTarget?: BotRenderJobDestination
  revisionCounter: number
  revisions: BotEditRevision[]
  approvedRevisionId?: string
  approvedAt?: string
  approvedMessageId?: string
  /** Operator (Telegram user id) who approved the result, for the concierge decision log (#325). */
  approvedBy?: string
  cancelledAt?: string
  failedAt?: string
  failure?: string
  publishedAt?: string
  publishResult?: BotPublishResult
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

export interface BotEditSessionQuery {
  source?: BotWorkflowSource
  chatId?: string
  userId?: string
  status?: BotEditSessionStatus | BotEditSessionStatus[]
  activeOnly?: boolean
  limit?: number
}

export interface BotEditSessionStore {
  readSession(id: string): Promise<BotEditSession | undefined>
  writeSession(session: BotEditSession): Promise<void>
  deleteSession(id: string): Promise<void>
  listSessions(query?: BotEditSessionQuery): Promise<BotEditSession[]>
  readCurrentSession(query: BotEditSessionQuery): Promise<BotEditSession | undefined>
}

export interface BotWorkflowValidationError {
  code: BotWorkflowValidationCode
  field: string
  message: string
  userMessage: string
}

export type BotWorkflowIntakeResult =
  | {
      ok: true
      renderJob: BotRenderJobRequest
      warnings: BotWorkflowValidationError[]
    }
  | {
      ok: false
      errors: BotWorkflowValidationError[]
    }

export type BotWorkflowRunResult =
  | {
      ok: true
      workflow: BotWorkflowRequest
      renderJob: BotRenderJobRequest
      result: BotRenderJobResult
      warnings: BotWorkflowValidationError[]
      approvalGate?: BotWorkflowApprovalGateResult
      reconnectState?: BotRenderJobReconnectState
    }
  | {
      ok: false
      workflow: BotWorkflowRequest
      errors: BotWorkflowValidationError[]
    }

export interface BotWorkflowRunOptions {
  intake?: BotWorkflowIntakeOptions
  approvalGate?: BotWorkflowApprovalGateOptions | false
  mediaResolver?: BotMediaResolver
  firstCutGenerator?: IBotFirstCutGenerator
  projectAssembly?: BotProjectAssemblyOptions | false
  status?: BotWorkflowStatusOptions
  render?: BotRenderJobRunOptions
  includeReconnectState?: boolean
}

export interface BotWorkflowApprovalGateOptions {
  enabled?: boolean
  previewDestination?: BotRenderJobDestination
}

export interface BotWorkflowApprovalGateResult {
  enabled: boolean
  previewDestination: BotRenderJobDestination
  publishTarget?: BotRenderJobDestination
}

export interface BotMediaResolveContext {
  workflow: BotWorkflowRequest
  request: BotRenderJobRequest
  index: number
}

export interface BotMediaResolver {
  resolve(media: BotRenderJobMediaInput, context: BotMediaResolveContext): Promise<BotRenderJobMediaInput>
}

export type BotWorkflowStatusKind = BotRenderJobStatus | "validation_error"

export interface BotWorkflowStatusMessage {
  kind: BotWorkflowStatusKind
  text: string
  timestamp: string
  chatId?: string
  userId?: string
  messageId?: string
  jobId?: string
  status?: BotRenderJobStatus
  progress?: number
  error?: string
  artifact?: BotRenderJobArtifact
  event?: BotRenderJobEvent
  snapshot?: BotRenderJobSnapshot
  validationErrors?: BotWorkflowValidationError[]
}

export interface BotWorkflowStatusSink {
  sendStatus(message: BotWorkflowStatusMessage): void | Promise<void>
}

export interface BotWorkflowStatusFormatterContext {
  workflow: BotWorkflowRequest
  event?: BotRenderJobEvent
  snapshot?: BotRenderJobSnapshot
  errors?: BotWorkflowValidationError[]
}

export type BotWorkflowStatusFormatter = (context: BotWorkflowStatusFormatterContext) => string

export interface BotWorkflowStatusPolicy {
  minIntervalMs?: number
  minProgressDelta?: number
}

export interface BotWorkflowStatusOptions {
  sink: BotWorkflowStatusSink
  formatter?: BotWorkflowStatusFormatter
  policy?: BotWorkflowStatusPolicy
  throwOnError?: boolean
  now?: () => string
}

export type BotProjectAssemblyResolution = BotRenderJobOutput["resolution"] | readonly [number, number]

export interface BotProjectAssemblyOptions {
  projectName?: string
  author?: string
  defaultClipDurationSeconds?: number
  fps?: number
  sampleRate?: number
  resolution?: BotProjectAssemblyResolution
  now?: () => string
  /** When provided, voiceover subtitles and hook title are auto-generated from the script. */
  script?: ScriptDraft
}

export interface BotWorkflowIntakeOptions {
  defaultDestination?: BotRenderJobDestination
  defaultOutputPath?: string
  defaultResolution?: BotRenderJobOutput["resolution"]
  defaultTemplateId?: string
  destinationCapabilities?: BotDestinationCapabilityRegistry
}

export interface TelegramLikeBotFile {
  file_id?: string
  file_unique_id?: string
  file_name?: string
  mime_type?: string
  file_size?: number
  file_path?: string
  url?: string
  caption?: string
  duration?: number
  width?: number
  height?: number
}

export interface TelegramLikeBotPayload {
  chat?: {
    id?: string | number
  }
  from?: {
    id?: string | number
  }
  message_id?: string | number
  text?: string
  caption?: string
  document?: TelegramLikeBotFile
  video?: TelegramLikeBotFile
  audio?: TelegramLikeBotFile
  voice?: TelegramLikeBotFile
  video_note?: TelegramLikeBotFile
  animation?: TelegramLikeBotFile
  photo?: TelegramLikeBotFile | TelegramLikeBotFile[]
  media?: TelegramLikeBotFile[]
  attachments?: BotMediaAttachment[]
}
