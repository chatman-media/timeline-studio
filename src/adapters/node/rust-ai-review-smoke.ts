import { type ChildProcessByStdio, spawn } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { Readable } from "node:stream"

import { createBotProjectSchemaFromRenderJob, createTelegramLikeBotWorkflow } from "@timeline-studio/core"
import type { BotEditRevision, BotEditSession, BotRenderJobArtifact, BotRenderJobMediaInput } from "@timeline-studio/core/types"
import type { ProjectSchema } from "@/types/contracts/project-schema"

import { NodeRenderJobService } from "./render-job"
import {
  type NodeRustPublishCommandResult,
  NodeRustPublishService,
  type NodeRustPublishServiceOptions,
} from "./rust-publish"
import { type NodeRustRenderCommand, NodeRustRenderVideoService } from "./rust-render-video"
import { createTelegramLikePayloadFromUpdate, type TelegramBotUpdate } from "./telegram-bot-worker"
import { NodeTelegramRenderJobReviewPreviewRenderer } from "./telegram-review-preview-renderer"

export type RustAIReviewSmokeCheckStatus = "passed" | "skipped" | "failed"

export interface RustAIReviewSmokeCheck {
  name: string
  status: RustAIReviewSmokeCheckStatus
  message: string
  durationMs: number
  diagnostics?: Record<string, unknown>
}

export interface RustAIReviewSmokeResult {
  ok: boolean
  skipped: boolean
  workDir: string
  checks: RustAIReviewSmokeCheck[]
  artifacts: {
    input?: string
    preview?: string
  }
}

export interface RustAIReviewSmokeOptions {
  repoRoot?: string
  workDir?: string
  keepTemp?: boolean
  env?: Record<string, string | undefined>
  renderCommand?: string
  publishCommand?: string
  ffmpegCommand?: string
  mediaPath?: string
  allowNetwork?: boolean
  telegramBotToken?: string
  telegramChatId?: string
  youtubeAccessToken?: string
  pollIntervalMs?: number
  timeoutMs?: number
  renderCommandFactory?: (projectPath: string, outputPath: string) => NodeRustRenderCommand
  publishRunCommand?: NodeRustPublishServiceOptions["runCommand"]
}

interface ResolvedCommand {
  command?: string
  diagnostic: string
  injected?: boolean
}

const FIXED_TIMESTAMP = "2026-06-09T04:00:00.000Z"
const DEFAULT_TELEGRAM_CHAT_ID = "timeline-smoke-validate-only"

export async function runRustAIReviewSmoke(options: RustAIReviewSmokeOptions = {}): Promise<RustAIReviewSmokeResult> {
  const env = options.env ?? process.env
  const repoRoot = options.repoRoot ?? process.cwd()
  const workDir = options.workDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), "timeline-ai-review-rust-smoke-")))
  const keepTemp = options.keepTemp ?? true
  const checks: RustAIReviewSmokeCheck[] = []
  const artifacts: RustAIReviewSmokeResult["artifacts"] = {}

  try {
    await fs.mkdir(workDir, { recursive: true })
    const renderCommand = await resolveRenderCommand(repoRoot, env, options)
    const publishCommand = await resolvePublishCommand(repoRoot, env, options)
    const ffmpegCommand = options.ffmpegCommand ?? env.FFMPEG_PATH ?? "ffmpeg"
    const ffmpegAvailable = options.mediaPath ? true : (await commandIsAvailable(ffmpegCommand, ["-version"])).available

    const fixture = await createMediaFixture({
      ffmpegAvailable,
      ffmpegCommand,
      repoRoot,
      workDir,
      mediaPath: options.mediaPath,
      checks,
    })
    if (fixture) artifacts.input = fixture.mediaPath

    if (fixture && (renderCommand.command || options.renderCommandFactory)) {
      const preview = await timedCheck("rust-preview-render", async () =>
        runPreviewRenderSmoke({
          renderCommand,
          repoRoot,
          workDir,
          fixture,
          options,
        }),
      )
      checks.push(preview.check)
      if (preview.artifact?.path) artifacts.preview = preview.artifact.path
    } else {
      checks.push(
        skippedCheck("rust-preview-render", renderCommand.diagnostic, {
          renderCommand: renderCommand.command,
          fixtureAvailable: Boolean(fixture),
        }),
      )
    }

    const publishArtifact = artifacts.preview
      ? {
          type: "file" as const,
          path: artifacts.preview,
          destination: "file" as const,
          mimeType: "video/mp4",
        }
      : {
          type: "file" as const,
          destination: "file" as const,
          mimeType: "video/mp4",
        }

    checks.push(
      await runTelegramPublishValidateSmoke({
        publishCommand,
        repoRoot,
        env,
        options,
        artifact: publishArtifact,
      }),
    )

    checks.push(
      await runYouTubePublishValidateSmoke({
        publishCommand,
        repoRoot,
        env,
        options,
        artifact: artifacts.preview
          ? publishArtifact
          : fixture
            ? {
                type: "file" as const,
                path: fixture.mediaPath,
                destination: "file" as const,
                mimeType: "video/mp4",
              }
            : undefined,
      }),
    )
  } finally {
    if (!keepTemp && !options.workDir) {
      await fs.rm(workDir, { recursive: true, force: true })
    }
  }

  return {
    ok: checks.every((check) => check.status !== "failed"),
    skipped: checks.some((check) => check.status === "skipped"),
    workDir,
    checks,
    artifacts,
  }
}

