/**
 * Hook для управления пакетным AI Director анализом с детальным прогрессом
 *
 * Этот хук предоставляет:
 * - Выбор конкретных анализаторов через checkbox
 * - Детальный прогресс по каждому файлу и анализатору
 * - Пакетный анализ нескольких файлов
 */

import { invoke } from "@tauri-apps/api/core"
import { listen, UnlistenFn } from "@tauri-apps/api/event"
import { useCallback, useEffect, useState } from "react"
import type { AnalysisError, AnalysisProgress } from "@/domains/ai-services/types/ai-director-events"
import { createLogger } from "@/lib/tauri-logger"

import type {
  AnalyzerType,
  BatchAnalysisProgress,
  FileAnalysisProgress as FileProgress,
} from "../types/analysis-progress"
import { createInitialFileProgress, updateAnalyzerProgress } from "../types/analysis-progress"

const logger = createLogger("useAIDirectorAnalysisV2")

// AI Director types (будут в tauri-bindings после генерации)
type AIDirectorConfig = any
type ComprehensiveAnalysisResult = any

export interface UseAIDirectorAnalysisV2Return {
  // State
  isAnalyzing: boolean
  filesProgress: FileProgress[]
  batchProgress: BatchAnalysisProgress | null
  errors: AnalysisError[]

  // Actions
  startBatchAnalysis: (filePaths: string[], analyzers: Set<AnalyzerType>) => Promise<void>
  clearErrors: () => void
  reset: () => void

  // Computed
  overallProgress: number
}

/**
 * Маппинг фронтенд анализаторов на флаги конфигурации бэкенда
 */
function mapAnalyzersToConfig(analyzers: Set<AnalyzerType>): Partial<AIDirectorConfig> {
  return {
    enable_scene_detection: analyzers.has("scene_detection"),
    enable_object_detection: analyzers.has("object_detection"),
    enable_face_detection: analyzers.has("face_detection"),
    enable_face_analysis: analyzers.has("face_detection"), // Включаем вместе с detection
    enable_motion_analysis: analyzers.has("motion_analysis"),
    enable_composition_analysis: analyzers.has("composition_analysis"),

    enable_audio_analysis: analyzers.has("audio_quality"),
    // speech_recognition требует enable_audio_analysis + transcription
    // Пока мапим на audio_analysis, позже можно расширить
    enable_moment_detection: analyzers.has("moment_detection"),
    enable_content_classification: analyzers.has("content_classification"),
    enable_mood_analysis: analyzers.has("mood_analysis"),
    enable_quality_analysis: analyzers.has("quality_assessment"),

    // VLM анализ
    enable_vision_language_model: analyzers.has("vlm_analysis"),

    // Базовые настройки
    performance_mode: "Balanced",
    generate_editing_recommendations: false,
    enable_mcp_agents: false,
  }
}

/**
 * Симуляция прогресса анализаторов на основе общего прогресса события
 *
 * Так как бэкенд не отправляет детальный прогресс каждого анализатора,
 * мы симулируем его на основе stage и общего прогресса
 */
function simulateAnalyzerProgress(file: FileProgress, stage: string, overallProgress: number): FileProgress {
  let updated = { ...file }

  // Map stages to analyzer types
  const stageToAnalyzers: Record<string, AnalyzerType[]> = {
    initialization: [],
    audio: ["audio_quality", "speech_recognition", "music_detection", "sound_events", "silence_detection"],
    video: ["scene_detection", "object_detection", "face_detection", "motion_analysis", "composition_analysis"],
    vision: ["vlm_analysis"],
    integration: ["moment_detection", "content_classification", "quality_assessment", "mood_analysis"],
  }

  const activeAnalyzers = stageToAnalyzers[stage] || []

  // Update analyzers in current stage
  for (const type of activeAnalyzers) {
    const analyzer = updated.analyzers.find((a) => a.type === type)
    if (!analyzer) continue

    // Start analyzer if pending
    if (analyzer.status === "pending") {
      updated = updateAnalyzerProgress(updated, type, {
        status: "running",
        progress: Math.min(5, overallProgress),
        startTime: new Date().toISOString(),
      })
    }
    // Update progress if running
    else if (analyzer.status === "running") {
      updated = updateAnalyzerProgress(updated, type, {
        progress: Math.min(95, overallProgress),
      })
    }
  }

  // Complete analyzers from previous stages
  for (const [prevStage, types] of Object.entries(stageToAnalyzers)) {
    if (prevStage === stage) break // Stop at current stage

    for (const type of types) {
      const analyzer = updated.analyzers.find((a) => a.type === type)
      if (analyzer && analyzer.status === "running") {
        updated = updateAnalyzerProgress(updated, type, {
          status: "completed",
          progress: 100,
          endTime: new Date().toISOString(),
          duration: analyzer.startTime ? Date.now() - new Date(analyzer.startTime).getTime() : 0,
        })
      }
    }
  }

  return updated
}

