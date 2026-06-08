import type { BotWorkflowStatusMessage, BotWorkflowStatusSink } from "@/core/types"

export interface NodeTelegramStatusPayload {
  chatId: string
  text: string
  replyToMessageId?: string
  metadata?: BotWorkflowStatusMessage
}

export interface NodeTelegramStatusResult {
  messageId?: string
  metadata?: Record<string, unknown>
}

export interface NodeTelegramStatusClient {
  sendMessage(payload: NodeTelegramStatusPayload): Promise<NodeTelegramStatusResult>
}

export interface NodeStatusFetchResponse {
  ok: boolean
  status: number
  statusText?: string
  json?(): Promise<unknown>
}

export type NodeStatusFetch = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
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

    if (this.client) {
      await this.client.sendMessage({
        chatId,
        text: message.text,
        ...(message.messageId ? { replyToMessageId: message.messageId } : {}),
        metadata: message,
      })
      return
    }

    if (!this.botToken) return

    const response = await this.fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text,
        ...(message.messageId ? { reply_to_message_id: Number(message.messageId) || message.messageId } : {}),
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram sendMessage failed: ${response.status} ${response.statusText ?? ""}`.trim())
    }

    const body = (await response.json?.()) as TelegramSendMessageResponse | undefined
    if (body && body.ok === false) {
      throw new Error(body.description ?? "Telegram sendMessage failed")
    }
  }
}

function globalFetch(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<NodeStatusFetchResponse> {
  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available for bot status updates")
  }
  return fetch(url, init) as Promise<NodeStatusFetchResponse>
}
