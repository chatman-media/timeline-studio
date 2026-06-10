/**
 * Plugin Tauri Commands
 *
 * All plugin-related Tauri backend operations.
 * This is the only place where invoke() is called for plugins.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("PluginCommands")

export interface PluginCommandResponse<T = any> {
  command_id: string
  success: boolean
  data?: T
  error?: string
}

/**
 * Send a command to a loaded plugin
 *
 * @param pluginId - Plugin identifier
 * @param command - Command name
 * @param params - Command parameters
 * @returns Response from plugin
 */
export async function sendPluginCommand<T = any>(
  pluginId: string,
  command: string,
  params: Record<string, any> = {},
): Promise<PluginCommandResponse<T>> {
  logger.debugSync("Sending plugin command", { pluginId, command })
  try {
    const result = await invoke<PluginCommandResponse<T>>("send_plugin_command", {
      pluginId,
      command,
      params,
    })
    logger.debugSync("Plugin command executed", {
      pluginId,
      command,
      success: result.success,
    })
    return result
  } catch (error) {
    logger.errorSync("Failed to send plugin command", { pluginId, command, error })
    throw error
  }
}
