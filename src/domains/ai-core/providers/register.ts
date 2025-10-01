/**
 * AI Providers Registration Plugin
 *
 * Плагин для регистрации AI провайдеров в DI контейнере
 */

import type { AIDIContainer } from "../container"
import type { AIProviderFactory, IAIProvider } from "../types"

/**
 * Регистрирует AI провайдеры в контейнере
 */
export function registerAIProviders(container: AIDIContainer): void {
  // Регистрируем отдельные провайдеры
  container.registerSingleton<IAIProvider>("ClaudeProvider", async () => {
    const { ClaudeProvider } = await import("./claude")
    return new ClaudeProvider()
  })

  container.registerSingleton<IAIProvider>("OpenAIProvider", async () => {
    const { OpenAIProvider } = await import("./openai")
    return new OpenAIProvider()
  })

  container.registerSingleton<IAIProvider>("DeepSeekProvider", async () => {
    const { DeepSeekProvider } = await import("./deepseek")
    return new DeepSeekProvider()
  })

  container.registerSingleton<IAIProvider>("OllamaProvider", async () => {
    const { OllamaProvider } = await import("./ollama")
    return new OllamaProvider()
  })

  container.registerSingleton<IAIProvider>("GrokProvider", async () => {
    const { GrokProvider } = await import("./grok")
    return new GrokProvider()
  })

  // Регистрируем фабрику провайдеров
  container.registerSingleton<AIProviderFactory>(
    "AIProviderFactory",
    async (
      claudeProvider: IAIProvider,
      openaiProvider: IAIProvider,
      deepseekProvider: IAIProvider,
      ollamaProvider: IAIProvider,
      grokProvider: IAIProvider,
    ) => {
      const providers = new Map<string, IAIProvider>([
        ["claude", claudeProvider],
        ["openai", openaiProvider],
        ["deepseek", deepseekProvider],
        ["ollama", ollamaProvider],
        ["grok", grokProvider],
      ])

      return {
        createClaudeProvider: () => claudeProvider,
        createOpenAIProvider: () => openaiProvider,
        createDeepSeekProvider: () => deepseekProvider,
        createOllamaProvider: () => ollamaProvider,
        createGrokProvider: () => grokProvider,

        async getAvailableProviders(): Promise<string[]> {
          const available: string[] = []
          for (const [name, provider] of providers) {
            if (await provider.isAvailable()) {
              available.push(name)
            }
          }
          return available
        },

        getProviderByModel(model: string): IAIProvider | null {
          // Определяем провайдера по имени модели
          if (model.includes("claude")) return claudeProvider
          if (model.includes("gpt") || model.includes("o1")) return openaiProvider
          if (model.includes("deepseek")) return deepseekProvider
          if (model.includes("grok")) return grokProvider
          if (model.includes("llama") || model.includes("mistral") || model.includes("qwen")) {
            return ollamaProvider
          }
          return null
        },

        async isProviderAvailable(provider: string): Promise<boolean> {
          const p = providers.get(provider)
          return p ? await p.isAvailable() : false
        },
      }
    },
    ["ClaudeProvider", "OpenAIProvider", "DeepSeekProvider", "OllamaProvider", "GrokProvider"],
  )
}
