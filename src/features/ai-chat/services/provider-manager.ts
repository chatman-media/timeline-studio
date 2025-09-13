/**
 * Менеджер провайдеров AI для координации работы с разными AI сервисами
 * Извлечен из UnifiedAIService для улучшения архитектуры
 */

import type { AiMessage } from "../types/ai-message"
import type { StreamingOptions } from "../types/streaming"
import type { AIProvider } from "./model-configuration-manager"

// Опции для запроса
export interface ProviderRequestOptions {
  temperature?: number
  maxTokens?: number
  timeout?: number
}

// Опции для потокового запроса
export interface ProviderStreamingOptions extends ProviderRequestOptions, StreamingOptions {}

// Результат запроса провайдера
export interface ProviderResponse {
  content: string
  provider: AIProvider
  model: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

// Статус провайдера
export interface ProviderStatus {
  provider: AIProvider
  available: boolean
  hasApiKey: boolean
  lastChecked: Date
  error?: string
  models?: string[]
}

// Интерфейс для базового AI провайдера
export interface BaseAIProvider {
  name: AIProvider
  sendRequest(model: string, messages: AiMessage[], options?: ProviderRequestOptions): Promise<string>
  sendStreamingRequest(model: string, messages: AiMessage[], options?: ProviderStreamingOptions): Promise<void>
  isAvailable(): Promise<boolean>
  hasApiKey(...args: any[]): Promise<boolean>
  getInstalledModels?(): Promise<Array<{ name: string; details: { parameter_size: string } }>>
}

/**
 * Менеджер провайдеров AI
 * Теперь использует shared AI services как основу
 */
export class ProviderManager {
  private static instance: ProviderManager
  private providers: Map<AIProvider, BaseAIProvider>
  private statusCache: Map<AIProvider, ProviderStatus>
  private cacheTimeout = 60 * 1000 // 1 минута
  private sharedAIService: any = null

  private constructor() {
    this.providers = new Map()
    this.statusCache = new Map()
    // Асинхронная инициализация провайдеров
    this.initializeProviders().catch((error) => {
      console.error("Ошибка инициализации провайдеров:", error)
    })
  }

  /**
   * Получить экземпляр менеджера (Singleton)
   */
  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }

  /**
   * Инициализация провайдеров
   * Использует shared AI services
   */
  private async initializeProviders(): Promise<void> {
    const maxAttempts = 3
    const retryDelayMs = 1500

    const attemptInit = async (attempt: number) => {
      try {
        // Импорт shared AI services
        console.debug(`ProviderManager: initializeProviders attempt ${attempt} - importing shared services`)
        const { getAIContainer } = await import("@/shared/services/ai")
        const aiContainer = getAIContainer()
        this.sharedAIService = await aiContainer.resolve("UnifiedAIService")
        console.info("ProviderManager: shared UnifiedAIService resolved")

        // Создаем адаптеры для shared провайдеров
        this.providers.set("claude", {
          name: "claude",
          sendRequest: this.createSharedSendRequest("claude"),
          sendStreamingRequest: this.createSharedStreamingRequest("claude"),
          isAvailable: () => this.sharedAIService.isModelAvailable("claude-4-sonnet-latest"),
          hasApiKey: () => this.sharedAIService.isModelAvailable("claude-4-sonnet-latest"),
        })

        this.providers.set("openai", {
          name: "openai",
          sendRequest: this.createSharedSendRequest("openai"),
          sendStreamingRequest: this.createSharedStreamingRequest("openai"),
          isAvailable: (model?: string) => this.sharedAIService.isModelAvailable(model || "gpt-4o"),
          hasApiKey: (model?: string) => this.sharedAIService.isModelAvailable(model || "gpt-4o"),
        })

        this.providers.set("deepseek", {
          name: "deepseek",
          sendRequest: this.createSharedSendRequest("deepseek"),
          sendStreamingRequest: this.createSharedStreamingRequest("deepseek"),
          isAvailable: () => this.sharedAIService.isModelAvailable("deepseek-chat"),
          hasApiKey: () => this.sharedAIService.isModelAvailable("deepseek-chat"),
        })

        this.providers.set("ollama", {
          name: "ollama",
          sendRequest: this.createSharedSendRequest("ollama"),
          sendStreamingRequest: this.createSharedStreamingRequest("ollama"),
          isAvailable: () => this.sharedAIService.isModelAvailable("llama3.2:latest"),
          hasApiKey: () => Promise.resolve(true), // Ollama не требует API ключа
          getInstalledModels: async () => {
            try {
              const models = await this.sharedAIService.getAvailableModels()
              return models
                .filter((m: any) => m.provider === "ollama")
                .map((m: any) => ({
                  name: m.model,
                  details: { parameter_size: m.size || "unknown" },
                }))
            } catch (e) {
              console.warn("ProviderManager: failed to get Ollama installed models:", e)
              return []
            }
          },
        })

        console.info("ProviderManager: providers initialized successfully")
        return true
      } catch (error) {
        console.warn(`ProviderManager: initializeProviders attempt ${attempt} failed:`, error)
        return false
      }
    }

    // Попытки инициализации с экспоненциальным бэкоффом
    for (let i = 1; i <= maxAttempts; i++) {
      const ok = await attemptInit(i)
      if (ok) return
      if (i < maxAttempts) {
        const delay = retryDelayMs * i
        console.debug(`ProviderManager: retrying initialization in ${delay}ms (attempt ${i + 1}/${maxAttempts})`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }

    // Если не удалось инициализировать после попыток — выставляем предупреждение и оставляем fallback
    console.error(
      "ProviderManager: failed to initialize shared AI providers after retries; providers map may be incomplete",
    )
  }

  /**
   * Создать метод sendRequest для shared провайдера
   */
  private createSharedSendRequest(providerName: string) {
    return async (model: string, messages: AiMessage[], options?: ProviderRequestOptions): Promise<string> => {
      if (!this.sharedAIService) {
        throw new Error(`Shared AI service не инициализирован для провайдера ${providerName}`)
      }

      const response = await this.sharedAIService.sendRequest(model, messages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        timeout: options?.timeout,
      })

      return response.content
    }
  }

  /**
   * Создать метод sendStreamingRequest для shared провайдера
   */
  private createSharedStreamingRequest(providerName: string) {
    return async (model: string, messages: AiMessage[], options?: ProviderStreamingOptions): Promise<void> => {
      if (!this.sharedAIService) {
        throw new Error(`Shared AI service не инициализирован для провайдера ${providerName}`)
      }

      return this.sharedAIService.sendStreamingRequest(model, messages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        timeout: options?.timeout,
        onContent: options?.onContent,
        onComplete: options?.onComplete,
        onError: options?.onError,
        signal: options?.signal,
      })
    }
  }

