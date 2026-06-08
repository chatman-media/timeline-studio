import fs from "node:fs/promises"

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

export interface NodePublishOptions {
  telegram?: {
    defaultChatId?: string
    client?: NodeTelegramPublishClient
  }
}

export class NodePublishService implements IPublishService {
  constructor(private readonly options: NodePublishOptions = {}) {}

  canPublish(destination: BotRenderJobDestination): boolean {
    if (destination === "file") return true
    if (destination === "telegram") return Boolean(this.options.telegram?.client)
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
    if (!client) {
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
      published = await client.sendVideo({
        path: request.artifact.path,
        chatId,
        caption: request.metadata?.caption ?? request.metadata?.title,
        mimeType: request.artifact.mimeType,
        metadata: request.metadata,
      })
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
