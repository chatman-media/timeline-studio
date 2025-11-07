/**
 * AI Content Intelligence Module
 * Единая точка входа для всех AI функций
 *
 * MIGRATION NOTE: AIIntelligenceOrchestrator removed - use AI Director integration
 * See: @/domains/ai-services/services/unified-orchestrator
 */
export type {
  AIConfig,
  AIProvider,
} from "@/domains/shared/types/ai-tools/ai-config"
export type {
  KeyMoment,
  SceneAnalysis,
  UnifiedContentAnalysis,
} from "@/domains/shared/types/ai-tools/content-analysis"
export type {
  IntelligentContent,
  PipelineProgress,
  ProcessingStatus,
} from "@/domains/shared/types/ai-tools/pipeline"
// ===== Types & Enums =====
// Re-export types that are commonly used by other modules
export type {
  AdaptedContent,
  Platform,
  PlatformId,
} from "@/domains/shared/types/ai-tools/platform-adaptation"
export type {
  GeneratedScript,
  ScriptGenerationParams,
} from "@/domains/shared/types/ai-tools/script-generation"
// ===== Components =====
// Export components individually to avoid circular dependencies
export { AnalysisViewer } from "./components/analysis-viewer"
export { GenerationWizard } from "./components/generation-wizard"
export { PreviewGrid } from "./components/preview-grid"
export { UnifiedDashboard } from "./components/unified-dashboard"
// Dashboard Components
export { ActionPanel } from "./components/unified-dashboard/action-panel"
export { AnalysisResults } from "./components/unified-dashboard/analysis-results"
export { DashboardHeader } from "./components/unified-dashboard/dashboard-header"
export { PipelineStatus } from "./components/unified-dashboard/pipeline-status"
// ===== Hooks =====
export { useAIIntelligence } from "./hooks/use-ai-intelligence"
export { useContentPipeline } from "./hooks/use-content-pipeline"
// MIGRATION: useAIIntelligenceOrchestrator and useAIOrchestrator removed
// Use AI Director hooks instead: useUnifiedAnalysis, useAIDirectorEvents
// ===== Services & Providers =====
export {
  AIIntelligenceContext,
  AIIntelligenceProvider,
  useAIIntelligence as useAIIntelligenceContext,
} from "./services/ai-intelligence-provider"
