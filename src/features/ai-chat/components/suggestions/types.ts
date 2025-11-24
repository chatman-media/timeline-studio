/**
 * Типы для AI Suggestions Panel
 */

export type PromptCategory = "universal" | "style" | "platform" | "quick" | "quality" | "montage"

export interface SuggestedPrompt {
  id: string
  emoji: string
  text: string
  category: PromptCategory
  priority?: number // Для сортировки (выше = важнее)
  requiredConditions?: {
    hasMusic?: boolean
    hasScenes?: boolean
    hasFaces?: boolean
    hasSpeech?: boolean
    minScenes?: number
    avgSceneDuration?: number
    hasLowQuality?: boolean
  }
}

export interface AnalysisContext {
  // Результаты AI Director анализа
  hasAnalysisResults: boolean
  sceneCount?: number
  avgSceneDuration?: number
  momentCount?: number
  hasMusic?: boolean
  musicConfidence?: number
  hasSpeech?: boolean
  facesCount?: number
  overallQuality?: number
  visualQuality?: number
  audioQuality?: number

  // Информация о медиа
  mediaFilesCount: number
  totalDuration?: number
}
