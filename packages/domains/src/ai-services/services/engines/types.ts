/**
 * Общие типы для AI движков
 */

export interface AIEngine {
  name: string
  version: string
  description: string

  // Жизненный цикл
  initialize(): Promise<void>
  shutdown?(): Promise<void>

  // Обработка
  process(data: any, config: any): Promise<any>

  // Состояние
  isReady(): boolean
  getCapabilities(): EngineCapabilities

  // Конфигурация
  configure?(config: any): Promise<void>
  validateConfig?(config: any): boolean
}

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

// Базовый класс для движков
export abstract class BaseAIEngine implements AIEngine {
  abstract name: string
  abstract version: string
  abstract description: string

  protected _isReady = false

  abstract initialize(): Promise<void>
  abstract process(data: any, config: any): Promise<any>
  abstract getCapabilities(): EngineCapabilities

  isReady(): boolean {
    return this._isReady
  }

  async shutdown(): Promise<void> {
    this._isReady = false
  }

  validateConfig(config: any): boolean {
    // Базовая валидация - переопределить в наследниках
    return config !== null && typeof config === "object"
  }
}
