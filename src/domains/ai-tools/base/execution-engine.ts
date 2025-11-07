/**
 * Движок выполнения AI инструментов
 * Управляет жизненным циклом выполнения, параллельностью и мониторингом
 */

import type {
  AIToolExecutionOptions,
  AIToolExecutionStatus,
  AIToolResult,
  AIToolsEventMap,
  AIToolTask,
  BatchExecutionResult,
  ExecutionMetrics,
  IExecutionEngine,
} from "../types"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ExecutionEngine")

import { ToolRegistry } from "./tool-registry"

/**
 * Информация о выполняющейся задаче
 */
interface ExecutionInfo {
  id: string
  toolName: string
  status: AIToolExecutionStatus
  startTime: number
  endTime?: number
  promise: Promise<AIToolResult>
  controller: AbortController
}

/**
 * Реализация движка выполнения AI инструментов
 */
export class ExecutionEngine implements IExecutionEngine {
  private static instance: ExecutionEngine
  private registry: ToolRegistry
  private executions = new Map<string, ExecutionInfo>()
  private metrics: ExecutionMetrics
  private eventListeners = new Map<keyof AIToolsEventMap, Array<(event: any) => void>>()
  private maxConcurrentExecutions: number = 10

  private constructor() {
    this.registry = ToolRegistry.getInstance()
    this.metrics = this.initializeMetrics()
  }

  /**
   * Получить единственный экземпляр движка
   */
  public static getInstance(): ExecutionEngine {
    if (!ExecutionEngine.instance) {
      ExecutionEngine.instance = new ExecutionEngine()
    }
    return ExecutionEngine.instance
  }

  /**
   * Выполнить инструмент
   */
  public async execute(toolName: string, input: any, options?: AIToolExecutionOptions): Promise<AIToolResult> {
    const executionId = this.generateExecutionId(toolName)

    // Проверяем лимит одновременных выполнений
    if (this.executions.size >= this.maxConcurrentExecutions) {
      throw new Error(`Превышен лимит одновременных выполнений (${this.maxConcurrentExecutions})`)
    }

    // Получаем инструмент из реестра
    const tool = this.registry.get(toolName)
    if (!tool) {
      throw new Error(`Инструмент "${toolName}" не найден в реестре`)
    }

    // Создаем контроллер для отмены
    const controller = new AbortController()
    const startTime = Date.now()

    // Создаем промис выполнения
    const executionPromise = this.executeToolWithMonitoring(tool, input, executionId, controller.signal, options)

    // Регистрируем выполнение
    const executionInfo: ExecutionInfo = {
      id: executionId,
      toolName,
      status: "running",
      startTime,
      promise: executionPromise,
      controller,
    }
    this.executions.set(executionId, executionInfo)

    // Отправляем событие начала выполнения
    this.emitEvent("execution:started", { executionId, toolName })

    try {
      const result = await executionPromise

      // Обновляем информацию о выполнении
      executionInfo.status = result.success ? "completed" : "failed"
      executionInfo.endTime = Date.now()

      // Обновляем метрики
      this.updateMetrics(toolName, result, executionInfo.endTime - startTime)

      // Отправляем событие завершения
      if (result.success) {
        this.emitEvent("execution:completed", { executionId, toolName, result })
      } else {
        this.emitEvent("execution:failed", { executionId, toolName, error: new Error(result.message) })
      }

      return result
    } catch (error) {
      // Обновляем статус при ошибке
      executionInfo.status = "failed"
      executionInfo.endTime = Date.now()

      // Обновляем метрики
      this.metrics.totalExecutions++
      this.updateToolUsageStats(toolName)

      // Отправляем событие ошибки
      this.emitEvent("execution:failed", {
        executionId,
        toolName,
        error: error instanceof Error ? error : new Error(String(error)),
      })

      throw error
    } finally {
      // Удаляем из активных выполнений
      this.executions.delete(executionId)
    }
  }

