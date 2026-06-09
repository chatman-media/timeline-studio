import type { ProjectSchema } from "@/types/contracts/project-schema"

import type {
  BotFirstCutGeneratorRequest,
  BotFirstCutGeneratorResult,
  BotFirstCutProvider,
  IBotFirstCutGenerator,
  IBotFirstCutPlanner,
} from "../ports"
import type { BotEditRevision, BotRenderJobDestination, BotRenderJobRequest } from "../types"
import { validateProjectSchemaShape } from "./ai-project-editor"
import { createBotEditRevisionId } from "./bot-edit-sessions"
import { createBotProjectSchemaFromRenderJob } from "./bot-project-assembler"

export interface BotFirstCutGeneratorOptions {
  planner?: IBotFirstCutPlanner
  fallbackToDeterministic?: boolean
  now?: () => string
}

export class DefaultBotFirstCutGenerator implements IBotFirstCutGenerator {
  constructor(private readonly options: BotFirstCutGeneratorOptions = {}) {}

  async generateFirstCut(request: BotFirstCutGeneratorRequest): Promise<BotFirstCutGeneratorResult> {
    const timestamp = this.options.now?.() ?? new Date().toISOString()

    if (this.options.planner) {
      try {
        const planned = await this.options.planner.generatePlan(request)
        const validationErrors = validateProjectSchemaShape(planned.projectSchema, "projectSchema")
        if (validationErrors.length === 0) {
          return createFirstCutResult(request, planned, timestamp)
        }

        if (this.options.fallbackToDeterministic === false) {
          throw new Error(validationErrors.map((error) => error.message).join("; "))
        }
      } catch (error) {
        if (this.options.fallbackToDeterministic === false) {
          throw error
        }
      }
    }

    const fallbackProject = createDeterministicFirstCutProject(request)
    return createFirstCutResult(
      request,
      {
        projectSchema: fallbackProject,
        provider: "deterministic-fallback",
        summary: "Generated deterministic first cut from source media.",
      },
      timestamp,
    )
  }
}

export function createDeterministicFirstCutProject(request: BotFirstCutGeneratorRequest): ProjectSchema {
  const renderRequest: BotRenderJobRequest = {
    source: "bot",
    media: request.sourceMedia,
    output: {
      format: "mp4",
      ...(resolvePublishDestination(request.publishDestination) ? { destination: request.publishDestination } : {}),
    },
    params: {
      ...(request.goal ? { goal: request.goal, title: request.goal } : {}),
      ...(request.targetDurationSeconds ? { clipDurationSeconds: request.targetDurationSeconds } : {}),
      ...(request.targetPlatform ? { targetPlatform: request.targetPlatform } : {}),
      ...(request.style ? { style: request.style } : {}),
    },
  }
  const project = createBotProjectSchemaFromRenderJob(renderRequest)
  if (!project) {
    throw new Error("Cannot generate first cut without source media")
  }
  return project
}

function createFirstCutResult(
  request: BotFirstCutGeneratorRequest,
  planned: FirstCutProjectResult,
  timestamp: string,
): BotFirstCutGeneratorResult {
  const revision = request.sessionId
    ? createFirstCutRevision(request, planned.projectSchema, planned.summary, timestamp)
    : undefined

  return {
    projectSchema: planned.projectSchema,
    provider: planned.provider,
    summary: planned.summary ?? `Generated first cut with ${planned.provider}.`,
    diagnostics: planned.diagnostics ?? [],
    ...(revision ? { revision } : {}),
    ...(planned.metadata ? { metadata: planned.metadata } : {}),
  }
}

interface FirstCutProjectResult {
  projectSchema: ProjectSchema
  provider: BotFirstCutProvider
  summary?: string
  diagnostics?: string[]
  metadata?: Record<string, unknown>
}

function createFirstCutRevision(
  request: BotFirstCutGeneratorRequest,
  projectSchema: ProjectSchema,
  summary: string | undefined,
  timestamp: string,
): BotEditRevision {
  const sessionId = request.sessionId
  if (!sessionId) {
    throw new Error("Cannot create first-cut revision without session id")
  }

  return {
    id: createBotEditRevisionId(sessionId, 0),
    index: 0,
    projectSchema,
    instruction: request.goal,
    summary: summary ?? "Generated first cut.",
    sourceMessageId: request.sourceMessageId,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {
      firstCut: true,
      provider: "first-cut-generator",
      ...(request.metadata ? { request: request.metadata } : {}),
    },
  }
}

function resolvePublishDestination(
  destination: BotRenderJobDestination | undefined,
): BotRenderJobDestination | undefined {
  return destination
}
