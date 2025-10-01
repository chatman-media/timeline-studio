/**
 * Montage Planning Services
 * Smart montage planning with AI-powered content analysis and optimization
 */

// Re-export types that services use
export type {
  AnalysisOptions,
  AudioAnalysis,
  Fragment,
  MomentScore,
  MontagePlan,
  MontageQualityAnalysis,
  PlannedClip,
  RhythmPattern,
  Sequence,
  TempoChange,
  TransitionPlan,
  VideoAnalysis,
  VideoCompositionAnalysis,
} from "../../../../features/montage-planner/types/index"
export { ContentAnalyzer } from "./content-analyzer"
export { MomentDetector } from "./moment-detector"
export { getMontagePlannerAI } from "./montage-planner-ai-integration"
export { PlanGenerator } from "./plan-generator"
export { RhythmCalculator } from "./rhythm-calculator"
export { applyPlanToTimeline, createMarkersFromPlan } from "./timeline-integration-service"
