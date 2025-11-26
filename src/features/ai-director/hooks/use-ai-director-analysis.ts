/**
 * Hook для управления AI Director анализом с real-time событиями
 *
 * Uses domain services instead of direct invoke() calls.
 */

import { useCallback, useEffect, useState } from "react"
import type {
  AIDirectorConfig,
  AnalysisError,
  AnalysisProgress,
  ComprehensiveAnalysisResult,
} from "@/domains/ai-director"
import { aiDirectorAnalyzeComprehensive, aiDirectorAnalyzeQuick, useAIDirectorEvents } from "@/domains/ai-director"
import { logError, logInfo } from "@/lib/tauri-logger"

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
  clearResult: () => void

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

  // Debug: отслеживаем изменения result
  useEffect(() => {
    logInfo("[useAIDirectorAnalysis] Состояние result изменилось", {
      hasResult: !!result,
      hasScenes: !!result?.scene_analysis?.scenes,
      scenesCount: result?.scene_analysis?.scenes?.length || 0,
    } as Record<string, unknown>)
  }, [result])

  // Use domain hook for event listeners (replaces direct listen() calls)
  useAIDirectorEvents({
    onAnalysisStarted: () => {
      logInfo("[useAIDirectorAnalysis] Analysis started")
      setIsAnalyzing(true)
      setCurrentProgress(null)
      setResult(null)
      setErrors([])
    },
    onAnalysisProgress: (progress) => {
      logInfo("[useAIDirectorAnalysis] Analysis progress", progress as unknown as Record<string, unknown>)
      setCurrentProgress(progress)
    },
    onAnalysisCompleted: () => {
      logInfo("[useAIDirectorAnalysis] Analysis completed")
      setIsAnalyzing(false)
      setCurrentProgress(null)
      // result будет установлен из возвращаемого значения команды
    },
    onAnalysisError: (error) => {
      logError("[useAIDirectorAnalysis] Analysis error", error as unknown as Record<string, unknown>)
      setErrors((prev) => [...prev, error])
    },
    onAnalysisStageCompleted: (stage) => {
      logInfo("[useAIDirectorAnalysis] Analysis stage completed", stage as unknown as Record<string, unknown>)
    },
  })

  // Start comprehensive analysis - using domain tauri command
  const startAnalysis = useCallback(async (videoPath: string, config?: AIDirectorConfig) => {
    try {
      logInfo("[useAIDirectorAnalysis] Запуск комплексного AI Director анализа", { videoPath } as Record<
        string,
        unknown
      >)

      // Use domain function instead of direct invoke()
      const analysisResult = await aiDirectorAnalyzeComprehensive(
        videoPath,
        config || {
          performance_mode: "balanced",
          enable_audio_analysis: true,
          enable_video_analysis: true,
          enable_scene_detection: true,
          enable_object_detection: true,
          enable_face_recognition: true,
          enable_transcription: false,
        },
      )

      logInfo("[useAIDirectorAnalysis] AI Director анализ завершен", { analysisResult } as Record<string, unknown>)
      setResult(analysisResult)
      setIsAnalyzing(false)
      logInfo("[useAIDirectorAnalysis] setResult вызван, устанавливаем результат", {
        hasResult: !!analysisResult,
        hasScenes: !!analysisResult?.scene_analysis?.scenes,
      } as Record<string, unknown>)
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

  // Start quick analysis - using domain tauri command
  const startQuickAnalysis = useCallback(async (videoPath: string) => {
    try {
      logInfo("[useAIDirectorAnalysis] Запуск быстрого AI Director анализа", { videoPath } as Record<string, unknown>)

      // Use domain function instead of direct invoke()
      const analysisResult = await aiDirectorAnalyzeQuick(videoPath)

      logInfo("[useAIDirectorAnalysis] Быстрый AI Director анализ завершен", { analysisResult } as Record<
        string,
        unknown
      >)
      setResult(analysisResult)
      setIsAnalyzing(false)
      logInfo("[useAIDirectorAnalysis] setResult вызван для быстрого анализа", {
        hasResult: !!analysisResult,
        hasScenes: !!analysisResult?.scene_analysis?.scenes,
      } as Record<string, unknown>)
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

  // Clear result (for starting new analysis)
  const clearResult = useCallback(() => {
    setResult(null)
    setErrors([])
    setCurrentProgress(null)
  }, [])

  // Computed values
  const progressPercentage = currentProgress?.progress ? Math.round(currentProgress.progress * 100) : 0
  const currentStage = currentProgress?.stage || "idle"
  const estimatedTimeRemaining = currentProgress?.estimatedTimeRemaining ?? null

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
    clearResult,

    // Computed
    progressPercentage,
    currentStage,
    estimatedTimeRemaining,
  }
}
