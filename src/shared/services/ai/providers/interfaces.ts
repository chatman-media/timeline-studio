export interface AIServiceConfig {
  providers?: {
    claude?: {
      defaultModel?: string
    }
    openai?: {
      defaultModel?: string
    }
  }
  analysis?: {
    maxConcurrency?: number
    cacheDirectory?: string
  }
  orchestration?: {
    enableWorkflows?: boolean
    maxPipelineSteps?: number
  }
}

export interface ModelConfig {
  provider: string
  model: string
  displayName: string
  maxTokens: number
  supportTools: boolean
  supportStreaming: boolean
  supportVision: boolean
  apiKeyRequired: boolean
}

export interface IUnifiedAIService {
  getAvailableModels(): Promise<ModelConfig[]>
  getBestModelForTask(task: string, options?: any): Promise<ModelConfig | null>
  isModelAvailable(model: string): Promise<boolean>
}

export interface ModelManager {
  getAvailableModels(): Promise<ModelConfig[]>
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
  ): Promise<ModelConfig | null>
}