async function createMediaFixture(options: {
  ffmpegAvailable: boolean
  ffmpegCommand: string
  repoRoot: string
  workDir: string
  mediaPath?: string
  checks: RustAIReviewSmokeCheck[]
}): Promise<{ mediaPath: string; update: TelegramBotUpdate } | null> {
  const started = Date.now()
  const update = await readTelegramUploadFixture(options.repoRoot)

  if (options.mediaPath) {
    options.checks.push(
      passedCheck("media-fixture", "Using provided media fixture.", started, { input: options.mediaPath }),
    )
    return { mediaPath: options.mediaPath, update: withTelegramFilePath(update, options.mediaPath) }
  }

  if (!options.ffmpegAvailable) {
    options.checks.push(skippedCheck("media-fixture", "ffmpeg is not available; cannot create deterministic mp4."))
    return null
  }

  const mediaPath = path.join(options.workDir, "telegram-ai-review-input.mp4")
  const output = await runCommand(options.ffmpegCommand, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=160x90:rate=15:duration=1",
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-movflags",
    "+faststart",
    "-y",
    mediaPath,
  ])

  if (!output.ok) {
    options.checks.push(
      failedCheck("media-fixture", "ffmpeg failed to create deterministic mp4 fixture.", started, {
        stderr: output.stderr,
        stdout: output.stdout,
        exitCode: output.exitCode,
      }),
    )
    return null
  }

  options.checks.push(
    passedCheck("media-fixture", "Created deterministic Telegram media fixture.", started, { input: mediaPath }),
  )
  return { mediaPath, update: withTelegramFilePath(update, mediaPath) }
}

async function runPreviewRenderSmoke(options: {
  renderCommand: ResolvedCommand
  repoRoot: string
  workDir: string
  fixture: { mediaPath: string; update: TelegramBotUpdate }
  options: RustAIReviewSmokeOptions
}): Promise<{ check: RustAIReviewSmokeCheck; artifact?: BotRenderJobArtifact }> {
  const started = Date.now()
  try {
    const payload = createTelegramLikePayloadFromUpdate(options.fixture.update)
    if (!payload) {
      return {
        check: failedCheck("rust-preview-render", "Telegram media upload fixture did not produce a payload.", started),
      }
    }

    const workflow = createTelegramLikeBotWorkflow(payload)
    const media: BotRenderJobMediaInput[] = [
      {
        type: "file",
        value: options.fixture.mediaPath,
        name: workflow.media?.[0]?.name ?? "telegram-ai-review-input.mp4",
        mimeType: workflow.media?.[0]?.mimeType ?? "video/mp4",
        metadata: workflow.media?.[0]?.metadata,
      },
    ]
    const projectSchema = createSmokeProjectSchema(media, workflow.text)
    const session = createSmokeSession(media, projectSchema, workflow.text)
    const revision = createSmokeRevision(session.id, projectSchema, workflow.messageId)
    const video = new NodeRustRenderVideoService({
      command: options.renderCommand.command,
      cwd: options.repoRoot,
      tempDir: path.join(options.workDir, "rust-render-projects"),
      idFactory: () => "rust-preview-render-provider-job",
      renderCommand: options.options.renderCommandFactory,
    })
    const renderJob = new NodeRenderJobService(video, {
      outputDir: path.join(options.workDir, "previews"),
      idFactory: () => "rust-preview-render-job",
      now: () => FIXED_TIMESTAMP,
    })
    const previewRenderer = new NodeTelegramRenderJobReviewPreviewRenderer(renderJob, {
      outputDir: path.join(options.workDir, "previews"),
      pollIntervalMs: options.options.pollIntervalMs ?? 100,
      timeoutMs: options.options.timeoutMs ?? 120_000,
    })

    const artifact = await previewRenderer.renderPreview({
      session,
      revision,
      projectSchema,
      update: options.fixture.update,
      payload,
    })

    return {
      check: passedCheck(
        "rust-preview-render",
        "Rendered AI review preview through Node render-job and Rust render adapter.",
        started,
        {
          command: options.renderCommand.command ?? "injected",
          artifact: artifact.path,
        },
      ),
      artifact,
    }
  } catch (error) {
    return {
      check: failedCheck("rust-preview-render", errorMessage(error), started, {
        command: options.renderCommand.command ?? "injected",
      }),
    }
  }
}

