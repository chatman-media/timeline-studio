/**
 * Node.js Backend Adapter
 *
 * Реализация IBackendService для Node.js.
 * Управляет состоянием проекта и выполняет команды.
 */

import { exec } from "node:child_process"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import type { IBackendService, Unsubscribe } from "@timeline-studio/core/ports"
import type {
  CommandResult,
  EventEnvelope,
  EventMetadata,
  ProjectCommand,
  ProjectEvent,
  ProjectState,
} from "@/types/generated/tauri-bindings"

const execAsync = promisify(exec)

export interface NodeBackendOptions {
  tempDir?: string
  ffmpegPath?: string
}

type EventHandler = (event: ProjectEvent) => void
type StateHandler = (state: ProjectState) => void

export class NodeBackendService implements IBackendService {
  private tempDir: string
  private ffmpegPath: string
  private projectState: ProjectState | null = null
  private _connected = false
  private eventHandlers: Set<EventHandler> = new Set()
  private stateHandlers: Set<StateHandler> = new Set()
  private eventHistory: EventEnvelope[] = []
  private eventVersion = 0

  constructor(options: NodeBackendOptions = {}) {
    this.tempDir = options.tempDir || path.join(os.tmpdir(), "timeline-studio")
    this.ffmpegPath = options.ffmpegPath || "ffmpeg"
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    if (this._connected) return

    await this.checkDependencies()

    if (!fs.existsSync(this.tempDir)) {
      await fsPromises.mkdir(this.tempDir, { recursive: true })
    }

    this._connected = true
    console.log("NodeBackendService: Connected")
  }

  async disconnect(): Promise<void> {
    this._connected = false
    this.projectState = null
    console.log("NodeBackendService: Disconnected")
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
      // Handle command based on type
      const result = await this.handleCommand(command)

      // Emit event
      this.emitEvent({
        type: "CommandExecuted",
        command: command.type,
        success: result.success,
      } as unknown as ProjectEvent)

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }
    }
  }

  private async handleCommand(command: ProjectCommand): Promise<CommandResult> {
    // ProjectCommand is a discriminated union from Tauri bindings
    // For Node.js, we handle common patterns
    const cmd = command as { type: string; payload?: unknown }

    switch (cmd.type) {
      case "Undo":
      case "Redo":
        return { success: true, error: null, data: null }
      default:
        return { success: true, error: null, data: null }
    }
  }

  async getProjectState(): Promise<ProjectState | null> {
    return this.projectState
  }

  async getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]> {
    if (sinceVersion === undefined) {
      return this.eventHistory
    }
    return this.eventHistory.filter((e) => e.metadata.version > sinceVersion)
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

  private emitEvent(event: ProjectEvent): void {
    this.eventVersion++
    const metadata: EventMetadata = {
      id: `event-${this.eventVersion}`,
      timestamp: new Date().toISOString(),
      source: "node-backend",
      version: this.eventVersion,
    }
    const envelope: EventEnvelope = {
      metadata,
      event,
    }
    this.eventHistory.push(envelope)

    for (const handler of this.eventHandlers) {
      handler(event)
    }
  }

  private emitStateChange(state: ProjectState): void {
    this.projectState = state
    for (const handler of this.stateHandlers) {
      handler(state)
    }
  }

  private async checkDependencies(): Promise<void> {
    try {
      await execAsync(`${this.ffmpegPath} -version`)
    } catch {
      console.warn("NodeBackendService: FFmpeg not found")
    }

    try {
      await execAsync("ffprobe -version")
    } catch {
      console.warn("NodeBackendService: FFprobe not found")
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  isConnected(): boolean {
    return this._connected
  }

  getTempDir(): string {
    return this.tempDir
  }

  /**
   * Update project state (for testing/manual updates)
   */
  updateProjectState(state: ProjectState): void {
    this.emitStateChange(state)
  }
}
