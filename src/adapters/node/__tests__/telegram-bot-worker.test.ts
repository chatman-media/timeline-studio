import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BotWorkflowRunResult } from "@/core/types"
import type { NodeBotWorkflowService } from "../bot-workflow"
import {
  createTelegramLikePayloadFromUpdate,
  NodeTelegramBotApiClient,
  NodeTelegramBotFileOffsetStore,
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
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-bot-worker-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

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

  it("persists Telegram polling offsets in a file store", async () => {
    const store = new NodeTelegramBotFileOffsetStore(path.join(tempDir, "state", "offset.json"))

    await expect(store.readOffset()).resolves.toBeUndefined()
    await store.writeOffset(42)

    await expect(store.readOffset()).resolves.toBe(42)
    await expect(fs.readFile(path.join(tempDir, "state", "offset.json"), "utf-8")).resolves.toContain('"offset":42')
  })

  it("runs bounded polling batches from stored offset and writes the next offset", async () => {
    const { service, runTelegramLikePayload } = createWorkflowService()
    const offsetStore = {
      readOffset: vi.fn(async () => 40),
      writeOffset: vi.fn(async () => undefined),
    }
    const client = {
      getUpdates: vi.fn(async (options) =>
        options?.offset === 40
          ? [{ update_id: 40, message: { message_id: 1, chat: { id: "chat-1" }, text: "template=promo" } }]
          : [],
      ),
    }
    const sleep = vi.fn(async () => undefined)
    const onBatch = vi.fn()
    const worker = new NodeTelegramBotWorker({ workflow: service, client })

    const result = await worker.runPolling({
      offsetStore,
      maxBatches: 3,
      timeoutSeconds: 1,
      idleDelayMs: 5,
      sleep,
      onBatch,
    })

    expect(offsetStore.readOffset).toHaveBeenCalledOnce()
    expect(client.getUpdates).toHaveBeenNthCalledWith(1, { offset: 40, timeoutSeconds: 1 })
    expect(client.getUpdates).toHaveBeenNthCalledWith(2, { offset: 41, timeoutSeconds: 1 })
    expect(client.getUpdates).toHaveBeenNthCalledWith(3, { offset: 41, timeoutSeconds: 1 })
    expect(offsetStore.writeOffset).toHaveBeenCalledWith(41)
    expect(offsetStore.writeOffset).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(5)
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledTimes(3)
    expect(runTelegramLikePayload).toHaveBeenCalledOnce()
    expect(result).toMatchObject({
      nextOffset: 41,
      stoppedReason: "max_batches",
      batches: [{ nextOffset: 41 }, { nextOffset: 41 }, { nextOffset: 41 }],
    })
  })
})
