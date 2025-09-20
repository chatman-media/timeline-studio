/**
 * Enhanced Unified AI Service
 * Объединенная версия с лучшими возможностями из ai-chat и shared
 */

import { getAIProviderFactory } from "../providers/factory"
import type {
  AIProviderFactory,
  AiMessage,
  AiRequestOptions,
  AiResponse,
  IAIProvider,
  IUnifiedAIService,
  ModelConfiguration,
  ModelManager,
  StreamingOptions,
} from "../types"
import { ModelManagerImpl } from "./model-manager"

// Расширенные типы для объединенного сервиса
export interface UnifiedResponse extends AiResponse {
  responseTime: number
  model: string
  provider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cached?: boolean
}

export interface UnifiedRequestOptions extends AiRequestOptions {
  // Fallback опции из ai-chat версии
  fallbackModels?: string[]
  retryAttempts?: number
  retryDelay?: number

  // Кэширование из shared версии
  enableCache?: boolean
  cacheTTL?: number

  // Content Intelligence интеграция
  enableContentIntelligence?: boolean
  contentContext?: any
}

interface CacheEntry {
  response: UnifiedResponse
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface Dependencies {
  providerFactory?: AIProviderFactory
  modelManager?: ModelManager
  contentIntelligenceService?: any
}

export class EnhancedUnifiedAIService implements IUnifiedAIService {
  private static instance: EnhancedUnifiedAIService | null = null

  // Кэширование (улучшенное из обеих версий)
  private cache = new Map<string, CacheEntry>()
  private requestCounts = new Map<string, number>()
  private responseTimeHistory = new Map<string, number[]>()
  private readonly CACHE_TTL = 600000 // 10 минут
  private readonly MAX_CACHE_SIZE = 2000
  private readonly MAX_RETRY_ATTEMPTS = 3

  // Зависимости
  private providerFactory!: AIProviderFactory
  private modelManager!: ModelManager
  private contentIntelligenceService?: any

  // Singleton + DI support
  public static getInstance(dependencies?: Dependencies): EnhancedUnifiedAIService {
    if (!EnhancedUnifiedAIService.instance) {
      EnhancedUnifiedAIService.instance = new EnhancedUnifiedAIService(dependencies)
    }
    return EnhancedUnifiedAIService.instance
  }

