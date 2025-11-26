/**
 * AI Director Feature - Export Module
 * Comprehensive media analysis orchestrator
 *
 * MIGRATION NOTE: Core types (AIDirectorConfig, ComprehensiveAnalysisResult) moved to @/types/generated/tauri-bindings
 * Event types (AnalysisProgress, AnalysisError) moved to @/domains/ai-services/types/ai-director-events
 */

export type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  AIDirectorVideoAnalysisOptions,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  SystemCapabilities,
  UnifiedAudioConfig,
} from "@/domains/ai-services"
// AI Director Service and types are now re-exported from domain
export { AIDirectorService, aiDirectorService } from "@/domains/ai-services"
export type {
  AnalysisError,
  AnalysisProgress,
} from "@/domains/ai-services/types/ai-director-events"
// Components
export * from "./components/ai-director-chat"
export * from "./components/ai-director-dashboard"
export * from "./components/ai-director-modal"
export * from "./components/analyzer-checkbox-group"
export * from "./components/analyzer-preset-selector"
export * from "./components/analyzer-progress-item"
export * from "./components/file-analysis-progress"
export * from "./components/montage-plan-editor"
export * from "./components/montage-plan-preview"
export * from "./components/montage-template-selector"
// Hooks
export * from "./hooks"
// Services
export * from "./services/ai-director-machine"
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
// Dashboard types
export type {
  AgentStatus,
  AgentType,
  AIAgent,
  DashboardState,
  DashboardStats,
  QuickAction,
  WorkflowTemplate,
} from "./types/dashboard"
export {
  AGENT_TYPE_DESCRIPTIONS,
  AGENT_TYPE_ICONS,
  AGENT_TYPE_NAMES,
  BUILT_IN_WORKFLOWS,
} from "./types/dashboard"
// Montage plan types
export type {
  MontageClip,
  MontageCreationState,
  MontageCreationStatus,
  MontageMusicSettings,
  MontagePlan,
  MontageRequest,
  MontageStyle,
  MontageTextSettings,
  MontageTransition,
  TransitionType,
} from "./types/montage-plan"
// Montage template types
export type {
  ClipSelectionRules,
  MontageTemplate,
  MontageTemplateParameters,
  TransitionRules,
} from "./types/montage-templates"
export {
  BUILT_IN_TEMPLATES,
  getAllCategories,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplatesByTags,
} from "./types/montage-templates"
// Montage plan utilities
export {
  exportMontagePlan,
  exportMultiplePlans,
  exportPlanAsTemplate,
  importMontagePlan,
  importMultiplePlans,
} from "./utils/montage-plan-io"
export { parseMontagePlanFromAI, validateMontagePlan } from "./utils/montage-plan-parser"
