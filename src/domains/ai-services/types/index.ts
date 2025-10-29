// AI Services Domain Types
// Centralized types for AI services

// Core AI types - export first to avoid circular dependencies
export * from "./platform"
export * from "./processing"
export * from "./ai-config"
export * from "./script"

// Other core types
export * from "./ai-intelligence"
// Export everything from interfaces except MediaFile to avoid conflict
export {
  type VideoMetadata,
  type AudioAnalysisResult,
  type VideoAnalysisResult,
  type Scene,
  type QualityAnalysisResult,
  type SilenceDetectionResult,
  type SilentSegment,
  type MotionAnalysisResult,
  type MotionVector,
  type FrameAnalysis,
  type DetectedObject,
  type BoundingBox,
  type ExtractedText,
  type CompositionAnalysis,
  type Point2D,
  type Line2D,
  type FrameAnalysisResult,
  type SceneDetectionResult,
  type ContentAnalysisResult,
  type IFFmpegAnalysisService,
  type IVisionService,
  type IContentAnalysisService
} from "./interfaces"
// Export MediaFile from interfaces as the canonical one
export type { MediaFile } from "./interfaces"
export * from "./transcription"
export * from "./unified-analysis"

// Machine events from machines directory
export type { ChatMachineEvent } from "../machines/chat-machine"
export type { MontagePlannerEvent } from "../machines/montage-planner-machine"