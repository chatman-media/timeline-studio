import { type ChildProcessByStdio, spawn } from "node:child_process"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { Readable } from "node:stream"

import type {
  BotFirstCutGeneratorRequest,
  BotFirstCutPlannerResult,
  BotFirstCutProvider,
  IBotFirstCutPlanner,
} from "@timeline-studio/core"
import type { ProjectSchema } from "@/types/contracts/project-schema"

export type NodeRustFirstCutPlannerKind = "auto" | "montage-plan" | "llm-plan"

export interface NodeRustFirstCutPlannerCommandResult {
  stdout: string
  stderr: string
}

export interface NodeRustFirstCutPlannerOptions {
  command?: string
  cwd?: string
  env?: Record<string, string | undefined>
  tempDir?: string
  plannerKind?: NodeRustFirstCutPlannerKind
  apiKey?: string
  apiUrl?: string
  model?: string
  idFactory?: () => string
  runCommand?: (
    command: string,
    args: string[],
    options: { cwd?: string; env?: Record<string, string | undefined> },
  ) => Promise<NodeRustFirstCutPlannerCommandResult>
}

type NodeRustFirstCutPlannerChildProcess = ChildProcessByStdio<null, Readable, Readable>

export class NodeRustFirstCutPlanner implements IBotFirstCutPlanner {
  private readonly command: string
  private readonly tempDir: string
  private readonly idFactory: () => string

  constructor(private readonly options: NodeRustFirstCutPlannerOptions = {}) {
    this.command = options.command ?? defaultTimelineCommand()
    this.tempDir = options.tempDir ?? path.join(os.tmpdir(), "timeline-studio-first-cut")
    this.idFactory = options.idFactory ?? (() => cryptoRandomId())
  }

  async generatePlan(request: BotFirstCutGeneratorRequest): Promise<BotFirstCutPlannerResult> {
    await fsPromises.mkdir(this.tempDir, { recursive: true })
    const outputPath = path.join(this.tempDir, `${this.idFactory()}.project.json`)
    const provider = this.resolveProvider(request)
    const args =
      provider === "llm-plan" ? this.llmPlanArgs(request, outputPath) : this.montagePlanArgs(request, outputPath)
    const commandResult = await this.runCommand(this.command, args)
    const projectSchema = await this.readProjectSchema(outputPath, commandResult.stdout)

    return {
      projectSchema,
      provider,
      summary: `Generated first cut with timeline ${provider}.`,
      diagnostics: commandResult.stderr.trim() ? [commandResult.stderr.trim()] : [],
      metadata: {
        command: this.command,
        args: sanitizePlannerArgs(args),
        outputPath,
      },
    }
  }

  private resolveProvider(
    request: BotFirstCutGeneratorRequest,
  ): Exclude<BotFirstCutProvider, "deterministic-fallback"> {
    if (this.options.plannerKind === "llm-plan") return "llm-plan"
    if (this.options.plannerKind === "montage-plan") return "montage-plan"
    return this.resolveApiKey() && request.goal ? "llm-plan" : "montage-plan"
  }

  private llmPlanArgs(request: BotFirstCutGeneratorRequest, outputPath: string): string[] {
    const apiKey = this.resolveApiKey()
    if (!apiKey) {
      throw new Error("timeline llm-plan requires an API key")
    }

    const args = [
      "llm-plan",
      "--goal",
      request.goal?.trim() || "Create a concise first cut from the source media.",
      "--platform",
      resolvePlannerPlatform(request),
      "--api-key",
      apiKey,
      "--output",
      outputPath,
    ]

    for (const media of request.sourceMedia) {
      args.push("--input", media.value)
    }
    if (this.options.apiUrl) args.push("--api-url", this.options.apiUrl)
    if (this.options.model) args.push("--model", this.options.model)
    if (request.sceneSampleCount) args.push("--scenes", String(request.sceneSampleCount))

    return args
  }

  private montagePlanArgs(request: BotFirstCutGeneratorRequest, outputPath: string): string[] {
    const args = [
      "montage-plan",
      ...request.sourceMedia.map((media) => media.value),
      "--platform",
      resolvePlannerPlatform(request),
      "--duration",
      String(request.targetDurationSeconds ?? 30),
      "--style",
      request.style ?? "social-media",
      "--scenes",
      String(request.sceneSampleCount ?? 8),
      "--output",
      outputPath,
      "--schema-only",
    ]

    return args
  }

  private async runCommand(command: string, args: string[]): Promise<NodeRustFirstCutPlannerCommandResult> {
    const options = {
      cwd: this.options.cwd,
      env: {
        ...process.env,
        ...this.options.env,
      },
    }
    if (this.options.runCommand) {
      return this.options.runCommand(command, args, options)
    }
    return spawnCommand(command, args, options)
  }

  private async readProjectSchema(outputPath: string, stdout: string): Promise<ProjectSchema> {
    let raw = stdout.trim()
    try {
      raw = await fsPromises.readFile(outputPath, "utf-8")
    } catch (error) {
      if (!isNotFoundError(error) || !raw) throw error
    }
    return JSON.parse(raw) as ProjectSchema
  }

  private resolveApiKey(): string | undefined {
    return (
      this.options.apiKey ?? this.options.env?.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY
    )
  }
}

function sanitizePlannerArgs(args: string[]): string[] {
  return args.map((arg, index) => (args[index - 1] === "--api-key" ? "[redacted]" : arg))
}

function spawnCommand(
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> },
): Promise<NodeRustFirstCutPlannerCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env as NodeJS.ProcessEnv | undefined,
      stdio: ["ignore", "pipe", "pipe"],
    }) as NodeRustFirstCutPlannerChildProcess
    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })
    child.on("error", reject)
    child.on("close", (code: number | null) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `timeline first-cut planner exited with code ${code ?? "null"}`))
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

function resolvePlannerPlatform(request: BotFirstCutGeneratorRequest): string {
  if (request.targetPlatform) return request.targetPlatform
  switch (request.publishDestination) {
    case "tiktok":
      return "tiktok"
    case "youtube":
      return "youtube"
    default:
      return "youtube"
  }
}

function defaultTimelineCommand(): string {
  const workspaceTimeline = path.resolve(process.cwd(), "crates/target/debug/timeline")
  if (fs.existsSync(workspaceTimeline)) return workspaceTimeline
  return "timeline"
}

function cryptoRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
