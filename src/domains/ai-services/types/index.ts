/**
 * AI Services Domain - Type Exports
 */

export type {
  AIOrchestatorContext,
  AIOrchestatorEvent,
  ServiceInfo,
} from "../machines/ai-orchestrator-machine"
// Machine Types
export type {
  ChatMachineContext,
  ChatMachineEvent,
} from "../machines/chat-machine"
export type {
  MontagePlannerContext,
  MontagePlannerEvent,
} from "../machines/montage-planner-machine"
// AI Intelligence types
export type {
  AIIntelligenceContext,
  AIIntelligenceEvent,
  ContentInsights,
  KeyMoment,
  LegacyAIConfig,
  LegacyIntelligentContent,
  LegacyUnifiedContentAnalysis,
  MediaFile as AIMediaFile,
  ProcessedMoment,
  SceneInfo,
} from "./ai-intelligence"
export { KeyMomentType } from "./ai-intelligence"
// Chat types
export type {
  Agent,
  AgentId,
  AIService,
  ChatListItem,
  ChatMessage,
  ChatSession,
  ChatStorageService,
  ChatTimelineContext,
  LegacyChatListItem,
  LegacyChatMessage,
  LegacyChatSession,
} from "./chat"
// Montage Planner types
export type {
  AnalysisOptions,
  AnalysisProgress,
  AudioAnalysis,
  Fragment,
  FragmentAnalysis,
  MediaFile,
  MomentScore,
  MontagePlan,
  Person,
  PlanGenerationOptions,
  PlanStatistics,
  PlanValidation,
  Transition,
  VideoAnalysis,
  VideoEffect,
} from "./montage-planner"
export { AnalysisPhase } from "./montage-planner"

// Domain-specific types will be added here as we migrate more features
export interface AIServicesDomainConfig {
  chatEnabled: boolean
  intelligenceEnabled: boolean
  montagePlannerEnabled: boolean
  recognitionEnabled: boolean
}

export interface AIServicesDomainContext {
  config: AIServicesDomainConfig
  activeServices: string[]
  lastError?: string
}
