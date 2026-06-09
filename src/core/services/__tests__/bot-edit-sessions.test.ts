import { describe, expect, it } from "vitest"
import {
  createBotEditRevisionId,
  createBotEditSessionFromWorkflow,
  createBotEditSessionId,
  isBotEditSessionActive,
  mergeBotEditSessionWorkflow,
} from "../bot-edit-sessions"

describe("bot edit sessions", () => {
  it("creates a stable edit session from a Telegram workflow", () => {
    const workflow = {
      source: "telegram" as const,
      chatId: "chat-1",
      userId: "user-1",
      text: "make a short promo",
      media: [
        {
          type: "file" as const,
          value: "telegram-file-1",
          name: "clip.mp4",
          mimeType: "video/mp4",
          metadata: {
            telegramFileId: "telegram-file-1",
          },
        },
      ],
      output: {
        destination: "youtube" as const,
      },
    }

    const session = createBotEditSessionFromWorkflow(workflow, {
      now: () => "2026-06-09T01:00:00.000Z",
      previewDestination: "telegram",
    })

    expect(createBotEditSessionId(workflow)).toBe("edit:telegram:chat-1:user-1")
    expect(session).toEqual({
      id: "edit:telegram:chat-1:user-1",
      source: "telegram",
      status: "collecting",
      chatId: "chat-1",
      userId: "user-1",
      goal: "make a short promo",
      media: [
        {
          type: "file",
          value: "telegram-file-1",
          name: "clip.mp4",
          mimeType: "video/mp4",
          metadata: {
            telegramFileId: "telegram-file-1",
          },
        },
      ],
      previewDestination: "telegram",
      publishTarget: "youtube",
      revisionCounter: 0,
      revisions: [],
      createdAt: "2026-06-09T01:00:00.000Z",
      updatedAt: "2026-06-09T01:00:00.000Z",
    })
  })

  it("merges new media and appends traceable revisions", () => {
    const base = createBotEditSessionFromWorkflow(
      {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        text: "make a short promo",
      },
      {
        now: () => "2026-06-09T01:00:00.000Z",
      },
    )

    const merged = mergeBotEditSessionWorkflow(
      base,
      {
        source: "telegram",
        chatId: "chat-1",
        userId: "user-1",
        messageId: "message-2",
        text: "add captions",
        media: [{ type: "url", value: "https://cdn.example.com/clip.mp4", name: "clip.mp4" }],
      },
      {
        now: () => "2026-06-09T01:01:00.000Z",
        status: "preview_ready",
        currentProjectSchema: { tracks: [] },
        currentArtifact: {
          type: "file",
          path: "/tmp/preview.mp4",
          destination: "telegram",
          mimeType: "video/mp4",
        },
        revision: {
          projectSchema: { tracks: [] },
          artifact: {
            type: "file",
            path: "/tmp/preview.mp4",
            destination: "telegram",
          },
          instruction: "add captions",
          summary: "Added captions",
          sourceMessageId: "message-2",
        },
      },
    )

    expect(merged).toMatchObject({
      id: "edit:telegram:chat-1:user-1",
      status: "preview_ready",
      goal: "make a short promo add captions",
      media: [{ type: "url", value: "https://cdn.example.com/clip.mp4", name: "clip.mp4" }],
      currentProjectSchema: { tracks: [] },
      revisionCounter: 1,
      updatedAt: "2026-06-09T01:01:00.000Z",
    })
    expect(merged.revisions).toEqual([
      {
        id: createBotEditRevisionId(merged.id, 0),
        index: 0,
        projectSchema: { tracks: [] },
        artifact: {
          type: "file",
          path: "/tmp/preview.mp4",
          destination: "telegram",
        },
        instruction: "add captions",
        summary: "Added captions",
        sourceMessageId: "message-2",
        createdAt: "2026-06-09T01:01:00.000Z",
        updatedAt: "2026-06-09T01:01:00.000Z",
      },
    ])
  })

  it("classifies active edit session statuses", () => {
    expect(isBotEditSessionActive("collecting")).toBe(true)
    expect(isBotEditSessionActive("publishing")).toBe(true)
    expect(isBotEditSessionActive("done")).toBe(false)
    expect(isBotEditSessionActive("cancelled")).toBe(false)
    expect(isBotEditSessionActive("failed")).toBe(false)
  })
})
