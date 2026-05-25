/**
 * Mock Backend Adapter
 *
 * Реализация IBackendService для тестов и разработки без Tauri.
 * Эмулирует поведение бэкенда с in-memory состоянием.
 */

import type { IBackendService, Unsubscribe } from "@/core/ports"
import type { CommandResult, EventEnvelope, ProjectCommand, ProjectEvent, ProjectState } from "@/core/types"

export class MockBackendService implements IBackendService {
  private _connected = false
  private _state: ProjectState | null = null
  private _events: EventEnvelope[] = []
  private _version = 0
  private _eventHandlers = new Set<(event: ProjectEvent) => void>()
  private _stateChangeHandlers = new Set<(state: ProjectState) => void>()

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    this._connected = true
  }

  async disconnect(): Promise<void> {
    this._connected = false
  }

  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    if (command.type === "OpenProject") {
      const path = command.params.path
      const mockFiles = typeof window !== "undefined"
        ? ((window as any).__TAURI_MOCK_FILES__ as Record<string, File> | undefined)
        : undefined
      const fileName = path.split("/").pop() ?? path
      const file = mockFiles?.[path] ?? mockFiles?.[fileName]
      if (file) {
        try {
          const text = await file.text()
          const data = JSON.parse(text) as ProjectState
          this.setState(data)
          this.emitEvent({
            type: "ProjectOpened",
            payload: { project_id: data.project?.id ?? crypto.randomUUID(), path },
          })
          return { success: true, data, error: null }
        } catch {
          // Файл не является валидным ProjectState — игнорируем
        }
      }
    }
    return {
      success: true,
      data: null,
      error: null,
    }
  }

  async getProjectState(): Promise<ProjectState | null> {
    return this._state
  }

  async getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]> {
    const since = sinceVersion ?? 0
    return this._events.filter((e) => e.metadata.version > since)
  }

  onEvent(handler: (event: ProjectEvent) => void): Unsubscribe {
    this._eventHandlers.add(handler)
    return () => {
      this._eventHandlers.delete(handler)
    }
  }

  onStateChange(handler: (state: ProjectState) => void): Unsubscribe {
    this._stateChangeHandlers.add(handler)
    return () => {
      this._stateChangeHandlers.delete(handler)
    }
  }

  // === Test Helpers ===

  /**
   * Set the project state (for testing)
   */
  setState(state: ProjectState | null): void {
    this._state = state
    if (state) {
      this._stateChangeHandlers.forEach((handler) => handler(state))
    }
  }

  /**
   * Emit an event (for testing)
   */
  emitEvent(event: ProjectEvent): void {
    this._version++
    const envelope: EventEnvelope = {
      event,
      metadata: {
        id: crypto.randomUUID(),
        version: this._version,
        timestamp: new Date().toISOString(),
        source: "mock",
      },
    }
    this._events.push(envelope)
    this._eventHandlers.forEach((handler) => handler(event))
  }

  /**
   * Reset all state (for testing)
   */
  reset(): void {
    this._connected = false
    this._state = null
    this._events = []
    this._version = 0
    this._eventHandlers.clear()
    this._stateChangeHandlers.clear()
  }
}
