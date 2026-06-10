/**
 * Timeline AI Analysis Hook
 * Интеграция AI Content Intelligence с Timeline для автоматического анализа
 * Migrated to use domain services
 */

import { useCallback, useEffect, useState } from "react"
import {
  analyzeScenesByPath,
  type SceneAnalysisResult,
} from "@/domains/ai-services/tauri/content-intelligence-commands"
import { KeyMomentType, type ContentInsights, type KeyMoment, type UnifiedContentAnalysis } from "@/core/types/ai-analysis"
import type { TimelineClip as CoreTimelineClip } from "@/core/types/timeline"
import type { TimelineClip } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import { useTimeline } from "../state/use-timeline"

const logger = createLogger("UseTimelineAiAnalysis")

// Re-export type alias for backward compatibility
type SceneAnalysis = SceneAnalysisResult

interface TimelineAnalysisState {
  isAnalyzing: boolean
  analysisProgress: number
  currentAnalysis: UnifiedContentAnalysis | null
  sceneAnalysis: SceneAnalysis[] | null
  insights: ContentInsights | null
  keyMoments: KeyMoment[]
  error: string | null
  lastAnalyzedClipId: string | null
}

interface TimelineAISuggestion {
  id: string
  type: "cut" | "transition" | "effect" | "marker" | "speed" | "color"
  priority: "low" | "medium" | "high"
  title: string
  description: string
  clipId?: string
  timestamp?: number
  duration?: number
  confidence: number
  actionData?: any
}

export interface TimelineAIAnalysisHook {
  // Состояние анализа
  state: TimelineAnalysisState

  // Основные функции
  analyzeClip: (clip: TimelineClip) => Promise<void>
  analyzeTimeline: () => Promise<void>
  clearAnalysis: () => void

  // Предложения
  suggestions: TimelineAISuggestion[]
  applySuggestion: (suggestion: TimelineAISuggestion) => Promise<void>
  dismissSuggestion: (suggestionId: string) => void

  // Маркеры и моменты
  generateMarkersFromAnalysis: () => Promise<void>
  findKeyMoments: (clip: TimelineClip) => Promise<KeyMoment[]>

  // Настройки
  enableAutoAnalysis: boolean
  setEnableAutoAnalysis: (enabled: boolean) => void
}

