/**
 * Batch Processor
 * Процессор для пакетной обработки контента
 */

export interface BatchProcessingConfig {
  parallel: boolean
  maxConcurrent: number
  priority: "quality" | "speed" | "balanced"
  cacheResults: boolean
}

export class BatchProcessor {
  private config: BatchProcessingConfig
  private isInitialized = false
  private processingQueue = new Map<string, Promise<any>>()
  private cache = new Map<string, any>()

  constructor(config: BatchProcessingConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    this.isInitialized = true
  }

  /**
   * Обработать батч элементов
   */
  async processBatch<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]> {
    if (!this.isInitialized) {
      throw new Error("Batch Processor not initialized")
    }

    if (this.config.parallel) {
      return this.processParallel(items, processor)
    }
    return this.processSequential(items, processor)
  }

  /**
   * Параллельная обработка
   */
  private async processParallel<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = []
    const chunks = this.chunkArray(items, this.config.maxConcurrent)

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map((item) => this.processItem(item, processor)))
      results.push(...chunkResults)
    }

    return results
  }

  /**
   * Последовательная обработка
   */
  private async processSequential<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = []

    for (const item of items) {
      const result = await this.processItem(item, processor)
      results.push(result)
    }

    return results
  }

  /**
   * Обработать один элемент
   */
  private async processItem<T, R>(item: T, processor: (item: T) => Promise<R>): Promise<R> {
    const cacheKey = this.getCacheKey(item)

    // Проверяем кэш
    if (this.config.cacheResults && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // Проверяем, не обрабатывается ли уже этот элемент
    if (this.processingQueue.has(cacheKey)) {
      return this.processingQueue.get(cacheKey)
    }

    // Обрабатываем
    const processingPromise = processor(item)
    this.processingQueue.set(cacheKey, processingPromise)

    try {
      const result = await processingPromise

      // Кэшируем результат
      if (this.config.cacheResults) {
        this.cache.set(cacheKey, result)
      }

      return result
    } finally {
      this.processingQueue.delete(cacheKey)
    }
  }

  /**
   * Разбить массив на части
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Получить ключ кэша
   */
  private getCacheKey(item: any): string {
    if (typeof item === "string") {
      return item
    }

    if (typeof item === "object" && item !== null) {
      // Для объектов используем JSON
      return JSON.stringify(item, Object.keys(item).sort())
    }

    return String(item)
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Получить статистику обработки
   */
  getStats(): {
    queueSize: number
    cacheSize: number
    processing: number
  } {
    return {
      queueSize: this.processingQueue.size,
      cacheSize: this.cache.size,
      processing: this.processingQueue.size,
    }
  }

  /**
   * Обработать с прогрессом
   */
  async processBatchWithProgress<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<R[]> {
    const results: R[] = []
    let completed = 0
    const total = items.length

    const processWithProgress = async (item: T): Promise<R> => {
      const result = await processor(item)
      completed++

      if (onProgress) {
        onProgress(completed, total)
      }

      return result
    }

    if (this.config.parallel) {
      const chunks = this.chunkArray(items, this.config.maxConcurrent)

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map((item) => processWithProgress(item)))
        results.push(...chunkResults)
      }
    } else {
      for (const item of items) {
        const result = await processWithProgress(item)
        results.push(result)
      }
    }

    return results
  }

  /**
   * Обработать с таймаутом
   */
  async processBatchWithTimeout<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    timeoutMs: number,
  ): Promise<(R | Error)[]> {
    const processWithTimeout = async (item: T): Promise<R | Error> => {
      try {
        const result = await Promise.race([
          processor(item),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Processing timeout")), timeoutMs)),
        ])
        return result
      } catch (error) {
        return error as Error
      }
    }

    return this.processBatch(items, processWithTimeout)
  }

  /**
   * Обработать с повторными попытками
   */
  async processBatchWithRetry<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxRetries = 3,
  ): Promise<(R | Error)[]> {
    const processWithRetry = async (item: T): Promise<R | Error> => {
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await processor(item)
        } catch (error) {
          lastError = error as Error

          // Не повторяем последнюю попытку
          if (attempt < maxRetries) {
            // Экспоненциальная задержка
            await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000))
          }
        }
      }

      return lastError || new Error("Unknown error")
    }

    return this.processBatch(items, processWithRetry)
  }
}
