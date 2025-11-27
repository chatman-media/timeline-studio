/**
 * Tauri Backend Adapter
 *
 * Реализация IBackendService для Tauri.
 * Обёртка над существующим BackendSync для совместимости с новой архитектурой.
 */

import type { IBackendService, Unsubscribe } from "@/core/ports"
import type { CommandResult, EventEnvelope, ProjectCommand, ProjectEvent, ProjectState } from "@/core/types"
import { BackendSync } from "./backend-sync"

export class TauriBackendService implements IBackendService {
  private backend: BackendSync

  constructor() {
    this.backend = new BackendSync()
  }

  get connected(): boolean {
    return this.backend.connected
  }

  async connect(): Promise<void> {
    return this.backend.connect()
  }

  async disconnect(): Promise<void> {
    return this.backend.disconnect()
  }

  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    return this.backend.executeCommand(command)
  }

  async getProjectState(): Promise<ProjectState | null> {
    return this.backend.getProjectState()
  }

  async getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]> {
    return this.backend.getEventHistory(sinceVersion)
  }

  onEvent(handler: (event: ProjectEvent) => void): Unsubscribe {
    return this.backend.onEvent(handler)
  }

  onStateChange(handler: (state: ProjectState) => void): Unsubscribe {
    return this.backend.onStateChange(handler)
  }
}
