import { describe, expect, it, vi } from "vitest"
import type { IBotFirstCutGenerator, IRenderJobService } from "../../ports"
import type {
  BotRenderJob,
  BotRenderJobEvent,
  BotRenderJobMediaInput,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
} from "../../types"
import { resolveBotApprovalDecision } from "../../types/bot-workflow"
import { createBotProjectSchemaFromRenderJob } from "../bot-project-assembler"
import { runBotWorkflow, runTelegramLikeBotWorkflow } from "../bot-workflow-runner"
import { InMemoryBotRenderJobEventStream } from "../render-job-events"

class FakeRenderJobService implements IRenderJobService {
  lastRequest?: BotRenderJobRequest
  lastOptions?: BotRenderJobRunOptions

  async run(request: BotRenderJobRequest, options: BotRenderJobRunOptions = {}): Promise<BotRenderJobResult> {
    this.lastRequest = request
    this.lastOptions = options

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
      artifact: {
        type: "file",
        path: request.output.path,
        destination: request.output.destination ?? "file",
        mimeType: "video/mp4",
      },
      createdAt: "2026-06-08T00:00:00.000Z",
      updatedAt: "2026-06-08T00:00:01.000Z",
      events: [event],
    }
    const snapshot = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      artifact: job.artifact,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      eventCount: job.events.length,
      lastEvent: event,
      canCancel: false,
      canRetry: false,
    }

    for (const sink of options.eventSinks ?? []) {
      await sink.publish(event, snapshot)
    }

    return { job, events: [event] }
  }

  async getJob(jobId: string): Promise<BotRenderJob | null> {
    return jobId === "job-1" ? null : null
  }

  async cancelJob(): Promise<boolean> {
    return false
  }
}