async function runTelegramPublishValidateSmoke(options: {
  publishCommand: ResolvedCommand
  repoRoot: string
  env: Record<string, string | undefined>
  options: RustAIReviewSmokeOptions
  artifact: BotRenderJobArtifact
}): Promise<RustAIReviewSmokeCheck> {
  const started = Date.now()
  const token =
    options.options.telegramBotToken ??
    options.env.AI_REVIEW_RUST_SMOKE_TELEGRAM_TOKEN ??
    options.env.TELEGRAM_BOT_TOKEN
  const chatId =
    options.options.telegramChatId ?? options.env.AI_REVIEW_RUST_SMOKE_TELEGRAM_CHAT_ID ?? DEFAULT_TELEGRAM_CHAT_ID

  if (!options.publishCommand.command && !options.options.publishRunCommand) {
    return skippedCheck("rust-publish-telegram-validate", options.publishCommand.diagnostic)
  }

  if (!token) {
    return skippedCheck(
      "rust-publish-telegram-validate",
      "Telegram token is not configured; set AI_REVIEW_RUST_SMOKE_TELEGRAM_TOKEN or TELEGRAM_BOT_TOKEN.",
    )
  }

  if (!canUseNetwork(options.options, options.env)) {
    return skippedCheck(
      "rust-publish-telegram-validate",
      "Network validation is disabled; set AI_REVIEW_RUST_SMOKE_ALLOW_NETWORK=1 to call Telegram getMe.",
    )
  }

  try {
    const publish = new NodeRustPublishService({
      command: options.publishCommand.command ?? "timeline",
      cwd: options.repoRoot,
      telegram: {
        botToken: token,
        defaultChatId: chatId,
      },
      runCommand: options.options.publishRunCommand,
    })
    const result = await publish.publish({
      destination: "telegram",
      artifact: options.artifact,
      metadata: {
        chatId,
        caption: "AI review Rust smoke validate-only",
      },
      params: {
        validateOnly: true,
      },
    })

    if (result.status !== "done") {
      return failedCheck(
        "rust-publish-telegram-validate",
        result.error ?? "Telegram validate-only publish failed.",
        started,
      )
    }

    return passedCheck(
      "rust-publish-telegram-validate",
      "Validated Telegram publish path through Node Rust publish adapter.",
      started,
      {
        provider: result.metadata?.provider,
      },
    )
  } catch (error) {
    return failedCheck("rust-publish-telegram-validate", errorMessage(error), started)
  }
}

