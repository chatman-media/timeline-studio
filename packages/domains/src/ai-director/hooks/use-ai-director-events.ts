/**
 * Hook for AI Director Tauri Events
 *
 * Provides event listeners for real-time AI Director updates.
 * All Tauri listen() calls are centralized here.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event"
import { useCallback, useEffect, useRef, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { analysisNotificationService } from "../services/analysis-notification-service"
import type { AnalysisCompleted, AnalysisError, AnalysisProgress, AnalysisStageCompleted } from "../types"

const logger = createLogger("UseAIDirectorEvents")

// ============================================================================
// Event Names
// ============================================================================

export const AI_DIRECTOR_EVENTS = {
  ANALYSIS_STARTED: "analysis-started",
  ANALYSIS_PROGRESS: "analysis-progress",
  ANALYSIS_COMPLETED: "analysis-completed",
  ANALYSIS_ERROR: "analysis-error",
  ANALYSIS_STAGE_COMPLETED: "analysis-stage-completed",
  // V2 Events
  FILE_ANALYSIS_STARTED: "file-analysis-started",
  FILE_ANALYSIS_PROGRESS: "file-analysis-progress",
  FILE_ANALYSIS_COMPLETED: "file-analysis-completed",
  BATCH_ANALYSIS_STARTED: "batch-analysis-started",
  BATCH_ANALYSIS_PROGRESS: "batch-analysis-progress",
  BATCH_ANALYSIS_COMPLETED: "batch-analysis-completed",
  ANALYZER_STARTED: "analyzer-started",
  ANALYZER_PROGRESS: "analyzer-progress",
  ANALYZER_COMPLETED: "analyzer-completed",
} as const

// ============================================================================
// Event Callbacks Interface
// ============================================================================

export interface AIDirectorEventCallbacks {
  onAnalysisStarted?: (payload: any) => void
  onAnalysisProgress?: (progress: AnalysisProgress) => void
  onAnalysisCompleted?: (result: AnalysisCompleted) => void
  onAnalysisError?: (error: AnalysisError) => void
  onAnalysisStageCompleted?: (stage: AnalysisStageCompleted) => void
  // V2 Events
  onFileAnalysisStarted?: (payload: any) => void
  onFileAnalysisProgress?: (payload: any) => void
  onFileAnalysisCompleted?: (payload: any) => void
  onBatchAnalysisStarted?: (payload: any) => void
  onBatchAnalysisProgress?: (payload: any) => void
  onBatchAnalysisCompleted?: (payload: any) => void
  onAnalyzerStarted?: (payload: any) => void
  onAnalyzerProgress?: (payload: any) => void
  onAnalyzerCompleted?: (payload: any) => void
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAIDirectorEventsReturn {
  isListening: boolean
  lastProgress: AnalysisProgress | null
  lastError: AnalysisError | null
  errors: AnalysisError[]
  clearErrors: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for subscribing to AI Director events
 */
