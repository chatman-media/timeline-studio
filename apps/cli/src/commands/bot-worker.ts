/**
 * Telegram bot worker command.
 *
 * Accepts raw Telegram Update JSON or one getUpdates batch, converts updates to
 * the bot workflow contract, and runs the same headless workflow as bot-workflow.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"
import type {
  NodeAIProjectEditorOptions,
  NodeLlmScriptPlannerOptions,
  NodeRustFirstCutPlannerKind,
  NodeRustFirstCutPlannerOptions,
  NodeTelegramBotWorkerPollResult,
  NodeTelegramBotWorkerRunResult,
  NodeTelegramBotWorkerUpdateResult,
  TelegramBotUpdate,
} from "@timeline-studio/adapters/node"
import {
  initNodeApp,
  NodeBotWorkflowFileDraftStore,
  type NodeTelegramBotAccessPolicy,
  NodeTelegramBotFileOffsetStore,
  NodeTelegramBotFileWorkflowJobStore,
  NodeTelegramBotInMemoryWorkflowQueue,
  NodeTelegramBotWorker,
  NodeTelegramRenderJobReviewPreviewRenderer,
  recoverStaleTelegramWorkflowJobs,
} from "@timeline-studio/adapters/node"
import type { BotFeedbackTranscriptionProvider } from "@timeline-studio/core/ports"
import type {
  BotRenderJobDestination,
  BotWorkflowRunResult,
  BotWorkflowStatusOptions,
  BotWorkflowStatusPolicy,
  BotWorkflowStatusSink,
} from "@timeline-studio/core/types"

export interface BotWorkerCommandOptions {
  updateFile?: string
  pollOnce?: boolean
  poll?: boolean
  statusFile?: string
  pretty?: boolean
  telegramBotToken?: string
  allowedChatIds?: string
  allowedUserIds?: string
  statusUpdates?: boolean
  statusChatId?: string
  statusMinInterval?: string
  statusMinProgressDelta?: string
  pollOffset?: string
  pollLimit?: string
  pollTimeout?: string
  offsetFile?: string
  draftDir?: string
  jobStoreFile?: string
  recoverStaleJobs?: boolean
  asyncWorkflows?: boolean
  workflowConcurrency?: string
  workflowQueueLimit?: string
  maxBatches?: string
  idleDelay?: string
  mediaDir?: string
  downloadRemoteMedia?: boolean
  mediaMaxBytes?: string
  remoteMediaAllowHosts?: string
  remoteMediaBlockHosts?: string
  pollInterval?: string
  timeout?: string
  rustRender?: boolean
  rustRenderCommand?: string
  rustRenderKind?: "timeline" | "timeline-render"
  rustPublish?: boolean
  rustPublishCommand?: string
  youtubeAccessToken?: string
  editSessionDir?: string
  feedbackTranscriberProvider?: BotFeedbackTranscriptionProvider
  feedbackTranscriberModel?: string
  feedbackTranscriberLanguage?: string
  transcribeVoiceIdeas?: boolean
  conciergeApproval?: boolean
  firstCutPlanner?: boolean
  firstCutPlannerCommand?: string
  firstCutPlannerKind?: NodeRustFirstCutPlannerKind
  firstCutPlannerApiKey?: string
  firstCutPlannerApiUrl?: string
  firstCutPlannerModel?: string
  firstCutPlannerTempDir?: string
  firstCutStrict?: boolean
  scriptGenerator?: boolean
  scriptGeneratorApiKey?: string
  scriptGeneratorApiUrl?: string
  scriptGeneratorModel?: string
  scriptGeneratorSceneCount?: string
  scriptGeneratorStrict?: boolean
  aiEditor?: boolean
  aiEditorApiKey?: string
  aiEditorApiUrl?: string
  aiEditorProvider?: string
  aiEditorModel?: string
  aiEditorTemperature?: string
  aiEditorMaxTokens?: string
  aiEditorRepairAttempts?: string
  reviewPreviewDir?: string
  defaultDestination?: BotRenderJobDestination
  defaultOutput?: string
}

export type BotWorkerCommandResult =
  | NodeTelegramBotWorkerUpdateResult
  | NodeTelegramBotWorkerPollResult
  | NodeTelegramBotWorkerRunResult

export const botWorkerCommand = new Command("bot-worker")
  .description("Run a Telegram bot worker for bot-first workflows")
  .option("--update-file <path>", "Handle one raw Telegram Update JSON file")
  .option("--poll-once", "Fetch and handle one Telegram getUpdates batch")
  .option("--poll", "Continuously fetch and handle Telegram getUpdates batches")
  .option("--status-file <path>", "Write worker result JSON to a file")
  .option("--pretty", "Pretty-print JSON output")
  .option("--telegram-bot-token <token>", "Telegram Bot API token for polling, media, status, and publishing")
  .option("--allowed-chat-ids <ids>", "Comma/space separated Telegram chat ids allowed to use the bot")
  .option("--allowed-user-ids <ids>", "Comma/space separated Telegram user ids allowed to use the bot")
  .option("--no-status-updates", "Disable Telegram workflow status messages")
  .option("--status-chat-id <id>", "Fallback Telegram chat id for status updates and publishing")
  .option("--status-min-interval <ms>", "Minimum interval between repeated rendering status messages")
  .option("--status-min-progress-delta <percent>", "Minimum progress delta between rendering status messages")
  .option("--poll-offset <id>", "Telegram getUpdates offset")
  .option("--poll-limit <count>", "Telegram getUpdates limit", "100")
  .option("--poll-timeout <seconds>", "Telegram getUpdates long-poll timeout in seconds", "25")
  .option("--offset-file <path>", "Persist Telegram getUpdates offset between polling runs")
  .option("--draft-dir <path>", "Persist Telegram bot conversation drafts in a directory")
  .option("--job-store-file <path>", "Persist Telegram workflow job status/history")
  .option("--recover-stale-jobs", "Mark persisted queued/running workflow jobs as failed before worker handling")
  .option("--async-workflows", "Queue Telegram workflow runs during continuous polling")
  .option("--workflow-concurrency <count>", "Maximum queued workflow runs in parallel", "1")
  .option("--workflow-queue-limit <count>", "Maximum pending queued workflows before rejecting new requests")
  .option("--max-batches <count>", "Stop continuous polling after this many getUpdates batches")
  .option("--idle-delay <ms>", "Delay after an empty continuous polling batch", "1000")
  .option("--media-dir <path>", "Directory for resolved bot media downloads")
  .option("--download-remote-media", "Download remote URL media before rendering")
  .option("--media-max-bytes <bytes>", "Reject Telegram/remote media downloads larger than this byte limit")
  .option("--remote-media-allow-hosts <hosts>", "Comma/space separated remote media host allowlist")
  .option("--remote-media-block-hosts <hosts>", "Comma/space separated remote media host blocklist")
  .option("--poll-interval <ms>", "Render polling interval in milliseconds", "1000")
  .option("--timeout <ms>", "Render timeout in milliseconds", "3600000")
  .option("--rust-render", "Run rendering through the Rust headless ts-render CLI")
  .option("--rust-render-command <path>", "Path/name for timeline or timeline-render command")
  .option("--rust-render-kind <kind>", "Rust render command kind: timeline or timeline-render")
  .option("--rust-publish", "Run bot publishing through the Rust timeline publish CLI")
  .option("--rust-publish-command <path>", "Path/name for the Rust timeline publish command")
  .option("--youtube-access-token <token>", "YouTube access token for Rust publishing")
  .option("--edit-session-dir <path>", "Persist Telegram AI review edit sessions in a directory")
  .option(
    "--feedback-transcriber-provider <provider>",
    "Review voice transcription provider: openai, local, or faster-whisper",
  )
  .option("--feedback-transcriber-model <model>", "Review voice transcription model")
  .option("--feedback-transcriber-language <language>", "Review voice transcription language hint")
  .option(
    "--transcribe-voice-ideas",
    "Transcribe a fresh voice idea into the goal before first-cut (reuses the feedback transcriber)",
  )
  .option(
    "--no-concierge-approval",
    "Disable the operator manual-approval gate and auto-deliver results (default: approval required)",
  )
  .option("--first-cut-planner", "Enable Rust timeline montage-plan/llm-plan first-cut planning")
  .option("--first-cut-planner-command <path>", "Path/name for the Rust timeline first-cut planner command")
  .option("--first-cut-planner-kind <kind>", "Rust first-cut planner kind: auto, montage-plan, or llm-plan")
  .option("--first-cut-planner-api-key <key>", "API key for Rust timeline llm-plan first-cut planning")
  .option("--first-cut-planner-api-url <url>", "OpenAI-compatible base URL for Rust timeline llm-plan")
  .option("--first-cut-planner-model <model>", "Model for Rust timeline llm-plan first-cut planning")
  .option("--first-cut-planner-temp-dir <path>", "Temp directory for Rust first-cut planner ProjectSchema output")
  .option(
    "--first-cut-strict",
    "Fail instead of deterministic first-cut fallback when Rust planner fails or returns invalid output",
  )
  .option("--script-generator", "Enable LLM-based idea-to-storyboard generation before first-cut assembly")
  .option("--script-generator-api-key <key>", "API key for the LLM script generator")
  .option("--script-generator-api-url <url>", "OpenAI-compatible base URL for the LLM script generator")
  .option("--script-generator-model <model>", "Model for the LLM script generator")
  .option("--script-generator-scene-count <count>", "Default number of storyboard scenes to generate")
  .option(
    "--script-generator-strict",
    "Fail instead of deterministic storyboard fallback when LLM script generator fails",
  )
  .option("--ai-editor", "Enable the production AI project editor for review feedback")
  .option("--ai-editor-api-key <key>", "API key for the AI project editor")
  .option("--ai-editor-api-url <url>", "OpenAI-compatible base URL for the AI project editor")
  .option("--ai-editor-provider <provider>", "Provider label for AI project editor metadata")
  .option("--ai-editor-model <model>", "Model for the AI project editor")
  .option("--ai-editor-temperature <number>", "Temperature for the AI project editor")
  .option("--ai-editor-max-tokens <count>", "Max completion tokens for the AI project editor")
  .option("--ai-editor-repair-attempts <count>", "Max AI project editor repair attempts for invalid output", "1")
  .option("--review-preview-dir <path>", "Directory for rendered Telegram AI review preview artifacts")
  .option("--default-destination <destination>", "Fallback destination when update has no destination hint")
  .option("--default-output <path>", "Fallback output path when update has no output hint")
  .action(async (options: BotWorkerCommandOptions) => {
    try {
      const result = await runBotWorker(options)
      const serialized = serializeBotWorkerResult(result, options.pretty)

      if (options.statusFile) {
        await fs.writeFile(path.resolve(options.statusFile), `${serialized}\n`)
      }

      process.stdout.write(`${serialized}\n`)
      if (isFailedWorkerResult(result)) {
        process.exit(1)
      }
    } catch (error) {
      const failed = serializeBotWorkerFailure(error, options.pretty)
      process.stderr.write(`${failed}\n`)
      process.exit(1)
    }
  })

export async function runBotWorker(options: BotWorkerCommandOptions = {}): Promise<BotWorkerCommandResult> {
  const resolvedOptions = resolveBotWorkerCommandOptions(options)

  if (!resolvedOptions.updateFile && !resolvedOptions.pollOnce && !resolvedOptions.poll) {
    throw new Error("Provide --update-file, --poll-once, or --poll")
  }

  if ((resolvedOptions.pollOnce || resolvedOptions.poll) && !resolvedOptions.telegramBotToken) {
    throw new Error("--telegram-bot-token is required with --poll-once or --poll")
  }

  if (resolvedOptions.recoverStaleJobs && !resolvedOptions.jobStoreFile) {
    throw new Error("--recover-stale-jobs requires --job-store-file")
  }

  if (resolvedOptions.aiEditor && !resolvedOptions.aiEditorApiKey) {
    throw new Error(
      "--ai-editor requires --ai-editor-api-key, TIMELINE_BOT_AI_EDITOR_API_KEY, OPENAI_API_KEY, or LLM_API_KEY",
    )
  }

  validateBotWorkerReviewModeOptions(resolvedOptions)

  const services = await initNodeApp({
    autoConnect: false,
    ai: createBotAIOptions(resolvedOptions),
    aiProjectEditor: createBotAIProjectEditorOptions(resolvedOptions),
    botEditSessions: createBotEditSessionStoreOptions(resolvedOptions),
    botFeedbackTranscriber: createBotFeedbackTranscriberOptions(resolvedOptions),
    botFirstCutPlanner: createBotFirstCutPlannerOptions(resolvedOptions),
    botFirstCutGenerator: createBotFirstCutGeneratorOptions(resolvedOptions),
    botScriptGenerator: createBotScriptGeneratorOptions(resolvedOptions),
    botMediaResolver: createBotMediaResolverOptions(resolvedOptions),
    botStatus: createBotStatusOptions(resolvedOptions),
    publish: createBotPublishOptions(resolvedOptions),
    rustPublish: resolvedOptions.rustPublish ? createBotRustPublishOptions(resolvedOptions) : undefined,
    rustRender: resolvedOptions.rustRender
      ? {
          command: resolvedOptions.rustRenderCommand,
          commandKind: resolvedOptions.rustRenderKind,
        }
      : undefined,
  })
  const workflowJobStore = resolvedOptions.jobStoreFile
    ? new NodeTelegramBotFileWorkflowJobStore(path.resolve(resolvedOptions.jobStoreFile))
    : undefined

  if (resolvedOptions.recoverStaleJobs && workflowJobStore) {
    await recoverStaleTelegramWorkflowJobs(workflowJobStore)
  }

  const workflowStatus = createBotWorkflowStatusOptions(services.botStatus, resolvedOptions)
  const workflowQueue =
    resolvedOptions.poll && resolvedOptions.asyncWorkflows
      ? new NodeTelegramBotInMemoryWorkflowQueue({
          concurrency: parsePositiveInteger(resolvedOptions.workflowConcurrency, 1),
          maxPending: parseOptionalNonNegativeInteger(resolvedOptions.workflowQueueLimit),
        })
      : undefined
  const worker = new NodeTelegramBotWorker({
    workflow: services.botWorkflow,
    workflowQueue,
    accessPolicy: createTelegramBotAccessPolicy(resolvedOptions),
    botToken: resolvedOptions.telegramBotToken,
    editSessionStore: services.botEditSessions,
    aiProjectEditor: services.aiProjectEditor,
    aiProjectEditMaxRepairAttempts: parseOptionalNonNegativeInteger(resolvedOptions.aiEditorRepairAttempts) ?? 1,
    feedbackTranscriber: services.botFeedbackTranscriber,
    transcribeVoiceIdeas: resolvedOptions.transcribeVoiceIdeas ?? false,
    conciergeApproval: resolvedOptions.conciergeApproval ?? true,
    previewRenderer: createBotReviewPreviewRenderer(services.renderJob, resolvedOptions),
    publishService: services.publish,
    previewResponder: services.botStatus,
    reviewResponder: services.botStatus,
    workflowOptions: {
      intake: {
        defaultDestination: resolvedOptions.defaultDestination,
        defaultOutputPath: resolvedOptions.defaultOutput,
      },
      render: {
        pollIntervalMs: parsePositiveInteger(resolvedOptions.pollInterval, 1000),
        timeoutMs: parsePositiveInteger(resolvedOptions.timeout, 3600000),
      },
      ...(workflowStatus ? { status: workflowStatus } : {}),
      includeReconnectState: true,
    },
    draftStore: resolvedOptions.draftDir
      ? new NodeBotWorkflowFileDraftStore(path.resolve(resolvedOptions.draftDir))
      : undefined,
    workflowJobStore,
  })

  if (resolvedOptions.updateFile) {
    return worker.handleUpdate(await readTelegramBotUpdate(resolvedOptions.updateFile))
  }

  const offset = parseOptionalPositiveInteger(resolvedOptions.pollOffset)
  const limit = parsePositiveInteger(resolvedOptions.pollLimit, 100)
  const timeoutSeconds = parsePositiveInteger(resolvedOptions.pollTimeout, 25)

  if (resolvedOptions.poll) {
    const result = await worker.runPolling({
      offset,
      limit,
      timeoutSeconds,
      offsetStore: resolvedOptions.offsetFile
        ? new NodeTelegramBotFileOffsetStore(path.resolve(resolvedOptions.offsetFile))
        : undefined,
      maxBatches: parseOptionalPositiveInteger(resolvedOptions.maxBatches),
      idleDelayMs: parsePositiveInteger(resolvedOptions.idleDelay, 1000),
    })
    await workflowQueue?.drain()
    return result
  }

  return worker.pollOnce({
    offset,
    limit,
    timeoutSeconds,
  })
}

export function resolveBotWorkerCommandOptions(
  options: BotWorkerCommandOptions,
  env: Record<string, string | undefined> = process.env,
): BotWorkerCommandOptions {
  return {
    ...options,
    telegramBotToken: firstConfigured(
      options.telegramBotToken,
      env.TIMELINE_BOT_TELEGRAM_TOKEN,
      env.TELEGRAM_BOT_TOKEN,
    ),
    allowedChatIds: firstConfigured(options.allowedChatIds, env.TIMELINE_BOT_ALLOWED_CHAT_IDS),
    allowedUserIds: firstConfigured(options.allowedUserIds, env.TIMELINE_BOT_ALLOWED_USER_IDS),
    statusChatId: firstConfigured(options.statusChatId, env.TIMELINE_BOT_STATUS_CHAT_ID),
    statusMinInterval: firstConfigured(options.statusMinInterval, env.TIMELINE_BOT_STATUS_MIN_INTERVAL),
    statusMinProgressDelta: firstConfigured(options.statusMinProgressDelta, env.TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA),
    pollOffset: firstConfigured(options.pollOffset, env.TIMELINE_BOT_POLL_OFFSET),
    pollLimit: firstConfigured(options.pollLimit, env.TIMELINE_BOT_POLL_LIMIT),
    pollTimeout: firstConfigured(options.pollTimeout, env.TIMELINE_BOT_POLL_TIMEOUT),
    offsetFile: firstConfigured(options.offsetFile, env.TIMELINE_BOT_OFFSET_FILE),
    draftDir: firstConfigured(options.draftDir, env.TIMELINE_BOT_DRAFT_DIR),
    jobStoreFile: firstConfigured(options.jobStoreFile, env.TIMELINE_BOT_JOB_STORE_FILE),
    recoverStaleJobs: options.recoverStaleJobs ?? parseBooleanEnv(env.TIMELINE_BOT_RECOVER_STALE_JOBS),
    workflowConcurrency: firstConfigured(options.workflowConcurrency, env.TIMELINE_BOT_WORKFLOW_CONCURRENCY),
    workflowQueueLimit: firstConfigured(options.workflowQueueLimit, env.TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT),
    maxBatches: firstConfigured(options.maxBatches, env.TIMELINE_BOT_MAX_BATCHES),
    idleDelay: firstConfigured(options.idleDelay, env.TIMELINE_BOT_IDLE_DELAY),
    mediaDir: firstConfigured(options.mediaDir, env.TIMELINE_BOT_MEDIA_DIR),
    mediaMaxBytes: firstConfigured(options.mediaMaxBytes, env.TIMELINE_BOT_MEDIA_MAX_BYTES),
    remoteMediaAllowHosts: firstConfigured(options.remoteMediaAllowHosts, env.TIMELINE_BOT_REMOTE_MEDIA_ALLOW_HOSTS),
    remoteMediaBlockHosts: firstConfigured(options.remoteMediaBlockHosts, env.TIMELINE_BOT_REMOTE_MEDIA_BLOCK_HOSTS),
    pollInterval: firstConfigured(options.pollInterval, env.TIMELINE_BOT_RENDER_POLL_INTERVAL),
    timeout: firstConfigured(options.timeout, env.TIMELINE_BOT_RENDER_TIMEOUT),
    rustRenderCommand: firstConfigured(options.rustRenderCommand, env.TIMELINE_BOT_RUST_RENDER_COMMAND),
    rustRenderKind: firstConfigured(options.rustRenderKind, normalizeRustRenderKind(env.TIMELINE_BOT_RUST_RENDER_KIND)),
    rustPublishCommand: firstConfigured(options.rustPublishCommand, env.TIMELINE_BOT_RUST_PUBLISH_COMMAND),
    youtubeAccessToken: firstConfigured(
      options.youtubeAccessToken,
      env.TIMELINE_BOT_YOUTUBE_ACCESS_TOKEN,
      env.YOUTUBE_ACCESS_TOKEN,
    ),
    editSessionDir: firstConfigured(options.editSessionDir, env.TIMELINE_BOT_EDIT_SESSION_DIR),
    feedbackTranscriberProvider: firstConfigured(
      options.feedbackTranscriberProvider,
      normalizeFeedbackTranscriberProvider(env.TIMELINE_BOT_FEEDBACK_TRANSCRIBER_PROVIDER),
    ),
    feedbackTranscriberModel: firstConfigured(
      options.feedbackTranscriberModel,
      env.TIMELINE_BOT_FEEDBACK_TRANSCRIBER_MODEL,
    ),
    feedbackTranscriberLanguage: firstConfigured(
      options.feedbackTranscriberLanguage,
      env.TIMELINE_BOT_FEEDBACK_TRANSCRIBER_LANGUAGE,
    ),
    transcribeVoiceIdeas: options.transcribeVoiceIdeas ?? parseBooleanEnv(env.TIMELINE_BOT_TRANSCRIBE_VOICE_IDEAS),
    // Default ON (concierge). `--no-concierge-approval` sets options.conciergeApproval=false;
    // otherwise the env can disable it, falling back to enabled.
    conciergeApproval:
      options.conciergeApproval === false ? false : (parseBooleanEnv(env.TIMELINE_BOT_CONCIERGE_APPROVAL) ?? true),
    firstCutPlanner: options.firstCutPlanner ?? parseBooleanEnv(env.TIMELINE_BOT_FIRST_CUT_PLANNER),
    firstCutPlannerCommand: firstConfigured(options.firstCutPlannerCommand, env.TIMELINE_BOT_FIRST_CUT_PLANNER_COMMAND),
    firstCutPlannerKind: firstConfigured(
      options.firstCutPlannerKind,
      normalizeFirstCutPlannerKind(env.TIMELINE_BOT_FIRST_CUT_PLANNER_KIND),
    ),
    firstCutPlannerApiKey: firstConfigured(options.firstCutPlannerApiKey, env.TIMELINE_BOT_FIRST_CUT_PLANNER_API_KEY),
    firstCutPlannerApiUrl: firstConfigured(options.firstCutPlannerApiUrl, env.TIMELINE_BOT_FIRST_CUT_PLANNER_API_URL),
    firstCutPlannerModel: firstConfigured(options.firstCutPlannerModel, env.TIMELINE_BOT_FIRST_CUT_PLANNER_MODEL),
    firstCutPlannerTempDir: firstConfigured(
      options.firstCutPlannerTempDir,
      env.TIMELINE_BOT_FIRST_CUT_PLANNER_TEMP_DIR,
    ),
    firstCutStrict: options.firstCutStrict ?? parseBooleanEnv(env.TIMELINE_BOT_FIRST_CUT_STRICT),
    scriptGenerator: options.scriptGenerator ?? parseBooleanEnv(env.TIMELINE_BOT_SCRIPT_GENERATOR),
    scriptGeneratorApiKey: firstConfigured(
      options.scriptGeneratorApiKey,
      env.TIMELINE_BOT_SCRIPT_GENERATOR_API_KEY,
      env.OPENAI_API_KEY,
      env.LLM_API_KEY,
    ),
    scriptGeneratorApiUrl: firstConfigured(options.scriptGeneratorApiUrl, env.TIMELINE_BOT_SCRIPT_GENERATOR_API_URL),
    scriptGeneratorModel: firstConfigured(options.scriptGeneratorModel, env.TIMELINE_BOT_SCRIPT_GENERATOR_MODEL),
    scriptGeneratorSceneCount: firstConfigured(
      options.scriptGeneratorSceneCount,
      env.TIMELINE_BOT_SCRIPT_GENERATOR_SCENE_COUNT,
    ),
    scriptGeneratorStrict: options.scriptGeneratorStrict ?? parseBooleanEnv(env.TIMELINE_BOT_SCRIPT_GENERATOR_STRICT),
    aiEditor: options.aiEditor ?? parseBooleanEnv(env.TIMELINE_BOT_AI_EDITOR),
    aiEditorApiKey: firstConfigured(
      options.aiEditorApiKey,
      env.TIMELINE_BOT_AI_EDITOR_API_KEY,
      env.OPENAI_API_KEY,
      env.LLM_API_KEY,
    ),
    aiEditorApiUrl: firstConfigured(options.aiEditorApiUrl, env.TIMELINE_BOT_AI_EDITOR_API_URL),
    aiEditorProvider: firstConfigured(options.aiEditorProvider, env.TIMELINE_BOT_AI_EDITOR_PROVIDER),
    aiEditorModel: firstConfigured(options.aiEditorModel, env.TIMELINE_BOT_AI_EDITOR_MODEL),
    aiEditorTemperature: firstConfigured(options.aiEditorTemperature, env.TIMELINE_BOT_AI_EDITOR_TEMPERATURE),
    aiEditorMaxTokens: firstConfigured(options.aiEditorMaxTokens, env.TIMELINE_BOT_AI_EDITOR_MAX_TOKENS),
    aiEditorRepairAttempts: firstConfigured(options.aiEditorRepairAttempts, env.TIMELINE_BOT_AI_EDITOR_REPAIR_ATTEMPTS),
    reviewPreviewDir: firstConfigured(options.reviewPreviewDir, env.TIMELINE_BOT_REVIEW_PREVIEW_DIR),
    defaultDestination: firstConfigured(
      options.defaultDestination,
      normalizeDestination(env.TIMELINE_BOT_DEFAULT_DESTINATION),
    ),
    defaultOutput: firstConfigured(options.defaultOutput, env.TIMELINE_BOT_DEFAULT_OUTPUT),
    asyncWorkflows: options.asyncWorkflows ?? parseBooleanEnv(env.TIMELINE_BOT_ASYNC_WORKFLOWS),
    downloadRemoteMedia: options.downloadRemoteMedia ?? parseBooleanEnv(env.TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA),
    rustRender: options.rustRender ?? parseBooleanEnv(env.TIMELINE_BOT_RUST_RENDER),
    rustPublish: options.rustPublish ?? parseBooleanEnv(env.TIMELINE_BOT_RUST_PUBLISH),
  }
}

export async function readTelegramBotUpdate(updateFile: string): Promise<TelegramBotUpdate> {
  const updatePath = path.resolve(updateFile)
  const content = await fs.readFile(updatePath, "utf-8")
  const parsed = JSON.parse(content) as TelegramBotUpdate

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Telegram update JSON must be an object")
  }

  if (!Number.isFinite(parsed.update_id)) {
    throw new Error("Telegram update JSON must include numeric update_id")
  }

  return parsed
}

export function serializeBotWorkerResult(result: BotWorkerCommandResult, pretty = false): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}

function createBotMediaResolverOptions(options: BotWorkerCommandOptions) {
  if (!options.telegramBotToken && !options.mediaDir && !options.downloadRemoteMedia) {
    return undefined
  }

  const maxDownloadBytes = parseOptionalPositiveInteger(options.mediaMaxBytes)
  const remoteUrlAllowedHosts = parseList(options.remoteMediaAllowHosts)
  const remoteUrlBlockedHosts = parseList(options.remoteMediaBlockHosts)

  return {
    ...(options.mediaDir ? { downloadDir: path.resolve(options.mediaDir) } : {}),
    downloadRemoteUrls: options.downloadRemoteMedia ?? false,
    ...(maxDownloadBytes !== undefined ? { maxDownloadBytes } : {}),
    ...(remoteUrlAllowedHosts.length > 0 ? { remoteUrlAllowedHosts } : {}),
    ...(remoteUrlBlockedHosts.length > 0 ? { remoteUrlBlockedHosts } : {}),
    ...(options.telegramBotToken
      ? {
          telegram: {
            botToken: options.telegramBotToken,
          },
        }
      : {}),
  }
}

function createBotAIOptions(options: BotWorkerCommandOptions) {
  if (!options.aiEditorApiKey) return undefined
  return {
    openaiApiKey: options.aiEditorApiKey,
  }
}

function createBotEditSessionStoreOptions(options: BotWorkerCommandOptions) {
  if (!options.editSessionDir) return false
  return {
    directory: path.resolve(options.editSessionDir),
  }
}

function createBotFeedbackTranscriberOptions(options: BotWorkerCommandOptions) {
  if (!options.editSessionDir) return false
  return {
    ...(options.feedbackTranscriberProvider ? { provider: options.feedbackTranscriberProvider } : {}),
    ...(options.feedbackTranscriberModel ? { model: options.feedbackTranscriberModel } : {}),
    ...(options.feedbackTranscriberLanguage ? { language: options.feedbackTranscriberLanguage } : {}),
  }
}

function createBotFirstCutPlannerOptions(options: BotWorkerCommandOptions): NodeRustFirstCutPlannerOptions | false {
  if (options.firstCutPlanner === false) return false

  const hasConfig = Boolean(
    options.firstCutPlanner ||
      options.firstCutPlannerCommand ||
      options.firstCutPlannerKind ||
      options.firstCutPlannerApiKey ||
      options.firstCutPlannerApiUrl ||
      options.firstCutPlannerModel ||
      options.firstCutPlannerTempDir,
  )
  if (!hasConfig) return false

  return {
    ...(options.firstCutPlannerCommand ? { command: options.firstCutPlannerCommand } : {}),
    ...(options.firstCutPlannerKind ? { plannerKind: options.firstCutPlannerKind } : {}),
    ...(options.firstCutPlannerApiKey ? { apiKey: options.firstCutPlannerApiKey } : {}),
    ...(options.firstCutPlannerApiUrl ? { apiUrl: options.firstCutPlannerApiUrl } : {}),
    ...(options.firstCutPlannerModel ? { model: options.firstCutPlannerModel } : {}),
    ...(options.firstCutPlannerTempDir ? { tempDir: path.resolve(options.firstCutPlannerTempDir) } : {}),
  }
}

function createBotFirstCutGeneratorOptions(options: BotWorkerCommandOptions) {
  if (!options.firstCutStrict) return undefined
  return {
    fallbackToDeterministic: false,
  }
}

function createBotScriptGeneratorOptions(
  options: BotWorkerCommandOptions,
): (NodeLlmScriptPlannerOptions & { defaultSceneCount?: number; fallbackToDeterministic?: boolean }) | false {
  const hasConfig = Boolean(
    options.scriptGenerator ||
      options.scriptGeneratorApiKey ||
      options.scriptGeneratorApiUrl ||
      options.scriptGeneratorModel ||
      options.scriptGeneratorSceneCount,
  )
  if (!hasConfig) return false

  const defaultSceneCount = parseOptionalPositiveInteger(options.scriptGeneratorSceneCount)
  return {
    ...(options.scriptGeneratorApiKey ? { apiKey: options.scriptGeneratorApiKey } : {}),
    ...(options.scriptGeneratorApiUrl ? { apiUrl: options.scriptGeneratorApiUrl } : {}),
    ...(options.scriptGeneratorModel ? { model: options.scriptGeneratorModel } : {}),
    ...(defaultSceneCount !== undefined ? { defaultSceneCount } : {}),
    ...(options.scriptGeneratorStrict ? { fallbackToDeterministic: false } : {}),
  }
}

function createBotAIProjectEditorOptions(options: BotWorkerCommandOptions): NodeAIProjectEditorOptions | false {
  const hasConfig = Boolean(
    options.aiEditorApiKey ||
      options.aiEditorApiUrl ||
      options.aiEditorProvider ||
      options.aiEditorModel ||
      options.aiEditorTemperature ||
      options.aiEditorMaxTokens,
  )
  if (!options.aiEditor && !hasConfig) return false

  return {
    ...(options.aiEditorApiKey ? { apiKey: options.aiEditorApiKey } : {}),
    ...(options.aiEditorApiUrl ? { apiUrl: options.aiEditorApiUrl } : {}),
    ...(options.aiEditorProvider ? { provider: options.aiEditorProvider } : {}),
    ...(options.aiEditorModel ? { model: options.aiEditorModel } : {}),
    ...(parseOptionalNonNegativeNumber(options.aiEditorTemperature) !== undefined
      ? { temperature: parseOptionalNonNegativeNumber(options.aiEditorTemperature) }
      : {}),
    ...(parseOptionalPositiveInteger(options.aiEditorMaxTokens) !== undefined
      ? { maxTokens: parseOptionalPositiveInteger(options.aiEditorMaxTokens) }
      : {}),
  }
}

function createBotReviewPreviewRenderer(
  renderJob: Awaited<ReturnType<typeof initNodeApp>>["renderJob"],
  options: BotWorkerCommandOptions,
) {
  if (!options.editSessionDir) return undefined

  return new NodeTelegramRenderJobReviewPreviewRenderer(renderJob, {
    outputDir: path.resolve(options.reviewPreviewDir ?? path.join(options.editSessionDir, "previews")),
    pollIntervalMs: parsePositiveInteger(options.pollInterval, 1000),
    timeoutMs: parsePositiveInteger(options.timeout, 3600000),
  })
}

function createBotStatusOptions(options: BotWorkerCommandOptions) {
  if (options.statusUpdates === false || !options.telegramBotToken) {
    return undefined
  }

  return {
    telegram: {
      botToken: options.telegramBotToken,
      ...(options.statusChatId ? { defaultChatId: options.statusChatId } : {}),
    },
  }
}

function createTelegramBotAccessPolicy(options: BotWorkerCommandOptions): NodeTelegramBotAccessPolicy | undefined {
  const allowedChatIds = parseIdList(options.allowedChatIds)
  const allowedUserIds = parseIdList(options.allowedUserIds)

  if (allowedChatIds.length === 0 && allowedUserIds.length === 0) return undefined
  return {
    ...(allowedChatIds.length > 0 ? { allowedChatIds } : {}),
    ...(allowedUserIds.length > 0 ? { allowedUserIds } : {}),
  }
}

function createBotWorkflowStatusOptions(
  sink: BotWorkflowStatusSink | undefined,
  options: BotWorkerCommandOptions,
): BotWorkflowStatusOptions | undefined {
  if (!sink) return undefined
  const policy = createBotWorkflowStatusPolicy(options)
  return {
    sink,
    ...(policy ? { policy } : {}),
  }
}

function createBotWorkflowStatusPolicy(options: BotWorkerCommandOptions): BotWorkflowStatusPolicy | undefined {
  const minIntervalMs = parseOptionalNonNegativeNumber(options.statusMinInterval)
  const minProgressDelta = parseOptionalNonNegativeNumber(options.statusMinProgressDelta)

  if (minIntervalMs === undefined && minProgressDelta === undefined) return undefined
  return {
    ...(minIntervalMs !== undefined ? { minIntervalMs } : {}),
    ...(minProgressDelta !== undefined ? { minProgressDelta } : {}),
  }
}

function createBotPublishOptions(options: BotWorkerCommandOptions) {
  if (!options.telegramBotToken) {
    return undefined
  }

  return {
    telegram: {
      botToken: options.telegramBotToken,
      ...(options.statusChatId ? { defaultChatId: options.statusChatId } : {}),
    },
  }
}

function createBotRustPublishOptions(options: BotWorkerCommandOptions) {
  return {
    ...(options.rustPublishCommand ? { command: options.rustPublishCommand } : {}),
    ...(options.telegramBotToken || options.statusChatId
      ? {
          telegram: {
            ...(options.telegramBotToken ? { botToken: options.telegramBotToken } : {}),
            ...(options.statusChatId ? { defaultChatId: options.statusChatId } : {}),
          },
        }
      : {}),
    ...(options.youtubeAccessToken
      ? {
          youtube: {
            accessToken: options.youtubeAccessToken,
          },
        }
      : {}),
  }
}

function validateBotWorkerReviewModeOptions(options: BotWorkerCommandOptions): void {
  if (!options.editSessionDir) return

  if (!options.aiEditorApiKey) {
    throw new Error(
      "--edit-session-dir enables Telegram AI review mode and requires --ai-editor-api-key, TIMELINE_BOT_AI_EDITOR_API_KEY, OPENAI_API_KEY, or LLM_API_KEY",
    )
  }

  if (!options.rustRender) {
    throw new Error(
      "--edit-session-dir enables Telegram AI review mode and requires --rust-render for preview rendering",
    )
  }

  const destination = options.defaultDestination
  if (!destination || destination === "file") return

  const publishError = validateBotWorkerReviewPublishDestination(destination, options)
  if (publishError) {
    throw new Error(publishError)
  }
}

function validateBotWorkerReviewPublishDestination(
  destination: BotRenderJobDestination,
  options: BotWorkerCommandOptions,
): string | undefined {
  switch (destination) {
    case "telegram":
      if (!options.rustPublish) {
        return "--default-destination telegram requires --rust-publish in Telegram AI review mode"
      }
      if (!options.telegramBotToken) {
        return "--default-destination telegram requires --telegram-bot-token, TIMELINE_BOT_TELEGRAM_TOKEN, or TELEGRAM_BOT_TOKEN"
      }
      return undefined
    case "youtube":
      if (!options.rustPublish) {
        return "--default-destination youtube requires --rust-publish in Telegram AI review mode"
      }
      if (!options.youtubeAccessToken) {
        return "--default-destination youtube requires --youtube-access-token, TIMELINE_BOT_YOUTUBE_ACCESS_TOKEN, or YOUTUBE_ACCESS_TOKEN"
      }
      return undefined
    case "tiktok":
    case "vimeo":
      return `--default-destination ${destination} is not supported by Telegram AI review publishing yet`
    case "file":
      return undefined
  }
}

export function isFailedWorkerResult(result: BotWorkerCommandResult): boolean {
  if ("batches" in result) {
    return result.batches.some((batch) => batch.updates.some(isFailedUpdateResult))
  }

  if ("updates" in result) {
    return result.updates.some(isFailedUpdateResult)
  }

  return isFailedUpdateResult(result)
}

function isFailedUpdateResult(result: NodeTelegramBotWorkerUpdateResult): boolean {
  if (result.skipped) return false
  if ("failed" in result && result.failed) return true
  if ("rejected" in result && result.rejected) return true
  if ("queued" in result && result.queued) {
    if (result.error) return true
    return result.completion ? isFailedWorkflowRunResult(result.completion) : false
  }
  if (!("result" in result)) return true
  return isFailedWorkflowRunResult(result.result)
}

function isFailedWorkflowRunResult(result: BotWorkflowRunResult): boolean {
  if (!result.ok) return true
  return result.result.job.status === "failed" || result.result.job.status === "cancelled"
}

function serializeBotWorkerFailure(error: unknown, pretty = false): string {
  return JSON.stringify(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    },
    null,
    pretty ? 2 : 0,
  )
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parseOptionalNonNegativeInteger(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parseOptionalNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parseIdList(value: string | undefined): string[] {
  return parseList(value)
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function firstConfigured<T extends string>(...values: Array<T | undefined>): T | undefined {
  return values.find((value): value is T => value !== undefined && value.trim().length > 0)
}

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true
    case "0":
    case "false":
    case "no":
    case "off":
      return false
    default:
      return undefined
  }
}

function normalizeDestination(value: string | undefined): BotRenderJobDestination | undefined {
  switch (value?.trim()) {
    case "file":
    case "telegram":
    case "youtube":
    case "tiktok":
    case "vimeo":
      return value.trim() as BotRenderJobDestination
    default:
      return undefined
  }
}

function normalizeRustRenderKind(value: string | undefined): BotWorkerCommandOptions["rustRenderKind"] {
  switch (value?.trim()) {
    case "timeline":
    case "timeline-render":
      return value.trim() as BotWorkerCommandOptions["rustRenderKind"]
    default:
      return undefined
  }
}

function normalizeFeedbackTranscriberProvider(value: string | undefined): BotFeedbackTranscriptionProvider | undefined {
  switch (value?.trim()) {
    case "openai":
    case "local":
    case "faster-whisper":
      return value.trim() as BotFeedbackTranscriptionProvider
    default:
      return undefined
  }
}

function normalizeFirstCutPlannerKind(value: string | undefined): NodeRustFirstCutPlannerKind | undefined {
  switch (value?.trim()) {
    case "auto":
    case "montage-plan":
    case "llm-plan":
      return value.trim() as NodeRustFirstCutPlannerKind
    default:
      return undefined
  }
}