export function useTimelineAIAnalysis(): TimelineAIAnalysisHook {
  const { project, send } = useTimeline()

  // Адаптер для преобразования domain клипа в feature клип
  const adaptDomainClipToFeatureClip = useCallback((domainClip: CoreTimelineClip): TimelineClip => {
    return {
      ...domainClip,
      mediaFile: undefined,
      mediaStartTime: domainClip.sourceIn,
      mediaEndTime: domainClip.sourceOut,
      speed: domainClip.playbackRate || 1,
      isReversed: (domainClip.playbackRate || 1) < 0,
      maintainPitch: false,
      offset: 0,
      type: undefined,
    } as unknown as TimelineClip
  }, [])

  // Состояние анализа
  const [analysisState, setAnalysisState] = useState<TimelineAnalysisState>({
    isAnalyzing: false,
    analysisProgress: 0,
    currentAnalysis: null,
    sceneAnalysis: null,
    insights: null,
    keyMoments: [],
    error: null,
    lastAnalyzedClipId: null,
  })

  // Предложения AI
  const [suggestions, setSuggestions] = useState<TimelineAISuggestion[]>([])

  // Настройки
  const [enableAutoAnalysis, setEnableAutoAnalysis] = useState(true)

  // Анализ отдельного клипа через Tauri backend
  const analyzeClip = useCallback(
    async (clip: TimelineClip) => {
      if (!clip.mediaFile || analysisState.isAnalyzing) return

      setAnalysisState((prev) => ({
        ...prev,
        isAnalyzing: true,
        analysisProgress: 0,
        error: null,
        lastAnalyzedClipId: clip.id,
      }))

      try {
        // Прогресс: начало анализа
        setAnalysisState((prev) => ({ ...prev, analysisProgress: 10 }))

        // Вызываем domain команду для анализа сцен
        logger.info("Analyzing scenes via domain service", { path: clip.mediaFile.path })

        const scenes = await analyzeScenesByPath(clip.mediaFile.path)

        setAnalysisState((prev) => ({
          ...prev,
          sceneAnalysis: scenes,
          analysisProgress: 50,
        }))

        // Генерируем ключевые моменты из сцен
        const keyMoments = convertScenesToKeyMoments(scenes)

        // Создаем unified анализ для совместимости
        const fullAnalysis: UnifiedContentAnalysis = {
          mediaFile: {
            name: clip.mediaFile.name,
            filename: clip.mediaFile.name,
            path: clip.mediaFile.path,
            duration: clip.mediaFile.duration || 0,
            size: clip.mediaFile.size || 0,
            format: "video",
          },
          scenes: scenes.map((s) => ({
            id: s.id,
            type: s.sceneType,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.duration,
            confidence: s.confidence,
            description: s.description || "",
          })) as any,
          keyMoments,
          contentType: "narrative" as any,
          genres: [],
          mood: "neutral" as any,
          targetAudience: "general" as any,
          technicalSpecs: {
            resolution: { width: 1920, height: 1080, aspectRatio: "16:9" },
            frameRate: 30,
            bitrate: 5000,
            codec: "h264",
            audioChannels: 2,
            audioCodec: "aac",
            audioBitrate: 128,
            duration: clip.mediaFile.duration || 0,
          },
          qualityMetrics: {
            overall: calculateOverallQuality(scenes),
            sharpness: 70,
            brightness: 60,
            contrast: 75,
            saturation: 65,
            stability: 80,
            noise: 30,
          },
          detections: {
            objects: [],
            faces: [],
            text: [],
            audio: { speech: [], music: [], soundEffects: [], silence: [] },
            scenes: [],
          },
          insights: {
            summary: `Проанализировано ${scenes.length} сцен`,
            strengths: scenes.length > 0 ? ["Хорошее качество видео"] : [],
            weaknesses: [],
            recommendations: [],
            marketingAngles: [],
            targetDemographics: [],
            highlights: [],
            suggestions: [],
            warnings: [],
            opportunities: [],
          },
        }

        setAnalysisState((prev) => ({
          ...prev,
          currentAnalysis: fullAnalysis,
          insights: fullAnalysis.insights,
          keyMoments: fullAnalysis.keyMoments,
          analysisProgress: 90,
        }))

        // Генерируем предложения на основе анализа
        const newSuggestions = generateSuggestionsFromScenes(clip, scenes, fullAnalysis)
        setSuggestions((prev) => [...prev, ...newSuggestions])

        setAnalysisState((prev) => ({
          ...prev,
          analysisProgress: 100,
          isAnalyzing: false,
        }))

        logger.info("Scene analysis completed", { scenesCount: scenes.length })
      } catch (error) {
        logger.error("Clip analysis failed:", { error })
        setAnalysisState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка анализа",
        }))
      }
    },
    [analysisState.isAnalyzing, adaptDomainClipToFeatureClip],
  )

  // Анализ всего Timeline
  const analyzeTimeline = useCallback(async () => {
    if (!project) return

    // Получаем все клипы из проекта и преобразуем в feature типы
    const domainClips = project.sections
      .flatMap((section) => section.tracks.flatMap((track) => track.clips))
      .concat(project.globalTracks.flatMap((track) => track.clips))

    const clips = domainClips.map(adaptDomainClipToFeatureClip)

    if (clips.length === 0) return

    setAnalysisState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisProgress: 0,
      error: null,
    }))

    try {
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        if (clip.mediaFile) {
          await analyzeClip(clip)
          setAnalysisState((prev) => ({
            ...prev,
            analysisProgress: Math.round(((i + 1) / clips.length) * 100),
          }))
        }
      }
    } catch (error) {
      logger.error("Timeline analysis failed:", { error })
      setAnalysisState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Ошибка анализа Timeline",
      }))
    } finally {
      setAnalysisState((prev) => ({ ...prev, isAnalyzing: false }))
    }
  }, [project, analyzeClip])

  // Очистка анализа
  const clearAnalysis = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      analysisProgress: 0,
      currentAnalysis: null,
      sceneAnalysis: null,
      insights: null,
      keyMoments: [],
      error: null,
      lastAnalyzedClipId: null,
    })
    setSuggestions([])
  }, [])

  // Применение предложения
  const applySuggestion = useCallback(
    async (suggestion: TimelineAISuggestion) => {
      try {
        switch (suggestion.type) {
          case "cut":
            if (suggestion.clipId && suggestion.timestamp) {
              send({
                type: "SPLIT_CLIP",
                clipId: suggestion.clipId,
                splitTime: suggestion.timestamp,
              })
            }
            break

          case "marker":
            if (suggestion.timestamp) {
              send({
                type: "ADD_MARKER",
                marker: {
                  id: `ai-marker-${Date.now()}`,
                  type: "note",
                  timecode: suggestion.timestamp,
                  name: suggestion.title,
                  description: suggestion.description,
                  color: "#3b82f6",
                },
              })
            }
            break

          case "speed":
            if (suggestion.clipId && suggestion.actionData?.speed) {
              send({
                type: "UPDATE_CLIP",
                clipId: suggestion.clipId,
                updates: {
                  playbackRate: suggestion.actionData.speed,
                },
              })
            }
            break

          case "transition":
          case "effect":
          case "color":
            logger.info(`Applying ${suggestion.type} suggestion:`, { suggestion })
            break

          default:
            logger.info(`Unknown suggestion type: ${suggestion.type}`)
            break
        }

        // Удаляем применённое предложение
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
      } catch (error) {
        logger.error("Failed to apply suggestion:", { error })
      }
    },
    [send],
  )

  // Отклонение предложения
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
  }, [])

  // Генерация маркеров из анализа
  const generateMarkersFromAnalysis = useCallback(async () => {
    if (!analysisState.keyMoments || analysisState.keyMoments.length === 0) return

    const scenes = analysisState.sceneAnalysis || []
    const { keyMoments } = analysisState

    // Создаем маркеры для ключевых моментов
    keyMoments.forEach((moment) => {
      send({
        type: "ADD_MARKER",
        marker: {
          id: `ai-moment-${moment.id}`,
          type: "chapter",
          timecode: moment.timestamp,
          name: moment.type === KeyMomentType.CLIMAX ? "Кульминация" : moment.description,
          description: `AI обнаружил ключевой момент (${moment.type})`,
          color: getColorForMomentType(moment.type),
        },
      })
    })

    // Создаем маркеры для смены сцен
    scenes.forEach((scene: SceneAnalysis, index: number) => {
      if (index > 0) {
        // Пропускаем первую сцену
        send({
          type: "ADD_MARKER",
          marker: {
            id: `ai-scene-${scene.id}`,
            type: "section",
            timecode: scene.startTime,
            name: `Сцена ${index + 1}`,
            description: `Тип: ${scene.sceneType}`,
            color: getColorForSceneType(scene.sceneType),
          },
        })
      }
    })
  }, [analysisState.sceneAnalysis, analysisState.keyMoments, send])

  // Поиск ключевых моментов в клипе
  const findKeyMoments = useCallback(async (clip: TimelineClip): Promise<KeyMoment[]> => {
    if (!clip.mediaFile) return []

    try {
      const scenes = await analyzeScenesByPath(clip.mediaFile.path)

      return convertScenesToKeyMoments(scenes)
    } catch (error) {
      logger.error("Failed to find key moments:", { error })
      return []
    }
  }, [])

  // Автоматический анализ при добавлении клипов
  useEffect(() => {
    if (!enableAutoAnalysis || !project) return

    // Получаем все клипы из проекта
    const allClips = (project.sections || [])
      .flatMap((section) => (section.tracks || []).flatMap((track) => track.clips || []))
      .concat((project.globalTracks || []).flatMap((track) => track.clips || []))

    const lastDomainClip = allClips[allClips.length - 1]
    const lastClip = lastDomainClip ? adaptDomainClipToFeatureClip(lastDomainClip) : null

    if (
      lastClip &&
      lastClip.mediaFile &&
      lastClip.id !== analysisState.lastAnalyzedClipId &&
      !analysisState.isAnalyzing
    ) {
      // Небольшая задержка для избежания частых анализов
      const timer = setTimeout(() => {
        void analyzeClip(lastClip)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [project, enableAutoAnalysis, analyzeClip, analysisState.lastAnalyzedClipId, analysisState.isAnalyzing])

  return {
    state: analysisState,
    analyzeClip,
    analyzeTimeline,
    clearAnalysis,
    suggestions,
    applySuggestion,
    dismissSuggestion,
    generateMarkersFromAnalysis,
    findKeyMoments,
    enableAutoAnalysis,
    setEnableAutoAnalysis,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert scene analysis results to key moments
 */
function convertScenesToKeyMoments(scenes: SceneAnalysis[]): KeyMoment[] {
  const keyMoments: KeyMoment[] = []

  scenes.forEach((scene) => {
    // Add key moments for scene transitions
    if (scene.transition) {
      keyMoments.push({
        id: `km-${scene.id}`,
        timestamp: scene.startTime,
        duration: 2,
        type: KeyMomentType.VISUAL_HIGHLIGHT,
        score: scene.confidence,
        description: `Переход: ${scene.sceneType}`,
        sceneId: scene.id,
      })
    }

    // Add moments for high-quality or high-motion scenes
    if (scene.visual && scene.visual.motionLevel > 0.7) {
      keyMoments.push({
        id: `km-action-${scene.id}`,
        timestamp: scene.startTime + scene.duration / 2,
        duration: Math.min(scene.duration, 5),
        type: KeyMomentType.ACTION_PEAK,
        score: scene.visual.motionLevel,
        description: `Активная сцена: ${scene.sceneType}`,
        sceneId: scene.id,
      })
    }
  })

  return keyMoments
}

/**
 * Calculate overall quality from scenes
 */
function calculateOverallQuality(scenes: SceneAnalysis[]): number {
  if (scenes.length === 0) return 0

  const qualityScores = scenes
    .filter((s) => s.visual)
    .map((s) => {
      const v = s.visual!
      return (v.sharpness + v.compositionScore + (1 - v.noiseLevel)) / 3
    })

  if (qualityScores.length === 0) return 50

  const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
  return Math.round(avgQuality * 100)
}

/**
 * Generate suggestions from scene analysis
 */
function generateSuggestionsFromScenes(
  clip: TimelineClip,
  scenes: SceneAnalysis[],
  fullAnalysis: UnifiedContentAnalysis,
): TimelineAISuggestion[] {
  const suggestions: TimelineAISuggestion[] = []

  // Предложения по нарезке на основе сцен
  scenes.forEach((scene, index) => {
    if (index > 0 && scene.duration > 10) {
      // Длинные сцены
      suggestions.push({
        id: `cut-${clip.id}-${scene.id}`,
        type: "cut",
        priority: "medium",
        title: "Разделить длинную сцену",
        description: `Сцена длительностью ${scene.duration.toFixed(1)}с может быть разделена`,
        clipId: clip.id,
        timestamp: scene.startTime + scene.duration / 2,
        confidence: 0.7,
      })
    }
  })

  // Предложения маркеров для ключевых моментов
  fullAnalysis.keyMoments.forEach((moment: KeyMoment) => {
    suggestions.push({
      id: `marker-${clip.id}-${moment.id}`,
      type: "marker",
      priority: moment.score > 0.8 ? "high" : "medium",
      title: "Добавить маркер",
      description: moment.description,
      clipId: clip.id,
      timestamp: moment.timestamp,
      confidence: moment.score,
    })
  })

  // Предложения по качеству
  if (fullAnalysis.qualityMetrics && fullAnalysis.qualityMetrics.overall < 60) {
    suggestions.push({
      id: `color-${clip.id}`,
      type: "color",
      priority: "high",
      title: "Улучшить качество видео",
      description: `Качество видео: ${fullAnalysis.qualityMetrics.overall}/100. Рекомендуется цветокоррекция`,
      clipId: clip.id,
      confidence: 0.8,
    })
  }

  return suggestions
}

// Цвета для разных типов моментов
function getColorForMomentType(type: string): string {
  switch (type) {
    case "climax":
      return "#ef4444"
    case "emotional_peak":
      return "#f59e0b"
    case "action_peak":
      return "#eab308"
    case "visual_highlight":
      return "#3b82f6"
    case "audio_peak":
      return "#8b5cf6"
    default:
      return "#6b7280"
  }
}

// Цвета для разных типов сцен
function getColorForSceneType(type: string): string {
  switch (type) {
    case "action":
      return "#ef4444"
    case "dialog":
      return "#3b82f6"
    case "landscape":
      return "#10b981"
    case "closeup":
      return "#f59e0b"
    case "establishing":
      return "#8b5cf6"
    default:
      return "#6b7280"
  }
}
