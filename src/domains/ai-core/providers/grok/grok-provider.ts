/**
 * Grok Provider для AI services
 * Реализация xAI Grok API с поддержкой streaming
 */

import { ApiKeyLoader } from "../../services/api-key-loader"
import type { AiMessage, AiRequestOptions, AiResponse, IAIProvider, StreamingOptions } from "../../types"

// Доступные модели Grok
export const GROK_MODELS = {
  GROK_1: "grok-1",
  GROK_1_VISION: "grok-1-vision",
  GROK_2: "grok-2",
  GROK_2_VISION: "grok-2-vision",
  GROK_BETA: "grok-beta",
  GROK_CODE_FAST_1: "grok-code-fast-1",
  GROK_4_0709: "grok-4-0709",
  GROK_3: "grok-3",
  GROK_3_MINI: "grok-3-mini",
} as const

// Интерфейс для запроса к Grok API
interface GrokApiRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
}

// Интерфейс для ответа от Grok API
interface GrokApiResponse {
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
  }
}

// Интерфейс для потокового события
interface GrokStreamingEvent {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

export class GrokProvider implements IAIProvider {
  name = "grok" as const
  models = [
    GROK_MODELS.GROK_1,
    GROK_MODELS.GROK_1_VISION,
    GROK_MODELS.GROK_2,
    GROK_MODELS.GROK_2_VISION,
    GROK_MODELS.GROK_BETA,
    GROK_MODELS.GROK_CODE_FAST_1,
    GROK_MODELS.GROK_4_0709,
    GROK_MODELS.GROK_3,
    GROK_MODELS.GROK_3_MINI,
  ]

  private apiUrl = "https://api.x.ai/v1/chat/completions"
  private apiKeyLoader: ApiKeyLoader

  constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  async sendRequest(model: string, messages: AiMessage[], options: AiRequestOptions = {}): Promise<AiResponse> {
    // Grok может использовать как свой ключ, так и OpenAI ключ
    const apiKey = (await this.apiKeyLoader.getApiKey("grok")) || (await this.apiKeyLoader.getApiKey("openai"))
    if (!apiKey) {
      throw new Error("Grok API key not found. Please configure Grok or OpenAI API key in settings.")
    }

    try {
      const requestBody: GrokApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
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
        throw new Error(`Grok API error: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as GrokApiResponse

      const choice = data.choices[0]
      const content = choice.message.content || ""

      return {
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
    } catch (error) {
      console.error("Grok request failed:", error)
      throw error
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: AiRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    // Grok может использовать как свой ключ, так и OpenAI ключ
    const apiKey = (await this.apiKeyLoader.getApiKey("grok")) || (await this.apiKeyLoader.getApiKey("openai"))
    if (!apiKey) {
      const error = new Error("Grok API key not found. Please configure Grok or OpenAI API key in settings.")
      if (options.onError) {
        options.onError(error)
        return
      }
      throw error
    }

    try {
      const requestBody: GrokApiRequest = {
        model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
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
        const error = new Error(`Grok API error: ${response.status} ${errorText}`)
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
                const event: GrokStreamingEvent = JSON.parse(data)
                const choice = event.choices[0]

                if (choice?.delta?.content) {
                  const content = choice.delta.content
                  fullContent += content
                  if (options.onContent) {
                    options.onContent(content)
                  }
                }
              } catch (parseError) {
                console.warn("Error parsing Grok streaming event:", parseError)
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
      console.error("Grok streaming request failed:", error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      } else {
        throw error
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Проверяем наличие ключа - может быть как grok, так и openai
      const hasGrokKey = await this.apiKeyLoader.hasApiKey("grok")
      const hasOpenAIKey = await this.apiKeyLoader.hasApiKey("openai")
      return hasGrokKey || hasOpenAIKey
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    const isAvailable = await this.isAvailable()
    if (!isAvailable) {
      return []
    }

    // Grok использует тот же API endpoint что и OpenAI, но с другими моделями
    return this.models
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.sendRequest(GROK_MODELS.GROK_BETA, [{ role: "user", content: "test" }], {
        maxTokens: 1,
      })
      return !!testResponse.content
    } catch {
      return false
    }
  }

  estimateTokens(text: string): number {
    // Grok использует приблизительно 3.5-4 символа на токен
    return Math.ceil(text.length / 3.5)
  }

  getMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      [GROK_MODELS.GROK_1]: 100000,
      [GROK_MODELS.GROK_1_VISION]: 100000,
      [GROK_MODELS.GROK_2]: 131072,
      [GROK_MODELS.GROK_2_VISION]: 131072,
      [GROK_MODELS.GROK_BETA]: 100000,
      [GROK_MODELS.GROK_CODE_FAST_1]: 256000,
      [GROK_MODELS.GROK_4_0709]: 256000,
      [GROK_MODELS.GROK_3]: 131072,
      [GROK_MODELS.GROK_3_MINI]: 131072,
    }
    return limits[model] || 100000
  }

  // Grok-специфичные методы

  supportsVision(model: string): boolean {
    const visionModels = [
      GROK_MODELS.GROK_1_VISION,
      GROK_MODELS.GROK_2_VISION,
      GROK_MODELS.GROK_4_0709,
      GROK_MODELS.GROK_3,
      GROK_MODELS.GROK_3_MINI,
    ]
    return visionModels.includes(model as any)
  }

  supportsStreaming(): boolean {
    return true
  }

  isBetaModel(model: string): boolean {
    return model === GROK_MODELS.GROK_BETA
  }

  getModelType(model: string): "chat" | "vision" | "beta" {
    if (this.supportsVision(model)) return "vision"
    if (this.isBetaModel(model)) return "beta"
    return "chat"
  }

  getModelDisplayName(model: string): string {
    const names: Record<string, string> = {
      [GROK_MODELS.GROK_1]: "Grok-1",
      [GROK_MODELS.GROK_1_VISION]: "Grok-1 Vision",
      [GROK_MODELS.GROK_2]: "Grok-2",
      [GROK_MODELS.GROK_2_VISION]: "Grok-2 Vision",
      [GROK_MODELS.GROK_BETA]: "Grok Beta",
      [GROK_MODELS.GROK_CODE_FAST_1]: "Grok Code Fast",
      [GROK_MODELS.GROK_4_0709]: "Grok-4",
      [GROK_MODELS.GROK_3]: "Grok-3",
      [GROK_MODELS.GROK_3_MINI]: "Grok-3 Mini",
    }
    return names[model] || model
  }

  getModelDescription(model: string): string {
    const descriptions: Record<string, string> = {
      [GROK_MODELS.GROK_1]: "Базовая модель Grok от xAI",
      [GROK_MODELS.GROK_1_VISION]: "Grok с поддержкой анализа изображений",
      [GROK_MODELS.GROK_2]: "Улучшенная модель Grok второго поколения",
      [GROK_MODELS.GROK_2_VISION]: "Grok-2 с поддержкой мультимодального анализа",
      [GROK_MODELS.GROK_BETA]: "Экспериментальная версия Grok",
      [GROK_MODELS.GROK_CODE_FAST_1]: "Grok оптимизированный для кода с высокой скоростью",
      [GROK_MODELS.GROK_4_0709]: "Grok-4 последняя версия с улучшенными возможностями",
      [GROK_MODELS.GROK_3]: "Grok-3 новейшая модель с расширенными возможностями",
      [GROK_MODELS.GROK_3_MINI]: "Grok-3 Mini компактная версия Grok-3",
    }
    return descriptions[model] || "Grok AI model"
  }

  getModelInfo(model: string) {
    return {
      id: model,
      name: this.getModelDisplayName(model),
      description: this.getModelDescription(model),
      type: this.getModelType(model),
      maxTokens: this.getMaxTokens(model),
      supportsVision: this.supportsVision(model),
      supportsStreaming: this.supportsStreaming(),
      isBeta: this.isBetaModel(model),
    }
  }
}

// Фабричная функция
export function createGrokProvider(): GrokProvider {
  return new GrokProvider()
}

// Экспорт для обратной совместимости
export const GrokService = GrokProvider
