import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { BotEditSession } from "@timeline-studio/core"
import { NodeBotEditSessionFileStore } from "../bot-edit-sessions"

describe("NodeBotEditSessionFileStore", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-edit-sessions-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("persists, lists, finds current, and deletes bot edit sessions", async () => {
    const store = new NodeBotEditSessionFileStore({ directory: tempDir })
    const olderActive = createSession({
      id: "edit:telegram:chat-1:user-1",
      status: "preview_ready",
      updatedAt: "2026-06-09T01:00:00.000Z",
    })
    const newerActive = createSession({
      id: "edit:telegram:chat-1:user-2",
      userId: "user-2",
      status: "editing",
      updatedAt: "2026-06-09T01:02:00.000Z",
    })
    const completed = createSession({
      id: "edit:telegram:chat-1:user-3",
      userId: "user-3",
      status: "done",
      updatedAt: "2026-06-09T01:03:00.000Z",
    })

    await expect(store.readSession(olderActive.id)).resolves.toBeUndefined()
    await store.writeSession(olderActive)
    await store.writeSession(newerActive)
    await store.writeSession(completed)

    await expect(store.readSession(olderActive.id)).resolves.toEqual(olderActive)
    await expect(store.listSessions({ chatId: "chat-1", activeOnly: true })).resolves.toEqual([
      newerActive,
      olderActive,
    ])
    await expect(store.readCurrentSession({ chatId: "chat-1" })).resolves.toEqual(newerActive)
    await expect(store.listSessions({ chatId: "chat-1", status: "done" })).resolves.toEqual([completed])
    await expect(store.listSessions({ chatId: "chat-1", limit: 1 })).resolves.toEqual([completed])

    await store.deleteSession(newerActive.id)
    await expect(store.readSession(newerActive.id)).resolves.toBeUndefined()
    await expect(store.readCurrentSession({ chatId: "chat-1" })).resolves.toEqual(olderActive)
  })
})

function createSession(overrides: Partial<BotEditSession>): BotEditSession {
  return {
    id: "edit:telegram:chat-1:user-1",
    source: "telegram",
    status: "collecting",
    chatId: "chat-1",
    userId: "user-1",
    media: [],
    revisionCounter: 0,
    revisions: [],
    createdAt: "2026-06-09T01:00:00.000Z",
    updatedAt: "2026-06-09T01:00:00.000Z",
    ...overrides,
  }
}
