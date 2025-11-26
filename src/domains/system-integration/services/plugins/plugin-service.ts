/**
 * Plugin Service for System Integration Domain
 *
 * Provides plugin management functionality through Tauri backend
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("PluginService")

export interface PluginCommandResponse<T = any> {
  command_id: string
  success: boolean
  data?: T
  error?: string
}

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
): Promise<PluginCommandResponse<T>> {
  logger.debugSync("Sending plugin command", { pluginId, command })
  return invoke<PluginCommandResponse<T>>("send_plugin_command", {
    pluginId,
    command,
    params,
  })
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
