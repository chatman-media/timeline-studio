/**
 * Player AI Analysis Hook
 * Интеграция AI Director анализа с video player
 *
 * Архитектура:
 * - При старте анализа запускается AI Director для полного анализа файла
 * - Результаты кешируются и отображаются в overlay в соответствии с текущим временем
 * - Поддерживает сцены, объекты и ключевые моменты из AI Director
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  aiDirectorAnalyzeQuick,
  type ComprehensiveAnalysisResult,
} from "@/domains/ai-services/tauri/ai-director-commands"
import type { KeyMoment, ObjectDetection, SceneInfo } from "@/core/types/ai-analysis"
import { usePlayer } from "@/features/timeline/providers/player-provider"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:use-player-ai-analysis")

interface PlayerAIAnalysisState {
  isAnalyzing: boolean
  analysisProgress: number // 0-100
  currentScene: SceneInfo | null
  detectedObjects: ObjectDetection[]
  upcomingMoments: KeyMoment[]
  frameAnalysisRate: number // Используется для частоты обновления UI
  analysisResult: ComprehensiveAnalysisResult | null
  error: string | null
}

export interface PlayerAIAnalysisHook {
  state: PlayerAIAnalysisState

  // Управление анализом
  startRealtimeAnalysis: () => void
  stopRealtimeAnalysis: () => void
  setFrameAnalysisRate: (fps: number) => void

  // Получение данных
  getCurrentSceneInfo: () => SceneInfo | null
  getObjectsInFrame: () => ObjectDetection[]
  getUpcomingMoments: (lookaheadSeconds?: number) => KeyMoment[]

  // Для тестирования
  updateUpcomingMoments?: (moments: KeyMoment[]) => void
}

/**
 * Преобразует результат AI Director в формат SceneInfo для overlay
 */
function convertToSceneInfo(analysisResult: ComprehensiveAnalysisResult | null, currentTime: number): SceneInfo | null {
  if (!analysisResult?.scene_analysis?.scenes) return null

  const scenes = analysisResult.scene_analysis.scenes
  const currentScene = scenes.find((scene) => currentTime >= scene.start_time && currentTime < scene.end_time)

  if (!currentScene) return null

  return {
    id: `scene-${currentScene.start_time}`,
    type: currentScene.description?.toLowerCase().includes("dialogue")
      ? "dialogue"
      : currentScene.description?.toLowerCase().includes("action")
        ? "action"
        : "other",
    startTime: currentScene.start_time,
    endTime: currentScene.end_time,
    duration: currentScene.end_time - currentScene.start_time,
    confidence: currentScene.confidence,
  }
}

/**
 * Преобразует результат AI Director в формат ObjectDetection для overlay
 */
function convertToObjectDetections(analysisResult: ComprehensiveAnalysisResult | null): ObjectDetection[] {
  if (!analysisResult?.object_detection?.objects) return []

  return analysisResult.object_detection.objects.map((obj: any, index: number) => ({
    id: `obj-${index}`,
    label: obj.label || obj.class || "object",
    confidence: obj.confidence || 0.8,
    boundingBox: obj.boundingBox ||
      obj.bounding_box || {
        x: 10 + ((index * 15) % 60),
        y: 10 + ((index * 10) % 40),
        width: 20,
        height: 30,
      },
    frameNumber: obj.frame_number || 0,
    timestamp: obj.timestamp || 0,
  }))
}

/**
 * Преобразует результат AI Director в формат KeyMoment
 */
function convertToKeyMoments(analysisResult: ComprehensiveAnalysisResult | null): KeyMoment[] {
  if (!analysisResult?.scene_analysis?.scenes) return []

  // Используем сцены с высокой уверенностью как ключевые моменты
  return analysisResult.scene_analysis.scenes
    .filter((scene) => scene.confidence > 0.7)
    .map((scene, index) => ({
      id: `moment-${index}`,
      timestamp: scene.start_time,
      duration: scene.end_time - scene.start_time,
      type: "visual_highlight" as KeyMoment["type"], // KeyMomentType enum value
      score: scene.confidence,
      description: scene.description || `Сцена ${index + 1}`,
      sceneId: `scene-${scene.start_time}`,
    }))
}

