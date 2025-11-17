/**
 * Unified AI Service
 *
 * Сервис для работы с унифицированными AI командами через Tauri backend.
 * Поддерживает множество провайдеров (Claude, OpenAI, DeepSeek, Ollama)
 * через единый интерфейс с кэшированием и streaming.
 *
 * Features:
 * - Унифицированный API для всех AI провайдеров
 * - Автоматическое кэширование ответов
 * - Streaming support через Tauri Event System
 * - Валидация провайдеров и API ключей
 * - Статистика кэша и управление
 *
 * @example
 * // Обычный запрос
 * const response = await unifiedAIService.sendRequest({
 *   provider: "claude",
 *   model: "claude-sonnet-4",
 *   messages: [{ role: "user", content: "Hello" }]
 * });
 *
 * @example
 * // Streaming запрос
 * const requestId = await unifiedAIService.sendStreamingRequest(
 *   {
 *     provider: "claude",
 *     model: "claude-sonnet-4",
 *     messages: [{ role: "user", content: "Tell me a story" }]
 *   },
 *   {
 *     onChunk: (chunk) => console.log(chunk),
 *     onComplete: (content) => console.log("Done:", content),
 *     onError: (error) => console.error(error)
 *   }
 * );
 *
 * @example
 * // Cache stats
 * const stats = await unifiedAIService.getCacheStats();
 * console.log(`Cache: ${stats.totalEntries} entries, ${stats.totalHits} hits`);
 */

import { invoke } from "@tauri-apps/api/core"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"

// Импорт типов - используем локальные определения
export type AIProvider = "openai" | "claude" | "grok" | "deepseek" | "ollama" | "custom"

export interface AIMessage {
  role: "user" | "assistant" | "system"
  content: string
  name?: string
}

export interface AITool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export type ToolChoice = "auto" | "any" | "none" | { type: "tool"; name: string }

export interface UnifiedAIRequest {
  provider: AIProvider
  model: string
  messages: AIMessage[]
  maxTokens?: number | null
  temperature?: number | null
  stream?: boolean
  system?: string | null
  tools?: AITool[] | null
  toolChoice?: ToolChoice | null
}

export interface UnifiedAIResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  stopReason?: string
  toolCalls?: Array<{
    name: string
    arguments: Record<string, unknown>
  }>
}

export interface CacheStats {
  totalEntries: number
  totalHits: number
  totalMisses: number
  expiredEntries: number
  cacheSize: number
}

export interface ProviderStatus {
  provider: AIProvider
  available: boolean
  models?: string[]
  error?: string
}

import { sanitizeTextInput, validateAIMessages } from "../utils/validation"

// ============================================================================
// TYPES
// ============================================================================

/**
 * Callbacks для streaming запросов
 */
export interface StreamingCallbacks {
  /** Вызывается при получении нового чанка данных */
  onChunk?: (chunk: string) => void
  /** Вызывается при завершении streaming */
  onComplete?: (fullContent: string) => void
  /** Вызывается при ошибке */
  onError?: (error: string) => void
}

/**
 * Payload для streaming событий
 */
interface StreamEventPayload {
  requestId: string
  chunk?: string // для ai-stream-chunk
  content?: string // для ai-stream-completed
  error?: string // для ai-stream-error
}

/**
 * Опции для отправки запроса с инструментами
 */
export interface SendRequestWithToolsOptions {
  apiKey: string
  provider: AIProvider
  model: string
  messages: AIMessage[]
  tools: AITool[]
  toolChoice?: ToolChoice
  system?: string
  maxTokens?: number
  temperature?: number
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Unified AI Service
 *
 * Обеспечивает единый интерфейс для работы с различными AI провайдерами.
 */
export class UnifiedAIService {
  private activeListeners: Map<string, UnlistenFn> = new Map()
  /** Таймауты для автоматической очистки старых listeners (TTL cleanup) */
  private listenerTimeouts: Map<string, NodeJS.Timeout> = new Map()
  /** TTL для listeners в миллисекундах (5 минут) */
  private readonly LISTENER_TTL_MS = 5 * 60 * 1000

