/**
 * Backend synchronization service
 * Handles communication with Rust backend state management
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event"

// Use generated types from Specta
import {

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "BackendSync" })
  type CommandResult,
  commands,
  type EventEnvelope,
  type ProjectCommand,
  type ProjectEvent,
  type ProjectState,
} from "@/types/generated/tauri-bindings"

export type EventHandler = (event: ProjectEvent) => void
export type StateChangeHandler = (state: ProjectState) => void

export class BackendSync {
  private eventHandlers = new Set<EventHandler>()
  private stateChangeHandlers = new Set<StateChangeHandler>()
  private unlisten: UnlistenFn | null = null
  private isConnected = false
  private lastVersion = 0

  /**
   * Check if backend is connected
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Initialize the backend sync service
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      // Subscribe to backend events
      this.unlisten = await listen<EventEnvelope>("project:event", (event) => {
        this.handleBackendEvent(event.payload)
      })

      // Get initial state
      const state = await this.getProjectState()
      if (state) {
        this.lastVersion = state.version
        this.notifyStateChange(state)
      }

      this.isConnected = true
      logger.info("Backend sync connected")
    } catch (error) {
      logger.error("Failed to connect backend sync:", error)
      throw error
    }
  }

  /**
   * Disconnect from backend
   */
  async disconnect(): Promise<void> {
    if (this.unlisten) {
      this.unlisten()
      this.unlisten = null
    }
    this.isConnected = false
    logger.info("Backend sync disconnected")
  }

  /**
   * Execute a command on the backend
   */
  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    try {
      const result = await commands.executeCommand(command)
      if (result.status === "ok") {
        return result.data
      }
      logger.error("Command execution failed:", result.error)
      return {
        success: false,
        error: result.error,
        data: null,
      }
    } catch (error) {
      logger.error("Command execution failed:", error)
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
    try {
      const result = await commands.getProjectState()
      if (result.status === "ok") {
        return result.data
      }
      logger.error("Failed to get project state:", result.error)
      return null
    } catch (error) {
      logger.error("Failed to get project state:", error)
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
      logger.error("Failed to get event history:", result.error)
      return []
    } catch (error) {
      logger.error("Failed to get event history:", error)
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
   */
  private handleBackendEvent(envelope: EventEnvelope) {
    logger.info("BackendSync: Received event", envelope)
    // Update last version
    this.lastVersion = envelope.metadata.version

    // Notify event handlers
    this.eventHandlers.forEach((handler) => {
      try {
        handler(envelope.event)
      } catch (error) {
        logger.error("Event handler error:", error)
      }
    })

    // For state-changing events, fetch new state
    if (this.isStateChangingEvent(envelope.event)) {
      logger.info("BackendSync: State-changing event detected, fetching new state")
      void this.fetchAndNotifyState()
    }
  }

  /**
   * Check if event changes state
   */
  private isStateChangingEvent(event: ProjectEvent): boolean {
    const stateChangingTypes = [
      // Project lifecycle events
      "ProjectCreated",
      "ProjectOpened",
      "ProjectSaved",
      "ProjectClosed",
      // Timeline events
      "ClipAdded",
      "ClipMoved",
      "ClipTrimmed",
      "ClipDeleted",
      "ClipUpdated",
      "TrackAdded",
      "TrackDeleted",
      "TrackUpdated",
      // Media events
      "MediaAdded",
      "MediaRemoved",
      "MediaUpdated",
      // State events
      "StateRestored",
      // Version control events
      "SnapshotCreated",
      "VersionRestored",
      "BranchCreated",
      "BranchSwitched",
      "AutoSaveTriggered",
      "MergeCompleted",
      "AutoSaveConfigChanged",
    ]

    return stateChangingTypes.includes(event.type)
  }

  /**
   * Fetch state and notify handlers
   */
  private async fetchAndNotifyState() {
    const state = await this.getProjectState()
    logger.info("BackendSync: Fetched project state", state)
    if (state) {
      this.notifyStateChange(state)
    }
  }

  /**
   * Notify state change handlers
   */
  private notifyStateChange(state: ProjectState) {
    logger.info("BackendSync: Notifying state change to", this.stateChangeHandlers.size, "handlers")
    this.stateChangeHandlers.forEach((handler) => {
      try {
        handler(state)
      } catch (error) {
        logger.error("State change handler error:", error)
      }
    })
  }
}

// Singleton instance
let backendSyncInstance: BackendSync | null = null

/**
 * Get or create backend sync instance
 */
export function getBackendSync(): BackendSync {
  if (!backendSyncInstance) {
    backendSyncInstance = new BackendSync()
  }
  return backendSyncInstance
}