export function usePlayerAIAnalysis(): PlayerAIAnalysisHook {
  const { currentVideo, currentTime, isPlaying } = usePlayer()

  const [state, setState] = useState<PlayerAIAnalysisState>({
    isAnalyzing: false,
    analysisProgress: 0,
    currentScene: null,
    detectedObjects: [],
    upcomingMoments: [],
    frameAnalysisRate: 2,
    analysisResult: null,
    error: null,
  })

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalyzedPathRef = useRef<string | null>(null)
  const isAnalyzingRef = useRef(false)

  // Обновление текущей сцены на основе currentTime
  // Оптимизация: используем useRef для предотвращения лишних обновлений состояния
  const lastSceneIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!state.analysisResult || !state.isAnalyzing) return

    const currentScene = convertToSceneInfo(state.analysisResult, currentTime)

    // Избегаем обновления если сцена не изменилась
    if (currentScene?.id === lastSceneIdRef.current) return
    lastSceneIdRef.current = currentScene?.id ?? null

    const detectedObjects = convertToObjectDetections(state.analysisResult)

    setState((prev) => ({
      ...prev,
      currentScene,
      detectedObjects,
    }))
  }, [currentTime, state.analysisResult, state.isAnalyzing])

  // Запуск анализа через AI Director
  const startRealtimeAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current) return

    const videoPath = currentVideo?.path
    if (!videoPath) {
      logger.warn("No video path available for analysis")
      setState((prev) => ({ ...prev, error: "Видео не загружено" }))
      return
    }

    // Если уже анализировали этот файл - используем кеш
    if (lastAnalyzedPathRef.current === videoPath && state.analysisResult) {
      logger.debug("Using cached analysis result")
      setState((prev) => ({ ...prev, isAnalyzing: true }))
      return
    }

    isAnalyzingRef.current = true
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisProgress: 10,
      error: null,
    }))

    try {
      logger.info("Starting AI Director analysis", { videoPath })

      // Показываем прогресс во время анализа
      setState((prev) => ({ ...prev, analysisProgress: 30 }))

      // Запускаем быстрый анализ через AI Director
      const result = await aiDirectorAnalyzeQuick(videoPath)

      logger.info("AI Director analysis completed", {
        analysisId: result.analysis_id,
        sceneCount: result.scene_analysis?.scene_count,
        objectCount: result.object_detection?.total_objects,
      })

      lastAnalyzedPathRef.current = videoPath

      // Преобразуем результаты
      const keyMoments = convertToKeyMoments(result)
      const currentScene = convertToSceneInfo(result, currentTime)
      const detectedObjects = convertToObjectDetections(result)

      setState((prev) => ({
        ...prev,
        analysisProgress: 100,
        analysisResult: result,
        upcomingMoments: keyMoments,
        currentScene,
        detectedObjects,
        error: null,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error("AI Director analysis failed", { error: errorMessage })
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        analysisProgress: 0,
        error: errorMessage,
      }))
    } finally {
      isAnalyzingRef.current = false
    }
  }, [currentVideo?.path, state.analysisResult, currentTime])

  // Остановка анализа
  const stopRealtimeAnalysis = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      currentScene: null,
      detectedObjects: [],
    }))
  }, [])

  // Установка частоты обновления UI
  const setFrameAnalysisRate = useCallback((fps: number) => {
    // Ограничиваем от 0.5 до 10 fps для производительности
    const clampedFps = Math.max(0.5, Math.min(10, fps))
    setState((prev) => ({ ...prev, frameAnalysisRate: clampedFps }))
  }, [])

  // Получение информации о текущей сцене
  const getCurrentSceneInfo = useCallback(() => {
    return state.currentScene
  }, [state.currentScene])

  // Получение объектов в текущем кадре
  const getObjectsInFrame = useCallback(() => {
    return state.detectedObjects
  }, [state.detectedObjects])

  // Получение предстоящих ключевых моментов
  const getUpcomingMoments = useCallback(
    (lookaheadSeconds = 10) => {
      const endTime = currentTime + lookaheadSeconds

      return state.upcomingMoments.filter(
        (moment: KeyMoment) => moment.timestamp > currentTime && moment.timestamp <= endTime,
      )
    },
    [currentTime, state.upcomingMoments],
  )

  // Обновление предстоящих моментов (для тестирования и внешней интеграции)
  const updateUpcomingMoments = useCallback((moments: KeyMoment[]) => {
    setState((prev) => ({ ...prev, upcomingMoments: moments }))
  }, [])

  // Сброс кеша при смене видео
  useEffect(() => {
    if (currentVideo?.path !== lastAnalyzedPathRef.current) {
      setState((prev) => ({
        ...prev,
        analysisResult: null,
        currentScene: null,
        detectedObjects: [],
        upcomingMoments: [],
        analysisProgress: 0,
        error: null,
      }))
    }
  }, [currentVideo?.path])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  return {
    state,
    startRealtimeAnalysis,
    stopRealtimeAnalysis,
    setFrameAnalysisRate,
    getCurrentSceneInfo,
    getObjectsInFrame,
    getUpcomingMoments,
    updateUpcomingMoments,
  }
}
