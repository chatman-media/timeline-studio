/**
 * Resources AI Tools - модульная организация инструментов для работы с ресурсами
 */

import { analyzeAvailableResources, analyzeAvailableResourcesTool } from "./analyze-resources"
import { analyzeResourceCompatibility, analyzeResourceCompatibilityTool } from "./compatibility-analysis"
import { exportResourceList, exportResourceListTool } from "./export-resources"
import {
  addResourceToPoolTool,
  bulkAddResourcesTool,
  executeManageResourcesTool,
  removeResourceFromPoolTool,
} from "./manage-resources"
import { suggestComplementaryResources, suggestComplementaryResourcesTool } from "./suggest-resources"
import type { ResourceToolResult } from "./types"
import {
  cleanupUnusedResources,
  cleanupUnusedResourcesTool,
  getResourceUsageStats,
  getResourceUsageStatsTool,
} from "./usage-stats"

export { analyzeAvailableResources, analyzeAvailableResourcesTool } from "./analyze-resources"
export { analyzeResourceCompatibility, analyzeResourceCompatibilityTool } from "./compatibility-analysis"
export { exportResourceList, exportResourceListTool } from "./export-resources"
export {
  addResourceToPoolTool,
  bulkAddResourcesTool,
  removeResourceFromPoolTool,
} from "./manage-resources"
export { suggestComplementaryResources, suggestComplementaryResourcesTool } from "./suggest-resources"
// Экспортируем типы
export * from "./types"
export {
  cleanupUnusedResources,
  cleanupUnusedResourcesTool,
  getResourceUsageStats,
  getResourceUsageStatsTool,
} from "./usage-stats"

// Экспортируем утилиты
export * from "./utils/helpers"

export const resourceTools = [
  analyzeAvailableResourcesTool,
  addResourceToPoolTool,
  bulkAddResourcesTool,
  removeResourceFromPoolTool,
  suggestComplementaryResourcesTool,
  analyzeResourceCompatibilityTool,
  getResourceUsageStatsTool,
  cleanupUnusedResourcesTool,
  exportResourceListTool,
]

export async function executeResourceTool(toolName: string, params: any): Promise<ResourceToolResult> {
  try {
    switch (toolName) {
      case "analyze_available_resources":
        return await analyzeAvailableResources(params)

      case "add_resource_to_pool":
        const addResult = await executeManageResourcesTool("add_resource_to_pool", params)
        return {
          success: addResult.success,
          message: addResult.data?.message || addResult.message || "Ошибка добавления ресурса",
          data: addResult.data?.addedResource,
          errors: addResult.errors,
        }

      case "bulk_add_resources":
        const bulkResult = await executeManageResourcesTool("bulk_add_resources", params)
        return {
          success: bulkResult.success,
          message: bulkResult.data?.message || bulkResult.message || "Ошибка массового добавления",
          data: {
            addedResources: bulkResult.data?.bulkResults?.map((r: any) => r.resourceId) || [],
            analysis: bulkResult.data?.bulkResults,
          },
          errors: bulkResult.errors,
        }

      case "remove_resource_from_pool":
        const removeResult = await executeManageResourcesTool("remove_resource_from_pool", params)
        return {
          success: removeResult.success,
          message: removeResult.data?.message || removeResult.message || "Ошибка удаления ресурса",
          data: removeResult.data?.removedResource,
          errors: removeResult.errors,
        }

      case "suggest_complementary_resources":
        return await suggestComplementaryResources(params)

      case "analyze_resource_compatibility":
        return await analyzeResourceCompatibility(params)

      case "get_resource_usage_stats":
        return await getResourceUsageStats(params)

      case "cleanup_unused_resources":
        return await cleanupUnusedResources(params)

      case "export_resource_list":
        return await exportResourceList(params)

      default:
        return {
          success: false,
          message: `Неизвестный resource инструмент: ${toolName}`,
          errors: [`Unknown resource tool: ${toolName}`],
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения resource инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
