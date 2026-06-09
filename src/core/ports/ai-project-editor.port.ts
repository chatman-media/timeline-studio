import type { ProjectSchema } from "@/types/contracts/project-schema"

import type { BotEditRevision, BotRenderJobDestination, BotRenderJobMediaInput } from "../types"

export type AIProjectEditCommandType =
  | "trim_clip"
  | "remove_clip"
  | "move_clip"
  | "reorder_clips"
  | "set_clip_speed"
  | "set_clip_volume"
  | "add_subtitle"
  | "update_subtitle"
  | "remove_subtitle"
  | "set_project_metadata"
  | "set_timeline_duration"
  | "custom"

export interface AIProjectEditCommand {
  type: AIProjectEditCommandType
  targetId?: string
  trackId?: string
  params?: Record<string, unknown>
  rationale?: string
}

export type AIProjectEditDiagnosticLevel = "info" | "warning" | "error"

export interface AIProjectEditDiagnostic {
  level: AIProjectEditDiagnosticLevel
  message: string
  code?: string
  path?: string
}

export interface AIProjectEditRevisionSummary {
  id: string
  index: number
  instruction?: string
  summary?: string
  createdAt: string
}

export interface AIProjectEditorRequest {
  currentProject: ProjectSchema
  sourceMedia: BotRenderJobMediaInput[]
  userInstruction: string
  targetPlatform?: BotRenderJobDestination
  revisionHistory?: AIProjectEditRevisionSummary[]
  constraints?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface AIProjectEditorResult {
  nextProject: ProjectSchema
  summary: string
  changedAreas: string[]
  commands: AIProjectEditCommand[]
  diagnostics: AIProjectEditDiagnostic[]
  metadata?: Record<string, unknown>
}

export interface AIProjectEditRepairContext {
  request: AIProjectEditorRequest
  result: AIProjectEditorResult
  errors: AIProjectEditValidationError[]
  attempt: number
}

export interface AIProjectEditValidationError {
  code:
    | "missing_project"
    | "invalid_project"
    | "missing_instruction"
    | "invalid_media"
    | "missing_summary"
    | "missing_commands"
    | "invalid_command"
    | "invalid_diagnostic"
  field: string
  message: string
}

export interface IAIProjectEditor {
  editProject(request: AIProjectEditorRequest): Promise<AIProjectEditorResult>
  repairProjectEdit?(context: AIProjectEditRepairContext): Promise<AIProjectEditorResult>
}

export function summarizeBotEditRevisions(revisions: BotEditRevision[]): AIProjectEditRevisionSummary[] {
  return revisions.map((revision) => ({
    id: revision.id,
    index: revision.index,
    ...(revision.instruction ? { instruction: revision.instruction } : {}),
    ...(revision.summary ? { summary: revision.summary } : {}),
    createdAt: revision.createdAt,
  }))
}
