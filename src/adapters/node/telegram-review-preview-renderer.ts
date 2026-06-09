import fs from "node:fs/promises"
import path from "node:path"

import type { IRenderJobService } from "@/core/ports"
import type { BotRenderJobArtifact, BotRenderJobRunOptions } from "@/core/types"

import type {
  NodeTelegramBotReviewPreviewRenderer,
  NodeTelegramBotReviewPreviewRendererContext,
} from "./telegram-bot-worker"

export interface NodeTelegramRenderJobReviewPreviewRendererOptions {
  outputDir: string
  pollIntervalMs?: number
  timeoutMs?: number
}

export class NodeTelegramRenderJobReviewPreviewRenderer implements NodeTelegramBotReviewPreviewRenderer {
  constructor(
    private readonly renderJob: IRenderJobService,
    private readonly options: NodeTelegramRenderJobReviewPreviewRendererOptions,
  ) {}

  async renderPreview(context: NodeTelegramBotReviewPreviewRendererContext): Promise<BotRenderJobArtifact> {
    await fs.mkdir(this.options.outputDir, { recursive: true })
    const outputPath = path.join(
      this.options.outputDir,
      `${sanitizeFileSegment(context.session.id)}-r${context.revision.index}.mp4`,
    )
    const runOptions = createRenderRunOptions(this.options)
    const result = await this.renderJob.run(
      {
        source: "bot",
        media: context.session.media,
        project: {
          type: "inline",
          schema: context.projectSchema,
        },
        output: {
          format: "mp4",
          path: outputPath,
          destination: "file",
        },
        params: {
          reviewSessionId: context.session.id,
          reviewRevisionId: context.revision.id,
          ...(context.payload.message_id ? { sourceMessageId: context.payload.message_id } : {}),
        },
      },
      runOptions,
    )

    if (result.job.status !== "done") {
      throw new Error(result.job.error ?? `Preview render ended with status ${result.job.status}`)
    }

    if (!result.job.artifact) {
      throw new Error("Preview render completed without an artifact")
    }

    return result.job.artifact
  }
}

function createRenderRunOptions(options: NodeTelegramRenderJobReviewPreviewRendererOptions): BotRenderJobRunOptions {
  return {
    ...(options.pollIntervalMs !== undefined ? { pollIntervalMs: options.pollIntervalMs } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  }
}

function sanitizeFileSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "preview"
}
