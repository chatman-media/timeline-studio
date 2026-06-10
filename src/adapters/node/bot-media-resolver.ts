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
  headers?: {
    get(name: string): string | null
  }
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
  maxDownloadBytes?: number
  remoteUrlAllowedHosts?: string[]
  remoteUrlBlockedHosts?: string[]
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
  private readonly maxDownloadBytes?: number
  private readonly remoteUrlAllowedHosts: string[]
  private readonly remoteUrlBlockedHosts: string[]
  private readonly fetch: FetchLike
  private readonly idFactory: () => string

  constructor(options: NodeBotMediaResolverOptions = {}) {
    this.downloadDir = options.downloadDir ?? path.join(os.tmpdir(), "timeline-studio-bot-media")
    this.downloadRemoteUrls = options.downloadRemoteUrls ?? false
    this.botToken = options.telegram?.botToken
    this.telegramClient = options.telegram?.client
    this.maxDownloadBytes = positiveInteger(options.maxDownloadBytes)
    this.remoteUrlAllowedHosts = normalizeHostPatterns(options.remoteUrlAllowedHosts)
    this.remoteUrlBlockedHosts = normalizeHostPatterns(options.remoteUrlBlockedHosts)
    this.fetch = options.fetch ?? globalFetch
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID())
  }

  async resolve(media: BotRenderJobMediaInput, _context: BotMediaResolveContext): Promise<BotRenderJobMediaInput> {
    this.assertWithinSizeLimit(readKnownMediaSize(media), describeMedia(media))
    const telegramPath = await this.resolveTelegramPath(media)
    if (telegramPath?.path && this.botToken) {
      this.assertWithinSizeLimit(telegramPath.size, describeMedia(media))
      return this.downloadMedia(this.telegramFileUrl(telegramPath.path), media, telegramPath.path)
    }

    if ((media.type === "url" || isUrl(media.value)) && this.downloadRemoteUrls) {
      this.assertRemoteUrlAllowed(media.value)
      return this.downloadMedia(media.value, media)
    }

    return media
  }

  private async resolveTelegramPath(media: BotRenderJobMediaInput): Promise<{ path: string; size?: number } | null> {
    if (!this.botToken && !this.telegramClient) return null

    const metadata = media.metadata ?? {}
    const fileId =
      stringValue(metadata.telegramFileId) ?? stringValue(metadata.fileId) ?? inferTelegramFileId(media.value)

    if (this.botToken && isTelegramFilePath(media.value)) {
      const size = readKnownMediaSize(media)
      return {
        path: media.value,
        ...(size !== undefined ? { size } : {}),
      }
    }

    if (!fileId) return null

    if (this.telegramClient) {
      const file = await this.telegramClient.getFile(fileId)
      const size = positiveInteger(file.file_size)
      return file.file_path
        ? {
            path: file.file_path,
            ...(size !== undefined ? { size } : {}),
          }
        : null
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

    const size = positiveInteger(body.result.file_size)
    return {
      path: body.result.file_path,
      ...(size !== undefined ? { size } : {}),
    }
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

    this.assertWithinSizeLimit(readContentLength(response), media.value)
    await fs.mkdir(this.downloadDir, { recursive: true })
    const buffer = Buffer.from(await response.arrayBuffer())
    this.assertWithinSizeLimit(buffer.byteLength, media.value)
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

  private assertRemoteUrlAllowed(value: string): void {
    let host: string
    try {
      host = new URL(value).hostname.toLowerCase()
    } catch {
      throw new Error(`Remote media URL is invalid: ${value}`)
    }

    if (this.remoteUrlBlockedHosts.some((pattern) => matchesHostPattern(host, pattern))) {
      throw new Error(`Remote media host is blocked: ${host}`)
    }

    if (
      this.remoteUrlAllowedHosts.length > 0 &&
      !this.remoteUrlAllowedHosts.some((pattern) => matchesHostPattern(host, pattern))
    ) {
      throw new Error(`Remote media host is not allowed: ${host}`)
    }
  }

  private assertWithinSizeLimit(size: number | undefined, label: string): void {
    if (size === undefined || this.maxDownloadBytes === undefined) return
    if (size <= this.maxDownloadBytes) return

    throw new Error(
      `Bot media is too large: ${formatBytes(size)} exceeds configured limit ${formatBytes(this.maxDownloadBytes)} (${label})`,
    )
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

function readKnownMediaSize(media: BotRenderJobMediaInput): number | undefined {
  const metadata = media.metadata ?? {}
  return (
    positiveInteger(metadata.telegramFileSize) ??
    positiveInteger(metadata.fileSize) ??
    positiveInteger(metadata.size) ??
    positiveInteger(metadata.contentLength)
  )
}

function readContentLength(response: FetchResponseLike): number | undefined {
  return positiveInteger(response.headers?.get("content-length") ?? response.headers?.get("Content-Length"))
}

function positiveInteger(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined
}

function normalizeHostPatterns(value: string[] | undefined): string[] {
  return (value ?? []).map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0)
}

function matchesHostPattern(host: string, pattern: string): boolean {
  if (pattern === "*") return true
  if (host === pattern) return true

  const suffix = pattern.startsWith("*.") ? pattern.slice(1) : pattern.startsWith(".") ? pattern : undefined
  return suffix ? host.endsWith(suffix) : false
}

function describeMedia(media: BotRenderJobMediaInput): string {
  return media.name ?? media.value
}

function formatBytes(value: number): string {
  return `${value} bytes`
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
