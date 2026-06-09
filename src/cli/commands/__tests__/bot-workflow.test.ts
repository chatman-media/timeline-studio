/**
 * Tests for bot-first workflow command.
 */

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { BotWorkflowRunResult } from "@/core/types"
import { botWorkflowCommand, readTelegramLikeBotPayload, serializeBotWorkflowRunResult } from "../bot-workflow"

describe("bot-workflow command", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-workflow-command-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should have correct command shape", () => {
    expect(botWorkflowCommand.name()).toBe("bot-workflow")
    expect(botWorkflowCommand.description()).toBe("Run a bot-first workflow from Telegram-like JSON")
    expect(botWorkflowCommand.registeredArguments[0].name()).toBe("payload")
    expect(botWorkflowCommand.options.some((option) => option.long === "--status-file")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--pretty")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--telegram-bot-token")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--send-status-updates")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--status-chat-id")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--status-min-interval")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--status-min-progress-delta")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--media-dir")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--download-remote-media")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--rust-render")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--default-destination")).toBe(true)
    expect(botWorkflowCommand.options.some((option) => option.long === "--default-output")).toBe(true)
  })

  it("reads Telegram-like bot payload JSON", async () => {
    const payloadPath = path.join(tempDir, "payload.json")
    await fs.writeFile(
      payloadPath,
      JSON.stringify({
        chat: { id: 42 },
        caption: "template=promo destination=telegram",
        video: { file_id: "telegram-file-1", file_name: "clip.mp4" },
      }),
    )

    const payload = await readTelegramLikeBotPayload(payloadPath)

    expect(payload).toMatchObject({
      chat: { id: 42 },
      caption: "template=promo destination=telegram",
      video: { file_id: "telegram-file-1", file_name: "clip.mp4" },
    })
  })

  it("rejects non-object payload JSON", async () => {
    const payloadPath = path.join(tempDir, "payload.json")
    await fs.writeFile(payloadPath, JSON.stringify([]))

    await expect(readTelegramLikeBotPayload(payloadPath)).rejects.toThrow("Bot workflow payload JSON must be an object")
  })

  it("serializes compact and pretty workflow results", () => {
    const result: BotWorkflowRunResult = {
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

    expect(serializeBotWorkflowRunResult(result)).not.toContain("\n")
    expect(serializeBotWorkflowRunResult(result, true)).toContain("\n")
  })
})
