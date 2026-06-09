import { type ChildProcessByStdio, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import type { Readable } from "node:stream"

import type { IPublishService } from "@/core/ports"
import type { BotPublishRequest, BotPublishResult, BotRenderJobDestination } from "@/core/types"

export interface NodeRustPublishCommandResult {
  stdout: string
  stderr: string
}

export interface NodeRustPublishServiceOptions {
  command?: string
  cwd?: string
  env?: Record<string, string | undefined>
  telegram?: {
    botToken?: string
    defaultChatId?: string
  }
  youtube?: {
    accessToken?: string
  }
  runCommand?: (
    command: string,
    args: string[],
    options: { cwd?: string; env?: Record<string, string | undefined> },
  ) => Promise<NodeRustPublishCommandResult>
}

type NodeRustPublishChildProcess = ChildProcessByStdio<null, Readable, Readable>

export class NodeRustPublishService implements IPublishService {
  private readonly command: string

  constructor(private readonly options: NodeRustPublishServiceOptions = {}) {
    this.command = options.command ?? defaultTimelineCommand()
  }

  canPublish(destination: BotRenderJobDestination): boolean {
    switch (destination) {
      case "file":
        return true
      case "telegram":
        return Boolean(this.resolveTelegramToken())
      case "youtube":
        return Boolean(this.resolveYouTubeToken())
      default:
        return false
    }
  }

  async publish(request: BotPublishRequest): Promise<BotPublishResult> {
    switch (request.destination) {
      case "file":
        return this.publishFile(request)
      case "telegram":
        return this.publishTelegram(request)
      case "youtube":
        return this.publishYouTube(request)
      default:
        return {
          destination: request.destination,
          status: "unsupported",
          error: `Rust publish does not support ${request.destination}`,
        }
    }
  }

  private async publishFile(request: BotPublishRequest): Promise<BotPublishResult> {
    if (!request.artifact.path) {
      return {
        destination: "file",
        status: "failed",
        error: "File publishing requires a local artifact path",
      }
    }

    return {
      destination: "file",
      status: "done",
      artifact: {
        ...request.artifact,
        destination: "file",
      },
      metadata: request.metadata,
    }
  }

  private async publishTelegram(request: BotPublishRequest): Promise<BotPublishResult> {
    const token = this.resolveTelegramToken()
    const chatId = request.metadata?.chatId ?? this.options.telegram?.defaultChatId
    if (!token) return failedPublish("telegram", "Telegram bot token is not configured")
    if (!chatId) return failedPublish("telegram", "Telegram chat id is not configured")
    if (!request.artifact.path && !isValidateOnly(request)) {
      return failedPublish("telegram", "Telegram publishing requires a local file artifact")
    }

    const args = [
      "publish",
      "telegram",
      ...(request.artifact.path ? ["--input", request.artifact.path] : []),
      "--token",
      token,
      "--chat",
      chatId,
      "--json",
      ...((request.metadata?.caption ?? request.metadata?.title)
        ? ["--caption", request.metadata?.caption ?? request.metadata?.title ?? ""]
        : []),
      ...(isValidateOnly(request) ? ["--validate-only"] : []),
    ]
    const commandResult = await this.runCommand(args)
    const rustResult = parseRustPublishJson(commandResult.stdout)

    return {
      destination: "telegram",
      status: "done",
      artifact: createPublishedArtifact("telegram", request, stringField(rustResult, "url")),
      providerId: numberOrStringField(rustResult, "message_id"),
      url: stringField(rustResult, "url"),
      metadata: {
        ...request.metadata,
        provider: {
          ...rustResult,
          command: this.command,
          args: sanitizeRustPublishArgs(args),
        },
      },
    }
  }

  private async publishYouTube(request: BotPublishRequest): Promise<BotPublishResult> {
    const token = this.resolveYouTubeToken(request)
    if (!token) return failedPublish("youtube", "YouTube access token is not configured")
    if (!request.artifact.path) return failedPublish("youtube", "YouTube publishing requires a local file artifact")

    const args = [
      "publish",
      "youtube",
      "--input",
      request.artifact.path,
      "--token",
      token,
      "--title",
      request.metadata?.title ?? "Timeline Studio Export",
      "--json",
      ...(request.metadata?.description ? ["--description", request.metadata.description] : []),
      ...(request.metadata?.tags?.length ? ["--tags", request.metadata.tags.join(",")] : []),
      ...(request.metadata?.visibility ? ["--privacy", request.metadata.visibility] : []),
      ...(isValidateOnly(request) ? ["--validate-only"] : []),
    ]
    const commandResult = await this.runCommand(args)
    const rustResult = parseRustPublishJson(commandResult.stdout)

    return {
      destination: "youtube",
      status: "done",
      artifact: createPublishedArtifact("youtube", request, stringField(rustResult, "url")),
      providerId: stringField(rustResult, "video_id"),
      url: stringField(rustResult, "url"),
      metadata: {
        ...request.metadata,
        provider: {
          ...rustResult,
          command: this.command,
          args: sanitizeRustPublishArgs(args),
        },
      },
    }
  }

  private async runCommand(args: string[]): Promise<NodeRustPublishCommandResult> {
    const options = {
      cwd: this.options.cwd,
      env: {
        ...process.env,
        ...this.options.env,
      },
    }
    if (this.options.runCommand) {
      return this.options.runCommand(this.command, args, options)
    }
    return spawnCommand(this.command, args, options)
  }

  private resolveTelegramToken(): string | undefined {
    return (
      this.options.telegram?.botToken ??
      this.options.env?.TELEGRAM_BOT_TOKEN ??
      this.options.env?.BOT_TOKEN ??
      process.env.TELEGRAM_BOT_TOKEN
    )
  }

  private resolveYouTubeToken(request?: BotPublishRequest): string | undefined {
    const providerToken = request?.metadata?.provider?.accessToken ?? request?.metadata?.provider?.token
    return (
      stringValue(providerToken) ??
      this.options.youtube?.accessToken ??
      this.options.env?.YOUTUBE_ACCESS_TOKEN ??
      process.env.YOUTUBE_ACCESS_TOKEN
    )
  }
}

function spawnCommand(
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> },
): Promise<NodeRustPublishCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env as NodeJS.ProcessEnv | undefined,
      stdio: ["ignore", "pipe", "pipe"],
    }) as NodeRustPublishChildProcess
    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })
    child.on("error", reject)
    child.on("close", (code: number | null) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `timeline publish exited with code ${code ?? "null"}`))
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

