/**
 * Command Queue - очередь команд с приоритетами
 * Canonical source in domains/video-editing/services
 */

import { createLogger } from "@/lib/tauri-logger"
import { globalPerformanceMonitor } from "./performance-monitor"

const logger = createLogger("video-player:command-queue")

export type CommandPriority = "high" | "normal" | "low"

export interface QueuedCommand<T = any> {
  id: string
  priority: CommandPriority
  commandType?: string
  execute: () => Promise<T>
  timestamp: number
}

export interface CommandQueueOptions {
  /**
   * Максимальное количество одновременно выполняемых команд
   * @default 1
   */
  concurrency?: number

  /**
   * Максимальный размер очереди
   * @default 100
   */
  maxQueueSize?: number

  /**
   * Таймаут для выполнения команды в миллисекундах
   * @default 5000
   */
  commandTimeout?: number
}

/**
 * Очередь команд с гарантированным порядком выполнения
 *
 * Особенности:
 * - Гарантирует последовательное выполнение команд
 * - Поддерживает приоритизацию (high > normal > low)
 * - Предотвращает race conditions
 * - Поддерживает таймауты для команд
 *
 * @example
 * ```typescript
 * const queue = new CommandQueue({ concurrency: 1 })
 *
 * // Обычная команда
 * await queue.enqueue(() => backendSync.play(), 'normal')
 *
 * // Высокоприоритетная команда (выполнится раньше)
 * await queue.enqueue(() => backendSync.pause(), 'high')
 * ```
 */
export class CommandQueue {
  private queue: QueuedCommand[] = []
  private processing = false
  private activeCommands = 0
  private commandCounter = 0

  private readonly concurrency: number
  private readonly maxQueueSize: number
  private readonly commandTimeout: number

  constructor(options: CommandQueueOptions = {}) {
    this.concurrency = options.concurrency ?? 1
    this.maxQueueSize = options.maxQueueSize ?? 100
    this.commandTimeout = options.commandTimeout ?? 5000
  }

  /**
   * Добавить команду в очередь
   *
   * @param command Функция для выполнения
   * @param priority Приоритет выполнения (high/normal/low)
   * @param commandType Тип команды для мониторинга (например, "play", "seek", "pause")
   * @returns Promise с результатом выполнения
   */
  async enqueue<T>(command: () => Promise<T>, priority: CommandPriority = "normal", commandType?: string): Promise<T> {
    // Проверка переполнения очереди
    if (this.queue.length >= this.maxQueueSize) {
      const error = new Error(`Command queue overflow: ${this.queue.length} commands pending`)
      logger.error("Queue overflow", { queueSize: this.queue.length, maxSize: this.maxQueueSize })
      throw error
    }

    const commandId = `cmd-${++this.commandCounter}`

    return new Promise<T>((resolve, reject) => {
      const queuedCommand: QueuedCommand<T> = {
        id: commandId,
        priority,
        commandType,
        timestamp: Date.now(),
        execute: async () => {
          try {
            // Добавляем таймаут для команды
            const timeoutPromise = new Promise<never>((_, rejectTimeout) => {
              setTimeout(() => {
                rejectTimeout(new Error(`Command ${commandId} timed out after ${this.commandTimeout}ms`))
              }, this.commandTimeout)
            })

            const result = await Promise.race([command(), timeoutPromise])
            resolve(result)
            return result
          } catch (error) {
            reject(error)
            throw error
          }
        },
      }

      // Добавляем в очередь с учетом приоритета
      this.insertByPriority(queuedCommand)

      logger.debug("Command enqueued", {
        commandId,
        priority,
        queueSize: this.queue.length,
      })

      // Запускаем обработку очереди
      this.processQueue()
    })
  }

  /**
   * Вставить команду в очередь с учетом приоритета
   */
  private insertByPriority(command: QueuedCommand): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 }

    // Находим позицию для вставки
    let insertIndex = this.queue.length

    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[command.priority] < priorityOrder[this.queue[i].priority]) {
        insertIndex = i
        break
      }
    }

    this.queue.splice(insertIndex, 0, command)
  }

  /**
   * Обработка очереди команд
   */
  private async processQueue(): Promise<void> {
    // Если уже обрабатываем или достигли лимита параллельности
    if (this.processing && this.activeCommands >= this.concurrency) {
      return
    }

    // Если очередь пуста
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true

    // Берем следующую команду из очереди
    const command = this.queue.shift()
    if (!command) {
      this.processing = false
      return
    }

    this.activeCommands++

    try {
      const startTime = performance.now()
      await command.execute()
      const duration = performance.now() - startTime

      // Записываем успешную синхронизацию в Performance Monitor
      globalPerformanceMonitor.recordSync(duration, command.commandType || "unknown")

      logger.debug("Command executed", {
        commandId: command.id,
        priority: command.priority,
        commandType: command.commandType,
        duration: `${duration.toFixed(2)}ms`,
        queueSize: this.queue.length,
      })
    } catch (error) {
      // Записываем ошибку в Performance Monitor
      globalPerformanceMonitor.recordFailure(
        error instanceof Error ? error : new Error(String(error)),
        command.commandType || "unknown",
      )

      logger.error("Command execution failed", {
        commandId: command.id,
        priority: command.priority,
        commandType: command.commandType,
        error,
      })
    } finally {
      this.activeCommands--

      // Продолжаем обработку очереди
      if (this.queue.length > 0) {
        // Небольшая задержка для предотвращения блокировки main thread
        setTimeout(() => this.processQueue(), 0)
      } else {
        this.processing = false
      }
    }
  }

  /**
   * Очистить очередь
   */
  clear(): void {
    logger.debug("Clearing queue", { queueSize: this.queue.length })
    this.queue = []
  }

  /**
   * Дождаться завершения всех команд в очереди
   */
  async flush(): Promise<void> {
    while (this.queue.length > 0 || this.activeCommands > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  /**
   * Получить статистику очереди
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      activeCommands: this.activeCommands,
      isProcessing: this.processing,
      priorityBreakdown: {
        high: this.queue.filter((cmd) => cmd.priority === "high").length,
        normal: this.queue.filter((cmd) => cmd.priority === "normal").length,
        low: this.queue.filter((cmd) => cmd.priority === "low").length,
      },
    }
  }

  /**
   * Проверить, обрабатываются ли команды
   */
  get isPending(): boolean {
    return this.queue.length > 0 || this.activeCommands > 0
  }

  /**
   * Получить текущий размер очереди
   */
  get size(): number {
    return this.queue.length
  }
}
