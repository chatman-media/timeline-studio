/**
 * AI Provider Factory
 * Фабрика для создания AI провайдеров с dependency injection
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AIProviderFactory")

import type { AIProviderFactory, IAIProvider, ModelConfiguration } from "../types"
import { ClaudeProvider } from "./claude/claude-provider"
import { DeepSeekProvider } from "./deepseek/deepseek-provider"
import { GrokProvider } from "./grok/grok-provider"
import { OllamaProvider } from "./ollama/ollama-provider"
import { OpenAIProvider } from "./openai/openai-provider"

export class AIProviderFactoryImpl implements AIProviderFactory {
  private providers = new Map<string, IAIProvider>()
  private modelCache: ModelConfiguration[] | null = null

  createClaudeProvider(): IAIProvider {
    const key = "claude"
    if (!this.providers.has(key)) {
      this.providers.set(key, new ClaudeProvider())
    }
    return this.providers.get(key)!
  }

  createOpenAIProvider(): IAIProvider {
    const key = "openai"
    if (!this.providers.has(key)) {
      this.providers.set(key, new OpenAIProvider())
    }
    return this.providers.get(key)!
  }

  createDeepSeekProvider(): IAIProvider {
    const key = "deepseek"
    if (!this.providers.has(key)) {
      this.providers.set(key, new DeepSeekProvider())
    }
    return this.providers.get(key)!
  }

  createOllamaProvider(baseUrl?: string): IAIProvider {
    const key = `ollama_${baseUrl || "default"}`
    if (!this.providers.has(key)) {
      this.providers.set(key, new OllamaProvider(baseUrl))
    }
    return this.providers.get(key)!
  }

  createGrokProvider(): IAIProvider {
    const key = "grok"
    if (!this.providers.has(key)) {
      this.providers.set(key, new GrokProvider())
    }
    return this.providers.get(key)!
  }

  async getAvailableProviders(): Promise<string[]> {
    const providers = [
      { name: "claude", factory: () => this.createClaudeProvider() },
      { name: "openai", factory: () => this.createOpenAIProvider() },
      { name: "deepseek", factory: () => this.createDeepSeekProvider() },
      { name: "ollama", factory: () => this.createOllamaProvider() },
      { name: "grok", factory: () => this.createGrokProvider() },
    ]

    const availableProviders: string[] = []

    for (const provider of providers) {
      try {
        const instance = provider.factory()
        const isAvailable = await instance.isAvailable()
        if (isAvailable) {
          availableProviders.push(provider.name)
        }
      } catch (error) {
        logger.warn("Provider not available", { provider: provider.name, error })
      }
    }

    return availableProviders
  }

  getProviderByModel(model: string): IAIProvider | null {
    // Claude models
    if (model.includes("claude")) {
      return this.createClaudeProvider()
    }

    // OpenAI models
    if (model.includes("gpt") || model.includes("o1")) {
      return this.createOpenAIProvider()
    }

    // DeepSeek models
    if (model.includes("deepseek")) {
      return this.createDeepSeekProvider()
    }

    // Grok models
    if (model.includes("grok")) {
      return this.createGrokProvider()
    }

    // Ollama models - это локальные модели
    const ollamaModels = ["llama", "mistral", "codellama", "qwen", "gemma", "phi", "vicuna", "alpaca", "orca"]

    if (ollamaModels.some((ollamaModel) => model.toLowerCase().includes(ollamaModel))) {
      return this.createOllamaProvider()
    }

    return null
  }

  async isProviderAvailable(provider: string): Promise<boolean> {
    try {
      let providerInstance: IAIProvider

      switch (provider.toLowerCase()) {
        case "claude":
          providerInstance = this.createClaudeProvider()
          break
        case "openai":
          providerInstance = this.createOpenAIProvider()
          break
        case "deepseek":
          providerInstance = this.createDeepSeekProvider()
          break
        case "ollama":
          providerInstance = this.createOllamaProvider()
          break
        case "grok":
          providerInstance = this.createGrokProvider()
          break
        default:
          return false
      }

      return await providerInstance.isAvailable()
    } catch {
      return false
    }
  }

  // Дополнительные методы
  async getAllModels(): Promise<ModelConfiguration[]> {
    if (this.modelCache) {
      return this.modelCache
    }

    const allModels: ModelConfiguration[] = []
    const providers = [
      { name: "claude", instance: this.createClaudeProvider() },
      { name: "openai", instance: this.createOpenAIProvider() },
      { name: "deepseek", instance: this.createDeepSeekProvider() },
      { name: "ollama", instance: this.createOllamaProvider() },
      { name: "grok", instance: this.createGrokProvider() },
    ]

    for (const { name, instance } of providers) {
      try {
        const isAvailable = await instance.isAvailable()
        if (!isAvailable) continue

        const models = await instance.getAvailableModels()
        for (const model of models) {
          const config: ModelConfiguration = {
            provider: name,
            model: model,
            displayName: this.getDisplayName(model),
            maxTokens: instance.getMaxTokens?.(model),
            supportTools: this.supportsTools(name, model),
            supportStreaming: true, // Все наши провайдеры поддерживают streaming
            supportVision: this.supportsVision(name, model),
            apiKeyRequired: name !== "ollama",
          }
          allModels.push(config)
        }
      } catch (error) {
        logger.warn("Failed to get models", { provider: name, error })
      }
    }

    this.modelCache = allModels
    return allModels
  }

  private getDisplayName(model: string): string {
    const displayNames: Record<string, string> = {
      "claude-4-sonnet-latest": "Claude 4 Sonnet",
      "claude-4-opus-latest": "Claude 4 Opus",
      "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
      "gpt-4.1": "GPT-4.1",
      "gpt-5-nano": "GPT-5 Nano",
      "gpt-5-mini": "GPT-5 Mini",
      "gpt-5": "GPT-5 (Preview)",
      "deepseek-chat": "DeepSeek Chat",
      "deepseek-reasoner": "DeepSeek Reasoner",
      "deepseek-v3.1": "DeepSeek V3.1",
      "llama3.2": "Llama 3.2",
      "llama3.1": "Llama 3.1",
      "grok-code-fast-1": "Grok Code Fast",
      "grok-4-0709": "Grok-4",
      "grok-3": "Grok-3",
      "grok-3-mini": "Grok-3 Mini",
    }

    return displayNames[model] || model
  }

  private supportsTools(provider: string, model: string): boolean {
    if (provider === "openai") {
      return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-5"].includes(model)
    }
    if (provider === "claude") {
      return true // Все Claude модели поддерживают tools
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
    if (provider === "grok") {
      return ["grok-1-vision", "grok-2-vision", "grok-4-0709", "grok-3", "grok-3-mini"].includes(model)
    }
    return false
  }

  // Очистка кэша
  clearCache(): void {
    this.modelCache = null
  }

  // Отключение провайдера
  dispose(): void {
    this.providers.clear()
    this.clearCache()
  }
}

// Singleton instance
let factoryInstance: AIProviderFactoryImpl | null = null

export function createAIProviderFactory(): AIProviderFactory {
  if (!factoryInstance) {
    factoryInstance = new AIProviderFactoryImpl()
  }
  return factoryInstance
}

export function getAIProviderFactory(): AIProviderFactory {
  return createAIProviderFactory()
}
