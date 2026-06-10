/**
 * Tauri Event Adapter
 *
 * Реализация IEventService для Tauri.
 * Использует @tauri-apps/api/event для подписки на события.
 */

import type { EventCallback, IEventService, UnlistenFn } from "@timeline-studio/core/ports"

export class TauriEventService implements IEventService {
  async listen<T>(eventName: string, callback: EventCallback<T>): Promise<UnlistenFn> {
    const { listen } = await import("@tauri-apps/api/event")
    return listen<T>(eventName, callback)
  }

  async emit<T>(eventName: string, payload: T): Promise<void> {
    const { emit } = await import("@tauri-apps/api/event")
    await emit(eventName, payload)
  }
}
