/**
 * Timeline AI Tools - модульная организация инструментов для работы с Timeline
 */

import { timelineAnalyticsTool } from "./analytics-timeline"
import { storyAnalysisTool } from "./analyze-story"
import { structureAnalysisTool } from "./analyze-structure"
import { enhancementApplicationTool } from "./apply-enhancements"
import { projectCreationTool } from "./create-project"
import { sectionCreationTool } from "./create-sections"
import { trackCreationTool } from "./create-tracks"
import { sceneDetectionTool } from "./detect-scenes"
import { timelineExportTool } from "./export-data"
import { clipManagementTool } from "./manage-clips"
import { timelineOptimizationTool } from "./optimize-timeline"
import { clipPlacementTool } from "./place-clips"
import { smartTemplatesTools } from "./smart-templates"
import { improvementsSuggestionTool } from "./suggest-improvements"
import { musicSyncTool } from "./sync-music"

export {
  analyzeTimelineUsage,
  timelineAnalyticsTool,
} from "./analytics-timeline"
export {
  analyzeContentForStory,
  storyAnalysisTool,
} from "./analyze-story"
export { analyzeTimelineStructure, structureAnalysisTool } from "./analyze-structure"
export {
  applyAutomaticEnhancements,
  enhancementApplicationTool,
} from "./apply-enhancements"
export { createTimelineProject, projectCreationTool } from "./create-project"
export { createSectionsByStrategy, sectionCreationTool } from "./create-sections"
export { createTrackStructure, trackCreationTool } from "./create-tracks"
export {
  detectAndSplitScenes,
  sceneDetectionTool,
} from "./detect-scenes"
export { exportTimelineData, timelineExportTool } from "./export-data"
export { clipManagementTool, manageTimelineClips } from "./manage-clips"
export {
  optimizeTimelinePerformance,
  timelineOptimizationTool,
} from "./optimize-timeline"
export { clipPlacementTool, placeClipsOnTimeline } from "./place-clips"
export { manageSmartTemplates, smartTemplatesTools } from "./smart-templates"
export {
  improvementsSuggestionTool,
  suggestTimelineImprovements,
} from "./suggest-improvements"
export { musicSyncTool, synchronizeWithMusic } from "./sync-music"
// Экспортируем типы
export * from "./types"
export * from "./utils/analyzers"
export * from "./utils/calculators"
export * from "./utils/creators"
export * from "./utils/detectors"
export * from "./utils/exporters"
export * from "./utils/formatters"
// Экспортируем утилиты
export * from "./utils/generators"
export * from "./utils/helpers"

export const timelineTools = [
  structureAnalysisTool,
  projectCreationTool,
  sectionCreationTool,
  trackCreationTool,
  clipPlacementTool,
  enhancementApplicationTool,
  storyAnalysisTool,
  sceneDetectionTool,
  musicSyncTool,
  improvementsSuggestionTool,
  timelineExportTool,
  // Новые инструменты
  timelineOptimizationTool,
  clipManagementTool,
  timelineAnalyticsTool,
  smartTemplatesTools,
]

/**
 * Универсальная функция для выполнения любого timeline инструмента
 */
export async function executeTimelineTool(operation: string, params: any, options?: any): Promise<any> {
  // Находим соответствующий инструмент по операции
  const toolMap: Record<string, any> = {
    analyze_structure: structureAnalysisTool,
    create_project: projectCreationTool,
    create_sections: sectionCreationTool,
    create_tracks: trackCreationTool,
    place_clips: clipPlacementTool,
    apply_enhancements: enhancementApplicationTool,
    analyze_story: storyAnalysisTool,
    detect_scenes: sceneDetectionTool,
    sync_music: musicSyncTool,
    suggest_improvements: improvementsSuggestionTool,
    export_data: timelineExportTool,
    optimize_timeline: timelineOptimizationTool,
    manage_clips: clipManagementTool,
    analytics: timelineAnalyticsTool,
    smart_templates: smartTemplatesTools,
  }

  const tool = toolMap[operation]
  if (!tool) {
    throw new Error(`Unknown timeline operation: ${operation}`)
  }

  // Выполняем инструмент с соответствующим методом
  if (typeof tool.execute === "function") {
    return tool.execute(params, options)
  }

  // Fallback для инструментов с другой структурой
  return tool(params, options)
}
