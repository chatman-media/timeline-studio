/**
 * DeepSeek Provider для shared AI services
 * Полная реализация DeepSeek API с поддержкой reasoning моделей
 */

import { ApiKeyLoader } from "../../services/api-key-loader"
import type { AiMessage, AiRequestOptions, AiResponse, IAIProvider, StreamingOptions } from "../../types"

// Доступные модели DeepSeek
export const DEEPSEEK_MODELS = {
  DEEPSEEK_R1: "deepseek-r1",
  DEEPSEEK_CHAT: "deepseek-chat",
  DEEPSEEK_CODER: "deepseek-coder",
  DEEPSEEK_REASONER: "deepseek-reasoner",
  DEEPSEEK_V3: "deepseek-v3",
} as const

// Интерфейс для запроса к DeepSeek API
interface DeepSeekApiRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  stop?: string | string[]
  user?: string
}

// Интерфейс для ответа от DeepSeek API
interface DeepSeekApiResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: "stop" | "length" | "content_filter" | null
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    reasoning_tokens?: number // Специально для reasoning моделей
  }
}

// Интерфейс для потоковых событий DeepSeek
interface DeepSeekStreamingEvent {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
      reasoning_content?: string // Для reasoning моделей
    }
    finish_reason: string | null
  }>
}

// Расширяем интерфейс AiResponse для reasoning контента
interface DeepSeekAiResponse extends AiResponse {
  reasoning?: string
  reasoningTokens?: number
}

export class DeepSeekProvider implements IAIProvider {
  name = "deepseek" as const
  models = [
    DEEPSEEK_MODELS.DEEPSEEK_R1,
    DEEPSEEK_MODELS.DEEPSEEK_CHAT,
    DEEPSEEK_MODELS.DEEPSEEK_CODER,
    DEEPSEEK_MODELS.DEEPSEEK_REASONER,
    DEEPSEEK_MODELS.DEEPSEEK_V3,
  ]

  private apiUrl = "https://api.deepseek.com/v1/chat/completions"
  private apiKeyLoader: ApiKeyLoader

  constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  async sendRequest(model: string, messages: AiMessage[], options: AiRequestOptions = {}): Promise<AiResponse> {
    const apiKey = await this.apiKeyLoader.getApiKey("deepseek")
    if (!apiKey) {
      throw new Error("DeepSeek API key not found. Please configure API key in settings.")
    }

    try {
      const requestBody: DeepSeekApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        top_p: 1.0,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
      }

      // Специальная обработка для reasoning моделей
      if (this.isReasoningModel(model)) {
        // Reasoning модели могут иметь другие параметры по умолчанию
        requestBody.temperature = Math.min(options.temperature || 0.3, 0.5)
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as DeepSeekApiResponse

      const choice = data.choices[0]
      const content = choice.message.content || ""

      const result: DeepSeekAiResponse = {
        content,
        model,
        provider: this.name,
        finishReason: choice.finish_reason || undefined,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      }

      // Добавляем reasoning tokens если есть
      if (data.usage?.reasoning_tokens) {
        result.reasoningTokens = data.usage.reasoning_tokens
      }

      return result
    } catch (error) {
      console.error("DeepSeek request failed:", error)
      throw error
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: AiRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    const apiKey = await this.apiKeyLoader.getApiKey("deepseek")
    if (!apiKey) {
      const error = new Error("DeepSeek API key not found. Please configure API key in settings.")
      if (options.onError) {
        options.onError(error)
        return
      }
      throw error
    }

    try {
      const requestBody: DeepSeekApiRequest = {
        model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        top_p: 1.0,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
      }

      // Специальная обработка для reasoning моделей
      if (this.isReasoningModel(model)) {
        requestBody.temperature = Math.min(options.temperature || 0.3, 0.5)
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`DeepSeek API error: ${response.status} ${errorText}`)
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
      let reasoningContent = ""
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
                const finalResponse: DeepSeekAiResponse = {
                  content: fullContent,
                  model,
                  provider: this.name,
                  usage,
                }

                // Добавляем reasoning content если есть
                if (reasoningContent) {
                  finalResponse.reasoning = reasoningContent
                }

                if (options.onComplete) {
                  options.onComplete(finalResponse)
                }
                return
              }

              try {
                const event: DeepSeekStreamingEvent = JSON.parse(data)
                const choice = event.choices[0]

                // Обычный контент
                if (choice?.delta?.content) {
                  const content = choice.delta.content
                  fullContent += content
                  if (options.onContent) {
                    options.onContent(content)
                  }
                }

                // Reasoning контент для reasoning моделей
                if (choice?.delta?.reasoning_content) {
                  reasoningContent += choice.delta.reasoning_content
                  // Можно добавить специальный callback для reasoning
                  if (options.onContent) {
                    options.onContent(`[Reasoning: ${choice.delta.reasoning_content}]`)
                  }
                }
              } catch (parseError) {
                console.warn("Error parsing DeepSeek streaming event:", parseError)
              }
            }
          }
        }

        // Финальный callback если не было [DONE]
        const finalResponse: DeepSeekAiResponse = {
          content: fullContent,
          model,
          provider: this.name,
          usage,
        }

        if (reasoningContent) {
          finalResponse.reasoning = reasoningContent
        }

        if (options.onComplete) {
          options.onComplete(finalResponse)
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error("DeepSeek streaming request failed:", error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      } else {
        throw error
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const hasKey = await this.apiKeyLoader.hasApiKey("deepseek")
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

    try {
      // DeepSeek не предоставляет публичный endpoint для списка моделей
      // Возвращаем статический список доступных моделей
      return this.models
    } catch {
      return this.models
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.sendRequest(DEEPSEEK_MODELS.DEEPSEEK_CHAT, [{ role: "user", content: "test" }], {
        maxTokens: 1,
      })
      return !!testResponse.content
    } catch {
      return false
    }
  }

  estimateTokens(text: string): number {
    // DeepSeek использует приблизительно 3.5-4 символа на токен
    return Math.ceil(text.length / 3.5)
  }

  getMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      [DEEPSEEK_MODELS.DEEPSEEK_R1]: 128000,
      [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: 32768,
      [DEEPSEEK_MODELS.DEEPSEEK_CODER]: 16384,
      [DEEPSEEK_MODELS.DEEPSEEK_REASONER]: 65536,
      [DEEPSEEK_MODELS.DEEPSEEK_V3]: 64000,
    }
    return limits[model] || 32768
  }

  // DeepSeek-специфичные методы

  isReasoningModel(model: string): boolean {
    const reasoningModels = [
      DEEPSEEK_MODELS.DEEPSEEK_R1,
      DEEPSEEK_MODELS.DEEPSEEK_REASONER,
      DEEPSEEK_MODELS.DEEPSEEK_V3,
    ]
    return reasoningModels.includes(model as any)
  }

  isCodingModel(model: string): boolean {
    return model === DEEPSEEK_MODELS.DEEPSEEK_CODER || model === DEEPSEEK_MODELS.DEEPSEEK_V3
  }

  supportsReasoning(model: string): boolean {
    return this.isReasoningModel(model)
  }

  supportsCoding(model: string): boolean {
    return this.isCodingModel(model)
  }

  supportsStreaming(): boolean {
    return true
  }

  getModelType(model: string): "chat" | "code" | "reasoning" {
    if (this.isReasoningModel(model)) return "reasoning"
    if (this.isCodingModel(model)) return "code"
    return "chat"
  }

  getModelDisplayName(model: string): string {
    const names: Record<string, string> = {
      [DEEPSEEK_MODELS.DEEPSEEK_R1]: "DeepSeek R1",
      [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: "DeepSeek Chat",
      [DEEPSEEK_MODELS.DEEPSEEK_CODER]: "DeepSeek Coder",
      [DEEPSEEK_MODELS.DEEPSEEK_REASONER]: "DeepSeek Reasoner",
      [DEEPSEEK_MODELS.DEEPSEEK_V3]: "DeepSeek V3",
    }
    return names[model] || model
  }

  getModelDescription(model: string): string {
    const descriptions: Record<string, string> = {
      [DEEPSEEK_MODELS.DEEPSEEK_R1]: "Последняя модель DeepSeek с улучшенными возможностями рассуждения",
      [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: "Базовая модель DeepSeek для общения",
      [DEEPSEEK_MODELS.DEEPSEEK_CODER]: "Специализированная модель для программирования",
      [DEEPSEEK_MODELS.DEEPSEEK_REASONER]: "Модель с продвинутыми возможностями логических рассуждений",
      [DEEPSEEK_MODELS.DEEPSEEK_V3]: "Универсальная модель третьего поколения",
    }
    return descriptions[model] || "DeepSeek AI model"
  }

  getModelInfo(model: string) {
    return {
      id: model,
      name: this.getModelDisplayName(model),
      description: this.getModelDescription(model),
      type: this.getModelType(model),
      maxTokens: this.getMaxTokens(model),
      supportsReasoning: this.supportsReasoning(model),
      supportsCoding: this.supportsCoding(model),
      supportsStreaming: this.supportsStreaming(),
    }
  }
}

// Фабричная функция
export function createDeepSeekProvider(): DeepSeekProvider {
  return new DeepSeekProvider()
}

// Экспорт для обратной совместимости
export const DeepSeekService = DeepSeekProvider
