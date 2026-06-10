import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { NodeBotWorkflowFileDraftStore } from "../bot-workflow-drafts"

describe("NodeBotWorkflowFileDraftStore", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-workflow-drafts-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("persists and deletes bot workflow drafts", async () => {
    const store = new NodeBotWorkflowFileDraftStore(tempDir)
    const draft = {
      id: "telegram:chat-1:user-1",
      updatedAt: "2026-06-08T08:00:00.000Z",
      workflow: {
        source: "telegram" as const,
        chatId: "chat-1",
        userId: "user-1",
        media: [{ type: "file" as const, value: "telegram-file-1" }],
      },
    }

    await expect(store.readDraft(draft.id)).resolves.toBeUndefined()
    await store.writeDraft(draft)

    await expect(store.readDraft(draft.id)).resolves.toEqual(draft)
    await store.deleteDraft(draft.id)
    await expect(store.readDraft(draft.id)).resolves.toBeUndefined()
  })
})