describe("bot workflow runner", () => {
  it("normalizes Telegram-like payload, runs render job, and returns reconnect state", async () => {
    const renderJob = new FakeRenderJobService()
    const eventStream = new InMemoryBotRenderJobEventStream()
    const statusSink = { sendStatus: vi.fn() }

    const result = await runTelegramLikeBotWorkflow(
      {
        chat: { id: "chat-1" },
        caption: 'project="./project.json" destination=file output="./out.mp4" tone=fast',
      },
      {
        renderJob,
        eventStream,
        status: { sink: statusSink },
        render: { pollIntervalMs: 5, timeoutMs: 10 },
        includeReconnectState: true,
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(renderJob.lastRequest).toMatchObject({
      source: "bot",
      project: { type: "file", path: "./project.json" },
      params: { tone: "fast" },
      output: { format: "mp4", path: "./out.mp4", destination: "file" },
    })
    expect(renderJob.lastOptions).toMatchObject({ pollIntervalMs: 5, timeoutMs: 10 })
    expect(result.result.job.status).toBe("done")
    expect(result.reconnectState?.snapshot).toMatchObject({ jobId: "job-1", status: "done" })
    expect(result.reconnectState?.events).toHaveLength(1)
    expect(statusSink.sendStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "done",
        text: "Video is ready: ./out.mp4",
        chatId: "chat-1",
        jobId: "job-1",
      }),
    )
  })

  it("returns validation errors without running render job", async () => {
    const renderJob = new FakeRenderJobService()
    const runSpy = vi.spyOn(renderJob, "run")
    const statusSink = { sendStatus: vi.fn() }

    const result = await runBotWorkflow(
      {
        source: "telegram",
        media: [{ type: "file", value: "" }],
      },
      {
        renderJob,
        status: {
          sink: statusSink,
          now: () => "2026-06-08T00:00:00.000Z",
        },
      },
    )

    expect(result).toEqual({
      ok: false,
      workflow: {
        source: "telegram",
        media: [{ type: "file", value: "" }],
      },
      errors: [
        {
          code: "invalid_media",
          field: "media.0.value",
          message: "Media attachment value cannot be empty",
          userMessage: "One of the attached files is empty or unavailable. Send it again.",
        },
        {
          code: "missing_input",
          field: "workflow",
          message: "Workflow requires a template, project, or media attachment",
          userMessage: "Send a video file, link, project, or choose a template.",
        },
      ],
    })
    expect(runSpy).not.toHaveBeenCalled()
    expect(statusSink.sendStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "validation_error",
        text: "One of the attached files is empty or unavailable. Send it again.",
        timestamp: "2026-06-08T00:00:00.000Z",
      }),
    )
  })

  it("hydrates media-only workflows with an inline ProjectSchema before rendering", async () => {
    const renderJob = new FakeRenderJobService()
    const mediaResolver = {
      resolve: vi.fn(async (media: BotRenderJobMediaInput) => ({
        ...media,
        value: "/tmp/resolved-clip.mp4",
        metadata: {
          ...media.metadata,
          resolvedFrom: media.value,
        },
      })),
    }

    const result = await runTelegramLikeBotWorkflow(
      {
        caption: 'template=promo output="./out.mp4"',
        video: {
          file_id: "telegram-file-id",
          file_name: "clip.mp4",
          mime_type: "video/mp4",
        },
      },
      {
        renderJob,
        mediaResolver,
        projectAssembly: {
          now: () => "2026-06-08T00:00:00.000Z",
          defaultClipDurationSeconds: 4,
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.renderJob.project).toMatchObject({
      type: "inline",
      schema: {
        metadata: {
          name: "Bot promo",
        },
        timeline: {
          duration: 4,
        },
        tracks: [
          {
            track_type: "Video",
            clips: [
              {
                source: { File: "/tmp/resolved-clip.mp4" },
                template_id: "promo",
                template_position: 0,
              },
            ],
          },
        ],
      },
    })
    expect(mediaResolver.resolve).toHaveBeenCalledOnce()
    expect(renderJob.lastRequest?.project).toBe(result.renderJob.project)
  })

  it("uses the configured first-cut generator before deterministic project assembly", async () => {
    const renderJob = new FakeRenderJobService()
    const projectSchema = createBotProjectSchemaFromRenderJob({
      source: "bot",
      media: [{ type: "file", value: "/tmp/first-cut.mp4", name: "first-cut.mp4" }],
      output: { format: "mp4", destination: "file" },
    })
    if (!projectSchema) throw new Error("Expected project schema")
    const firstCutGenerator: IBotFirstCutGenerator = {
      generateFirstCut: vi.fn(async () => ({
        projectSchema,
        provider: "montage-plan" as const,
        summary: "Planned first cut",
        diagnostics: ["used montage"],
        metadata: { planner: "test" },
      })),
    }
    const mediaResolver = {
      resolve: vi.fn(async (media: BotRenderJobMediaInput) => ({
        ...media,
        value: "/tmp/resolved-clip.mp4",
      })),
    }

    const result = await runBotWorkflow(
      {
        source: "telegram",
        messageId: "message-1",
        text: "goal=make-short style=fast",
        media: [{ type: "file", value: "telegram-file-id", name: "clip.mp4" }],
        output: { destination: "youtube" },
      },
      {
        renderJob,
        mediaResolver,
        firstCutGenerator,
        approvalGate: {
          enabled: true,
          previewDestination: "telegram",
        },
        projectAssembly: {
          defaultClipDurationSeconds: 9,
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(firstCutGenerator.generateFirstCut).toHaveBeenCalledWith({
      sourceMessageId: "message-1",
      sourceMedia: [{ type: "file", value: "/tmp/resolved-clip.mp4", name: "clip.mp4" }],
      goal: "make-short",
      targetPlatform: "youtube",
      publishDestination: "youtube",
      targetDurationSeconds: 9,
      style: "fast",
      metadata: {
        workflowSource: "telegram",
      },
    })
    expect(result.renderJob.project).toEqual({ type: "inline", schema: projectSchema })
    expect(renderJob.lastRequest?.project).toEqual(result.renderJob.project)
    expect(renderJob.lastRequest?.params).toMatchObject({
      approvalRequired: true,
      previewDestination: "telegram",
      publishTarget: "youtube",
      firstCut: {
        provider: "montage-plan",
        summary: "Planned first cut",
        diagnostics: ["used montage"],
        metadata: { planner: "test" },
      },
    })
  })

  it("does not call the first-cut generator for explicit project workflows", async () => {
    const renderJob = new FakeRenderJobService()
    const firstCutGenerator: IBotFirstCutGenerator = {
      generateFirstCut: vi.fn(async () => {
        throw new Error("first-cut should not run")
      }),
    }

    const result = await runBotWorkflow(
      {
        source: "telegram",
        project: { type: "inline", schema: { version: "1.0.0" } },
        media: [{ type: "file", value: "/tmp/input.mp4", name: "clip.mp4" }],
        output: { destination: "file" },
      },
      {
        renderJob,
        firstCutGenerator,
      },
    )

    expect(result.ok).toBe(true)
    expect(firstCutGenerator.generateFirstCut).not.toHaveBeenCalled()
    expect(renderJob.lastRequest?.project).toEqual({ type: "inline", schema: { version: "1.0.0" } })
  })

  it("gates bot workflow publishing by rendering previews to file output", async () => {
    const renderJob = new FakeRenderJobService()

    const result = await runBotWorkflow(
      {
        source: "telegram",
        project: { type: "inline", schema: { clips: [] } },
        output: { format: "mp4", destination: "youtube" },
      },
      {
        renderJob,
        approvalGate: {
          enabled: true,
          previewDestination: "telegram",
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(renderJob.lastRequest).toMatchObject({
      output: { format: "mp4", destination: "file" },
      params: {
        approvalRequired: true,
        previewDestination: "telegram",
        publishTarget: "youtube",
      },
    })
    expect(result.approvalGate).toEqual({
      enabled: true,
      previewDestination: "telegram",
      publishTarget: "youtube",
    })
  })

  it("preserves caller event sinks while adding the workflow event stream", async () => {
    const renderJob = new FakeRenderJobService()
    const eventStream = new InMemoryBotRenderJobEventStream()
    const callerSink = {
      publish: vi.fn(),
    }

    await runBotWorkflow(
      {
        source: "telegram",
        project: { type: "inline", schema: { clips: [] } },
        output: { format: "mp4", destination: "file" },
      },
      {
        renderJob,
        eventStream,
        render: { eventSinks: [callerSink] },
      },
    )

    expect(renderJob.lastOptions?.eventSinks).toHaveLength(2)
    expect(callerSink.publish).toHaveBeenCalledTimes(1)
    expect(eventStream.getSnapshot("job-1")).toMatchObject({ status: "done" })
  })
})

describe("resolveBotApprovalDecision (#334)", () => {
  it("'never' bypasses the gate (self-serve, no auto-approve)", () => {
    expect(resolveBotApprovalDecision("never", 0)).toEqual({ gateEnabled: false, autoApprove: false })
    expect(resolveBotApprovalDecision("never", 3)).toEqual({ gateEnabled: false, autoApprove: false })
  })

  it("'always' gates and never auto-approves", () => {
    expect(resolveBotApprovalDecision("always", 0)).toEqual({ gateEnabled: true, autoApprove: false })
    expect(resolveBotApprovalDecision("always", 5)).toEqual({ gateEnabled: true, autoApprove: false })
  })

  it("'auto' gates and auto-approves only when the run is warning-free", () => {
    expect(resolveBotApprovalDecision("auto", 0)).toEqual({ gateEnabled: true, autoApprove: true })
    expect(resolveBotApprovalDecision("auto", 1)).toEqual({ gateEnabled: true, autoApprove: false })
  })
})
