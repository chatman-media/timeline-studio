/**
 * AI Core Services Registration Plugin
 *
 * Плагин для регистрации основных AI сервисов
 */

import type { AIDIContainer } from "../container"
import type { AIProviderFactory, IUnifiedAIService, ModelManager } from "../types"

/**
 * Регистрирует основные AI сервисы в контейнере
 */
export function registerAICoreServices(container: AIDIContainer): void {
  // Model Manager
  container.registerSingleton<ModelManager>(
    "ModelManager",
    async (providerFactory: AIProviderFactory) => {
      const { ModelManagerImpl } = await import("./model-manager")
      return new ModelManagerImpl(providerFactory)
    },
    ["AIProviderFactory"],
  )

  // Unified AI Service
  container.registerSingleton<IUnifiedAIService>(
    "UnifiedAIService",
    async (providerFactory: AIProviderFactory, modelManager: ModelManager) => {
      const { EnhancedUnifiedAIService } = await import("./unified-ai-service")
      return EnhancedUnifiedAIService.getInstance({ providerFactory, modelManager })
    },
    ["AIProviderFactory", "ModelManager"],
  )

  // Media Analysis Factory
  container.registerSingleton("MediaAnalysisFactory", async () => {
    const { createMediaAnalysisFactory } = await import("@/domains/ai-services/factories/media-analysis-factory")
    return createMediaAnalysisFactory()
  })

  // FFmpeg Service
  container.registerSingleton(
    "FFmpegService",
    async (analysisFactory: any) => {
      const factory = await analysisFactory
      return factory.createFFmpegService()
    },
    ["MediaAnalysisFactory"],
  )

  // Vision Service
  container.registerSingleton(
    "VisionService",
    async (analysisFactory: any) => {
      const factory = await analysisFactory
      return factory.createVisionService()
    },
    ["MediaAnalysisFactory"],
  )

  // Content Analysis Service
  container.registerSingleton(
    "ContentAnalysisService",
    async (analysisFactory: any) => {
      const factory = await analysisFactory
      return factory.createContentAnalysisService()
    },
    ["MediaAnalysisFactory"],
  )
}

// Экспорт сервисов
export { ApiKeyLoader } from "./api-key-loader"
export { type AIProvider, ModelManagerImpl } from "./model-manager"
export {
  EnhancedUnifiedAIService,
  EnhancedUnifiedAIService as UnifiedAIService,
  type UnifiedRequestOptions,
  type UnifiedResponse,
} from "./unified-ai-service"
