// AI Services Domain Types
// Centralized types for AI services

// Core AI types
export * from "./ai-intelligence"
export * from "./interfaces"
export * from "./transcription"
export * from "./unified-analysis"

// Machine events from machines directory
export type { ChatMachineEvent } from "../machines/chat-machine"
export type { MontagePlannerEvent } from "../machines/montage-planner-machine"

// Legacy re-exports for backward compatibility
// TODO: Migrate these imports to use unified-analysis.ts
export type {
  AdaptedContent,
  AIConfig,
  GeneratedScript,
  IntelligentContent,
  PlatformId,
  ProcessingError,
  ProcessingStep,
  ScriptGenerationParams,
  ScriptStyle,
} from "@/features/ai-content-intelligence"
export { ContentType, Emotion } from "@/features/ai-content-intelligence"

// Use unified types from unified-analysis.ts instead of features
import { NarrativeType, PaceType, ProcessingStatus, UnifiedContentAnalysis } from "./unified-analysis"
export { NarrativeType, PaceType, ProcessingStatus, UnifiedContentAnalysis }
