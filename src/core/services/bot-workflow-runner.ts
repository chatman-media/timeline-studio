import type { IRenderJobService } from "../ports"
import type {
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

  const renderJob =
    options.projectAssembly === false
      ? resolvedRenderJob
      : withBotProjectSchema(resolvedRenderJob, options.projectAssembly)

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

export function createTelegramLikeBotWorkflow(payload: TelegramLikeBotPayload): BotWorkflowRequest {
  return createBotWorkflowRequestFromTelegramLikePayload(payload)
}

export async function runTelegramLikeBotWorkflow(
  payload: TelegramLikeBotPayload,
  options: TelegramLikeBotWorkflowRunnerOptions,
): Promise<BotWorkflowRunResult> {
  return runBotWorkflow(createTelegramLikeBotWorkflow(payload), options)
}
