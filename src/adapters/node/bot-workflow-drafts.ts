import fs from "node:fs/promises"
import path from "node:path"

import type { BotWorkflowDraft, BotWorkflowDraftStore } from "@/core/types"

export class NodeBotWorkflowFileDraftStore implements BotWorkflowDraftStore {
  constructor(private readonly directory: string) {}

  async readDraft(id: string): Promise<BotWorkflowDraft | undefined> {
    let content: string
    try {
      content = await fs.readFile(this.getDraftPath(id), "utf-8")
    } catch (error) {
      if (isNotFoundError(error)) return undefined
      throw error
    }

    const draft = JSON.parse(content) as BotWorkflowDraft
    if (!isBotWorkflowDraft(draft)) return undefined
    return draft
  }

  async writeDraft(draft: BotWorkflowDraft): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true })
    await fs.writeFile(this.getDraftPath(draft.id), `${JSON.stringify(draft, null, 2)}\n`)
  }

  async deleteDraft(id: string): Promise<void> {
    await fs.rm(this.getDraftPath(id), { force: true })
  }

  private getDraftPath(id: string): string {
    return path.join(this.directory, `${encodeDraftId(id)}.json`)
  }
}

function encodeDraftId(id: string): string {
  return Buffer.from(id, "utf-8").toString("base64url")
}

function isBotWorkflowDraft(value: unknown): value is BotWorkflowDraft {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "workflow" in value &&
    typeof value.workflow === "object" &&
    value.workflow !== null &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  )
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
