/**
 * Хук для работы с backend командами Smart Montage Planner
 */

import { invoke } from "@tauri-apps/api/core"
import { useCallback, useState } from "react"

import type {

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "UseMontageBackend" })
  AudioContentAnalysis,
  MomentScore,
  MontageAnalysisConfig,
  MontagePlan,
  MontageQualityAnalysis,
  MontageVideoAnalysis,
  PlanGeneratorConfig,
  VideoCompositionAnalysis,
} from "../types"

export interface UseMontageBackendReturn {
  // Основные команды
  analyzeVideoComposition: (
    videoPath: string,
    processorId: string,
    options?: MontageAnalysisConfig,
  ) => Promise<VideoCompositionAnalysis>

  detectKeyMoments: (
    detections: any[], // YOLO detections
    qualityScores: number[],
  ) => Promise<MomentScore[]>

  generateMontagePlan: (
    moments: MomentScore[],
    config: PlanGeneratorConfig,
    sourceFiles: string[],
  ) => Promise<MontagePlan>

  analyzeVideoQuality: (videoPath: string) => Promise<MontageQualityAnalysis>

  analyzeFrameQuality: (videoPath: string, timestamp: number) => Promise<MontageVideoAnalysis>

  analyzeAudioContent: (audioPath: string) => Promise<AudioContentAnalysis>

  // Состояние
  isAnalyzing: boolean
  isGenerating: boolean
  error: string | null
  progress: number
}

export function useMontageBackend(): UseMontageBackendReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  /**
   * Анализ композиции видео с YOLO
   */
  const analyzeVideoComposition = useCallback(
    async (
      videoPath: string,
      processorId: string,
      options: MontageAnalysisConfig = {},
    ): Promise<VideoCompositionAnalysis> => {
      setIsAnalyzing(true)
      setError(null)
      setProgress(0)

      try {
        const result = await invoke<VideoCompositionAnalysis>("analyze_video_composition", {
          videoPath,
          processorId,
          options,
        })

        setProgress(100)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to analyze video composition"
        setError(errorMessage)
        logger.error("Video composition analysis failed:", err)
        throw new Error(errorMessage)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [],
  )

  /**
   * Детекция ключевых моментов
   */
  const detectKeyMoments = useCallback(async (detections: any[], qualityScores: number[]): Promise<MomentScore[]> => {
    setIsAnalyzing(true)
    setError(null)
    setProgress(25)

    try {
      const result = await invoke<MomentScore[]>("detect_key_moments", {
        detections,
        qualityScores,
      })

      setProgress(100)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to detect key moments"
      setError(errorMessage)
      logger.error("Key moment detection failed:", err)
      throw new Error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Генерация монтажного плана
   */
  const generateMontagePlan = useCallback(
    async (moments: MomentScore[], config: PlanGeneratorConfig, sourceFiles: string[]): Promise<MontagePlan> => {
      setIsGenerating(true)
      setError(null)
      setProgress(0)

      try {
        const result = await invoke<MontagePlan>("generate_montage_plan", {
          moments,
          config,
          sourceFiles,
        })

        setProgress(100)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate montage plan"
        setError(errorMessage)
        logger.error("Montage plan generation failed:", err)
        throw new Error(errorMessage)
      } finally {
        setIsGenerating(false)
      }
    },
    [],
  )

  /**
   * Анализ качества видео
   */
  const analyzeVideoQuality = useCallback(async (videoPath: string): Promise<MontageQualityAnalysis> => {
    setIsAnalyzing(true)
    setError(null)
    setProgress(0)

    try {
      const result = await invoke<MontageQualityAnalysis>("analyze_video_quality", {
        videoPath,
      })

      setProgress(100)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze video quality"
      setError(errorMessage)
      logger.error("Video quality analysis failed:", err)
      throw new Error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Анализ качества кадра
   */
  const analyzeFrameQuality = useCallback(
    async (videoPath: string, timestamp: number): Promise<MontageVideoAnalysis> => {
      setIsAnalyzing(true)
      setError(null)
      setProgress(0)

      try {
        const result = await invoke<MontageVideoAnalysis>("analyze_frame_quality", {
          videoPath,
          timestamp,
        })

        setProgress(100)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to analyze frame quality"
        setError(errorMessage)
        logger.error("Frame quality analysis failed:", err)
        throw new Error(errorMessage)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [],
  )

  /**
   * Анализ аудио контента
   */
  const analyzeAudioContent = useCallback(async (audioPath: string): Promise<AudioContentAnalysis> => {
    setIsAnalyzing(true)
    setError(null)
    setProgress(0)

    try {
      const result = await invoke<AudioContentAnalysis>("analyze_audio_content", {
        audioPath,
      })

      setProgress(100)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze audio content"
      setError(errorMessage)
      logger.error("Audio content analysis failed:", err)
      throw new Error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    analyzeVideoComposition,
    detectKeyMoments,
    generateMontagePlan,
    analyzeVideoQuality,
    analyzeFrameQuality,
    analyzeAudioContent,
    isAnalyzing,
    isGenerating,
    error,
    progress,
  }
}
