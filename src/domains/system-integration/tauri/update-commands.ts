/**
 * Update Tauri Commands
 *
 * All update-related Tauri backend operations.
 * This is the only place where invoke() is called for application updates.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type { UpdateCheckResult } from "../types"

const logger = createLogger("UpdateCommands")

/**
 * Check for available application updates
 *
 * @returns Update check result with availability info
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  logger.infoSync("Checking for updates")
  try {
    const result = await invoke<UpdateCheckResult>("check_for_update")
    logger.infoSync("Update check completed", {
      available: result.available,
      version: result.update_info?.version
    })
    return result
  } catch (error) {
    logger.errorSync("Failed to check for updates", { error })
    throw error
  }
}

/**
 * Download and install available update
 *
 * @returns Promise that resolves when download starts
 */
export async function downloadAndInstallUpdate(): Promise<void> {
  logger.infoSync("Starting update download and installation")
  try {
    await invoke("download_and_install_update")
    logger.infoSync("Update download started successfully")
  } catch (error) {
    logger.errorSync("Failed to download and install update", { error })
    throw error
  }
}
