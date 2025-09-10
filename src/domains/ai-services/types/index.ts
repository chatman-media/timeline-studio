// AI Services Domain Types
// Consolidated from features/ai-content-intelligence/shared/types

// Re-export all types from ai-content-intelligence for convenience
export type {
  AdaptedContent,
  AIConfig,
  GeneratedScript,
  IntelligentContent,
  NarrativeType,
  PaceType,
  PlatformId,
  ProcessingError,
  ProcessingStatus,
  ProcessingStep,
  ScriptGenerationParams,
  ScriptStyle,
  UnifiedContentAnalysis,
} from "@/features/ai-content-intelligence"
export { ContentType, Emotion } from "@/features/ai-content-intelligence"
// Core AI types (primary exports)
export * from "./ai-intelligence"
export * from "./montage-planner"
