import { describe, expect, it } from "vitest"
import type { BotRenderJob, BotRenderJobEvent } from "@timeline-studio/core/types"
import {
  createBotRenderJobRetryRequest,
  createBotRenderJobSnapshot,
  InMemoryBotRenderJobEventStream,
} from "../render-job-events"

function createJob(status: BotRenderJob["status"] = "rendering"): BotRenderJob {
  const events: BotRenderJobEvent[] = [
    {
      jobId: "job-1",
      sequence: 0,
      status: "queued",
      progress: 0,
      message: "queued",
      timestamp: "2026-06-08T00:00:00.000Z",
    },
    {
      jobId: "job-1",
      sequence: 1,
      status,
      progress: status === "failed" ? 40 : 60,
      message: status,
      timestamp: "2026-06-08T00:00:01.000Z",
    },
  ]

  return {
    id: "job-1",
    providerJobId: "provider-1",
    status,
    progress: status === "failed" ? 40 : 60,
    request: {
      source: "bot",
      templateId: "promo",
      output: { format: "mp4", destination: "telegram" },
      params: { tone: "direct" },
    },
    error: status === "failed" ? "Encoding failed" : undefined,
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:01.000Z",
    events,
  }
}

describe("render job events", () => {
  it("creates reconnect snapshots with cancel/retry capabilities", () => {
    const renderingSnapshot = createBotRenderJobSnapshot(createJob("rendering"))
    expect(renderingSnapshot).toMatchObject({
      jobId: "job-1",
      providerJobId: "provider-1",
      status: "rendering",
      progress: 60,
      eventCount: 2,
      canCancel: true,
      canRetry: false,
      lastEvent: { sequence: 1, status: "rendering" },
    })

    const failedSnapshot = createBotRenderJobSnapshot(createJob("failed"))
    expect(failedSnapshot).toMatchObject({
      status: "failed",
      canCancel: false,
      canRetry: true,
      error: "Encoding failed",
    })
  })

  it("stores bounded event history and returns reconnect state after a cursor", () => {
    const stream = new InMemoryBotRenderJobEventStream({ maxEventsPerJob: 2 })
    const job = createJob("rendering")

    for (const event of job.events) {
      stream.publish(event, createBotRenderJobSnapshot(job))
    }

    const thirdEvent: BotRenderJobEvent = {
      jobId: "job-1",
      sequence: 2,
      status: "rendering",
      progress: 80,
      message: "rendering",
      timestamp: "2026-06-08T00:00:02.000Z",
    }
    stream.publish(thirdEvent, {
      ...createBotRenderJobSnapshot(job),
      eventCount: 3,
      lastEvent: thirdEvent,
      progress: 80,
    })

    expect(stream.getEvents("job-1").map((event) => event.sequence)).toEqual([1, 2])
    expect(stream.getReconnectState("job-1", { afterSequence: 1 })).toMatchObject({
      snapshot: {
        jobId: "job-1",
        progress: 80,
        lastEvent: { sequence: 2 },
      },
      events: [{ sequence: 2 }],
    })
  })

  it("builds retry requests only for retryable jobs", () => {
    const failedJob = createJob("failed")

    expect(createBotRenderJobRetryRequest(failedJob, { outputPath: "/tmp/retry.mp4" })).toEqual({
      source: "bot",
      templateId: "promo",
      output: { format: "mp4", destination: "telegram", path: "/tmp/retry.mp4" },
      params: {
        tone: "direct",
        retryOf: "job-1",
        retryAttempt: 1,
      },
    })

    expect(() => createBotRenderJobRetryRequest(createJob("rendering"))).toThrow(
      "Render job job-1 cannot be retried from status rendering",
    )
  })
})
