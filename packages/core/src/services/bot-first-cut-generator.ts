import type { ProjectSchema } from "@/types/contracts/project-schema"

import type {
  BotFirstCutGeneratorRequest,
  BotFirstCutGeneratorResult,
  BotFirstCutProvider,
  IBotFirstCutGenerator,
  IBotFirstCutPlanner,
  IScriptGenerator,
  ScriptDraft,
} from "../ports"
import type { BotEditRevision, BotRenderJobDestination, BotRenderJobRequest } from "../types"
import { validateProjectSchemaShape } from "./ai-project-editor"
import { createBotEditRevisionId } from "./bot-edit-sessions"
import { createBotProjectSchemaFromRenderJob } from "./bot-project-assembler"
import { describeScriptDraftAsGoal } from "./script-generator"

export interface BotFirstCutGeneratorOptions {
  planner?: IBotFirstCutPlanner
  /**
   * Optional script generator. When provided and `request.goal` is set but
   * `request.script` is absent, a storyboard is generated from the goal text
   * before the first-cut planner or deterministic assembly runs.
   */
  scriptGenerator?: IScriptGenerator
  fallbackToDeterministic?: boolean
  now?: () => string
}

export class DefaultBotFirstCutGenerator implements IBotFirstCutGenerator {
  constructor(private readonly options: BotFirstCutGeneratorOptions = {}) {}

  async generateFirstCut(request: BotFirstCutGeneratorRequest): Promise<BotFirstCutGeneratorResult> {
    const timestamp = this.options.now?.() ?? new Date().toISOString()
    const fallbackDiagnostics: string[] = []

    const enrichedRequest = await this.enrichWithScript(request, fallbackDiagnostics)

    if (this.options.planner) {
      try {
        const planned = await this.options.planner.generatePlan(enrichedRequest)
        const validationErrors = validateProjectSchemaShape(planned.projectSchema, "projectSchema")
        if (validationErrors.length === 0) {
          return createFirstCutResult(enrichedRequest, planned, timestamp)
        }

        const diagnostic = `Planner ${planned.provider} output failed ProjectSchema validation: ${validationErrors
          .map((error) => error.message)
          .join("; ")}`
        if (this.options.fallbackToDeterministic === false) {
          throw new Error(diagnostic)
        }
        fallbackDiagnostics.push(diagnostic)
      } catch (error) {
        if (this.options.fallbackToDeterministic === false) {
          throw error
        }
        fallbackDiagnostics.push(`Planner failed; using deterministic fallback: ${formatUnknownError(error)}`)
      }
    }

    const fallbackProject = createDeterministicFirstCutProject(enrichedRequest)
    return createFirstCutResult(
      enrichedRequest,
      {
        projectSchema: fallbackProject,
        provider: "deterministic-fallback",
        summary: "Generated deterministic first cut from source media.",
        diagnostics: fallbackDiagnostics,
      },
      timestamp,
    )
  }

  private async enrichWithScript(
    request: BotFirstCutGeneratorRequest,
    diagnostics: string[],
  ): Promise<BotFirstCutGeneratorRequest> {
    if (request.script || !this.options.scriptGenerator || !request.goal?.trim()) {
      return request
    }

    try {
      const result = await this.options.scriptGenerator.generateScript({
        idea: request.goal,
        targetPlatform: request.targetPlatform,
        publishDestination: request.publishDestination,
        targetDurationSeconds: request.targetDurationSeconds,
        style: request.style,
        metadata: request.metadata,
      })

      const enrichedGoal = describeScriptDraftAsGoal(result.script, request.goal)
      return {
        ...request,
        script: result.script,
        ...(enrichedGoal ? { goal: enrichedGoal } : {}),
      }
    } catch (error) {
      diagnostics.push(`Script generator failed; continuing without storyboard: ${formatUnknownError(error)}`)
      return request
    }
  }
}

export function createDeterministicFirstCutProject(request: BotFirstCutGeneratorRequest): ProjectSchema {
  const script = request.script
  const title = script?.title ?? request.goal
  const renderRequest: BotRenderJobRequest = {
    source: "bot",
    media: request.sourceMedia,
    output: {
      format: "mp4",
      ...(resolvePublishDestination(request.publishDestination) ? { destination: request.publishDestination } : {}),
    },
    params: {
      ...(title ? { goal: title, title } : {}),
      ...(script?.hook ? { hook: script.hook } : {}),
      ...(request.targetDurationSeconds ? { clipDurationSeconds: request.targetDurationSeconds } : {}),
      ...(request.targetPlatform ? { targetPlatform: request.targetPlatform } : {}),
      ...(request.style ? { style: request.style } : {}),
      ...(script ? { script: serializeScriptForParams(script) } : {}),
    },
  }
  const project = createBotProjectSchemaFromRenderJob(renderRequest)
  if (!project) {
    throw new Error("Cannot generate first cut without source media")
  }
  return project
}

function serializeScriptForParams(script: ScriptDraft): Record<string, unknown> {
  return {
    ...(script.title ? { title: script.title } : {}),
    ...(script.hook ? { hook: script.hook } : {}),
    scenes: script.scenes.map((scene) => ({
      index: scene.index,
      shot: scene.shot,
      voiceover: scene.voiceover,
      ...(scene.onScreenText ? { onScreenText: scene.onScreenText } : {}),
      ...(scene.durationSeconds ? { durationSeconds: scene.durationSeconds } : {}),
    })),
    ...(script.totalDurationSeconds ? { totalDurationSeconds: script.totalDurationSeconds } : {}),
    ...(script.targetPlatform ? { targetPlatform: script.targetPlatform } : {}),
    ...(script.language ? { language: script.language } : {}),
  }
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

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