export function useAIDirectorEvents(callbacks?: AIDirectorEventCallbacks): UseAIDirectorEventsReturn {
  const [isListening, setIsListening] = useState(false)
  const [lastProgress, setLastProgress] = useState<AnalysisProgress | null>(null)
  const [lastError, setLastError] = useState<AnalysisError | null>(null)
  const [errors, setErrors] = useState<AnalysisError[]>([])

  const unlistenFunctionsRef = useRef<UnlistenFn[]>([])

  const clearErrors = useCallback(() => {
    setErrors([])
    setLastError(null)
  }, [])

  useEffect(() => {
    let isMounted = true

    const setupListeners = async () => {
      try {
        const unlistenFunctions: UnlistenFn[] = []

        // Analysis Started
        const unlistenStarted = await listen(AI_DIRECTOR_EVENTS.ANALYSIS_STARTED, (event) => {
          logger.info("Analysis started", event.payload as Record<string, unknown>)
          const payload = event.payload as any

          // Отправляем нотификацию
          analysisNotificationService.notifyAnalysisStarted(
            payload.media_path || payload.file_path || "Unknown file",
            payload.analysis_type || "comprehensive",
          )

          callbacks?.onAnalysisStarted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenStarted)

        // Analysis Progress
        const unlistenProgress = await listen(AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS, (event) => {
          const progress = event.payload as unknown as AnalysisProgress
          logger.debug("Analysis progress", progress as unknown as Record<string, unknown>)
          setLastProgress(progress)
          callbacks?.onAnalysisProgress?.(progress)
        })
        if (isMounted) unlistenFunctions.push(unlistenProgress)

        // Analysis Completed
        const unlistenCompleted = await listen(AI_DIRECTOR_EVENTS.ANALYSIS_COMPLETED, (event) => {
          const result = event.payload as unknown as AnalysisCompleted
          logger.info("Analysis completed", event.payload as Record<string, unknown>)
          setLastProgress(null)

          // Отправляем нотификацию
          const payload = event.payload as any
          analysisNotificationService.notifyAnalysisCompleted(
            payload.file_name || payload.file_path || "Unknown file",
            payload.total_duration_ms || 0,
            payload.success !== false,
          )

          callbacks?.onAnalysisCompleted?.(result)
        })
        if (isMounted) unlistenFunctions.push(unlistenCompleted)

        // Analysis Error
        const unlistenError = await listen(AI_DIRECTOR_EVENTS.ANALYSIS_ERROR, (event) => {
          const error = event.payload as unknown as AnalysisError
          logger.error("Analysis error", error as unknown as Record<string, unknown>)
          setLastError(error)
          setErrors((prev) => [...prev, error])

          // Отправляем нотификацию об ошибке
          const payload = event.payload as any
          analysisNotificationService.notifyAnalysisError(
            payload.file_path || payload.media_path || "Unknown file",
            payload.error || payload.message || "Unknown error",
          )

          callbacks?.onAnalysisError?.(error)
        })
        if (isMounted) unlistenFunctions.push(unlistenError)

        // Analysis Stage Completed
        const unlistenStageCompleted = await listen(AI_DIRECTOR_EVENTS.ANALYSIS_STAGE_COMPLETED, (event) => {
          const stage = event.payload as unknown as AnalysisStageCompleted
          logger.info("Analysis stage completed", event.payload as Record<string, unknown>)
          callbacks?.onAnalysisStageCompleted?.(stage)
        })
        if (isMounted) unlistenFunctions.push(unlistenStageCompleted)

        // V2 Events
        const unlistenFileStarted = await listen(AI_DIRECTOR_EVENTS.FILE_ANALYSIS_STARTED, (event) => {
          logger.info("File analysis started", event.payload as Record<string, unknown>)
          callbacks?.onFileAnalysisStarted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenFileStarted)

        const unlistenFileProgress = await listen(AI_DIRECTOR_EVENTS.FILE_ANALYSIS_PROGRESS, (event) => {
          logger.debug("File analysis progress", event.payload as Record<string, unknown>)
          callbacks?.onFileAnalysisProgress?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenFileProgress)

        const unlistenFileCompleted = await listen(AI_DIRECTOR_EVENTS.FILE_ANALYSIS_COMPLETED, (event) => {
          logger.info("File analysis completed", event.payload as Record<string, unknown>)
          callbacks?.onFileAnalysisCompleted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenFileCompleted)

        const unlistenBatchStarted = await listen(AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_STARTED, (event) => {
          logger.info("Batch analysis started", event.payload as Record<string, unknown>)
          callbacks?.onBatchAnalysisStarted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenBatchStarted)

        const unlistenBatchProgress = await listen(AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_PROGRESS, (event) => {
          logger.debug("Batch analysis progress", event.payload as Record<string, unknown>)
          callbacks?.onBatchAnalysisProgress?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenBatchProgress)

        const unlistenBatchCompleted = await listen(AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_COMPLETED, (event) => {
          logger.info("Batch analysis completed", event.payload as Record<string, unknown>)
          callbacks?.onBatchAnalysisCompleted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenBatchCompleted)

        const unlistenAnalyzerStarted = await listen(AI_DIRECTOR_EVENTS.ANALYZER_STARTED, (event) => {
          logger.debug("Analyzer started", event.payload as Record<string, unknown>)
          callbacks?.onAnalyzerStarted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenAnalyzerStarted)

        const unlistenAnalyzerProgress = await listen(AI_DIRECTOR_EVENTS.ANALYZER_PROGRESS, (event) => {
          logger.debug("Analyzer progress", event.payload as Record<string, unknown>)
          callbacks?.onAnalyzerProgress?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenAnalyzerProgress)

        const unlistenAnalyzerCompleted = await listen(AI_DIRECTOR_EVENTS.ANALYZER_COMPLETED, (event) => {
          logger.debug("Analyzer completed", event.payload as Record<string, unknown>)
          callbacks?.onAnalyzerCompleted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenAnalyzerCompleted)

        if (isMounted) {
          unlistenFunctionsRef.current = unlistenFunctions
          setIsListening(true)
        }
      } catch (error) {
        logger.error("Failed to setup event listeners", { error })
      }
    }

    void setupListeners()

    return () => {
      isMounted = false
      unlistenFunctionsRef.current.forEach((unlisten) => {
        try {
          unlisten()
        } catch (error) {
          logger.error("Failed to cleanup event listener", { error })
        }
      })
      unlistenFunctionsRef.current = []
      setIsListening(false)
    }
  }, [callbacks])

  return {
    isListening,
    lastProgress,
    lastError,
    errors,
    clearErrors,
  }
}
