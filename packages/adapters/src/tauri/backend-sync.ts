/**
 * Backend synchronization service
 * Handles communication with Rust backend state management
 *
 * This is a Tauri-specific implementation that communicates with the Rust backend
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event"

import { isDesktop } from "@/lib/environment"
import { createLogger } from "@/lib/tauri-logger"
// Use generated types
import {
  type CommandResult,
  commands,
  type EventEnvelope,
  type ProjectCommand,
  type ProjectEvent,
  type ProjectState,
} from "@/types/generated/tauri-bindings"

const logger = createLogger("BackendSync")

export type EventHandler = (event: ProjectEvent) => void
export type StateChangeHandler = (state: ProjectState) => void

export class BackendSync {
  private eventHandlers = new Set<EventHandler>()
  private stateChangeHandlers = new Set<StateChangeHandler>()
  private unlisten: UnlistenFn | null = null
  private isConnected = false
  /** @internal Exposed for testing only */
  public lastVersion = 0
  private connectPromise: Promise<void> | null = null

  /**
   * Check if backend is connected
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Initialize the backend sync service
   * Safe to call multiple times - will return the same promise if already connecting
   */
  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.isConnected) {
      return
    }

    // If currently connecting, return the same promise
    if (this.connectPromise) {
      return this.connectPromise
    }

    // Start new connection
    this.connectPromise = this.doConnect()

    try {
      await this.connectPromise
    } finally {
      this.connectPromise = null
    }
  }

  /**
   * Internal connection logic
   */
  private async doConnect(): Promise<void> {
    try {
      // Double-check not already connected (race condition protection)
      if (this.isConnected) {
        logger.info("Backend sync already connected, skipping")
        return
      }

      // Check if running in Tauri environment
      if (!isDesktop()) {
        logger.warn("Backend sync is only available in Tauri environment, skipping connection")
        this.isConnected = false
        return
      }

      logger.info("Backend sync connecting...")

      // Subscribe to backend events
      logger.info("🔵 REGISTERING listener for 'project:event'...")
      this.unlisten = await listen<EventEnvelope>("project:event", (event) => {
        logger.info("🟢 RECEIVED event from Tauri:", { eventType: event.payload.event.type })
        this.handleBackendEvent(event.payload)
      })
      logger.info("✅ LISTENER registered successfully")

      // Get initial state
      const state = await this.getProjectState()
      if (state) {
        this.lastVersion = state.version
        this.notifyStateChange(state)
      }

      this.isConnected = true
      logger.info("Backend sync connected successfully")
    } catch (error) {
      logger.error("Failed to connect backend sync:", { error })
      this.isConnected = false
      throw error
    }
  }

  /**
   * Disconnect from backend
   */
  async disconnect(): Promise<void> {
    if (this.unlisten) {
      try {
        this.unlisten()
      } catch (error) {
        logger.warn("Error during unlisten", { error })
      }
      this.unlisten = null
    }
    this.isConnected = false
    logger.info("Backend sync disconnected")
  }

  /**
   * Execute a command on the backend
   */
  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    // Check if running in Tauri environment
    if (!isDesktop()) {
      logger.warn("Backend commands are only available in Tauri environment")
      return {
        success: false,
        error: "Backend commands are only available in desktop mode",
        data: null,
      }
    }

    try {
      const result = await commands.executeCommand(command)
      if (result.status === "ok") {
        return result.data
      }
      logger.error("Command execution failed:", { error: result.error })
      return {
        success: false,
        error: result.error,
        data: null,
      }
    } catch (error) {
      logger.error("Command execution failed:", { error })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: null,
      }
    }
  }

  /**
   * Get current project state
   */
  async getProjectState(): Promise<ProjectState | null> {
    // Check if running in Tauri environment
    if (!isDesktop()) {
      logger.warn("Backend state is only available in Tauri environment")
      return null
    }

    try {
      const result = await commands.getProjectState()
      if (result.status === "ok") {
        return result.data
      }
      logger.error("Failed to get project state:", { error: result.error })
      return null
    } catch (error) {
      logger.error("Failed to get project state:", { error })
      return null
    }
  }

  /**
   * Get event history since a specific version
   */
  async getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]> {
    try {
      const result = await commands.getEventHistory(sinceVersion ?? this.lastVersion)
      if (result.status === "ok") {
        return result.data
      }
      logger.error("Failed to get event history:", { error: result.error })
      return []
    } catch (error) {
      logger.error("Failed to get event history:", { error })
      return []
    }
  }

  // ===========================
  // VERSION CONTROL METHODS
  // ===========================

  /**
   * Create a version snapshot with optional message
   */
  async createSnapshot(message?: string): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "CreateSnapshot",
      params: { message },
    } as ProjectCommand
    return this.executeCommand(command)
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(versionId: string): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "RestoreVersion",
      params: { version_id: versionId },
    }
    return this.executeCommand(command)
  }

  /**
   * Get version history with optional limit
   */
  async getVersionHistory(limit?: number): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "GetVersionHistory",
      params: { limit: limit ?? null },
    }
    return this.executeCommand(command)
  }

  /**
   * Compare two versions and get differences
   */
  async compareVersions(versionA: string, versionB: string): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "CompareVersions",
      params: { version_a: versionA, version_b: versionB },
    }
    return this.executeCommand(command)
  }

  /**
   * Create a new branch from current or specified version
   */
  async createBranch(branchName: string, fromVersion?: string): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "CreateBranch",
      params: { branch_name: branchName, from_version: fromVersion ?? null },
    }
    return this.executeCommand(command)
  }

  /**
   * Merge one branch into another
   */
  async mergeBranch(sourceBranch: string, targetBranch: string): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "MergeBranch",
      params: { source_branch: sourceBranch, target_branch: targetBranch },
    }
    return this.executeCommand(command)
  }

  /**
   * Switch to a different branch
   */
  async switchBranch(branchName: string): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "SwitchBranch",
      params: { branch_name: branchName },
    }
    return this.executeCommand(command)
  }

  /**
   * Set auto-save interval in seconds
   */
  async setAutoSaveInterval(seconds: number): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "SetAutoSaveInterval",
      params: { seconds },
    }
    return this.executeCommand(command)
  }

  /**
   * Enable or disable auto-save
   */
  async enableAutoSave(enabled: boolean): Promise<CommandResult> {
    const command: ProjectCommand = {
      type: "EnableAutoSave",
      params: { enabled },
    }
    return this.executeCommand(command)
  }

  /**
   * Subscribe to backend events
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler)
    return () => {
      this.stateChangeHandlers.delete(handler)
    }
  }

  /**
   * Handle incoming backend event
   * @internal Exposed for testing only
   */
  public handleBackendEvent(envelope: EventEnvelope) {
    logger.info("BackendSync: Received event", { envelope })
    // Update last version
    this.lastVersion = envelope.metadata.version

    // Notify event handlers (отправляем событие напрямую, БЕЗ fetch состояния)
    this.eventHandlers.forEach((handler) => {
      try {
        handler(envelope.event)
      } catch (error) {
        logger.error("Event handler error:", { error })
      }
    })

    // ✅ АРХИТЕКТУРА: События обновляют state инкрементально
    // ❌ НЕ делаем fetchAndNotifyState() - события уже содержат все данные
    // Провайдеры обрабатывают события через XState машины или локальный state
    //
    // MediaManagement Provider обрабатывает события:
    // - MediaAdded, MediaRemoved, MediaUpdated
    // MediaAdapter теперь читает из MediaManagementContext.mediaPool
  }

  /**
   * Notify state change handlers
   * Используется ТОЛЬКО для инициализации при первой загрузке
   * @internal Exposed for testing only
   */
  public notifyStateChange(state: ProjectState) {
    logger.info("BackendSync: Notifying state change to handlers", { handlersCount: this.stateChangeHandlers.size })
    this.stateChangeHandlers.forEach((handler) => {
      try {
        handler(state)
      } catch (error) {
        logger.error("State change handler error:", { error })
      }
    })
  }
}

// Singleton instance
let backendSyncInstance: BackendSync | null = null

/**
 * Get or create backend sync instance
 * @deprecated Use container.getBackend() instead for platform-independent code
 */
export function getBackendSync(): BackendSync {
  if (!backendSyncInstance) {
    backendSyncInstance = new BackendSync()
  }
  return backendSyncInstance
}