async function runYouTubePublishValidateSmoke(options: {
  publishCommand: ResolvedCommand
  repoRoot: string
  env: Record<string, string | undefined>
  options: RustAIReviewSmokeOptions
  artifact?: BotRenderJobArtifact
}): Promise<RustAIReviewSmokeCheck> {
  const started = Date.now()
  const token =
    options.options.youtubeAccessToken ??
    options.env.AI_REVIEW_RUST_SMOKE_YOUTUBE_TOKEN ??
    options.env.YOUTUBE_ACCESS_TOKEN

  if (!options.publishCommand.command && !options.options.publishRunCommand) {
    return skippedCheck("rust-publish-youtube-validate", options.publishCommand.diagnostic)
  }

  if (!token) {
    return skippedCheck(
      "rust-publish-youtube-validate",
      "YouTube token is not configured; set AI_REVIEW_RUST_SMOKE_YOUTUBE_TOKEN or YOUTUBE_ACCESS_TOKEN.",
    )
  }

  if (!options.artifact?.path) {
    return skippedCheck("rust-publish-youtube-validate", "No local artifact is available for YouTube CLI input.")
  }

  if (!canUseNetwork(options.options, options.env)) {
    return skippedCheck(
      "rust-publish-youtube-validate",
      "Network validation is disabled; set AI_REVIEW_RUST_SMOKE_ALLOW_NETWORK=1 to call YouTube channels.list.",
    )
  }

  try {
    const publish = new NodeRustPublishService({
      command: options.publishCommand.command ?? "timeline",
      cwd: options.repoRoot,
      youtube: {
        accessToken: token,
      },
      runCommand: options.options.publishRunCommand,
    })
    const result = await publish.publish({
      destination: "youtube",
      artifact: options.artifact,
      metadata: {
        title: "AI review Rust smoke validate-only",
        visibility: "private",
      },
      params: {
        validateOnly: true,
      },
    })

    if (result.status !== "done") {
      return failedCheck(
        "rust-publish-youtube-validate",
        result.error ?? "YouTube validate-only publish failed.",
        started,
      )
    }

    return passedCheck(
      "rust-publish-youtube-validate",
      "Validated YouTube publish path through Node Rust publish adapter.",
      started,
      {
        provider: result.metadata?.provider,
      },
    )
  } catch (error) {
    return failedCheck("rust-publish-youtube-validate", errorMessage(error), started)
  }
}

function createSmokeProjectSchema(media: BotRenderJobMediaInput[], goal?: string): ProjectSchema {
  const project = createBotProjectSchemaFromRenderJob(
    {
      source: "bot",
      media,
      output: {
        format: "mp4",
        resolution: "720p",
        destination: "file",
      },
      params: {
        title: "AI review Rust smoke",
        caption: goal,
        clipDurationSeconds: 1,
      },
    },
    {
      projectName: "AI review Rust smoke",
      resolution: [160, 90],
      fps: 15,
      defaultClipDurationSeconds: 1,
      now: () => FIXED_TIMESTAMP,
    },
  )

  if (!project) {
    throw new Error("Smoke media did not produce a ProjectSchema")
  }

  return {
    ...project,
    settings: {
      ...project.settings,
      export: {
        ...project.settings.export,
        hardware_acceleration: false,
      },
    },
  }
}

function createSmokeSession(
  media: BotRenderJobMediaInput[],
  projectSchema: ProjectSchema,
  goal?: string,
): BotEditSession {
  return {
    id: "edit:telegram:smoke-chat:smoke-user",
    source: "telegram",
    status: "generating",
    chatId: "smoke-chat",
    userId: "smoke-user",
    goal,
    media,
    currentProjectSchema: projectSchema,
    previewDestination: "telegram",
    publishTarget: "telegram",
    revisionCounter: 1,
    revisions: [],
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
  }
}

function createSmokeRevision(
  sessionId: string,
  projectSchema: ProjectSchema,
  sourceMessageId?: string,
): BotEditRevision {
  return {
    id: `${sessionId}:revision:0`,
    index: 0,
    projectSchema,
    summary: "AI review Rust smoke first preview",
    diagnostics: ["Generated from committed Telegram media upload fixture."],
    sourceMessageId,
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
  }
}

async function resolveRenderCommand(
  repoRoot: string,
  env: Record<string, string | undefined>,
  options: RustAIReviewSmokeOptions,
): Promise<ResolvedCommand> {
  if (options.renderCommandFactory) {
    return { command: options.renderCommand, diagnostic: "Using injected render command factory.", injected: true }
  }

  const explicit = options.renderCommand ?? env.AI_REVIEW_RUST_SMOKE_RENDER_COMMAND ?? env.AI_REVIEW_RUST_SMOKE_TIMELINE
  return resolveCommand(explicit, [
    path.join(repoRoot, "crates/target/debug/timeline"),
    path.join(repoRoot, "crates/target/debug/timeline-render"),
    path.join(repoRoot, "crates/ts-render/target/debug/timeline-render"),
    "timeline",
  ])
}

async function resolvePublishCommand(
  repoRoot: string,
  env: Record<string, string | undefined>,
  options: RustAIReviewSmokeOptions,
): Promise<ResolvedCommand> {
  if (options.publishRunCommand) {
    return { command: options.publishCommand, diagnostic: "Using injected publish command runner.", injected: true }
  }

  const explicit =
    options.publishCommand ?? env.AI_REVIEW_RUST_SMOKE_PUBLISH_COMMAND ?? env.AI_REVIEW_RUST_SMOKE_TIMELINE
  return resolveCommand(explicit, [path.join(repoRoot, "crates/target/debug/timeline"), "timeline"])
}

