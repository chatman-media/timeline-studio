/**
 * AI Services Hooks
 *
 * React hooks для работы с AI Services
 */

export { useUnifiedAnalysis } from "./use-unified-analysis"
export type { UnifiedAnalysisState, UnifiedAnalysisHook } from "./use-unified-analysis"

// AI Director Events Hooks (NEW)
export {
  useAIDirectorEvents,
  useAIDirectorAnalysisProgress,
  useAIDirectorAnalysisCompleted,
} from "./use-ai-director-events"
export type { UseAIDirectorEventsOptions, AIDirectorEventHandlers } from "./use-ai-director-events"
