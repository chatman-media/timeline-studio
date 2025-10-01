/**
 * Ollama Provider для shared AI services
 * Полная реализация Ollama API с поддержкой локальных моделей
 */

import type { AiMessage, AiRequestOptions, AiResponse, IAIProvider, StreamingOptions } from "../../types"

// Популярные модели Ollama
export const OLLAMA_MODELS = {
  // Рекомендуемые для продакшена (оптимальный баланс)
  LLAMA3_2: "llama3.2",
  LLAMA3_1: "llama3.1",
  LLAMA3: "llama3",
  QWEN2_5: "qwen2.5",
  GEMMA2: "gemma2",
  PHI3: "phi3",
  MISTRAL: "mistral",

  // Специализированные модели
  CODELLAMA: "codellama",
  LLAMA3_2_VISION: "llama3.2-vision",
  DEEPSEEK_CODER_V2: "deepseek-coder-v2",

  // Компактные модели
  QWEN2_5_0_5B: "qwen2.5:0.5b",
  GEMMA2_2B: "gemma2:2b",
  PHI3_MINI: "phi3:mini",
  ORCA_MINI: "orca-mini",

  // Большие модели
  LLAMA2_13B: "llama2:13b",
  LLAMA2_70B: "llama2:70b",
  MISTRAL_7B: "mistral:7b",
  CODELLAMA_13B: "codellama:13b",

  // Специальные модели
  VICUNA: "vicuna",
  DOLPHIN_MIXTRAL: "dolphin-mixtral",
  NEURAL_CHAT: "neural-chat",
} as const

// Интерфейс для запроса к Ollama API
interface OllamaApiRequest {
  model: string
  messages: AiMessage[]
  stream?: boolean
  options?: {
    temperature?: number
    top_k?: number
    top_p?: number
    repeat_penalty?: number
    num_ctx?: number
    stop?: string[]
  }
}

// Интерфейс для ответа от Ollama API
interface OllamaApiResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

// Интерфейс для потоковых событий Ollama
interface OllamaStreamingEvent {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  eval_count?: number
  eval_duration?: number
}

// Интерфейс для информации о модели
export interface OllamaModelInfo {
  name: string
  modified_at: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families?: string[]
    parameter_size: string
    quantization_level: string
  }
}

// Расширяем интерфейс AiResponse для Ollama метаданных
interface OllamaAiResponse extends AiResponse {
  metadata?: {
    totalDuration?: number
    loadDuration?: number
    promptEvalCount?: number
    promptEvalDuration?: number
    evalCount?: number
    evalDuration?: number
  }
}

export class OllamaProvider implements IAIProvider {
  name = "ollama" as const
  models = Object.values(OLLAMA_MODELS)

