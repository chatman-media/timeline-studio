import { type ChildProcess, type SpawnOptions, spawn } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import type { RenderJob, RenderProgress } from "@timeline-studio/core/ports"

import { type NodeVideoOptions, NodeVideoService } from "./video"

export type NodeRustRenderCommandKind = "timeline" | "timeline-render"

export interface NodeRustRenderCommand {
  command: string
  args: string[]
  cwd?: string
  env?: Record<string, string | undefined>
}

export interface NodeRustRenderVideoOptions extends NodeVideoOptions {
  command?: string
  commandKind?: NodeRustRenderCommandKind
  cwd?: string
  tempDir?: string
  idFactory?: () => string
  now?: () => string
  renderCommand?: (projectPath: string, outputPath: string) => NodeRustRenderCommand
}

interface RustActiveJob {
  process: ChildProcess
  job: RenderJob
  progress: RenderProgress
  projectPath: string
  stderr: string
  stdout: string
}

export class NodeRustRenderVideoService extends NodeVideoService {
  private readonly rustJobs = new Map<string, RustActiveJob>()
  private readonly tempDir: string
  private readonly command?: string
  private readonly commandKind?: NodeRustRenderCommandKind
  private readonly cwd?: string
  private readonly idFactory: () => string
  private readonly now: () => string
  private readonly renderCommand?: (projectPath: string, outputPath: string) => NodeRustRenderCommand

