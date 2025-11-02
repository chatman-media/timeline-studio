/**
 * Hook для управления AI Director анализом с real-time событиями
 */

import { invoke } from "@tauri-apps/api/core"
import { listen, UnlistenFn } from "@tauri-apps/api/event"
import { useCallback, useEffect, useState } from "react"

export interface AnalysisProgress {
  analysisId: string
  stage: string // "audio", "video", "integration", "complete"
  progress: number // 0.0 - 1.0
  message?: string
  estimatedTimeRemaining?: number // seconds
}

export interface AnalysisResult {
  analysis_id: string
  status: "pending" | "in_progress" | "completed" | "failed" | "partially_completed"
  // ... остальные поля из ComprehensiveAnalysisResult
}

export interface AnalysisError {
  analysisId: string
  stage: string
  error: string
}

export interface AIDirectorConfig {
  performance_mode: "fast" | "balanced" | "quality"
  enable_audio_analysis: boolean
  enable_video_analysis: boolean
  enable_face_analysis: boolean
  enable_object_analysis: boolean
  enable_emotion_analysis: boolean
  max_processing_time?: number
  generate_editing_recommendations: boolean
}

export interface UseAIDirectorAnalysisReturn {
  // State
  isAnalyzing: boolean
  currentProgress: AnalysisProgress | null
  result: AnalysisResult | null
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<AnalysisProgress | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errors, setErrors] = useState<AnalysisError[]>([])

  // Event listeners
  useEffect(() => {
    const unlistenFunctions: UnlistenFn[] = []

    const setupEventListeners = async () => {
      // Listen to analysis started
      const unlistenStarted = await listen("analysis-started", (event) => {
        console.log("Analysis started:", event.payload)
        setIsAnalyzing(true)
        setCurrentProgress(null)
        setResult(null)
        setErrors([])
      })
      unlistenFunctions.push(unlistenStarted)

      // Listen to analysis progress
      const unlistenProgress = await listen("analysis-progress", (event) => {
        const progress = event.payload as AnalysisProgress
        console.log("Analysis progress:", progress)
        setCurrentProgress(progress)
      })
      unlistenFunctions.push(unlistenProgress)

      // Listen to analysis completed
      const unlistenCompleted = await listen("analysis-completed", (event) => {
        console.log("Analysis completed:", event.payload)
        setIsAnalyzing(false)
        setCurrentProgress(null)
        // result будет установлен из возвращаемого значения команды
      })
      unlistenFunctions.push(unlistenCompleted)

      // Listen to analysis errors
      const unlistenError = await listen("analysis-error", (event) => {
        const error = event.payload as AnalysisError
        console.error("Analysis error:", error)
        setErrors((prev) => [...prev, error])
      })
      unlistenFunctions.push(unlistenError)

      // Listen to stage completed
      const unlistenStageCompleted = await listen("analysis-stage-completed", (event) => {
        console.log("Analysis stage completed:", event.payload)
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
      console.log("Starting AI Director comprehensive analysis for:", videoPath)

      const analysisResult = await invoke<AnalysisResult>("ai_director_analyze_comprehensive", {
        videoPath,
        config: config || {
          performance_mode: "balanced",
          enable_audio_analysis: true,
          enable_video_analysis: true,
          enable_face_analysis: true,
          enable_object_analysis: true,
          enable_emotion_analysis: false,
          generate_editing_recommendations: true,
        },
      })

      console.log("Analysis completed with result:", analysisResult)
      setResult(analysisResult)
    } catch (error) {
      console.error("Failed to start analysis:", error)
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
      console.log("Starting AI Director quick analysis for:", videoPath)

      const analysisResult = await invoke<AnalysisResult>("ai_director_analyze_quick", {
        videoPath,
      })

      console.log("Quick analysis completed with result:", analysisResult)
      setResult(analysisResult)
    } catch (error) {
      console.error("Failed to start quick analysis:", error)
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