  /**
   * Отправить обычный (non-streaming) запрос с кэшированием
   *
   * @param request - Унифицированный AI запрос
   * @returns Promise с ответом от AI
   *
   * @example
   * const response = await service.sendRequest({
   *   provider: "claude",
   *   model: "claude-sonnet-4",
   *   messages: [{ role: "user", content: "Hello!" }]
   * });
   * console.log(response.content);
   */
  async sendRequest(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    try {
      // Валидация входных данных
      validateAIMessages(request.messages)

      // Sanitize message content
      const sanitizedRequest = {
        ...request,
        messages: request.messages.map((msg: AIMessage) => ({
          ...msg,
          content: sanitizeTextInput(msg.content),
        })),
      }

      // Используем secure команду, которая автоматически получает API ключ из storage
      const response = await invoke<UnifiedAIResponse>("ai_send_secure_request", {
        request: sanitizedRequest,
      })
      return response
    } catch (error) {
      throw new Error(`Failed to send AI request: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Отправить обычный запрос с явным указанием API ключа
   *
   * @param apiKey - API ключ провайдера
   * @param request - Унифицированный AI запрос
   * @returns Promise с ответом от AI
   */
  async sendRequestWithApiKey(apiKey: string, request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    try {
      const response = await invoke<UnifiedAIResponse>("ai_send_unified_request", {
        apiKey,
        request,
      })
      return response
    } catch (error) {
      throw new Error(`Failed to send AI request: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Отправить streaming запрос
   *
   * Streaming события:
   * - ai-stream-started: запрос начат
   * - ai-stream-chunk: получен новый чанк данных
   * - ai-stream-completed: streaming завершен
   * - ai-stream-error: произошла ошибка
   *
   * @param request - Унифицированный AI запрос
   * @param callbacks - Callbacks для обработки streaming событий
   * @returns Promise с request_id для отслеживания событий
   *
   * @example
   * const requestId = await service.sendStreamingRequest(
   *   {
   *     provider: "claude",
   *     model: "claude-sonnet-4",
   *     messages: [{ role: "user", content: "Tell me a story" }],
   *     stream: true
   *   },
   *   {
   *     onChunk: (chunk) => console.log(chunk),
   *     onComplete: (content) => console.log("Final:", content)
   *   }
   * );
   */
  async sendStreamingRequest(request: UnifiedAIRequest, callbacks: StreamingCallbacks): Promise<string> {
    try {
      // Обеспечиваем что stream = true
      const streamRequest = { ...request, stream: true }

      // Отправляем streaming запрос (используем secure команду)
      const requestId = await invoke<string>("ai_send_secure_streaming_request", {
        request: streamRequest,
      })

      // Подписываемся на события
      await this.setupStreamingListeners(requestId, callbacks)

      return requestId
    } catch (error) {
      throw new Error(`Failed to send streaming request: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Отправить streaming запрос с явным указанием API ключа
   *
   * @param apiKey - API ключ провайдера
   * @param request - Унифицированный AI запрос
   * @param callbacks - Callbacks для обработки streaming событий
   * @returns Promise с request_id
   */
  async sendStreamingRequestWithApiKey(
    apiKey: string,
    request: UnifiedAIRequest,
    callbacks: StreamingCallbacks,
  ): Promise<string> {
    try {
      const streamRequest = { ...request, stream: true }

      const requestId = await invoke<string>("ai_send_streaming_request", {
        apiKey,
        request: streamRequest,
      })

      await this.setupStreamingListeners(requestId, callbacks)

      return requestId
    } catch (error) {
      throw new Error(`Failed to send streaming request: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Настроить listeners для streaming событий
   */
  private async setupStreamingListeners(requestId: string, callbacks: StreamingCallbacks): Promise<void> {
    // Cleanup existing listeners for this request
    await this.cleanupStreamingListeners(requestId)

    // Listen for stream chunks
    if (callbacks.onChunk) {
      const unlistenChunk = await listen<StreamEventPayload>("ai-stream-chunk", (event) => {
        if (event.payload.requestId === requestId && event.payload.chunk) {
          callbacks.onChunk?.(event.payload.chunk)
        }
      })
      this.activeListeners.set(`${requestId}-chunk`, unlistenChunk)
    }

    // Listen for completion
    if (callbacks.onComplete) {
      const unlistenComplete = await listen<StreamEventPayload>("ai-stream-completed", (event) => {
        if (event.payload.requestId === requestId && event.payload.content) {
          callbacks.onComplete?.(event.payload.content)
          // Cleanup listeners after completion
          this.cleanupStreamingListeners(requestId)
        }
      })
      this.activeListeners.set(`${requestId}-complete`, unlistenComplete)
    }

    // Listen for errors
    if (callbacks.onError) {
      const unlistenError = await listen<StreamEventPayload>("ai-stream-error", (event) => {
        if (event.payload.requestId === requestId && event.payload.error) {
          callbacks.onError?.(event.payload.error)
          // Cleanup listeners after error
          this.cleanupStreamingListeners(requestId)
        }
      })
      this.activeListeners.set(`${requestId}-error`, unlistenError)
    }

    // Устанавливаем TTL таймаут для автоматической очистки (защита от memory leaks)
    this.setupListenerTTL(requestId)
  }

  /**
   * Установить TTL таймаут для автоматической очистки listeners
   * Предотвращает memory leaks если listeners не были очищены вручную
   */
  private setupListenerTTL(requestId: string): void {
    // Очищаем существующий таймаут если есть
    const existingTimeout = this.listenerTimeouts.get(requestId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Создаем новый таймаут для автоматической очистки
    const timeout = setTimeout(() => {
      this.cleanupStreamingListeners(requestId)
    }, this.LISTENER_TTL_MS)

    this.listenerTimeouts.set(requestId, timeout)
  }

  /**
   * Очистить listeners для streaming запроса
   */
  private async cleanupStreamingListeners(requestId: string): Promise<void> {
    const keysToRemove: string[] = []

    // Convert iterator to array to avoid downlevelIteration issue
    const entries = Array.from(this.activeListeners.entries())
    for (const [key, unlisten] of entries) {
      if (key.startsWith(requestId)) {
        unlisten()
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => this.activeListeners.delete(key))

    // Очищаем TTL таймаут
    const timeout = this.listenerTimeouts.get(requestId)
    if (timeout) {
      clearTimeout(timeout)
      this.listenerTimeouts.delete(requestId)
    }
  }

  /**
   * Отправить запрос с инструментами (Function Calling / Claude Tool Use)
   *
   * @param options - Опции запроса с инструментами
   * @returns Promise с ответом, который может содержать tool calls
   *
   * @example
   * const response = await service.sendRequestWithTools({
   *   apiKey: "sk-...",
   *   provider: "claude",
   *   model: "claude-sonnet-4",
   *   messages: [{ role: "user", content: "What's the weather?" }],
   *   tools: [{
   *     name: "get_weather",
   *     description: "Get current weather",
   *     input_schema: { type: "object", properties: { location: { type: "string" } } }
   *   }]
   * });
   *
   * if (response.toolCalls) {
   *   console.log("AI wants to call:", response.toolCalls);
   * }
   */
  async sendRequestWithTools(options: SendRequestWithToolsOptions): Promise<UnifiedAIResponse> {
    try {
      const response = await invoke<UnifiedAIResponse>("ai_send_request_with_tools", {
        apiKey: options.apiKey,
        provider: options.provider,
        model: options.model,
        messages: options.messages,
        tools: options.tools,
        toolChoice: options.toolChoice ?? null,
        system: options.system ?? null,
        maxTokens: options.maxTokens ?? null,
        temperature: options.temperature ?? null,
      })
      return response
    } catch (error) {
      throw new Error(`Failed to send request with tools: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Отправить запрос с инструментами используя stored API key
   *
   * @param provider - AI провайдер
   * @param model - Модель для использования
   * @param messages - Сообщения
   * @param tools - Инструменты
   * @param options - Дополнительные опции
   * @returns Promise с ответом
   */
  async sendSecureRequestWithTools(
    provider: AIProvider,
    model: string,
    messages: AIMessage[],
    tools: AITool[],
    options?: {
      toolChoice?: ToolChoice
      system?: string
      maxTokens?: number
      temperature?: number
    },
  ): Promise<UnifiedAIResponse> {
    try {
      const response = await invoke<UnifiedAIResponse>("ai_send_secure_request_with_tools", {
        provider,
        model,
        messages,
        tools,
        toolChoice: options?.toolChoice ?? null,
        system: options?.system ?? null,
        maxTokens: options?.maxTokens ?? null,
        temperature: options?.temperature ?? null,
      })
      return response
    } catch (error) {
      throw new Error(
        `Failed to send secure request with tools: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Получить статистику кэша
   *
   * @returns Promise с статистикой кэша
   *
   * @example
   * const stats = await service.getCacheStats();
   * console.log(`Cache has ${stats.totalEntries} entries`);
   * console.log(`Cache hit rate: ${stats.totalHits} hits`);
   * console.log(`Expired entries: ${stats.expiredEntries}`);
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const stats = await invoke<CacheStats>("ai_get_cache_stats")
      return stats
    } catch (error) {
      throw new Error(`Failed to get cache stats: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Очистить весь кэш
   *
   * @returns Promise с количеством удаленных записей
   *
   * @example
   * const cleared = await service.clearCache();
   * console.log(`Cleared ${cleared} cache entries`);
   */
  async clearCache(): Promise<number> {
    try {
      const count = await invoke<number>("ai_clear_cache")
      return count
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Очистить просроченные записи кэша
   *
   * @returns Promise с количеством удаленных записей
   *
   * @example
   * const cleaned = await service.cleanupExpiredCache();
   * console.log(`Removed ${cleaned} expired entries`);
   */
  async cleanupExpiredCache(): Promise<number> {
    try {
      const count = await invoke<number>("ai_cleanup_expired_cache")
      return count
    } catch (error) {
      throw new Error(`Failed to cleanup expired cache: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Проверить доступность провайдера
   *
   * @param provider - AI провайдер
   * @param apiKey - API ключ для валидации
   * @returns Promise со статусом провайдера
   *
   * @example
   * const status = await service.validateProvider("claude", "sk-ant-...");
   * if (status.available) {
   *   console.log("Available models:", status.models);
   * } else {
   *   console.error("Error:", status.error);
   * }
   */
  async validateProvider(provider: AIProvider, apiKey: string): Promise<ProviderStatus> {
    try {
      const status = await invoke<ProviderStatus>("ai_validate_provider", {
        provider,
        apiKey,
      })
      return status
    } catch (error) {
      throw new Error(`Failed to validate provider: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Получить список поддерживаемых провайдеров
   *
   * @returns Promise с массивом поддерживаемых провайдеров
   *
   * @example
   * const providers = await service.getSupportedProviders();
   * console.log("Supported:", providers); // ["claude", "openai", "deepseek", "ollama"]
   */
  async getSupportedProviders(): Promise<AIProvider[]> {
    try {
      const providers = await invoke<AIProvider[]>("ai_get_supported_providers")
      return providers
    } catch (error) {
      throw new Error(`Failed to get supported providers: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Получить доступные модели для провайдера
   *
   * @param provider - AI провайдер
   * @returns Promise с массивом доступных моделей
   *
   * @example
   * const models = await service.getProviderModels("claude");
   * console.log("Available models:", models);
   * // ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", ...]
   */
  async getProviderModels(provider: AIProvider): Promise<string[]> {
    try {
      const models = await invoke<string[]>("ai_get_provider_models", { provider })
      return models
    } catch (error) {
      throw new Error(`Failed to get provider models: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Проверить здоровье всех провайдеров
   *
   * @param providersWithKeys - Массив кортежей (provider, apiKey?)
   * @returns Promise с массивом статусов провайдеров
   *
   * @example
   * const health = await service.checkProvidersHealth([
   *   ["claude", "sk-ant-..."],
   *   ["openai", "sk-..."],
   *   ["ollama", null] // Ollama не требует API ключ
   * ]);
   *
   * health.forEach(status => {
   *   console.log(`${status.provider}: ${status.available ? "OK" : "Error"}`);
   * });
   */
  async checkProvidersHealth(providersWithKeys: Array<[AIProvider, string | null]>): Promise<ProviderStatus[]> {
    try {
      const statuses = await invoke<ProviderStatus[]>("ai_check_providers_health", {
        providersWithKeys,
      })
      return statuses
    } catch (error) {
      throw new Error(`Failed to check providers health: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Отправить запрос с автоматическим fallback на другие провайдеры
   *
   * Пытается отправить запрос к провайдерам по порядку, пока не получит успешный ответ.
   *
   * @param providersWithKeys - Массив кортежей (provider, apiKey) в порядке приоритета
   * @param request - Унифицированный AI запрос
   * @returns Promise с ответом от первого успешного провайдера
   *
   * @example
   * const response = await service.sendRequestWithFallback(
   *   [
   *     ["claude", "sk-ant-..."],
   *     ["openai", "sk-..."],
   *     ["ollama", ""]
   *   ],
   *   {
   *     provider: "claude", // preferred, but will fallback
   *     model: "claude-sonnet-4",
   *     messages: [{ role: "user", content: "Hello" }]
   *   }
   * );
   */
  async sendRequestWithFallback(
    providersWithKeys: Array<[AIProvider, string]>,
    request: UnifiedAIRequest,
  ): Promise<UnifiedAIResponse> {
    try {
      const response = await invoke<UnifiedAIResponse>("ai_send_request_with_fallback", {
        providersWithKeys,
        request,
      })
      return response
    } catch (error) {
      throw new Error(`Failed to send request with fallback: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Cleanup all active listeners
   * Вызывается при unmount компонента или завершении работы
   */
  async cleanup(): Promise<void> {
    // Convert iterator to array to avoid downlevelIteration issue
    const listeners = Array.from(this.activeListeners.values())
    for (const unlisten of listeners) {
      unlisten()
    }
    this.activeListeners.clear()

    // Очищаем все TTL таймауты
    const timeouts = Array.from(this.listenerTimeouts.values())
    for (const timeout of timeouts) {
      clearTimeout(timeout)
    }
    this.listenerTimeouts.clear()
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance of UnifiedAIService
 *
 * @example
 * import { unifiedAIService } from "@/domains/ai-services/services/unified-ai-service"
 *
 * const response = await unifiedAIService.sendRequest({
 *   provider: "claude",
 *   model: "claude-sonnet-4",
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 */
export const unifiedAIService = new UnifiedAIService()

// Export class for testing
export { UnifiedAIService as UnifiedAIServiceClass }
