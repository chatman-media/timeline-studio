import fs from "node:fs/promises"
import path from "node:path"

import {
  type BotEditSession,
  type BotEditSessionQuery,
  type BotEditSessionStore,
  compareBotEditSessionsByUpdatedAtDesc,
  matchesBotEditSessionQuery,
} from "@timeline-studio/core"

export interface NodeBotEditSessionFileStoreOptions {
  directory: string
}

export class NodeBotEditSessionFileStore implements BotEditSessionStore {
  private readonly directory: string

  constructor(options: string | NodeBotEditSessionFileStoreOptions) {
    this.directory = typeof options === "string" ? options : options.directory
  }

  async readSession(id: string): Promise<BotEditSession | undefined> {
    let content: string
    try {
      content = await fs.readFile(this.getSessionPath(id), "utf-8")
    } catch (error) {
      if (isNotFoundError(error)) return undefined
      throw error
    }

    const session = JSON.parse(content) as BotEditSession
    if (!isBotEditSession(session)) return undefined
    return session
  }

  async writeSession(session: BotEditSession): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true })
    await fs.writeFile(this.getSessionPath(session.id), `${JSON.stringify(session, null, 2)}\n`)
  }

  async deleteSession(id: string): Promise<void> {
    await fs.rm(this.getSessionPath(id), { force: true })
  }

  async listSessions(query: BotEditSessionQuery = {}): Promise<BotEditSession[]> {
    let entries: string[]
    try {
      entries = await fs.readdir(this.directory)
    } catch (error) {
      if (isNotFoundError(error)) return []
      throw error
    }

    const sessions: BotEditSession[] = []
    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue
      const session = await this.readSession(decodeSessionFileName(entry))
      if (session && matchesBotEditSessionQuery(session, query)) {
        sessions.push(session)
      }
    }

    const sorted = sessions.sort(compareBotEditSessionsByUpdatedAtDesc)
    return query.limit === undefined ? sorted : sorted.slice(0, Math.max(0, query.limit))
  }

  async readCurrentSession(query: BotEditSessionQuery): Promise<BotEditSession | undefined> {
    const [session] = await this.listSessions({
      ...query,
      activeOnly: query.activeOnly ?? true,
      limit: 1,
    })
    return session
  }

  private getSessionPath(id: string): string {
    return path.join(this.directory, `${encodeSessionId(id)}.json`)
  }
}

function encodeSessionId(id: string): string {
  return Buffer.from(id, "utf-8").toString("base64url")
}

function decodeSessionFileName(fileName: string): string {
  return Buffer.from(fileName.replace(/\.json$/, ""), "base64url").toString("utf-8")
}

function isBotEditSession(value: unknown): value is BotEditSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "source" in value &&
    typeof value.source === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    "media" in value &&
    Array.isArray(value.media) &&
    "revisionCounter" in value &&
    typeof value.revisionCounter === "number" &&
    "revisions" in value &&
    Array.isArray(value.revisions) &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  )
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
