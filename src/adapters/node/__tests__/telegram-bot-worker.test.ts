import { describe, expect, it, vi } from "vitest"
import type { BotWorkflowRunResult } from "@/core/types"
import type { NodeBotWorkflowService } from "../bot-workflow"
import {
  createTelegramLikePayloadFromUpdate,
  NodeTelegramBotApiClient,
  NodeTelegramBotWorker,
  type TelegramBotUpdate,
} from "../telegram-bot-worker"

const failedResult: BotWorkflowRunResult = {
  ok: false,
  workflow: { source: "telegram" },
  errors: [
    {
      code: "missing_input",
      field: "workflow",
      message: "Workflow requires input",
      userMessage: "Send a video file, link, project, or choose a template.",
    },
  ],
}

function createWorkflowService() {
  const runTelegramLikePayload = vi.fn(async () => failedResult)

  return {
    service: {
      runTelegramLikePayload,
    } as unknown as NodeBotWorkflowService,
    runTelegramLikePayload,
  }
}

describe("Telegram bot worker", () => {
  it("converts Telegram updates into Telegram-like workflow payloads", () => {
    const payload = createTelegramLikePayloadFromUpdate({
      update_id: 10,
      message: {
        message_id: 7,
        chat: { id: 42 },
        from: { id: "user-1" },
        caption: "template=promo",
        video: {
          file_id: "telegram-file-id",
          file_unique_id: "unique-file-id",
          file_name: "clip.mp4",
          mime_type: "video/mp4",
        },
      },
    })

    expect(payload).toEqual({
      chat: { id: 42 },
      from: { id: "user-1" },
      message_id: 7,
      caption: "template=promo",
      video: {
        file_id: "telegram-file-id",
        file_unique_id: "unique-file-id",
        file_name: "clip.mp4",
        mime_type: "video/mp4",
      },
    })
  })

  it("handles supported updates through the bot workflow service", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const onResult = vi.fn()
    const worker = new NodeTelegramBotWorker({
      workflow: service,
      workflowOptions: {
        intake: { defaultDestination: "telegram" },
      },
      onResult,
    })
    const update: TelegramBotUpdate = {
      update_id: 11,
      message: {
        message_id: "message-1",
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    }

    const result = await worker.handleUpdate(update, {
      workflowOptions: {
        render: { timeoutMs: 10 },
      },
    })

    expect(result).toMatchObject({
      skipped: false,
      updateId: 11,
      result: failedResult,
    })
    expect(runTelegramLikePayload).toHaveBeenCalledWith(
      {
        chat: { id: "chat-1" },
        message_id: "message-1",
        text: "template=promo",
      },
      {
        intake: { defaultDestination: "telegram" },
        render: { timeoutMs: 10 },
      },
    )
    expect(onResult).toHaveBeenCalledWith(result)
  })

  it("skips updates without supported message payloads", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const worker = new NodeTelegramBotWorker({ workflow: service })

    const result = await worker.handleUpdate({ update_id: 12 })

    expect(result).toEqual({
      skipped: true,
      reason: "Telegram update does not contain a supported message",
      updateId: 12,
      update: { update_id: 12 },
    })
    expect(runTelegramLikePayload).not.toHaveBeenCalled()
  })

  it("fetches Telegram updates through Bot API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          result: [{ update_id: 20, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } }],
        }
      },
    }))
    const client = new NodeTelegramBotApiClient("token-1", { fetch: fetchMock })

    await expect(
      client.getUpdates({
        offset: 19,
        limit: 10,
        timeoutSeconds: 25,
        allowedUpdates: ["message"],
      }),
    ).resolves.toEqual([{ update_id: 20, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } }])
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottoken-1/getUpdates?offset=19&limit=10&timeout=25&allowed_updates=%5B%22message%22%5D",
    )
  })

  it("polls one update batch and returns the next offset", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const client = {
      getUpdates: vi.fn(async () => [
        { update_id: 30, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } },
        { update_id: 32 },
      ]),
    }
    const worker = new NodeTelegramBotWorker({ workflow: service, client })

    const result = await worker.pollOnce({ offset: 30, timeoutSeconds: 1 })

    expect(client.getUpdates).toHaveBeenCalledWith({ offset: 30, timeoutSeconds: 1 })
    expect(result.nextOffset).toBe(33)
    expect(result.updates).toHaveLength(2)
    expect(result.updates[0]).toMatchObject({ skipped: false, updateId: 30 })
    expect(result.updates[1]).toMatchObject({ skipped: true, updateId: 32 })
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
  })
})
