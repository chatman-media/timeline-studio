/**
 * Timeline AI Analysis Hook
 * Интеграция AI Content Intelligence с Timeline для автоматического анализа
 */

import { useCallback, useEffect, useState } from "react"
import type {
  ContentInsights,
  KeyMoment,
  LegacyUnifiedContentAnalysis as UnifiedContentAnalysis,
} from "@/domains/ai-services/types"
import { KeyMomentType } from "@/domains/ai-services/types"
import { SceneAnalysisEngine } from "@/features/ai-content-intelligence/engines/scene-analysis/services/scene-analysis-engine"
import type { SceneAnalysisResult } from "@/features/ai-content-intelligence/engines/scene-analysis/types"
import type { AIIntelligenceOrchestrator } from "@/domains/ai-services/services/ai-intelligence-orchestrator"
import type { TimelineClip } from "../types/timeline"
import { useTimeline } from "./use-timeline"

interface TimelineAnalysisState {
  isAnalyzing: boolean
  analysisProgress: number
  currentAnalysis: UnifiedContentAnalysis | null
  sceneAnalysis: SceneAnalysisResult | null
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
  const { project, uiState, send } = useTimeline()

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

  // Инициализация сервисов
  const [sceneEngine] = useState(() => new SceneAnalysisEngine())
  const [orchestrator] = useState<AIIntelligenceOrchestrator | null>(() => null)

  // Инициализация AI движков
  useEffect(() => {
    const initializeEngines = async () => {
      try {
        await sceneEngine.initialize()
        await orchestrator?.initialize()
      } catch (error) {
        console.error("Failed to initialize AI engines:", error)
        setAnalysisState((prev) => ({
          ...prev,
          error: "Не удалось инициализировать AI движки",
        }))
      }
    }

    void initializeEngines()
  }, [sceneEngine, orchestrator])

  // Анализ отдельного клипа
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

        // Запускаем анализ сцен
        const sceneResult = await sceneEngine.process({
          mediaFile: {
            path: clip.mediaFile.path,
            name: clip.mediaFile.name,
            duration: clip.mediaFile.duration || 0,
          },
        })

        setAnalysisState((prev) => ({
          ...prev,
          sceneAnalysis: sceneResult,
          analysisProgress: 50,
        }))

        // Создаем мок анализа для совместимости
        const fullAnalysis: UnifiedContentAnalysis = {
          mediaFile: {
            path: clip.mediaFile.path,
            filename: clip.mediaFile.name,
            duration: clip.mediaFile.duration || 0,
            size: clip.mediaFile.size || 0,
            format: "video",
          },
          scenes: sceneResult.scenes || [],
          keyMoments: sceneResult.keyMoments || [],
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
            overall: 45,
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
            summary: "Автоматический анализ завершен",
            tags: [],
            strengths: ["Хорошее качество видео"],
            weaknesses: ["Требует цветокоррекция"],
            recommendations: [],
            marketingAngles: [],
            targetDemographics: [],
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
        const newSuggestions = generateSuggestionsFromAnalysis(clip, sceneResult, fullAnalysis)
        setSuggestions((prev) => [...prev, ...newSuggestions])

        setAnalysisState((prev) => ({
          ...prev,
          analysisProgress: 100,
          isAnalyzing: false,
        }))
      } catch (error) {
        console.error("Clip analysis failed:", error)
        setAnalysisState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка анализа",
        }))
      }
    },
    [analysisState.isAnalyzing, sceneEngine, orchestrator],
  )

  // Анализ всего Timeline
  const analyzeTimeline = useCallback(async () => {
    if (!project) return

    // Получаем все клипы из проекта
    const clips = project.sections
      .flatMap((section) => section.tracks.flatMap((track) => track.clips))
      .concat(project.globalTracks.flatMap((track) => track.clips))

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
      console.error("Timeline analysis failed:", error)
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
            // TODO: Реализовать применение эффектов и переходов
            console.log(`Applying ${suggestion.type} suggestion:`, suggestion)
            break

          default:
            console.log(`Unknown suggestion type: ${suggestion.type}`)
            break
        }

        // Удаляем применённое предложение
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
      } catch (error) {
        console.error("Failed to apply suggestion:", error)
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
    if (!analysisState.sceneAnalysis || !analysisState.keyMoments) return

    const { scenes } = analysisState.sceneAnalysis
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
    scenes.forEach((scene: any, index: number) => {
      if (index > 0) {
        // Пропускаем первую сцену
        send({
          type: "ADD_MARKER",
          marker: {
            id: `ai-scene-${scene.id}`,
            type: "section",
            timecode: scene.startTime,
            name: `Сцена ${index + 1}`,
            description: `Тип: ${scene.type}`,
            color: getColorForSceneType(scene.type),
          },
        })
      }
    })
  }, [analysisState.sceneAnalysis, analysisState.keyMoments, send])

  // Поиск ключевых моментов в клипе
  const findKeyMoments = useCallback(
    async (clip: TimelineClip): Promise<KeyMoment[]> => {
      if (!clip.mediaFile) return []

      try {
        const analysis = await sceneEngine.process({
          mediaFile: {
            path: clip.mediaFile.path,
            name: clip.mediaFile.name,
            duration: clip.mediaFile.duration || 0,
          },
        })

        return analysis.keyMoments || []
      } catch (error) {
        console.error("Failed to find key moments:", error)
        return []
      }
    },
    [sceneEngine],
  )

  // Автоматический анализ при добавлении клипов
  useEffect(() => {
    if (!enableAutoAnalysis || !project) return

    // Получаем все клипы из проекта
    const allClips = (project.sections || [])
      .flatMap((section) => (section.tracks || []).flatMap((track) => track.clips || []))
      .concat((project.globalTracks || []).flatMap((track) => track.clips || []))

    const lastClip = allClips[allClips.length - 1]

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

// Генерация предложений на основе анализа
function generateSuggestionsFromAnalysis(
  clip: TimelineClip,
  sceneAnalysis: SceneAnalysisResult,
  fullAnalysis: UnifiedContentAnalysis,
): TimelineAISuggestion[] {
  const suggestions: TimelineAISuggestion[] = []

  // Предложения по нарезке на основе сцен
  sceneAnalysis.scenes.forEach((scene: any, index: number) => {
    if (index > 0 && scene.duration > 10) {
      // Длинные сцены
      suggestions.push({
        id: `cut-${clip.id}-${scene.id}`,
        type: "cut",
        priority: "medium",
        title: "Разделить длинную сцену",
        description: `Сцена длительностью ${scene.duration.toFixed(1)}с может быть разделена`,
        clipId: clip.id,
        timestamp: Number(scene.startTime) + scene.duration / 2,
        confidence: 0.7,
      })
    }
  })

  // Предложения по скорости на основе типа сцены
  sceneAnalysis.scenes.forEach((scene: any) => {
    if (scene.type === "action" && scene.duration < 5) {
      suggestions.push({
        id: `speed-${clip.id}-${scene.id}`,
        type: "speed",
        priority: "low",
        title: "Замедлить экшн-сцену",
        description: "Короткая экшн-сцена может выиграть от замедления",
        clipId: clip.id,
        timestamp: scene.startTime,
        duration: scene.duration,
        confidence: 0.6,
        actionData: { speed: 0.75 },
      })
    }
  })

  // Предложения маркеров для ключевых моментов
  fullAnalysis.keyMoments.forEach((moment) => {
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
    case "dialogue":
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