  constructor(options: NodeRustRenderVideoOptions = {}) {
    super(options)
    this.tempDir = options.tempDir ?? path.join(os.tmpdir(), "timeline-studio-rust-render")
    this.command = options.command
    this.commandKind = options.commandKind
    this.cwd = options.cwd
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => new Date().toISOString())
    this.renderCommand = options.renderCommand
  }

  override async renderProject(projectSchema: unknown, outputPath: string): Promise<string> {
    await fsPromises.mkdir(this.tempDir, { recursive: true })
    await fsPromises.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true })

    const jobId = this.idFactory()
    const projectPath = path.join(this.tempDir, `${jobId}.project.json`)
    await fsPromises.writeFile(projectPath, JSON.stringify(projectSchema, null, 2))

    const command = this.resolveCommand(projectPath, path.resolve(outputPath))
    const child = spawn(command.command, command.args, this.resolveSpawnOptions(command))
    const job: RenderJob = {
      id: jobId,
      status: "running",
      progress: 0,
      outputPath: path.resolve(outputPath),
      startedAt: this.now(),
    }
    const progress: RenderProgress = {
      jobId,
      progress: 0,
      stage: "rendering",
      currentFrame: 0,
      totalFrames: 0,
      eta: 0,
    }
    const activeJob: RustActiveJob = {
      process: child,
      job,
      progress,
      projectPath,
      stderr: "",
      stdout: "",
    }

    this.rustJobs.set(jobId, activeJob)
    this.attachProcessListeners(activeJob)

    return jobId
  }

  override async getActiveJobs(): Promise<RenderJob[]> {
    return Array.from(this.rustJobs.values()).map((entry) => entry.job)
  }

  override async getRenderJob(jobId: string): Promise<RenderJob> {
    const activeJob = this.rustJobs.get(jobId)
    if (!activeJob) {
      throw new Error(`Job not found: ${jobId}`)
    }
    return activeJob.job
  }

  override async getRenderProgress(jobId: string): Promise<RenderProgress> {
    const activeJob = this.rustJobs.get(jobId)
    if (!activeJob) {
      throw new Error(`Job not found: ${jobId}`)
    }
    return activeJob.progress
  }

  override async cancelRender(jobId: string): Promise<boolean> {
    const activeJob = this.rustJobs.get(jobId)
    if (!activeJob) return false

    activeJob.job.status = "cancelled"
    activeJob.job.completedAt = this.now()
    activeJob.progress.stage = "cancelled"
    activeJob.process.kill("SIGTERM")
    return true
  }

  private resolveCommand(projectPath: string, outputPath: string): NodeRustRenderCommand {
    if (this.renderCommand) {
      return this.renderCommand(projectPath, outputPath)
    }

    const command = this.command ?? defaultRustRenderCommand()
    const commandKind = this.commandKind ?? inferCommandKind(command)

    if (commandKind === "timeline-render") {
      return {
        command,
        args: ["--project", projectPath, outputPath],
        cwd: this.cwd,
      }
    }

    return {
      command,
      args: ["render", projectPath, outputPath],
      cwd: this.cwd,
    }
  }

  private resolveSpawnOptions(command: NodeRustRenderCommand): SpawnOptions {
    return {
      cwd: command.cwd ?? this.cwd,
      env: {
        ...process.env,
        ...command.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  }

  private attachProcessListeners(activeJob: RustActiveJob): void {
    activeJob.process.stdout?.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString()
      activeJob.stdout += text
      this.advanceProgress(activeJob, text)
    })

    activeJob.process.stderr?.on("data", (chunk: Buffer | string) => {
      activeJob.stderr += chunk.toString()
    })

    activeJob.process.on("error", (error) => {
      this.markFailed(activeJob, error.message)
    })

    activeJob.process.on("close", (code, signal) => {
      void this.finalizeProcess(activeJob, code, signal)
    })
  }

  private advanceProgress(activeJob: RustActiveJob, text: string): void {
    const dotCount = (text.match(/\./g) ?? []).length
    if (dotCount === 0) return

    activeJob.progress.progress = Math.min(90, activeJob.progress.progress + dotCount * 5)
    activeJob.job.progress = activeJob.progress.progress
  }

  private async finalizeProcess(activeJob: RustActiveJob, code: number | null, signal: NodeJS.Signals | null) {
    await fsPromises.unlink(activeJob.projectPath).catch(() => {})

    if (activeJob.job.status === "cancelled") {
      return
    }

    if (code !== 0) {
      this.markFailed(
        activeJob,
        activeJob.stderr.trim() || `Rust render command exited with code ${code ?? "null"} signal ${signal ?? "none"}`,
      )
      return
    }

    try {
      const stats = await fsPromises.stat(activeJob.job.outputPath ?? "")
      if (stats.size <= 0) {
        this.markFailed(activeJob, "Rust render command produced an empty output file")
        return
      }
    } catch (error) {
      this.markFailed(activeJob, error instanceof Error ? error.message : String(error))
      return
    }

    activeJob.job.status = "completed"
    activeJob.job.completedAt = this.now()
    activeJob.job.progress = 100
    activeJob.progress.progress = 100
    activeJob.progress.stage = "completed"
  }

  private markFailed(activeJob: RustActiveJob, error: string): void {
    if (activeJob.job.status === "cancelled") return

    activeJob.job.status = "failed"
    activeJob.job.completedAt = this.now()
    activeJob.job.error = error
    activeJob.job.progress = 0
    activeJob.progress.progress = 0
    activeJob.progress.stage = "failed"
  }
}

function inferCommandKind(command: string): NodeRustRenderCommandKind {
  return path.basename(command).includes("timeline-render") ? "timeline-render" : "timeline"
}

function defaultRustRenderCommand(): string {
  const workspaceTimeline = path.resolve(process.cwd(), "crates/target/debug/timeline")
  if (fs.existsSync(workspaceTimeline)) return workspaceTimeline

  const workspaceTimelineRender = path.resolve(process.cwd(), "crates/target/debug/timeline-render")
  if (fs.existsSync(workspaceTimelineRender)) return workspaceTimelineRender

  const localTimelineRender = path.resolve(process.cwd(), "crates/ts-render/target/debug/timeline-render")
  if (fs.existsSync(localTimelineRender)) return localTimelineRender

  return "timeline"
}
