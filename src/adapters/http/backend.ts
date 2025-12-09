/**
 * HTTP Backend Adapter
 *
 * Реализация IBackendService через HTTP для подключения к src-node серверу.
 * Использует HTTP API вместо Tauri IPC или локальных вызовов.
 */

import type { IBackendService, Unsubscribe } from "@/core/ports"
import type {
  CommandResult,
  EventEnvelope,
  ProjectCommand,
  ProjectEvent,
  ProjectState,
} from "@/types/generated/tauri-bindings"

import { HttpClient, type HttpClientOptions } from "./client"

export interface HttpBackendOptions extends Partial<HttpClientOptions> {
  /** URL сервера (по умолчанию http://localhost:3001) */
  serverUrl?: string
  /** Интервал health check в мс (0 - отключено) */
  healthCheckInterval?: number
  /** Автоматически переподключаться при потере соединения */
  autoReconnect?: boolean
}

type EventHandler = (event: ProjectEvent) => void
type StateHandler = (state: ProjectState) => void

export class HttpBackendService implements IBackendService {
  private client: HttpClient
  private _connected = false
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private eventHandlers: Set<EventHandler> = new Set()
  private stateHandlers: Set<StateHandler> = new Set()
  private projectState: ProjectState | null = null
  private options: HttpBackendOptions

  constructor(options: HttpBackendOptions = {}) {
    this.options = {
      serverUrl: "http://localhost:3001",
      healthCheckInterval: 30000,
      autoReconnect: true,
      ...options,
    }

    this.client = new HttpClient({
      baseUrl: this.options.serverUrl!,
      timeout: options.timeout,
      headers: options.headers,
    })
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    if (this._connected) return

    const healthy = await this.client.healthCheck()
    if (!healthy) {
      throw new Error(`Cannot connect to server at ${this.options.serverUrl}`)
    }

    this._connected = true
    console.log(`HttpBackendService: Connected to ${this.options.serverUrl}`)

    // Start health check polling
    if (this.options.healthCheckInterval && this.options.healthCheckInterval > 0) {
      this.healthCheckTimer = setInterval(async () => {
        const isHealthy = await this.client.healthCheck()
        if (!isHealthy && this._connected) {
          console.warn("HttpBackendService: Lost connection to server")
          this._connected = false

          if (this.options.autoReconnect) {
            this.attemptReconnect()
          }
        }
      }, this.options.healthCheckInterval)
    }

    // Fetch initial project state
    await this.syncProjectState()
  }

  async disconnect(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    this._connected = false
    this.projectState = null
    console.log("HttpBackendService: Disconnected")
  }

  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    if (!this._connected) {
      return {
        success: false,
        error: "Backend not connected",
        data: null,
      }
    }

    try {
      // Convert ProjectCommand to HTTP request
      const httpCommand = {
        type: this.getCommandType(command),
        payload: this.getCommandPayload(command),
        timestamp: Date.now(),
        correlationId: crypto.randomUUID(),
      }

      const response = await this.client.post<{ correlationId: string; result: CommandResult }>(
        "/api/command",
        httpCommand,
      )

      if (response.success && response.data) {
        // Sync state after command
        await this.syncProjectState()
        return response.data.result
      }

      return {
        success: false,
        error: response.error?.message || "Command failed",
        data: null,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }
    }
  }

  async getProjectState(): Promise<ProjectState | null> {
    if (!this._connected) return null

    await this.syncProjectState()
    return this.projectState
  }

  async getEventHistory(_sinceVersion?: number): Promise<EventEnvelope[]> {
    // HTTP backend doesn't support event history yet
    // This would require WebSocket or SSE for real-time events
    return []
  }

  onEvent(handler: EventHandler): Unsubscribe {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  onStateChange(handler: StateHandler): Unsubscribe {
    this.stateHandlers.add(handler)
    return () => {
      this.stateHandlers.delete(handler)
    }
  }

  // ============================================================================
  // Internal Methods
  // ============================================================================

  private async syncProjectState(): Promise<void> {
    const response = await this.client.get<ProjectState>("/api/project")

    if (response.success && response.data) {
      const newState = response.data
      if (JSON.stringify(newState) !== JSON.stringify(this.projectState)) {
        this.projectState = newState
        this.notifyStateChange(newState)
      }
    }
  }

  private notifyStateChange(state: ProjectState): void {
    for (const handler of this.stateHandlers) {
      handler(state)
    }
  }

  private notifyEvent(event: ProjectEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event)
    }
  }

  private async attemptReconnect(): Promise<void> {
    console.log("HttpBackendService: Attempting to reconnect...")

    const maxAttempts = 5
    const delay = 2000

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))

      const healthy = await this.client.healthCheck()
      if (healthy) {
        this._connected = true
        console.log(`HttpBackendService: Reconnected after ${attempt} attempts`)
        await this.syncProjectState()
        return
      }

      console.log(`HttpBackendService: Reconnect attempt ${attempt}/${maxAttempts} failed`)
    }

    console.error("HttpBackendService: Failed to reconnect after all attempts")
  }

  private getCommandType(command: ProjectCommand): string {
    // ProjectCommand is a discriminated union, extract type
    if (typeof command === "object" && command !== null && "type" in command) {
      return String((command as { type: unknown }).type)
    }
    return "Unknown"
  }

  private getCommandPayload(command: ProjectCommand): Record<string, unknown> {
    // Extract payload from command
    if (typeof command === "object" && command !== null) {
      const { type: _type, ...payload } = command as Record<string, unknown>
      return payload
    }
    return {}
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  isConnected(): boolean {
    return this._connected
  }

  getServerUrl(): string {
    return this.options.serverUrl!
  }

  setServerUrl(url: string): void {
    this.options.serverUrl = url
    this.client.setBaseUrl(url)
  }
}
