/**
 * Browser AI Tools - модульная организация инструментов для работы с браузером
 */

import { analyzeMediaBrowser, analyzeMediaBrowserTool } from "./analyze-browser"
import { getBrowserState, getBrowserStateTool, updateBrowserFilters, updateBrowserFiltersTool } from "./browser-state"
import {
  analyzeMissingContent,
  analyzeMissingContentTool,
  exportFileList,
  exportFileListTool,
  suggestImportSources,
  suggestImportSourcesTool,
} from "./content-analysis"
import { analyzeFileRelationships, bulkSelectFiles, fileOperationsTools, getFileGroups } from "./file-operations"
import { searchMediaFiles, searchMediaFilesTool } from "./search-files"

import type { BrowserToolResult } from "./types"

export { analyzeMediaBrowser, analyzeMediaBrowserTool } from "./analyze-browser"
export {
  getBrowserState,
  getBrowserStateTool,
  updateBrowserFilters,
  updateBrowserFiltersTool,
} from "./browser-state"
export {
  analyzeMissingContent,
  analyzeMissingContentTool,
  exportFileList,
  exportFileListTool,
  suggestImportSources,
  suggestImportSourcesTool,
} from "./content-analysis"
export {
  analyzeFileRelationships,
  bulkSelectFiles,
  fileOperationsTools,
  getFileGroups,
} from "./file-operations"

// Re-export individual tools from the tools array
export const getFileGroupsTool = fileOperationsTools[0]
export const analyzeFileRelationshipsTool = fileOperationsTools[1]
export const bulkSelectFilesTool = fileOperationsTools[2]
export { searchMediaFiles, searchMediaFilesTool } from "./search-files"

// Экспортируем типы
export * from "./types"

// Экспортируем утилиты (кроме analyzeFileRelationships, которая уже экспортируется из file-operations)
export {
  filterFiles,
  findFilesByPattern,
  formatDateKey,
  formatDuration,
  formatFileSize,
  getBrowserFiles,
  getBrowserStateAccess,
  getBrowserStats,
  getCurrentTab,
  getFileTypeCategory,
  getRandomFiles,
  getSelectedFiles,
  getSizeCategory,
  groupFiles,
  hasBrowserAccess,
  setBrowserStateAccess,
  sortFiles,
} from "./utils/helpers"

export const browserTools = [
  analyzeMediaBrowserTool,
  searchMediaFilesTool,
  getFileGroupsTool,
  analyzeFileRelationshipsTool,
  bulkSelectFilesTool,
  getBrowserStateTool,
  updateBrowserFiltersTool,
  analyzeMissingContentTool,
  suggestImportSourcesTool,
  exportFileListTool,
]

export async function executeBrowserTool(toolName: string, params: any): Promise<BrowserToolResult> {
  try {
    switch (toolName) {
      case "analyze_media_browser":
        return await analyzeMediaBrowser(params)

      case "search_media_files":
        return await searchMediaFiles(params)

      case "get_file_groups":
        return await getFileGroups(params)

      case "analyze_file_relationships":
        return await analyzeFileRelationships(params)

      case "bulk_select_files":
        return await bulkSelectFiles(params)

      case "get_browser_state":
        return await getBrowserState(params)

      case "update_browser_filters":
        return await updateBrowserFilters(params)

      case "analyze_missing_content":
        return await analyzeMissingContent(params)

      case "suggest_import_sources":
        return await suggestImportSources(params)

      case "export_file_list":
        return await exportFileList(params)

      default:
        return {
          success: false,
          message: `Неизвестный browser инструмент: ${toolName}`,
          errors: [`Unknown browser tool: ${toolName}`],
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения browser инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
