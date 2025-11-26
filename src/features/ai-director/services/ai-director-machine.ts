/**
 * AI Director XState Machine
 * Re-exports from @/domains/ai-director
 *
 * MIGRATION NOTE:
 * This file previously contained the XState machine implementation with direct invoke() calls.
 * The machine has been moved to the ai-director domain to follow clean architecture principles.
 *
 * Import from:
 * - "@/domains/ai-director" for production code
 * - "./ai-director-machine" for backwards compatibility (this file)
 */

// Re-export types for backwards compatibility
export type {
  AIDirectorConfig,
  AIDirectorEvent,
  AnalysisError,
  AnalysisProgress,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  HealthCheckResult,
  SystemCapabilities,
} from "@/domains/ai-director"
// Re-export machine from domain
export { aiDirectorMachine } from "@/domains/ai-director"
