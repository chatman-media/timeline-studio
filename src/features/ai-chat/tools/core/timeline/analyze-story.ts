/**
 * AI инструмент для анализа нарратива и истории в Timeline с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для анализа истории
export interface StoryAnalysisInput {
  analysisScope?: "full-timeline" | "selected-section" | "time-range"
  storyElements?: ("narrative-arc" | "pacing" | "emotional-flow" | "visual-continuity" | "audio-consistency")[]
}

export interface NarrativeStructure {
  hasNarrative: boolean
  structure: string
  suggestions: string[]
  strength: number
}

export interface PacingAnalysis {
  rhythm: "none" | "slow" | "fast" | "medium"
  tempo: "very-slow" | "slow" | "medium" | "fast" | "very-fast"
  averageShotLength: number
  recommendations: string[]
}

export interface EmotionalFlow {
  hasEmotionalArc: boolean
  overallArc: "flat" | "rising" | "falling" | "complex"
  keyMoments: Array<{ time: number; emotion: string; intensity: number }>
  recommendations: string[]
}

export interface VisualContinuity {
  hasVisualContent: boolean
  abruptTransitions: number
  continuityScore: number
  suggestions: string[]
}

export interface AudioConsistency {
  hasAudioContent: boolean
  audioCoverage: number
  audioGaps: number
  consistencyScore: number
  suggestions: string[]
}

export interface StoryAnalysisResult {
  scope: string
  analyzedElements: string[]
  timestamp: string
  narrativeStructure?: NarrativeStructure
  pacing?: PacingAnalysis
  emotionalFlow?: EmotionalFlow
  visualContinuity?: VisualContinuity
  audioConsistency?: AudioConsistency
  overallRecommendations: string[]
  projectStats: {
    totalDuration: number
    totalClips: number
    totalTracks: number
    totalSections: number
  }
}

/**
 * AI инструмент для анализа истории Timeline с унифицированной обработкой ошибок
 */
