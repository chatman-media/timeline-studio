// AI Services Domain Types
// Centralized types for AI services

// Export SpeechDetection and TextDetection from shared types
export type { SpeechDetection, TextDetection } from "../../shared/types/ai-tools/content-analysis"
// Machine events from machines directory
export type { ChatMachineEvent } from "../machines/chat-machine"
export type { MontagePlannerEvent } from "../machines/montage-planner-machine"
export * from "./ai-config"
// Export specific types needed by provider
export type { AIIntelligenceContext, AIIntelligenceEvent, AIServicesDomainConfig } from "./ai-intelligence"
// Export ContentType specifically from local content-analysis module
export type { ContentClassification, ContentType } from "./content-analysis"
// Context types for Timeline Studio AI integration
export type {
  AIBrowserContext,
  AICommand,
  AICommandResult,
  AICommandType,
  AIPlayerContext,
  AIResourcesContext,
  AITimelineContext,
  ClipPlacementStrategy,
  ContentStoryAnalysis,
  EnhancementSettings,
  MediaAnalysisCriteria,
  ProjectCreationSettings,
  ResourceAdditionCriteria,
  TimelineStudioContext,
  UserPreferencesContext,
} from "./context"
// Other core types
// Other core types already exported above via specific imports
// Export MediaFile from interfaces as the canonical one
// Export everything from interfaces except MediaFile to avoid conflict
export type {
  AudioAnalysisResult,
  BoundingBox,
  CompositionAnalysis,
  ContentAnalysisResult,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  FrameAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  Line2D,
  MediaFile,
  MotionAnalysisResult,
  MotionVector,
  Point2D,
  QualityAnalysisResult,
  Scene,
  SceneDetectionResult,
  SilenceDetectionResult,
  SilentSegment,
  VideoAnalysisResult,
  VideoMetadata,
} from "./interfaces"
// Core AI types - export first to avoid circular dependencies
export * from "./platform"
export * from "./processing"
export * from "./script"
export * from "./transcription"
export * from "./unified-analysis"
