/**
 * Claude Provider для shared AI services
 * Полная реализация Claude API с поддержкой tools и streaming
 */

import { ApiKeyLoader } from "../../services/api-key-loader"
import type { AiMessage, AiRequestOptions, AiResponse, IAIProvider, StreamingOptions } from "../../types"

// Доступные модели Claude
export const CLAUDE_MODELS = {
  CLAUDE_4_SONNET_LATEST: "claude-4-sonnet-latest",
  CLAUDE_4_OPUS_LATEST: "claude-4-opus-latest",
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20241022",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  // Новые модели для будущих релизов
  CLAUDE_4_1: "claude-4.1",
} as const

// Интерфейс для инструмента Claude
export interface ClaudeTool {
  name: string
  description: string
  input_schema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

// Интерфейс для вызова инструмента
export interface ClaudeToolUse {
  name: string
  input: Record<string, any>
}

// Интерфейс для запроса к Claude API
interface ClaudeApiRequest {
  model: string
  messages: AiMessage[]
  system?: string
  temperature?: number
  max_tokens?: number
  tools?: ClaudeTool[]
  tool_choice?: "auto" | "any" | { name: string }
  stream?: boolean
}

// Интерфейс для ответа от Claude API
interface ClaudeApiResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
  tool_use?: {
    id: string
    name: string
    input: Record<string, any>
  }
}

// Интерфейс для потокового события
interface ClaudeStreamingEvent {
  type: string
  delta?: {
    text?: string
  }
}

export class ClaudeProvider implements IAIProvider {
  name = "claude" as const
  models = [
    CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST,
    CLAUDE_MODELS.CLAUDE_4_OPUS_LATEST,
    CLAUDE_MODELS.CLAUDE_3_5_SONNET,
    CLAUDE_MODELS.CLAUDE_3_HAIKU,
  ]

  private apiUrl = "https://api.anthropic.com/v1/messages"
  private apiVersion = "2023-06-01"
  private apiKeyLoader: ApiKeyLoader

  constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  async sendRequest(model: string, messages: AiMessage[], options: AiRequestOptions = {}): Promise<AiResponse> {
    const apiKey = await this.apiKeyLoader.getApiKey("claude")
    if (!apiKey) {
      throw new Error("Claude API key not found. Please configure API key in settings.")
    }

    try {
      const requestBody: ClaudeApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      }

      // Добавляем системный промпт, если есть
      if (options.systemPrompt) {
        requestBody.system = options.systemPrompt
      }

      // Добавляем инструменты, если есть
      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools as ClaudeTool[]
        requestBody.tool_choice = "auto"
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Claude API error: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as ClaudeApiResponse

      // Формируем ответ
      let content = ""
      if (data.content && data.content.length > 0) {
        content = data.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("\n")
      }

      // Если использовался инструмент, добавляем информацию о нем
      if (data.tool_use) {
        content += `\n\n[Tool Used: ${data.tool_use.name}]\nInput: ${JSON.stringify(data.tool_use.input, null, 2)}`
      }

      return {
        content,
        model,
        provider: this.name,
        finishReason: data.stop_reason,
        usage: data.usage
          ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            }
          : undefined,
      }
    } catch (error) {
      console.error("Claude request failed:", error)
      throw error
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: AiRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    const apiKey = await this.apiKeyLoader.getApiKey("claude")
    if (!apiKey) {
      const error = new Error("Claude API key not found. Please configure API key in settings.")
      if (options.onError) {
        options.onError(error)
        return
      }
      throw error
    }

    try {
      const requestBody: ClaudeApiRequest = {
        model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      }

      // Добавляем системный промпт, если есть
      if (options.systemPrompt) {
        requestBody.system = options.systemPrompt
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Claude API error: ${response.status} ${errorText}`)
        if (options.onError) {
          options.onError(error)
          return
        }
        throw error
      }

      const reader = response.body?.getReader()
      if (!reader) {
        const error = new Error("Failed to get response stream")
        if (options.onError) {
          options.onError(error)
          return
        }
        throw error
      }

      const decoder = new TextDecoder()
      let fullContent = ""
      let usage: AiResponse["usage"] | undefined

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()

              if (data === "[DONE]") {
                const finalResponse: AiResponse = {
                  content: fullContent,
                  model,
                  provider: this.name,
                  usage,
                }
                if (options.onComplete) {
                  options.onComplete(finalResponse)
                }
                return
              }

              try {
                const event: ClaudeStreamingEvent = JSON.parse(data)

                if (event.type === "content_block_delta" && event.delta?.text) {
                  const content = event.delta.text
                  fullContent += content
                  if (options.onContent) {
                    options.onContent(content)
                  }
                }
              } catch (parseError) {
                console.warn("Error parsing Claude streaming event:", parseError)
              }
            }
          }
        }

        // Финальный callback если не было [DONE]
        const finalResponse: AiResponse = {
          content: fullContent,
          model,
          provider: this.name,
          usage,
        }
        if (options.onComplete) {
          options.onComplete(finalResponse)
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error("Claude streaming request failed:", error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      } else {
        throw error
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const hasKey = await this.apiKeyLoader.hasApiKey("claude")
      return hasKey
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    const isAvailable = await this.isAvailable()
    if (!isAvailable) {
      return []
    }

    // Claude не предоставляет endpoint для списка моделей,
    // поэтому возвращаем статический список
    return this.models
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.sendRequest(CLAUDE_MODELS.CLAUDE_3_HAIKU, [{ role: "user", content: "test" }], {
        maxTokens: 1,
      })
      return !!testResponse.content
    } catch {
      return false
    }
  }

  estimateTokens(text: string): number {
    // Claude использует приблизительно 3.5-4 символа на токен
    return Math.ceil(text.length / 3.5)
  }

  getMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      [CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST]: 200000,
      [CLAUDE_MODELS.CLAUDE_4_OPUS_LATEST]: 200000,
      [CLAUDE_MODELS.CLAUDE_3_5_SONNET]: 200000,
      [CLAUDE_MODELS.CLAUDE_3_HAIKU]: 200000,
      [CLAUDE_MODELS.CLAUDE_4_1]: 200000,
    }
    return limits[model] || 200000
  }

  // Claude-специфичные методы

  async sendRequestWithTools(
    model: string,
    messages: AiMessage[],
    tools: ClaudeTool[],
    options: {
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
      tool_choice?: "auto" | "any" | { name: string }
    } = {},
  ): Promise<{ text: string; tool_use?: ClaudeToolUse; usage?: AiResponse["usage"] }> {
    const response = await this.sendRequest(model, messages, {
      ...options,
      tools,
    })

    // Парсим tool use из контента если есть
    const toolUseMatch = response.content.match(/\[Tool Used: (.*?)\]\nInput: (.*?)(?:\n|$)/s)
    let tool_use: ClaudeToolUse | undefined

    if (toolUseMatch) {
      try {
        tool_use = {
          name: toolUseMatch[1],
          input: JSON.parse(toolUseMatch[2]),
        }
      } catch {
        // Если не удалось распарсить tool use
      }
    }

    // Убираем информацию о tool use из текста
    const text = response.content.replace(/\n\n\[Tool Used:.*$/s, "")

    return {
      text,
      tool_use,
      usage: response.usage,
    }
  }

  supportsTools(): boolean {
    return true
  }

  supportsVision(): boolean {
    return true
  }

  supportsStreaming(): boolean {
    return true
  }

  getModelDisplayName(model: string): string {
    const names: Record<string, string> = {
      [CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST]: "Claude 4 Sonnet",
      [CLAUDE_MODELS.CLAUDE_4_OPUS_LATEST]: "Claude 4 Opus",
      [CLAUDE_MODELS.CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
      [CLAUDE_MODELS.CLAUDE_3_HAIKU]: "Claude 3 Haiku",
      [CLAUDE_MODELS.CLAUDE_4_1]: "Claude 4.1",
    }
    return names[model] || model
  }
}

// Фабричная функция
export function createClaudeProvider(): ClaudeProvider {
  return new ClaudeProvider()
}

// Экспорт для обратной совместимости со старым API
export const ClaudeService = ClaudeProvider
