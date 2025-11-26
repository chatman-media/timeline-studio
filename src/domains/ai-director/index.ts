/**
 * AI Director Domain
 *
 * Centralized AI Director functionality:
 * - XState machine for state management
 * - Services for business logic
 * - Tauri commands for backend communication
 * - Hooks for React integration
 * - Types for type safety
 */

export type { AIDirectorEventCallbacks, UseAIDirectorEventsReturn } from "./hooks"
// Hooks
export { AI_DIRECTOR_EVENTS, useAIDirectorEvents } from "./hooks"
// Machines
export { aiDirectorMachine } from "./machines"
// Services
export { AIDirectorService, aiDirectorService } from "./services"
export type { AIDirectorVideoAnalysisOptions, UnifiedAudioConfig } from "./tauri"
// Tauri Commands (for advanced usage)
export {
  aiDirectorAnalyzeBatch,
  aiDirectorAnalyzeComprehensive,
  aiDirectorAnalyzeQuick,
  aiDirectorGetCapabilities,
  aiDirectorGetDefaultConfig,
  aiDirectorHealthCheck,
  aiDirectorValidateConfig,
  analyzeVideoComprehensive,
  unifiedAudioAnalyzeBatch,
  unifiedAudioAnalyzeComprehensive,
  unifiedAudioAnalyzeQuick,
  unifiedAudioGetCapabilities,
} from "./tauri"

// Types
export type {
  AIDirectorConfig,
  AIDirectorEvent,
  AnalysisCompleted,
  AnalysisError,
  AnalysisProgress,
  AnalysisStageCompleted,
  AnalysisStatus,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  FaceRecognitionResult,
  HealthCheckResult,
  ObjectDetectionResult,
  PerformanceMode,
  SceneAnalysisResult,
  SystemCapabilities,
  UnifiedAudioAnalysisResult,
  VideoAnalysisResult,
} from "./types"
