/**
 * Plugin Service for System Integration Domain
 *
 * Provides plugin management functionality through Tauri backend
 */

import { createLogger } from "@/lib/tauri-logger"
import { sendPluginCommand as sendPluginCommandTauri } from "../../tauri/plugin-commands"

const logger = createLogger("PluginService")

// Re-export types
export type { PluginCommandResponse } from "../../tauri/plugin-commands"

/**
 * Send a command to a loaded plugin
 * @param pluginId - Plugin identifier
 * @param command - Command name
 * @param params - Command parameters
 */
export async function sendPluginCommand<T = any>(
  pluginId: string,
  command: string,
  params: Record<string, any> = {},
) {
  logger.debugSync("Delegating plugin command to Tauri layer", { pluginId, command })
  return sendPluginCommandTauri<T>(pluginId, command, params)
}

/**
 * Check if a plugin is loaded and available
 * @param pluginId - Plugin identifier
 */
export async function isPluginLoaded(pluginId: string): Promise<boolean> {
  try {
    const response = await sendPluginCommand(pluginId, "ping", {})
    return response.success
  } catch {
    return false
  }
}
