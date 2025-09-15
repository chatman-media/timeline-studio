/**
 * Player AI Tools - модульная организация инструментов для работы с плеером
 */

import { analyzeCurrentMedia, analyzeCurrentMediaTool } from "./analyze-media"
import { controlPlayback, controlPlaybackTool } from "./playback-control"
import {
  applyPreviewEffects,
  applyPreviewEffectsTool,
  applyPreviewFilters,
  applyPreviewFiltersTool,
} from "./preview-effects"

import type { PlayerToolResult } from "./types"

export { analyzeCurrentMedia, analyzeCurrentMediaTool } from "./analyze-media"
export { controlPlayback, controlPlaybackTool } from "./playback-control"
export {
  applyPreviewEffects,
  applyPreviewEffectsTool,
  applyPreviewFilters,
  applyPreviewFiltersTool,
} from "./preview-effects"

// Экспортируем типы
export * from "./types"

// Экспортируем утилиты
export * from "./utils/helpers"

export const playerTools = [
  analyzeCurrentMediaTool,
  controlPlaybackTool,
  applyPreviewEffectsTool,
  applyPreviewFiltersTool,
]

export async function executePlayerTool(toolName: string, params: any): Promise<PlayerToolResult> {
  try {
    switch (toolName) {
      case "analyze_current_media":
        return await analyzeCurrentMedia(params)

      case "control_playback":
        return await controlPlayback(params)

      case "apply_preview_effects":
        return await applyPreviewEffects(params)

      case "apply_preview_filters":
        return await applyPreviewFilters(params)

      default:
        return {
          success: false,
          message: `Неизвестный player инструмент: ${toolName}`,
          errors: [`Unknown player tool: ${toolName}`],
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения player инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
