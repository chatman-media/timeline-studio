/**
 * OpenAI Provider для shared AI services
 * Чистая реализация OpenAI API без смешивания с другими провайдерами
 */

import { ApiKeyLoader } from "../../services/api-key-loader"
import type { AiMessage, AiRequestOptions, AiResponse, IAIProvider, StreamingOptions } from "../../types"

// Доступные модели OpenAI
export const OPENAI_MODELS = {
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
  GPT_3_5_TURBO: "gpt-3.5-turbo",
  GPT_4_VISION_PREVIEW: "gpt-4-vision-preview",
  O1_PREVIEW: "o1-preview",
  O1_MINI: "o1-mini",
  // Будущие модели
  GPT_5: "gpt-5",
  O3: "o3",
} as const

// Интерфейс для запроса к OpenAI API
interface OpenAIApiRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
  tools?: OpenAITool[]
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } }
  stream?: boolean
  response_format?: { type: "text" | "json_object" }
  seed?: number
  stop?: string | string[]
  presence_penalty?: number
  frequency_penalty?: number
  logit_bias?: Record<string, number>
  user?: string
}

// Интерфейс для ответа от OpenAI API
interface OpenAIApiResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string | null
      tool_calls?: Array<{
        id: string
        type: "function"
        function: {
          name: string
          arguments: string
        }
      }>
    }
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Интерфейс для потокового события
interface OpenAIStreamingEvent {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: "function"
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: string | null
  }>
}

// Интерфейс для инструмента OpenAI
export interface OpenAITool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, any>
      required?: string[]
    }
  }
}

export class OpenAIProvider implements IAIProvider {
  name = "openai" as const
  models = [
    OPENAI_MODELS.GPT_4O,
    OPENAI_MODELS.GPT_4O_MINI,
    OPENAI_MODELS.GPT_4_TURBO,
    OPENAI_MODELS.GPT_4,
    OPENAI_MODELS.GPT_3_5_TURBO,
    OPENAI_MODELS.GPT_4_VISION_PREVIEW,
    OPENAI_MODELS.O1_PREVIEW,
    OPENAI_MODELS.O1_MINI,
    OPENAI_MODELS.GPT_5,
    OPENAI_MODELS.O3,
  ]

  private apiUrl = "https://api.openai.com/v1/chat/completions"
  private apiKeyLoader: ApiKeyLoader

  constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  async sendRequest(model: string, messages: AiMessage[], options: AiRequestOptions = {}): Promise<AiResponse> {
    const apiKey = await this.apiKeyLoader.getApiKey("openai")
    if (!apiKey) {
      throw new Error("OpenAI API key not found. Please configure API key in settings.")
    }

    try {
      const requestBody: OpenAIApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      }

      // Добавляем инструменты, если есть
      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools as OpenAITool[]
        requestBody.tool_choice = "auto"
      }

