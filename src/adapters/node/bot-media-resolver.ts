import crypto from "node:crypto"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import type { BotMediaResolveContext, BotMediaResolver, BotRenderJobMediaInput } from "@/core/types"

export interface TelegramFileInfo {
  file_id?: string
  file_unique_id?: string
  file_size?: number
  file_path?: string
}

export interface TelegramFileClient {
  getFile(fileId: string): Promise<TelegramFileInfo>
}

export interface FetchResponseLike {
  ok: boolean
  status: number
  statusText?: string
  arrayBuffer(): Promise<ArrayBuffer>
  json?(): Promise<unknown>
}

export type FetchLike = (url: string) => Promise<FetchResponseLike>

export interface NodeBotMediaResolverOptions {
  downloadDir?: string
  downloadRemoteUrls?: boolean
  telegram?: {
    botToken?: string
    client?: TelegramFileClient
  }
  fetch?: FetchLike
  idFactory?: () => string
}

interface TelegramGetFileResponse {
  ok?: boolean
  result?: TelegramFileInfo
  description?: string
}

export class NodeBotMediaResolver implements BotMediaResolver {
  private readonly downloadDir: string
  private readonly downloadRemoteUrls: boolean
  private readonly botToken?: string
  private readonly telegramClient?: TelegramFileClient
  private readonly fetch: FetchLike
  private readonly idFactory: () => string

  constructor(options: NodeBotMediaResolverOptions = {}) {
    this.downloadDir = options.downloadDir ?? path.join(os.tmpdir(), "timeline-studio-bot-media")
    this.downloadRemoteUrls = options.downloadRemoteUrls ?? false
    this.botToken = options.telegram?.botToken
    this.telegramClient = options.telegram?.client
    this.fetch = options.fetch ?? globalFetch
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID())
  }

  async resolve(media: BotRenderJobMediaInput, _context: BotMediaResolveContext): Promise<BotRenderJobMediaInput> {
    const telegramPath = await this.resolveTelegramPath(media)
    if (telegramPath && this.botToken) {
      return this.downloadMedia(this.telegramFileUrl(telegramPath), media, telegramPath)
    }

    if ((media.type === "url" || isUrl(media.value)) && this.downloadRemoteUrls) {
      return this.downloadMedia(media.value, media)
    }

    return media
  }

  private async resolveTelegramPath(media: BotRenderJobMediaInput): Promise<string | null> {
    if (!this.botToken && !this.telegramClient) return null

    const metadata = media.metadata ?? {}
    const fileId =
      stringValue(metadata.telegramFileId) ?? stringValue(metadata.fileId) ?? inferTelegramFileId(media.value)

    if (this.botToken && isTelegramFilePath(media.value)) {
      return media.value
    }

    if (!fileId) return null

    if (this.telegramClient) {
      const file = await this.telegramClient.getFile(fileId)
      return file.file_path ?? null
    }

    if (!this.botToken) return null

    const response = await this.fetch(
      `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
    )
    if (!response.ok) {
      throw new Error(`Telegram getFile failed: ${response.status} ${response.statusText ?? ""}`.trim())
    }

    const body = (await response.json?.()) as TelegramGetFileResponse | undefined
    if (!body?.ok || !body.result?.file_path) {
      throw new Error(body?.description ?? "Telegram getFile response did not include file_path")
    }

    return body.result.file_path
  }

  private telegramFileUrl(filePath: string): string {
    return `https://api.telegram.org/file/bot${this.botToken}/${filePath.replace(/^\/+/, "")}`
  }

  private async downloadMedia(
    url: string,
    media: BotRenderJobMediaInput,
    sourcePathHint?: string,
  ): Promise<BotRenderJobMediaInput> {
    const response = await this.fetch(url)
    if (!response.ok) {
      throw new Error(`Bot media download failed: ${response.status} ${response.statusText ?? ""}`.trim())
    }

    await fs.mkdir(this.downloadDir, { recursive: true })
    const buffer = Buffer.from(await response.arrayBuffer())
    const filePath = path.join(this.downloadDir, `${this.idFactory()}-${safeFileName(media, url, sourcePathHint)}`)
    await fs.writeFile(filePath, buffer)

    return {
      ...media,
      type: "file",
      value: filePath,
      metadata: {
        ...media.metadata,
        resolvedFrom: media.value,
        resolvedUrl: url,
        resolvedPath: filePath,
        ...(sourcePathHint ? { telegramFilePath: sourcePathHint } : {}),
      },
    }
  }
}

function globalFetch(url: string): Promise<FetchResponseLike> {
  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for bot media downloads")
  }
  return fetch(url) as Promise<FetchResponseLike>
}

function safeFileName(media: BotRenderJobMediaInput, url: string, sourcePathHint?: string): string {
  const source = media.name ?? baseName(sourcePathHint) ?? baseName(new URL(url).pathname) ?? "media.bin"
  const cleaned = source
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")

  return cleaned || "media.bin"
}

function baseName(value: string | undefined): string | undefined {
  if (!value) return undefined
  const name = path.basename(value)
  return name && name !== "." && name !== "/" ? name : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function inferTelegramFileId(value: string): string | undefined {
  if (isUrl(value) || isLocalPath(value) || isTelegramFilePath(value)) return undefined
  return value.trim().length > 0 ? value.trim() : undefined
}

function isTelegramFilePath(value: string): boolean {
  return /^[A-Za-z0-9_-]+\/.+/.test(value)
}

function isLocalPath(value: string): boolean {
  return path.isAbsolute(value) || value.startsWith("./") || value.startsWith("../")
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://")
}
