/**
 * AI Service Types
 *
 * Типы для основных AI сервисов
 */

import type { AiMessage, AiRequestOptions, AiResponse, ModelConfiguration, StreamingOptions } from "./providers"

// Менеджер моделей
export interface ModelManager {
  getAvailableModels(): Promise<ModelConfiguration[]>
  getProviderByModel(model: string): string
  isModelAvailable(model: string): Promise<boolean>

  getBestModelForTask(
    task: "analysis" | "generation" | "chat" | "code",
    options?: {
      preferLocal?: boolean
      maxTokens?: number
      requiresStreaming?: boolean
      requiresTools?: boolean
    },
  ): Promise<ModelConfiguration | null>
}

// Унифицированный AI сервис
export interface IUnifiedAIService {
  // Основные методы
  sendRequest(model: string, messages: AiMessage[], options?: AiRequestOptions): Promise<AiResponse>
  sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options?: AiRequestOptions & StreamingOptions,
  ): Promise<void>

  // Модели
  getAvailableModels(): Promise<ModelConfiguration[]>
  getBestModelForTask(task: string, options?: any): Promise<ModelConfiguration | null>

  // Провайдеры
  getProviderStatuses(): Promise<Record<string, boolean>>

  // Утилиты
  clearCache(): void
  getCacheStats(): any
}

// Фабрика для анализа медиа
export interface MediaAnalysisFactory {
  createFFmpegService(): any
  createVisionService(): any
  createContentAnalysisService(): any
}

// Фабрика для оркестрации
export interface OrchestrationFactory {
  createWorkflowEngine(): any
  createPipelineManager(): any
  createTaskScheduler(): any
}

// Legacy интерфейсы для совместимости
export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

import type { IAIProvider } from "./providers"

export interface IAIProviderFactory {
  createProvider(name: string, config?: any): Promise<IAIProvider>
  getAvailableProviders(): string[]
  validateConfig(name: string, config: any): Promise<boolean>
}

export interface IModelManager {
  loadModels(): Promise<void>
  getModel(id: string): any
  getAllModels(): any[]
  getModelsByProvider(provider: string): any[]
  getModelsByCapability(capability: string): any[]
  registerModel(model: any): Promise<void>
  updateModel(id: string, updates: Partial<any>): Promise<void>
  isModelAvailable(id: string): boolean
}

// Re-export IAIProvider для удобства
export type { IAIProvider } from "./providers"
