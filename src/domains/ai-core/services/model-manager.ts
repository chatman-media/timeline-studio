/**
 * Model Manager
 * Управление моделями и их конфигурациями
 */

import { CLAUDE_MODELS, DEEPSEEK_MODELS, OPENAI_MODELS } from "../providers"
import type { AIProviderFactory, ModelConfiguration, ModelManager } from "../types"

// Типы AI провайдеров
export type AIProvider = "claude" | "openai" | "deepseek" | "ollama" | "grok"

// Интерфейс для проверки доступности провайдеров
export interface ProviderAvailabilityChecker {
  isClaudeAvailable(): Promise<boolean>
  isOpenAIAvailable(model: string): Promise<boolean>
  isDeepSeekAvailable(): Promise<boolean>
  isOllamaAvailable(): Promise<boolean>
  getOllamaModels(): Promise<Array<{ name: string; details: { parameter_size: string } }>>
}

export class ModelManagerImpl implements ModelManager {
  private availableModels: ModelConfiguration[] = []
  private modelCache: Map<string, ModelConfiguration> = new Map()
  private lastUpdate: number = 0
  private readonly CACHE_TTL = 300000 // 5 минут

  // Статические модели с расширенной информацией
  private static readonly STATIC_MODELS: Record<string, Partial<ModelConfiguration>> = {
    // Claude модели
    [CLAUDE_MODELS.CLAUDE_4_SONNET_LATEST]: {
      displayName: "Claude 4 Sonnet",
      maxTokens: 200000,
      supportTools: true,
      supportStreaming: true,
      supportVision: true,
    },
    [CLAUDE_MODELS.CLAUDE_4_OPUS_LATEST]: {
      displayName: "Claude 4 Opus",
      maxTokens: 200000,
      supportTools: true,
      supportStreaming: true,
      supportVision: true,
    },
    [CLAUDE_MODELS.CLAUDE_4_1]: {
      displayName: "Claude 4.1",
      maxTokens: 500000,
      supportTools: true,
      supportStreaming: true,
      supportVision: true,
    },
    // OpenAI модели
    [OPENAI_MODELS.GPT_4]: {
      displayName: "GPT-4",
      maxTokens: 8192,
      supportTools: false,
      supportStreaming: true,
    },
    [OPENAI_MODELS.GPT_4O]: {
      displayName: "GPT-4o",
      maxTokens: 128000,
      supportTools: false,
      supportStreaming: true,
      supportVision: true,
    },
    [OPENAI_MODELS.GPT_3_5_TURBO]: {
      displayName: "GPT-3.5 Turbo",
      maxTokens: 16385,
      supportTools: false,
      supportStreaming: true,
    },
    [OPENAI_MODELS.O3]: {
      displayName: "o3",
      maxTokens: 128000,
      supportTools: false,
      supportStreaming: true,
    },
    [OPENAI_MODELS.GPT_5]: {
      displayName: "GPT-5",
      maxTokens: 1000000,
      supportTools: true,
      supportStreaming: true,
      supportVision: true,
    },
    // DeepSeek модели
    [DEEPSEEK_MODELS.DEEPSEEK_R1]: {
      displayName: "DeepSeek R1",
      maxTokens: 65536,
      supportTools: false,
      supportStreaming: true,
    },
    [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: {
      displayName: "DeepSeek Chat",
      maxTokens: 32768,
      supportTools: false,
      supportStreaming: true,
    },
    [DEEPSEEK_MODELS.DEEPSEEK_CODER]: {
      displayName: "DeepSeek Coder",
      maxTokens: 32768,
      supportTools: false,
      supportStreaming: true,
    },
  }

  constructor(private providerFactory: AIProviderFactory) {}

  async getAvailableModels(forceRefresh = false): Promise<ModelConfiguration[]> {
    const now = Date.now()

    // Проверяем кэш
    if (!forceRefresh && this.availableModels.length > 0 && now - this.lastUpdate < this.CACHE_TTL) {
      return this.availableModels
    }

    // Обновляем список моделей
    await this.refreshModels()
    return this.availableModels
  }

  private async refreshModels(): Promise<void> {
    const models: ModelConfiguration[] = []

    // Claude модели
    try {
      const claudeProvider = this.providerFactory.createClaudeProvider()
      if (await claudeProvider.isAvailable()) {
        const claudeModels = await claudeProvider.getAvailableModels()
        for (const model of claudeModels) {
          const staticConfig = ModelManagerImpl.STATIC_MODELS[model] || {}
          models.push({
            provider: "claude",
            model: model,
            displayName: staticConfig.displayName || this.getDisplayName("claude", model),
            maxTokens: staticConfig.maxTokens || claudeProvider.getMaxTokens?.(model) || 200000,
            supportTools: staticConfig.supportTools ?? true,
            supportStreaming: staticConfig.supportStreaming ?? true,
            supportVision: staticConfig.supportVision ?? true,
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load Claude models:", error)
    }

    // OpenAI модели
    try {
      const openaiProvider = this.providerFactory.createOpenAIProvider()
      if (await openaiProvider.isAvailable()) {
        const openaiModels = await openaiProvider.getAvailableModels()
        for (const model of openaiModels) {
          const staticConfig = ModelManagerImpl.STATIC_MODELS[model] || {}
          models.push({
            provider: "openai",
            model: model,
            displayName: staticConfig.displayName || this.getDisplayName("openai", model),
            maxTokens: staticConfig.maxTokens || openaiProvider.getMaxTokens?.(model) || 128000,
            supportTools: staticConfig.supportTools ?? this.supportsTools("openai", model),
            supportStreaming: staticConfig.supportStreaming ?? true,
            supportVision: staticConfig.supportVision ?? this.supportsVision("openai", model),
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load OpenAI models:", error)
    }

    // DeepSeek модели
    try {
      const deepseekProvider = this.providerFactory.createDeepSeekProvider()
      if (await deepseekProvider.isAvailable()) {
        const deepseekModels = await deepseekProvider.getAvailableModels()
        for (const model of deepseekModels) {
          const staticConfig = ModelManagerImpl.STATIC_MODELS[model] || {}
          models.push({
            provider: "deepseek",
            model: model,
            displayName: staticConfig.displayName || this.getDisplayName("deepseek", model),
            maxTokens: staticConfig.maxTokens || deepseekProvider.getMaxTokens?.(model) || 32768,
            supportTools: staticConfig.supportTools ?? false,
            supportStreaming: staticConfig.supportStreaming ?? true,
            supportVision: staticConfig.supportVision ?? false,
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load DeepSeek models:", error)
    }

    // Ollama модели
    try {
      const ollamaProvider = this.providerFactory.createOllamaProvider()
      if (await ollamaProvider.isAvailable()) {
        const ollamaModels = await ollamaProvider.getAvailableModels()
        for (const model of ollamaModels) {
          models.push({
            provider: "ollama",
            model: model,
            displayName: this.getDisplayName("ollama", model),
            maxTokens: ollamaProvider.getMaxTokens?.(model) || 4096,
            supportTools: false,
            supportStreaming: true,
            supportVision: false,
            apiKeyRequired: false,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load Ollama models:", error)
    }

    // Grok модели
    try {
      const grokProvider = this.providerFactory.createGrokProvider?.()
      if (grokProvider && (await grokProvider.isAvailable())) {
        const grokModels = await grokProvider.getAvailableModels()
        for (const model of grokModels) {
          models.push({
            provider: "grok",
            model: model,
            displayName: this.getDisplayName("grok", model),
            maxTokens: grokProvider.getMaxTokens?.(model) || 100000,
            supportTools: true,
            supportStreaming: true,
            supportVision: false,
            apiKeyRequired: true,
          })
        }
      } else {
        // Добавляем модели Grok вручную, если провайдер еще не реализован
        const grokModels = [
          { model: "grok-2", displayName: "Grok 2", maxTokens: 100000 },
          { model: "grok-2-mini", displayName: "Grok 2 Mini", maxTokens: 100000 },
        ]
        for (const grokModel of grokModels) {
          models.push({
            provider: "grok",
            model: grokModel.model,
            displayName: grokModel.displayName,
            maxTokens: grokModel.maxTokens,
            supportTools: true,
            supportStreaming: true,
            supportVision: false,
            apiKeyRequired: true,
          })
        }
      }
    } catch (error) {
      console.warn("Failed to load Grok models:", error)
    }

    // Обновляем кэш
    this.availableModels = models
    this.modelCache.clear()
    for (const model of models) {
      this.modelCache.set(model.model, model)
    }
    this.lastUpdate = Date.now()

    console.log(`Loaded ${models.length} AI models from ${new Set(models.map((m) => m.provider)).size} providers`)
  }

  getProviderByModel(model: string): string {
    const modelConfig = this.modelCache.get(model)
    if (modelConfig) {
      return modelConfig.provider
    }

    // Проверяем статические модели
    if (ModelManagerImpl.STATIC_MODELS[model]) {
      // Определяем провайдера по константам
      if (Object.values(CLAUDE_MODELS).includes(model as any)) return "claude"
      if (Object.values(OPENAI_MODELS).includes(model as any)) return "openai"
      if (Object.values(DEEPSEEK_MODELS).includes(model as any)) return "deepseek"
    }

    // Fallback: определяем провайдер по имени модели
    if (model.startsWith("claude")) return "claude"
    if (model.startsWith("gpt") || model.startsWith("o3") || model.includes("gpt-5")) return "openai"
    if (model.startsWith("deepseek")) return "deepseek"
    if (model.includes("grok")) return "grok"
    if (model.includes("llama") || model.includes("mistral") || model.includes("qwen")) return "ollama"

    return "ollama" // По умолчанию считаем локальной моделью
  }

  async isModelAvailable(model: string): Promise<boolean> {
    const models = await this.getAvailableModels()
    return models.some((m) => m.model === model)
  }

  async getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options: {
      preferLocal?: boolean
      maxTokens?: number
      requiresStreaming?: boolean
      requiresTools?: boolean
    } = {},
  ): Promise<ModelConfiguration | null> {
    const availableModels = await this.getAvailableModels()

    // Фильтруем модели по требованиям
    let candidates = availableModels.filter((model) => {
      // Проверяем требования
      if (options.requiresStreaming && !model.supportStreaming) return false
      if (options.requiresTools && !model.supportTools) return false
      if (options.maxTokens && model.maxTokens && model.maxTokens < options.maxTokens) return false
      if (options.preferLocal && model.apiKeyRequired) return false

      return true
    })

    if (candidates.length === 0) {
      return null
    }

    // Выбираем лучшую модель для конкретной задачи
    candidates = this.rankModelsForTask(candidates, task)

    return candidates[0] || null
  }

  private rankModelsForTask(models: ModelConfiguration[], task: string): ModelConfiguration[] {
    const taskPreferences: Record<string, { providers: string[]; models: string[] }> = {
      analysis: {
        providers: ["claude", "gpt-4o", "gpt-4-turbo", "grok"],
        models: ["claude-4-sonnet-latest", "gpt-4o", "claude-3-5-sonnet-20241022", "grok-2"],
      },
      generation: {
        providers: ["claude", "openai", "deepseek", "grok"],
        models: ["claude-4-opus-latest", "gpt-4o", "claude-4-sonnet-latest", "grok-2"],
      },
      chat: {
        providers: ["claude", "openai", "ollama", "grok"],
        models: ["claude-3-5-sonnet-20241022", "gpt-4o-mini", "llama3.2", "grok-2-mini"],
      },
      code: {
        providers: ["deepseek", "claude", "openai", "grok"],
        models: ["deepseek-coder", "claude-4-sonnet-latest", "gpt-4o", "grok-2"],
      },
    }

    const preferences = taskPreferences[task] || taskPreferences.chat

    return models.sort((a, b) => {
      // Приоритет по конкретным моделям
      const aModelPriority = preferences.models.indexOf(a.model)
      const bModelPriority = preferences.models.indexOf(b.model)

      if (aModelPriority !== -1 && bModelPriority !== -1) {
        return aModelPriority - bModelPriority
      }
      if (aModelPriority !== -1) return -1
      if (bModelPriority !== -1) return 1

      // Приоритет по провайдерам
      const aProviderPriority = preferences.providers.indexOf(a.provider)
      const bProviderPriority = preferences.providers.indexOf(b.provider)

      if (aProviderPriority !== -1 && bProviderPriority !== -1) {
        return aProviderPriority - bProviderPriority
      }
      if (aProviderPriority !== -1) return -1
      if (bProviderPriority !== -1) return 1

      // По количеству токенов (больше лучше)
      const aTokens = a.maxTokens || 0
      const bTokens = b.maxTokens || 0
      return bTokens - aTokens
    })
  }

  private getDisplayName(provider: string, model: string): string {
    const displayNames: Record<string, Record<string, string>> = {
      claude: {
        "claude-4-sonnet-latest": "Claude 4 Sonnet",
        "claude-4-opus-latest": "Claude 4 Opus",
        "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
        "claude-3-haiku-20240307": "Claude 3 Haiku",
      },
      openai: {
        "gpt-4o": "GPT-4o",
        "gpt-4o-mini": "GPT-4o Mini",
        "gpt-4-turbo": "GPT-4 Turbo",
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "gpt-5": "GPT-5 (Preview)",
      },
      deepseek: {
        "deepseek-chat": "DeepSeek Chat",
        "deepseek-coder": "DeepSeek Coder",
        "deepseek-reasoner": "DeepSeek Reasoner",
        "deepseek-v3": "DeepSeek V3",
      },
      ollama: {
        "llama3.2": "Llama 3.2",
        "llama3.1": "Llama 3.1",
        codellama: "Code Llama",
        mistral: "Mistral",
        "qwen2.5": "Qwen 2.5",
      },
      grok: {
        "grok-2": "Grok 2",
        "grok-2-mini": "Grok 2 Mini",
      },
    }

    return displayNames[provider]?.[model] || model
  }

  private supportsTools(provider: string, model: string): boolean {
    if (provider === "openai") {
      return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-5"].includes(model)
    }
    if (provider === "claude") {
      return true // Все новые Claude модели поддерживают tools
    }
    if (provider === "grok") {
      return true // Grok модели поддерживают tools
    }
    return false
  }

  private supportsVision(provider: string, model: string): boolean {
    if (provider === "openai") {
      return ["gpt-4o", "gpt-4-vision-preview", "gpt-5"].includes(model)
    }
    if (provider === "claude") {
      return true // Все новые Claude модели поддерживают vision
    }
    return false
  }

  // Дополнительные утилиты
  getModelConfig(model: string): ModelConfiguration | null {
    return this.modelCache.get(model) || null
  }

  async getModelsByProvider(provider: string, forceRefresh = false): Promise<ModelConfiguration[]> {
    const allModels = await this.getAvailableModels(forceRefresh)
    return allModels.filter((model) => model.provider === provider)
  }

  clearCache(): void {
    this.availableModels = []
    this.modelCache.clear()
    this.lastUpdate = 0
  }

  /**
   * Получить статистику кэша
   */
  getCacheStats(): {
    isCached: boolean
    modelsCount: number
    cacheExpiry: number
    timeToExpiry: number
  } {
    const now = Date.now()
    return {
      isCached: this.availableModels.length > 0 && now < this.lastUpdate + this.CACHE_TTL,
      modelsCount: this.availableModels.length,
      cacheExpiry: this.lastUpdate + this.CACHE_TTL,
      timeToExpiry: Math.max(0, this.lastUpdate + this.CACHE_TTL - now),
    }
  }

  /**
   * Валидировать модель
   */
  validateModel(model: string): {
    isValid: boolean
    provider: string
    config: ModelConfiguration | null
    errors: string[]
  } {
    const errors: string[] = []
    let provider: string

    try {
      provider = this.getProviderByModel(model)
    } catch (error) {
      provider = "unknown"
      errors.push(`Неизвестный провайдер для модели ${model}`)
    }

    const config = this.getModelConfig(model)

    if (!config && provider !== "ollama") {
      errors.push(`Конфигурация не найдена для модели ${model}`)
    }

    return {
      isValid: errors.length === 0,
      provider,
      config,
      errors,
    }
  }

  /**
   * Получить все статические модели
   */
  getStaticModels(): Record<string, Partial<ModelConfiguration>> {
    return { ...ModelManagerImpl.STATIC_MODELS }
  }
}
