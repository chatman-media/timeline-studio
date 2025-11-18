/**
 * Анализатор контекста для генерации умных промтов
 */

import { createLogger } from "@/lib/tauri-logger"
import { CONTEXTUAL_PROMPTS, EMPTY_STATE_PROMPTS, UNIVERSAL_PROMPTS } from "./prompt-templates"
import type { AnalysisContext, SuggestedPrompt } from "./types"

const logger = createLogger({ module: "ContextAnalyzer" })

/**
 * Проверяет, подходит ли промт для текущего контекста
 */
function isPromptRelevant(prompt: SuggestedPrompt, context: AnalysisContext): boolean {
  // Если нет условий - промт всегда подходит
  if (!prompt.requiredConditions) {
    return true
  }

  const conditions = prompt.requiredConditions

  // Проверяем все условия
  if (conditions.hasMusic !== undefined) {
    if (!context.hasMusic) {
      return false
    }
  }

  if (conditions.hasFaces !== undefined) {
    if (!context.facesCount || context.facesCount === 0) {
      return false
    }
  }

  if (conditions.hasSpeech !== undefined) {
    if (!context.hasSpeech) {
      return false
    }
  }

  if (conditions.hasScenes !== undefined) {
    if (!context.sceneCount || context.sceneCount === 0) {
      return false
    }
  }

  if (conditions.minScenes !== undefined) {
    if (!context.sceneCount || context.sceneCount < conditions.minScenes) {
      return false
    }
  }

  if (conditions.avgSceneDuration !== undefined) {
    if (!context.avgSceneDuration || context.avgSceneDuration < conditions.avgSceneDuration) {
      return false
    }
  }

  if (conditions.hasLowQuality !== undefined) {
    // Считаем качество низким, если overall quality < 50
    const hasLowQuality = context.overallQuality !== undefined && context.overallQuality < 50
    if (!hasLowQuality) {
      return false
    }
  }

  return true
}

/**
 * Анализирует контекст и возвращает подходящие промты
 */
export function analyzeContextForPrompts(context: AnalysisContext): SuggestedPrompt[] {
  logger.info("Analyzing context for prompts", {
    hasAnalysis: context.hasAnalysisResults,
    mediaCount: context.mediaFilesCount,
    sceneCount: context.sceneCount,
    hasMusic: context.hasMusic,
    facesCount: context.facesCount,
  })

  const prompts: SuggestedPrompt[] = []

  // Если нет медиа - показываем промты для пустого состояния
  if (context.mediaFilesCount === 0) {
    return EMPTY_STATE_PROMPTS
  }

  // Всегда показываем универсальные промты
  prompts.push(...UNIVERSAL_PROMPTS)

  // Если есть результаты анализа - добавляем контекстные промты
  if (context.hasAnalysisResults) {
    const relevantContextualPrompts = CONTEXTUAL_PROMPTS.filter((prompt) => isPromptRelevant(prompt, context))

    prompts.push(...relevantContextualPrompts)

    logger.info("Found relevant contextual prompts", {
      total: relevantContextualPrompts.length,
      prompts: relevantContextualPrompts.map((p) => p.id),
    })
  }

  // Сортируем по приоритету (выше = важнее)
  prompts.sort((a, b) => (b.priority || 0) - (a.priority || 0))

  // Ограничиваем количество промтов (топ-12)
  const topPrompts = prompts.slice(0, 12)

  logger.info("Generated prompts", {
    total: topPrompts.length,
    universal: topPrompts.filter((p) => p.category === "universal" || p.category === "platform").length,
    contextual: topPrompts.filter((p) => p.category === "style" || p.category === "quick" || p.category === "quality")
      .length,
  })

  return topPrompts
}

/**
 * Создаёт контекст анализа из результатов AI Director
 */
export function createAnalysisContext(params: {
  analysisResult?: any // ComprehensiveAnalysisResult
  mediaFilesCount: number
}): AnalysisContext {
  const { analysisResult, mediaFilesCount } = params

  if (!analysisResult) {
    return {
      hasAnalysisResults: false,
      mediaFilesCount,
    }
  }

  return {
    hasAnalysisResults: true,
    mediaFilesCount,

    // Scene analysis
    sceneCount: analysisResult.scene_analysis?.total_scenes || 0,
    avgSceneDuration: analysisResult.scene_analysis?.avg_scene_duration || 0,

    // Moment analysis
    momentCount: analysisResult.moment_analysis?.total_moments || 0,

    // Audio analysis
    hasMusic: analysisResult.audio_analysis?.has_music || false,
    musicConfidence: analysisResult.audio_analysis?.music_confidence || 0,
    hasSpeech: analysisResult.audio_analysis?.has_speech || false,

    // Vision analysis
    facesCount: analysisResult.vision_analysis?.faces_count || 0,

    // Quality
    overallQuality: analysisResult.content_analysis?.overall_quality || 0,
    visualQuality: analysisResult.content_analysis?.visual_quality || 0,
    audioQuality: analysisResult.content_analysis?.audio_quality || 0,
  }
}
