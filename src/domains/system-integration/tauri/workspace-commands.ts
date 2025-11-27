/**
 * Workspace Tauri Commands
 *
 * All workspace persistence-related Tauri backend operations.
 * This is the only place where invoke() is called for workspace state.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("WorkspaceCommands")

/**
 * Save workspace state to Tauri backend
 *
 * @param stateJson - Serialized workspace state
 */
export async function saveWorkspaceState(stateJson: string): Promise<void> {
  logger.debugSync("Saving workspace state to backend")
  try {
    await invoke("save_workspace_state", { state: stateJson })
    logger.debugSync("Workspace state saved to backend successfully")
  } catch (error) {
    logger.errorSync("Failed to save workspace state to backend", { error })
    throw error
  }
}

/**
 * Load workspace state from Tauri backend
 *
 * @returns Serialized workspace state or null if not found
 */
export async function loadWorkspaceState(): Promise<string | null> {
  logger.debugSync("Loading workspace state from backend")
  try {
    const stateJson = await invoke<string>("load_workspace_state")
    if (stateJson) {
      logger.debugSync("Workspace state loaded from backend successfully")
    } else {
      logger.debugSync("No workspace state found in backend")
    }
    return stateJson
  } catch (error) {
    logger.errorSync("Failed to load workspace state from backend", { error })
    throw error
  }
}
