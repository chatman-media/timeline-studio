import { describe, expect, it, vi } from "vitest"
import type { BotWorkflowStatusMessage } from "@/core/types"
import { NodeBotStatusNotifier } from "../bot-status"

const message: BotWorkflowStatusMessage = {
  kind: "rendering",
  text: "Rendering video: 50%.",
  timestamp: "2026-06-08T00:00:00.000Z",
  chatId: "42",
  messageId: "7",
  jobId: "job-1",
  status: "rendering",
  progress: 50,
}

describe("NodeBotStatusNotifier", () => {
  it("sends status updates through an injected Telegram client", async () => {
    const client = {
      sendMessage: vi.fn().mockResolvedValue({ messageId: "status-message-1" }),
    }
    const notifier = new NodeBotStatusNotifier({
      telegram: {
        client,
      },
    })

    await notifier.sendStatus(message)

    expect(client.sendMessage).toHaveBeenCalledWith({
      chatId: "42",
      text: "Rendering video: 50%.",
      replyToMessageId: "7",
      metadata: message,
    })
  })

  it("sends status updates through Telegram Bot API fetch", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { ok: true, result: { message_id: 8 } }
      },
    }))
    const notifier = new NodeBotStatusNotifier({
      telegram: {
        botToken: "token-1",
      },
      fetch: fetchMock,
    })

    await notifier.sendStatus(message)

    expect(fetchMock).toHaveBeenCalledWith("https://api.telegram.org/bottoken-1/sendMessage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: "42",
        text: "Rendering video: 50%.",
        reply_to_message_id: 7,
      }),
    })
  })

  it("uses default chat id and skips delivery without a client or bot token", async () => {
    const fetchMock = vi.fn()
    const notifier = new NodeBotStatusNotifier({
      telegram: {
        defaultChatId: "fallback-chat",
      },
      fetch: fetchMock,
    })
    const { chatId: _chatId, ...messageWithoutChatId } = message

    await notifier.sendStatus(messageWithoutChatId)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("throws when Telegram Bot API rejects a status update", async () => {
    const notifier = new NodeBotStatusNotifier({
      telegram: {
        botToken: "token-1",
      },
      fetch: vi.fn(async () => ({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      })),
    })

    await expect(notifier.sendStatus(message)).rejects.toThrow("Telegram sendMessage failed: 429 Too Many Requests")
  })
})
