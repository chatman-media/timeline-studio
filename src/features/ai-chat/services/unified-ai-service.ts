/**
 * Новый рефакторированный UnifiedAIService
 * Использует отдельные сервисы для лучшей архитектуры (< 300 строк)
 */

import { contentIntelligenceTools } from "../tools/analysis/content-intelligence-tools"
import { personIdentificationTools } from "../tools/analysis/person-identification-tools"
import type { AiMessage } from "../types/ai-message"
import type { StreamingOptions } from "../types/streaming"
import { AIResponseProcessor, type ProcessingOptions, type UnifiedResponse } from "./ai-response-processor"
import {
  type AIServiceInterface,
  ContentIntelligenceService,
  type MediaInput,
  type UnifiedContentAnalysis,
} from "./content-intelligence-service"
import { type ModelConfig, ModelConfigurationManager } from "./model-configuration-manager"
import { ProviderManager } from "./provider-manager"

export type { UnifiedResponse } from "./ai-response-processor"
export type { MediaInput, UnifiedContentAnalysis } from "./content-intelligence-service"
// Реэкспортируем типы для обратной совместимости
export type { AIProvider, ModelConfig } from "./model-configuration-manager"

// Опции для запроса
export interface UnifiedRequestOptions {
  temperature?: number
  maxTokens?: number
  fallbackModels?: string[]
  timeout?: number
  retryAttempts?: number
}

// Обратная совместимость для UNIFIED_MODELS
export const UNIFIED_MODELS: Record<string, ModelConfig> = {}

