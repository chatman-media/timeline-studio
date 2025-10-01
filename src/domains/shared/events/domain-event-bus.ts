/**
 * Domain Event Bus
 *
 * Централизованная шина событий для межсервисной коммуникации между доменами
 */

import { nanoid } from "nanoid"
import type {
  DomainEvent,
  DomainName,
  EventFilter,
  EventHandler,
  PublishResult,
  SubscriptionOptions,
  Unsubscribe,
} from "./domain-event"

interface Subscription {
  id: string
  handler: EventHandler
  options: SubscriptionOptions
}

/**
 * Класс для управления событиями между доменами
 */
export class DomainEventBus {
  private static instance: DomainEventBus | null = null
  private subscriptions: Map<string, Subscription[]> = new Map()
  private eventHistory: DomainEvent[] = []
  private maxHistorySize = 1000
  private isLogging = process.env.NODE_ENV === "development"

  private constructor() {
    // Singleton
  }

  /**
   * Получить экземпляр EventBus (Singleton)
   */
  static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus()
    }
    return DomainEventBus.instance
  }

  /**
   * Подписаться на события
   */
  subscribe<T = unknown>(handler: EventHandler<T>, options: SubscriptionOptions = {}): Unsubscribe {
    const subscription: Subscription = {
      id: nanoid(),
      handler: handler as EventHandler,
      options,
    }

    // Получаем паттерны для подписки
    const patterns = this.getSubscriptionPatterns(options.filter)

    // Добавляем подписку для каждого паттерна
    patterns.forEach((pattern) => {
      const subs = this.subscriptions.get(pattern) || []
      subs.push(subscription)
      // Сортируем по приоритету
      subs.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0))
      this.subscriptions.set(pattern, subs)
    })

    // Возвращаем функцию отписки
    return () => {
      patterns.forEach((pattern) => {
        const subs = this.subscriptions.get(pattern) || []
        const filtered = subs.filter((s) => s.id !== subscription.id)
        if (filtered.length > 0) {
          this.subscriptions.set(pattern, filtered)
        } else {
          this.subscriptions.delete(pattern)
        }
      })
    }
  }

  /**
   * Опубликовать событие
   */
  async publish<T = unknown>(
    type: string,
    source: DomainName,
    payload: T,
    metadata?: Record<string, unknown>,
  ): Promise<PublishResult> {
    const startTime = performance.now()
    const event: DomainEvent<T> = {
      id: nanoid(),
      type,
      source,
      timestamp: Date.now(),
      payload,
      metadata,
    }

    // Логирование в dev режиме
    if (this.isLogging) {
      console.log("[EventBus] Publishing event:", {
        type: event.type,
        source: event.source,
        payload: event.payload,
      })
    }

    // Сохраняем в историю
    this.addToHistory(event)

    // Находим все подходящие обработчики
    const handlers = this.findHandlers(event)
    const errors: Error[] = []

    // Выполняем обработчики
    await Promise.all(
      handlers.map(async ({ handler, options }, index) => {
        try {
          const handlerStartTime = performance.now()

          // Обработка с таймаутом
          if (options.timeout) {
            const handlerResult = handler(event)
            if (handlerResult instanceof Promise) {
              await this.withTimeout(handlerResult, options.timeout, `Handler timeout for event ${event.type}`)
            } else {
              // Синхронный обработчик, просто вызываем
              await Promise.resolve(handlerResult)
            }
          } else {
            await handler(event)
          }

          const handlerEndTime = performance.now()
          const handlerDuration = handlerEndTime - handlerStartTime

          if (handlerDuration > 16) {
            // Больше 16ms (1 кадр при 60fps)
            console.warn(
              `[EventBus] Slow handler detected: ${handlerDuration}ms for event ${event.type}, handler ${index}`,
            )
          }

          // Если once, удаляем обработчик
          if (options.once) {
            // TODO: Implement once removal
          }
        } catch (error) {
          errors.push(error as Error)
          if (this.isLogging) {
            console.error(`[EventBus] Handler error for ${event.type}:`, error)
          }
        }
      }),
    )

    const totalDuration = performance.now() - startTime
    if (totalDuration > 50) {
      // Больше 50ms - потенциальная проблема
      console.warn(
        `[EventBus] Slow event processing: ${totalDuration}ms for ${event.type} with ${handlers.length} handlers`,
      )
    }

    return {
      eventId: event.id,
      handlerCount: handlers.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Получить историю событий
   */
  getHistory(filter?: EventFilter): DomainEvent[] {
    if (!filter) {
      return [...this.eventHistory]
    }

    return this.eventHistory.filter((event) => this.matchesFilter(event, filter))
  }

  /**
   * Очистить историю событий
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * Сбросить все подписки
   */
  reset(): void {
    this.subscriptions.clear()
    this.eventHistory = []
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      subscriptionCount: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0),
      patternCount: this.subscriptions.size,
      historySize: this.eventHistory.length,
      subscriptionsByPattern: Array.from(this.subscriptions.entries()).map(([pattern, subs]) => ({
        pattern,
        count: subs.length,
      })),
    }
  }

  // Приватные методы

  private getSubscriptionPatterns(filter?: EventFilter): string[] {
    if (!filter?.type) {
      return ["*"] // Подписка на все события
    }

    const types = Array.isArray(filter.type) ? filter.type : [filter.type]
    return types
  }

  private findHandlers(event: DomainEvent): Subscription[] {
    const handlers: Subscription[] = []

    // Проверяем exact match
    const exactSubs = this.subscriptions.get(event.type) || []
    handlers.push(...exactSubs)

    // Проверяем wildcard паттерны
    const parts = event.type.split(".")
    for (let i = parts.length - 1; i >= 0; i--) {
      const pattern = `${parts.slice(0, i).join(".")}.*`
      const wildcardSubs = this.subscriptions.get(pattern) || []
      handlers.push(...wildcardSubs)
    }

    // Проверяем универсальную подписку
    const universalSubs = this.subscriptions.get("*") || []
    handlers.push(...universalSubs)

    // Фильтруем по дополнительным критериям
    return handlers.filter((sub) => {
      const filter = sub.options.filter
      if (!filter) return true

      return this.matchesFilter(event, filter)
    })
  }

  private matchesFilter(event: DomainEvent, filter: EventFilter): boolean {
    // Проверяем source
    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source]
      if (!sources.includes(event.source)) {
        return false
      }
    }

    // Проверяем custom фильтр
    if (filter.custom && !filter.custom(event)) {
      return false
    }

    return true
  }

  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event)

    // Ограничиваем размер истории
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }
}

// Экспортируем singleton instance
export const eventBus = DomainEventBus.getInstance()
