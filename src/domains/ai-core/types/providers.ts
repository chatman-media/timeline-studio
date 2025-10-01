/**
 * AI Provider Types
 *
 * Базовые типы для AI провайдеров, обеспечивающие единый API
 */

// Базовые типы для AI провайдеров
export interface AiMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AiResponse {
  content: string
  model: string
  provider: string
  finishReason?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AiRequestOptions {
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
  timeout?: number
  tools?: any[]
  systemPrompt?: string
  stop?: string | string[]
}

// Потоковый запрос
export interface StreamingOptions {
  onContent?: (content: string) => void
  onComplete?: (response: AiResponse) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

// Интерфейс для AI провайдера
export interface IAIProvider {
  name: string
  models: string[]

  // Основные методы
  sendRequest(model: string, messages: AiMessage[], options?: AiRequestOptions): Promise<AiResponse>
  sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options?: AiRequestOptions & StreamingOptions,
  ): Promise<void>

  // Управление состоянием
  isAvailable(): Promise<boolean>
  getAvailableModels(): Promise<string[]>
  validateApiKey?(): Promise<boolean>

  // Утилиты
  estimateTokens?(text: string): number
  getMaxTokens?(model: string): number
}

// Конфигурация модели
export interface ModelConfiguration {
  provider: string
  model: string
  displayName?: string
  maxTokens?: number
  supportTools?: boolean
  supportStreaming?: boolean
  supportVision?: boolean
  apiKeyRequired?: boolean
}

// Фабрика AI провайдеров
export interface AIProviderFactory {
  createClaudeProvider(): IAIProvider
  createOpenAIProvider(): IAIProvider
  createDeepSeekProvider(): IAIProvider
  createOllamaProvider(baseUrl?: string): IAIProvider
  createGrokProvider(): IAIProvider

  // Утилиты
  getAvailableProviders(): Promise<string[]>
  getProviderByModel(model: string): IAIProvider | null
  isProviderAvailable(provider: string): Promise<boolean>
}

// Конфигурация AI провайдера
export interface AIProviderConfig {
  apiKey?: string
  baseUrl?: string
  maxRetries?: number
  organization?: string
}

// Конфигурация AI сервисов
export interface AIServiceConfig {
  providers?: {
    claude?: AIProviderConfig
    openai?: AIProviderConfig
    deepseek?: AIProviderConfig
    ollama?: {
      baseUrl?: string
    }
    grok?: AIProviderConfig
  }
  cache?: {
    enabled?: boolean
    ttl?: number
    maxSize?: number
  }
  retry?: {
    maxAttempts?: number
    delay?: number
    backoff?: "linear" | "exponential"
  }
  fallback?: {
    enabled?: boolean
    models?: string[]
  }
}
