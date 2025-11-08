/**
 * Hook для управления AI Director анализом с real-time событиями
 */

import { invoke } from "@tauri-apps/api/core"
import { listen, UnlistenFn } from "@tauri-apps/api/event"
import { useCallback, useEffect, useState } from "react"
import type { AnalysisError, AnalysisProgress } from "@/domains/ai-services/types/ai-director-events"
import { logError, logInfo } from "@/lib/tauri-logger"
import type { AIDirectorConfig, ComprehensiveAnalysisResult } from "@/types/generated/tauri-bindings"

export interface UseAIDirectorAnalysisReturn {
  // State
  isAnalyzing: boolean
  currentProgress: AnalysisProgress | null
  result: ComprehensiveAnalysisResult | null
  errors: AnalysisError[]

  // Actions
  startAnalysis: (videoPath: string, config?: AIDirectorConfig) => Promise<void>
  startQuickAnalysis: (videoPath: string) => Promise<void>
  clearErrors: () => void

  // Computed
  progressPercentage: number
  currentStage: string
  estimatedTimeRemaining: number | null
}

export function useAIDirectorAnalysis(): UseAIDirectorAnalysisReturn {
  logInfo("[useAIDirectorAnalysis] Инициализация хука для управления AI Director анализом с real-time событиями")

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<AnalysisProgress | null>(null)
  const [result, setResult] = useState<ComprehensiveAnalysisResult | null>(null)
  const [errors, setErrors] = useState<AnalysisError[]>([])

  // Event listeners
  useEffect(() => {
    const unlistenFunctions: UnlistenFn[] = []

    const setupEventListeners = async () => {
      // Listen to analysis started
      const unlistenStarted = await listen("analysis-started", (event) => {
        logInfo("[useAIDirectorAnalysis] Analysis started", event.payload as Record<string, unknown>)
        setIsAnalyzing(true)
        setCurrentProgress(null)
        setResult(null)
        setErrors([])
      })
      unlistenFunctions.push(unlistenStarted)

      // Listen to analysis progress
      const unlistenProgress = await listen("analysis-progress", (event) => {
        const progress = event.payload as unknown as AnalysisProgress
        logInfo("[useAIDirectorAnalysis] Analysis progress", progress as unknown as Record<string, unknown>)
        setCurrentProgress(progress)
      })
      unlistenFunctions.push(unlistenProgress)

      // Listen to analysis completed
      const unlistenCompleted = await listen("analysis-completed", (event) => {
        logInfo("[useAIDirectorAnalysis] Analysis completed", event.payload as Record<string, unknown>)
        setIsAnalyzing(false)
        setCurrentProgress(null)
        // result будет установлен из возвращаемого значения команды
      })
      unlistenFunctions.push(unlistenCompleted)

      // Listen to analysis errors
      const unlistenError = await listen("analysis-error", (event) => {
        const error = event.payload as unknown as AnalysisError
        logError("[useAIDirectorAnalysis] Analysis error", error as unknown as Record<string, unknown>)
        setErrors((prev) => [...prev, error])
      })
      unlistenFunctions.push(unlistenError)

      // Listen to stage completed
      const unlistenStageCompleted = await listen("analysis-stage-completed", (event) => {
        logInfo("[useAIDirectorAnalysis] Analysis stage completed", event.payload as Record<string, unknown>)
        // Можно добавить дополнительную логику для отслеживания завершенных этапов
      })
      unlistenFunctions.push(unlistenStageCompleted)
    }

    setupEventListeners()

    // Cleanup on unmount
    return () => {
      unlistenFunctions.forEach((unlisten) => unlisten())
    }
  }, [])

  // Start comprehensive analysis
  const startAnalysis = useCallback(async (videoPath: string, config?: AIDirectorConfig) => {
    try {
      logInfo("[useAIDirectorAnalysis] Запуск комплексного AI Director анализа", { videoPath } as Record<
        string,
        unknown
      >)

      const analysisResult = await invoke<ComprehensiveAnalysisResult>("ai_director_analyze_comprehensive", {
        videoPath,
        config: config || {
          performance_mode: "balanced",
          enable_audio_analysis: true,
          enable_video_analysis: true,
          enable_face_analysis: true,
          enable_object_analysis: true,
          enable_emotion_analysis: false,
          enable_composition_analysis: false,
          enable_scene_detection: true,
          enable_mcp_agents: false,
          generate_editing_recommendations: true,
        },
      })

      logInfo("[useAIDirectorAnalysis] AI Director анализ завершен", { analysisResult } as Record<string, unknown>)
      setResult(analysisResult)
    } catch (error) {
      logError("[useAIDirectorAnalysis] Ошибка запуска AI Director анализа", error as Record<string, unknown>)
      setIsAnalyzing(false)
      setErrors((prev) => [
        ...prev,
        {
          analysisId: "unknown",
          stage: "startup",
          error: String(error),
        },
      ])
    }
  }, [])

  // Start quick analysis
  const startQuickAnalysis = useCallback(async (videoPath: string) => {
    try {
      logInfo("[useAIDirectorAnalysis] Запуск быстрого AI Director анализа", { videoPath } as Record<string, unknown>)

      const analysisResult = await invoke<ComprehensiveAnalysisResult>("ai_director_analyze_quick", {
        videoPath,
      })

      logInfo("[useAIDirectorAnalysis] Быстрый AI Director анализ завершен", { analysisResult } as Record<
        string,
        unknown
      >)
      setResult(analysisResult)
    } catch (error) {
      logError("[useAIDirectorAnalysis] Ошибка запуска быстрого AI Director анализа", error as Record<string, unknown>)
      setIsAnalyzing(false)
      setErrors((prev) => [
        ...prev,
        {
          analysisId: "unknown",
          stage: "startup",
          error: String(error),
        },
      ])
    }
  }, [])

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Computed values
  const progressPercentage = currentProgress?.progress ? Math.round(currentProgress.progress * 100) : 0
  const currentStage = currentProgress?.stage || "idle"
  const estimatedTimeRemaining = currentProgress?.estimatedTimeRemaining || null

  return {
    // State
    isAnalyzing,
    currentProgress,
    result,
    errors,

    // Actions
    startAnalysis,
    startQuickAnalysis,
    clearErrors,

    // Computed
    progressPercentage,
    currentStage,
    estimatedTimeRemaining,
  }
}
