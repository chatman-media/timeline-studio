/**
 * Player AI Analysis Hook
 * Интеграция AI анализа с video player для real-time обработки
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { KeyMoment, SceneInfo } from "@/domains/ai-services/types"
import { SceneAnalysisEngine } from "@/features/ai-content-intelligence/engines/scene-analysis/services/scene-analysis-engine"
// TODO: Migrate ObjectDetection to domains
import type { ObjectDetection } from "@/domains/ai-services/types/content-analysis"

import { FrameCaptureService } from "../services/frame-capture-service"
import { usePlayer } from "../services/player-provider"

interface PlayerAIAnalysisState {
  isAnalyzing: boolean
  currentScene: SceneInfo | null
  detectedObjects: ObjectDetection[]
  upcomingMoments: KeyMoment[]
  frameAnalysisRate: number // Frames per second to analyze
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

export function usePlayerAIAnalysis(): PlayerAIAnalysisHook {
  const { currentTime, isPlaying, duration } = usePlayer()

  const [state, setState] = useState<PlayerAIAnalysisState>({
    isAnalyzing: false,
    currentScene: null,
    detectedObjects: [],
    upcomingMoments: [],
    frameAnalysisRate: 2, // Анализировать 2 кадра в секунду по умолчанию
  })

  const [sceneEngine] = useState(() => new SceneAnalysisEngine())
  const [frameCaptureService] = useState(() => new FrameCaptureService())
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalyzedTimeRef = useRef<number>(0)

  // Инициализация Scene Analysis Engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await sceneEngine.initialize()
      } catch (error) {
        console.error("Failed to initialize Scene Analysis Engine:", error)
      }
    }

    void initEngine()
  }, [sceneEngine])

  // Запуск real-time анализа
  const startRealtimeAnalysis = useCallback(() => {
    if (state.isAnalyzing) return

    setState((prev) => ({ ...prev, isAnalyzing: true }))

    // Анализ с заданной частотой
    const intervalMs = 1000 / state.frameAnalysisRate

    analysisIntervalRef.current = setInterval(async () => {
      // Анализируем только если воспроизведение идет
      if (!isPlaying) return

      // Избегаем повторного анализа того же времени
      if (Math.abs(currentTime - lastAnalyzedTimeRef.current) < 0.1) return

      lastAnalyzedTimeRef.current = currentTime

      try {
        // TODO: В новой архитектуре с backend синхронизацией нужно реализовать
        // захват кадров через backend API вместо прямого доступа к video элементу

        // Временно отключаем анализ кадров
        console.log(`Frame analysis disabled - needs backend implementation at ${currentTime}s`)

        // Временная симуляция анализа
        setState((prev) => ({
          ...prev,
          currentScene: {
            id: `scene-${Math.floor(currentTime / 10)}`,
            type: "dialogue",
            startTime: Math.floor(currentTime / 10) * 10,
            endTime: Math.floor(currentTime / 10) * 10 + 10,
            duration: 10,
            confidence: 0.85,
          },
          detectedObjects: [
            {
              id: `obj-${Date.now()}-1`,
              label: "person",
              confidence: 0.92,
              boundingBox: {
                x: 20,
                y: 15,
                width: 30,
                height: 60,
              },
              frameNumbers: [Math.floor(currentTime * 30)], // Assuming 30fps
            },
          ],
        }))
      } catch (error) {
        console.error("Frame analysis error:", error)
      }
    }, intervalMs)
  }, [state.isAnalyzing, state.frameAnalysisRate, isPlaying, currentTime, frameCaptureService])

  // Остановка анализа
  const stopRealtimeAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }

    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      currentScene: null,
      detectedObjects: [],
    }))
  }, [])

  // Установка частоты анализа
  const setFrameAnalysisRate = useCallback(
    (fps: number) => {
      // Ограничиваем от 0.5 до 10 fps для производительности
      const clampedFps = Math.max(0.5, Math.min(10, fps))

      setState((prev) => ({ ...prev, frameAnalysisRate: clampedFps }))

      // Перезапускаем анализ с новой частотой
      if (state.isAnalyzing) {
        stopRealtimeAnalysis()
        startRealtimeAnalysis()
      }
    },
    [state.isAnalyzing, stopRealtimeAnalysis, startRealtimeAnalysis],
  )

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

  // Автоматическая остановка при остановке воспроизведения
  useEffect(() => {
    if (!isPlaying && state.isAnalyzing) {
      stopRealtimeAnalysis()
    }
  }, [isPlaying, state.isAnalyzing, stopRealtimeAnalysis])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
      frameCaptureService.dispose()
    }
  }, [frameCaptureService])

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
