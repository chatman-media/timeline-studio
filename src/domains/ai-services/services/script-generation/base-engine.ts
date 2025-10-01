/**
 * Base AI Engine for Script Generation
 */

import { UnifiedAIService } from "@/domains/ai-core/services"

export interface EngineCapabilities {
  supportsStreaming: boolean
  supportsBatch: boolean
  maxBatchSize?: number
  supportedFormats: string[]
  requiredResources: ResourceRequirements
  estimatedProcessingTime?: (data: any) => number // в секундах
}

export interface ResourceRequirements {
  minRAM: number // MB
  recommendedRAM: number // MB
  requiresGPU: boolean
  gpuMemory?: number // MB
  diskSpace?: number // MB для временных файлов
}

export abstract class BaseAIEngine {
  abstract name: string
  abstract version: string
  abstract description: string

  protected _isReady = false
  protected aiService: UnifiedAIService

  constructor() {
    this.aiService = UnifiedAIService.getInstance()
  }

  abstract initialize(): Promise<void>
  abstract process(data: any, config: any): Promise<any>
  abstract getCapabilities(): EngineCapabilities

  isReady(): boolean {
    return this._isReady
  }

  async shutdown(): Promise<void> {
    this._isReady = false
  }

  async configure(_config: any): Promise<void> {
    // Override in subclasses
  }

  validateConfig(_config: any): boolean {
    // Override in subclasses
    return true
  }
}
