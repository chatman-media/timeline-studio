/**
 * AI Tools / Tauri Commands
 *
 * All AI tools-related Tauri backend operations.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AIToolsCommands")

// Montage planning operations
export async function detectKeyMoments(videoPaths: string[], config: any): Promise<any> {
  logger.debugSync("Detecting key moments", { videoCount: videoPaths.length })
  return invoke("detect_key_moments", { videoPaths, config })
}

export async function generateMontagePlan(moments: any[], config: any, sourceFiles: string[]): Promise<any> {
  logger.debugSync("Generating montage plan", { momentsCount: moments.length })
  return invoke("generate_montage_plan", { moments, config, sourceFiles })
}

// MCP tools execution
export async function mcpExecuteTool(request: { tool_name: string; arguments: any }): Promise<any> {
  logger.debugSync("Executing MCP tool", { toolName: request.tool_name })
  return invoke("mcp_execute_tool", { request })
}
