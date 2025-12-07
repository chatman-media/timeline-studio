/**
 * Workspace Persistence Service
 *
 * Handles saving and loading workspace state from localStorage and Tauri backend
 */

import type { LayoutPreset, Widget } from "@/domains/system-integration/types/workspace"
import { createLogger } from "@/lib/tauri-logger"
import {
  loadWorkspaceState as loadWorkspaceStateTauri,
  saveWorkspaceState as saveWorkspaceStateTauri,
} from "../../tauri/workspace-commands"

const logger = createLogger("WorkspacePersistence")

const STORAGE_KEY = "timeline-studio-workspace-state"

/**
 * Serializable workspace state
 */
export interface WorkspaceState {
  currentPresetId: string
  activeWidgets: Widget[]
  customLayouts: LayoutPreset[]
  version: string
}

/**
 * Save workspace state to localStorage
 */
export async function saveWorkspaceStateLocal(state: WorkspaceState): Promise<void> {
  try {
    const serialized = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serialized)
    logger.debugSync("Workspace state saved to localStorage", {
      presetId: state.currentPresetId,
      widgetCount: state.activeWidgets.length,
      customLayoutCount: state.customLayouts.length,
    })
  } catch (error) {
    logger.errorSync("Failed to save workspace state to localStorage", { error })
    throw error
  }
}

/**
 * Load workspace state from localStorage
 */
export function loadWorkspaceStateLocal(): WorkspaceState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) {
      logger.debugSync("No workspace state found in localStorage")
      return null
    }

    const state = JSON.parse(serialized) as WorkspaceState
    logger.debugSync("Workspace state loaded from localStorage", {
      presetId: state.currentPresetId,
      widgetCount: state.activeWidgets.length,
      customLayoutCount: state.customLayouts.length,
    })
    return state
  } catch (error) {
    logger.errorSync("Failed to load workspace state from localStorage", { error })
    return null
  }
}

/**
 * Clear workspace state from localStorage
 */
export function clearWorkspaceStateLocal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    logger.debugSync("Workspace state cleared from localStorage")
  } catch (error) {
    logger.errorSync("Failed to clear workspace state from localStorage", { error })
  }
}

/**
 * Save workspace state to Tauri backend (for persistent storage across sessions)
 */
export async function saveWorkspaceStateBackend(state: WorkspaceState): Promise<void> {
  try {
    await saveWorkspaceStateTauri(JSON.stringify(state))
    logger.debugSync("Workspace state saved to backend", {
      presetId: state.currentPresetId,
      widgetCount: state.activeWidgets.length,
    })
  } catch (error) {
    logger.errorSync("Failed to save workspace state to backend", { error })
    // Don't throw - backend sync is optional, localStorage is primary
  }
}

/**
 * Load workspace state from Tauri backend
 */
export async function loadWorkspaceStateBackend(): Promise<WorkspaceState | null> {
  try {
    const stateJson = await loadWorkspaceStateTauri()
    if (!stateJson) {
      logger.debugSync("No workspace state found in backend")
      return null
    }

    const state = JSON.parse(stateJson) as WorkspaceState
    logger.debugSync("Workspace state loaded from backend", {
      presetId: state.currentPresetId,
      widgetCount: state.activeWidgets.length,
    })
    return state
  } catch (error) {
    logger.warnSync("Failed to load workspace state from backend", { error })
    // Don't throw - backend might not be available yet
    return null
  }
}

/**
 * Debounced save to prevent excessive writes
 */
let saveTimeout: NodeJS.Timeout | null = null
const DEBOUNCE_MS = 1000

export function debouncedSave(state: WorkspaceState): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  saveTimeout = setTimeout(() => {
    saveWorkspaceStateLocal(state)
    // Also save to backend (fire and forget)
    saveWorkspaceStateBackend(state).catch((err) => {
      logger.warnSync("Background backend save failed", { error: err })
    })
  }, DEBOUNCE_MS)
}

/**
 * Load workspace state with fallback strategy:
 * 1. Try localStorage first (fastest)
 * 2. Fallback to backend if localStorage empty
 * 3. Return null if both empty
 */
export async function loadWorkspaceState(): Promise<WorkspaceState | null> {
  // Try localStorage first
  const localState = loadWorkspaceStateLocal()
  if (localState) {
    return localState
  }

  // Fallback to backend
  const backendState = await loadWorkspaceStateBackend()
  if (backendState) {
    // Sync to localStorage for faster future loads
    await saveWorkspaceStateLocal(backendState)
    return backendState
  }

  return null
}

/**
 * Validate workspace state structure
 */
export function isValidWorkspaceState(state: any): state is WorkspaceState {
  if (!state || typeof state !== "object") {
    return false
  }

  return (
    typeof state.currentPresetId === "string" &&
    Array.isArray(state.activeWidgets) &&
    Array.isArray(state.customLayouts) &&
    typeof state.version === "string"
  )
}
