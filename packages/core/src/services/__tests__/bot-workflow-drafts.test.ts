import { describe, expect, it } from "vitest"
import { createBotWorkflowDraftId, mergeBotWorkflowDraft } from "../bot-workflow-drafts"

describe("bot workflow drafts", () => {
  it("builds deterministic draft ids from source, chat, and user", () => {
    expect(createBotWorkflowDraftId({ source: "telegram", chatId: "chat-1", userId: "user-1" })).toBe(
      "telegram:chat-1:user-1",
    )
    expect(createBotWorkflowDraftId({ source: "telegram" })).toBe("telegram:no-chat:no-user")
  })

  it("merges multi-message workflow input into a renderable draft", () => {
    const first = mergeBotWorkflowDraft(
      undefined,
      {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        messageId: "message-1",
        media: [{ type: "file", value: "telegram-file-1", name: "clip.mp4" }],
      },
      { now: () => "2026-06-08T08:00:00.000Z" },
    )

    const second = mergeBotWorkflowDraft(
      first,
      {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        messageId: "message-2",
        text: "template=promo destination=telegram tone=fast",
        output: { resolution: "1080p" },
      },
      { now: () => "2026-06-08T08:01:00.000Z" },
    )

    expect(second).toEqual({
      id: "telegram:chat-1:user-1",
      updatedAt: "2026-06-08T08:01:00.000Z",
      workflow: {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        messageId: "message-2",
        text: "template=promo destination=telegram tone=fast",
        media: [{ type: "file", value: "telegram-file-1", name: "clip.mp4" }],
        output: { resolution: "1080p" },
      },
    })
  })

  it("keeps text hints in message order so later hints can override earlier ones", () => {
    const first = mergeBotWorkflowDraft(undefined, {
      source: "telegram",
      chatId: "chat-1",
      text: "destination=file",
    })

    const second = mergeBotWorkflowDraft(first, {
      source: "telegram",
      chatId: "chat-1",
      text: "destination=telegram",
    })

    expect(second.workflow.text).toBe("destination=file destination=telegram")
  })
})