/**
 * Рефакторированный UnifiedAIService - основная точка входа для всех AI операций
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService

  // Компоненты архитектуры
  private modelManager!: ModelConfigurationManager
  private providerManager!: ProviderManager
  private responseProcessor!: AIResponseProcessor
  private contentIntelligenceService!: ContentIntelligenceService

  // Кэширование
  private responseCache = new Map<string, { response: UnifiedResponse; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 минут
  private initialized = false

  private constructor() {
    this.initializeServices()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService()
    }
    return UnifiedAIService.instance
  }

  /**
   * Инициализация всех сервисов
   */
  private async initializeServices(): Promise<void> {
    if (this.initialized) return

    try {
      // Импорт shared AI services вместо локальных провайдеров
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()

      // Получаем unified AI service из shared
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")

      // Создаем адаптер для проверки доступности провайдеров через shared сервисы
      const availabilityChecker = {
        isClaudeAvailable: async () => {
          try {
            return await sharedUnifiedService.isModelAvailable("claude-4-sonnet-latest")
          } catch (error) {
            console.warn("Failed to check Claude availability:", error)
            return false
          }
        },
        isOpenAIAvailable: async (model: string) => {
          try {
            return await sharedUnifiedService.isModelAvailable(model)
          } catch (error) {
            console.warn("Failed to check OpenAI availability:", error)
            return false
          }
        },
        isDeepSeekAvailable: async () => {
          try {
            return await sharedUnifiedService.isModelAvailable("deepseek-chat")
          } catch (error) {
            console.warn("Failed to check DeepSeek availability:", error)
            return false
          }
        },
        isOllamaAvailable: async () => {
          try {
            return await sharedUnifiedService.isModelAvailable("llama3.2:latest")
          } catch (error) {
            console.warn("Failed to check Ollama availability:", error)
            return false
          }
        },
        getOllamaModels: async () => {
          try {
            const models = await sharedUnifiedService.getAvailableModels()
            return models.filter((m: any) => m.provider === "ollama").map((m: any) => m.model)
          } catch (error) {
            console.warn("Failed to get Ollama models from shared service:", error)
            return []
          }
        },
      }

      // Инициализируем сервисы
      this.modelManager = ModelConfigurationManager.create(availabilityChecker)
      this.providerManager = ProviderManager.getInstance()
      this.responseProcessor = AIResponseProcessor.getInstance()

      // Создаем адаптер для AI сервиса в ContentIntelligenceService
      const aiServiceAdapter: AIServiceInterface = {
        sendRequest: this.sendRequest.bind(this),
      }
      this.contentIntelligenceService = ContentIntelligenceService.create(aiServiceAdapter)

      this.initialized = true
    } catch (error) {
      console.error("Ошибка инициализации UnifiedAIService:", error)
      // Инициализируем fallback значения
      this.initialized = false
    }
  }

  /**
   * Убедиться что сервис инициализирован
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeServices()
    }
  }

  // ===================
  // ОСНОВНЫЕ API МЕТОДЫ
  // ===================

  /**
   * Отправить запрос с автоматическим fallback и обработкой ошибок
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions = {},
  ): Promise<UnifiedResponse> {
    await this.ensureInitialized()

    const startTime = Date.now()
    const cacheKey = this.createCacheKey(model, messages, options)

    // Проверяем кэш
    const cached = this.getCachedResponse(cacheKey)
    if (cached) {
      return { ...cached, responseTime: Date.now() - startTime }
    }

    try {
      // Используем shared AI service для отправки запроса
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")

      // Конвертируем опции в формат shared сервиса
      const sharedResponse = await sharedUnifiedService.sendRequest(model, messages, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        fallbackModels: options.fallbackModels,
        retryAttempts: options.retryAttempts,
        timeout: options.timeout,
      })

      const response: UnifiedResponse = {
        content: sharedResponse.content,
        model: sharedResponse.model,
        provider: sharedResponse.provider,
        usage: sharedResponse.usage,
        responseTime: Date.now() - startTime,
      }

      // Сохраняем в кэш
      this.setCachedResponse(cacheKey, response)

      return response
    } catch (error) {
      console.warn("Ошибка запроса к shared AI service:", error)
      throw error
    }
  }

  /**
   * Отправить потоковый запрос
   */
  public async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    await this.ensureInitialized()
    try {
      // Используем shared AI service для потокового запроса
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")

      return await sharedUnifiedService.sendStreamingRequest(model, messages, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        timeout: options.timeout,
        onContent: options.onContent,
        onComplete: options.onComplete,
        onError: options.onError,
        signal: options.signal,
      })
    } catch (error) {
      console.warn("Ошибка потокового запроса к shared AI service:", error)
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error("Unknown streaming error"))
      } else {
        throw error
      }
    }
  }

  /**
   * Обработать ответ AI с форматированием и валидацией
   */
  public async processResponse(response: UnifiedResponse, options: ProcessingOptions = {}) {
    return this.responseProcessor.processResponse(response, options)
  }

  // ============================
  // МОДЕЛИ И ПРОВАЙДЕРЫ
  // ============================

  /**
   * Получить доступные модели
   */
  public async getAvailableModels(): Promise<ModelConfig[]> {
    await this.ensureInitialized()
    try {
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")
      return await sharedUnifiedService.getAvailableModels()
    } catch (error) {
      console.warn("Ошибка получения доступных моделей:", error)
      // modelManager is guaranteed after ensureInitialized
      return this.modelManager.getAvailableModels()
    }
  }
  

  /**
   * Проверить доступность модели
   */
  public async isModelAvailable(model: string): Promise<boolean> {
    await this.ensureInitialized()
    try {
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")
      return await sharedUnifiedService.isModelAvailable(model)
    } catch (error) {
      console.warn("Ошибка проверки доступности модели:", error)
      return this.modelManager.isModelAvailable(model)
    }
  }

  /**
   * Получить лучшую модель для задачи
   */
  public async getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options: {
      preferLocal?: boolean
      maxTokens?: number
      requiresStreaming?: boolean
      requiresTools?: boolean
    } = {},
  ): Promise<ModelConfig | null> {
    await this.ensureInitialized()
    try {
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")
      return await sharedUnifiedService.getBestModelForTask(task, options)
    } catch (error) {
      console.warn("Ошибка получения лучшей модели:", error)
      return this.modelManager.getBestModelForTask(task, options)
    }
  }

  /**
   * Получить статус всех провайдеров
   */
  public async getProviderStatuses() {
    await this.ensureInitialized()
    try {
      const { getAIContainer } = await import("@/shared/services/ai")
      const aiContainer = getAIContainer()
      const sharedUnifiedService = await aiContainer.resolve<any>("UnifiedAIService")
      return await sharedUnifiedService.getProviderStatuses()
    } catch (error) {
      console.warn("Ошибка получения статуса провайдеров:", error)
      return this.providerManager.getAllProviderStatuses()
    }
  }

  // ============================
  // CONTENT INTELLIGENCE
  // ============================

  /**
   * Полный анализ контента (Content Intelligence)
   */
  public async analyzeContentIntelligence(
    mediaFiles: MediaInput[],
    options: {
      analysisDepth?: "quick" | "normal" | "deep"
      targetPlatforms?: string[]
      languages?: string[]
      enablePersonTracking?: boolean
      generateScript?: boolean
    } = {},
  ): Promise<UnifiedContentAnalysis[]> {
    await this.ensureInitialized()
    return this.contentIntelligenceService.analyzeContentIntelligence(mediaFiles, options)
  }

  // ============================
  // ИНСТРУМЕНТЫ
  // ============================

  /**
   * Получить все доступные Content Intelligence инструменты
   */
  public getContentIntelligenceTools() {
    return contentIntelligenceTools
  }

  /**
   * Получить все доступные Person Identification инструменты
   */
  public getPersonIdentificationTools() {
    return personIdentificationTools
  }

  /**
   * Получить все AI инструменты
   */
  public getAllAITools() {
    return [...contentIntelligenceTools, ...personIdentificationTools]
  }

  // ============================
  // КЭШИРОВАНИЕ И УТИЛИТЫ
  // ============================

  /**
   * Очистить кэш ответов
   */
  public clearCache(): void {
    this.responseCache.clear()
    this.modelManager.clearCache()
    this.providerManager.clearStatusCache()
  }

  /**
   * Получить статистику использования кэша
   */
  public getCacheStats() {
    return {
      responses: {
        size: this.responseCache.size,
        timeout: this.cacheTimeout,
      },
      models: this.modelManager.getCacheStats(),
      providers: this.providerManager.getCacheStats(),
    }
  }

  // ============================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================

  /**
   * Создать ключ кэша
   */
  private createCacheKey(model: string, messages: AiMessage[], options: UnifiedRequestOptions): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|")
    const opts = JSON.stringify({ model, temperature: options.temperature, maxTokens: options.maxTokens })
    return btoa(content + opts).slice(0, 50)
  }

  /**
   * Получить ответ из кэша
   */
  private getCachedResponse(cacheKey: string): UnifiedResponse | null {
    const cached = this.responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response
    }
    return null
  }

  /**
   * Сохранить ответ в кэш
   */
  private setCachedResponse(cacheKey: string, response: UnifiedResponse): void {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    })

    // Очистка старых записей
    if (this.responseCache.size > 100) {
      const oldestKey = Array.from(this.responseCache.keys())[0]
      this.responseCache.delete(oldestKey)
    }
  }
}

// Обратная совместимость - функция для получения статических моделей
export function getUnifiedModels(): Record<string, ModelConfig> {
  const service = UnifiedAIService.getInstance()
  return {} // Пока пустой объект для обратной совместимости
}
