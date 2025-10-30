/**
 * AI Content Intelligence Module
 * Единая точка входа для всех AI функций
 */

export { AIIntelligenceOrchestrator } from "@/domains/ai-services/services/ai-orchestrator"

// ===== Types & Enums =====
// Re-export types that are commonly used by other modules
export type {
  AdaptedContent,
  Platform,
  PlatformId,
} from "@/domains/shared/types/ai-tools/platform-adaptation"

export type {
  AIConfig,
  AIProvider,
  GeneratedScript,
  ScriptGenerationParams,
} from "@/domains/shared/types/ai-tools/script-generation"

export type {
  UnifiedContentAnalysis,
  KeyMoment,
  SceneAnalysis,
} from "@/domains/shared/types/ai-tools/content-analysis"

export type {
  IntelligentContent,
  PipelineProgress,
  ProcessingStatus,
} from "@/domains/shared/types/ai-tools/pipeline"
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
export { useAIIntelligenceOrchestrator } from "./hooks/use-ai-intelligence-orchestrator"
export { useAIOrchestrator } from "./hooks/use-ai-orchestrator"
export { useContentPipeline } from "./hooks/use-content-pipeline"
// ===== Services & Providers =====
export {
  AIIntelligenceContext,
  AIIntelligenceProvider,
  useAIIntelligence as useAIIntelligenceContext,
} from "./services/ai-intelligence-provider"
