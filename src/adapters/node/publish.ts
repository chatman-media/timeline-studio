import fs from "node:fs/promises"
import path from "node:path"

import type { IPublishService } from "@/core/ports"
import type {
  BotPublishMetadata,
  BotPublishRequest,
  BotPublishResult,
  BotRenderJobArtifact,
  BotRenderJobDestination,
} from "@/core/types"

export interface NodeTelegramPublishPayload {
  path: string
  chatId: string
  caption?: string
  mimeType?: string
  metadata?: BotPublishMetadata
}

export interface NodeTelegramPublishResult {
  messageId?: string
  url?: string
  metadata?: Record<string, unknown>
}

export interface NodeTelegramPublishClient {
  sendVideo(payload: NodeTelegramPublishPayload): Promise<NodeTelegramPublishResult>
}

export interface NodePublishFetchResponse {
  ok: boolean
  status: number
  statusText?: string
  json?(): Promise<unknown>
}

export type NodePublishFetch = (
  url: string,
  init?: { method?: string; body?: BodyInit },
) => Promise<NodePublishFetchResponse>

export interface NodePublishOptions {
  telegram?: {
    defaultChatId?: string
    botToken?: string
    client?: NodeTelegramPublishClient
  }
  fetch?: NodePublishFetch
}

interface TelegramSendVideoResponse {
  ok?: boolean
  description?: string
  result?: {
    message_id?: number
  }
}

export class NodePublishService implements IPublishService {
  constructor(private readonly options: NodePublishOptions = {}) {}

  canPublish(destination: BotRenderJobDestination): boolean {
    if (destination === "file") return true
    if (destination === "telegram") return Boolean(this.options.telegram?.client || this.options.telegram?.botToken)
    return false
  }

  async publish(request: BotPublishRequest): Promise<BotPublishResult> {
    switch (request.destination) {
      case "file":
        return this.publishFile(request)
      case "telegram":
        return this.publishTelegram(request)
      default:
        return {
          destination: request.destination,
          status: "unsupported",
          error: `Publishing to ${request.destination} is not implemented yet`,
        }
    }
  }

  private async publishFile(request: BotPublishRequest): Promise<BotPublishResult> {
    if (!request.artifact.path) {
      return {
        destination: "file",
        status: "failed",
        error: "File publishing requires a local artifact path",
      }
    }

    try {
      await fs.access(request.artifact.path)
    } catch {
      return {
        destination: "file",
        status: "failed",
        error: `File artifact does not exist: ${request.artifact.path}`,
      }
    }

    return {
      destination: "file",
      status: "done",
      artifact: {
        ...request.artifact,
        destination: "file",
      },
      metadata: request.metadata,
    }
  }

  private async publishTelegram(request: BotPublishRequest): Promise<BotPublishResult> {
    const client = this.options.telegram?.client
    const botToken = this.options.telegram?.botToken
    if (!client && !botToken) {
      return {
        destination: "telegram",
        status: "failed",
        error: "Telegram publisher is not configured",
      }
    }

    if (!request.artifact.path) {
      return {
        destination: "telegram",
        status: "failed",
        error: "Telegram publishing requires a local file artifact",
      }
    }

    const chatId = request.metadata?.chatId ?? this.options.telegram?.defaultChatId
    if (!chatId) {
      return {
        destination: "telegram",
        status: "failed",
        error: "Telegram publishing requires chatId metadata or defaultChatId",
      }
    }

    let published: NodeTelegramPublishResult
    try {
      const payload = {
        path: request.artifact.path,
        chatId,
        caption: request.metadata?.caption ?? request.metadata?.title,
        mimeType: request.artifact.mimeType,
        metadata: request.metadata,
      }
      published = client ? await client.sendVideo(payload) : await this.sendTelegramVideo(botToken, payload)
    } catch (error) {
      return {
        destination: "telegram",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      }
    }

    const artifact = createPublishedArtifact("telegram", request.artifact, published.url)

    return {
      destination: "telegram",
      status: "done",
      artifact,
      providerId: published.messageId,
      url: published.url,
      metadata: {
        ...request.metadata,
        ...(published.metadata ? { provider: published.metadata } : {}),
      },
    }
  }

  private async sendTelegramVideo(
    botToken: string | undefined,
    payload: NodeTelegramPublishPayload,
  ): Promise<NodeTelegramPublishResult> {
    if (!botToken) {
      throw new Error("Telegram publisher is not configured")
    }

    const file = await fs.readFile(payload.path)
    const form = new FormData()
    form.set("chat_id", payload.chatId)
    if (payload.caption) form.set("caption", payload.caption)
    form.set("video", new Blob([file], { type: payload.mimeType ?? "video/mp4" }), path.basename(payload.path))

    const response = await (this.options.fetch ?? globalFetch)(`https://api.telegram.org/bot${botToken}/sendVideo`, {
      method: "POST",
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Telegram sendVideo failed: ${response.status} ${response.statusText ?? ""}`.trim())
    }

    const body = (await response.json?.()) as TelegramSendVideoResponse | undefined
    if (body && body.ok === false) {
      throw new Error(body.description ?? "Telegram sendVideo failed")
    }

    return {
      messageId: body?.result?.message_id === undefined ? undefined : String(body.result.message_id),
    }
  }
}

function createPublishedArtifact(
  destination: BotRenderJobDestination,
  artifact: BotRenderJobArtifact,
  url?: string,
): BotRenderJobArtifact {
  if (url) {
    return {
      type: "url",
      url,
      destination,
      mimeType: artifact.mimeType,
    }
  }

  return {
    ...artifact,
    destination,
  }
}

function globalFetch(url: string, init?: { method?: string; body?: BodyInit }): Promise<NodePublishFetchResponse> {
  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for Telegram publishing")
  }
  return fetch(url, init) as Promise<NodePublishFetchResponse>
}