  /**
   * Параллельное выполнение нескольких задач
   */
  public async executeParallel(tasks: AIToolTask[]): Promise<AIToolResult[]> {
    const batchId = this.generateBatchId()
    const startTime = Date.now()

    // Отправляем событие начала batch
    this.emitEvent("batch:started", { batchId, taskCount: tasks.length })

    try {
      // Выполняем задачи параллельно
      const promises = tasks.map((task) =>
        this.execute(task.toolName, task.input, task.options).catch(
          (error) =>
            ({
              success: false,
              message: error.message,
              errors: [error.message],
              executionTime: 0,
              toolName: task.toolName,
              executionId: "",
            }) as AIToolResult,
        ),
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // Создаем результат batch
      const batchResult: BatchExecutionResult = {
        batchId,
        totalTasks: tasks.length,
        completedTasks: results.filter((r) => r.success).length,
        failedTasks: results.filter((r) => !r.success).length,
        successRate: results.filter((r) => r.success).length / tasks.length,
        startTime,
        endTime,
        totalExecutionTime: endTime - startTime,
        averageTaskTime: (endTime - startTime) / tasks.length,
        results: new Map(results.map((result, index) => [tasks[index].id || `task_${index}`, result])),
        errors: new Map(),
        statistics: this.calculateBatchStatistics(results),
        metadata: {
          maxConcurrent: this.maxConcurrentExecutions,
          failFast: false,
          retryCount: 0,
        },
      }

      // Отправляем событие завершения batch
      this.emitEvent("batch:completed", { batchId, result: batchResult })

      return results
    } catch (error) {
      this.emitEvent("execution:failed", {
        executionId: batchId,
        toolName: "batch",
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    }
  }

  /**
   * Отмена выполнения
   */
  public async cancel(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) {
      throw new Error(`Выполнение с ID "${executionId}" не найдено`)
    }

    execution.controller.abort()
    execution.status = "cancelled"
    execution.endTime = Date.now()

    // Удаляем из активных выполнений
    this.executions.delete(executionId)

    logger.info("[ExecutionEngine] Отменено выполнение:", { executionId })
  }

  /**
   * Получить статус выполнения
   */
  public getStatus(executionId: string): AIToolExecutionStatus {
    const execution = this.executions.get(executionId)
    return execution?.status || "completed"
  }

  /**
   * Получить метрики
   */
  public getMetrics(): ExecutionMetrics {
    return { ...this.metrics }
  }

  /**
   * Выполнение инструмента с мониторингом
   */
  private async executeToolWithMonitoring(
    tool: any,
    input: any,
    executionId: string,
    signal: AbortSignal,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult> {
    // Проверяем отмену
    if (signal.aborted) {
      throw new Error("Выполнение отменено")
    }

    // Валидируем входные данные
    if (!tool.validate(input)) {
      throw new Error(`Невалидные входные данные для инструмента ${tool.metadata.name}`)
    }

    // Выполняем инструмент
    const result = await tool.execute(input, {
      ...options,
      metadata: {
        ...options.metadata,
        executionId,
      },
    })

    return result
  }

  /**
   * Обновление метрик
   */
  private updateMetrics(toolName: string, result: AIToolResult, executionTime: number): void {
    this.metrics.totalExecutions++

    if (result.success) {
      this.metrics.successfulExecutions++
    } else {
      this.metrics.failedExecutions++
    }

    this.metrics.totalExecutionTime += executionTime
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.totalExecutions

    this.updateToolUsageStats(toolName)
  }

  /**
   * Обновление статистики использования инструментов
   */
  private updateToolUsageStats(toolName: string): void {
    this.metrics.toolUsageStats[toolName] = (this.metrics.toolUsageStats[toolName] || 0) + 1
  }

  /**
   * Вычисление статистики batch
   */
  private calculateBatchStatistics(results: AIToolResult[]): any {
    const executionTimes = results.map((r) => r.executionTime)

    return {
      tasksByStatus: {
        completed: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        pending: 0,
        running: 0,
        cancelled: 0,
      },
      tasksByPriority: {
        low: 0,
        medium: results.length,
        high: 0,
        critical: 0,
      },
      executionTimeDistribution: {
        min: Math.min(...executionTimes),
        max: Math.max(...executionTimes),
        average: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
        median: this.calculateMedian(executionTimes),
        p95: this.calculatePercentile(executionTimes, 95),
        p99: this.calculatePercentile(executionTimes, 99),
      },
      errorDistribution: {},
      resourceUsage: {
        peakMemory: 0,
        averageMemory: 0,
        peakCpu: 0,
        averageCpu: 0,
      },
    }
  }

  /**
   * Вычисление медианы
   */
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    }

    return sorted[middle]
  }

  /**
   * Вычисление перцентиля
   */
  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  /**
   * Отправка события
   */
  private emitEvent<K extends keyof AIToolsEventMap>(eventType: K, eventData: AIToolsEventMap[K]): void {
    const listeners = this.eventListeners.get(eventType) || []
    listeners.forEach((listener) => {
      try {
        listener(eventData)
      } catch (error) {
        logger.error("[ExecutionEngine] Ошибка в обработчике события", { eventType, error })
      }
    })
  }

  /**
   * Подписка на события
   */
  public addEventListener<K extends keyof AIToolsEventMap>(
    eventType: K,
    listener: (event: AIToolsEventMap[K]) => void,
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  /**
   * Отписка от событий
   */
  public removeEventListener<K extends keyof AIToolsEventMap>(
    eventType: K,
    listener: (event: AIToolsEventMap[K]) => void,
  ): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Инициализация метрик
   */
  private initializeMetrics(): ExecutionMetrics {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      toolUsageStats: {},
    }
  }

  /**
   * Генерация ID выполнения
   */
  private generateExecutionId(toolName: string): string {
    return `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Генерация ID batch
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Установка максимального количества одновременных выполнений
   */
  public setMaxConcurrentExecutions(max: number): void {
    this.maxConcurrentExecutions = max
  }

  /**
   * Получение активных выполнений
   */
  public getActiveExecutions(): Array<{
    id: string
    toolName: string
    status: AIToolExecutionStatus
    startTime: number
  }> {
    return Array.from(this.executions.values()).map((exec) => ({
      id: exec.id,
      toolName: exec.toolName,
      status: exec.status,
      startTime: exec.startTime,
    }))
  }

  /**
   * Очистка завершенных выполнений и сброс метрик
   */
  public reset(): void {
    this.executions.clear()
    this.metrics = this.initializeMetrics()
    this.eventListeners.clear()
  }
}
