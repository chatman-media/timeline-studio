import { describe, expect, it, vi } from "vitest"
import type {
  BotRenderJobEvent,
  BotRenderJobSnapshot,
  BotWorkflowRequest,
  BotWorkflowValidationError,
} from "../../types"
import {
  createBotWorkflowStatusEventSink,
  createBotWorkflowStatusMessage,
  sendBotWorkflowValidationStatus,
} from "../bot-status-updates"

const workflow: BotWorkflowRequest = {
  source: "telegram",
  chatId: "chat-1",
  userId: "user-1",
  messageId: "message-1",
}

const event: BotRenderJobEvent = {
  jobId: "job-1",
  sequence: 2,
  status: "rendering",
  progress: 42.4,
  timestamp: "2026-06-08T00:00:00.000Z",
}

const snapshot: BotRenderJobSnapshot = {
  jobId: "job-1",
  status: "rendering",
  progress: 42.4,
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:01.000Z",
  eventCount: 3,
  lastEvent: event,
  canCancel: true,
  canRetry: false,
}

describe("bot status updates", () => {
  it("creates chat-ready status messages from render events", () => {
    const message = createBotWorkflowStatusMessage({ workflow, event, snapshot })

    expect(message).toMatchObject({
      kind: "rendering",
      text: "Rendering video: 42%.",
      timestamp: "2026-06-08T00:00:00.000Z",
      chatId: "chat-1",
      userId: "user-1",
      messageId: "message-1",
      jobId: "job-1",
      status: "rendering",
      progress: 42.4,
      event,
      snapshot,
    })
  })

  it("sends validation status messages with user-facing validation text", async () => {
    const sink = { sendStatus: vi.fn() }
    const errors: BotWorkflowValidationError[] = [
      {
        code: "missing_input",
        field: "workflow",
        message: "Workflow requires input",
        userMessage: "Send a video file, link, project, or choose a template.",
      },
    ]

    await sendBotWorkflowValidationStatus(workflow, errors, {
      sink,
      now: () => "2026-06-08T00:00:02.000Z",
    })

    expect(sink.sendStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "validation_error",
        text: "Send a video file, link, project, or choose a template.",
        timestamp: "2026-06-08T00:00:02.000Z",
        validationErrors: errors,
      }),
    )
  })

  it("does not fail render event publishing when status delivery fails by default", async () => {
    const sink = {
      sendStatus: vi.fn(async () => {
        throw new Error("telegram unavailable")
      }),
    }
    const statusSink = createBotWorkflowStatusEventSink(workflow, { sink })

    await expect(statusSink.publish(event, snapshot)).resolves.toBeUndefined()
    expect(sink.sendStatus).toHaveBeenCalledOnce()
  })

  it("throttles repeated rendering progress while sending status transitions", async () => {
    const sink = { sendStatus: vi.fn() }
    const statusSink = createBotWorkflowStatusEventSink(workflow, {
      sink,
      policy: {
        minProgressDelta: 10,
        minIntervalMs: 60_000,
      },
    })

    await statusSink.publish(createRenderEvent("rendering", 10, 1), createRenderSnapshot("rendering", 10, 1))
    await statusSink.publish(createRenderEvent("rendering", 15, 2), createRenderSnapshot("rendering", 15, 2))
    await statusSink.publish(createRenderEvent("rendering", 20, 3), createRenderSnapshot("rendering", 20, 3))
    await statusSink.publish(createRenderEvent("publishing", 20, 4), createRenderSnapshot("publishing", 20, 4))

    expect(sink.sendStatus).toHaveBeenCalledTimes(3)
    expect(sink.sendStatus).toHaveBeenNthCalledWith(1, expect.objectContaining({ text: "Rendering video: 10%." }))
    expect(sink.sendStatus).toHaveBeenNthCalledWith(2, expect.objectContaining({ text: "Rendering video: 20%." }))
    expect(sink.sendStatus).toHaveBeenNthCalledWith(3, expect.objectContaining({ text: "Publishing video." }))
  })

  it("can propagate status delivery failures when explicitly requested", async () => {
    const sink = {
      sendStatus: vi.fn(async () => {
        throw new Error("telegram unavailable")
      }),
    }
    const statusSink = createBotWorkflowStatusEventSink(workflow, { sink, throwOnError: true })

    await expect(statusSink.publish(event, snapshot)).rejects.toThrow("telegram unavailable")
  })
})

function createRenderEvent(status: BotRenderJobEvent["status"], progress: number, sequence: number): BotRenderJobEvent {
  return {
    jobId: "job-1",
    sequence,
    status,
    progress,
    timestamp: `2026-06-08T00:00:0${sequence}.000Z`,
  }
}

function createRenderSnapshot(
  status: BotRenderJobSnapshot["status"],
  progress: number,
  sequence: number,
): BotRenderJobSnapshot {
  const lastEvent = createRenderEvent(status, progress, sequence)
  return {
    jobId: "job-1",
    status,
    progress,
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: lastEvent.timestamp,
    eventCount: sequence + 1,
    lastEvent,
    canCancel: status !== "done" && status !== "failed" && status !== "cancelled",
    canRetry: status === "failed" || status === "cancelled",
  }
}
