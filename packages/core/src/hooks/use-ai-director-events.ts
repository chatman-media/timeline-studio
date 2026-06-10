import { useCallback, useEffect, useRef, useState } from "react"
import { container } from "@timeline-studio/core/container"
import type { UnlistenFn } from "@timeline-studio/core/ports"
import { analysisNotificationService } from "@timeline-studio/core/services/analysis-notification-service"
import type {
  AnalysisCompleted,
  AnalysisError,
  AnalysisProgress,
  AnalysisStageCompleted,
} from "@timeline-studio/core/types/ai-director"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseAIDirectorEvents")

export const AI_DIRECTOR_EVENTS = {
  ANALYSIS_STARTED: "analysis-started",
  ANALYSIS_PROGRESS: "analysis-progress",
  ANALYSIS_COMPLETED: "analysis-completed",
  ANALYSIS_ERROR: "analysis-error",
  ANALYSIS_STAGE_COMPLETED: "analysis-stage-completed",
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

export interface AIDirectorEventCallbacks {
  onAnalysisStarted?: (payload: unknown) => void
  onAnalysisProgress?: (progress: AnalysisProgress) => void
  onAnalysisCompleted?: (result: AnalysisCompleted) => void
  onAnalysisError?: (error: AnalysisError) => void
  onAnalysisStageCompleted?: (stage: AnalysisStageCompleted) => void
  onFileAnalysisStarted?: (payload: unknown) => void
  onFileAnalysisProgress?: (payload: unknown) => void
  onFileAnalysisCompleted?: (payload: unknown) => void
  onBatchAnalysisStarted?: (payload: unknown) => void
  onBatchAnalysisProgress?: (payload: unknown) => void
  onBatchAnalysisCompleted?: (payload: unknown) => void
  onAnalyzerStarted?: (payload: unknown) => void
  onAnalyzerProgress?: (payload: unknown) => void
  onAnalyzerCompleted?: (payload: unknown) => void
}

export interface UseAIDirectorEventsReturn {
  isListening: boolean
  lastProgress: AnalysisProgress | null
  lastError: AnalysisError | null
  errors: AnalysisError[]
  clearErrors: () => void
}

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
    if (!container.hasEvent()) return

    let isMounted = true
    const eventService = container.getEvent()

    const setupListeners = async () => {
      try {
        const unlistenFunctions: UnlistenFn[] = []

        const unlistenStarted = await eventService.listen(AI_DIRECTOR_EVENTS.ANALYSIS_STARTED, (event) => {
          logger.info("Analysis started", event.payload as Record<string, unknown>)
          const payload = event.payload as any
          analysisNotificationService.notifyAnalysisStarted(
            payload.media_path || payload.file_path || "Unknown file",
            payload.analysis_type || "comprehensive",
          )
          callbacks?.onAnalysisStarted?.(event.payload)
        })
        if (isMounted) unlistenFunctions.push(unlistenStarted)

        const unlistenProgress = await eventService.listen(AI_DIRECTOR_EVENTS.ANALYSIS_PROGRESS, (event) => {
          const progress = event.payload as unknown as AnalysisProgress
          logger.debug("Analysis progress", progress as unknown as Record<string, unknown>)
          setLastProgress(progress)
          callbacks?.onAnalysisProgress?.(progress)
        })
        if (isMounted) unlistenFunctions.push(unlistenProgress)

        const unlistenCompleted = await eventService.listen(AI_DIRECTOR_EVENTS.ANALYSIS_COMPLETED, (event) => {
          const result = event.payload as unknown as AnalysisCompleted
          logger.info("Analysis completed", event.payload as Record<string, unknown>)
          setLastProgress(null)

          const payload = event.payload as any
          analysisNotificationService.notifyAnalysisCompleted(
            payload.file_name || payload.file_path || "Unknown file",
            payload.total_duration_ms || 0,
            payload.success !== false,
          )

          callbacks?.onAnalysisCompleted?.(result)
        })
        if (isMounted) unlistenFunctions.push(unlistenCompleted)

        const unlistenError = await eventService.listen(AI_DIRECTOR_EVENTS.ANALYSIS_ERROR, (event) => {
          const error = event.payload as unknown as AnalysisError
          logger.error("Analysis error", error as unknown as Record<string, unknown>)
          setLastError(error)
          setErrors((prev) => [...prev, error])

          const payload = event.payload as any
          analysisNotificationService.notifyAnalysisError(
            payload.file_path || payload.media_path || "Unknown file",
            payload.error || payload.message || "Unknown error",
          )

          callbacks?.onAnalysisError?.(error)
        })
        if (isMounted) unlistenFunctions.push(unlistenError)

        const unlistenStageCompleted = await eventService.listen(
          AI_DIRECTOR_EVENTS.ANALYSIS_STAGE_COMPLETED,
          (event) => {
            const stage = event.payload as unknown as AnalysisStageCompleted
            logger.info("Analysis stage completed", event.payload as Record<string, unknown>)
            callbacks?.onAnalysisStageCompleted?.(stage)
          },
        )
        if (isMounted) unlistenFunctions.push(unlistenStageCompleted)

        const v2Listeners = [
          [AI_DIRECTOR_EVENTS.FILE_ANALYSIS_STARTED, callbacks?.onFileAnalysisStarted, "File analysis started"],
          [AI_DIRECTOR_EVENTS.FILE_ANALYSIS_PROGRESS, callbacks?.onFileAnalysisProgress, "File analysis progress"],
          [AI_DIRECTOR_EVENTS.FILE_ANALYSIS_COMPLETED, callbacks?.onFileAnalysisCompleted, "File analysis completed"],
          [AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_STARTED, callbacks?.onBatchAnalysisStarted, "Batch analysis started"],
          [AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_PROGRESS, callbacks?.onBatchAnalysisProgress, "Batch analysis progress"],
          [
            AI_DIRECTOR_EVENTS.BATCH_ANALYSIS_COMPLETED,
            callbacks?.onBatchAnalysisCompleted,
            "Batch analysis completed",
          ],
          [AI_DIRECTOR_EVENTS.ANALYZER_STARTED, callbacks?.onAnalyzerStarted, "Analyzer started"],
          [AI_DIRECTOR_EVENTS.ANALYZER_PROGRESS, callbacks?.onAnalyzerProgress, "Analyzer progress"],
          [AI_DIRECTOR_EVENTS.ANALYZER_COMPLETED, callbacks?.onAnalyzerCompleted, "Analyzer completed"],
        ] as const

        for (const [eventName, callback, message] of v2Listeners) {
          const unlisten = await eventService.listen(eventName, (event) => {
            logger.debug(message, event.payload as Record<string, unknown>)
            callback?.(event.payload)
          })
          if (isMounted) unlistenFunctions.push(unlisten)
        }

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
