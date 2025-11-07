/**
 * AI Services Domain
 *
 * Централизованное место для всех AI сервисов анализа и обработки медиа
 */

// Unified Orchestrator (NEW - AI Director Integration)
export { UnifiedOrchestrator, unifiedOrchestrator } from "./services/unified-orchestrator"
export type {
  AnalysisWorkflow,
  BatchAnalysisWorkflow,
  OrchestratorOptions,
} from "./services/unified-orchestrator"

// AI Event Bridge (NEW - Tauri ↔ TypeScript Event Sync)
export { AIEventBridge, aiEventBridge, TAURI_EVENTS } from "./services/ai-event-bridge"

// Providers
export * from "./providers"

// Mappers
export {
  mapComprehensiveAnalysisToUnified,
  mapMontageAnalysisToUnified,
  isComprehensiveAnalysisResult,
  isMontageAnalysisResult,
} from "./mappers/ai-director-mapper"
export type { UnifiedContentAnalysis } from "./mappers/ai-director-mapper"

// Hooks
export * from "./hooks"

// State Machines
export {
  // AI Intelligence V2 (NEW - with AI Director integration)
  aiIntelligenceMachineV2,
  type AIIntelligenceContextV2,
  type AIIntelligenceEventV2,
  type AIIntelligenceMachineV2,
  type AIIntelligenceSnapshotV2,
  // Montage Planner
  montagePlannerMachine,
  type MontagePlannerContext,
  type MontagePlannerEvent,
  type MontagePlannerMachine,
  // Chat
  chatMachine,
  type ChatMachine,
  type ChatMachineContext,
  type ChatMachineEvent,
} from "./machines"

// Factories
export {
  createMediaAnalysisFactory,
  getMediaAnalysisFactory,
  MediaAnalysisFactoryImpl,
} from "./factories/media-analysis-factory"
export { ContentAnalysisService } from "./services/content"
// Services
export { ContentClassifier } from "./services/content-classifier"
// Media Analysis Services
export * from "./services/media-analysis"

// Platform Optimization Services
export * from "./services/platform-optimization"
export type {
  GeneratedScript,
  NarrativeStructure,
  NarrativeType,
  ScriptAlternative,
  ScriptGenerationConfig,
  ScriptGenerationContext,
  ScriptGenerationParams,
  ScriptGenerationResult,
  ScriptImprovement,
  ScriptQuality,
  ScriptScene,
} from "./services/script-generation"
// Script Generation Services (migrated from ai-content-intelligence)
export { DialogueGenerator, ScriptGenerationEngine, TemplateEngine } from "./services/script-generation"
// Vision Services
export * from "./services/vision"
// Workflow Automation
export * from "./services/workflow-automation"
// Types - content-analysis types are now in main types export
// Re-export specific types for convenience
export type {
  AudioAnalysisResult,
  ColorAnalysis,
  CompositionAnalysis,
  ContentAnalysisOptions,
  ContentAnalysisResult,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  FrameAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaAnalysisFactory,
  MediaFile,
  MotionAnalysisResult,
  QualityAnalysisResult,
  Scene,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoAnalysisOptions,
  VideoAnalysisResult,
  VideoMetadata,
} from "./types/interfaces"
export * from "./types/interfaces"
export * from "./types/media"
export * from "./types/orchestration"
