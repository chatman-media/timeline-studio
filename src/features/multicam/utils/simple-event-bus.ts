/**
 * Простая браузер-совместимая реализация шины событий
 * Заменяет Node.js EventEmitter для использования в браузере
 */

type EventHandler<T extends any[] = any[]> = (...args: T) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SimpleEventBus<TEvents extends Record<string, (...args: any) => any>> {
  private listeners: Map<keyof TEvents, Set<EventHandler>> = new Map()

  /**
   * Подписаться на событие
   */
  on<K extends keyof TEvents>(event: K, handler: TEvents[K]): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as EventHandler)
    return this
  }

  /**
   * Подписаться на событие один раз
   */
  once<K extends keyof TEvents>(event: K, handler: TEvents[K]): this {
    const onceWrapper: EventHandler = (...args: any[]) => {
      handler(...args)
      this.off(event, onceWrapper as TEvents[K])
    }
    return this.on(event, onceWrapper as TEvents[K])
  }

  /**
   * Отписаться от события
   */
  off<K extends keyof TEvents>(event: K, handler: TEvents[K]): this {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(handler as EventHandler)
      // Удаляем пустой Set, если больше нет слушателей
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
    return this
  }

  /**
   * Вызвать событие
   */
  emit<K extends keyof TEvents>(event: K, ...args: Parameters<TEvents[K]>): boolean {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners || eventListeners.size === 0) {
      return false
    }

    // Копируем массив слушателей на случай, если они изменятся во время вызова
    const listeners = Array.from(eventListeners)
    for (const listener of listeners) {
      try {
        listener(...args)
      } catch (error) {
        // Логируем ошибку, но продолжаем обработку других слушателей
        console.error(`Error in event handler for "${String(event)}":`, error)
      }
    }

    return true
  }

  /**
   * Удалить все слушатели для события (или всех событий, если event не указан)
   */
  removeAllListeners<K extends keyof TEvents>(event?: K): this {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
    return this
  }

  /**
   * Получить количество слушателей для события
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.listeners.get(event)?.size ?? 0
  }

  /**
   * Получить список всех событий, на которые есть подписчики
   */
  eventNames(): Array<keyof TEvents> {
    return Array.from(this.listeners.keys())
  }

  /**
   * Получить массив слушателей для события
   */
  getListeners<K extends keyof TEvents>(event: K): TEvents[K][] {
    const eventListeners = this.listeners.get(event)
    return eventListeners ? (Array.from(eventListeners) as TEvents[K][]) : []
  }

  /**
   * Alias для off() для совместимости с EventEmitter
   */
  removeListener<K extends keyof TEvents>(event: K, handler: TEvents[K]): this {
    return this.off(event, handler)
  }
}