export function useAIDirectorAnalysisV2(): UseAIDirectorAnalysisV2Return {
  logger.infoSync("[useAIDirectorAnalysisV2] Инициализация хука для пакетного AI Director анализа")

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [filesProgress, setFilesProgress] = useState<FileProgress[]>([])
  const [batchProgress, setBatchProgress] = useState<BatchAnalysisProgress | null>(null)
  const [errors, setErrors] = useState<AnalysisError[]>([])

  // Map для отслеживания какой файл сейчас анализируется
  const [currentFileIndex, setCurrentFileIndex] = useState(0)

  // Event listeners
  useEffect(() => {
    const unlistenFunctions: UnlistenFn[] = []
    let isMounted = true

    const setupEventListeners = async () => {
      try {
        // Analysis started
        const unlistenStarted = await listen("analysis-started", (event) => {
          logger.infoSync("[useAIDirectorAnalysisV2] Analysis started", event.payload as Record<string, unknown>)
          // Будет обработано в startBatchAnalysis
        })
        if (isMounted) unlistenFunctions.push(unlistenStarted)

        // 🆕 v2: File Analysis Started
        const unlistenFileStarted = await listen("file-analysis-started", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] File analysis started", payload)

          setFilesProgress((prev) => {
            const updatedFiles = [...prev]
            const fileIndex = payload.file_index as number

            if (fileIndex < updatedFiles.length) {
              updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                status: "analyzing",
                startTime: new Date().toISOString(),
              }
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenFileStarted)

        // 🆕 v2: File Analysis Progress
        const unlistenFileProgress = await listen("file-analysis-progress", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] File analysis progress", payload)

          setFilesProgress((prev) => {
            const updatedFiles = [...prev]
            const file = updatedFiles.find((f) => f.id === payload.file_id)

            if (file) {
              const fileIndex = updatedFiles.indexOf(file)
              const progressPercentage = Math.round((payload.progress as number) * 100)

              updatedFiles[fileIndex] = {
                ...file,
                progress: progressPercentage,
              }
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenFileProgress)

        // 🆕 v2: File Analysis Completed
        const unlistenFileCompleted = await listen("file-analysis-completed", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] File analysis completed", payload)

          setFilesProgress((prev) => {
            const updatedFiles = [...prev]
            const file = updatedFiles.find((f) => f.id === payload.file_id)

            if (file) {
              const fileIndex = updatedFiles.indexOf(file)
              updatedFiles[fileIndex] = {
                ...file,
                status: payload.success ? "completed" : "error",
                progress: 100,
                error: payload.error,
                endTime: new Date().toISOString(),
                duration: payload.duration_ms,
              }
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenFileCompleted)

        // 🆕 Phase 2: Batch Analysis Started
        const unlistenBatchStarted = await listen("batch-analysis-started", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] Batch analysis started", payload)

          setBatchProgress({
            batchId: payload.batch_id,
            totalFiles: payload.total_files,
            completedFiles: 0,
            progress: 0,
            configMode: payload.config_mode,
            startTime: new Date().toISOString(),
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenBatchStarted)

        // 🆕 Phase 2: Batch Analysis Progress
        const unlistenBatchProgress = await listen("batch-analysis-progress", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] Batch analysis progress", payload)

          setBatchProgress((prev) => {
            if (!prev) return prev

            return {
              ...prev,
              completedFiles: payload.completed_files,
              progress: Math.round((payload.progress as number) * 100),
              currentFilePath: payload.current_file_path,
              estimatedTimeRemaining: payload.estimated_time_remaining,
            }
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenBatchProgress)

        // 🆕 Phase 2: Batch Analysis Completed
        const unlistenBatchCompleted = await listen("batch-analysis-completed", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] Batch analysis completed", payload)

          setBatchProgress((prev) => {
            if (!prev) return prev

            return {
              ...prev,
              completedFiles: payload.total_files,
              progress: 100,
              successfulFiles: payload.successful_files,
              failedFiles: payload.failed_files,
              totalDuration: payload.total_duration_ms,
              errors: payload.errors,
              endTime: new Date().toISOString(),
            }
          })

          setIsAnalyzing(false)
        })
        if (isMounted) unlistenFunctions.push(unlistenBatchCompleted)

        // 🆕 v2: Analyzer Started
        const unlistenAnalyzerStarted = await listen("analyzer-started", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] Analyzer started", payload)

          setFilesProgress((prev) => {
            const updatedFiles = [...prev]
            const file = updatedFiles.find((f) => f.id === payload.file_id)

            if (file) {
              const fileIndex = updatedFiles.indexOf(file)
              const analyzerType = payload.analyzer_type as string

              updatedFiles[fileIndex] = updateAnalyzerProgress(file, analyzerType as AnalyzerType, {
                status: "running",
                progress: 0,
                startTime: new Date().toISOString(),
              })
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenAnalyzerStarted)

        // 🆕 v2: Analyzer Progress
        const unlistenAnalyzerProgress = await listen("analyzer-progress", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] Analyzer progress", payload)

          setFilesProgress((prev) => {
            const updatedFiles = [...prev]
            const file = updatedFiles.find((f) => f.id === payload.file_id)

            if (file) {
              const fileIndex = updatedFiles.indexOf(file)
              const analyzerType = payload.analyzer_type as string
              const progressPercentage = Math.round((payload.progress as number) * 100)

              updatedFiles[fileIndex] = updateAnalyzerProgress(file, analyzerType as AnalyzerType, {
                progress: progressPercentage,
                details: payload.details,
              })
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenAnalyzerProgress)

        // 🆕 v2: Analyzer Completed
        const unlistenAnalyzerCompleted = await listen("analyzer-completed", (event) => {
          const payload = event.payload as any
          logger.infoSync("[useAIDirectorAnalysisV2] Analyzer completed", payload)

          setFilesProgress((prev) => {
            const updatedFiles = [...prev]
            const file = updatedFiles.find((f) => f.id === payload.file_id)

            if (file) {
              const fileIndex = updatedFiles.indexOf(file)
              const analyzerType = payload.analyzer_type as string

              updatedFiles[fileIndex] = updateAnalyzerProgress(file, analyzerType as AnalyzerType, {
                status: payload.success ? "completed" : "error",
                progress: 100,
                error: payload.error,
                endTime: new Date().toISOString(),
                duration: payload.duration_ms,
              })
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenAnalyzerCompleted)

        // Analysis progress - самое важное событие для обновления UI
        const unlistenProgress = await listen("analysis-progress", (event) => {
          const progress = event.payload as unknown as AnalysisProgress
          logger.infoSync("[useAIDirectorAnalysisV2] Analysis progress", progress as unknown as Record<string, unknown>)

          setFilesProgress((prev) => {
            if (prev.length === 0) return prev

            const updatedFiles = [...prev]
            const currentFile = updatedFiles[currentFileIndex]

            if (!currentFile) return prev

            // Simulate analyzer progress based on stage
            const progressPercentage = Math.round(progress.progress * 100)
            const updatedFile = simulateAnalyzerProgress(currentFile, progress.stage, progressPercentage)

            // Update file status and progress
            updatedFiles[currentFileIndex] = {
              ...updatedFile,
              status: "analyzing",
              progress: progressPercentage,
            }

            return updatedFiles
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenProgress)

        // Analysis completed
        const unlistenCompleted = await listen("analysis-completed", (event) => {
          logger.infoSync("[useAIDirectorAnalysisV2] Analysis completed", event.payload as Record<string, unknown>)

          setFilesProgress((prev) => {
            const updated = [...prev]
            const currentFile = updated[currentFileIndex]

            if (currentFile) {
              // Mark all running analyzers as completed
              const completedAnalyzers = currentFile.analyzers.map((analyzer) => {
                if (analyzer.status === "running" || analyzer.status === "pending") {
                  return {
                    ...analyzer,
                    status: "completed" as const,
                    progress: 100,
                    endTime: new Date().toISOString(),
                  }
                }
                return analyzer
              })

              updated[currentFileIndex] = {
                ...currentFile,
                status: "completed",
                progress: 100,
                analyzers: completedAnalyzers,
                endTime: new Date().toISOString(),
              }
            }

            return updated
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenCompleted)

        // Analysis errors
        const unlistenError = await listen("analysis-error", (event) => {
          const error = event.payload as unknown as AnalysisError
          logger.errorSync("[useAIDirectorAnalysisV2] Analysis error", error as unknown as Record<string, unknown>)

          setErrors((prev) => [...prev, error])

          setFilesProgress((prev) => {
            const updated = [...prev]
            const currentFile = updated[currentFileIndex]

            if (currentFile) {
              updated[currentFileIndex] = {
                ...currentFile,
                status: "error",
                error: error.error,
                endTime: new Date().toISOString(),
              }
            }

            return updated
          })
        })
        if (isMounted) unlistenFunctions.push(unlistenError)
      } catch (error) {
        logger.errorSync("[useAIDirectorAnalysisV2] Ошибка настройки event listeners", error as Record<string, unknown>)
      }
    }

    void setupEventListeners()

    return () => {
      isMounted = false
      unlistenFunctions.forEach((unlisten) => {
        try {
          unlisten()
        } catch (error) {
          logger.errorSync("[useAIDirectorAnalysisV2] Ошибка cleanup event listener", error as Record<string, unknown>)
        }
      })
    }
  }, [currentFileIndex])

  // Start batch analysis
  const startBatchAnalysis = useCallback(async (filePaths: string[], analyzers: Set<AnalyzerType>) => {
    try {
      logger.infoSync("[useAIDirectorAnalysisV2] Запуск пакетного анализа", {
        filesCount: filePaths.length,
        analyzers: Array.from(analyzers),
      })

      // Reset state
      setIsAnalyzing(true)
      setErrors([])
      setCurrentFileIndex(0)

      // Create initial file progress
      const initialFiles = filePaths.map((filePath, index) => {
        const fileName = filePath.split("/").pop() || filePath
        return createInitialFileProgress(`file-${index}`, filePath, fileName, Array.from(analyzers))
      })
      setFilesProgress(initialFiles)

      // Create batch progress
      const batchId = `batch-${Date.now()}`
      setBatchProgress({
        id: batchId,
        status: "running",
        files: initialFiles,
        startTime: new Date().toISOString(),
        stats: {
          totalFiles: filePaths.length,
          completedFiles: 0,
          failedFiles: 0,
          totalProgress: 0,
        },
      })

      // Convert analyzers to config
      const config = mapAnalyzersToConfig(analyzers)
      logger.infoSync("[useAIDirectorAnalysisV2] Config", config)

      // Call backend command (v2 with events)
      // NOTE: Бэкенд анализирует файлы последовательно и отправляет real-time события
      const results = await invoke<ComprehensiveAnalysisResult[]>("ai_director_v2_analyze_batch", {
        filePaths,
        config,
      })

      logger.infoSync("[useAIDirectorAnalysisV2] Batch analysis completed", {
        resultsCount: results.length,
      })

      // Update final state
      setIsAnalyzing(false)
      setBatchProgress((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              endTime: new Date().toISOString(),
              stats: {
                ...prev.stats,
                completedFiles: results.length,
              },
            }
          : null,
      )
    } catch (error) {
      logger.errorSync("[useAIDirectorAnalysisV2] Ошибка пакетного анализа", error as Record<string, unknown>)
      setIsAnalyzing(false)
      setErrors((prev) => [
        ...prev,
        {
          analysisId: "batch",
          stage: "batch",
          error: String(error),
        },
      ])
      setBatchProgress((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              endTime: new Date().toISOString(),
            }
          : null,
      )
    }
  }, [])

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    setFilesProgress([])
    setBatchProgress(null)
    setErrors([])
    setIsAnalyzing(false)
    setCurrentFileIndex(0)
  }, [])

  // Computed: overall progress across all files
  const overallProgress =
    filesProgress.length > 0
      ? Math.round(filesProgress.reduce((sum, file) => sum + file.progress, 0) / filesProgress.length)
      : 0

  return {
    // State
    isAnalyzing,
    filesProgress,
    batchProgress,
    errors,

    // Actions
    startBatchAnalysis,
    clearErrors,
    reset,

    // Computed
    overallProgress,
  }
}
