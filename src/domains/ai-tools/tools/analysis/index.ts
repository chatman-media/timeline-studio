/**
 * Analysis AI Tools Domain
 * Инструменты анализа и обработки контента
 */

// Audio Analysis Tools
export * from "./audio-analysis"
// Content Intelligence Tools
export * from "./content-intelligence"
// Multimodal & Person ID Tools
export * from "./multimodal"
export * from "./person-identification"
// Video Analysis Tools
export * from "./video-analysis"
// Whisper Tools
export * from "./whisper"

import { audioAnalysisTools } from "./audio-analysis"
import { contentIntelligenceTools } from "./content-intelligence"
import { multimodalTools } from "./multimodal"
import { personIdentificationTools } from "./person-identification"
// Импорты для статистики
import { videoAnalysisTools } from "./video-analysis"
import { whisperTools } from "./whisper"

// Все Analysis инструменты
export const analysisTools = [
  ...videoAnalysisTools,
  ...audioAnalysisTools,
  ...contentIntelligenceTools,
  ...whisperTools,
  ...multimodalTools,
  ...personIdentificationTools,
]

// Статистика Analysis Tools
export const ANALYSIS_TOOLS_COUNT = analysisTools.length

export const ANALYSIS_TOOLS_STATS = {
  videoAnalysis: videoAnalysisTools.length,
  audioAnalysis: audioAnalysisTools.length,
  contentIntelligence: contentIntelligenceTools.length,
  whisper: whisperTools.length,
  multimodal: multimodalTools.length,
  personIdentification: personIdentificationTools.length,
  total: ANALYSIS_TOOLS_COUNT,
} as const

// Утилиты для работы с Analysis Tools
export function getAnalysisToolsByCategory(category: keyof typeof ANALYSIS_TOOLS_STATS) {
  switch (category) {
    case "videoAnalysis":
      return videoAnalysisTools
    case "audioAnalysis":
      return audioAnalysisTools
    case "contentIntelligence":
      return contentIntelligenceTools
    case "whisper":
      return whisperTools
    case "multimodal":
      return multimodalTools
    case "personIdentification":
      return personIdentificationTools
    default:
      return analysisTools
  }
}

export function getAnalysisToolsMetadata() {
  return analysisTools.map((tool) => ({
    name: tool.metadata.name,
    category: tool.metadata.category,
    description: tool.metadata.description,
    tags: tool.metadata.tags,
    dependencies: tool.metadata.dependencies,
  }))
}

export function findAnalysisToolByName(name: string) {
  return analysisTools.find((tool) => tool.metadata.name === name)
}

export function getAnalysisToolsByTags(tags: string[]) {
  return analysisTools.filter((tool) => tool.metadata.tags?.some((tag) => tags.includes(tag)))
}

export function validateAnalysisTools() {
  const issues: string[] = []

  analysisTools.forEach((tool) => {
    if (!tool.metadata.name) {
      issues.push(`Tool missing name: ${tool.constructor.name}`)
    }
    if (!tool.metadata.description) {
      issues.push(`Tool missing description: ${tool.metadata.name}`)
    }
    if (!tool.metadata.category) {
      issues.push(`Tool missing category: ${tool.metadata.name}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
    totalTools: analysisTools.length,
  }
}
