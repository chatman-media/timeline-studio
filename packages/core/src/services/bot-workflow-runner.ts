import type { IRenderJobService } from "../ports"
import type {
  BotProjectAssemblyOptions,
  BotRenderJobDestination,
  BotRenderJobRequest,
  BotWorkflowApprovalGateOptions,
  BotWorkflowApprovalGateResult,
  BotWorkflowIntakeOptions,
  BotWorkflowRequest,
  BotWorkflowRunOptions,
  BotWorkflowRunResult,
  TelegramLikeBotPayload,
} from "../types"
import { resolveBotRenderJobMedia } from "./bot-media-resolver"
import { withBotProjectSchema } from "./bot-project-assembler"
import { createBotWorkflowStatusEventSink, sendBotWorkflowValidationStatus } from "./bot-status-updates"
import { createBotRenderJobRequest, createBotWorkflowRequestFromTelegramLikePayload } from "./bot-workflow-intake"
import { InMemoryBotRenderJobEventStream } from "./render-job-events"

export interface BotWorkflowRunnerOptions extends BotWorkflowRunOptions {
  renderJob: IRenderJobService
  eventStream?: InMemoryBotRenderJobEventStream
}

export interface TelegramLikeBotWorkflowRunnerOptions extends BotWorkflowRunnerOptions {
  intake?: BotWorkflowIntakeOptions
}

export async function runBotWorkflow(
  workflow: BotWorkflowRequest,
  options: BotWorkflowRunnerOptions,
): Promise<BotWorkflowRunResult> {
  const intake = createBotRenderJobRequest(workflow, options.intake)
  if (!intake.ok) {
    await sendBotWorkflowValidationStatus(workflow, intake.errors, options.status)
    return {
      ok: false,
      workflow,
      errors: intake.errors,
    }
  }

  const approvalGate = applyBotWorkflowApprovalGate(intake.renderJob, options.approvalGate)
  const eventSinks = [...(options.render?.eventSinks ?? [])]
  if (options.eventStream) {
    eventSinks.push(options.eventStream)
  }
  if (options.status) {
    eventSinks.push(createBotWorkflowStatusEventSink(workflow, options.status))
  }

  const resolvedRenderJob = await resolveBotRenderJobMedia(approvalGate.renderJob, options.mediaResolver, { workflow })
  const firstCutRenderJob = await withBotFirstCutProjectSchema(
    resolvedRenderJob,
    workflow,
    options,
    approvalGate.result,
  )

  const renderJob =
    options.projectAssembly === false
      ? firstCutRenderJob
      : withBotProjectSchema(firstCutRenderJob, options.projectAssembly)

  const result = await options.renderJob.run(renderJob, {
    ...options.render,
    eventSinks,
  })

  return {
    ok: true,
    workflow,
    renderJob,
    result,
    warnings: intake.warnings,
    ...(approvalGate.result ? { approvalGate: approvalGate.result } : {}),
    ...(options.includeReconnectState && options.eventStream
      ? { reconnectState: options.eventStream.getReconnectState(result.job.id) }
      : {}),
  }
}

export function applyBotWorkflowApprovalGate(
  renderJob: BotRenderJobRequest,
  options: BotWorkflowApprovalGateOptions | false | undefined,
): {
  renderJob: BotRenderJobRequest
  result?: BotWorkflowApprovalGateResult
} {
  if (!options || options.enabled === false) {
    return { renderJob }
  }

  const previewDestination = options.previewDestination ?? "file"
  const publishTarget =
    renderJob.output.destination && renderJob.output.destination !== "file" ? renderJob.output.destination : undefined

  return {
    renderJob: {
      ...renderJob,
      output: {
        ...renderJob.output,
        destination: "file",
      },
      params: {
        ...(renderJob.params ?? {}),
        approvalRequired: true,
        previewDestination,
        ...(publishTarget ? { publishTarget } : {}),
      },
    },
    result: {
      enabled: true,
      previewDestination,
      ...(publishTarget ? { publishTarget } : {}),
    },
  }
}

async function withBotFirstCutProjectSchema(
  request: BotRenderJobRequest,
  workflow: BotWorkflowRequest,
  options: BotWorkflowRunnerOptions,
  approvalGate?: BotWorkflowApprovalGateResult,
): Promise<BotRenderJobRequest> {
  const sourceMedia = request.media ?? []
  if (request.project || !options.firstCutGenerator || sourceMedia.length === 0) return request

  const publishDestination = approvalGate?.publishTarget ?? request.output.destination
  const goal = stringParam(request.params?.goal) ?? stringParam(request.params?.title) ?? workflow.text
  const targetPlatform =
    stringParam(request.params?.targetPlatform) ??
    stringParam(request.params?.platform) ??
    destinationToPlatform(publishDestination)
  const targetDurationSeconds =
    positiveNumber(request.params?.clipDurationSeconds) ??
    positiveNumber(request.params?.duration) ??
    projectAssemblyDuration(options.projectAssembly)
  const style = stringParam(request.params?.style)
  const firstCut = await options.firstCutGenerator.generateFirstCut({
    sourceMedia,
    ...(workflow.messageId ? { sourceMessageId: workflow.messageId } : {}),
    ...(goal ? { goal } : {}),
    ...(targetPlatform ? { targetPlatform } : {}),
    ...(publishDestination ? { publishDestination } : {}),
    ...(targetDurationSeconds ? { targetDurationSeconds } : {}),
    ...(style ? { style } : {}),
    metadata: {
      workflowSource: workflow.source,
      ...(request.templateId ? { templateId: request.templateId } : {}),
      ...(request.projectId ? { projectId: request.projectId } : {}),
    },
  })

  return {
    ...request,
    project: {
      type: "inline",
      schema: firstCut.projectSchema,
    },
    params: {
      ...(request.params ?? {}),
      firstCut: {
        provider: firstCut.provider,
        summary: firstCut.summary,
        diagnostics: firstCut.diagnostics,
        ...(firstCut.metadata ? { metadata: firstCut.metadata } : {}),
      },
    },
  }
}

export function createTelegramLikeBotWorkflow(payload: TelegramLikeBotPayload): BotWorkflowRequest {
  return createBotWorkflowRequestFromTelegramLikePayload(payload)
}

function destinationToPlatform(destination: BotRenderJobDestination | undefined): string | undefined {
  if (!destination || destination === "file") return undefined
  return destination
}

function projectAssemblyDuration(options: BotProjectAssemblyOptions | false | undefined): number | undefined {
  if (!options) return undefined
  return options.defaultClipDurationSeconds
}

function stringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function positiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export async function runTelegramLikeBotWorkflow(
  payload: TelegramLikeBotPayload,
  options: TelegramLikeBotWorkflowRunnerOptions,
): Promise<BotWorkflowRunResult> {
  return runBotWorkflow(createTelegramLikeBotWorkflow(payload), options)
}
