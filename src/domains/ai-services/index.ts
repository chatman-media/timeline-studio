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
export { ContentAnalysisService } from "./services/content"
// Services
export { ContentClassifier } from "./services/content-classifier"
// Media Analysis Services
export * from "./services/media-analysis"

// Platform Optimization Services
export * from "./services/platform-optimization"
export type {
  AdvancedSceneAnalysis,
  AudioCharacteristics,
  IdentifiedPersonInScene,
  PersonAppearanceInScene,
  SceneAnalysis as SceneAnalysisData,
  SceneDetectionOptions,
  SceneGroup,
  SceneTransition,
  VisualElement as SceneVisualElement,
} from "./services/scene-analysis"
// Scene Analysis Services (migrated from ai-content-intelligence)
export { SceneAnalysisEngine } from "./services/scene-analysis"
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
export type {
  Audience,
  ClassificationResult,
  ContentClassification,
  ContentType,
  Emotion,
  EmotionalTone,
  Genre,
  SceneAnalysis,
} from "./types"
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
