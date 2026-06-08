/**
 * Bot-first intake contracts.
 *
 * These types describe the payload after a chat/bot adapter has collected
 * message text, attachments, template hints, and output preferences.
 */

import type {
  BotRenderJobDestination,
  BotRenderJobOutput,
  BotRenderJobProjectInput,
  BotRenderJobReconnectState,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
} from "./render-job"

export type BotWorkflowSource = "telegram" | "api" | "cli" | "desktop"

export type BotMediaAttachmentType = "file" | "url"

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
      reconnectState?: BotRenderJobReconnectState
    }
  | {
      ok: false
      workflow: BotWorkflowRequest
      errors: BotWorkflowValidationError[]
    }

export interface BotWorkflowRunOptions {
  intake?: BotWorkflowIntakeOptions
  projectAssembly?: BotProjectAssemblyOptions | false
  render?: BotRenderJobRunOptions
  includeReconnectState?: boolean
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
}

export interface BotWorkflowIntakeOptions {
  defaultDestination?: BotRenderJobDestination
  defaultOutputPath?: string
  defaultResolution?: BotRenderJobOutput["resolution"]
  defaultTemplateId?: string
}

export interface TelegramLikeBotFile {
  file_id?: string
  file_unique_id?: string
  file_name?: string
  mime_type?: string
  file_path?: string
  url?: string
  caption?: string
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
  animation?: TelegramLikeBotFile
  photo?: TelegramLikeBotFile | TelegramLikeBotFile[]
  media?: TelegramLikeBotFile[]
  attachments?: BotMediaAttachment[]
}
