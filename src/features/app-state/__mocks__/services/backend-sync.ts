/**
 * Mock implementation of backend-sync for testing
 */

import { vi } from "vitest"
import type { CommandResult, EventEnvelope, ProjectCommand, ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"

export const _mockOnStateChange = vi.fn()
export const _mockOnEvent = vi.fn()
export const _mockConnect = vi.fn()
export const _mockDisconnect = vi.fn()
export const _mockGetProjectState = vi.fn()
export const _mockGetEventHistory = vi.fn()

export class BackendSync {
  private isConnected = false
  private eventHandlers = new Set<(event: ProjectEvent) => void>()
  private stateChangeHandlers = new Set<(state: ProjectState) => void>()

  async connect(): Promise<void> {
    _mockConnect()
    this.isConnected = true
  }

  disconnect(): void {
    _mockDisconnect()
    this.isConnected = false
  }

  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    return {
      success: true,
      error: null,
      data: null,
    }
  }

  async getProjectState(): Promise<ProjectState | null> {
    return _mockGetProjectState()
  }

  async getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]> {
    return _mockGetEventHistory(sinceVersion)
  }

  onStateChange(handler: (state: ProjectState) => void): () => void {
    _mockOnStateChange(handler)
    this.stateChangeHandlers.add(handler)
    return () => {
      this.stateChangeHandlers.delete(handler)
    }
  }

  onEvent(handler: (event: ProjectEvent) => void): () => void {
    _mockOnEvent(handler)
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  getIsConnected(): boolean {
    return this.isConnected
  }
}

let backendSyncInstance: BackendSync | null = null

export function getBackendSync(): BackendSync {
  if (!backendSyncInstance) {
    backendSyncInstance = new BackendSync()
  }
  return backendSyncInstance
}

export function resetBackendSync(): void {
  backendSyncInstance = null
  _mockOnStateChange.mockClear()
  _mockOnEvent.mockClear()
  _mockConnect.mockClear()
  _mockDisconnect.mockClear()
  _mockGetProjectState.mockClear()
  _mockGetEventHistory.mockClear()
}
