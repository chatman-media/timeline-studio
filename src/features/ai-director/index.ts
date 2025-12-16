/**
 * AI Director Feature - Export Module
 * Comprehensive media analysis orchestrator
 *
 * Domain types and services are now in @/domains/ai-director
 */

export type {
  AIDirectorConfig,
  AIDirectorEvent,
  AIDirectorEventCallbacks,
  AIDirectorVideoAnalysisOptions,
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
  UnifiedAudioConfig,
  UseAIDirectorEventsReturn,
  VideoAnalysisResult,
} from "@/domains/ai-director"
// Re-export from AI Director domain
export {
  AI_DIRECTOR_EVENTS,
  AIDirectorService,
  aiDirectorMachine,
  aiDirectorService,
  useAIDirectorEvents,
} from "@/domains/ai-director"

// Components (UI components removed - now using Timeline Analysis tab)

// Hooks (feature-specific hooks, not domain hooks)
export * from "./hooks"

// Progress types
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
  createFileProgressFromResult,
  createInitialFileProgress,
  extractAnalyzersFromResult,
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
