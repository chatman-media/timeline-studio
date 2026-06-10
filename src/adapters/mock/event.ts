/**
 * Mock Event Adapter
 *
 * Реализация IEventService для тестов и разработки в браузере.
 * Использует in-memory event emitter.
 */

import type { EventCallback, IEventService, UnlistenFn } from "@timeline-studio/core/ports"

export class MockEventService implements IEventService {
  private _listeners = new Map<string, Set<EventCallback<unknown>>>()

  async listen<T>(eventName: string, callback: EventCallback<T>): Promise<UnlistenFn> {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set())
    }

    const listeners = this._listeners.get(eventName)!
    listeners.add(callback as EventCallback<unknown>)

    // Return unlisten function
    return () => {
      listeners.delete(callback as EventCallback<unknown>)
      if (listeners.size === 0) {
        this._listeners.delete(eventName)
      }
    }
  }

  async emit<T>(eventName: string, payload: T): Promise<void> {
    const listeners = this._listeners.get(eventName)
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback({ payload })
        } catch {
          // Ignore callback errors in mock
        }
      }
    }
  }

  // === Test Helpers ===

  /**
   * Get all registered event names (for testing)
   */
  getRegisteredEvents(): string[] {
    return Array.from(this._listeners.keys())
  }

  /**
   * Get listener count for an event (for testing)
   */
  getListenerCount(eventName: string): number {
    return this._listeners.get(eventName)?.size ?? 0
  }

  /**
   * Reset all listeners (for testing)
   */
  reset(): void {
    this._listeners.clear()
  }
}
