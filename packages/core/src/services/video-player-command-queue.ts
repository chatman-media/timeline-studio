import { createLogger } from "@/lib/tauri-logger"
import { globalPerformanceMonitor } from "./video-player-performance-monitor"

const logger = createLogger("core:video-player-command-queue")

export type CommandPriority = "high" | "normal" | "low"

export interface QueuedCommand<T = any> {
  id: string
  priority: CommandPriority
  commandType?: string
  execute: () => Promise<T>
  timestamp: number
}

export interface CommandQueueOptions {
  concurrency?: number
  maxQueueSize?: number
  commandTimeout?: number
}

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

  async enqueue<T>(command: () => Promise<T>, priority: CommandPriority = "normal", commandType?: string): Promise<T> {
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

      this.insertByPriority(queuedCommand)

      logger.debug("Command enqueued", {
        commandId,
        priority,
        queueSize: this.queue.length,
      })

      this.processQueue()
    })
  }

  private insertByPriority(command: QueuedCommand): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 }

    let insertIndex = this.queue.length

    for (let index = 0; index < this.queue.length; index++) {
      if (priorityOrder[command.priority] < priorityOrder[this.queue[index].priority]) {
        insertIndex = index
        break
      }
    }

    this.queue.splice(insertIndex, 0, command)
  }

  private async processQueue(): Promise<void> {
    if (this.processing && this.activeCommands >= this.concurrency) {
      return
    }

    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true

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

      globalPerformanceMonitor.recordSync(duration, command.commandType || "unknown")

      logger.debug("Command executed", {
        commandId: command.id,
        priority: command.priority,
        commandType: command.commandType,
        duration: `${duration.toFixed(2)}ms`,
        queueSize: this.queue.length,
      })
    } catch (error) {
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

      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 0)
      } else {
        this.processing = false
      }
    }
  }

  clear(): void {
    logger.debug("Clearing queue", { queueSize: this.queue.length })
    this.queue = []
  }

  async flush(): Promise<void> {
    while (this.queue.length > 0 || this.activeCommands > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

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

  get isPending(): boolean {
    return this.queue.length > 0 || this.activeCommands > 0
  }

  get size(): number {
    return this.queue.length
  }
}
