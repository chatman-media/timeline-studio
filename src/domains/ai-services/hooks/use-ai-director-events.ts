/**
 * React Hook for AI Director Events
 *
 * Удобный hook для подписки на события AI Director из Rust backend
 */

import { useCallback, useEffect } from "react"
import { DOMAIN_EVENTS, useDomainEvents } from "@/domains/shared/events"
import type {
  AIDirectorAnalysisCompletedEvent,
  AIDirectorAnalysisErrorEvent,
  AIDirectorAnalysisProgressEvent,
  AIDirectorBatchCompletedEvent,
  AIDirectorStageCompletedEvent,
} from "@/domains/shared/events/ai-services-events"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseAIDirectorEvents")

export interface UseAIDirectorEventsOptions {
  /** Включить логирование событий */
  debug?: boolean
}

export interface AIDirectorEventHandlers {
  /** Обработчик прогресса анализа */
  onProgress?: (event: AIDirectorAnalysisProgressEvent) => void

  /** Обработчик завершения анализа */
  onCompleted?: (event: AIDirectorAnalysisCompletedEvent) => void

  /** Обработчик ошибки анализа */
  onError?: (event: AIDirectorAnalysisErrorEvent) => void

  /** Обработчик завершения стадии */
  onStageCompleted?: (event: AIDirectorStageCompletedEvent) => void

  /** Обработчик завершения batch анализа */
  onBatchCompleted?: (event: AIDirectorBatchCompletedEvent) => void
}

/**
 * Hook для подписки на события AI Director
 *
 * @example
 * ```tsx
 * function AnalysisProgress() {
 *   useAIDirectorEvents({
 *     onProgress: (event) => {
 *       console.log(`Анализ ${event.analysisId}: ${event.progress * 100}%`)
 *     },
 *     onCompleted: (event) => {
 *       console.log(`Анализ ${event.analysisId} завершен`)
 *     },
 *     onError: (event) => {
 *       console.error(`Ошибка анализа ${event.analysisId}:`, event.error)
 *     },
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useAIDirectorEvents(handlers: AIDirectorEventHandlers, options: UseAIDirectorEventsOptions = {}): void {
  const { debug = false } = options
  const { subscribe } = useDomainEvents({ domain: "ai-services", debug })

  // Подписка на события прогресса
  useEffect(() => {
    if (!handlers.onProgress) return

    subscribe<AIDirectorAnalysisProgressEvent>(
      (event) => {
        if (debug) {
          logger.debug("AI Director Progress Event:", { data: event.payload })
        }
        handlers.onProgress?.(event.payload)
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_PROGRESS },
      },
    )
  }, [handlers.onProgress, subscribe, debug])

  // Подписка на события завершения
  useEffect(() => {
    if (!handlers.onCompleted) return

    subscribe<AIDirectorAnalysisCompletedEvent>(
      (event) => {
        if (debug) {
          logger.debug("AI Director Completed Event:", { data: event.payload })
        }
        handlers.onCompleted?.(event.payload)
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_COMPLETED },
      },
    )
  }, [handlers.onCompleted, subscribe, debug])

  // Подписка на события ошибок
  useEffect(() => {
    if (!handlers.onError) return

    subscribe<AIDirectorAnalysisErrorEvent>(
      (event) => {
        if (debug) {
          logger.error("AI Director Error Event:", { data: event.payload })
        }
        handlers.onError?.(event.payload)
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_ERROR },
      },
    )
  }, [handlers.onError, subscribe, debug])

  // Подписка на события завершения стадий
  useEffect(() => {
    if (!handlers.onStageCompleted) return

    subscribe<AIDirectorStageCompletedEvent>(
      (event) => {
        if (debug) {
          logger.debug("AI Director Stage Completed Event:", { data: event.payload })
        }
        handlers.onStageCompleted?.(event.payload)
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_STAGE_COMPLETED },
      },
    )
  }, [handlers.onStageCompleted, subscribe, debug])

  // Подписка на события завершения batch
  useEffect(() => {
    if (!handlers.onBatchCompleted) return

    subscribe<AIDirectorBatchCompletedEvent>(
      (event) => {
        if (debug) {
          logger.debug("AI Director Batch Completed Event:", { data: event.payload })
        }
        handlers.onBatchCompleted?.(event.payload)
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_BATCH_COMPLETED },
      },
    )
  }, [handlers.onBatchCompleted, subscribe, debug])
}

/**
 * Hook для подписки на прогресс конкретного анализа
 *
 * @example
 * ```tsx
 * function AnalysisProgress({ analysisId }: { analysisId: string }) {
 *   useAIDirectorAnalysisProgress(analysisId, (event) => {
 *     console.log(`Progress: ${event.progress * 100}%`)
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useAIDirectorAnalysisProgress(
  analysisId: string,
  onProgress: (event: AIDirectorAnalysisProgressEvent) => void,
  debug = false,
): void {
  const { subscribe } = useDomainEvents({ domain: "ai-services", debug })

  useEffect(() => {
    if (!analysisId) return

    subscribe<AIDirectorAnalysisProgressEvent>(
      (event) => {
        // Фильтруем события только для нашего analysisId
        if (event.payload.analysisId === analysisId) {
          onProgress(event.payload)
        }
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_PROGRESS },
      },
    )
  }, [analysisId, onProgress, subscribe])
}

/**
 * Hook для ожидания завершения конкретного анализа
 *
 * @example
 * ```tsx
 * function AnalysisWaiter({ analysisId }: { analysisId: string }) {
 *   useAIDirectorAnalysisCompleted(analysisId, (event) => {
 *     if (event.success) {
 *       console.log('Analysis completed successfully!')
 *     } else {
 *       console.error('Analysis failed:', event.errors)
 *     }
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useAIDirectorAnalysisCompleted(
  analysisId: string,
  onCompleted: (event: AIDirectorAnalysisCompletedEvent) => void,
  debug = false,
): void {
  const { subscribe } = useDomainEvents({ domain: "ai-services", debug })

  useEffect(() => {
    if (!analysisId) return

    subscribe<AIDirectorAnalysisCompletedEvent>(
      (event) => {
        // Фильтруем события только для нашего analysisId
        if (event.payload.analysisId === analysisId) {
          onCompleted(event.payload)
        }
      },
      {
        filter: { type: DOMAIN_EVENTS.AI_SERVICES.AI_DIRECTOR_ANALYSIS_COMPLETED },
        once: true, // Подписываемся только на одно событие
      },
    )
  }, [analysisId, onCompleted, subscribe])
}
