import { describe, expect, it, vi } from "vitest"
import { InMemoryBotRenderJobEventStream } from "@/core/services"
import type {
  BotRenderJob,
  BotRenderJobEvent,
  BotRenderJobMediaInput,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
  BotRenderJobSnapshot,
} from "@/core/types"
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
})