async function resolveCommand(explicit: string | undefined, candidates: string[]): Promise<ResolvedCommand> {
  if (explicit) {
    const availability = await commandIsAvailable(explicit, ["--help"])
    return availability.available
      ? { command: explicit, diagnostic: `Using configured command: ${explicit}` }
      : { diagnostic: `Configured command is not available: ${explicit}. ${availability.diagnostic}` }
  }

  const diagnostics: string[] = []
  for (const candidate of candidates) {
    const availability = await commandIsAvailable(candidate, ["--help"])
    if (availability.available) {
      return { command: candidate, diagnostic: `Using command: ${candidate}` }
    }
    diagnostics.push(`${candidate}: ${availability.diagnostic}`)
  }

  return {
    diagnostic: `No Rust CLI command is available. Checked ${diagnostics.join("; ")}`,
  }
}

async function commandIsAvailable(
  command: string,
  args: string[],
): Promise<{ available: boolean; diagnostic: string }> {
  if (command.includes(path.sep)) {
    try {
      await fs.access(command)
      return { available: true, diagnostic: "file exists" }
    } catch (error) {
      return { available: false, diagnostic: errorMessage(error) }
    }
  }

  const output = await runCommand(command, args)
  return {
    available: output.ok,
    diagnostic: output.ok
      ? "command responded successfully"
      : output.stderr || output.error || `exit ${output.exitCode}`,
  }
}

async function readTelegramUploadFixture(repoRoot: string): Promise<TelegramBotUpdate> {
  const fixturePath = path.join(repoRoot, "docs/08_tasks/planned/fixtures/telegram-ai-review-media-upload-update.json")
  return JSON.parse(await fs.readFile(fixturePath, "utf-8")) as TelegramBotUpdate
}

function withTelegramFilePath(update: TelegramBotUpdate, mediaPath: string): TelegramBotUpdate {
  return {
    ...update,
    message: update.message
      ? {
          ...update.message,
          video: update.message.video
            ? {
                ...update.message.video,
                file_path: mediaPath,
              }
            : update.message.video,
        }
      : update.message,
  }
}

async function timedCheck<T>(
  name: string,
  run: () => Promise<{ check: RustAIReviewSmokeCheck; artifact?: T }>,
): Promise<{ check: RustAIReviewSmokeCheck; artifact?: T }> {
  try {
    return await run()
  } catch (error) {
    return {
      check: failedCheck(name, errorMessage(error), Date.now()),
    }
  }
}

function passedCheck(
  name: string,
  message: string,
  started = Date.now(),
  diagnostics?: Record<string, unknown>,
): RustAIReviewSmokeCheck {
  return {
    name,
    status: "passed",
    message,
    durationMs: Date.now() - started,
    ...(diagnostics ? { diagnostics } : {}),
  }
}

function skippedCheck(name: string, message: string, diagnostics?: Record<string, unknown>): RustAIReviewSmokeCheck {
  return {
    name,
    status: "skipped",
    message,
    durationMs: 0,
    ...(diagnostics ? { diagnostics } : {}),
  }
}

function failedCheck(
  name: string,
  message: string,
  started = Date.now(),
  diagnostics?: Record<string, unknown>,
): RustAIReviewSmokeCheck {
  return {
    name,
    status: "failed",
    message,
    durationMs: Date.now() - started,
    ...(diagnostics ? { diagnostics } : {}),
  }
}

function canUseNetwork(options: RustAIReviewSmokeOptions, env: Record<string, string | undefined>): boolean {
  if (options.publishRunCommand) return true
  return options.allowNetwork ?? env.AI_REVIEW_RUST_SMOKE_ALLOW_NETWORK === "1"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function runCommand(
  command: string,
  args: string[],
): Promise<{
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number | null
  error?: string
}> {
  return new Promise((resolve) => {
    let child: ChildProcessByStdio<null, Readable, Readable>
    try {
      child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] })
    } catch (error) {
      resolve({ ok: false, stdout: "", stderr: "", exitCode: null, error: errorMessage(error) })
      return
    }

    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => {
      resolve({ ok: false, stdout, stderr, exitCode: null, error: error.message })
    })
    child.on("close", (exitCode) => {
      resolve({ ok: exitCode === 0, stdout, stderr, exitCode })
    })
  })
}

export type RustAIReviewSmokePublishRunCommand = (
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> },
) => Promise<NodeRustPublishCommandResult>