  /**
   * Получить провайдера
   */
  public getProvider(provider: AIProvider): BaseAIProvider | null {
    return this.providers.get(provider) || null
  }

  /**
   * Получить все провайдеры
   */
  public getAllProviders(): Map<AIProvider, BaseAIProvider> {
    return new Map(this.providers)
  }

  /**
   * Отправить запрос через провайдера
   */
  public async sendRequest(
    provider: AIProvider,
    model: string,
    messages: AiMessage[],
    options: ProviderRequestOptions = {},
  ): Promise<ProviderResponse> {
    const aiProvider = this.getProvider(provider)
    if (!aiProvider) {
      throw new Error(`Провайдер ${provider} недоступен`)
    }

    const startTime = Date.now()

    try {
      let content: string

      // Адаптируем опции для каждого провайдера
      switch (provider) {
        case "claude":
          content = await aiProvider.sendRequest(model, messages, {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          })
          break

        case "openai":
          content = await aiProvider.sendRequest(model, messages, {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          })
          break

        case "deepseek":
          content = await aiProvider.sendRequest(model, messages, {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          })
          break

        case "ollama":
          content = await aiProvider.sendRequest(model, messages, {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          })
          break

        default:
          throw new Error(`Неподдерживаемый провайдер: ${provider}`)
      }

      return {
        content,
        provider,
        model,
        // usage информация может быть добавлена позже
      }
    } catch (error) {
      // Обновляем статус провайдера при ошибке
      await this.updateProviderStatus(provider)
      throw error
    }
  }

  /**
   * Отправить потоковый запрос через провайдера
   */
  public async sendStreamingRequest(
    provider: AIProvider,
    model: string,
    messages: AiMessage[],
    options: ProviderStreamingOptions = {},
  ): Promise<void> {
    const aiProvider = this.getProvider(provider)
    if (!aiProvider) {
      throw new Error(`Провайдер ${provider} недоступен`)
    }

    try {
      // Адаптируем опции для каждого провайдера
      const adaptedOptions = this.adaptStreamingOptions(provider, options)
      await aiProvider.sendStreamingRequest(model, messages, adaptedOptions)
    } catch (error) {
      // Обновляем статус провайдера при ошибке
      await this.updateProviderStatus(provider)
      throw error
    }
  }

