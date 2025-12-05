/**
 * AI Services Domain
 *
 * Централизованное место для всех AI сервисов анализа и обработки медиа
 */

// Factories
export {
  createMediaAnalysisFactory,
  getMediaAnalysisFactory,
  MediaAnalysisFactoryImpl,
} from "./factories/media-analysis-factory"
// Hooks
export * from "./hooks"
// State Machines
export {
  type AIIntelligenceContext,
  type AIIntelligenceEvent,
  type AIIntelligenceMachine,
  type AIIntelligenceSnapshot,
  // AI Intelligence (with AI Director integration)
  aiIntelligenceMachine,
  type ChatMachine,
  type ChatMachineContext,
  type ChatMachineEvent,
  // Chat
  chatMachine,
  type MontagePlannerContext,
  type MontagePlannerEvent,
  type MontagePlannerMachine,
  // Montage Planner
  montagePlannerMachine,
} from "./machines"
export type { UnifiedContentAnalysis } from "./mappers/ai-director-mapper"
// Mappers
export {
  isComprehensiveAnalysisResult,
  isMontageAnalysisResult,
  mapComprehensiveAnalysisToUnified,
  mapMontageAnalysisToUnified,
} from "./mappers/ai-director-mapper"
// Providers (for App Layer)
export { ChatProvider, MCPProvider } from "./providers"

export type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  AIDirectorVideoAnalysisOptions,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  SystemCapabilities,
  UnifiedAudioConfig,
} from "./services/ai-director"
// AI Director Service (NEW - Unified comprehensive analysis)
export { AIDirectorService, aiDirectorService } from "./services/ai-director"
// AI Event Bridge (NEW - Tauri ↔ TypeScript Event Sync)
export { AIEventBridge, aiEventBridge, TAURI_EVENTS } from "./services/ai-event-bridge"
export type {
  AnalysisMetadata,
  SaveAnalysisOptions,
  StorageResult,
} from "./services/analysis-storage-service"
// Analysis Storage Service (NEW - Persistent storage for AI analysis results)
export { AnalysisStorageService, analysisStorageService } from "./services/analysis-storage-service"
export { ContentAnalysisService } from "./services/content"
// Services
// export { ContentClassifier } from "./services/content-classifier" // ⚠️ Deprecated: Migrated to Rust backend (AI Director)
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
export type {
  AnalysisWorkflow,
  BatchAnalysisWorkflow,
  OrchestratorOptions,
} from "./services/unified-orchestrator"
// Unified Orchestrator (NEW - AI Director Integration)
export { UnifiedOrchestrator, unifiedOrchestrator } from "./services/unified-orchestrator"
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
