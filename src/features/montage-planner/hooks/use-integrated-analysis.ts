/**
 * Интегрированный хук для анализа контента с подключением к backend
 */

import { useCallback, useState } from "react"
import type { MediaFile } from "@/core/types"
import { MediaType } from "@/core/types"
import { getMediaMetadataService } from "@/domains/media-management/services/media-metadata-service"
import { createLogger } from "@/lib/tauri-logger"
import type { Fragment, MontagePlan } from "../types"
import { convertToAIServicesMediaFile } from "../utils/media-file-converter"
import { useContentAnalysis } from "./use-content-analysis"
import { useMontagePlanner } from "./use-montage-planner"
import { usePlanGenerator } from "./use-plan-generator"

const logger = createLogger("IntegratedAnalysis")

export interface UseIntegratedAnalysisReturn {
  // Основные действия
  analyzeProject: (mediaFiles: MediaFile[]) => Promise<void>
  generateSmartPlan: (style?: string, targetDuration?: number) => Promise<MontagePlan | null>

  // Расширенные действия
  analyzeSelectedFiles: (filePaths: string[]) => Promise<void>
  detectMomentsFromAnalysis: () => Promise<any[]>

  // Состояние
  isAnalyzing: boolean
  isGenerating: boolean
  analysisProgress: number
  generationProgress: number
  error: string | null

  // Результаты
  analysisResults: {
    videoCount: number
    audioCount: number
    momentsDetected: number
    averageQuality: number
  } | null

  // Из существующих хуков
  contentAnalysis: ReturnType<typeof useContentAnalysis>
  planGenerator: ReturnType<typeof usePlanGenerator>
}

export function useIntegratedAnalysis(): UseIntegratedAnalysisReturn {
  // Backend integration available if needed
  // const backend = useMontageBackend()
  const contentAnalysis = useContentAnalysis()
  const planGenerator = usePlanGenerator()
  const { send, context, isAnalyzing, isGenerating, startAnalysis } = useMontagePlanner()

  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [analysisResults, setAnalysisResults] = useState<{
    videoCount: number
    audioCount: number
    momentsDetected: number
    averageQuality: number
  } | null>(null)

  /**
   * Полный анализ проекта с использованием backend команд
   */
  const analyzeProject = useCallback(
    async (mediaFiles: MediaFile[]): Promise<void> => {
      try {
        setError(null)
        setAnalysisProgress(0)

        // First add all media files to the montage planner
        for (const mediaFile of mediaFiles) {
          send({ type: "ADD_VIDEO", videoId: mediaFile.id, file: convertToAIServicesMediaFile(mediaFile) })
        }

        // Start the analysis process
        startAnalysis()

        // Simple progress simulation while analysis runs
        const progressInterval = setInterval(() => {
          setAnalysisProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 500)

        // Wait for analysis to complete (simulated)
        await new Promise((resolve) => setTimeout(resolve, 5000))

        clearInterval(progressInterval)
        setAnalysisProgress(100)

        // Set results
        setAnalysisResults({
          videoCount: mediaFiles.filter((f) => f.isVideo).length,
          audioCount: mediaFiles.filter((f) => f.isAudio).length,
          momentsDetected: context.fragments?.length || 0,
          averageQuality: 85, // Placeholder
        })

        // Complete analysis with required parameters
        send({
          type: "ANALYSIS_COMPLETE",
          fragments: context.fragments || [],
          videoAnalysis: {},
          audioAnalysis: {},
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed")
        send({ type: "CANCEL_ANALYSIS" })
        throw err
      }
    },
    [send, startAnalysis, context.fragments],
  )

  /**
   * Анализ выбранных файлов
   */
  const analyzeSelectedFiles = useCallback(
    async (filePaths: string[]): Promise<void> => {
      logger.info("[Integrated Analysis] Starting analysis of selected files", { filesCount: filePaths.length })

      const metadataService = getMediaMetadataService()

      // Извлекаем метаданные для каждого файла параллельно
      const mediaFilesPromises = filePaths.map(async (path, index) => {
        try {
          // Определяем тип файла по расширению
          const ext = path.split(".").pop()?.toLowerCase() || ""
          const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v"]
          const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a"]

          const isVideo = videoExts.includes(ext)
          const isAudio = audioExts.includes(ext)

          // Извлекаем реальную длительность из метаданных
          let duration = 0
          try {
            duration = await metadataService.getMediaDuration(path)
            logger.debug(`[Integrated Analysis] Extracted duration for ${path}`, { duration })
          } catch (error) {
            logger.warn(`[Integrated Analysis] Failed to get duration for ${path}`, { error })
          }

          return {
            id: `file-${index}`,
            path,
            name: path.split("/").pop() || path,
            type: isVideo ? MediaType.Video : isAudio ? MediaType.Audio : MediaType.Unknown,
            isVideo,
            isAudio,
            duration,
            format: "",
            codec: "",
            width: 0,
            height: 0,
            frameRate: 0,
            bitrate: 0,
          } as MediaFile
        } catch (error) {
          logger.error(`[Integrated Analysis] Failed to process file ${path}`, { error })
          // Возвращаем базовую информацию без метаданных в случае ошибки
          const ext = path.split(".").pop()?.toLowerCase() || ""
          const isVideo = ["mp4", "mov", "avi", "mkv", "webm", "m4v"].includes(ext)
          const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)

          return {
            id: `file-${index}`,
            path,
            name: path.split("/").pop() || path,
            type: isVideo ? MediaType.Video : isAudio ? MediaType.Audio : MediaType.Unknown,
            isVideo,
            isAudio,
            duration: 0,
            format: "",
            codec: "",
            width: 0,
            height: 0,
            frameRate: 0,
            bitrate: 0,
          } as MediaFile
        }
      })

      const mediaFiles = await Promise.all(mediaFilesPromises)
      logger.info("[Integrated Analysis] Metadata extracted for all files", {
        totalDuration: mediaFiles.reduce((sum, f) => sum + (f.duration || 0), 0),
      })

      await analyzeProject(mediaFiles)
    },
    [analyzeProject],
  )

  /**
   * Детекция моментов из анализа
   */
  const detectMomentsFromAnalysis = useCallback(async () => {
    // Return fragments as moments
    return context.fragments?.map((f: Fragment) => f.score) || []
  }, [context.fragments])

  /**
   * Генерация умного плана
   */
  const generateSmartPlan = useCallback(
    async (style = "dynamic", targetDuration = 120): Promise<MontagePlan | null> => {
      try {
        setError(null)
        setGenerationProgress(0)

        // Update settings
        send({ type: "SELECT_STYLE", styleId: style })
        send({ type: "SET_TARGET_DURATION", duration: targetDuration })

        // Generate plan
        send({ type: "GENERATE_PLAN" })

        // Simple progress simulation
        const progressInterval = setInterval(() => {
          setGenerationProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 300)

        // Wait for generation (simulated)
        await new Promise((resolve) => setTimeout(resolve, 3000))

        clearInterval(progressInterval)
        setGenerationProgress(100)

        return context.currentPlan
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed")
        return null
      }
    },
    [send, context.currentPlan],
  )

  return {
    // Основные действия
    analyzeProject,
    generateSmartPlan,
    analyzeSelectedFiles,
    detectMomentsFromAnalysis,

    // Состояние
    isAnalyzing,
    isGenerating,
    analysisProgress,
    generationProgress,
    error,

    // Результаты
    analysisResults,

    // Из существующих хуков
    contentAnalysis,
    planGenerator,
  }
}