  /**
   * Адаптация опций стриминга для разных провайдеров
   */
  private adaptStreamingOptions(provider: AIProvider, options: ProviderStreamingOptions): any {
    const baseOptions = {
      onContent: options.onContent,
      onComplete: options.onComplete,
      onError: options.onError,
      signal: options.signal,
    }

    switch (provider) {
      case "claude":
      case "openai":
      case "deepseek":
        return {
          ...baseOptions,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }

      case "ollama":
        return {
          ...baseOptions,
          temperature: options.temperature,
          num_ctx: options.maxTokens,
        }

      default:
        return baseOptions
    }
  }

  /**
   * Проверить доступность провайдера
   */
  public async isProviderAvailable(provider: AIProvider): Promise<boolean> {
    const aiProvider = this.getProvider(provider)
    if (!aiProvider) {
      return false
    }

    try {
      return await aiProvider.isAvailable()
    } catch (error) {
      console.warn(`Ошибка проверки доступности провайдера ${provider}:`, error)
      return false
    }
  }

  /**
   * Получить статус провайдера (с кэшированием)
   */
  public async getProviderStatus(provider: AIProvider, forceRefresh = false): Promise<ProviderStatus> {
    // Проверяем кэш
    const cached = this.statusCache.get(provider)
    if (!forceRefresh && cached && Date.now() - cached.lastChecked.getTime() < this.cacheTimeout) {
      return cached
    }

    const status = await this.updateProviderStatus(provider)
    return status
  }

  /**
   * Обновить статус провайдера
   */
  private async updateProviderStatus(provider: AIProvider): Promise<ProviderStatus> {
    const aiProvider = this.getProvider(provider)
    const status: ProviderStatus = {
      provider,
      available: false,
      hasApiKey: false,
      lastChecked: new Date(),
    }

    if (!aiProvider) {
      status.error = "Провайдер не найден"
      this.statusCache.set(provider, status)
      console.warn(`ProviderManager: updateProviderStatus - provider ${provider} not found`)
      return status
    }

    // Вспомогательная функция с retry для вызовов провайдера
    const withRetry = async <T>(fn: () => Promise<T>, label: string, attempts = 2): Promise<T> => {
      let lastErr: unknown = null
      for (let i = 1; i <= attempts; i++) {
        try {
          if (i > 1) {
            console.debug(`ProviderManager: retrying ${label} for ${provider} (attempt ${i}/${attempts})`)
          }
          const res = await fn()
          return res
        } catch (err) {
          lastErr = err
          console.warn(`ProviderManager: ${label} attempt ${i} failed for ${provider}:`, err)
          // небольшая пауза между попытками
          if (i < attempts) await new Promise((r) => setTimeout(r, 300 * i))
        }
      }
      throw lastErr
    }

    try {
      // Проверяем наличие API ключа (с ретраем)
      try {
        status.hasApiKey = !!(await withRetry(() => aiProvider.hasApiKey(), "hasApiKey", 2))
      } catch (e) {
        console.warn(`ProviderManager: hasApiKey check failed for ${provider}:`, e)
        status.hasApiKey = false
      }

      // Проверяем доступность (с ретраем)
      try {
        status.available = !!(await withRetry(() => aiProvider.isAvailable(), "isAvailable", 2))
      } catch (e) {
        console.warn(`ProviderManager: isAvailable check failed for ${provider}:`, e)
        status.available = false
      }

      // Получаем модели для Ollama
      if (provider === "ollama" && aiProvider.getInstalledModels) {
        try {
          const models = await withRetry(() => aiProvider.getInstalledModels!(), "getInstalledModels", 2)
          status.models = models.map((m) => m.name)
        } catch (error) {
          console.warn(`ProviderManager: failed to list Ollama models for ${provider}:`, error)
          status.models = []
        }
      }
    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error)
      status.available = false
      console.error(`ProviderManager: updateProviderStatus unexpected error for ${provider}:`, error)
    }