  constructor(dependencies?: Dependencies) {
    this.providerFactory = dependencies?.providerFactory as AIProviderFactory
    this.modelManager = dependencies?.modelManager as ModelManager
    this.contentIntelligenceService = dependencies?.contentIntelligenceService

    if (!this.providerFactory || !this.modelManager) {
      console.warn("EnhancedUnifiedAIService created without dependencies, some features will be unavailable")
    }

    // Автоочистка кэша каждые 5 минут
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanupCache(), 300000)
    }
  }

  private ensureDependencies(): void {
    // Ленивая инициализация зависимостей, если DI контейнер не используется
    if (!this.providerFactory) {
      this.providerFactory = getAIProviderFactory() as AIProviderFactory
    }
    if (!this.modelManager) {
      const factory = this.providerFactory || (getAIProviderFactory() as AIProviderFactory)
      this.modelManager = new ModelManagerImpl(factory)
    }
  }

  async sendRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions = {},
  ): Promise<UnifiedResponse> {
    const startTime = Date.now()

    // Проверяем кэш
    if (options.enableCache !== false) {
      const cacheKey = this.getCacheKey(model, messages, options)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        const result: UnifiedResponse = {
          ...cached,
          cached: true,
          responseTime: Date.now() - startTime,
        }
        this.updateRequestStats(model, result.responseTime)
        return result
      }
    }

    // Логика fallback из ai-chat версии
    const modelsToTry = [model, ...(options.fallbackModels || [])]
    const maxRetries = options.retryAttempts || this.MAX_RETRY_ATTEMPTS

    let lastError: Error | null = null

    for (const currentModel of modelsToTry) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Получаем провайдер для модели
          const provider = await this.getProviderForModel(currentModel)

          // Проверяем доступность
          const isAvailable = await provider.isAvailable()
          if (!isAvailable && modelsToTry.length > 1) {
            throw new Error(`Provider for model ${currentModel} is not available`)
          }

          // Отправляем запрос
          const response = await provider.sendRequest(currentModel, messages, options)

          const responseTime = Date.now() - startTime
          const unifiedResponse: UnifiedResponse = {
            ...response,
            responseTime,
            cached: false,
          }

          // Обновляем статистику
          this.updateRequestStats(currentModel, responseTime)

          // Кэшируем результат
          if (options.enableCache !== false) {
            const cacheKey = this.getCacheKey(currentModel, messages, options)
            this.setToCache(cacheKey, unifiedResponse, options.cacheTTL || this.CACHE_TTL)
          }

          return unifiedResponse
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error")

          // Ждем перед повторной попыткой
          if (attempt < maxRetries) {
            const delay = (options.retryDelay || 1000) * attempt
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }
    }

    throw lastError || new Error("All providers failed")
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    // Гарантируем наличие зависимостей перед использованием
    this.ensureDependencies()
    const modelsToTry = [model, ...(options.fallbackModels || [])]
    let lastError: Error | null = null

    for (const currentModel of modelsToTry) {
      try {
        const provider = await this.getProviderForModel(currentModel)

        const isAvailable = await provider.isAvailable()
        if (!isAvailable && modelsToTry.length > 1) {
          throw new Error(`Provider for model ${currentModel} is not available`)
        }

        // Оборачиваем callbacks для статистики
        const wrappedOptions = {
          ...options,
          onComplete: (response: AiResponse) => {
            const responseTime = Date.now() - (options as any).startTime || 0
            this.updateRequestStats(currentModel, responseTime)
            if (options.onComplete) {
              options.onComplete(response)
            }
          },
        }

        // Записываем время начала
        ;(wrappedOptions as any).startTime = Date.now()

        await provider.sendStreamingRequest(currentModel, messages, wrappedOptions)
        return // Успешно выполнен
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")

        if (options.onError && modelsToTry.indexOf(currentModel) === modelsToTry.length - 1) {
          options.onError(lastError)
        }
      }
    }

    throw lastError || new Error("All streaming providers failed")
  }

  async getAvailableModels(): Promise<ModelConfiguration[]> {
    if (!this.modelManager) {
      try {
        this.ensureDependencies()
      } catch {
        console.warn("ModelManager not initialized, returning empty models list")
        return []
      }
    }
    return await this.modelManager.getAvailableModels()
  }

  async getBestModelForTask(task: string, taskOptions?: any): Promise<ModelConfiguration | null> {
    if (!this.modelManager) {
      console.warn("ModelManager not initialized, returning null")
      return null
    }
    return await this.modelManager.getBestModelForTask(task as any, taskOptions)
  }

  async getProviderStatuses(): Promise<Record<string, boolean>> {
    if (!this.providerFactory) {
      try {
        this.ensureDependencies()
      } catch {
        console.warn("ProviderFactory not initialized, returning empty statuses")
        return {}
      }
    }

    const providers = ["claude", "openai", "deepseek", "ollama", "grok"]
    const statuses: Record<string, boolean> = {}

    await Promise.all(
      providers.map(async (provider) => {
        try {
          statuses[provider] = await this.providerFactory.isProviderAvailable(provider)
        } catch {
          statuses[provider] = false
        }
      }),
    )

    return statuses
  }

  // Content Intelligence интеграция (из ai-chat версии)
  async analyzeContentIntelligence(
    content: any,
    analysisType: "video" | "audio" | "text" | "multimodal" = "multimodal",
  ): Promise<any> {
    if (!this.contentIntelligenceService) {
      throw new Error("Content Intelligence service not available")
    }

    try {
      return await this.contentIntelligenceService.analyze(content, analysisType)
    } catch (error) {
      console.error("Content Intelligence analysis failed:", error)
      throw error
    }
  }

  getContentIntelligenceTools(): any[] {
    if (!this.contentIntelligenceService) {
      return []
    }
    return this.contentIntelligenceService.getAvailableTools()
  }

  // Улучшенные утилиты
  async estimateTokens(text: string, model?: string): Promise<number> {
    if (model) {
      const provider = await this.getProviderForModel(model)
      if (provider.estimateTokens) {
        return provider.estimateTokens(text)
      }
    }

    // Fallback: общая оценка
    return Math.ceil(text.length / 4)
  }

  async getModelLimits(model: string): Promise<{ maxTokens: number; maxRequestsPerMinute?: number }> {
    const provider = await this.getProviderForModel(model)
    const maxTokens = provider.getMaxTokens?.(model) || 4096

    // Примерные rate limits
    const rateLimits: Record<string, number> = {
      "gpt-4o": 500,
      "gpt-4-turbo": 500,
      "claude-4-sonnet-latest": 1000,
      "claude-3-5-sonnet-20241022": 1000,
      "grok-2": 600,
      "grok-2-mini": 1000,
    }

    return {
      maxTokens,
      maxRequestsPerMinute: rateLimits[model],
    }
  }

  async getModelInfo(model: string): Promise<ModelConfiguration | null> {
    const models = await this.getAvailableModels()
    return models.find((m) => m.model === model) || null
  }

  // Расширенное кэширование
  clearCache(): void {
    this.cache.clear()
    this.requestCounts.clear()
    this.responseTimeHistory.clear()
  }

  getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalRequests: number
    averageResponseTime: number
    modelStats: Record<string, { requests: number; averageTime: number }>
  } {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0)
    const cacheHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0)

    // Статистика по моделям
    const modelStats: Record<string, { requests: number; averageTime: number }> = {}
    for (const [model, times] of this.responseTimeHistory.entries()) {
      const requests = this.requestCounts.get(model) || 0
      const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
      modelStats[model] = { requests, averageTime }
    }

    const averageResponseTime = Object.values(modelStats).reduce(
      (sum, stat, _index, arr) => sum + stat.averageTime / arr.length,
      0,
    )

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      totalRequests,
      averageResponseTime,
      modelStats,
    }
  }

  // Приватные методы
  private async getProviderForModel(model: string): Promise<IAIProvider> {
    if (!this.providerFactory) {
      this.ensureDependencies()
    }
    const provider = this.providerFactory.getProviderByModel(model)
    if (!provider) {
      throw new Error(`No provider found for model: ${model}`)
    }
    return provider
  }

  private getCacheKey(model: string, messages: AiMessage[], options: UnifiedRequestOptions): string {
    const key = JSON.stringify({
      model,
      messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      systemPrompt: options.systemPrompt,
    })
    return this.hashString(key)
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash
    }
    return hash.toString(36)
  }

  private getFromCache(key: string): UnifiedResponse | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Обновляем статистику доступа
    entry.accessCount++
    entry.lastAccessed = now

    return entry.response
  }

  private setToCache(key: string, response: UnifiedResponse, ttl: number): void {
    // Очищаем кэш если он переполнен
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache()
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    })
  }

  private cleanupCache(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())

    // Удаляем устаревшие записи
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    })

    // Если кэш все еще переполнен, удаляем старые записи
    if (this.cache.size > this.MAX_CACHE_SIZE * 0.8) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

      const toDelete = Math.floor(this.cache.size * 0.2)
      sortedEntries.slice(0, toDelete).forEach(([key]) => {
        this.cache.delete(key)
      })
    }
  }

  private updateRequestStats(model: string, responseTime: number): void {
    // Обновляем счетчики запросов
    const count = this.requestCounts.get(model) || 0
    this.requestCounts.set(model, count + 1)

    // Обновляем историю времени ответа
    const history = this.responseTimeHistory.get(model) || []
    history.push(responseTime)

    // Ограничиваем размер истории
    if (history.length > 100) {
      history.shift()
    }

    this.responseTimeHistory.set(model, history)
  }

  // Дополнительные методы для совместимости
  getAllAITools(): any[] {
    const tools = []

    // Добавляем Content Intelligence tools
    if (this.contentIntelligenceService) {
      tools.push(...this.getContentIntelligenceTools())
    }

    return tools
  }

  async validateAllProviders(): Promise<Record<string, boolean>> {
    const statuses: Record<string, boolean> = {}
    const providers = await this.providerFactory.getAvailableProviders()

    for (const providerName of providers) {
      try {
        statuses[providerName] = await this.providerFactory.isProviderAvailable(providerName)
      } catch {
        statuses[providerName] = false
      }
    }

    return statuses
  }

  dispose(): void {
    this.clearCache()
  }
}
