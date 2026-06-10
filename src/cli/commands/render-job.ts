/**
 * Bot-first render job command.
 *
 * Reads a machine-readable job JSON file, runs it through the headless Node
 * render job service, and writes a machine-readable result for bot/worker use.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { Command } from "commander"

import { initNodeApp } from "@/adapters/node"
import type { BotRenderJobRequest, BotRenderJobResult } from "@timeline-studio/core/types"

export interface RenderJobCommandOptions {
  statusFile?: string
  pretty?: boolean
  pollInterval?: string
  timeout?: string
  rustRender?: boolean
  rustRenderCommand?: string
  rustRenderKind?: "timeline" | "timeline-render"
}

export const renderJobCommand = new Command("render-job")
  .description("Run a bot-first render job from JSON")
  .argument("<job>", "Path to render job JSON")
  .option("--status-file <path>", "Write final job result JSON to a file")
  .option("--pretty", "Pretty-print JSON output")
  .option("--poll-interval <ms>", "Render polling interval in milliseconds", "1000")
  .option("--timeout <ms>", "Render timeout in milliseconds", "3600000")
  .option("--rust-render", "Run rendering through the Rust headless ts-render CLI")
  .option("--rust-render-command <path>", "Path/name for timeline or timeline-render command")
  .option("--rust-render-kind <kind>", "Rust render command kind: timeline or timeline-render")
  .action(async (jobFile: string, options: RenderJobCommandOptions) => {
    try {
      const result = await runRenderJobFile(jobFile, options)
      const serialized = serializeRenderJobResult(result, options.pretty)

      if (options.statusFile) {
        await fs.writeFile(path.resolve(options.statusFile), `${serialized}\n`)
      }

      process.stdout.write(`${serialized}\n`)
      if (result.job.status === "failed" || result.job.status === "cancelled") {
        process.exit(1)
      }
    } catch (error) {
      const failed = serializeRenderJobResult(
        {
          job: {
            id: "unavailable",
            status: "failed",
            progress: 0,
            request: {
              source: "cli",
              output: { format: "mp4", destination: "file" },
            },
            error: error instanceof Error ? error.message : String(error),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            events: [],
          },
          events: [],
        },
        options.pretty,
      )
      process.stderr.write(`${failed}\n`)
      process.exit(1)
    }
  })

export async function runRenderJobFile(
  jobFile: string,
  options: RenderJobCommandOptions = {},
): Promise<BotRenderJobResult> {
  const request = await readRenderJobRequest(jobFile)
  const services = await initNodeApp({
    autoConnect: false,
    rustRender: options.rustRender
      ? {
          command: options.rustRenderCommand,
          commandKind: options.rustRenderKind,
        }
      : undefined,
  })

  return services.renderJob.run(request, {
    pollIntervalMs: parsePositiveInteger(options.pollInterval, 1000),
    timeoutMs: parsePositiveInteger(options.timeout, 3600000),
  })
}

export async function readRenderJobRequest(jobFile: string): Promise<BotRenderJobRequest> {
  const jobPath = path.resolve(jobFile)
  const content = await fs.readFile(jobPath, "utf-8")
  const parsed = JSON.parse(content) as BotRenderJobRequest

  if (!parsed.output?.format) {
    throw new Error("Render job JSON must include output.format")
  }

  if (!parsed.source) {
    parsed.source = "cli"
  }

  return parsed
}

export function serializeRenderJobResult(result: BotRenderJobResult, pretty = false): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
