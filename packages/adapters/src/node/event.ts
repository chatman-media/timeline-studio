/**
 * Node.js Event Adapter
 *
 * Реализация IEventService для Node.js.
 * Использует EventEmitter для локальных событий.
 */

import { EventEmitter } from "node:events"

import type { IEventService } from "@timeline-studio/core/ports"

export class NodeEventService implements IEventService {
  private emitter = new EventEmitter()
  private listenerCount = 0

  constructor() {
    // Увеличиваем лимит слушателей
    this.emitter.setMaxListeners(100)
  }

  async listen<T>(event: string, callback: (payload: T) => void): Promise<() => void> {
    const wrappedCallback = (payload: T) => {
      callback(payload)
    }

    this.emitter.on(event, wrappedCallback)
    this.listenerCount++

    return () => {
      this.emitter.off(event, wrappedCallback)
      this.listenerCount--
    }
  }

  async emit(event: string, payload?: unknown): Promise<void> {
    this.emitter.emit(event, payload)
  }

  async once<T>(event: string): Promise<T> {
    return new Promise((resolve) => {
      this.emitter.once(event, resolve)
    })
  }

  /**
   * Получить количество активных слушателей
   */
  getListenerCount(event?: string): number {
    if (event) {
      return this.emitter.listenerCount(event)
    }
    return this.listenerCount
  }

  /**
   * Удалить все слушатели события
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.emitter.removeAllListeners(event)
    } else {
      this.emitter.removeAllListeners()
      this.listenerCount = 0
    }
  }
}
