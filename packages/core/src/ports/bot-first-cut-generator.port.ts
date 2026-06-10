import type { ProjectSchema } from "@/types/contracts/project-schema"

import type { BotEditRevision, BotRenderJobDestination, BotRenderJobMediaInput } from "../types"

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
