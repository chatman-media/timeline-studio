/**
 * Project Management / General Tauri Commands
 *
 * All project management-related Tauri backend operations.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ProjectCommands")

// Batch command operations
export async function executeBatchCommands(request: any): Promise<any> {
  logger.debugSync("Executing batch commands", { commandCount: request.commands?.length })
  return invoke("execute_batch_commands", { request })
}

// App directories operations
export async function getAppDirectories(): Promise<any> {
  logger.debugSync("Getting app directories")
  return invoke("get_app_directories")
}

export async function createAppDirectories(): Promise<any> {
  logger.infoSync("Creating app directories")
  return invoke("create_app_directories")
}

export async function getDirectorySizes(): Promise<any> {
  logger.debugSync("Getting directory sizes")
  return invoke("get_directory_sizes")
}

export async function clearAppCache(): Promise<void> {
  logger.infoSync("Clearing app cache")
  return invoke("clear_app_cache")
}