function parseRustPublishJson(stdout: string): Record<string, unknown> {
  const raw = stdout.trim()
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

function createPublishedArtifact(
  destination: BotRenderJobDestination,
  request: BotPublishRequest,
  url?: string,
): BotPublishResult["artifact"] {
  if (url) {
    return {
      type: "url",
      url,
      destination,
      mimeType: request.artifact.mimeType,
    }
  }

  return {
    ...request.artifact,
    destination,
  }
}

function failedPublish(destination: BotRenderJobDestination, error: string): BotPublishResult {
  return {
    destination,
    status: "failed",
    error,
  }
}

function isValidateOnly(request: BotPublishRequest): boolean {
  return request.params?.validateOnly === true
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

function stringField(value: Record<string, unknown>, key: string): string | undefined {
  return stringValue(value[key])
}

function numberOrStringField(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]
  if (typeof field === "number" && Number.isFinite(field)) return String(field)
  return stringValue(field)
}

function sanitizeRustPublishArgs(args: string[]): string[] {
  return args.map((arg, index) => (args[index - 1] === "--token" ? "[redacted]" : arg))
}

function defaultTimelineCommand(): string {
  const workspaceTimeline = path.resolve(process.cwd(), "crates/target/debug/timeline")
  if (fs.existsSync(workspaceTimeline)) return workspaceTimeline
  return "timeline"
}
