/**
 * Backend Events Helper
 *
 * Работа с Command-Event Pattern в E2E тестах
 */

import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

export interface ProjectEvent {
  type: string
  payload: Record<string, any>
}

export interface EventEnvelope {
  metadata: {
    event_id: string
    timestamp: string
    source: string
    version: number
  }
  event: ProjectEvent
}

export interface CommandResult {
  success: boolean
  data?: any
  error?: string
}

export class BackendEventCapture {
  private events: EventEnvelope[] = []
  private listeners: Array<(event: EventEnvelope) => void> = []
  private unlisten?: () => void

  /**
   * Начать перехват событий из backend
   */
  async start(page: Page): Promise<void> {
    await page.evaluate(() => {
      const tauri = (window as any).__TAURI__

      if (!tauri?.event?.listen) {
        console.warn("Tauri event API not available")
        return
      }

      // Подписываемся на project:event
      tauri.event.listen("project:event", (event: any) => {
        if (!(window as any).__BACKEND_EVENTS__) {
          ;(window as any).__BACKEND_EVENTS__ = []
        }
        ;(window as any).__BACKEND_EVENTS__.push(event.payload)
      })
    })

    // Периодически собираем события
    this.startPolling(page)
  }

  private startPolling(page: Page): void {
    const interval = setInterval(async () => {
      try {
        const newEvents = await page.evaluate(() => {
          const events = (window as any).__BACKEND_EVENTS__ || []
          ;(window as any).__BACKEND_EVENTS__ = []
          return events
        })

        newEvents.forEach((event: EventEnvelope) => {
          this.events.push(event)
          this.listeners.forEach((listener) => listener(event))
        })
      } catch (error) {
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
   * Получить все события
   */
  getEvents(): EventEnvelope[] {
    return [...this.events]
  }

  /**
   * Получить события по типу
   */
  getEventsByType(type: string): EventEnvelope[] {
    return this.events.filter((e) => e.event.type === type)
  }

  /**
   * Ждать события с определённым типом
   */
  async waitForEvent(
    type: string,
    options: {
      timeout?: number
      predicate?: (event: EventEnvelope) => boolean
    } = {}
  ): Promise<EventEnvelope> {
    const { timeout = 5000, predicate } = options

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unlisten()
        reject(new Error(`Event "${type}" not received within ${timeout}ms`))
      }, timeout)

      const unlisten = this.onEvent((event) => {
        if (event.event.type === type && (!predicate || predicate(event))) {
          clearTimeout(timer)
          unlisten()
          resolve(event)
        }
      })

      // Проверяем уже существующие события
      const existing = this.events.find(
        (e) => e.event.type === type && (!predicate || predicate(e))
      )
      if (existing) {
        clearTimeout(timer)
        unlisten()
        resolve(existing)
      }
    })
  }

  /**
   * Подписаться на события
   */
  onEvent(callback: (event: EventEnvelope) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Очистить все события
   */
  clear(): void {
    this.events = []
  }

  /**
   * Вывести все события в консоль
   */
  printEvents(): void {
    console.log("\n=== Backend Events ===")
    this.events.forEach((envelope) => {
      console.log(
        `[v${envelope.metadata.version}] ${envelope.event.type}:`,
        envelope.event.payload
      )
    })
    console.log("=====================\n")
  }

  /**
   * Получить статистику событий
   */
  getStats(): {
    total: number
    byType: Record<string, number>
    latestVersion: number
  } {
    const byType: Record<string, number> = {}
    let latestVersion = 0

    this.events.forEach((envelope) => {
      byType[envelope.event.type] = (byType[envelope.event.type] || 0) + 1
      if (envelope.metadata.version > latestVersion) {
        latestVersion = envelope.metadata.version
      }
    })

    return {
      total: this.events.length,
      byType,
      latestVersion,
    }
  }
}

/**
 * Выполнить Tauri команду
 */
export async function executeCommand(
  page: Page,
  command: string,
  params?: Record<string, any>
): Promise<CommandResult> {
  return page.evaluate(
    async ({ cmd, cmdParams }) => {
      try {
        const tauri = (window as any).__TAURI__
        const result = await tauri.core.invoke(cmd, cmdParams)
        return { success: true, data: result }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || String(error),
        }
      }
    },
    { cmd: command, cmdParams: params }
  )
}

/**
 * Получить состояние проекта из backend
 */
export async function getProjectState(page: Page): Promise<any> {
  const result = await executeCommand(page, "get_project_state")
  if (!result.success) {
    throw new Error(`Failed to get project state: ${result.error}`)
  }
  return result.data
}

/**
 * Выполнить команду и дождаться события
 */
export async function executeCommandAndWaitForEvent(
  page: Page,
  command: string,
  params: Record<string, any>,
  expectedEventType: string,
  eventCapture: BackendEventCapture,
  options: { timeout?: number } = {}
): Promise<{ commandResult: CommandResult; event: EventEnvelope }> {
  // Начинаем слушать события перед выполнением команды
  const eventPromise = eventCapture.waitForEvent(expectedEventType, options)

  // Выполняем команду
  const commandResult = await executeCommand(page, command, params)

  // Ждём события
  const event = await eventPromise

  return { commandResult, event }
}

/**
 * Проверить что команда выполнилась успешно
 */
export function assertCommandSuccess(result: CommandResult, commandName: string): void {
  expect(result.success, `Command "${commandName}" should succeed`).toBe(true)
  expect(result.error).toBeUndefined()
}

/**
 * Проверить что получено ожидаемое событие
 */
export function assertEventReceived(
  event: EventEnvelope,
  expectedType: string,
  expectedPayloadFields?: string[]
): void {
  expect(event.event.type).toBe(expectedType)

  if (expectedPayloadFields) {
    expectedPayloadFields.forEach((field) => {
      expect(event.event.payload).toHaveProperty(field)
    })
  }
}

/**
 * Создать capture событий
 */
export function createEventCapture(): BackendEventCapture {
  return new BackendEventCapture()
}
