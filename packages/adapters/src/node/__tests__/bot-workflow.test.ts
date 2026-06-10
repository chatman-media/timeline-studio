import { describe, expect, it, vi } from "vitest"
import { createBotProjectSchemaFromRenderJob } from "@timeline-studio/core"
import type { IBotFirstCutGenerator } from "@timeline-studio/core/ports"
import { InMemoryBotRenderJobEventStream } from "@timeline-studio/core/services"
import type {
  BotRenderJob,
  BotRenderJobEvent,
  BotRenderJobMediaInput,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
  BotRenderJobSnapshot,
} from "@timeline-studio/core/types"
import { NodeBotWorkflowService } from "../bot-workflow"
import type { NodeRenderJobService } from "../render-job"

function createRenderJobService() {
  const run = vi.fn(async (request: BotRenderJobRequest, options: BotRenderJobRunOptions = {}) => {
    const event: BotRenderJobEvent = {
      jobId: "job-1",
      sequence: 0,
      status: "done",
      progress: 100,
      timestamp: "2026-06-08T00:00:00.000Z",
    }
    const job: BotRenderJob = {
      id: "job-1",
      status: "done",
      progress: 100,
      request,
      createdAt: "2026-06-08T00:00:00.000Z",
      updatedAt: "2026-06-08T00:00:01.000Z",
      events: [event],
    }
    const snapshot: BotRenderJobSnapshot = {
      jobId: "job-1",
      status: "done",
      progress: 100,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      eventCount: 1,
      lastEvent: event,
      canCancel: false,
      canRetry: false,
    }

    for (const sink of options.eventSinks ?? []) {
      await sink.publish(event, snapshot)
    }

    return { job, events: [event] } satisfies BotRenderJobResult
  })

  return {
    service: {
      run,
      getJob: vi.fn(),
      cancelJob: vi.fn(),
    } as unknown as NodeRenderJobService,
    run,
  }
}

describe("NodeBotWorkflowService", () => {
  it("runs Telegram-like payloads with merged defaults, caller options, and event stream", async () => {
    const { service: renderJob, run } = createRenderJobService()
    const defaultSink = { publish: vi.fn() }
    const callerSink = { publish: vi.fn() }
    const statusSink = { sendStatus: vi.fn() }
    const eventStream = new InMemoryBotRenderJobEventStream()
    const mediaResolver = {
      resolve: vi.fn(async (media: BotRenderJobMediaInput) => ({
        ...media,
        value: "/tmp/resolved-clip.mp4",
      })),
    }
    const botWorkflow = new NodeBotWorkflowService(renderJob, {
      intake: { defaultDestination: "file" },
      mediaResolver,
      projectAssembly: {
        now: () => "2026-06-08T00:00:00.000Z",
        defaultClipDurationSeconds: 2,
      },
      status: { sink: statusSink },
      render: { pollIntervalMs: 7, eventSinks: [defaultSink] },
    })

    const result = await botWorkflow.runTelegramLikePayload(
      {
        caption: "template=promo",
        video: {
          file_id: "telegram-file-id",
          file_name: "clip.mp4",
        },
      },
      {
        eventStream,
        render: { timeoutMs: 9, eventSinks: [callerSink] },
      },
    )

    expect(result.ok).toBe(true)
    expect(run).toHaveBeenCalledOnce()

    const [request, options] = run.mock.calls[0]
    expect(request.project).toMatchObject({
      type: "inline",
      schema: {
        timeline: { duration: 2 },
        tracks: [{ clips: [{ source: { File: "/tmp/resolved-clip.mp4" } }] }],
      },
    })
    expect(mediaResolver.resolve).toHaveBeenCalledOnce()
    expect(options).toMatchObject({ pollIntervalMs: 7, timeoutMs: 9 })
    expect(options?.eventSinks).toHaveLength(4)
    expect(defaultSink.publish).toHaveBeenCalledOnce()
    expect(callerSink.publish).toHaveBeenCalledOnce()
    expect(statusSink.sendStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "done",
        text: "Video is ready.",
        jobId: "job-1",
      }),
    )
    expect(eventStream.getSnapshot("job-1")).toMatchObject({ status: "done" })
  })

  it("passes the configured first-cut generator into Telegram-like workflow runs", async () => {
    const { service: renderJob, run } = createRenderJobService()
    const projectSchema = createBotProjectSchemaFromRenderJob({
      source: "bot",
      media: [{ type: "file", value: "/tmp/first-cut.mp4", name: "first-cut.mp4" }],
      output: { format: "mp4", destination: "file" },
    })
    if (!projectSchema) throw new Error("Expected test ProjectSchema")

    const firstCutGenerator: IBotFirstCutGenerator = {
      generateFirstCut: vi.fn(async () => ({
        projectSchema,
        provider: "deterministic-fallback" as const,
        summary: "First-cut from adapter default",
        diagnostics: ["info: adapter first-cut"],
      })),
    }
    const botWorkflow = new NodeBotWorkflowService(renderJob, {
      firstCutGenerator,
      projectAssembly: {
        defaultClipDurationSeconds: 2,
      },
    })

    const result = await botWorkflow.runTelegramLikePayload({
      text: "url=https://example.test/input.mp4 destination=telegram",
      message_id: "message-1",
    })

    expect(result.ok).toBe(true)
    expect(firstCutGenerator.generateFirstCut).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMedia: [
          expect.objectContaining({
            type: "url",
            value: "https://example.test/input.mp4",
          }),
        ],
        sourceMessageId: "message-1",
        goal: "url=https://example.test/input.mp4 destination=telegram",
        targetPlatform: "telegram",
        publishDestination: "telegram",
        targetDurationSeconds: 2,
      }),
    )
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        project: {
          type: "inline",
          schema: projectSchema,
        },
        params: expect.objectContaining({
          firstCut: expect.objectContaining({
            provider: "deterministic-fallback",
            summary: "First-cut from adapter default",
          }),
        }),
      }),
      expect.any(Object),
    )
  })
})
