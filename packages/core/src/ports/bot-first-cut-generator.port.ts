import type { ProjectSchema } from "@/types/contracts/project-schema"

import type { BotEditRevision, BotRenderJobDestination, BotRenderJobMediaInput } from "../types"
import type { ScriptDraft } from "./script-generator.port"

export type BotFirstCutProvider = "llm-plan" | "montage-plan" | "deterministic-fallback"

export interface BotFirstCutGeneratorRequest {
  sessionId?: string
  sourceMessageId?: string
  sourceMedia: BotRenderJobMediaInput[]
  goal?: string
  targetPlatform?: string
  publishDestination?: BotRenderJobDestination
  targetDurationSeconds?: number
  style?: string
  sceneSampleCount?: number
  /**
   * Optional storyboard derived from the user's idea. When present it guides
   * deterministic assembly (title/hook/scene count) and is carried into the
   * project so downstream steps can render captions or narration.
   */
  script?: ScriptDraft
  metadata?: Record<string, unknown>
}

export interface BotFirstCutGeneratorResult {
  projectSchema: ProjectSchema
  provider: BotFirstCutProvider
  summary: string
  diagnostics: string[]
  revision?: BotEditRevision
  metadata?: Record<string, unknown>
}

export interface BotFirstCutPlannerResult {
  projectSchema: ProjectSchema
  provider: Exclude<BotFirstCutProvider, "deterministic-fallback">
  summary?: string
  diagnostics?: string[]
  metadata?: Record<string, unknown>
}

export interface IBotFirstCutPlanner {
  generatePlan(request: BotFirstCutGeneratorRequest): Promise<BotFirstCutPlannerResult>
}

export interface IBotFirstCutGenerator {
  generateFirstCut(request: BotFirstCutGeneratorRequest): Promise<BotFirstCutGeneratorResult>
}
