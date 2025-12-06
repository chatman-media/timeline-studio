/**
 * Backend Logger Helper
 *
 * Перехватывает и анализирует логи из Tauri backend для E2E тестов
 */

import type { Page } from "@playwright/test"

export interface BackendLog {
  level: "trace" | "debug" | "info" | "warn" | "error"
  target: string
  message: string
  timestamp: number
  fields?: Record<string, any>
}

export class BackendLogCapture {
  private logs: BackendLog[] = []
  private listeners: Array<(log: BackendLog) => void> = []
  private unlisten?: () => void

  /**
   * Начать перехват логов из backend
   */
  async start(page: Page): Promise<void> {
    // Подписываемся на события логирования от Tauri
    await page.evaluate(() => {
      const tauri = (window as any).__TAURI__

      if (!tauri?.event?.listen) {
        console.warn("Tauri event API not available")
        return
      }

      // Слушаем события логирования
      tauri.event.listen("log:event", (event: any) => {
        // Сохраняем в window для доступа из тестов
        if (!(window as any).__BACKEND_LOGS__) {
          ;(window as any).__BACKEND_LOGS__ = []
        }
        ;(window as any).__BACKEND_LOGS__.push({
          ...event.payload,
          timestamp: Date.now(),
        })
      })
    })

    // Периодически собираем логи из window
    this.startPolling(page)
  }

  /**
   * Периодический сбор логов из window
   */
  private startPolling(page: Page): void {
    const interval = setInterval(async () => {
      try {
        const newLogs = await page.evaluate(() => {
          const logs = (window as any).__BACKEND_LOGS__ || []
          ;(window as any).__BACKEND_LOGS__ = []
          return logs
        })

        newLogs.forEach((log: BackendLog) => {
          this.logs.push(log)
          this.listeners.forEach((listener) => listener(log))
        })
      } catch (error) {
        // Страница может быть закрыта
        clearInterval(interval)
      }
    }, 100)

    this.unlisten = () => clearInterval(interval)
  }

  /**
   * Остановить перехват
   */
  stop(): void {
    this.unlisten?.()
  }

  /**
   * Получить все захваченные логи
   */
  getLogs(): BackendLog[] {
    return [...this.logs]
  }

  /**
   * Получить логи по уровню
   */
  getLogsByLevel(level: BackendLog["level"]): BackendLog[] {
    return this.logs.filter((log) => log.level === level)
  }

  /**
   * Получить ошибки
   */
  getErrors(): BackendLog[] {
    return this.getLogsByLevel("error")
  }

  /**
   * Получить предупреждения
   */
  getWarnings(): BackendLog[] {
    return this.getLogsByLevel("warn")
  }

  /**
   * Поиск логов по паттерну сообщения
   */
  findLogs(pattern: string | RegExp): BackendLog[] {
    const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern
    return this.logs.filter((log) => regex.test(log.message))
  }

  /**
   * Проверить что нет ошибок
   */
  assertNoErrors(): void {
    const errors = this.getErrors()
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => e.message).join("\n")
      throw new Error(`Backend errors detected:\n${errorMessages}`)
    }
  }

  /**
   * Подписаться на новые логи
   */
  onLog(callback: (log: BackendLog) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Ждать появления лога с определённым сообщением
   */
  async waitForLog(
    pattern: string | RegExp,
    options: { timeout?: number; level?: BackendLog["level"] } = {}
  ): Promise<BackendLog> {
    const { timeout = 5000, level } = options
    const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unlisten()
        reject(new Error(`Log matching "${pattern}" not found within ${timeout}ms`))
      }, timeout)

      const unlisten = this.onLog((log) => {
        if (regex.test(log.message) && (!level || log.level === level)) {
          clearTimeout(timer)
          unlisten()
          resolve(log)
        }
      })

      // Проверяем уже существующие логи
      const existing = this.logs.find(
        (log) => regex.test(log.message) && (!level || log.level === level)
      )
      if (existing) {
        clearTimeout(timer)
        unlisten()
        resolve(existing)
      }
    })
  }

  /**
   * Очистить все логи
   */
  clear(): void {
    this.logs = []
  }

  /**
   * Вывести все логи в консоль
   */
  printLogs(): void {
    console.log("\n=== Backend Logs ===")
    this.logs.forEach((log) => {
      const prefix = `[${log.level.toUpperCase()}] ${log.target}:`
      console.log(`${prefix} ${log.message}`)
      if (log.fields) {
        console.log("  Fields:", log.fields)
      }
    })
    console.log("===================\n")
  }

  /**
   * Получить статистику логов
   */
  getStats(): {
    total: number
    byLevel: Record<string, number>
    byTarget: Record<string, number>
  } {
    const byLevel: Record<string, number> = {}
    const byTarget: Record<string, number> = {}

    this.logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1
      byTarget[log.target] = (byTarget[log.target] || 0) + 1
    })

    return {
      total: this.logs.length,
      byLevel,
      byTarget,
    }
  }
}

/**
 * Создать новый capture логов
 */
export function createLogCapture(): BackendLogCapture {
  return new BackendLogCapture()
}