    // Кэшируем результат
    this.statusCache.set(provider, status)
    console.debug(`ProviderManager: updated status for ${provider}:`, status)
    return status
  }

  /**
   * Получить статус всех провайдеров
   */
  public async getAllProviderStatuses(forceRefresh = false): Promise<Map<AIProvider, ProviderStatus>> {
    const statuses = new Map<AIProvider, ProviderStatus>()

    const providers: AIProvider[] = ["claude", "openai", "deepseek", "ollama"]

    await Promise.all(
      providers.map(async (provider) => {
        const status = await this.getProviderStatus(provider, forceRefresh)
        statuses.set(provider, status)
      }),
    )

    return statuses
  }

  /**
   * Получить доступные провайдеры
   */
  public async getAvailableProviders(): Promise<AIProvider[]> {
    const statuses = await this.getAllProviderStatuses()
    return Array.from(statuses.entries())
      .filter(([, status]) => status.available)
      .map(([provider]) => provider)
  }

  /**
   * Найти лучший доступный провайдер для задачи
   */
  public async getBestProviderForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options: {
      preferLocal?: boolean
      requiresStreaming?: boolean
    } = {},
  ): Promise<AIProvider | null> {
    const availableProviders = await this.getAvailableProviders()

    if (availableProviders.length === 0) {
      return null
    }

    // Фильтруем по требованиям
    let candidates = availableProviders

    if (options.preferLocal) {
      const localProviders = candidates.filter((p) => p === "ollama")
      if (localProviders.length > 0) {
        candidates = localProviders
      }
    }

    // Сортируем по предпочтениям для разных задач
    const providerOrder = this.getProviderOrderForTask(task)

    for (const provider of providerOrder) {
      if (candidates.includes(provider)) {
        return provider
      }
    }

    return candidates[0] || null
  }

  /**
   * Получить порядок предпочтений провайдеров для задачи
   */
  private getProviderOrderForTask(task: string): AIProvider[] {
    switch (task) {
      case "analysis":
        return ["claude", "openai", "deepseek", "ollama"]

      case "generation":
        return ["claude", "openai", "deepseek", "ollama"]

      case "code":
        return ["deepseek", "claude", "openai", "ollama"]
      default:
        return ["claude", "openai", "deepseek", "ollama"]
    }
  }

  /**
   * Очистить кэш статусов
   */
  public clearStatusCache(): void {
    this.statusCache.clear()
  }

  /**
   * Получить статистику кэша
   */
  public getCacheStats(): {
    cachedProviders: number
    cacheTimeout: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    const statuses = Array.from(this.statusCache.values())

    return {
      cachedProviders: this.statusCache.size,
      cacheTimeout: this.cacheTimeout,
      oldestEntry:
        statuses.length > 0 ? new Date(Math.min(...statuses.map((s) => s.lastChecked.getTime()))) : undefined,
      newestEntry:
        statuses.length > 0 ? new Date(Math.max(...statuses.map((s) => s.lastChecked.getTime()))) : undefined,
    }
  }

  /**
   * Тест соединения с провайдером
   */
  public async testConnection(provider: AIProvider): Promise<{
    success: boolean
    responseTime?: number
    error?: string
  }> {
    const aiProvider = this.getProvider(provider)
    if (!aiProvider) {
      return { success: false, error: "Провайдер не найден" }
    }

    const startTime = Date.now()

    try {
      // Отправляем простой тестовый запрос
      await aiProvider.sendRequest(
        provider === "claude"
          ? "claude-4-sonnet"
          : provider === "openai"
            ? "gpt-3.5-turbo"
            : provider === "deepseek"
              ? "deepseek-chat"
              : "llama2", // для ollama
        [{ role: "user", content: "Тест соединения. Ответь одним словом: OK" }],
        { temperature: 0, maxTokens: 10 },
      )

      return {
        success: true,
        responseTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

/**
 * Singleton instance holder and debug helpers
 *
 * Expose `getProviderManager()` so other runtime code (or dev console) can access
 * the ProviderManager singleton. Attach a debug handle to `window.__providerManager`
 * in browser environments for convenient inspection.
 *
 * Also provide `debugListProviders()` helper that returns provider instances and
 * current statuses (force-refresh) — useful to verify Ollama visibility.
 */

let providerManagerInstance: ProviderManager | null = null

export function getProviderManager(): ProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = ProviderManager.getInstance()
  }

  // Attach to window for interactive debugging in browser (dev only)
  try {
    if (typeof window !== "undefined") {
      ;(window as any).__providerManager = providerManagerInstance
    }
  } catch {
    // ignore
  }

  return providerManagerInstance
}

/**
 * Debug helper: returns a simple map of providers and their latest statuses.
 * Also assigns the result to `window.__providerStatuses` for easy inspection.
 */
export async function debugListProviders() {
  const mgr = getProviderManager()
  const providers = mgr.getAllProviders()
  const statuses = await mgr.getAllProviderStatuses(true)

  const out: Record<string, any> = {}
  for (const [key, prov] of providers) {
    out[key] = {
      hasInstance: !!prov,
      status: statuses.get(key),
    }
  }

  try {
    if (typeof window !== "undefined") {
      ;(window as any).__providerStatuses = out
    }
  } catch {
    // ignore
  }

  return out
}
