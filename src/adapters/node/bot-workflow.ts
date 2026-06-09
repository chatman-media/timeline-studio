import { InMemoryBotRenderJobEventStream, runBotWorkflow, runTelegramLikeBotWorkflow } from "@/core/services"
import type {
  BotWorkflowRequest,
  BotWorkflowRunOptions,
  BotWorkflowRunResult,
  TelegramLikeBotPayload,
} from "@/core/types"

import type { NodeRenderJobService } from "./render-job"

export interface NodeBotWorkflowServiceOptions extends BotWorkflowRunOptions {
  eventStream?: InMemoryBotRenderJobEventStream
}

export class NodeBotWorkflowService {
  constructor(
    private readonly renderJob: NodeRenderJobService,
    private readonly defaults: NodeBotWorkflowServiceOptions = {},
  ) {}

  async runWorkflow(
    workflow: BotWorkflowRequest,
    options: NodeBotWorkflowServiceOptions = {},
  ): Promise<BotWorkflowRunResult> {
    const eventStream = options.eventStream ?? this.defaults.eventStream ?? new InMemoryBotRenderJobEventStream()

    return runBotWorkflow(workflow, {
      renderJob: this.renderJob,
      intake: mergeOptions(this.defaults.intake, options.intake),
      approvalGate: mergeApprovalGateOptions(this.defaults.approvalGate, options.approvalGate),
      mediaResolver: options.mediaResolver ?? this.defaults.mediaResolver,
      firstCutGenerator: options.firstCutGenerator ?? this.defaults.firstCutGenerator,
      projectAssembly: mergeProjectAssemblyOptions(this.defaults.projectAssembly, options.projectAssembly),
      status: options.status ?? this.defaults.status,
      render: mergeRenderOptions(this.defaults.render, options.render),
      includeReconnectState: options.includeReconnectState ?? this.defaults.includeReconnectState ?? true,
      eventStream,
    })
  }

  async runTelegramLikePayload(
    payload: TelegramLikeBotPayload,
    options: NodeBotWorkflowServiceOptions = {},
  ): Promise<BotWorkflowRunResult> {
    const eventStream = options.eventStream ?? this.defaults.eventStream ?? new InMemoryBotRenderJobEventStream()

    return runTelegramLikeBotWorkflow(payload, {
      renderJob: this.renderJob,
      intake: mergeOptions(this.defaults.intake, options.intake),
      approvalGate: mergeApprovalGateOptions(this.defaults.approvalGate, options.approvalGate),
      mediaResolver: options.mediaResolver ?? this.defaults.mediaResolver,
      firstCutGenerator: options.firstCutGenerator ?? this.defaults.firstCutGenerator,
      projectAssembly: mergeProjectAssemblyOptions(this.defaults.projectAssembly, options.projectAssembly),
      status: options.status ?? this.defaults.status,
      render: mergeRenderOptions(this.defaults.render, options.render),
      includeReconnectState: options.includeReconnectState ?? this.defaults.includeReconnectState ?? true,
      eventStream,
    })
  }

  async cancelRenderJob(jobId: string): Promise<boolean> {
    return this.renderJob.cancelJob(jobId)
  }
}

function mergeOptions<T extends object>(defaults: T | undefined, overrides: T | undefined): T | undefined {
  if (!defaults && !overrides) return undefined
  return {
    ...defaults,
    ...overrides,
  } as T
}

function mergeRenderOptions(
  defaults: BotWorkflowRunOptions["render"],
  overrides: BotWorkflowRunOptions["render"],
): BotWorkflowRunOptions["render"] {
  const merged = mergeOptions(defaults, overrides)
  const eventSinks = [...(defaults?.eventSinks ?? []), ...(overrides?.eventSinks ?? [])]

  if (eventSinks.length === 0) return merged

  return {
    ...merged,
    eventSinks,
  }
}

function mergeProjectAssemblyOptions(
  defaults: BotWorkflowRunOptions["projectAssembly"],
  overrides: BotWorkflowRunOptions["projectAssembly"],
): BotWorkflowRunOptions["projectAssembly"] {
  if (overrides === false) return false
  if (defaults === false && overrides === undefined) return false
  if (defaults === false) return overrides
  return mergeOptions(defaults, overrides)
}

function mergeApprovalGateOptions(
  defaults: BotWorkflowRunOptions["approvalGate"],
  overrides: BotWorkflowRunOptions["approvalGate"],
): BotWorkflowRunOptions["approvalGate"] {
  if (overrides === false) return false
  if (defaults === false && overrides === undefined) return false
  if (defaults === false) return overrides
  return mergeOptions(defaults, overrides)
}