  private defaultBaseUrl = "http://localhost:11434"
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.defaultBaseUrl
  }

  async sendRequest(model: string, messages: AiMessage[], options: AiRequestOptions = {}): Promise<AiResponse> {
    const available = await this.isAvailable()
    if (!available) {
      throw new Error(`Ollama server not available at ${this.baseUrl}. Please ensure Ollama is running.`)
    }

    try {
      const requestBody: OllamaApiRequest = {
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_ctx: this.getContextLength(model),
          stop: options.stop as string[],
        },
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ollama API error: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as OllamaApiResponse

      const result: OllamaAiResponse = {
        content: data.message.content,
        model,
        provider: this.name,
        usage: this.calculateUsage(data),
        metadata: {
          totalDuration: data.total_duration,
          loadDuration: data.load_duration,
          promptEvalCount: data.prompt_eval_count,
          promptEvalDuration: data.prompt_eval_duration,
          evalCount: data.eval_count,
          evalDuration: data.eval_duration,
        },
      }

      return result
    } catch (error) {
      console.error("Ollama request failed:", error)
      throw error
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: AiRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    const available = await this.isAvailable()
    if (!available) {
      const error = new Error(`Ollama server not available at ${this.baseUrl}. Please ensure Ollama is running.`)
      if (options.onError) {
        options.onError(error)
        return
      }
      throw error
    }

    try {
      const requestBody: OllamaApiRequest = {
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_ctx: this.getContextLength(model),
          stop: options.stop as string[],
        },
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Ollama API error: ${response.status} ${errorText}`)
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
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            try {
              const event: OllamaStreamingEvent = JSON.parse(line)

              const content = event.message?.content
              if (content) {
                fullContent += content
                if (options.onContent) {
                  options.onContent(content)
                }
              }

              if (event.done) {
                usage = this.calculateUsage(event)
                const finalResponse: OllamaAiResponse = {
                  content: fullContent,
                  model,
                  provider: this.name,
                  usage,
                  metadata: {
                    totalDuration: event.total_duration,
                    evalCount: event.eval_count,
                    evalDuration: event.eval_duration,
                  },
                }
                if (options.onComplete) {
                  options.onComplete(finalResponse)
                }
                return
              }
            } catch (parseError) {
              console.warn("Error parsing Ollama streaming event:", parseError)
            }
          }
        }

        // Финальный callback если не было done=true
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
      console.error("Ollama streaming request failed:", error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown error"))
      } else {
        throw error
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 секунд таймаут
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const installedModels = await this.getInstalledModels()
      return installedModels.map((model) => model.name)
    } catch {
      // Возвращаем пустой список если не удалось получить модели
      return []
    }
  }

  async validateConnection(): Promise<boolean> {
    return await this.isAvailable()
  }

  estimateTokens(text: string): number {
    // Ollama использует приблизительно 3-4 символа на токен
    return Math.ceil(text.length / 3.5)
  }

  getMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      [OLLAMA_MODELS.LLAMA3_2]: 128000,
      [OLLAMA_MODELS.LLAMA3_1]: 128000,
      [OLLAMA_MODELS.LLAMA3]: 8192,
      [OLLAMA_MODELS.QWEN2_5]: 32768,
      [OLLAMA_MODELS.GEMMA2]: 8192,
      [OLLAMA_MODELS.PHI3]: 4096,
      [OLLAMA_MODELS.MISTRAL]: 32768,
      [OLLAMA_MODELS.CODELLAMA]: 16384,
      [OLLAMA_MODELS.LLAMA3_2_VISION]: 128000,
      [OLLAMA_MODELS.DEEPSEEK_CODER_V2]: 16384,
      [OLLAMA_MODELS.QWEN2_5_0_5B]: 32768,
      [OLLAMA_MODELS.GEMMA2_2B]: 8192,
      [OLLAMA_MODELS.ORCA_MINI]: 4096,
      [OLLAMA_MODELS.VICUNA]: 4096,
    }
    return limits[model] || 4096
  }

  // Ollama-специфичные методы

  getBaseUrl(): string {
    return this.baseUrl
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl
  }

  async getInstalledModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      return data.models || []
    } catch (error) {
      console.error("Failed to get installed Ollama models:", error)
      throw error
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelName }),
      })

      return response.ok
    } catch {
      return false
    }
  }

  async removeModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelName }),
      })

      return response.ok
    } catch {
      return false
    }
  }

  async getModelInfo(modelName: string): Promise<OllamaModelInfo | null> {
    try {
      const models = await this.getInstalledModels()
      return models.find((m) => m.name === modelName) || null
    } catch {
      return null
    }
  }

  getRecommendedModels(): Array<{
    id: string
    name: string
    description: string
    size: string
    recommended?: boolean
  }> {
    return [
      // Рекомендуемые модели для продакшена
      {
        id: OLLAMA_MODELS.QWEN2_5_0_5B,
        name: "Qwen 2.5 (0.5B)",
        description: "⚡ Самая быстрая модель для тестирования",
        size: "400MB",
        recommended: true,
      },
      {
        id: OLLAMA_MODELS.GEMMA2_2B,
        name: "Gemma 2 (2B)",
        description: "🎯 Оптимальный баланс скорости и качества",
        size: "1.6GB",
        recommended: true,
      },
      {
        id: OLLAMA_MODELS.PHI3,
        name: "Phi-3 (3.8B)",
        description: "🚀 Microsoft модель, отличная производительность",
        size: "2.3GB",
        recommended: true,
      },
      {
        id: OLLAMA_MODELS.LLAMA3_2,
        name: "Llama 3.2 (3B)",
        description: "🦙 Новейшая модель Meta для анализа контента",
        size: "2GB",
        recommended: true,
      },
      {
        id: OLLAMA_MODELS.LLAMA3_2_VISION,
        name: "Llama 3.2 Vision (11B)",
        description: "👁️ С поддержкой анализа изображений",
        size: "7GB",
      },
      {
        id: OLLAMA_MODELS.CODELLAMA,
        name: "Code Llama (7B)",
        description: "💻 Специализированная модель для программирования",
        size: "3.8GB",
      },
      {
        id: OLLAMA_MODELS.MISTRAL,
        name: "Mistral (7B)",
        description: "🔥 Высокопроизводительная европейская модель",
        size: "4.1GB",
      },
    ]
  }

  supportsVision(model: string): boolean {
    const visionModels = [OLLAMA_MODELS.LLAMA3_2_VISION]
    return visionModels.includes(model as any)
  }

  supportsCoding(model: string): boolean {
    const codingModels = [OLLAMA_MODELS.CODELLAMA, OLLAMA_MODELS.CODELLAMA_13B, OLLAMA_MODELS.DEEPSEEK_CODER_V2]
    return codingModels.includes(model as any)
  }

  isLargeModel(model: string): boolean {
    const largeModels = [
      OLLAMA_MODELS.LLAMA2_13B,
      OLLAMA_MODELS.LLAMA2_70B,
      OLLAMA_MODELS.CODELLAMA_13B,
      OLLAMA_MODELS.LLAMA3_2_VISION,
    ]
    return largeModels.includes(model as any)
  }

  getModelType(model: string): "chat" | "code" | "vision" | "compact" {
    if (this.supportsVision(model)) return "vision"
    if (this.supportsCoding(model)) return "code"
    if (this.isCompactModel(model)) return "compact"
    return "chat"
  }

  isCompactModel(model: string): boolean {
    const compactModels = [
      OLLAMA_MODELS.QWEN2_5_0_5B,
      OLLAMA_MODELS.GEMMA2_2B,
      OLLAMA_MODELS.PHI3_MINI,
      OLLAMA_MODELS.ORCA_MINI,
    ]
    return compactModels.includes(model as any)
  }

  getContextLength(model: string): number {
    // Возвращает оптимальную длину контекста для модели
    const contexts: Record<string, number> = {
      [OLLAMA_MODELS.LLAMA3_2]: 8192,
      [OLLAMA_MODELS.LLAMA3_1]: 8192,
      [OLLAMA_MODELS.QWEN2_5]: 4096,
      [OLLAMA_MODELS.GEMMA2]: 4096,
      [OLLAMA_MODELS.PHI3]: 2048,
      [OLLAMA_MODELS.MISTRAL]: 4096,
      [OLLAMA_MODELS.CODELLAMA]: 4096,
    }
    return contexts[model] || 2048
  }

  // Утилитарные методы

  private calculateUsage(data: any): AiResponse["usage"] | undefined {
    if (data.prompt_eval_count || data.eval_count) {
      return {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      }
    }
    return undefined
  }

  getModelDisplayName(model: string): string {
    const names: Record<string, string> = {
      [OLLAMA_MODELS.LLAMA3_2]: "Llama 3.2",
      [OLLAMA_MODELS.LLAMA3_1]: "Llama 3.1",
      [OLLAMA_MODELS.LLAMA3]: "Llama 3",
      [OLLAMA_MODELS.QWEN2_5]: "Qwen 2.5",
      [OLLAMA_MODELS.GEMMA2]: "Gemma 2",
      [OLLAMA_MODELS.PHI3]: "Phi-3",
      [OLLAMA_MODELS.MISTRAL]: "Mistral",
      [OLLAMA_MODELS.CODELLAMA]: "Code Llama",
      [OLLAMA_MODELS.LLAMA3_2_VISION]: "Llama 3.2 Vision",
      [OLLAMA_MODELS.DEEPSEEK_CODER_V2]: "DeepSeek Coder V2",
    }
    return names[model] || model
  }
}

// Фабричная функция
export function createOllamaProvider(baseUrl?: string): OllamaProvider {
  return new OllamaProvider(baseUrl)
}

// Экспорт для обратной совместимости
export const OllamaService = OllamaProvider