      // Специальная обработка для O1 моделей (они не поддерживают многие параметры)
      if (model.startsWith("o1")) {
        requestBody.temperature = undefined
        requestBody.tools = undefined
        requestBody.tool_choice = undefined
        // O1 модели имеют фиксированный max_tokens
        requestBody.max_tokens = undefined
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
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as OpenAIApiResponse

      // Извлекаем контент
      const choice = data.choices[0]
      let content = choice.message.content || ""

      // Если использовались tools, добавляем информацию о них
      if (choice.message.tool_calls) {
        const toolInfo = choice.message.tool_calls
          .map((tc) => `[Tool Called: ${tc.function.name}]\nArguments: ${tc.function.arguments}`)
          .join("\n\n")
        content += `\n\n${toolInfo}`
      }

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
      console.error("OpenAI request failed:", error)
      throw error
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: AiRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    const apiKey = await this.apiKeyLoader.getApiKey("openai")
    if (!apiKey) {
      const error = new Error("OpenAI API key not found. Please configure API key in settings.")
      if (options.onError) {
        options.onError(error)
        return
      }
      throw error
    }

    try {
      const requestBody: OpenAIApiRequest = {
        model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
      }

      // Добавляем инструменты, если есть
      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools as OpenAITool[]
        requestBody.tool_choice = "auto"
      }

      // Специальная обработка для O1 моделей
      if (model.startsWith("o1")) {
        requestBody.temperature = undefined
        requestBody.tools = undefined
        requestBody.tool_choice = undefined
        requestBody.max_tokens = undefined
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
        const error = new Error(`OpenAI API error: ${response.status} ${errorText}`)
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
                const event: OpenAIStreamingEvent = JSON.parse(data)
                const choice = event.choices[0]

                if (choice?.delta?.content) {
                  const content = choice.delta.content
                  fullContent += content
                  if (options.onContent) {
                    options.onContent(content)
                  }
                }

                // Обработка tool calls в streaming режиме
                if (choice?.delta?.tool_calls) {
                  const toolCall = choice.delta.tool_calls[0]
                  if (toolCall?.function?.name || toolCall?.function?.arguments) {
                    const toolInfo = `[Tool: ${toolCall.function.name || ""}]${toolCall.function.arguments || ""}`
                    fullContent += toolInfo
                    if (options.onContent) {
                      options.onContent(toolInfo)
                    }
                  }
                }
              } catch (parseError) {
                console.warn("Error parsing OpenAI streaming event:", parseError)
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
      console.error("OpenAI streaming request failed:", error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      } else {
        throw error
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const hasKey = await this.apiKeyLoader.hasApiKey("openai")
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
      // Пытаемся получить список моделей из API
      const apiKey = await this.apiKeyLoader.getApiKey("openai")
      if (!apiKey) return this.models

      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const apiModels = data.data?.map((model: any) => model.id) || []

        // Возвращаем пересечение наших моделей с доступными в API
        return this.models.filter((model) => apiModels.includes(model))
      }
    } catch (error) {
      console.warn("Failed to fetch OpenAI models from API:", error)
    }

    // Возвращаем статический список если API недоступен
    return this.models
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.sendRequest(OPENAI_MODELS.GPT_3_5_TURBO, [{ role: "user", content: "test" }], {
        maxTokens: 1,
      })
      return !!testResponse.content
    } catch {
      return false
    }
  }

  estimateTokens(text: string): number {
    // OpenAI использует приблизительно 4 символа на токен
    return Math.ceil(text.length / 4)
  }

  getMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      [OPENAI_MODELS.GPT_4O]: 128000,
      [OPENAI_MODELS.GPT_4O_MINI]: 128000,
      [OPENAI_MODELS.GPT_4_TURBO]: 128000,
      [OPENAI_MODELS.GPT_4]: 8192,
      [OPENAI_MODELS.GPT_3_5_TURBO]: 16385,
      [OPENAI_MODELS.GPT_4_VISION_PREVIEW]: 128000,
      [OPENAI_MODELS.O1_PREVIEW]: 128000,
      [OPENAI_MODELS.O1_MINI]: 128000,
      [OPENAI_MODELS.GPT_5]: 200000, // Предполагаемый лимит
      [OPENAI_MODELS.O3]: 200000, // Предполагаемый лимит
    }
    return limits[model] || 4096
  }

  // OpenAI-специфичные методы

  supportsTools(model: string): boolean {
    // O1 модели не поддерживают function calling
    const toolsSupportedModels = [
      OPENAI_MODELS.GPT_4O,
      OPENAI_MODELS.GPT_4O_MINI,
      OPENAI_MODELS.GPT_4_TURBO,
      OPENAI_MODELS.GPT_3_5_TURBO,
      OPENAI_MODELS.GPT_5,
    ]
    return toolsSupportedModels.includes(model as any)
  }

  supportsVision(model: string): boolean {
    const visionModels = [OPENAI_MODELS.GPT_4O, OPENAI_MODELS.GPT_4_VISION_PREVIEW, OPENAI_MODELS.GPT_5]
    return visionModels.includes(model as any)
  }

  supportsStreaming(model: string): boolean {
    // O1 модели в preview могут не поддерживать streaming
    return !model.startsWith("o1")
  }

  isReasoningModel(model: string): boolean {
    return model.startsWith("o1") || model.startsWith("o3")
  }

  getModelType(model: string): "chat" | "vision" | "reasoning" | "code" {
    if (this.isReasoningModel(model)) return "reasoning"
    if (this.supportsVision(model)) return "vision"
    if (model.includes("code") || model === OPENAI_MODELS.GPT_4_TURBO) return "code"
    return "chat"
  }

  getModelDisplayName(model: string): string {
    const names: Record<string, string> = {
      [OPENAI_MODELS.GPT_4O]: "GPT-4o",
      [OPENAI_MODELS.GPT_4O_MINI]: "GPT-4o Mini",
      [OPENAI_MODELS.GPT_4_TURBO]: "GPT-4 Turbo",
      [OPENAI_MODELS.GPT_4]: "GPT-4",
      [OPENAI_MODELS.GPT_3_5_TURBO]: "GPT-3.5 Turbo",
      [OPENAI_MODELS.GPT_4_VISION_PREVIEW]: "GPT-4 Vision",
      [OPENAI_MODELS.O1_PREVIEW]: "O1 Preview",
      [OPENAI_MODELS.O1_MINI]: "O1 Mini",
      [OPENAI_MODELS.GPT_5]: "GPT-5",
      [OPENAI_MODELS.O3]: "O3",
    }
    return names[model] || model
  }
}

// Фабричная функция
export function createOpenAIProvider(): OpenAIProvider {
  return new OpenAIProvider()
}

// Экспорт для обратной совместимости
export const OpenAIService = OpenAIProvider
