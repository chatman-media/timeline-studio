/**
 * Tests for Telegram bot worker command.
 */

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { botWorkerCommand, readTelegramBotUpdate, serializeBotWorkerResult } from "../bot-worker"

describe("bot-worker command", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-worker-command-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should have correct command shape", () => {
    expect(botWorkerCommand.name()).toBe("bot-worker")
    expect(botWorkerCommand.description()).toBe("Run a Telegram bot worker for bot-first workflows")
    expect(botWorkerCommand.options.some((option) => option.long === "--update-file")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--poll-once")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--poll")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--telegram-bot-token")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--no-status-updates")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--status-chat-id")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--offset-file")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--max-batches")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--idle-delay")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--rust-render")).toBe(true)
    expect(botWorkerCommand.options.some((option) => option.long === "--default-destination")).toBe(true)
  })

  it("reads Telegram update JSON", async () => {
    const updatePath = path.join(tempDir, "update.json")
    await fs.writeFile(
      updatePath,
      JSON.stringify({
        update_id: 100,
        message: {
          message_id: 7,
          chat: { id: "chat-1" },
          text: "template=promo",
        },
      }),
    )

    await expect(readTelegramBotUpdate(updatePath)).resolves.toEqual({
      update_id: 100,
      message: {
        message_id: 7,
        chat: { id: "chat-1" },
        text: "template=promo",
      },
    })
  })

  it("rejects invalid Telegram update JSON", async () => {
    const updatePath = path.join(tempDir, "update.json")
    await fs.writeFile(updatePath, JSON.stringify({ message: {} }))

    await expect(readTelegramBotUpdate(updatePath)).rejects.toThrow(
      "Telegram update JSON must include numeric update_id",
    )
  })

  it("serializes compact and pretty worker results", () => {
    const result = {
      skipped: true as const,
      reason: "Telegram update does not contain a supported message",
      updateId: 1,
      update: { update_id: 1 },
    }

    expect(serializeBotWorkerResult(result)).not.toContain("\n")
    expect(serializeBotWorkerResult(result, true)).toContain("\n")
  })
})
