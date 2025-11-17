/**
 * Command Queue для предотвращения race conditions
 *
 * Обеспечивает последовательное выполнение команд к backend
 * Предотвращает конфликты при параллельных операциях
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CommandQueue")

export interface QueuedCommand<T = any> {
  id: string
  execute: () => Promise<T>
  priority?: number
  timestamp: number
}

export class CommandQueue {
  private queue: QueuedCommand[] = []
  private isProcessing = false
  private commandCounter = 0

  /**
   * Добавляет команду в очередь
   */
  async enqueue<T>(execute: () => Promise<T>, priority = 0): Promise<T> {
    const id = `cmd-${Date.now()}-${this.commandCounter++}`

    const command: QueuedCommand<T> = {
      id,
      execute,
      priority,
      timestamp: Date.now(),
    }

    // Добавляем в очередь с учетом приоритета
    const insertIndex = this.queue.findIndex((cmd) => (cmd.priority ?? 0) < priority)
    if (insertIndex === -1) {
      this.queue.push(command)
    } else {
      this.queue.splice(insertIndex, 0, command)
    }

    logger.debug("Command enqueued", { id, queueLength: this.queue.length, priority })

    // Запускаем обработку очереди
    this.processQueue()

    // Возвращаем promise который резолвится когда команда выполнится
    return new Promise<T>((resolve, reject) => {
      const originalExecute = command.execute
      command.execute = async () => {
        try {
          const result = await originalExecute()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      }
    })
  }

  /**
   * Обрабатывает очередь команд последовательно
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const command = this.queue.shift()!
      const startTime = Date.now()

      logger.debug("Executing command", { id: command.id, queueLength: this.queue.length })

      try {
        await command.execute()
        const duration = Date.now() - startTime
        logger.debug("Command completed", { id: command.id, duration })
      } catch (error) {
        logger.error("Command failed", { id: command.id, error })
        // Продолжаем обработку очереди даже при ошибке
      }
    }

    this.isProcessing = false
  }

  /**
   * Очищает очередь
   */
  clear(): void {
    logger.debug("Clearing command queue", { queueLength: this.queue.length })
    this.queue = []
  }

  /**
   * Возвращает текущую длину очереди
   */
  getLength(): number {
    return this.queue.length
  }

  /**
   * Проверяет, обрабатывается ли очередь
   */
  isIdle(): boolean {
    return !this.isProcessing && this.queue.length === 0
  }
}

/**
 * Глобальный экземпляр очереди команд
 */
export const globalCommandQueue = new CommandQueue()

/**
 * Debounce для предотвращения избыточных вызовов
 */
export function debounceCommand<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null
  let latestResolve: ((value: any) => void) | null = null
  let latestReject: ((error: any) => void) | null = null

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Отменяем предыдущий таймер
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    return new Promise<ReturnType<T>>((resolve, reject) => {
      latestResolve = resolve
      latestReject = reject

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          latestResolve?.(result)
        } catch (error) {
          latestReject?.(error)
        }
      }, delay)
    })
  }
}

/**
 * Throttle для ограничения частоты вызовов
 */
export function throttleCommand<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  let lastRun = 0
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    const now = Date.now()

    if (now - lastRun >= limit) {
      lastRun = now
      pendingPromise = fn(...args)
      return pendingPromise
    }

    // Возвращаем pending promise если есть
    if (pendingPromise) {
      return pendingPromise.then(() => undefined)
    }

    return Promise.resolve(undefined)
  }
}