export class StoryAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("StoryAnalysisTool", logger)
  }

  /**
   * Анализирует нарративную структуру Timeline
   */
  public async analyzeStoryContent(
    input: StoryAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<StoryAnalysisResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validScopes = ["full-timeline", "selected-section", "time-range"]
      if (data.analysisScope && !validScopes.includes(data.analysisScope)) {
        errors.push(`Неподдерживаемая область анализа: ${data.analysisScope}`)
      }

      const validElements = ["narrative-arc", "pacing", "emotional-flow", "visual-continuity", "audio-consistency"]
      if (data.storyElements?.some((element: string) => !validElements.includes(element))) {
        errors.push("Неподдерживаемые элементы истории для анализа")
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации параметров анализа истории",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const analysisScope = input.analysisScope || "full-timeline"
    const storyElements = input.storyElements || ["narrative-arc", "pacing", "emotional-flow"]

    // Выполняем анализ с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем анализ нарративной структуры", {
          scope: analysisScope,
          elementsCount: storyElements.length,
          elements: storyElements.join(", "),
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для анализа. Откройте или создайте проект в timeline")
        }

        // Получаем все треки для анализа
        const allTracks = [...currentProject.globalTracks]
        currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

        const allClips = allTracks.reduce((clips: any[], track) => {
          return clips.concat(track.clips || [])
        }, [])

        this.logger?.info("Анализируем структуру проекта", {
          tracksCount: allTracks.length,
          clipsCount: allClips.length,
          sectionsCount: currentProject.sections?.length || 0,
        })

        // Создаем базовую структуру результата
        const analysis: StoryAnalysisResult = {
          scope: analysisScope,
          analyzedElements: storyElements,
          timestamp: new Date().toISOString(),
          overallRecommendations: [],
          projectStats: timelineAccess.getProjectStats(),
        }

        const warnings: string[] = []

        // Анализируем каждый элемент истории
        for (const element of storyElements) {
          this.logger?.info(`Анализируем элемент: ${element}`)

          switch (element) {
            case "narrative-arc": {
              analysis.narrativeStructure = this.analyzeNarrativeStructure(currentProject, allTracks, allClips)
              if (!analysis.narrativeStructure.hasNarrative) {
                warnings.push("Нарративная структура не обнаружена")
              }
              break
            }

            case "pacing": {
              analysis.pacing = this.analyzePacing(allTracks, allClips)
              if (analysis.pacing.rhythm === "none") {
                warnings.push("Невозможно определить ритм - недостаточно клипов")
              }
              break
            }

            case "emotional-flow": {
              analysis.emotionalFlow = this.analyzeEmotionalFlow(currentProject)
              if (!analysis.emotionalFlow.hasEmotionalArc) {
                warnings.push("Эмоциональная дуга не обнаружена")
              }
              break
            }

            case "visual-continuity": {
              analysis.visualContinuity = this.analyzeVisualContinuity(currentProject, allTracks)
              break
            }

            case "audio-consistency": {
              analysis.audioConsistency = this.analyzeAudioConsistency(allTracks)
              break
            }
          }
        }

        // Генерируем общие рекомендации
        analysis.overallRecommendations = this.generateOverallStoryRecommendations(
          analysis,
          currentProject,
          allTracks,
          allClips,
        )

        this.logger?.info("Анализ нарративной структуры завершен", {
          scope: analysisScope,
          warningsCount: warnings.length,
          recommendationsCount: analysis.overallRecommendations.length,
        })

        return {
          ...analysis,
          warnings: warnings.length > 0 ? warnings : undefined,
        }
      },
      {
        timeout: options.timeout || 60000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          scope: analysisScope,
          elementsCount: storyElements.length,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Анализирует нарративную структуру проекта
   */
  private analyzeNarrativeStructure(project: TimelineProject, _allTracks: any[], allClips: any[]): NarrativeStructure {
    const sectionsCount = project.sections?.length || 0
    const totalDuration = project.duration || 0

    // Определяем наличие нарративной структуры
    const hasNarrative = sectionsCount >= 3 && totalDuration > 60 && allClips.length >= 10

    // Определяем тип структуры
    let structure = "неопределена"
    if (sectionsCount === 0) {
      structure = "отсутствует"
    } else if (sectionsCount < 3) {
      structure = "простая"
    } else if (sectionsCount >= 3 && sectionsCount <= 5) {
      structure = "классическая"
    } else {
      structure = "сложная"
    }

    const suggestions: string[] = []
    let strength = 0

    if (!hasNarrative) {
      suggestions.push("Добавьте больше контента для создания полноценной истории")
      suggestions.push("Создайте секции для структурирования повествования")
      strength = 2
    } else {
      if (sectionsCount >= 3) {
        suggestions.push("Хорошая базовая структура - рассмотрите добавление переходов между секциями")
        strength = 7
      }
      if (totalDuration > 300) {
        suggestions.push("Длинная история - убедитесь в поддержании интереса зрителя")
        strength += 1
      }
    }

    return {
      hasNarrative,
      structure,
      suggestions,
      strength: Math.min(10, strength),
    }
  }

  /**
   * Анализирует темп и ритм проекта
   */
  private analyzePacing(_allTracks: any[], allClips: any[]): PacingAnalysis {
    if (allClips.length === 0) {
      return {
        rhythm: "none",
        tempo: "slow",
        averageShotLength: 0,
        recommendations: ["Добавьте клипы для анализа темпа"],
      }
    }

    // Вычисляем среднюю длительность кадра
    const totalDuration = allClips.reduce((sum, clip) => sum + (clip.duration || 0), 0)
    const averageShotLength = totalDuration / allClips.length

    // Определяем ритм и темп
    let rhythm: PacingAnalysis["rhythm"] = "medium"
    let tempo: PacingAnalysis["tempo"] = "medium"

    if (averageShotLength < 2) {
      rhythm = "fast"
      tempo = averageShotLength < 1 ? "very-fast" : "fast"
    } else if (averageShotLength > 8) {
      rhythm = "slow"
      tempo = averageShotLength > 15 ? "very-slow" : "slow"
    }

    const recommendations: string[] = []

    if (rhythm === "fast" && tempo === "very-fast") {
      recommendations.push("Слишком быстрый ритм может утомлять зрителей - рассмотрите добавление пауз")
    } else if (rhythm === "slow" && tempo === "very-slow") {
      recommendations.push("Медленный ритм может быть скучным - добавьте динамики")
    } else {
      recommendations.push(`Хороший ритм монтажа (${averageShotLength.toFixed(1)}с на кадр)`)
    }

    return {
      rhythm,
      tempo,
      averageShotLength,
      recommendations,
    }
  }

  /**
   * Анализирует эмоциональную дугу проекта
   */
  private analyzeEmotionalFlow(project: TimelineProject): EmotionalFlow {
    const sections = project.sections || []
    const hasEmotionalArc = sections.length >= 3

    // Упрощенный анализ эмоциональной дуги на основе секций
    let overallArc: EmotionalFlow["overallArc"] = "flat"

    if (sections.length >= 3) {
      // Предполагаем классическую структуру: setup -> conflict -> resolution
      overallArc = "rising"
    } else if (sections.length === 2) {
      overallArc = "rising"
    }

    const keyMoments: EmotionalFlow["keyMoments"] = sections.map((_section, index) => ({
      time: (index * (project.duration || 0)) / sections.length,
      emotion: index === 0 ? "setup" : index === sections.length - 1 ? "resolution" : "conflict",
      intensity: index === Math.floor(sections.length / 2) ? 8 : 5,
    }))

    const recommendations: string[] = []

    if (!hasEmotionalArc) {
      recommendations.push("Создайте секции для структурирования эмоционального потока")
    } else {
      if (overallArc === "flat") {
        recommendations.push("Добавьте эмоционального контраста между секциями")
      } else {
        recommendations.push("Хорошая эмоциональная структура - рассмотрите усиление кульминации")
      }
    }

    return {
      hasEmotionalArc,
      overallArc,
      keyMoments,
      recommendations,
    }
  }

  /**
   * Анализирует визуальную непрерывность
   */
  private analyzeVisualContinuity(_project: TimelineProject, allTracks: any[]): VisualContinuity {
    const videoTracks = allTracks.filter((track) => track.type === "video")
    const suggestions: string[] = []

    if (videoTracks.length === 0) {
      suggestions.push("Добавьте видео треки для визуального контента")
      return { hasVisualContent: false, abruptTransitions: 0, continuityScore: 0, suggestions }
    }

    // Анализируем переходы между клипами
    let abruptTransitions = 0
    videoTracks.forEach((track) => {
      for (let i = 1; i < track.clips.length; i++) {
        const prevClip = track.clips[i - 1]
        const currentClip = track.clips[i]
        const gap = currentClip.startTime - (prevClip.startTime + prevClip.duration)

        if (gap === 0 && !currentClip.transitions?.length) {
          // Прямой срез без перехода
          abruptTransitions++
        }
      }
    })

    const totalClips = videoTracks.reduce((sum, track) => sum + track.clips.length, 0)
    const continuityScore = Math.max(0, 1 - abruptTransitions * 0.1)

    if (abruptTransitions > totalClips * 0.5) {
      suggestions.push("Рассмотрите добавление переходов между клипами для плавности")
    } else {
      suggestions.push("Хорошая визуальная непрерывность")
    }

    return {
      hasVisualContent: true,
      abruptTransitions,
      continuityScore,
      suggestions,
    }
  }

  /**
   * Анализирует аудио согласованность
   */
  private analyzeAudioConsistency(allTracks: any[]): AudioConsistency {
    const audioTracks = allTracks.filter((track) => track.type === "audio")
    const suggestions: string[] = []

    if (audioTracks.length === 0) {
      suggestions.push("Добавьте аудио треки для звукового сопровождения")
      return { hasAudioContent: false, audioCoverage: 0, audioGaps: 0, consistencyScore: 0, suggestions }
    }

    // Анализируем покрытие аудио
    const allAudioClips = audioTracks.reduce((clips, track) => clips.concat(track.clips || []), [])

    if (allAudioClips.length === 0) {
      suggestions.push("Добавьте аудио клипы на аудио треки")
      return { hasAudioContent: false, audioCoverage: 0, audioGaps: 0, consistencyScore: 0, suggestions }
    }

    const totalProjectDuration = Math.max(
      ...allAudioClips.map((clip: { startTime: any; duration: any }) => clip.startTime + clip.duration),
      1,
    )
    const audioCoverage =
      allAudioClips.reduce((sum: any, clip: { duration: any }) => sum + clip.duration, 0) / totalProjectDuration

    // Ищем тишину
    const audioGaps = this.findAudioGaps(allAudioClips, totalProjectDuration)
    const consistencyScore = Math.min(1, audioCoverage + (audioGaps.length === 0 ? 0.2 : 0))

    if (audioCoverage < 0.8) {
      suggestions.push("Увеличьте аудио покрытие проекта для лучшего восприятия")
    }

    if (audioGaps.length > 0) {
      suggestions.push(`Обнаружено ${audioGaps.length} пробелов в аудио - добавьте фоновую музыку или звуки`)
    }

    if (audioCoverage >= 0.8 && audioGaps.length === 0) {
      suggestions.push("Отличная аудио согласованность")
    }

    return {
      hasAudioContent: true,
      audioCoverage,
      audioGaps: audioGaps.length,
      consistencyScore,
      suggestions,
    }
  }

  /**
   * Генерирует общие рекомендации по улучшению истории
   */
  private generateOverallStoryRecommendations(
    analysis: StoryAnalysisResult,
    project: TimelineProject,
    _allTracks: any[],
    allClips: any[],
  ): string[] {
    const recommendations: string[] = []

    // Анализируем общую структуру проекта
    const sectionsCount = project.sections?.length || 0
    const totalClips = allClips.length

    if (sectionsCount === 0) {
      recommendations.push("Создайте секции для структурирования истории (введение, развитие, кульминация, развязка)")
    } else if (sectionsCount < 3) {
      recommendations.push("Добавьте больше секций для создания классической трехактной структуры")
    }

    if (totalClips < 10) {
      recommendations.push("Добавьте больше клипов для создания полноценного повествования")
    }

    // Проверяем баланс между анализированными элементами
    const hasNarrative = analysis.narrativeStructure?.hasNarrative
    const hasPacing = analysis.pacing?.rhythm !== "none"
    const hasEmotionalFlow = analysis.emotionalFlow?.hasEmotionalArc

    if (!hasNarrative && !hasPacing && !hasEmotionalFlow) {
      recommendations.push("История нуждается в базовой структуре - начните с создания секций и добавления контента")
    }

    // Специфические рекомендации по комбинации элементов
    if (analysis.pacing?.rhythm === "fast" && !analysis.emotionalFlow?.hasEmotionalArc) {
      recommendations.push("Быстрый темп требует четкой эмоциональной структуры для удержания внимания")
    }

    if ((analysis.visualContinuity?.abruptTransitions ?? 0) > 5 && analysis.pacing?.rhythm === "fast") {
      recommendations.push("Сочетание быстрого темпа и резких переходов может затруднить восприятие")
    }

    return recommendations
  }

  /**
   * Находит пробелы в аудио
   */
  private findAudioGaps(audioClips: any[], totalDuration: number): Array<{ start: number; end: number }> {
    if (audioClips.length === 0) return [{ start: 0, end: totalDuration }]

    const sortedClips = [...audioClips].sort((a, b) => a.startTime - b.startTime)
    const gaps: Array<{ start: number; end: number }> = []

    // Проверяем начало
    if (sortedClips[0].startTime > 1) {
      gaps.push({ start: 0, end: sortedClips[0].startTime })
    }

    // Проверяем промежутки
    for (let i = 1; i < sortedClips.length; i++) {
      const prevEnd = sortedClips[i - 1].startTime + sortedClips[i - 1].duration
      const currentStart = sortedClips[i].startTime

      if (currentStart - prevEnd > 1) {
        gaps.push({ start: prevEnd, end: currentStart })
      }
    }

    // Проверяем конец
    const lastClip = sortedClips[sortedClips.length - 1]
    const lastEnd = lastClip.startTime + lastClip.duration
    if (totalDuration - lastEnd > 1) {
      gaps.push({ start: lastEnd, end: totalDuration })
    }

    return gaps
  }
}

// Экспортируем готовый экземпляр для использования
export const storyAnalysisTool = new StoryAnalysisTool()

// Функция-обертка для обратной совместимости
export async function analyzeContentForStory(params: any): Promise<AIToolResult<StoryAnalysisResult>> {
  const input: StoryAnalysisInput = {
    analysisScope: params.analysisScope,
    storyElements: params.storyElements,
  }

  return storyAnalysisTool.analyzeStoryContent(input)
}
