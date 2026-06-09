import fs from "node:fs/promises"
import path from "node:path"

import type { BotWorkflowStatusMessage, BotWorkflowStatusSink } from "@/core/types"

export interface NodeTelegramStatusPayload {
  chatId: string
  text: string
  replyToMessageId?: string
  metadata?: unknown
}

export interface NodeTelegramStatusResult {
  messageId?: string
  metadata?: Record<string, unknown>
}

export interface NodeTelegramStatusClient {
  sendMessage(payload: NodeTelegramStatusPayload): Promise<NodeTelegramStatusResult>
}

export interface NodeTelegramVideoPayload {
  chatId: string
  path: string
  caption?: string
  mimeType?: string
  metadata?: unknown
}

export interface NodeTelegramVideoClient {
  sendVideo(payload: NodeTelegramVideoPayload): Promise<NodeTelegramStatusResult>
}

export interface NodeStatusFetchResponse {
  ok: boolean
  status: number
  statusText?: string
  json?(): Promise<unknown>
}

export type NodeStatusFetch = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: BodyInit },
) => Promise<NodeStatusFetchResponse>

export interface NodeBotStatusNotifierOptions {
  telegram?: {
    botToken?: string
    defaultChatId?: string
    client?: NodeTelegramStatusClient
  }
  fetch?: NodeStatusFetch
}

interface TelegramSendMessageResponse {
  ok?: boolean
  description?: string
  result?: {
    message_id?: number
  }
}

interface TelegramSendVideoResponse {
  ok?: boolean
  description?: string
  result?: {
    message_id?: number
  }
}

export class NodeBotStatusNotifier implements BotWorkflowStatusSink {
  private readonly botToken?: string
  private readonly defaultChatId?: string
  private readonly client?: NodeTelegramStatusClient
  private readonly fetch: NodeStatusFetch

  constructor(options: NodeBotStatusNotifierOptions = {}) {
    this.botToken = options.telegram?.botToken
    this.defaultChatId = options.telegram?.defaultChatId
    this.client = options.telegram?.client
    this.fetch = options.fetch ?? globalFetch
  }

  async sendStatus(message: BotWorkflowStatusMessage): Promise<void> {
    const chatId = message.chatId ?? this.defaultChatId
    if (!chatId) return

    await this.sendMessage({
      chatId,
      text: message.text,
      ...(message.messageId ? { replyToMessageId: message.messageId } : {}),
      metadata: message,
    })
  }

  async sendMessage(payload: NodeTelegramStatusPayload): Promise<NodeTelegramStatusResult> {
    const chatId = payload.chatId ?? this.defaultChatId
    if (!chatId) return {}

    if (this.client) {
      return this.client.sendMessage({ ...payload, chatId })
    }

    if (!this.botToken) return {}

    const response = await this.fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: payload.text,
        ...(payload.replyToMessageId
          ? { reply_to_message_id: Number(payload.replyToMessageId) || payload.replyToMessageId }
          : {}),
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram sendMessage failed: ${response.status} ${response.statusText ?? ""}`.trim())
    }

    const body = (await response.json?.()) as TelegramSendMessageResponse | undefined
    if (body && body.ok === false) {
      throw new Error(body.description ?? "Telegram sendMessage failed")
    }

    return body?.result?.message_id === undefined ? {} : { messageId: String(body.result.message_id) }
  }

  async sendVideo(payload: NodeTelegramVideoPayload): Promise<NodeTelegramStatusResult> {
    const chatId = payload.chatId ?? this.defaultChatId
    if (!chatId) return {}

    if (!this.botToken) return {}

    const file = await fs.readFile(payload.path)
    const form = new FormData()
    form.set("chat_id", chatId)
    if (payload.caption) form.set("caption", payload.caption)
    form.set("supports_streaming", "true")
    form.set("video", new Blob([file], { type: payload.mimeType ?? "video/mp4" }), path.basename(payload.path))

    const response = await this.fetch(`https://api.telegram.org/bot${this.botToken}/sendVideo`, {
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

    return body?.result?.message_id === undefined ? {} : { messageId: String(body.result.message_id) }
  }
}

function globalFetch(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: BodyInit },
): Promise<NodeStatusFetchResponse> {
  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for bot status updates")
  }
  return fetch(url, init) as Promise<NodeStatusFetchResponse>
}
