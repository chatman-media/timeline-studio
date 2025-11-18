/**
 * AI Director Feature - Export Module
 * Comprehensive media analysis orchestrator
 *
 * MIGRATION NOTE: Core types (AIDirectorConfig, ComprehensiveAnalysisResult) moved to @/types/generated/tauri-bindings
 * Event types (AnalysisProgress, AnalysisError) moved to @/domains/ai-services/types/ai-director-events
 */

export type {
  AnalysisError,
  AnalysisProgress,
  HealthCheckResult,
  SystemCapabilities,
} from "@/domains/ai-services/types/ai-director-events"
// AI Director types are not in tauri-bindings yet, using placeholder exports
export type AIDirectorConfig = any
export type ComprehensiveAnalysisResult = any

// Components
export * from "./components/ai-director-chat"
export * from "./components/ai-director-modal"
export * from "./components/analyzer-checkbox-group"
export * from "./components/analyzer-preset-selector"
export * from "./components/analyzer-progress-item"
export * from "./components/file-analysis-progress"
// Hooks
export * from "./hooks"
// Services
export * from "./services/ai-director-machine"
export * from "./services/ai-director-service"
// New progress types
export type {
  AnalysisConfig,
  AnalysisProgressEvent,
  AnalyzerMetadata,
  AnalyzerProgress,
  AnalyzerResult,
  AnalyzerStatus,
  AnalyzerType,
  BatchAnalysisProgress,
  BatchAnalysisStatus,
  FileAnalysisProgress,
  FileAnalysisStatus,
} from "./types/analysis-progress"
// Progress utilities
export {
  ANALYZER_METADATA,
  calculateBatchProgress,
  calculateFileProgress,
  createInitialFileProgress,
  getAnalyzerMetadata,
  getAnalyzersByCategory,
  updateAnalyzerProgress,
} from "./types/analysis-progress"
// Preset types
export type { AnalyzerPreset } from "./types/analyzer-presets"
export {
  createCustomPreset,
  DEFAULT_PRESETS,
  getDefaultPresets,
  getPresetById,
  validatePreset,
} from "./types/analyzer-presets"
